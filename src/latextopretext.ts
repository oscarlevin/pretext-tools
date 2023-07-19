function convertParagraph(text) {
	//convert empty lines to paragraph
	let result = text.replace(/(\r|\n(?!\r|\n))(.*?)((\r|\n)\s*?(\r|\n))/gs, "<p>\n$2\n</p>\n\n");
	return result;
}

function convertMath(text) {
	//convert diplay math mode
	let result = text.replace(/(\${2}|\\\[|\\begin{displaymath}|\\begin{equation})(.*?)(\${2}|\\\]|\\end{displaymath}|\\end{equation})/gs, "<me>$2</me>");
	//convert inline math mode
	result = result.replace(/((?<!\\)\$|\\\(|\\begin{math})(.*?)((?<!\\)\$|\\\)|\\end{math})/gs, "<m>$2</m>");
	
	return result;
}
function convertTextMarkup(text) {
	//Convert verbatim
	let result = text.replace(/(\\verb\||\\begin{verbatim})(.*?)(\||\\end{verbatim})/gs, "<c>$2</c>");
	//convert emphasis/italics
	result = result.replace(/(\\emph{|\\textit{)(.*?)(})/gs, "<em>$2</em>");
	//convert boldface
	result = result.replace(/(\\textbf{)(.*?)(})/gs, "<term>$2</term>");

	return result
}
function convertQuotation(text) {
	//convert double quote
	let result = text.replace(/(``|")(.*?)(''|")/gs, "<q>$2</q>");
	
	//convert single quote
	result = result.replace(/(`|')(.*?)(')/gs, "<sq>$2</sq>");
	return result;
}

//calls each conversion in extension
function convert2Pretext(text) {
	var result = text;
	var errorMessage = "The selected text includes markup language this extension is unable to convert at this time"

	if (text.includes("%..determineErrorText$%122..")) {
		vscode.window.showInformationMessage(errorMessage);
	}
	//result = convertParagraph(result);
	result = convertMath(result);
	result = convertTextMarkup(result);
	result = convertQuotation(result);

	return result;

}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "latextopretext" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('latextopretext.latextopretext', function () {

		// The code you place here will be executed every time your command is executed
		
		const editor = vscode.window.activeTextEditor;

		if (editor) {
	
			const selection = editor.selection;
			const selectionRange = new vscode.Range(selection.start, selection.end);

			var initialText = editor.document.getText(selectionRange);

			var newText = convert2Pretext(initialText);



			editor.edit(editbuilder => { editbuilder.replace(selectionRange, newText)});


		}
		
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
