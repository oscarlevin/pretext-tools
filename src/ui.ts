import {
  OutputChannel,
  StatusBarAlignment,
  StatusBarItem,
  Terminal,
  window,
} from "vscode";
import { updateStatusBarItem } from "./utils";
import { ptxCommandList } from "./constants";

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

export let pretextTerminal: Terminal;

export let pretextCommandList = ptxCommandList;

export function setTopCommand(command: string) {
  pretextCommandList[0].label = command;
}

export let lastTarget: string = "";

export function updateLastTarget(target: string) {
  lastTarget = target;
}
