import { window } from "vscode";
import { runThenOpen } from "./runPtx";
import { ptxExec } from "../utils";

export function ptxNew() {
    let viewCommand = [];
      for (let template of ["article", "book", "slideshow", "demo"]) {
        viewCommand.push({
          label: template,
          description: "New " + template,
        });
      }
      // Show choice dialog and pass correct command to runPretext based on selection.
      window.showQuickPick(viewCommand).then((qpSelection) => {
        if (!qpSelection) {
          return;
        }
        window
          .showOpenDialog({
            openLabel: "Select folder that will hold your project...",
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
          })
          .then((fileUri) => {
            if (fileUri && fileUri[0]) {
              var projectFolder = fileUri[0].fsPath;
              console.log("Selected folder: ", projectFolder);
              runThenOpen(ptxExec, "new", qpSelection.label, projectFolder);
            }
          });
      });
}