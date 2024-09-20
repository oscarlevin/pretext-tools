import * as vscode from "vscode";
import * as fs from "fs";
import { _context } from "./extension";
// import { labels } from "./extension";
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

/**
  Finds the current node of the curser by comparing all tags above the curser to the open tags above the curser.
 */
function getCurrentTag(
  document: vscode.TextDocument,
  position: vscode.Position
): string | undefined {
  const textUntilPosition = document?.getText(
    new vscode.Range(new vscode.Position(0, 0), position)
  );
  // Get all open and close tags from the text until the current position.
  const allTags = (
    textUntilPosition?.match(/<(\w)+(?![^>]*\/>)|<\/\w+/g) || []
  ).map((tag) => tag.slice(1));
  const openedTags = (
    textUntilPosition?.match(/<(\w)+(?![^>]*\/>)/g) || []
  ).map((tag) => tag.slice(1));
  const closedTags = (textUntilPosition?.match(/<\/\w+/g) || []).map((tag) =>
    tag.slice(2)
  );

  // Now walk through list of all tags, creating a stack of open tags and removing closed tags from the stack.
  let openTagStack: string[] = [];
  for (let tag of allTags) {
    if (tag.startsWith("/")) {
      const lastOpenTag = openTagStack.pop();
      if (lastOpenTag !== tag.slice(1)) {
        console.error(
          `Error: Found closing tag ${tag} without matching opening tag.`
        );
      }
    } else {
      openTagStack.push(tag);
    }
  }

  const currentTag = openTagStack.pop();
  console.log("Current XML Element: ", currentTag);
  return currentTag;
}

// Types for snippets
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

/**
 * Reads a snippet file and returns a list of completion items.
 * @param snippets - the snippets to read
 * @param kind - the kind of completion item
 * @param node - the current (open) node/element
 * @param document - the current document
 * @param position - the current position of the cursor
 */
async function getSnippetCompletionItems(
  snippets: Snippets,
  kind: vscode.CompletionItemKind,
  node: string | undefined,
  document: vscode.TextDocument,
  position: vscode.Position,
  trigger: string
): Promise<vscode.CompletionItem[]> {
  let completionItems: vscode.CompletionItem[] = [];
  for (let [key, value] of Object.entries(snippets)) {
    if (node) {
      if (trigger === "@") {
        if (
          node in elementChildren &&
          !elementChildren[node].attributes.includes(key.split(" ")[0])
        ) {
          continue;
        }
      } else if (trigger === "<") {
        if (
          node in elementChildren &&
          !elementChildren[node].elements.includes(key.split(" ")[0])
        ) {
          continue;
        }
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
  // Also add a closing tag for the current node, since we have turned off this feature from redhat.vscode-xml.
  if (node) {
    const closeTagCompletion = new vscode.CompletionItem(`/${node}>`, kind);
    closeTagCompletion.insertText = new vscode.SnippetString(`/${node}>`);
    closeTagCompletion.documentation = `Close the ${node} tag`;
    closeTagCompletion.detail = `Close the ${node} tag`;
    completionItems.push(closeTagCompletion);
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
  let elementSnippets: Snippets;
  if (document.getText().trim().length < 10) {
    elementSnippets = readJsonFile("snippets/pretext-templates.json");
  } else if (currentLine.length > 1) {
    elementSnippets = readJsonFile("snippets/pretext-inline.json");
  } else {
    elementSnippets = readJsonFile("snippets/pretext-elements.json");
    const prevLineP = document.lineAt(position.line - 1).text.trim() === "<p>";
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



// async function refCompletions(
//   document: vscode.TextDocument,
//   position: vscode.Position,
//   token: vscode.CancellationToken,
//   context: vscode.CompletionContext
// ) {
//   // const refs = readJsonFile("snippets/pretext-attributes.json");
//   const linePrefix = document
//     .lineAt(position.line)
//     .text.slice(0, position.character);
//   let completionItems: vscode.CompletionItem[] = [];
//   if (linePrefix.match(/<xref ref=\"$/)) {
//     for (let [reference, parent] of labels) {
//       const refCompletion = new vscode.CompletionItem(
//         reference,
//         vscode.CompletionItemKind.Reference
//       );
//       refCompletion.insertText = new vscode.SnippetString(reference);
//       refCompletion.documentation = "(a " + parent + ")";
//       refCompletion.detail = "(reference to " + parent + ")";
//       refCompletion.sortText = "0" + reference;
//       completionItems.push(refCompletion);
//     }
//   } else if (linePrefix.match(/<xi:include href="$/)) {
//     const files = await vscode.workspace.findFiles("**/source/**");
//     // const currentFile = vscode.workspace.asRelativePath(document.fileName);
//     // console.log(currentFile);
//     // get relative paths:
//     for (let file of files) {
//       let relativePath = vscode.workspace
//         .asRelativePath(file)
//         .replace("source/", "");
//       console.log(relativePath);
//       const refCompletion = new vscode.CompletionItem(
//         relativePath,
//         vscode.CompletionItemKind.Reference
//       );
//       refCompletion.insertText = new vscode.SnippetString(relativePath);
//       completionItems.push(refCompletion);
//     }
//   } else {
//     return undefined;
//   }
//   return completionItems;
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

  // const refProvider = vscode.languages.registerCompletionItemProvider(
  //   "pretext",
  //   { provideCompletionItems: refCompletions },
  //   '"'
  // );

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
    // refProvider
    // inlineProvider
  );
  console.log("Activated completion provider");
}
