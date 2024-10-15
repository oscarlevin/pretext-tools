import { Range, window } from "vscode";
import { latexToPretext } from "../latextopretext";
import { pretextOutputChannel } from "../ui";
import { convertToPretext } from "../importFiles";

export function cmdConvertToPretext() {
  console.log("Converting to PreTeXt");
  pretextOutputChannel.append("Converting to PreTeXt");
  // show quick pick to select whether to convert with pandoc or plastex
  window
    .showQuickPick(["plastex", "pandoc"], {
      placeHolder: "Select a converter",
    })
    .then((qpSelection) => {
      if (qpSelection === "pandoc") {
        convertToPretext("pandoc");
      } else if (qpSelection === "plastex") {
        convertToPretext("plastex");
      }
    });
}

export function cmdLatexToPretext() {
  const editor = window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const selectionRange = selection.isEmpty
      ? editor.document.lineAt(selection.start.line).range
      : new Range(selection.start, selection.end);

    var initialText = editor.document.getText(selectionRange);

    var newText = latexToPretext(initialText);

    editor.edit((editbuilder) => {
      editbuilder.replace(selectionRange, newText);
    });
  }
}
