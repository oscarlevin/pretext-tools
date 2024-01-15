import * as vscode from "vscode";
import * as fs from "fs";
import { _context } from "./extension";
import { elementAttributes, elementChildren } from "./constants";

function readJsonFile(relativePath: string): any {
  try {
    const absolutePath = _context.asAbsolutePath(relativePath);
    const data = fs.readFileSync(absolutePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file from disk: ${error}`);
  }
}

function getCurrentTag(document: vscode.TextDocument, position: vscode.Position) {
    const textUntilPosition = document?.getText(
      new vscode.Range(new vscode.Position(0, 0), position)
    );
    const openedTags = (
      textUntilPosition?.match(/<(\w)+(?![^>]*\/>)/g) || []
    ).map((tag) => tag.slice(1));
    const closedTags = (textUntilPosition?.match(/<\/\w+/g) || []).map(
      (tag) => tag.slice(2)
    );
    const unclosedTags = openedTags.filter(
      (tag) => 
        openedTags.filter(x => x === tag).length > closedTags.filter(x => x === tag).length
    );
    const currentTag = unclosedTags[unclosedTags.length - 1];
    console.log("Current XML Element: ", currentTag);
    return currentTag;
}

type Snippet = {
  prefix: string;
  body: string;
  description: string;
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
  console.log("getSnippetCompletionItems");
  let completionItems: vscode.CompletionItem[] = [];
  for (let [key, value] of Object.entries(snippets)) {
    if (trigger === "@") {
      if (!elementChildren[node].attributes.includes(value.prefix.slice(1))) {
        continue;
      }
    } else if (trigger === "<") {
      if (!elementChildren[node].elements.includes(value.prefix.slice(1,-1))) {
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
    snippetCompletion.sortText = key;
    completionItems.push(snippetCompletion);
  }
  return completionItems;
}

async function provideParagraphCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext
): Promise<vscode.CompletionItem[] | undefined> {
  const lineEmpty = document.lineAt(position.line).text.trim() === "<";
  if (lineEmpty) {
    return undefined;
  }
  console.log("line not empty:", document.lineAt(position.line).text.trim());
  const m = new vscode.CompletionItem("<m>", vscode.CompletionItemKind.Field);
  m.insertText = new vscode.SnippetString("<m>$1</m>$0");
  m.sortText = "2";
  m.documentation = "Math expression";
  m.detail = "PreTeXt math expression";
  m.range = new vscode.Range(position.translate(0, -1), position);
  const em = new vscode.CompletionItem("<em>", vscode.CompletionItemKind.Field);
  em.insertText = new vscode.SnippetString("<em>$1</em>$0");
  em.sortText = "1";
  em.documentation = "Emphasized text";
  em.detail = "PreTeXt emphasized text";
  em.range = new vscode.Range(position.translate(0, -1), position);
  return [m, em];
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
  const attributeSnippets = readJsonFile("snippets/pretext-attributes.json");
  const linePrefix = document
    .lineAt(position.line)
    .text.slice(0, position.character);
  const match = linePrefix.match(/<[^>/]+$/);
  console.log("match: ", match);
  if (!match) {
    return undefined;
  }
  const element = match[0].slice(1, match[0].indexOf(" "));
  console.log("element: ", element);
  const attributeCompletionItems = getSnippetCompletionItems(
    attributeSnippets,
    vscode.CompletionItemKind.Keyword,
    element,
    document,
    position,
    "@"
  );
  return attributeCompletionItems;
}

async function elementCompletions(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext
) {
  const currentTag = getCurrentTag(document, position);
  const elementSnippets = readJsonFile("snippets/pretext-elements.json");
  // const prevLine = document.lineAt(position.line - 1).text.trim();
  // if (
  //   (prevLine.startsWith("<") && prevLine.endsWith(">")) ||
  //   prevLine.length === 0
  // ) {
  //   return undefined;
  // }
  const blockCompletionItems = getSnippetCompletionItems(
    elementSnippets,
    vscode.CompletionItemKind.Keyword,
    currentTag,
    document,
    position,
    "<"
  );
  return blockCompletionItems;
}

// async function inlineCompletions(
//   document: vscode.TextDocument,
//   position: vscode.Position,
//   token: vscode.CancellationToken,
//   context: vscode.CompletionContext
// ) {
//   const inlineSnippets = readJsonFile("snippets/pretext-inline.json");
//   // Condition under which to not provide completions
//   const lineEmpty = document.lineAt(position.line).text.trim().length <= 1;
//   if (lineEmpty) {
//     return undefined;
//   }
//   const inlineCompletionItems = getSnippetCompletionItems(
//     inlineSnippets,
//     vscode.CompletionItemKind.Keyword,
//     " ",
//     document,
//     position,
//     "<"
//   );
//   return inlineCompletionItems;
// }

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
    // inlineProvider
  );
  console.log("Activated completion provider");
}
