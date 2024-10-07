import { window } from "vscode";
import { Terminal } from "vscode";
import * as utils from "../utils";
import { ptxExec } from "../utils";
import { runPretext } from "./runPtx";

export function ptxView(runInTerminal: boolean = false, pretextTerminal: Terminal | null = null, targetSelection: any[] = []) {
    // Show choice dialog and pass correct command to runPretext based on selection.
    window.showQuickPick(targetSelection).then((qpSelection) => {
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
      return undefined;
    });
  }