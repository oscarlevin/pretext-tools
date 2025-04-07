import { ProgressLocation, window } from "vscode";
import { pretextOutputChannel } from "../ui";
const { exec } = require("child_process");
const fs = require("fs");

export async function cmdInstallSage() {
  console.log("Trying to install Sage");
  if (process.env.CODESPACES === "true") {
    console.log("Running inside a GitHub Codespace");
    window.withProgress(
      {
        location: ProgressLocation.Window,
      },
      (progress) => {
        progress.report({ message: "Running `installSage` script" });

        return new Promise<void>((resolve) => {
          pretextOutputChannel.append(
            "Checking for new version of PreTeXt to install"
          );
          try {
            exec(
              "bash ./.devcontainer/installSage.sh",
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
          try {
            const devcontainerPath = "./.devcontainer/devcontainer.json";
            fs.readFile(devcontainerPath, "utf8", (err: any, data: string) => {
              if (err) {
                pretextOutputChannel.appendLine(
                  `Error reading devcontainer.json: ${err.message}`
                );
                return;
              }
              pretextOutputChannel.appendLine(
                `Contents of devcontainer.json:\n${data}`
              );
              const updatedData = data.replace(
                /\/\/\s*install sagemath:/i,
                "install sagemath:"
              );
              fs.writeFile(
                devcontainerPath,
                updatedData,
                "utf8",
                (err: any) => {
                  if (err) {
                    pretextOutputChannel.appendLine(
                      `Error writing to devcontainer.json: ${err.message}`
                    );
                    return;
                  }
                  pretextOutputChannel.appendLine(
                    "Successfully updated devcontainer.json to uncomment 'install sage:'"
                  );
                }
              );
            });
          } catch (e) {
            console.log(
              "Unable to save SageMath install status to devcontainer.json"
            );
            console.log(e);
          }
          progress.report({ message: "Done" });
          resolve();
        });
      }
    );
  } else {
    window.showInformationMessage(
      "Sage installation is only supported in GitHub Codespaces."
    );
  }
}
