import * as vscode from "vscode";
import * as fs from 'fs';
import { _context } from "./extension";

function readJsonFile(relativePath: string): any {
  try {
    const absolutePath = _context.asAbsolutePath(relativePath);
    const data = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file from disk: ${error}`);
  }
}

type Snippet = {
  prefix: string;
  body: string;
  description: string;
};

type Snippets = {
  [key: string]: Snippet;
};

async function getSnippetCompletionItems(snippets: Snippets, kind: vscode.CompletionItemKind, document: vscode.TextDocument, position: vscode.Position, trigger: string): Promise<vscode.CompletionItem[]>{
  console.log("getSnippetCompletionItems");
  let completionItems: vscode.CompletionItem[] = [];
  for (let [key, value] of Object.entries(snippets)) {
    const snippetCompletion = new vscode.CompletionItem(value.prefix, kind);
    // remove preceding trigger character if present:
    if (document.getText(new vscode.Range(position.translate(0, -1), position)) === trigger){
      snippetCompletion.range = new vscode.Range(position.translate(0, -1), position);
    }
    snippetCompletion.insertText = new vscode.SnippetString(value.body);
    snippetCompletion.documentation = value.description;
    snippetCompletion.detail = value.description;
    snippetCompletion.sortText = key;
    completionItems.push(snippetCompletion);
  }
  return completionItems;
}

async function provideParagraphCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | undefined> {
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

async function provideBlockCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | undefined> {
  const prevLineEmpty = document.lineAt(position.line - 1).isEmptyOrWhitespace;
  if (!prevLineEmpty) {
    return undefined;
  }
  const p = new vscode.CompletionItem('<p>', vscode.CompletionItemKind.Class);
      p.insertText = new vscode.SnippetString('<p>\n\t$0\n</p>');
      // p.filterText = "<";
      p.range = new vscode.Range(position.translate(0, -1), position);
      // remove preceding "<" if present:
      // if (document.getText(new vscode.Range(position.translate(0, -1), position)) === "<"){
      //   p.additionalTextEdits = [vscode.TextEdit.delete(new vscode.Range(position.translate(0, -1), position))];
      // }
      console.log(p.label);
      p.documentation = "Insert a paragraph";
      p.detail = "PreTeXt paragraph";
      p.filterText = "<p>";
      p.command = { command: "editor.action.triggerSuggest", title: "Re-trigger completions..."};
      return [p];
}


/**
 * Provide completions for attributes in PreTeXt.  We check whether the cursor is inside an open tag, and if so, we provide completions for attributes.
 */
async function attributeCompletions(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
  const attributeSnippets = readJsonFile('snippets/pretext-attributes.json');
  const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
  if (!linePrefix.match(/<[^>/]+$/)) {
    return undefined;
  }
  const attributeCompletionItems = getSnippetCompletionItems(attributeSnippets, vscode.CompletionItemKind.Keyword, document, position, "@");
  return attributeCompletionItems;
}


async function elementCompletions(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
  const blockSnippets = readJsonFile('snippets/pretext-blocks.json');
  const prevLineEmpty = document.lineAt(position.line - 1).isEmptyOrWhitespace;
  if (!prevLineEmpty) {
    console.log("prev line not empty", document.lineAt(position.line - 1).text.trim());
    return undefined;
  }
  const blockCompletionItems = getSnippetCompletionItems(blockSnippets, vscode.CompletionItemKind.Keyword, document, position, "<");
  return blockCompletionItems;
}




/** 
 * Activate completions for PreTeXt
 * @param context - the extension context
 */
export function activateCompletions(context: vscode.ExtensionContext) {
  // const textSnippets = readJsonFile('snippets/pretext-text.json');
  const attributeProvider = vscode.languages.registerCompletionItemProvider('pretext', {provideCompletionItems: attributeCompletions}, "@" );

  const elementProvider = vscode.languages.registerCompletionItemProvider('pretext', {provideCompletionItems: elementCompletions}, "<" );
    
  context.subscriptions.push(elementProvider, attributeProvider);
  console.log("Activated completion provider");
}
