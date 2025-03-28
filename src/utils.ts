import { execSync } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { SpellCheckScope } from "./types";
import { cli } from "./cli";

export {
  getProjectFolder,
  installPretext,
  setSchema,
  setSpellCheckConfig,
  updateStatusBarItem,
  setupTerminal,
  stripColorCodes,
  experiment,
};

async function experiment() {
  return;
}

/**
 * Looks up the directory tree for a directory that contains a "project.ptx" folder, and returns that path, or null if no such folder exists.
 * @param path: the path of the directory to start looking in
 * @returns null if no project.ptx files is found above `path` or the path of the first parent that contains a project.ptx.
 */
function getProjectFolder(dirPath: string): string | null {
  if (dirPath === "/") {
    return null;
  } else if (fs.existsSync(path.join(dirPath, "project.ptx"))) {
    return dirPath;
  } else {
    return getProjectFolder(path.dirname(dirPath));
  }
}

async function installPretext(progress: vscode.Progress<{}>) {
  // Here we will attempt to pip install pretext, upgraded to the most recent version.  This will happen if pretext is not found, or if a user requests it through a command.

  // first check for python and pip:
  let pythonExec = cli.pythonPath();
  if (!pythonExec) {
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

//const ptxVersion = getPtxVersion();

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

function setSchema(context: vscode.ExtensionContext) {
  let schemaPath: string | undefined = vscode.workspace
    .getConfiguration("pretext-tools")
    .get("schema.customPath");
  let schemaVersion: string | undefined = vscode.workspace
    .getConfiguration("pretext-tools")
    .get("schema.versionName");
  if (schemaPath !== "" && schemaVersion !== "Custom") {
    console.warn(
      "Custom schema path provided, but version is not set to Custom.  Ignoring custom path."
    );
  }
  if (!schemaPath || !fs.existsSync(schemaPath)) {
    console.error(`Schema file not found at path: ${schemaPath}`);
    schemaPath = "";
  }
  if (schemaPath === "") {
    //get the extensions installed path:
    const extensionPath = context.extensionPath;
    console.log("Extension path is: ", extensionPath);
    let schemaDir = path.join(extensionPath, "assets", "schema");
    console.log("Schema directory is: ", schemaDir);
    const schemaConfig = vscode.workspace
      .getConfiguration("pretext-tools")
      .get("schema.versionName");
    switch (schemaConfig) {
      case "Stable":
        schemaPath = path.join(schemaDir, "pretext.rng");
        break;
      case "Experimental":
        schemaPath = path.join(schemaDir, "pretext-dev.rng");
        break;
      case "Custom":
        console.log(
          "Selected custom schema, but no valid path provided.  Setting to default."
        );
        schemaPath = path.join(schemaDir, "pretext.rng");
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

function setupTerminal(
  terminal: vscode.Terminal | null,
  projectPath?: string
): vscode.Terminal {
  if (!terminal) {
    terminal = vscode.window.createTerminal("PreTeXt Terminal", projectPath);
  }
  terminal.show();
  return terminal;
}

function stripColorCodes(input: string): string {
  // ANSI color code regex
  const regex = /\x1B\[[0-9;]*m/g;
  return input.replace(regex, "");
}
