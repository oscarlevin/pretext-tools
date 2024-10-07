import { execSync } from "child_process";
import { homedir } from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { SpellCheckScope } from "./types";
import { fromXml } from "xast-util-from-xml";
import { Schema } from "./lsp-server/schema";

export {
  getDir,
  installPretext,
  ptxExec,
  getTargets,
  setSchema,
  setSpellCheckConfig,
  updateStatusBarItem,
  setupTerminal,
  stripColorCodes,
  experiment,
};

async function experiment(context: vscode.ExtensionContext) {
  return;
}

function getDir(myPath: string = "") {
  if (myPath !== "") {
    console.log("Dir ", myPath, " passed as argument");
    return myPath;
  }
  if (vscode.workspace.workspaceFolders !== undefined) {
    myPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    console.log("Dir ", myPath, " set by workspace folder");
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
  let pythonExec = getPythonExec();
  if (pythonExec === undefined) {
    vscode.window.showErrorMessage(
      "Unable to install PreTeXt without python.  Please install python and try again."
    );
    return;
  }
  progress.report({ message: "Checking pip version" });
  let pipExec = "";
  for (let command of ["pipx", "pip"]) {
    try {
      let pipVersion = execSync(
        pythonExec + " -m " + command + " --version"
      ).toString();
      console.log("pip version result: ", pipVersion);
      pipExec = command;
      break;
    } catch (err) {
      console.log("Error: ", err);
    }
  }
  // Now try to install pretext (using 1.0 command):
  progress.report({ message: "Installing pretext" });
  try {
    if (pipExec === "pipx") {
      execSync(pipExec + " install pretext");
    } else {
      execSync(pythonExec + " -m " + "pip" + " install --upgrade pretext");
      vscode.window.showInformationMessage(
        "Successfully installed or upgraded pretext.",
        "Dismiss"
      );
    }
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

/**
 * Get python command, either from settings or by verifying python3 or python is on PATH
 */
function getPythonExec() {
  let pythonExec = vscode.workspace
    .getConfiguration("pretext-tools")
    .get("pythonPath");
  console.log("Python path from settings: ", pythonExec);
  if (pythonExec === "") {
    for (let command of ["python3", "python"]) {
      try {
        let pythonVersion = execSync(command + " --version").toString();
        console.log("Python version result: ", pythonVersion);
        if (pythonVersion.toLowerCase().includes("python 2")) {
          throw new Error(command + " is python 2");
        }
        pythonExec = command;
        break;
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  } else {
    try {
      let pythonVersion = execSync(pythonExec + " --version").toString();
      console.log("Python version result: ", pythonVersion);
      if (pythonVersion.toLowerCase().includes("python 2")) {
        throw new Error(pythonExec + " is python 2");
      }
    } catch (err) {
      console.log("Error: ", err);
      vscode.window.showErrorMessage(
        "The path to python provided in settings does not appear to be a valid python 3 executable.  Please provide a valid path to python."
      );
      pythonExec = "";
    }
  }
  if (pythonExec === "") {
    vscode.window.showErrorMessage(
      "You do not appear to have python installed.  Please download and install python (and make sure it is added to your PATH)."
    );
    return undefined;
  }
  return pythonExec;
}

function getPtxExec() {
  let pythonExec = getPythonExec();
  if (pythonExec === undefined) {
    vscode.window.showErrorMessage(
      "Unable to run PreTeXt without python.  Please install python and try again."
    );
  } else {
    console.log("Using python at ", pythonExec);
    let ptxCommand = pythonExec + " -m pretext";
    try {
      let ptxVersion = execSync(ptxCommand + " --version").toString();
      console.log("Using PreTeXt version", ptxVersion);
      return ptxCommand;
    } catch (err) {
      console.log(ptxCommand + " not found");
    }
  }
  // If the above did not work, then either pretext has been installed with pipx, is not yet installed, or python is not available in the usual place, so we try a last ditch effort to find it.
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

function getPtxVersion() {
  let ptxVersion = "version unknown";
  try {
    ptxVersion = execSync(ptxExec + " --version")
      .toString()
      .trim();
    if (ptxVersion.includes("\n")) {
      ptxVersion = ptxVersion.split("\n")[-1];
    }
    console.log("Using PreTeXt version", ptxVersion);
  } catch (err) {
    console.log("Error: ", err);
  }
  return ptxVersion;
}

const ptxExec = getPtxExec();
const ptxVersion = getPtxVersion();

/**
 * Get list of targets from project.ptx file
 * @returns Array of target names
*/
function getTargets() {
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
        // exclude lines that start with "Generated" as these are not targets
        if (!target.includes("Generated")) {
          targetSelection.push({
            label: target,
            description: "Build source as " + target,
          });
        }
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

function setSpellCheckConfig() {
  const cSpellConfig = vscode.workspace.getConfiguration("cSpell");
  // Now update which scopes should be checked or ignored for spell checking.
  const spellCheckScopes: SpellCheckScope | undefined = vscode.workspace
    .getConfiguration("pretext-tools")
    .get("spellCheck.checkErrorsInsideScope");
  console.log(
    "Current value of spellCheck.checkErrorsInsideScope is",
    spellCheckScopes
  );
  let ignorePatterns: string[] = [];
  if (spellCheckScopes) {
    if (spellCheckScopes.comments === "Ignore") {
      ignorePatterns.push("<!--.*?-->");
    }
    if (spellCheckScopes.inlineMath === "Ignore") {
      ignorePatterns.push("<m>.*?</m>");
    }
    if (spellCheckScopes.displayMath === "Ignore") {
      ignorePatterns.push(
        "<(me|men|md|mdn)>(.|\n|\r|\n\r)*?</(me|men|md|mdn)>"
      );
    }
    if (spellCheckScopes.inlineCode === "Ignore") {
      ignorePatterns.push("<c>.*?</c>");
    }
    if (spellCheckScopes.blockCode === "Ignore") {
      ignorePatterns.push(
        "<(program|sage|pre)>(.|\n|\r|\n\r)*?</(program|sage|pre)>"
      );
    }
    if (spellCheckScopes.latexImage === "Ignore") {
      ignorePatterns.push("<latex-image>(.|\n|\r|\n\r)*?</latex-image>");
    }
    if (spellCheckScopes.tags === "Ignore") {
      ignorePatterns.push("<[^!].*?>");
    }
  }
  // Get current languageSettings for cSpell and update those for pretext
  let languageSettings: any = cSpellConfig.get("languageSettings");
  for (let dicts of languageSettings) {
    if (dicts["languageId"] === "pretext") {
      console.log("Current value of languageSettings for Pretext is", dicts);
      dicts["ignoreRegExpList"] = ignorePatterns;
      break;
    }
  }
  console.log("Updated languageSettings for Pretext to", languageSettings);
  cSpellConfig.update("languageSettings", languageSettings);
}

function setSchema() {
  let schemaPath: string | undefined = vscode.workspace
    .getConfiguration("pretext-tools")
    .get("schema.customPath");
  if (schemaPath === "") {
    const userHomeDir: string = homedir();
    const schemaConfig = vscode.workspace
      .getConfiguration("pretext-tools")
      .get("schema.versionName");
    // set schema folder based on ptxVersion number:
    //  - < 2.5, use userHomeDir/.ptx/schema/
    //  - >= 2.5, use userHomeDir/.ptx/{ptxVersion}/core/schema/
    let schemaDir: string;
    if (parseFloat(ptxVersion) < 2.5) {
      schemaDir = path.join(userHomeDir, ".ptx", "schema");
    } else {
      schemaDir = path.join(userHomeDir, ".ptx", ptxVersion, "core", "schema");
    }
    switch (schemaConfig) {
      case "Stable":
        schemaPath = path.join(schemaDir, "pretext.rng");
        break;
      case "Experimental":
        schemaPath = path.join(schemaDir, "pretext-dev.rng");
        break;
      case "Custom":
        console.log(
          "Selected custom schema, but no path provided.  Setting to default."
        );
        schemaPath =
          "https://raw.githubusercontent.com/PreTeXtBook/pretext/master/schema/pretext.rng";
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
  console.log("Schema set to: ", schemaPath);
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
    ptxSBItem.tooltip = `Run PreTeXt command (version ${ptxVersion})`;
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

function setupTerminal(terminal: vscode.Terminal|null): vscode.Terminal {
  if (!terminal) {
    terminal = vscode.window.createTerminal("PreTeXt Terminal");
  }
  terminal.show();
  return terminal;
}

function stripColorCodes(input: string): string {
  // ANSI color code regex
  const regex = /\x1B\[[0-9;]*m/g;
  return input.replace(regex, "");
}
