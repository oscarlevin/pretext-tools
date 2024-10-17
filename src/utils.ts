import { execSync } from "child_process";
import { homedir } from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { SpellCheckScope } from "./types";
import { fromXml } from "xast-util-from-xml";
import { Schema } from "./lsp-server/schema";
import { cli } from "./cli";

export {
  getDir,
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
  let pythonExec = cli.pythonPath();
  if (!pythonExec) {
    vscode.window.showErrorMessage(
      "Unable to install PreTeXt without python.  Please install python and try again.",
    );
    return;
  }
  progress.report({ message: "Checking pip version" });
  let pipExec = "";
  for (let command of ["pipx", "pip"]) {
    try {
      let pipVersion = execSync(
        pythonExec + " -m " + command + " --version",
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
        "Dismiss",
      );
    }
  } catch (err) {
    vscode.window.showErrorMessage(
      "Unable to install PreTeXt using pip.  Please see the pretext documentation for further assistance.",
      "Dismiss",
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
    spellCheckScopes,
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
        "<(me|men|md|mdn)>(.|\n|\r|\n\r)*?</(me|men|md|mdn)>",
      );
    }
    if (spellCheckScopes.inlineCode === "Ignore") {
      ignorePatterns.push("<c>.*?</c>");
    }
    if (spellCheckScopes.blockCode === "Ignore") {
      ignorePatterns.push(
        "<(program|sage|pre)>(.|\n|\r|\n\r)*?</(program|sage|pre)>",
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
          "Selected custom schema, but no path provided.  Setting to default.",
        );
        schemaPath = path.join(schemaDir, "pretext.rng");
        break;
    }
  }
  console.log("Schema set to: ", schemaPath);
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
  state?: string,
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

function setupTerminal(terminal: vscode.Terminal | null): vscode.Terminal {
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
