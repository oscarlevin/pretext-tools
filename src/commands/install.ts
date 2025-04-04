import { ProgressLocation, window } from "vscode";
import { pretextOutputChannel } from "../ui";
const { exec } = require("child_process");

export async function cmdInstallSage() {
  console.log("Trying to install Sage");
  window.withProgress(
    {
      location: ProgressLocation.Window,
    },
    (progress) => {
      progress.report({ message: "Running `add-sage` script" });

      return new Promise<void>((resolve) => {
        pretextOutputChannel.append(
          "Checking for new version of PreTeXt to install"
        );
        if (process.env.CODESPACES === "true") {
          pretextOutputChannel.appendLine("Running inside a GitHub Codespace");
        } else {
          pretextOutputChannel.appendLine(
            "Not running inside a GitHub Codespace"
          );
        }
        try {
          exec(
            "bash ./.github/scripts/add-sage.sh",
            (error: { message: any }, stdout: any, stderr: any) => {
              if (error) {
                pretextOutputChannel.appendLine(`Error: ${error.message}`);
                return;
              }
              if (stderr) {
                pretextOutputChannel.appendLine(`Stderr: ${stderr}`);
                return;
              }
              pretextOutputChannel.appendLine(`Stdout: ${stdout}`);
            }
          );
        } catch (e) {
          console.log("Unable to complete Sage install");
          console.log(e);
        }
        progress.report({ message: "Done" });
        resolve();
      });
    }
  );
}
export async function cmdInstallLaTeX() {
  console.log("Trying to install LaTeX");
  window.withProgress(
    {
      location: ProgressLocation.Window,
    },
    (progress) => {
      progress.report({ message: "Running `add-latex` script" });

      return new Promise<void>((resolve) => {
        pretextOutputChannel.append(
          "Checking for new version of PreTeXt to install"
        );
        if (process.env.CODESPACES === "true") {
          pretextOutputChannel.appendLine("Running inside a GitHub Codespace");
        } else {
          pretextOutputChannel.appendLine(
            "Not running inside a GitHub Codespace"
          );
        }
        try {
          exec(
            "bash ./.github/scripts/add-latex.sh",
            (error: { message: any }, stdout: any, stderr: any) => {
              if (error) {
                pretextOutputChannel.appendLine(`Error: ${error.message}`);
                return;
              }
              if (stderr) {
                pretextOutputChannel.appendLine(`Stderr: ${stderr}`);
                return;
              }
              pretextOutputChannel.appendLine(`Stdout: ${stdout}`);
            }
          );
        } catch (e) {
          console.log("Unable to complete Sage install");
          console.log(e);
        }
        progress.report({ message: "Done" });
        resolve();
      });
    }
  );
}
