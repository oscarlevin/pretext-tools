import {
    CompletionItem,
    CompletionItemKind,
    Hover,
    HoverParams,
    MarkupKind,
    TextDocumentPositionParams,
} from "vscode-languageserver/node";
import { elementAtOffset } from "../../parse/utils";
import { documents, getDocumentInfo } from "../state";
import * as glob from "glob";
import * as fs from "fs";

const LINK_CONTENT_NODES = new Set(["xsl", "source", "publication"]);

const completionCache: string[] = [];

/**
 * Return all the linkable items in a project.ptx file.
 */
export async function getProjectPtxCompletions(
    params: TextDocumentPositionParams
): Promise<CompletionItem[] | null> {
    const uri = params.textDocument.uri;
    const info = getDocumentInfo(uri);
    const doc = documents.get(uri);
    if (!info || !doc) {
        console.warn("Requested project symbols for uninitialized file", uri);
        return null;
    }
    const ast = await info.ast;
    if (!ast) {
        // There could be no AST because the document was malformed, so this isn't neccessarily an error.
        return null;
    }
    const offset = doc.offsetAt(params.position);
    const containingElm = elementAtOffset(offset, ast);
    if (!containingElm || !LINK_CONTENT_NODES.has(containingElm.name)) {
        return null;
    }

    // XXX: This is not right. We should only return completions when we're *inside*
    // of the tag, but out of laziness we'll just return items whenever we're in the tag.
    const pwd = new URL("./", uri).pathname;
    const globQuery = new URL("./**/*(*.xml|*.ptx)", uri).pathname;
    const files = glob.sync(globQuery, { nodir: true });
    return files
        .flatMap((f) => {
            const relPath = f.slice(pwd.length);
            // Allow completing both relative form starting with `./` and without.
            return [
                { relPath, path: f },
                { relPath: "./" + relPath, path: f },
            ];
        })
        .map((info, i) => {
            // Store data about the file so we can show more information later (asyncronously)
            completionCache[i] = info.path;
            return {
                label: info.relPath,
                kind: CompletionItemKind.File,
                data: i,
            };
        });
}

/**
 * Augment `item` by appending more information to it. This is only
 * done when the user requests more information about the item
 * via UI interaction. Therefore, this operation can be slow without
 * slowing down the rest of the interface.
 */
export async function getProjectPtxCompletionDetails(
    item: CompletionItem
): Promise<CompletionItem> {
    const fullPath = completionCache[item.data];
    if (!fullPath) {
        return item;
    }
    try {
        const stats = fs.statSync(fullPath);
        item.detail = `File is ${stats.size} bytes`;
        item.documentation = "Reference this file in your project";
    } catch (e) {
        console.warn("Error when reading file", fullPath, e);
    }
    return item;
}
