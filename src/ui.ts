import { OutputChannel, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { updateStatusBarItem } from "./utils";

export const pretextOutputChannel: OutputChannel = window.createOutputChannel(
    "PreTeXt Tools",
    "log"
  );
export const ptxSBItem: StatusBarItem = window.createStatusBarItem(
  StatusBarAlignment.Left,
  -100
);

export function showLog() {
  pretextOutputChannel.show();
  updateStatusBarItem(ptxSBItem);
}