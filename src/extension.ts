// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { execSync, spawn } from "child_process";
import { homedir } from "os";
import * as path from "path";
import * as vscode from "vscode";
import { convertToPretext } from "./pandocConvert";
import { latexToPretext } from "./latextopretext";
import { formatPTX } from "./formatter";

// Set up vscode elements
let pretextOutputChannel: vscode.OutputChannel;
let pretextStatusBarItem: vscode.StatusBarItem;
let pretextTerminal: vscode.Terminal;
var lastTarget = "";
// list of pretext commands
var pretextCommandList = [
  {
    label: "Build default target",
    description: "",
    command: "pretext-tools.buildLast",
  },
  {
    label: "Build another target...",
    description: "select target",
    command: "pretext-tools.buildAny",
  },
  {
    label: "View",
    description: "Select target to view",
    command: "pretext-tools.view",
  },
  {
    label: "Deploy",
    description: "to GitHub Pages",
    command: "pretext-tools.deploy",
  },
  {
    label: "Refresh targets",
    description: "Refresh the list of targets",
    command: "pretext-tools.refreshTargets",
  },
  {
    label: "Convert to PreTeXt",
    description: "Convert from other formats using Pandoc",
    command: "pretext-tools.convert",
  },
  {
    label: "Run commands in terminal",
    description: "Use to debug a failed command",
    command: "pretext-tools.selectPretextCommand",
  },
];

function setupTerminal(terminal: vscode.Terminal): vscode.Terminal {
  if (!terminal) {
    terminal = vscode.window.createTerminal("PreTeXt Terminal");
  }
  terminal.show();
  return terminal;
}
// Utility functions (eventually move to separate file)
function getDir(myPath: string = "") {
  if (myPath !== "") {
    console.log("Dir ", myPath, " passed as argument");
    return myPath;
  }
  if (vscode.workspace.workspaceFolders !== undefined) {
    myPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    console.log("Dir ", myPath, " set by worksapce folder");
    return myPath;
  } else if (vscode.window.activeTextEditor !== undefined) {
    myPath = path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
    console.log("Dir ", myPath, " set by active text editor");
    return myPath;
  } else {
    console.log("No active editor or workspace folder.");
    vscode.window
      .showOpenDialog({
        openLabel: "Select root folder of your project...",
        canSelectMany: false,
        canSelectFiles: false,
        canSelectFolders: true,
      })
      .then((fileUri) => {
        if (fileUri && fileUri[0]) {
          console.log("Selected file: " + fileUri[0].fsPath);
          return fileUri[0].fsPath;
        }
      });
    return "";
  }
}

async function installPretext(progress: vscode.Progress<{}>) {
  // Here we will attempt to pip install pretext, upgraded to the most recent version.  This will happen if pretext is not found, or if a user requests it through a command.

  // first check for python and pip:
  let pythonExec = "";
  for (let command of ["python3", "python"]) {
    try {
      let pythonVersion = execSync(command + " --version").toString();
      console.log("Python version result: ", pythonVersion);
      if (pythonVersion.toLowerCase().includes("python 2")) {
        throw new Error(command + " is python 2");
      }
      pythonExec = command;
    } catch (err) {
      console.log("Error: ", err);
    }
  }
  progress.report({ message: "Checking pip version" });
  let pipExec = "";
  for (let command of ["pipx", "pip3", "pip"]) {
    try {
      let pipVersion = execSync(command + " --version").toString();
      console.log("pip version result: ", pipVersion);
      pipExec = command;
    } catch (err) {
      console.log("Error: ", err);
    }
  }
  if (pythonExec === "") {
    vscode.window.showErrorMessage(
      "You do not appear to have python installed.  Please download and install python (and make sure to add python to your path)."
    );
  }
  // Now try to install pretext (using 1.0 command):
  progress.report({ message: "Installing pretext" });
  try {
    if (pipExec === "pipx") {
      execSync(pipExec + " install pretext");
    }
    execSync(pythonExec + " -m " + "pip" + " install --upgrade pretext");
    vscode.window.showInformationMessage(
      "Successfully installed or upgraded pretext.",
      "Dismiss"
    );
  } catch (err) {
    vscode.window.showErrorMessage(
      "Unable to install PreTeXt using pip.  Please see the pretext documentation for further assistance.",
      "Dismiss"
    );
    console.log(err);
    throw new Error("Installation failed");
  }
  progress.report({ message: "Done" });
}

