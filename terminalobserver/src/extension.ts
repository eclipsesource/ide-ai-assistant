// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from '@theia/plugin';

class MyTerminalObserver implements vscode.TerminalObserver {
    outputMatcherRegex=  '^((..)/(..)/(....) .*)';
    nrOfLinesToMatch= 20;
    matchOccurred(groups: string[]): void {
        console.log(`starts with a date: ${groups[4]}-${groups[3]}-${groups[2]}`);
    }
    
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function start(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "terminalobserver" is now active!');

    let terminalObserver: vscode.Disposable;

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('terminalobserver.registerObserver', () => {
    
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Registering terminal observer');
        terminalObserver= vscode.window.registerTerminalObserver(new MyTerminalObserver());
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('terminalobserver.unregisterObserver', () => {
    
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Unregistering terminal observer');
        terminalObserver.dispose();
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
