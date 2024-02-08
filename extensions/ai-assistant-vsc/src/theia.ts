import * as vscode from 'vscode';
import { AIAssistantProvider } from './extension';

const theia = vscode as any;


const THEIA_CUSTOM_COMMAND = 'ai-assistant-vsc.registerObserver';

class MyTerminalObserver {

    constructor(provider: AIAssistantProvider) {
        this.provider = provider;
    }
    private provider: AIAssistantProvider;
    private lastError: string = '';

    outputMatcherRegex = "error *";
    nrOfLinesToMatch = 40;
    matchOccurred(groups: string[]): void {
        if (groups[0] === this.lastError) {
            return;
        }
        this.lastError = groups[0];
        this.provider.SendErrorNotification({
            command: 'handle-error',
            linkData: 'The assistant has detected an error in your execution. Do you want to ask the assistant for the command to solve it?',
            errorMsg: groups[0]
        });
    }

}

export const activateTheia = async (appName: string, context: vscode.ExtensionContext, provider: AIAssistantProvider) => {
    if (vscode.env.appName === appName) {

        let terminalObserver: vscode.Disposable;

        // The command has been defined in the package.json file
        // Now provide the implementation of the command with registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('ai-assistant-vsc.registerObserver', () => {

            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            terminalObserver = theia.window.registerTerminalObserver(new MyTerminalObserver(provider));
        });

        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('ai-assistant-vsc.unregisterObserver', () => {

            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage('Unregistering terminal observer');
            terminalObserver.dispose();
        });

        context.subscriptions.push(disposable);

        // Execute Theia custom command
        const commands = await vscode.commands.getCommands();
        if (commands.indexOf(THEIA_CUSTOM_COMMAND) > -1) {
            vscode.commands.executeCommand(THEIA_CUSTOM_COMMAND);
        }
    }
};