function getPtxExec() {
  // Here we will try to guess the name of the pretext command, be it `pretext`, `python -m pretext`, or `python3 -m pretext`.
  let ptxExec = "";
  for (let command of ["pretext", "python -m pretext", "python3 -m pretext"]) {
    try {
      let ptxVersion = execSync(command + " --version").toString();
      console.log("Using PreTeXt version", ptxVersion);
      return command;
    } catch (err) {
      console.log(command + " not found");
    }
  }
  if (
    ptxExec === "" &&
    vscode.workspace.getConfiguration("pretext-tools").get("installPretext")
  ) {
    vscode.window
      .showWarningMessage(
        "It doesn't look like you have pretext installed.  Would you like to try to install it now?",
        "Yes",
        "No",
        "No (stop asking)"
      )
      .then((option) => {
        if (option === "Yes") {
          try {
            vscode.commands.executeCommand("pretext-tools.updatePTX");
            console.log("Finished attempting to install PreTeXt");
            return getPtxExec();
          } catch (err) {
            console.log("Unable to install PreTeXt.  Error: ", err);
          }
        } else if (option === "No (stop asking)") {
          vscode.workspace
            .getConfiguration("pretext-tools")
            .update("installPretext", false);
        }
      });
  }
  return ptxExec;
}

export const ptxExec: string = getPtxExec();

function getTargets() {
  // Define a constant that holds the names of targets listed in project.ptx
  // execSync returns stdout from executing the command.  We then convert to a string, split on new lines, and remove any blanks, to create an array of the target names.
  // See also https://stackoverflow.com/questions/41001360/saving-the-output-of-a-child-process-in-a-variable-in-the-parent-in-nodejs
  let filePath = getDir();
  try {
    let targets = execSync(ptxExec + " --targets", { cwd: filePath })
      .toString()
      .split(/\r?\n/)
      .filter(Boolean);
    // Set up dictionary for quickselect:
    let targetSelection = [];
    for (let target of targets) {
      targetSelection.push({
        label: target,
        description: "Build source as " + target,
      });
    }
    return targetSelection;
  } catch (err) {
    console.log("getTargets() Error: \n", err);
    return [];
  }
}

