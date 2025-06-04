import { commands, Range, window } from "vscode";
import { latexToPretext } from "../latextopretext";
import { markdownToPretext } from "md2ptx";
import { pretextOutputChannel } from "../ui";
import { convertToPretext } from "../importFiles";
import { processLatexViaUnified } from "@unified-latex/unified-latex";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { getArgsContent } from "@unified-latex/unified-latex-util-arguments";
import {
  unifiedLatexToPretext,
  unifiedLatexWrapPars,
  xmlCompilePlugin,
} from "@unified-latex/unified-latex-to-pretext";
import { formatPTX } from "../formatter";
// @ts-ignore
import { FlexTeXtConvert } from "frankenmarkup";
import { get } from "http";
import { Environment, Macro } from "@unified-latex/unified-latex-types";

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

    // Split consecutive tags with a space if present before formatting.
    const formattedNewText = formatPTX(newText.replace(/(>)(<)/g, "$1 $2"));

    //The prettier formatter is finicky; needs correct structure to work?

    //const formattedNewText = prettier.format(newText, {
    //  parser: "ptx",
    //  plugins: [prettierPluginPretext as unknown as prettier.Plugin],
    //});

    editor.edit((editbuilder) => {
      editbuilder.replace(selectionRange, formattedNewText);
    });
  }
}

//const myMacroReplacements = {
//  myfoo: (node: Macro) => {
//    console.log("myfoo node is", node.args);
//    const args = getArgsContent(node);
//    console.log("args are", args);
//    return htmlLike({
//      tag: "myptxfoo",
//    });
//  }
//}

const ptxExtraEnvironmentReplacements = {
  solution: (node: Environment) => {
    return htmlLike({
      tag: "solution",
      content: node.content,
    });
  },
  answer: (node: Environment) => {
    return htmlLike({
      tag: "answer",
      content: node.content,
    });
  },
  hint: (node: Environment) => {
    return htmlLike({
      tag: "hint",
      content: node.content,
    });
  },
};

function convertWithUnified(text: string) {
  const convert = (value: string) =>
    processLatexViaUnified()
      .use(unifiedLatexToPretext, {
        producePretextFragment: true,
        //macroReplacements: myMacroReplacements,
        environmentReplacements: ptxExtraEnvironmentReplacements,
      })
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
  // Give warning that this function is currently unvailable.
  pretextOutputChannel.appendLine(
    "Markdown to PreTeXt conversion is still very experiemental.  Use with care."
  );

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

export async function cmdConvertFlextextToPretext() {
  pretextOutputChannel.appendLine(
    "Flextext to PreTeXt conversion is still very experiemental.  Use with care."
  );
  const editor = window.activeTextEditor;
  console.log("editor is", editor);
  if (editor) {
    const selection = editor.selection;
    const selectionRange = selection.isEmpty
      ? new Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        )
      : new Range(selection.start, selection.end);
    console.log("selectionRange is", selectionRange);
    const initialText = editor.document.getText(selectionRange);

    var newText = FlexTeXtConvert(initialText);

    editor.edit((editbuilder) => {
      editbuilder.replace(selectionRange, newText);
    });
    // Call default formatter to format just the replaced selection.
    commands.executeCommand("editor.action.formatSelection");

    console.log("Formatted text");
  }
}
