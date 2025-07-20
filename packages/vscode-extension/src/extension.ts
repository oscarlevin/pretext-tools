import {
  ExtensionContext,
  workspace,
  languages,
  TextDocument,
  TextEdit,
  commands,
  WebviewPanel,
  window,
} from "vscode";
import { formatPretextDocument } from "./formatter";
import * as utils from "./utils";

import {
  pretextOutputChannel,
  pretextTerminal,
  ptxSBItem,
  refreshProjects,
  showLog,
} from "./ui";
import {
  cmdView,
  cmdViewCLI,
  cmdViewCodeChat,
  cmdViewVisualEditor,
} from "./commands/view";
import { cmdNew } from "./commands/new";
import { cmdDeploy } from "./commands/deploy";
import { cmdUpdate } from "./commands/update";
//import { ptxExperiment } from "./commands/experiment";
import {
  cmdConvertMixedtextToPretext,
  cmdConvertToPretext,
  cmdLatexToPretext,
  cmdMarkdownToPretext,
} from "./commands/convert";
import {
  cmdBuildAny,
  cmdBuildFile,
  cmdBuildLast,
  cmdGenerate,
} from "./commands/build";
import { cmdSelectCommand } from "./commands/select";
// Set up types:
import {
  activate as lspActivate,
  deactivate as lspDeactivate,
  lspFormat,
  lspFormatText,
} from "./lsp-client/main";
import { projects } from "./project";
import { cmdInstallSage } from "./commands/installSage";
import { PretextVisualEditorProvider } from "./visualEditor";

// this method is called when your extension is activated
export async function activate(context: ExtensionContext) {
  pretextOutputChannel.appendLine("Welcome to the pretext-tools extension.");
  console.log('Extension "pretext-tools" is now active!');

  ///////////////// General Setup //////////////////////
  //_context = context;

  workspace.onDidChangeConfiguration((event) => {
    let affected = event.affectsConfiguration("pretext-tools");
    if (event.affectsConfiguration("pretext-tools.schema")) {
      console.log("PreTeXt Tools schema configuration changed");
      // Set schema for pretext files:
      try {
        utils.setSchema(context);
      } catch {
        console.log("Error setting schema");
      }
    }
    if (event.affectsConfiguration("pretext-tools.spellCheck")) {
      console.log("PreTeXt Tools spell check configuration changed");
      // Set spell check options:
      try {
        utils.setSpellCheckConfig();
      } catch {
        console.log("Error setting spell check");
      }
    }
  });

  // Set spell check options:
  try {
    utils.setSpellCheckConfig();
  } catch {
    console.log("Error setting spell check");
  }

  // Set schema for pretext files:
  // NB this is done for the XML extension for validation.  Also done in the LSP for completions.  Eventually this will all be in the LSP.
  try {
    utils.setSchema(context);
  } catch {
    console.log("Error setting schema");
  }

  context.subscriptions.push(ptxSBItem);
  utils.updateStatusBarItem(ptxSBItem);

  ///////////////// Formatter //////////////////////

  // try {
  //   let formatter = languages.registerDocumentFormattingEditProvider(
  //     "pretext",
  //     {
  //       provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {
  //         return formatPretextDocument(document);
  //       },
  //     }
  //   );

  //   context.subscriptions.push(formatter);
  // } catch {
  //   console.log("Error setting up formatter");
  // }

  // Visual editor
  context.subscriptions.push(PretextVisualEditorProvider.register(context));

  ///////////////// Commands //////////////////////

  // Import or define the client instance for LSP communication

  context.subscriptions.push(
    commands.registerCommand("pretext-tools.experiment", () => {
      console.log("Running PreTeXt experiment command");
      // Example: Triggering a custom command from the client
      // This is cool.  It will allow us to complete custom things throught the LSP.
      // This is formatting
      const activeEditor = window.activeTextEditor;
      if (activeEditor) {
        client.sendRequest("workspace/executeCommand", {
          command: "formatDocument",
          arguments: [{ uri: activeEditor.document.uri.toString() }],
        });
      } else {
        console.log("No active editor found to format document.");
      }
      //utils.experiment(context);
    }),
    commands.registerCommand(
      "pretext-tools.selectPretextCommand",
      cmdSelectCommand
    ),
    commands.registerCommand("pretext-tools.buildAny", cmdBuildAny),
    commands.registerCommand("pretext-tools.buildLast", cmdBuildLast),
    commands.registerCommand("pretext-tools.buildFile", cmdBuildFile),
    commands.registerCommand("pretext-tools.generate", cmdGenerate),
    commands.registerCommand("pretext-tools.view", cmdView),
    commands.registerCommand("pretext-tools.viewCLI", cmdViewCLI),
    commands.registerCommand("pretext-tools.viewCodeChat", cmdViewCodeChat),
    commands.registerCommand(
      "pretext-tools.viewVisualEditor",
      cmdViewVisualEditor
    ),
    commands.registerCommand("pretext-tools.new", cmdNew),
    commands.registerCommand("pretext-tools.deploy", cmdDeploy),
    commands.registerCommand("pretext-tools.updatePTX", cmdUpdate),
    commands.registerCommand("pretext-tools.formatPretextDocument", () => {
      const activeEditor = window.activeTextEditor;
      if (activeEditor) {
        return lspFormat(activeEditor);
      } else {
        console.log("No document provided to format");
      }
    }),
    commands.registerCommand(
      "pretext-tools.ftToPtx",
      cmdConvertMixedtextToPretext
    ),
    commands.registerCommand("pretext-tools.latexToPretext", cmdLatexToPretext),
    commands.registerCommand(
      "pretext-tools.convertToPretext",
      cmdConvertToPretext
    ),
    commands.registerCommand(
      "pretext-tools.markdownToPretext",
      cmdMarkdownToPretext
    ),
    commands.registerCommand("pretext-tools.showLog", showLog),
    commands.registerCommand("pretext-tools.refreshTargets", refreshProjects),
    commands.registerCommand("pretext-tools.installSage", cmdInstallSage),
    commands.registerCommand("pretext-tools.gettingStarted", () => {
      console.log("Opening getting started walkthrough");
      // Open the walkthrough
      commands.executeCommand(
        "workbench.action.openWalkthrough",
        "oscarlevin.pretext-tools#gettingStarted"
      );
    })
  );

  console.log("Current projects: ", projects);

  // Start the LSP
  try {
    lspActivate(context);
  } catch {
    console.log("Error starting LSP client");
    pretextOutputChannel.appendLine(
      "Error starting language server.  Some features may not be available."
    );
  }

  pretextOutputChannel.appendLine(
    "PreTeXt related commands are available through the PreTeXt status bar menu or the command pallet (CTRL+SHIFT+P)."
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  lspDeactivate();
  if (pretextTerminal) {
    pretextTerminal.dispose();
  }
}