// export const targetNames:string[] = getTargets();

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
        updateStatusBarItem("running");
        var progressUpdate = "Starting up...";
        const interval = setInterval(
          () => progress.report({ message: progressUpdate }),
          1000
        );
        let fullCommand = ptxExec + " " + ptxCommand + " " + ptxOptions;
        let status = "ready"; //for statusbaritem
        var filePath = getDir(passedPath);
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
              updateStatusBarItem("success");
              resolve();
              clearInterval(interval);
            } else if (
              data.toString().startsWith("error") ||
              data.toString().startsWith("critical")
            ) {
              // Update `lastError` so it will show the final error from running pretext
              pretextOutputChannel.append(`${data}`);
              lastError = `${data}`;
              status = "error";
            } else if (
              data.toString().includes(`pretext view`) &&
              ptxCommand === "build"
            ) {
              vscode.window
                .showInformationMessage(
                  "Build successful!",
                  "View output",
                  "View log",
                  "Dismiss"
                )
                .then((option) => {
                  if (option === "View output") {
                    vscode.commands.executeCommand("pretext-tools.view");
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
            updateStatusBarItem(status);
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

function setSchema(schemaPath: string = "") {
  if (schemaPath === "") {
    const userHomeDir: string = homedir();
    const schemaConfig = vscode.workspace
      .getConfiguration("pretext-tools")
      .get("schemaVersion");
    console.log(schemaConfig);
    switch (schemaConfig) {
      case "Stable":
        var schemaPath = path.join(
          userHomeDir,
          ".ptx",
          "schema",
          "pretext.rng"
        );
        break;
      case "Experimental":
        var schemaPath = path.join(
          userHomeDir,
          ".ptx",
          "schema",
          "pretext-dev.rng"
        );
        break;
    }
  }
  const configuration = vscode.workspace.getConfiguration("xml");
  let schemas: any = configuration.get("fileAssociations");
  for (let dicts of schemas) {
    if (dicts["pattern"] === "**/source/**.ptx") {
      console.log("The value of your setting is", dicts);
      dicts["systemId"] = schemaPath;
      break;
    }
  }
  console.log("Configuration is now: ", schemas);
  configuration.update("fileAssociations", schemas);
}

function updateStatusBarItem(state?: string): void {
  pretextStatusBarItem.show();
  if (state === "ready" || state === undefined) {
    pretextStatusBarItem.text = `$(debug-run) PreTeXt`;
    pretextStatusBarItem.tooltip = `Run PreTeXt command`;
    pretextStatusBarItem.command = `pretext-tools.selectPretextCommand`;
  } else if (state === "running") {
    pretextStatusBarItem.text = `$(loading~spin) PreTeXt`;
    pretextStatusBarItem.tooltip = `running pretext ... (click for log)`;
    pretextStatusBarItem.command = `pretext-tools.showLog`;
  } else if (state === "success") {
    pretextStatusBarItem.text = `$(pass) PreTeXt`;
    pretextStatusBarItem.tooltip = `Success!`;
    pretextStatusBarItem.command = `pretext-tools.selectPretextCommand`;
  } else if (state === "error") {
    pretextStatusBarItem.text = `$(warning) PreTeXt`;
    pretextStatusBarItem.tooltip = `Something went wrong; click for log`;
    pretextStatusBarItem.command = `pretext-tools.showLog`;
  }
}

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "pretext-tools" is now active!');
  setSchema();

  // Set up vscode elements
  pretextOutputChannel = vscode.window.createOutputChannel(
    "PreTeXt Tools",
    "log"
  );

  pretextStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -100
  );
  context.subscriptions.push(pretextStatusBarItem);
  updateStatusBarItem();

  const activeEditor = vscode.window.activeTextEditor;
  console.log(activeEditor?.document.fileName);

  console.log("PreTeXt exec command: ", ptxExec);
  // set ptxInstalled variable to whether ptx is installed
  let ptxInstalled = ptxExec !== "";
  console.log("Pretext is installed is:", ptxInstalled);

  var targetSelection = getTargets();
  lastTarget = targetSelection[0].label;
  pretextCommandList[0].label = "Build " + lastTarget;
  console.log(
    "Targets are now:" +
      targetSelection.map(function (obj) {
        return " " + obj.label;
      })
  );

  // Formatter:
  vscode.languages.registerDocumentFormattingEditProvider("pretext", {
    provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): vscode.TextEdit[] {
      return formatPTX(document);
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.showLog", () => {
      pretextOutputChannel.show();
      updateStatusBarItem();
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
            pretextTerminal = setupTerminal(pretextTerminal);
            console.log(pretextTerminal.state);
            pretextTerminal.sendText("pretext build " + qpSelection.label);
          } else {
            runPretext(ptxExec, "build", qpSelection.label);
          }
          // Move selected target to front of list for next command.
          // targetSelection = targetSelection.filter(
          //   (item) => item !== qpSelection
          // );
          // targetSelection.unshift(qpSelection);
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
          pretextTerminal = setupTerminal(pretextTerminal);
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
            pretextTerminal = setupTerminal(pretextTerminal);
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
          if (vscode.extensions.getExtension("ms-vscode.live-server")) {
            viewMethods.push({
              label: "Use Live Preview",
              command: "pretext-tools.viewLivePreview",
            });
          }
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
            case "Live Preview":
              vscode.commands.executeCommand("pretext-tools.viewLivePreview");
              break;
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
            pretextTerminal = setupTerminal(pretextTerminal);
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
    vscode.commands.registerCommand("pretext-tools.viewLivePreview", () => {
      if (vscode.extensions.getExtension("ms-vscode.live-server")) {
        let uri = vscode.Uri.file(
          path.join(getDir(), "output", "web", "index.html")
        );
        vscode.commands.executeCommand("livePreview.start.preview.atFile", uri);
      } else {
        vscode.window.showErrorMessage(
          "Unable to start Live Preview.  Is the 'Live Preview' extension installed?"
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
          pretextTerminal = setupTerminal(pretextTerminal);
          pretextTerminal.sendText("pretext deploy");
        } else {
          runPretext(ptxExec, "deploy", "");
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
              installPretext(progress);
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
      targetSelection = getTargets();
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
      convertToPretext();
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("pretext-tools.latexToPretext", () => {
      const editor = vscode.window.activeTextEditor;
      //     const { document } = activeTextEditor;
      // const firstLine = document.lineAt(0);

      // if (firstLine.text !== '42') {
      //   const edit = new vscode.WorkspaceEdit();
      //   edit.insert(document.uri, firstLine.range.start, '42\n');

      //   return vscode.workspace.applyEdit(edit);
      // }

      if (editor) {
        const selection = editor.selection;
        const selectionRange = new vscode.Range(selection.start, selection.end);

        var initialText = editor.document.getText(selectionRange);

        var newText = latexToPretext(initialText);

        editor.edit((editbuilder) => {
          editbuilder.replace(selectionRange, newText);
        });
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (pretextTerminal) {
    pretextTerminal.dispose();
  }
}
