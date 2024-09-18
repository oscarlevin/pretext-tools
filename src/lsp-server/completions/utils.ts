import * as fs from "fs";
import { Snippets } from "../../types";
import { elementChildren } from "../../constants";
import {
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  InsertTextFormat,
  Range,
  Position,
} from "vscode-languageserver/node";
import { documents } from "../state";
import { TextDocument } from "vscode-languageserver-textdocument";

export async function readJsonFile(relativePath: string): Promise<any> {
  try {
    // Set the absolute path to the snippets file:
    const data = fs.readFileSync(relativePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file from disk: ${error}`);
    return null;
  }
}

/**
 * Returns a position in the same line shifted by a given number of characters.  If a the number of characters would shift the position beyond the end of the line, or before the start of the line, the end or start of the line position is returned.
 * @param position - the starting position
 * @param shift - the number of characters to shift.  Negative shifts move the position to the left. Defaults to 0.
 * @returns the new position
 */
function positionCharShift(position: Position, shift?: number): Position {
  return {
    line: position.line,
    character: position.character + (shift || 0),
  };
}

/**
 * Returns a range contained on the current line, starting prior to a given position by a given shift and ending at the given position after a second given shift.
 * @param position - the position to shift
 * @param startShift - the shift to apply
 * @param endShift - the shift to apply
 * @returns the new range
 */
export function rangeInLine(
  position: Position,
  startShift?: number,
  endShift?: number
): Range {
  return {
    start: positionCharShift(position, startShift),
    end: positionCharShift(position, endShift),
  };
}

/**
 * Returns a range from the start of the line to a given position.
 * @param position - the position to end the range
 * @returns the new range
 */
export function lineToPosition(position: Position): Range {
  return {
    start: { line: position.line, character: 0 },
    end: position,
  };
}


/**
  Finds the current node of the curser by comparing all tags above the curser to the open tags above the curser.
 */
  function getCurrentTag(
    document: TextDocument,
    position: Position
  ): string | undefined {
    const textUntilPosition = document?.getText({start: { line: 0, character: 0 }, end: position});
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

/**
 * Reads a snippet file and returns a list of completion items.
 * @param snippets - the snippets to read
 * @param kind - the kind of completion item
 * @param node - the current (open) node/element
 * @param document - the current document
 * @param position - the current position of the cursor
 */
export async function getSnippetCompletionItems(
  snippets: Snippets,
  kind: CompletionItemKind | undefined,
  node: string | undefined,
  params: TextDocumentPositionParams,
  trigger: string
): Promise<CompletionItem[]> {
  const uri = params.textDocument.uri;
  const position = params.position;
  const document = documents.get(uri);
  const labels = ["source", "xsl", "publication", "pubfile"];
  let completionItems: CompletionItem[] = [];
  for (let elem of labels) {
    console.log(elem);
    if (elem in snippets) {
      console.log("found");
      const snippetCompletion: CompletionItem = {
        label: snippets[elem].prefix,
        kind: kind,
      };
      console.log(snippets[elem]);
    }
  }
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
    const snippetCompletion: CompletionItem = {
      label: value.prefix,
      kind: kind,
    };
    // remove preceding trigger character if present:
    let range: Range;
    if (
      document &&
      document.getText(rangeInLine(position, -1, 0)) === trigger
    ) {
      console.log("trigger detected");
      range = rangeInLine(position, -1, 0);
    } else {
      range = rangeInLine(position);
    }

    // TODO: check whether this should just be the label when the editor doesn't support snippets.
    snippetCompletion.insertText = value.body;
    snippetCompletion.insertTextFormat = InsertTextFormat.Snippet;
    snippetCompletion.detail = value.description; //should be more api-like
    snippetCompletion.documentation = value.description; //plain language description
    snippetCompletion.sortText = value.sort ? value.sort + key : key;
    snippetCompletion.filterText = value.prefix;
    snippetCompletion.textEdit = { newText: value.body, range: range };
    if (value.retrigger) {
      snippetCompletion.command = {
        title: "Suggest",
        command: "editor.action.triggerSuggest",
      };
    }
    // condition on the label existing to avoid "default" completion.
    if (snippetCompletion.label) {
      completionItems.push(snippetCompletion);
    }
  }
  // Also add a closing tag for the current node, since we have turned off this feature from redhat.vscode-xml.
  if (node && trigger === "<") {
    const closeTagCompletion: CompletionItem = {label:`/${node}>`, kind:kind};
    closeTagCompletion.insertText = `/${node}>`;
    closeTagCompletion.documentation = `Close the ${node} tag`;
    closeTagCompletion.detail = `Close the ${node} tag`;
    completionItems.push(closeTagCompletion);
  }
  return completionItems;
}
