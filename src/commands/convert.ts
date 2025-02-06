import { Range, window } from "vscode";
import { latexToPretext } from "../latextopretext";
import { markdownToPretext } from "md2ptx";
import { pretextOutputChannel } from "../ui";
import { convertToPretext } from "../importFiles";
import { processLatexViaUnified } from "@unified-latex/unified-latex";
import {
  unifiedLatexToPretext,
  xmlCompilePlugin,
} from "@unified-latex/unified-latex-to-pretext";
import { formatPTX } from "../formatter";

import * as prettier from "prettier";
import * as prettierPluginPretext from "prettier-plugin-pretext";



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

    //console.log("selectionRange is", selectionRange);

    const initialText = editor.document.getText(selectionRange);

    //var newText = latexToPretext(initialText);
    let newText = convertWithUnified(initialText);

    // Remove the starting <p> tag if we selected text in the middle of a line.
    const pTagMatch = newText.match(/^<p>/);
    if (pTagMatch && selectionRange.start.character > 0) {
      newText = newText.replace(/^<p>/, "");
    }


    const formattedNewText = prettier.format(newText, {
      parser: "ptx",
      plugins: [prettierPluginPretext as unknown as prettier.Plugin],
    });
    editor.edit((editbuilder) => {
      editbuilder.replace(selectionRange, formattedNewText);
    });
  }
}

function convertWithUnified(text: string) {
  const convert = (value: string) =>
    processLatexViaUnified()
      .use(unifiedLatexToPretext, { producePretextFragment: true })
      .use(xmlCompilePlugin)
      .processSync({ value });

  pretextOutputChannel.append("Converting selected text to PreTeXt.\n");
  if (convert(text).messages) {
    for (let message of convert(text).messages) {
      pretextOutputChannel.appendLine(message.message);
      console.log(message);
    }
  }
  return convert(text).value as string;
}

export function cmdMarkdownToPretext() {
  const editor = window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const selectionRange = selection.isEmpty
      ? editor.document.lineAt(selection.start.line).range
      : new Range(selection.start, selection.end);

    const initialText = editor.document.getText(selectionRange);

    var newText = markdownToPretext(initialText);

    editor.edit((editbuilder) => {
      editbuilder.replace(selectionRange, newText);
    });
  }
}
