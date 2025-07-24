import { Range, window } from "vscode";
import { markdownToPretext } from "md2ptx";
import { pretextOutputChannel } from "../ui";
import { convertToPretext } from "../importFiles";
import { processLatexViaUnified } from "@unified-latex/unified-latex";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import {
  unifiedLatexToPretext,
  xmlCompilePlugin,
} from "@unified-latex/unified-latex-to-pretext";
// @ts-ignore
import { FlexTeXtConvert } from "frankenmarkup";
import { Environment, Macro } from "@unified-latex/unified-latex-types";
import { lspFormatText } from "../lsp-client/main";
import { fromXml } from "xast-util-from-xml";
import { toXml } from "xast-util-to-xml";
import { SKIP, visit } from "unist-util-visit";
import { fromMarkdown } from "mdast-util-from-markdown";

export function cmdConvertFile() {
  pretextOutputChannel.append("Converting selected file to PreTeXt");
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


export async function cmdConvertText() {
  window.showQuickPick(["LaTeX", "Markdown", "Mixed text"], {
    placeHolder: "Which format is the selected text?",
}).then((qpSelection) => {
    if (!qpSelection) {
      return;
    }
    switch (qpSelection) {
      case "LaTeX":
        cmdLatexToPretext();
        break;
      case "Markdown":
        cmdMarkdownToPretext();
        break;
      case "Mixed text":
        cmdConvertMixedtextToPretext();
        break;
    }
  })
}


async function cmdLatexToPretext() {
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
    const formattedNewText = await lspFormatText(newText.replace(/(>)(<)/g, "$1 $2"));

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

function cmdMarkdownToPretext() {
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

async function cmdConvertMixedtextToPretext() {
  pretextOutputChannel.appendLine(
    "Mixed text to PreTeXt conversion is still very experiemental.  Use with care."
  );
  const editor = window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    let selectionRange: Range;
    let fullDocument = false;
    if (selection.isEmpty) {
      fullDocument = true;
      selectionRange = new Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
      );
    } else {
      selectionRange = new Range(selection.start, selection.end);
    }
    const initialText = editor.document.getText(selectionRange);
    const newText = FlexTeXtConvert(initialText);
    const formattedNewText = await lspFormatText(newText);
    editor.edit((editbuilder) => {
      editbuilder.replace(selectionRange, formattedNewText);
    });
    pretextOutputChannel.appendLine("Mixed text converted to PreTeXt.");
  }
}

////////////////// Experiments /////////////////////

export async function cmdExperimentConvert() {
  // Prompt user to select a conversion method
  pretextOutputChannel.appendLine(
    "Experimental conversion functions are designed for testing and may not work as expected."
  );
  window.showQuickPick(
    [
      {
        label: "Use mdast",
        description: "Preprocess selected text with Markdown AST",
        function: "convertMixedTextWithMdast",
      },
      {
        label: "Use xast",
        description: "Convert selected text to PreTeXt format",
        function: "convertMixedTextWithXast"
      },
      {
        label: "Use FrankenMarkup",
        description: "Convert selected text to PreTeXt format",
        function: "convertMixedTextWithFrankenMarkup"
      }
    ]
  ).then((selection) => {
    if (!selection) {
      return;
    }
    switch (selection.function) {
      case "convertMixedTextWithMdast":
        cmdConvertPmdWithMdast();
        break;
      case "convertMixedTextWithXast":
        cmdConvertMixedTextToPretextViaXast();
        break;
      case "convertMixedTextWithFrankenMarkup":
        cmdConvertMixedtextToPretext();
        break;
    }
  });
}

async function cmdConvertPmdWithMdast() {
  pretextOutputChannel.appendLine(
    "Mixed text to PreTeXt conversion is still very experiemental.  Use with care."
  );
  const editor = window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    let selectionRange: Range;
    let fullDocument = false;
    if (selection.isEmpty) {
      fullDocument = true;
      selectionRange = new Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
      );
    } else {
      selectionRange = new Range(selection.start, selection.end);
    }
    const initialText = editor.document.getText(selectionRange);
    // Remove leading and trailing whitespace
    const trimmedText = initialText.trim();
    console.log("initialText is", trimmedText);

    // Converte to mdast:
    const tree = fromMarkdown(trimmedText);

    console.log("mdast before: ", tree);

    //const convertedText = toXml(tree);

    // Convert the text using FlexTeXtConvert
    //const convertedText = FlexTeXtConvert(trimmedText);
    const convertedText = initialText;
    console.log("converted text is", convertedText);

    // Format the converted text
    const formattedNewText = await lspFormatText(convertedText);

    editor.edit((editbuilder) => {
      editbuilder.replace(selectionRange, formattedNewText);
    });
    pretextOutputChannel.appendLine("Mixed text converted to PreTeXt.");
  }

}


async function cmdConvertMixedTextToPretextViaXast() {
  console.log("cmdConvertMixedTextToPretextViaXast called");
  pretextOutputChannel.appendLine(
    "Mixed text to PreTeXt conversion is still very experiemental.  Use with care."
  );
  const editor = window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    let selectionRange: Range;
    let fullDocument = false;
    if (selection.isEmpty) {
      fullDocument = true;
      selectionRange = new Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
      );
    } else {
      selectionRange = new Range(selection.start, selection.end);
    }
    let initialText = editor.document.getText(selectionRange);
    // Remove leading and trailing whitespace
    initialText = initialText.trim();
    console.log("initialText is", initialText);

    const tree = fromXml(`<root>${initialText}</root>`);

    console.log("xast before: ", tree);

    visit(tree, (node, index, parent) => {
      if (node.type === "text") {
        const converted = FlexTeXtConvert(node.value);

        console.log("converted text is", converted);

        const subtree = fromXml(converted);
        // replace the node with the subtree
        if (typeof index !== "number" || !parent) return;

        parent.children.splice(index, 1, ...subtree.children);
        return SKIP;
      }
    });

    console.log("xast after: ", tree);
    // Convert the resulting tree back to XML
    let newXml = toXml(tree);

    console.log("back to xml: ", newXml);
    // strip the <root> and </root> tags
    const rootTagMatch = newXml.match(/^<root>\s*([\s\S]*?)\s*<\/root>$/);
    if (rootTagMatch) {
    newXml = rootTagMatch[1];
    }

    const formattedNewText = await lspFormatText(newXml);

    editor.edit((editbuilder) => {
      editbuilder.replace(selectionRange, formattedNewText);
    });
    pretextOutputChannel.appendLine("Mixed text converted to PreTeXt.");
  }
}
