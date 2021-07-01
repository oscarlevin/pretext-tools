import * as vscode from 'vscode';
import { spawn, exec } from 'child_process';
import * as path from 'path';

var pretextOutputChannel = vscode.window.createOutputChannel('pretext');

function setStatusBarText(what, docType) {
  var date = new Date();
  var text = what + ' [' + docType + '] ' + date.toLocaleTimeString();
  vscode.window.setStatusBarMessage(text, 1500);
}

function getPretextOptions(quickPickLabel) {
  var pretextOptions;

  switch (quickPickLabel) {
    case 'pdf':
      pretextOptions = vscode.workspace.getConfiguration('pretext').get('pdfOptString');
      console.log('pdocOptstring = ' + pretextOptions);
      break;
    case 'docx':
      pretextOptions = vscode.workspace.getConfiguration('pretext').get('docxOptString');
      console.log('pdocOptstring = ' + pretextOptions);
      break;
    case 'html':
      pretextOptions = vscode.workspace.getConfiguration('pretext').get('htmlOptString');
      console.log('pdocOptstring = ' + pretextOptions);
      break;
  }

  return pretextOptions;
}

export function activate(context: vscode.ExtensionContext) {

  console.log('Congratulations, your extension "pretext-tools" is now active!');

  var disposable = vscode.commands.registerCommand('pretext.render', () => {

    var editor = vscode.window.activeTextEditor;
    var fullName = path.normalize(editor.document.fileName);
    var filePath = path.dirname(fullName);
    var fileName = path.basename(fullName);
    var fileNameOnly = path.parse(fileName).name;

    let items: vscode.QuickPickItem[] = [];
    items.push({ label: 'pdf', description: 'Render as pdf document' });
    items.push({ label: 'docx', description: 'Render as word document' });
    items.push({ label: 'html', description: 'Render as html document' });

    vscode.window.showQuickPick(items).then((qpSelection) => {
      if (!qpSelection) {
        return;
      }

      var inFile = path.join(filePath, fileName).replace(/(^.*$)/gm, "\"" + "$1" + "\"");
      var outFile = (path.join(filePath, fileNameOnly) + '.' + qpSelection.label).replace(/(^.*$)/gm, "\"" + "$1" + "\"");

      setStatusBarText('Generating', qpSelection.label);

      var pretextOptions = getPretextOptions(qpSelection.label);

      // debug
      console.log('debug: outFile = ' + inFile);
      console.log('debug: inFile = ' + outFile);
      console.log('debug: pandoc ' + inFile + ' -o ' + outFile + pretextOptions);

      var space = '\x20';
      var targetExec = 'pandoc' + space + inFile + space + '-o' + space + outFile + space + pretextOptions;
      console.log('debug: exec ' + targetExec);

      var child = exec(targetExec, { cwd: filePath }, function (error, stdout, stderr) {
        if (stdout !== null) {
          console.log(stdout.toString());
          pretextOutputChannel.append(stdout.toString() + '\n');
        }

        if (stderr !== null) {
          console.log(stderr.toString());
          if (stderr !== "") {
            vscode.window.showErrorMessage('stderr: ' + stderr.toString());
            pretextOutputChannel.append('stderr: ' + stderr.toString() + '\n');
          }
        }

        if (error !== null) {
          console.log('exec error: ' + error);
          vscode.window.showErrorMessage('exec error: ' + error);
          pretextOutputChannel.append('exec error: ' + error + '\n');
        } else {
          setStatusBarText('Launching', qpSelection.label);
          switch (process.platform) {
            case 'darwin':
              exec('open ' + outFile);
              break;
            case 'linux':
              exec('xdg-open ' + outFile);
              break;
            default:
              exec(outFile);
          }
        }
      });
    });
  });

  context.subscriptions.push(disposable);
}