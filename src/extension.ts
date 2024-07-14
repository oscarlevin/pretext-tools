// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { spawn } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { convertToPretext } from "./importFiles";
import { latexToPretext } from "./latextopretext";
import { formatPTX } from "./formatter";
import { ptxExec } from "./utils";
import * as utils from "./utils";
import { ptxCommandList } from "./constants";
import { activateCompletions } from "./completions";

// Set up types:
type LabelArray = [string, string, string][];

// Set up vscode elements
export let _context: vscode.ExtensionContext;
let pretextOutputChannel: vscode.OutputChannel;
let ptxSBItem: vscode.StatusBarItem;
let pretextTerminal: vscode.Terminal;
var lastTarget = "";
let pretextCommandList = ptxCommandList;

export let labels: LabelArray = [];

// The main function to run pretext commands:
async function runPretext(
  ptxExec: string,
  ptxCommand: string,
  ptxOptions: string,
  passedPath: string = ""
): Promise<void> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: "PreTeXt Command Running",
      cancellable: false,
    },
    async (progress) => {
      return new Promise<void>((resolve) => {
        utils.updateStatusBarItem(ptxSBItem, "running");
        var progressUpdate = "Starting up...";
        const interval = setInterval(
          () => progress.report({ message: progressUpdate }),
          1000
        );
        let fullCommand = ptxExec + " " + ptxCommand + " " + ptxOptions;
        let status = "ready"; //for statusbaritem
        var filePath = utils.getDir(passedPath);
        console.log("cwd = " + filePath);
        if (filePath !== "" && filePath !== ".") {
          let lastError: string | undefined = undefined;
          pretextOutputChannel.clear();
          pretextOutputChannel.appendLine(
            "\n\nNow running `" + fullCommand + "`..."
          );
          progressUpdate = "Running " + fullCommand;
          var ptxRun = spawn(fullCommand, [], {
            cwd: filePath,
            shell: true,
          });
          ptxRun.stdout.on("data", function (data) {
            console.log(`${data}`);
            pretextOutputChannel.append(`${data}`);
          });

          ptxRun.stderr.on("data", function (data) {
            console.log(`${data}`);
            // var outputLines = data.toString().split(/\r?\n/);
            // for (const line of outputLines) {
            // console.log(line + "\n");
            if (
              data.toString().startsWith("Server will soon be available at") ||
              data.toString().includes("[Ctrl]+[C]")
            ) {
              pretextOutputChannel.appendLine(`${data}`);
              pretextOutputChannel.append(
                "(this local server will remain running until you close vs code)\n"
              );
              console.log("Using view. Status should change back");
              utils.updateStatusBarItem(ptxSBItem, "success");
              resolve();
              clearInterval(interval);
            } else if (
              data.toString().startsWith("error") ||
              data.toString().startsWith("critical")
            ) {
              // Update `lastError` so it will show the final error from running pretext
              pretextOutputChannel.append(`${data}`);
              lastError = `${data}`;
              vscode.window
                .showErrorMessage(
                  "PreTeXt encountered an error: " + lastError,
                  "View log",
                  "Dismiss"
                )
                .then((option) => {
                  if (option === "View log") {
                    pretextOutputChannel.show();
                  }
                });
              status = "error";
            } else if (
              data.toString().includes(`pretext view`) &&
              ptxCommand === "build"
            ) {
              vscode.window
                .showInformationMessage(
                  "Build successful! You can preview your output now.",
                  "View log",
                  "Dismiss"
                )
                .then((option) => {
                  if (option === "View log") {
                    pretextOutputChannel.show();
                  }
                });
              status = "success";
            } else if (
              data
                .toString()
                .includes(
                  "Your built project will soon be available to the public at:"
                ) &&
              ptxCommand === "deploy"
            ) {
              vscode.window
                .showInformationMessage(
                  "Deploy successful! You can view your deployed site now.",
                  "Visit site",
                  "View log",
                  "Dismiss"
                )
                .then((option) => {
                  if (option === "Visit site") {
                    const siteURL = data.toString().trim();
                    vscode.env.openExternal(vscode.Uri.parse(siteURL));
                  } else if (option === "View log") {
                    pretextOutputChannel.show();
                  }
                });
              status = "success";
            } else {
              pretextOutputChannel.append(`${data}`);
            }
          });

          ptxRun.on("close", function (code) {
            console.log(code?.toString());
            if (ptxRun.killed) {
              pretextOutputChannel.appendLine(
                "...PreTeXt command terminated early."
              );
              console.log("Process killed");
            } else {
              pretextOutputChannel.appendLine("...PreTeXt command finished.");
            }
            if (lastError) {
              vscode.window
                .showErrorMessage(
                  "PreTeXt encountered one or more errors: " + lastError,
                  "Show Log",
                  "Dismiss"
                )
                .then((option) => {
                  if (option === "Show Log") {
                    pretextOutputChannel.show();
                  }
                });
            }
            utils.updateStatusBarItem(ptxSBItem, status);
            progressUpdate = "Finished";
            resolve();
            clearInterval(interval);
          });
        }
      });
    }
  );
}

