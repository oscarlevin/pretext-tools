import * as vscode from "vscode";


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


export function activateCompletions(context: vscode.ExtensionContext) {
  const paragraphProvider = vscode.languages.registerCompletionItemProvider('pretext', {provideCompletionItems: provideParagraphCompletionItems}, "<" );
  const blockProvider = vscode.languages.registerCompletionItemProvider('pretext', {provideCompletionItems: provideBlockCompletionItems}, "<");
  context.subscriptions.push(paragraphProvider, blockProvider);
}
