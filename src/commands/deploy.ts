import { Terminal } from "vscode";
import * as utils from "../utils";
import { runPretext } from "./runPtx";

export function cmdDeploy(
  runInTerminal: boolean = false,
  pretextTerminal: Terminal | null = null
) {
  if (runInTerminal) {
    pretextTerminal = utils.setupTerminal(pretextTerminal);
    pretextTerminal.sendText("pretext deploy");
  } else {
    runPretext(utils.ptxExec, "deploy", "-u");
  }
}
