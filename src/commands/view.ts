import { commands, extensions, window, workspace } from "vscode";
import * as utils from "../utils";
import { runPretext } from "./runPtx";
import { pretextTerminal } from "../ui";
import { cli } from "../cli";

export function cmdView(runInTerminal: boolean = false) {
  const selectedViewMethod: string =
    workspace.getConfiguration("pretext-tools").get("viewMethod") || "Ask";
  // Create and use a quick-select box if user has not set a configuration for view:
  if (selectedViewMethod === "Ask") {
    let viewMethods = [];
    if (extensions.getExtension("CodeChat.codechat")) {
      viewMethods.push({
        label: "Use CodeChat",
        command: "pretext-tools.viewCodeChat",
      });
    }
    if (viewMethods.length > 0) {
      viewMethods.push({
        label: "Use PreTeXt's view command",
        command: "pretext-tools.viewCLI",
      });
      window.showQuickPick(viewMethods).then((qpSelection) => {
        if (!qpSelection) {
          return;
        }
        commands.executeCommand(qpSelection.command);
      });
    } else {
      commands.executeCommand("pretext-tools.viewCLI", runInTerminal);
    }
  } else {
    // otherwise honor the users setting choice.
    switch (selectedViewMethod) {
      case "CodeChat":
        commands.executeCommand("pretext-tools.viewCodeChat");
        break;
      case "PreTeXT-CLI View":
        commands.executeCommand("pretext-tools.viewCLI", runInTerminal);
        break;
    }
  }
}

export function cmdViewCLI(runInTerminal: boolean = false) {
  let targetSelection = cli.targets();
  // Show choice dialog and pass correct command to runPretext based on selection.
  window.showQuickPick(targetSelection).then((qpSelection) => {
    if (!qpSelection) {
      return;
    }
    if (runInTerminal) {
      let terminal = utils.setupTerminal(pretextTerminal);
      terminal.sendText("pretext view " + qpSelection.label);
    } else {
      runPretext(cli.cmd(), "view", qpSelection.label);
    }
    // Move selected target to front of list for next command.
    targetSelection = targetSelection.filter((item) => item !== qpSelection);
    targetSelection.unshift(qpSelection);
    return undefined;
  });
}

export function cmdViewCodeChat() {
  if (extensions.getExtension("CodeChat.codechat")) {
    commands.executeCommand("extension.codeChatActivate");
  } else {
    window.showErrorMessage(
      "Unable to start CodeChat preview.  Is the 'CodeChat' extension and CodeChat_Server (through pip) installed?",
    );
  }
}
