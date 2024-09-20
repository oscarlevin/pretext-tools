import { connection } from "./connection";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
    InitializeParams,
    DidChangeConfigurationNotification,
    TextDocumentSyncKind,
    InitializeResult,
    DocumentSymbol,
    CodeActionKind,
    TextDocumentPositionParams,
} from "vscode-languageserver/node";
import { isProjectPtx } from "./projectPtx/is-project-ptx";
import {
    clearAllDocumentInfo,
    clearDocumentInfo,
    documents,
    getDocumentInfo,
    initializeDocument,
    updateDocument,
} from "./state";
import { getProjectPtxSymbols } from "./projectPtx/get-symbols";
import { getProjectPtxLinks } from "./projectPtx/get-links";
import { getProjectPtxHoverInfo } from "./projectPtx/get-hover";
import {
    getCompletions,
    getCompletionDetails,
} from "./completions/get-completions";
import { formatDocument } from "./formatter";
import { getReferences, updateReferences } from "./completions/utils";

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
export let hasDiagnosticRelatedInformationCapability = false;


type LabelArray = [string, string, string][];
export let references: LabelArray = [];





  // vscode.workspace.onDidSaveTextDocument(async (document) => {
  //   labels = await utils.updateReferences(document, labels);
  // });

connection.onInitialize( (params: InitializeParams) => {
    const capabilities = params.capabilities;

    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ["@", "<", "\"",],
            },
            // hoverProvider: { workDoneProgress: true },
            // documentSymbolProvider: { label: "PreTeXt Symbols" },
            // documentLinkProvider: {},
            // codeActionProvider: { codeActionKinds: [CodeActionKind.QuickFix] },
            // executeCommandProvider: {
            //     commands: ["editor.action.addCommentLine"],
            // },
            // documentFormattingProvider: {},
        },
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }
    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(
            DidChangeConfigurationNotification.type,
            undefined
        );
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders((_event) => {
            connection.console.log("Workspace folder change event received.");
        });
    }

     ///////////////// Completion Items //////////////////////
    references = [];
    try {
      references = getReferences();
    } catch {
      console.log("Error getting references");
    }
});

connection.onDidChangeConfiguration((change) => {
    clearAllDocumentInfo();

    // Revalidate all open text documents
    for (const doc of documents.all()) {
        initializeDocument(doc.uri);
    }
});

// Only keep settings for open documents
documents.onDidClose((e) => {
    console.log("closed", e.document.uri);
    clearDocumentInfo(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async (change) => {
    updateDocument(change.document);
    console.log("changed content", change.document.uri);
    if (isProjectPtx(change.document)) {
        const info = await getDocumentInfo(change.document.uri);
        if (!info) {
            return;
        }
        await info.ast;
        const parseErrors = info.parseErrors;
        connection.sendDiagnostics({
            uri: change.document.uri,
            diagnostics: parseErrors,
        });
    }
});

documents.onDidSave((e) => {
    // update references for the saved document
    // TODO: this should just update references instead of finding all of them again.
    references = getReferences();
});

connection.onDidChangeWatchedFiles((_change) => {
    // Monitored files have change in VSCode
    connection.console.log("We received a file change event");
});

// This handler provides the initial list of the completion items.
connection.onCompletion(async (params) => {
    return getCompletions(params);
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(getCompletionDetails);

connection.onHover(async (params) => {
    if (isProjectPtx(params.textDocument.uri)) {
        connection.console.log("hovering over");
        return getProjectPtxHoverInfo(params);
    }
});

connection.onCodeAction((params) => {
    return [{ title: "My Custom Action" }];
});
connection.onExecuteCommand((params) => {
    console.log("asked to execute", params.command);
});

connection.onNotification((...args) => {
    console.log("notified of", args);
});

connection.onDocumentLinks((params, cancel) => {
    if (isProjectPtx(params.textDocument.uri)) {
        return getProjectPtxLinks(params.textDocument.uri);
    }
});

connection.onDocumentSymbol(async (params): Promise<DocumentSymbol[]> => {
    if (isProjectPtx(params.textDocument.uri)) {
        return getProjectPtxSymbols(params.textDocument.uri);
    }
    return [];
});

connection.onDocumentFormatting(formatDocument);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
