import { window, workspace } from "vscode";
import { Project, Target } from "./types";
import { getProjectFolder } from "./utils";
import * as path from "path";
import * as fs from "fs";
import { parseString } from "xml2js";

export let projects: Project[] = [];

export async function ensureProjectList() {
    if (projects.length === 0) {
        console.log("No projects found, updating project list.");
        await updateProjectList();
    }
}

export async function resetProjectList() {
    projects = [];
    await updateProjectList();
    window.showInformationMessage(
        "Refreshed projects and targets.",
      );
}

async function updateProjectList() {
    // Get list of workspace folders:
    if (workspace.workspaceFolders) {
        for (let folder of workspace.workspaceFolders) {
            let root = getProjectFolder(folder.uri.fsPath)
            if (root && !projects.some(p => p.root === root)) {
                projects.push({
                    root: root,
                    targets: getTargets(root)
                });
            }
        }
    }
    // If we didn't find any projects, look for an active editor and use that to guess a project
    if (projects.length === 0) {
        let root: string|null;
        if (window.activeTextEditor) {
            root = getProjectFolder(window.activeTextEditor.document.uri.fsPath)
        } else {
            root = await userSpecifiedProject();
            console.log("root: ", root);
        }
        if (root) {
            projects.push({
                root: root,
                targets: getTargets(root)
            });
        }
    }
    return
}


/**
 * Get the list of targets for a project by parsing the project.ptx file.
 * @param projectRoot The root directory of the project.
 * @returns An array of Target objects.
*/
function getTargets(projectRoot: string): Target[] {
    const projectManifest = path.join(projectRoot, "project.ptx");
    console.log("Project manifest is ", projectManifest);
    if (fs.existsSync(projectManifest)) {
        // Parse the project.ptx xml and look for target elements
        // Return an array of Target objects
        let contents = fs.readFileSync(projectManifest, "utf8");
        // Parse the XML content
        let targets: Target[] = [];
        parseString(contents, (err, result) => {
            if (err) {
                console.error("Error parsing XML: ", err);
                return;
            }

            if (result.project && result.project.targets && result.project.targets[0].target) {
                targets = result.project.targets[0].target.map((t: any) => {
                    return {
                        // The attributes of the target element are given as the children of the $ property
                        name: t.$.name,
                        description: "(format: " + t.$.format + ")",
                    };
                });
            }
        });
        console.log("Targets are ", targets);
        return targets;
    }
    return [];
}


async function userSpecifiedProject() {
    // Open folder select dialog to select project root.
    let root = null;
    await window.showInformationMessage("No PreTeXt project found in workspace.  Choose a project folder?", {modal: true, detail: "Pick a folder containing the 'project.ptx' manifest of your project."}, "Choose project folder").then(async (option) => {
        if (option === "Choose project folder"){
            await window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                title: "Select project folder...",
                openLabel: "Select"
            }).then((uri)=>{
                if (uri) {
                    root = uri[0].fsPath
                }
            });
        }
    });
    return root;
}

