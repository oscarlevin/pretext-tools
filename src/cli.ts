import { window, workspace } from "vscode";
import * as utils from "./utils";
import { execSync } from "child_process";
import { cmdUpdate } from "./commands/update";
import { Target } from "./types";

interface CLI {
  _pythonPath: string | null | undefined;
  _pretextVersion: string | null;
  _cmd: string | null;
  _targets: Target[] | null;
  pythonPath: (override?: string | null) => string | undefined;
  cmd: () => string;
  version: () => string;
  targets: (refresh?: boolean) => Target[];
}

export let cli: CLI = {
  _pythonPath: null,
  _cmd: null,
  _pretextVersion: null,
  _targets: null,
  pythonPath: function (override?: string | null) {
    if (override) {
      this._pythonPath = override;
    }
    if (this._pythonPath === null) {
      this._pythonPath = getPythonExec();
    }
    return this._pythonPath;
  },
  cmd: function () {
    if (this._cmd === null) {
      this._cmd = getPtxExec();
    }
    return this._cmd;
  },
  version: function () {
    if (this._pretextVersion === null) {
      this._pretextVersion = getPtxVersion();
    }
    return this._pretextVersion;
  },
  targets: function (refresh = false) {
    if (refresh) {
      this._targets = null;
    }
    if (this._targets === null) {
      this._targets = getTargets();
    }
    return this._targets;
  },
};

function getPythonExec(): string | undefined {
  let pythonExec: string | undefined = workspace
    .getConfiguration("pretext-tools")
    .get("pythonPath");
  console.log("Python path from settings: ", pythonExec);
  if (pythonExec === "") {
    for (let command of ["python3", "python"]) {
      try {
        let pythonVersion = execSync(command + " --version").toString();
        console.log("Python version result: ", pythonVersion);
        if (pythonVersion.toLowerCase().includes("python 2")) {
          throw new Error(command + " is python 2");
        }
        pythonExec = command;
        break;
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  } else {
    try {
      let pythonVersion = execSync(pythonExec + " --version").toString();
      console.log("Python version result: ", pythonVersion);
      if (pythonVersion.toLowerCase().includes("python 2")) {
        throw new Error(pythonExec + " is python 2");
      }
    } catch (err) {
      console.log("Error: ", err);
      window.showErrorMessage(
        "The path to python provided in settings does not appear to be a valid python 3 executable.  Please provide a valid path to python."
      );
      pythonExec = "";
    }
  }
  if (pythonExec === "") {
    window.showErrorMessage(
      "You do not appear to have python installed.  Please download and install python (and make sure it is added to your PATH)."
    );
    return undefined;
  }
  return pythonExec;
}

function getPtxExec() {
  let pythonExec = cli.pythonPath();
  if (!pythonExec) {
    window.showErrorMessage(
      "Unable to run PreTeXt without python.  Please install python and try again."
    );
  } else {
    console.log("Using python at ", pythonExec);
    let ptxCommand = pythonExec + " -m pretext";
    try {
      let ptxVersion = execSync(ptxCommand + " --version").toString();
      console.log("Using PreTeXt version", ptxVersion);
      return ptxCommand;
    } catch (err) {
      console.log(ptxCommand + " not found");
    }
  }
  // If the above did not work, then either pretext has been installed with pipx, is not yet installed, or python is not available in the usual place, so we try a last ditch effort to find it.
  let ptxExec = "";
  for (let command of ["pretext", "python -m pretext", "python3 -m pretext"]) {
    try {
      let ptxVersion = execSync(command + " --version").toString();
      console.log("Using PreTeXt version", ptxVersion);
      return command;
    } catch (err) {
      console.log(command + " not found");
    }
  }
  if (
    ptxExec === "" &&
    workspace.getConfiguration("pretext-tools").get("installPretext")
  ) {
    window
      .showWarningMessage(
        "It doesn't look like you have pretext installed.  Would you like to try to install it now?",
        "Yes",
        "No",
        "No (stop asking)"
      )
      .then((option) => {
        if (option === "Yes") {
          try {
            cmdUpdate();
            console.log("Finished attempting to install PreTeXt");
            return getPtxExec();
          } catch (err) {
            console.log("Unable to install PreTeXt.  Error: ", err);
          }
        } else if (option === "No (stop asking)") {
          workspace
            .getConfiguration("pretext-tools")
            .update("installPretext", false);
        }
      });
  }
  return ptxExec;
}

function getPtxVersion() {
  let ptxVersion = "version unknown";
  try {
    ptxVersion = execSync(cli.cmd() + " --version")
      .toString()
      .trim();
    if (ptxVersion.includes("\n")) {
      ptxVersion = ptxVersion.split("\n")[-1];
    }
  } catch (err) {
    console.log("Error: ", err);
  }
  return ptxVersion;
}

/**
 * Get list of targets from project.ptx file
 * @returns Array of target names
 */
function getTargets() {
  // execSync returns stdout from executing the command.  We then convert to a string, split on new lines, and remove any blanks, to create an array of the target names.
  // See also https://stackoverflow.com/questions/41001360/saving-the-output-of-a-child-process-in-a-variable-in-the-parent-in-nodejs
  let filePath = utils.getDir();
  try {
    let targets = execSync(cli.cmd() + " --targets", { cwd: filePath })
      .toString()
      .split(/\r?\n/)
      .filter(Boolean);
    // Set up dictionary for quickselect:
    if (targets.length > 0) {
      let targetSelection = [];
      for (let target of targets) {
        // exclude lines that start with "Generated" as these are not targets
        if (!target.includes("Generated")) {
          targetSelection.push({
            label: target,
            description: "Build source as " + target,
          });
        }
      }
      return targetSelection;
    } else {
      return [
        {
          label: "No PreTeXt project found.",
          description: "Change to directory containing a project.ptx file.",
        },
      ];
    }
  } catch (err) {
    console.log("getTargets() Error: \n", err);
    return [];
  }
}
