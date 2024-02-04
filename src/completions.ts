import * as vscode from "vscode";
import * as fs from "fs";
import { _context } from "./extension";
import { labels } from "./extension";
import { elementChildren } from "./constants";

function readJsonFile(relativePath: string): any {
  try {
    const absolutePath = _context.asAbsolutePath(relativePath);
    const data = fs.readFileSync(absolutePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file from disk: ${error}`);
  }
}

function getCurrentTag(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const textUntilPosition = document?.getText(
    new vscode.Range(new vscode.Position(0, 0), position)
  );
  const openedTags = (
    textUntilPosition?.match(/<(\w)+(?![^>]*\/>)/g) || []
  ).map((tag) => tag.slice(1));
  const closedTags = (textUntilPosition?.match(/<\/\w+/g) || []).map((tag) =>
    tag.slice(2)
  );

  // Cycle through list of closed tags and remove each from the end of the list of open tags.
  // What is left will be the unclosed tags, the last of which will be our current element.
  while (closedTags.length > 0) {
    const lastClosedTag = closedTags.pop() || "";
    const index = openedTags.lastIndexOf(lastClosedTag);
    if (index > -1) {
      openedTags.splice(index, 1);
    }
  }
  const unclosedTags = openedTags;
  const currentTag = unclosedTags[unclosedTags.length - 1];
  console.log("Current XML Element: ", currentTag);
  return currentTag;
}

type Snippet = {
  prefix: string;
  body: string;
  description?: string;
  sort?: string;
  retrigger?: boolean;
};

type Snippets = {
  [key: string]: Snippet;
};

async function getSnippetCompletionItems(
  snippets: Snippets,
  kind: vscode.CompletionItemKind,
  node: string,
  document: vscode.TextDocument,
  position: vscode.Position,
  trigger: string
): Promise<vscode.CompletionItem[]> {
  let completionItems: vscode.CompletionItem[] = [];
  for (let [key, value] of Object.entries(snippets)) {
    if (trigger === "@") {
      if (
        node in elementChildren &&
        !elementChildren[node].attributes.includes(value.prefix.slice(1))
      ) {
        continue;
      }
    } else if (trigger === "<") {
      if (
        node in elementChildren &&
        !elementChildren[node].elements.includes(value.prefix.slice(1, -1))
      ) {
        continue;
      }
    }
    const snippetCompletion = new vscode.CompletionItem(value.prefix, kind);
    // remove preceding trigger character if present:
    if (
      document.getText(
        new vscode.Range(position.translate(0, -1), position)
      ) === trigger
    ) {
      snippetCompletion.range = new vscode.Range(
        position.translate(0, -1),
        position
      );
    }
    snippetCompletion.insertText = new vscode.SnippetString(value.body);
    snippetCompletion.documentation = value.description;
    snippetCompletion.detail = value.description;
    snippetCompletion.sortText = value.sort ? value.sort + key : key;
    snippetCompletion.filterText = value.prefix;
    if (value.retrigger) {
      snippetCompletion.command = {
        title: "Suggest",
        command: "editor.action.triggerSuggest",
      };
    }
    completionItems.push(snippetCompletion);
  }
  return completionItems;
}

/**
 * Provide completions for attributes in PreTeXt.  We check whether the cursor is inside an open tag, and if so, we provide completions for attributes.
 */
async function attributeCompletions(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext
) {
  // First, stop completions if the previous character is a double quote.
  const charBefore = document.getText(
    new vscode.Range(position.translate(0, -1), position)
  );
  if (charBefore === '"') {
    return undefined;
  }
  const attributeSnippets = readJsonFile("snippets/pretext-attributes.json");
  const linePrefix = document
    .lineAt(position.line)
    .text.slice(0, position.character);
  const match = linePrefix.match(/<[^>/]+$/);
  if (!match) {
    return undefined;
  }
  const element = match[0].slice(1, match[0].indexOf(" "));
  const attributeCompletionItems = getSnippetCompletionItems(
    attributeSnippets,
    vscode.CompletionItemKind.Enum,
    element,
    document,
    position,
    "@"
  );
  return attributeCompletionItems;
}

/**
 * Provide completions for elements in PreTeXt.  We check whether the cursor is inside an open tag, and if so, we provide completions for elements.
 * @param document - the current document
 * @param position - the current position of the cursor
 * @param token - the cancellation token
 * @param context - the completion context
 * @returns - a list of completion items
 */
async function elementCompletions(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext
) {
  // First, stop completions if the previous character is a double quote.
  const charBefore = document.getText(
    new vscode.Range(position.translate(0, -1), position)
  );
  if (charBefore === '"') {
    return undefined;
  }
  // Now check the length of the current line and whether the previous line is an plain <p> tag.  If the current line is not empty, or it is but the previous started a <p> we show inline completions.  Otherwise we show element/block completions.
  const currentLine = document.lineAt(position.line).text.trim();
  const prevLineP = document.lineAt(position.line - 1).text.trim() === "<p>";
  let elementSnippets: Snippets;
  if (currentLine.length > 1) {
    elementSnippets = readJsonFile("snippets/pretext-inline.json");
  } else {
    elementSnippets = readJsonFile("snippets/pretext-elements.json");
    if (prevLineP) {
      elementSnippets = {
        ...elementSnippets,
        ...readJsonFile("snippets/pretext-inline.json"),
      };
    }
  }
  const currentTag = getCurrentTag(document, position);
  const elementCompletionItems = getSnippetCompletionItems(
    elementSnippets,
    vscode.CompletionItemKind.Class,
    currentTag,
    document,
    position,
    "<"
  );
  return elementCompletionItems;
}

async function refCompletions(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext
) {
  // const refs = readJsonFile("snippets/pretext-attributes.json");
  const linePrefix = document
    .lineAt(position.line)
    .text.slice(0, position.character);
  const match = linePrefix.match(/<xref ref=\"$/);
  if (!match) {
    return undefined;
  }
  let completionItems: vscode.CompletionItem[] = [];
  for (let [reference, parent] of labels) {
    const refCompletion = new vscode.CompletionItem(
      reference,
      vscode.CompletionItemKind.Reference
    );
    refCompletion.insertText = new vscode.SnippetString(reference);
    refCompletion.documentation = "(a " + parent + ")";
    refCompletion.detail = "(reference to " + parent + ")";
    refCompletion.sortText = "0" + reference;
    completionItems.push(refCompletion);
  }
  return completionItems;
}

/**
 * Activate completions for PreTeXt
 * @param context - the extension context
 */
export function activateCompletions(context: vscode.ExtensionContext) {
  // const textSnippets = readJsonFile('snippets/pretext-text.json');
  const attributeProvider = vscode.languages.registerCompletionItemProvider(
    "pretext",
    { provideCompletionItems: attributeCompletions },
    "@"
  );

  const refProvider = vscode.languages.registerCompletionItemProvider(
    "pretext",
    { provideCompletionItems: refCompletions },
    '"'
  );

  const elementProvider = vscode.languages.registerCompletionItemProvider(
    "pretext",
    { provideCompletionItems: elementCompletions },
    "<"
  );
  // const inlineProvider = vscode.languages.registerCompletionItemProvider(
  //   "pretext",
  //   { provideCompletionItems: inlineCompletions },
  //   "<"
  // );

  context.subscriptions.push(
    elementProvider,
    attributeProvider,
    refProvider
    // inlineProvider
  );
  console.log("Activated completion provider");
}