async function runThenOpen(
  ptxExec: string,
  ptxCommand: string,
  ptxOptions: string,
  folder: string
) {
  await runPretext(ptxExec, ptxCommand, ptxOptions, folder);
  vscode.commands.executeCommand(
    "vscode.openFolder",
    path.join(folder, "new_pretext_project")
  );
}

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  console.log('Extension "pretext-tools" is now active!');

  ///////////////// General Setup //////////////////////
  _context = context;

  vscode.workspace.onDidChangeConfiguration((event) => {
    let affected = event.affectsConfiguration("pretext-tools");
    if (event.affectsConfiguration("pretext-tools.schema")) {
      console.log("PreTeXt Tools schema configuration changed");
      // Set schema for pretext files:
      try {
        utils.setSchema();
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
  try {
    utils.setSchema();
  } catch {
    console.log("Error setting schema");
  }
  // Set up vscode elements
  pretextOutputChannel = vscode.window.createOutputChannel(
    "PreTeXt Tools",
    "log"
  );

  // set up status bar item
  ptxSBItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -100
  );
  context.subscriptions.push(ptxSBItem);
  utils.updateStatusBarItem(ptxSBItem);

  console.log("context", context.subscriptions[0]);
  const activeEditor = vscode.window.activeTextEditor;
  console.log(activeEditor?.document.fileName);

  console.log("PreTeXt exec command: ", utils.ptxExec);

  // set ptxInstalled variable to whether ptx is installed
  let ptxInstalled = utils.ptxExec !== "";
  console.log("Pretext is installed is:", ptxInstalled);

  var targetSelection = utils.getTargets();
  console.log("targetSelection is:", targetSelection);
  lastTarget = targetSelection[0].label;
  pretextCommandList[0].label = "Build " + lastTarget;
  console.log(
    "Targets are now:" +
      targetSelection.map(function (obj) {
        return " " + obj.label;
      })
  );

  ///////////////// Formatter //////////////////////

  try {
    let formatter = vscode.languages.registerDocumentFormattingEditProvider(
      "pretext",
      {
        provideDocumentFormattingEdits(
          document: vscode.TextDocument
        ): vscode.TextEdit[] {
          return formatPTX(document);
        },
      }
    );

    context.subscriptions.push(formatter);
  } catch {
    console.log("Error setting up formatter");
  }

  ///////////////// Completion Items //////////////////////
  labels = [];
  try {
    labels = await utils.getReferences();
  } catch {
    console.log("Error getting references");
  }

  try {
    activateCompletions(context);
  } catch {
    console.log("Error setting up completions");
  }

  vscode.workspace.onDidSaveTextDocument(async (document) => {
    labels = await utils.updateReferences(document, labels);
  });
  ///////////////// Commands //////////////////////

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.showLog", () => {
      pretextOutputChannel.show();
      utils.updateStatusBarItem(ptxSBItem);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "pretext-tools.buildAny",
      (runInTerminal: boolean = false) => {
        // Show choice dialog and pass correct command to runPretext based on selection.
        vscode.window.showQuickPick(targetSelection).then((qpSelection) => {
          if (!qpSelection) {
            return;
          }
          if (runInTerminal) {
            pretextTerminal = utils.setupTerminal(pretextTerminal);
            console.log(pretextTerminal.state);
            pretextTerminal.sendText("pretext build " + qpSelection.label);
          } else {
            runPretext(ptxExec, "build", qpSelection.label);
          }
          lastTarget = qpSelection.label;
          pretextCommandList[0].label = "Build " + lastTarget;
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "pretext-tools.buildLast",
      (runInTerminal: boolean = false) => {
        if (runInTerminal) {
          pretextTerminal = utils.setupTerminal(pretextTerminal);
          pretextTerminal.sendText("pretext build");
        } else {
          runPretext(ptxExec, "build", lastTarget);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "pretext-tools.generate",
      (runInTerminal: boolean = false) => {
        // Show choice dialog and pass correct command to runPretext based on selection.
        vscode.window.showQuickPick(targetSelection).then((qpSelection) => {
          if (!qpSelection) {
            return;
          }
          if (runInTerminal) {
            pretextTerminal = utils.setupTerminal(pretextTerminal);
            pretextTerminal.sendText(
              "pretext generate -t " + qpSelection.label
            );
          } else {
            runPretext(ptxExec, "generate -t", qpSelection.label);
          }
          // Move selected target to front of list for next command.
          targetSelection = targetSelection.filter(
            (item) => item !== qpSelection
          );
          targetSelection.unshift(qpSelection);
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "pretext-tools.view",
      (runInTerminal: boolean = false) => {
        const selectedViewMethod: string =
          vscode.workspace
            .getConfiguration("pretext-tools")
            .get("viewMethod") || "Ask";
        // Create and use a quick-select box if user has not set a configuration for view:
        if (selectedViewMethod === "Ask") {
          let viewMethods = [];
          if (vscode.extensions.getExtension("CodeChat.codechat")) {
            viewMethods.push({
              label: "Use CodeChat",
              command: "pretext-tools.viewCodeChat",
            });
          }
          if (viewMethods.length > 0) {
            viewMethods.push({
              label: "Use PreTeXt's view command",
              command: "pretext-tools.viewCLI",
            });
            vscode.window.showQuickPick(viewMethods).then((qpSelection) => {
              if (!qpSelection) {
                return;
              }
              vscode.commands.executeCommand(qpSelection.command);
            });
          } else {
            vscode.commands.executeCommand(
              "pretext-tools.viewCLI",
              runInTerminal
            );
          }
        } else {
          // otherwise honor the users setting choice.
          switch (selectedViewMethod) {
            case "CodeChat":
              vscode.commands.executeCommand("pretext-tools.viewCodeChat");
              break;
            case "PreTeXT-CLI View":
              vscode.commands.executeCommand(
                "pretext-tools.viewCLI",
                runInTerminal
              );
              break;
          }
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "pretext-tools.viewCLI",
      (runInTerminal: boolean = false) => {
        // Show choice dialog and pass correct command to runPretext based on selection.
        vscode.window.showQuickPick(targetSelection).then((qpSelection) => {
          if (!qpSelection) {
            return;
          }
          if (runInTerminal) {
            pretextTerminal = utils.setupTerminal(pretextTerminal);
            pretextTerminal.sendText("pretext view " + qpSelection.label);
          } else {
            runPretext(ptxExec, "view", qpSelection.label);
          }
          // Move selected target to front of list for next command.
          targetSelection = targetSelection.filter(
            (item) => item !== qpSelection
          );
          targetSelection.unshift(qpSelection);
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.viewCodeChat", () => {
      if (vscode.extensions.getExtension("CodeChat.codechat")) {
        vscode.commands.executeCommand("extension.codeChatActivate");
      } else {
        vscode.window.showErrorMessage(
          "Unable to start CodeChat preview.  Is the 'CodeChat' extension and CodeChat_Server (through pip) installed?"
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.new", () => {
      let viewCommand = [];
      for (let template of ["article", "book", "slideshow", "demo"]) {
        viewCommand.push({
          label: template,
          description: "New " + template,
        });
      }
      // Show choice dialog and pass correct command to runPretext based on selection.
      vscode.window.showQuickPick(viewCommand).then((qpSelection) => {
        if (!qpSelection) {
          return;
        }
        vscode.window
          .showOpenDialog({
            openLabel: "Select folder that will hold your project...",
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
          })
          .then((fileUri) => {
            if (fileUri && fileUri[0]) {
              var projectFolder = fileUri[0].fsPath;
              console.log("Selected folder: ", projectFolder);
              runThenOpen(ptxExec, "new", qpSelection.label, projectFolder);
            }
          });
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "pretext-tools.deploy",
      (runInTerminal: boolean = false) => {
        if (runInTerminal) {
          pretextTerminal = utils.setupTerminal(pretextTerminal);
          pretextTerminal.sendText("pretext deploy");
        } else {
          runPretext(ptxExec, "deploy", "-u");
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.updatePTX", () => {
      console.log("Updating PreTeXt");
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
        },
        (progress) => {
          progress.report({ message: "Checking for updates" });

          return new Promise<void>((resolve) => {
            console.log("Checking for new version of PreTeXt to install");
            pretextOutputChannel.append(
              "Checking for new version of PreTeXt to install"
            );
            try {
              utils.installPretext(progress);
            } catch {
              console.log("Unable to update pretext");
            }
            progress.report({ message: "Done" });
            resolve();
          });
        }
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.refreshTargets", () => {
      pretextOutputChannel.append("Refreshing target list.");
      console.log("Refreshing target list.");
      targetSelection = utils.getTargets();
      console.log(
        "Targets are now:" +
          targetSelection.map(function (obj) {
            return " " + obj.label;
          })
      );
      vscode.window.showInformationMessage(
        "Refreshed list of targets.  Targets are now:" +
          targetSelection.map(function (obj) {
            return " " + obj.label;
          })
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "pretext-tools.selectPretextCommand",
      (runInTerminal: boolean = false) => {
        // Switch commands between modes:
        if (runInTerminal) {
          for (let command of pretextCommandList) {
            command.label = command.label.replace(" (terminal)", "");
            command.label = command.label + " (terminal)";
          }
          pretextCommandList[pretextCommandList.length - 1] = {
            label: "Run commands in quiet mode",
            description: "(default mode)",
            command: "pretext-tools.selectPretextCommand",
          };
        } else {
          for (let command of pretextCommandList) {
            command.label = command.label.replace(" (terminal)", "");
            pretextCommandList[pretextCommandList.length - 1] = {
              label: "Run commands in terminal mode",
              description: "Use to debug a failed command",
              command: "pretext-tools.selectPretextCommand",
            };
          }
        }
        // Open quickpick and execute command
        vscode.window.showQuickPick(pretextCommandList).then((qpSelection) => {
          if (!qpSelection) {
            return;
          }
          if (qpSelection.command === "pretext-tools.selectPretextCommand") {
            vscode.commands.executeCommand(qpSelection.command, !runInTerminal);
          } else {
            vscode.commands.executeCommand(qpSelection.command, runInTerminal);
          }
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.convertToPretext", () => {
      console.log("Converting to PreTeXt");
      pretextOutputChannel.append("Converting to PreTeXt");
      // show quick pick to select whether to convert with pandoc or plastex
      vscode.window
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
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.latexToPretext", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.selection;
        const selectionRange = selection.isEmpty
          ? editor.document.lineAt(selection.start.line).range
          : new vscode.Range(selection.start, selection.end);

        var initialText = editor.document.getText(selectionRange);

        var newText = latexToPretext(initialText);

        editor.edit((editbuilder) => {
          editbuilder.replace(selectionRange, newText);
        });
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.test", async () => {
      console.log("Running Experiment");
      // const editor = vscode.window.activeTextEditor;
      // const document = editor?.document;
      // const position = editor?.selection.active;
      // if (document) {
      //   let labels = await utils.getReferences();
      //   console.log("Found labels: ", labels);
      // }
      // if (position) {
      //   const textUntilPosition = document?.getText(
      //     new vscode.Range(new vscode.Position(0, 0), position)
      //   );
      //   const openedTags = (
      //     textUntilPosition?.match(/<(\w)+(?![^>]*\/>)/g) || []
      //   ).map((tag) => tag.slice(1));
      //   const closedTags = (textUntilPosition?.match(/<\/\w+/g) || []).map(
      //     (tag) => tag.slice(2)
      //   );
      //   const unclosedTags = openedTags.filter(
      //     (tag) =>
      //       openedTags.filter(x => x === tag).length > closedTags.filter(x => x === tag).length
      //   );
      //   const currentTag = unclosedTags[unclosedTags.length - 1];
      //   console.log("Current XML Element: ", currentTag);
      // }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (pretextTerminal) {
    pretextTerminal.dispose();
  }
}
