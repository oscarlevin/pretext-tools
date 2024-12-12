import { window } from "vscode";
import * as utils from "../utils";
import { runPretext } from "./runPtx";
import {
  lastTarget,
  pretextTerminal,
  setTopCommand,
  updateLastTarget,
} from "../ui";
import { cli } from "../cli";

export function cmdBuildFile(runInTerminal: boolean = false) {
  // get the active text editor's file name
  let activeEditor = window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  // Examine current file to see if it has <pretext> as its root element.
  // If not, exit with warning.
  let docText = activeEditor.document.getText();
  if (!docText.includes("<pretext")) {
    window.showErrorMessage(
      "This file does not appear to be a valid complete PreTeXt file. Please open a valid PreTeXt file."
    );
    return;
  }
  let fileName = activeEditor.document.fileName;
  console.log(`Filename:`, fileName);
  if (runInTerminal) {
    let terminal = utils.setupTerminal(pretextTerminal);
    terminal.sendText("pretext build " + fileName);
  } else {
    runPretext(cli.cmd(), "build", fileName);
  }
}


export function cmdBuildAny(runInTerminal: boolean = false) {
  let targetSelection = cli.targets();
  // Show choice dialog and pass correct command to runPretext based on selection.
  window.showQuickPick(targetSelection).then((qpSelection) => {
    if (!qpSelection) {
      return;
    }
    if (runInTerminal) {
      let terminal = utils.setupTerminal(pretextTerminal);
      terminal.sendText("pretext build " + qpSelection.label);
    } else {
      runPretext(cli.cmd(), "build", qpSelection.label);
    }
    updateLastTarget(qpSelection.label);
    setTopCommand("Build " + lastTarget);
  });
}

export function cmdBuildLast(runInTerminal: boolean = false) {
  if (runInTerminal) {
    let terminal = utils.setupTerminal(pretextTerminal);
    terminal.sendText("pretext build");
  } else {
    runPretext(cli.cmd(), "build", lastTarget);
  }
}

export function cmdGenerate(runInTerminal: boolean = false) {
  let targetSelection = cli.targets();
  // Show choice dialog and pass correct command to runPretext based on selection.
  window.showQuickPick(targetSelection).then((qpSelection) => {
    if (!qpSelection) {
      return;
    }
    if (runInTerminal) {
      let terminal = utils.setupTerminal(pretextTerminal);
      terminal.sendText("pretext generate -t " + qpSelection.label);
    } else {
      runPretext(cli.cmd(), "generate -t", qpSelection.label);
    }
    // Move selected target to front of list for next command.
    targetSelection = targetSelection.filter((item) => item !== qpSelection);
    targetSelection.unshift(qpSelection);
  });
}
