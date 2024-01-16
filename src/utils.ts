import { execSync } from "child_process";
import { homedir } from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

export {
  getDir,
  installPretext,
  ptxExec,
  getTargets,
  setSchema,
  updateStatusBarItem,
  setupTerminal,
};

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

function getSourceDir() {
  let dir = getDir();
  dir = path.join(dir, "source");
  if (fs.existsSync(dir)) {
    return dir;
  } else {
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

const ptxExec = getPtxExec();

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
    if (targets.length > 0) {
      let targetSelection = [];
      for (let target of targets) {
        targetSelection.push({
          label: target,
          description: "Build source as " + target,
        });
      }
      return targetSelection;
    } else {
      return [
        {
          label: "No PreTeXt project found.",
          description: "Change to directory containing a project.ptx file.",
        },
      ];
    }
  } catch (err) {
    console.log("getTargets() Error: \n", err);
    return [];
  }
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

function updateStatusBarItem(
  ptxSBItem: vscode.StatusBarItem,
  state?: string
): void {
  ptxSBItem.show();
  if (state === "ready" || state === undefined) {
    ptxSBItem.text = `$(debug-run) PreTeXt`;
    ptxSBItem.tooltip = `Run PreTeXt command`;
    ptxSBItem.command = `pretext-tools.selectPretextCommand`;
  } else if (state === "running") {
    ptxSBItem.text = `$(loading~spin) PreTeXt`;
    ptxSBItem.tooltip = `running pretext ... (click for log)`;
    ptxSBItem.command = `pretext-tools.showLog`;
  } else if (state === "success") {
    ptxSBItem.text = `$(pass) PreTeXt`;
    ptxSBItem.tooltip = `Success!`;
    ptxSBItem.command = `pretext-tools.selectPretextCommand`;
  } else if (state === "error") {
    ptxSBItem.text = `$(warning) PreTeXt`;
    ptxSBItem.tooltip = `Something went wrong; click for log`;
    ptxSBItem.command = `pretext-tools.showLog`;
  }
}

function setupTerminal(terminal: vscode.Terminal): vscode.Terminal {
  if (!terminal) {
    terminal = vscode.window.createTerminal("PreTeXt Terminal");
  }
  terminal.show();
  return terminal;
}
type LabelArray = [string, string, string][];

export async function getReferences(): Promise<LabelArray> {
  // Look through all files in project directory and collect all labels contained as xml:id attributes.
  let labels: LabelArray = [];
  let sourceDir = getSourceDir();
  console.log("Looking for labels in ", sourceDir);
  const uri = vscode.Uri.file(sourceDir);
  let files = await vscode.workspace.fs.readDirectory(uri);
  for (const [file, type] of files) {
    if (type === vscode.FileType.File) {
      let fileAbsolutePath = path.join(sourceDir, file);
      let document = await vscode.workspace.openTextDocument(fileAbsolutePath);
      let text = document.getText();
      let regex = /<(\w*?)\s(.*?)xml:id="([^"]+)"/g;
      let matches = [...text.matchAll(regex)];
      labels = labels.concat(
        matches.map((match) => [match[3], match[1], document.fileName])
      );
    }
  }
  console.log("Finished collecting labels");
  return labels;
}

export function updateReferences(
  document: vscode.TextDocument,
  labels: LabelArray
) {
  console.log("Updating references");
  // Look through the specified file collect all labels contained as xml:id attributes.
  // This can then be used to update the current list of references every time a file is saved.
  let fileContents = document.getText();
  let regex = /<(\w*?)\s(.*?)xml:id="([^"]+)"/g;
  let matches = [...fileContents.matchAll(regex)];
  // Remove all (old) labels from the current file:
  labels = labels.filter((label) => label[2] !== document.fileName);
  // Add all (new) labels from the current file:
  labels = labels.concat(
    matches.map((match) => [match[3], match[1], document.fileName])
  );
  console.log("Done updating labels");
  return labels;
}
