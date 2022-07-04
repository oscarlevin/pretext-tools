// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
//import { test } from './project-manifest';
// This forces a esm import: https://stackoverflow.com/questions/70620025/how-do-i-import-an-es6-javascript-module-in-my-vs-code-extension-written-in-type
const testImportPromise = import("./project-manifest");



var pretextOutputChannel = vscode.window.createOutputChannel('PreTeXt Tools');

function getCwd() {
	if (vscode.workspace.workspaceFolders !== undefined) {
		console.log('Got cwd from worksapce folder');
		return vscode.workspace.workspaceFolders[0].uri.fsPath;
	} else if (vscode.window.activeTextEditor !== undefined) {
		console.log('Got cwd from active text editor');
		return path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
	} else {
		console.log('No active editor or workspace folder.');
		vscode.window.showErrorMessage('No current editor or workspace found.');
	}
}

function runPretext(ptxCommand: string): void {
	// var editor = vscode.window.activeTextEditor;
	// var fullName = path.normalize(editor.document.fileName);
	// var filePath = path.dirname(fullName);
	var filePath = getCwd();
	console.log('cwd = '+filePath);
	if (filePath !== undefined && filePath !== '.') {

		pretextOutputChannel.show();
		pretextOutputChannel.append('Now running `' + ptxCommand +'` ...\n');
		var process = spawn(ptxCommand, [], { cwd: filePath, shell: true });
		// console.log("stdout:", proc.stdout);
		process.stdout.on('data', function (data) {
			console.log(`stdout:${data}`);
			var outputLines = data.toString().split(/\r?\n/);
			for (const line of outputLines) {
				console.log(line + '\n');
				pretextOutputChannel.append(line + '\n');
				if (line.startsWith("error") || line.startsWith("critical")) {
					vscode.window.showErrorMessage(line);
					// } else if (line.startsWith("warning")) {
						// 	vscode.window.showWarningMessage(line);
					} else if (line.startsWith("Success")) {
						vscode.window.showInformationMessage(line);
					}
				}
			});
			
			process.stderr.on('data', function (data) {
				pretextOutputChannel.show();
				console.log('stderr is: ');
				console.log(data.toString());
				if (data.toString() !== "") {
					vscode.window.showErrorMessage( data.toString());
					pretextOutputChannel.append(data.toString() + '\n');
				}
			});
			
			process.on('exit', function (code){
				console.log( code?.toString());
				pretextOutputChannel.append('\n ...PreTeXt command complete.\n');
			});
		};
		};
		
function runViewCommand(ptxCommand: string): void {
	// var editor = vscode.window.activeTextEditor;
	// var fullName = path.normalize(editor.document.fileName);
	// var filePath = path.dirname(fullName);
	var filePath = getCwd();
	if (filePath !== undefined && filePath !== '.') {
		pretextOutputChannel.show();
		pretextOutputChannel.append('Now running `' + ptxCommand +'` ...\n');
		var process = spawn(ptxCommand, [], { cwd: filePath, shell: true });
		// console.log("stdout:", proc.stdout);
		process.stdout.on('data', function (data) {
			console.log(`stdout:${data}`);
			var outputLines = data.toString().split(/\r?\n/);
			for (const line of outputLines) {
				console.log(line + '\n');
				if (line.startsWith("http://localhost:")) {
					pretextOutputChannel.append(line + '\n');
					pretextOutputChannel.append('(this local server will remain running until you close vs code)\n');
					return;
				} else {
					pretextOutputChannel.append(line + ' ');
				}
			}
		});
		process.stderr.on('data', function (data) {
				// pretextOutputChannel.show();
				console.log('stderr: ' + data.toString());
				// if (data.toString() !== "") {
				// 	// vscode.window.showErrorMessage( data.toString());
				// 	// pretextOutputChannel.append(data.toString() + '\n');
				// }
		});
		process.on('exit', function (code){
			console.log( code?.toString());
			pretextOutputChannel.append('\n ...PreTeXt command complete.\n');
		});
	};
};
	
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	console.log('Congratulations, your extension "pretext-tools" is now active!');


	context.subscriptions.push(
		vscode.commands.registerCommand('pretext-tools.buildAny', () => {
			// Get command to run based on user selected target.
			const buildCommand = [
				{
					label: 'html', 
					description: 'Build source as html',
					command: 'python -m pretext build html' 
				},
				{
					label: 'pdf',
					description: 'Build source as PDF',
					command: 'python -m pretext build pdf'
				},
				{
					label: 'diagrams/images',
					description: 'Generate images defined in source',
					command: 'python -m pretext build --diagrams --only-assets'
				},
				{
					label: 'webwork',
					description: 'Generate webwork-representations file (for projects containint webwork exercises)',
					command: 'python -m pretext build --webwork --only-assets'
				}
			];
			// TODO: add build targets from project manifest

			// Show choice dialog and pass correct command to runPretext based on selection.
			vscode.window.showQuickPick(buildCommand).then((qpSelection) => {
				if (!qpSelection) {
					return;
				}
				runPretext(qpSelection.command);
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pretext-tools.buildHTML', () => {
			var ptxCommand = "python -m pretext build html";
			runPretext(ptxCommand);
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('pretext-tools.buildPDF', () => {
			var ptxCommand = "python -m pretext build pdf";
			runPretext(ptxCommand);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pretext-tools.view', () => {
			const viewCommand = [
				{
					label: 'html',
					description: 'View html',
					command: 'python -m pretext view html'
				},
				{
					label: 'pdf',
					description: 'View PDF',
					command: 'python -m pretext build pdf'
				}
			];
			// TODO: add build targets from project manifest

			// Show choice dialog and pass correct command to runPretext based on selection.
			vscode.window.showQuickPick(viewCommand).then((qpSelection) => {
				if (!qpSelection) {
					return;
				}
				runViewCommand(qpSelection.command);
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pretext-tools.viewWatch', () => {
			var ptxCommand = "python -m pretext view --watch";
			runViewCommand(ptxCommand);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pretext-tools.newBook', () => {
			var ptxCommand = "python -m pretext new book";
			runPretext(ptxCommand);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pretext-tools.newArticle', () => {
			var ptxCommand = "python -m pretext new article";
			runPretext(ptxCommand);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('pretext-tools.test', () => {
			testImportPromise.then((test) => {test.test();});
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
