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

export function cmdBuildAny(runInTerminal: boolean = false) {
  let targetSelection = cli.targets();
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
