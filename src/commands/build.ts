import { Terminal, window } from "vscode";
import * as utils from "../utils";
import { ptxExec } from "../utils";
import { runPretext } from "./runPtx";
import {
  lastTarget,
  pretextTerminal,
  setTopCommand,
  updateLastTarget,
} from "../ui";

export function cmdBuildAny(
  runInTerminal: boolean = false,
  targetSelection: any[] = []
) {
  // Show choice dialog and pass correct command to runPretext based on selection.
  window.showQuickPick(targetSelection).then((qpSelection) => {
    if (!qpSelection) {
      return;
    }
    if (runInTerminal) {
      let terminal = utils.setupTerminal(pretextTerminal);
      console.log(terminal.state);
      terminal.sendText("pretext build " + qpSelection.label);
    } else {
      runPretext(ptxExec, "build", qpSelection.label);
    }
    updateLastTarget(qpSelection.label);
    setTopCommand("Build " + lastTarget);
  });
}

export function cmdBuildLast(
  runInTerminal: boolean = false,
  lastTarget: string = ""
) {
  if (runInTerminal) {
    let terminal = utils.setupTerminal(pretextTerminal);
    terminal.sendText("pretext build");
  } else {
    runPretext(ptxExec, "build", lastTarget);
  }
}

export function cmdGenerate(
  runInTerminal: boolean = false,
  targetSelection: any[] = []
) {
  // Show choice dialog and pass correct command to runPretext based on selection.
  window.showQuickPick(targetSelection).then((qpSelection) => {
    if (!qpSelection) {
      return;
    }
    if (runInTerminal) {
      let terminal = utils.setupTerminal(pretextTerminal);
      terminal.sendText("pretext generate -t " + qpSelection.label);
    } else {
      runPretext(ptxExec, "generate -t", qpSelection.label);
    }
    // Move selected target to front of list for next command.
    targetSelection = targetSelection.filter((item) => item !== qpSelection);
    targetSelection.unshift(qpSelection);
  });
}
