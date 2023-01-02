import * as vscode from "vscode";

// Modified from https://code.visualstudio.com/api/extension-guides/tree-view and corresponding implimentation of LaTeX-Workshop (MIT License).

export class PretextCommandMenuProvider
    implements vscode.TreeDataProvider<PreTeXtCommand>
{
    constructor() {}
    // private commands: PreTeXtCommand[] = []

    private getPreTeXtCommands(): PreTeXtCommand[] {
        console.log("Running getPreTeXtCommands");
        let commands: PreTeXtCommand[] = [
            new PreTeXtCommand(
                "Build default target",
                "pretext-tools.buildDefault",
                "debug-start"
            ),
            new PreTeXtCommand(
                "Build ....",
                "pretext-tools.buildAny",
                "debug-start"
            ),
            new PreTeXtCommand(
                "Generate assets",
                "pretext-tools.generate",
                "symbol-color"
            ),
            new PreTeXtCommand("View", "pretext-tools.view", "open-preview"),
            new PreTeXtCommand(
                "Refresh targets",
                "pretext-tools.refresh",
                "refresh"
            ),
            new PreTeXtCommand(
                "Deploy to GitHub",
                "pretext-tools.deploy",
                "github"
            ),
            new PreTeXtCommand(
                "Upgrade PreTeXt",
                "pretext-tools.updatePTX",
                "desktop-download"
            ),
        ];
        return commands;
    }

    getTreeItem(element: PreTeXtCommand): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PreTeXtCommand): Thenable<PreTeXtCommand[]> {
        return Promise.resolve(this.getPreTeXtCommands());
    }
}

class PreTeXtCommand extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly ptxcommand: string,
        public readonly codicon?: string,
        public readonly collapsibleState?: vscode.TreeItemCollapsibleState
    ) {
        super(label);
        this.command = { command: ptxcommand, title: label };
        this.tooltip = `${this.label}: ${this.ptxcommand}`;
        this.iconPath = codicon && new vscode.ThemeIcon(codicon);
    }
}
