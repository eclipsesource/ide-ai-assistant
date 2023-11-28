import * as vscode from 'vscode';
import * as theia from '@theia/plugin';


const THEIA_CUSTOM_COMMAND = 'execution.messageCommand';

class MyTerminalObserver implements theia.TerminalObserver {
    outputMatcherRegex = '((..)/(..)/(....) .*)';
    nrOfLinesToMatch = 20;
    matchOccurred(groups: string[]): void {
        console.log(`starts with a date: ${groups[4]}-${groups[3]}-${groups[2]}`);
    }

}

export const activateTheia = async (appName: string, context: vscode.ExtensionContext) => {
    if (vscode.env.appName === appName) {

        let terminalObserver: vscode.Disposable;

        // The command has been defined in the package.json file
        // Now provide the implementation of the command with registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('ai-assistant-vsc.registerObserver', () => {

            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage('Registering terminal observer');
            terminalObserver = theia.window.registerTerminalObserver(new MyTerminalObserver());
        });

        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('ai-assistant-vsc.unregisterObserver', () => {

            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage('Unregistering terminal observer');
            terminalObserver.dispose();
        });

        // context.subscriptions.push(disposable);

        // Execute Theia custom command
        const commands = await vscode.commands.getCommands();
        if (commands.indexOf(THEIA_CUSTOM_COMMAND) > -1) {
            vscode.commands.executeCommand(THEIA_CUSTOM_COMMAND);
        }
    }
};
