// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { exec, execSync, spawn } from "child_process";
import * as path from "path";

import {
    activate as lspActivate,
    deactivate as lspDeactivate,
} from "./lsp-client/main";

var pretextOutputChannel = vscode.window.createOutputChannel("PreTeXt Tools");

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
        myPath = path.dirname(
            vscode.window.activeTextEditor.document.uri.fsPath
        );
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
    }
}

function installPretext() {
    // Here we will attempt to pip install pretext, upgraded to the most recent version.  This will happen if pretext is not found, or if a user requests it through a command.
    // first check for python and pip:
    console.log("inside installPretext().");
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
    let pipExec = "";
    for (let command of ["pip3", "pip"]) {
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
            "You do not appear to have python installed.  Please download and install python (and make sure to add python to your path."
        );
    }
    // Now try to install pretext (using 1.0 command):
    try {
        execSync(pythonExec + " -m " + pipExec + " install --upgrade pretext");
        vscode.window.showInformationMessage(
            "Successfully installed or upgraded pretext."
        );
    } catch (err) {
        vscode.window.showErrorMessage(
            "Unable to install PreTeXt using pip.  Please see the pretext documentation for further assistance."
        );
        console.log(err);
    }
}

function getPtxExec() {
    // Here we will try to guess the name of the pretext command, be it `pretext`, `python -m pretext`, or `python3 -m pretext`.
    let ptxExec = "";
    for (let command of [
        "pretext",
        "python -m pretext",
        "python3 -m pretext",
    ]) {
        try {
            let ptxVersion = execSync(command + " --version").toString();
            console.log("Using PreTeXt version", ptxVersion);
            return command;
        } catch (err) {
            console.log(command + " not found");
        }
    }
    if (ptxExec === "") {
        vscode.window.showWarningMessage(
            "It doesn't look like you have pretext installed.  We will now try to install it for you."
        );
        try {
            installPretext();
            ptxExec = getPtxExec();
        } catch (err) {
            console.log("Unable to install PreTeXt.  Error: ", err);
        }
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
    // var editor = vscode.window.activeTextEditor;
    // var fullName = path.normalize(editor.document.fileName);
    // var filePath = path.dirname(fullName);
    let fullCommand = ptxExec + " " + ptxCommand + " " + ptxOptions;
    var filePath = getDir(passedPath);
    console.log("cwd = " + filePath);
    if (filePath !== undefined && filePath !== ".") {
        pretextOutputChannel.show();
        pretextOutputChannel.append("Now running `" + fullCommand + "` ...\n");
        var process = spawn(fullCommand, [], { cwd: filePath, shell: true });
        // console.log("stdout:", proc.stdout);
        process.stderr.on("data", function (data) {
            console.log(`log: ${data}`);
            var outputLines = data.toString().split(/\r?\n/);
            for (const line of outputLines) {
                console.log(line + "\n");
                if (line.startsWith("http://localhost:")) {
                    pretextOutputChannel.append(line + "\n");
                    pretextOutputChannel.append(
                        "(this local server will remain running until you close vs code)\n"
                    );
                    return;
                } else {
                    pretextOutputChannel.append(line + "\n");
                }
                if (line.startsWith("error") || line.startsWith("critical")) {
                    vscode.window.showErrorMessage(line);
                    // } else if (line.startsWith("warning")) {
                    // 	vscode.window.showWarningMessage(line);
                } else if (line.startsWith("Success")) {
                    vscode.window.showInformationMessage(line);
                }
            }
        });

        process.on("exit", function (code) {
            console.log(code?.toString());
            pretextOutputChannel.appendLine("...PreTeXt command finished.");
        });
    }
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
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log(
        'Congratulations, your extension "pretext-tools" is now active!'
    );

    // Start the LSP
    lspActivate(context);

    console.log("PreTeXt exec command: ", ptxExec);
    var targetSelection = getTargets();
    console.log(
        "Targets are now:" +
            targetSelection.map(function (obj) {
                return " " + obj.label;
            })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.buildAny", () => {
            // Show choice dialog and pass correct command to runPretext based on selection.
            vscode.window.showQuickPick(targetSelection).then((qpSelection) => {
                if (!qpSelection) {
                    return;
                }
                runPretext(ptxExec, "build", qpSelection.label);
                // Move selected target to front of list for next command.
                targetSelection = targetSelection.filter(
                    (item) => item !== qpSelection
                );
                targetSelection.unshift(qpSelection);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.buildDefault", () => {
            runPretext(ptxExec, "build", "");
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.generate", () => {
            runPretext(ptxExec, "generate", "");
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.view", () => {
            // Show choice dialog and pass correct command to runPretext based on selection.
            vscode.window.showQuickPick(targetSelection).then((qpSelection) => {
                if (!qpSelection) {
                    return;
                }
                runPretext(ptxExec, "view", qpSelection.label);
                // Move selected target to front of list for next command.
                targetSelection = targetSelection.filter(
                    (item) => item !== qpSelection
                );
                targetSelection.unshift(qpSelection);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.viewWatch", () => {
            runPretext(ptxExec, "view", "--watch");
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.new", () => {
            let viewCommand = [];
            for (let template of ["article", "book", "slideshow"]) {
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
                        openLabel:
                            "Select folder that will hold your project...",
                        canSelectMany: false,
                        canSelectFiles: false,
                        canSelectFolders: true,
                    })
                    .then((fileUri) => {
                        if (fileUri && fileUri[0]) {
                            var projectFolder = fileUri[0].fsPath;
                            console.log("Selected folder: ", projectFolder);
                            runThenOpen(
                                ptxExec,
                                "new",
                                qpSelection.label,
                                projectFolder
                            );
                        }
                    });
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.deploy", () => {
            runPretext(ptxExec, "deploy", "");
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.updatePTX", () => {
            console.log("Checking for new version of PreTeXt to install");
            pretextOutputChannel.appendLine(
                "Checking for new version of PreTeXt to install"
            );
            installPretext();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pretext-tools.refresh", () => {
            pretextOutputChannel.appendLine("Refreshing target list.");
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
}

// this method is called when your extension is deactivated
export function deactivate() {
    lspDeactivate();
}
