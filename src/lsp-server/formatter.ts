import {
  DocumentFormattingParams,
  Range,
  TextEdit,
} from "vscode-languageserver/node";
import * as prettier from "prettier";
import * as prettierPluginPretext from "prettier-plugin-pretext";
import { documents } from "./state";

function formatWithPrettier(text: string, options: prettier.Options): string {
  const ret = prettier.format(text, {
    parser: "ptx",
    plugins: [prettierPluginPretext as unknown as prettier.Plugin],
  });
  return ret;
}

/**
 * Run the pretty printer on the document.
 */
export async function formatDocument(
  params: DocumentFormattingParams
): Promise<TextEdit[] | null> {
  const uri = params.textDocument.uri;
  const doc = documents.get(uri);
  if (!doc) {
    return null;
  }
  const origText = doc.getText();
  const replacementRange: Range = {
    start: doc.positionAt(0),
    end: doc.positionAt(origText.length),
  };

  try {
    let formatted = formatWithPrettier(origText, {
      tabWidth: params.options.tabSize,
      useTabs: !params.options.insertSpaces,
    });
    if (
      params.options.insertFinalNewline === false ||
      params.options.trimFinalNewlines
    ) {
      formatted = formatted.trimEnd();
    }
    return [{ newText: formatted, range: replacementRange }];
  } catch (e) {
    console.log("Could not format document", e);
  }

  return null;
}
