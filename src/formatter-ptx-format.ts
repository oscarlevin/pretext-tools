import * as vscode from "vscode";
import * as cp from "child_process";

// const blankLines = vscode.workspace
//   .getConfiguration("pretext-tools")
//   .get("formatter.blankLines");

export function formatPTX(document: vscode.TextDocument): vscode.TextEdit[] {
  // First clean up document so that each line is a single tag when appropriate.
  let allText = document.getText();
  const output = cp.execSync("ptx-format", {
    input: allText,
    encoding: "utf-8",
  });
  return [
    vscode.TextEdit.replace(
      document.validateRange(new vscode.Range(0, 0, document.lineCount, 0)),
      output
    ),
  ];
}
