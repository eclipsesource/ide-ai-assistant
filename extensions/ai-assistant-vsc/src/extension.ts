import * as vscode from 'vscode';
const fs = require('fs');

interface ErrorObject {
	command: string;
	linkData: string;
	errorMsg: string;
}
import { activateTheia } from './theia';

const THEIA_APP_NAME = 'Eclipse Theia';

// This method is called when your extension is activated
export const activate = async (context: vscode.ExtensionContext) => {

	const provider = new AIAssistantProvider(context.extensionUri, context);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(AIAssistantProvider.viewType, provider));
	
	if (vscode.env.appName === THEIA_APP_NAME) {
		await activateTheia(THEIA_APP_NAME, context);
	}
};

// This method is called when your extension is deactivated
export function deactivate() { }

class AIAssistantProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'ai-assistant-vsc.chatboxView';
	private _view?: vscode.WebviewView;
	private _context: vscode.ExtensionContext;

	constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
		this._context = context;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		// this._view = webviewView;
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	
		let disposableMessageListener = webviewView.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'message':
						// You can add your own logic here to process the message
						// For now, we just send it back as a response
						webviewView.webview.postMessage({ command: 'response', text: message.text });
						return;
					case 'loading':
						webviewView.webview.postMessage({ command: 'loading' });
						return;
					case 'handle-error':
						showErrorNotification(message, webviewView);
						return;
					case 'debug-command':
						webviewView.webview.postMessage({ command: 'response', text: message.text });
						const terminalCommand = parseCommand(message.text);
						let terminal = getActiveTerminal();
						if (terminal) {
							terminal.sendText(terminalCommand, false);
						};
						return;
				}
			},
			undefined,
			this._context.subscriptions
		);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const chatScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/resources', 'chatScript.js'));
		const chatStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/resources', 'chatStyle.css'));
		const nonce = getNonce();

		// Manage context files
		// const projectFile = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		// console.log(projectFile)
		// const contextReader = new NodeContextReader(path.join(this._extensionUri.fsPath, 'package.json'));
		// contextReader.generateContexts();

		let userContextContent: any;
		let projectContextContent: any;
		
		try {
			const userContextPath = vscode.Uri.joinPath(this._extensionUri, 'src/context', 'user_context.txt').fsPath;
			userContextContent = fs.readFileSync(userContextPath, 'utf8');
			
		} catch (err) {
			console.error(`Unable to read user context file: ${err}`);
		}
		try {
			const projectContextPath = vscode.Uri.joinPath(this._extensionUri, 'src/context', 'project_context.txt').fsPath;
			projectContextContent = fs.readFileSync(projectContextPath, 'utf8');

		} catch (err) {
			console.error(`Unable to read project context file: ${err}`);
		}

		return `
			<html>
			<body>
				<div id="chat-container" class="vscode-dark">
					<div id="chat-messages">
						<!-- Messages will be added here by the script -->
					</div>
					<div id="input-container">
						<textarea id="input" placeholder="Type your message..." rows=1></textarea>
						<button id="send">Send</button>
					</div>
				</div>
				<button id="get-error">Trigger an error</button>
			
				<link href="${chatStyleUri}" rel="stylesheet" />
				<script nonce=${nonce}>
					const userContext = ${JSON.stringify(userContextContent)}
					const projectContext = ${JSON.stringify(projectContextContent)}
				</script>
				<script nonce=${nonce} src="${chatScriptUri}"></script>
			</body>
			</html>
		`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// Check if a terminal exists
function ensureTerminalExists(): boolean {
	if ((<any>vscode.window).terminals.length === 0) {
		vscode.window.showErrorMessage('No active terminals');
		return false;
	}
	return true;
}

// Function to select an active terminal
function getActiveTerminal(): vscode.Terminal | undefined {
	return vscode.window.activeTerminal;
}

// Picker to select terminals when there are multiple
function selectTerminal(): Thenable<vscode.Terminal | undefined> {

	interface TerminalQuickPickItem extends vscode.QuickPickItem {
		terminal: vscode.Terminal;
	}
	const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
	const items: TerminalQuickPickItem[] = terminals.map(t => {
		return {
			label: `name: ${t.name}`,
			terminal: t
		};
	});
	return vscode.window.showQuickPick(items).then(item => {
		return item ? item.terminal : undefined;
	});
}

function showErrorNotification(message: ErrorObject, webviewView: vscode.WebviewView) {
	vscode.window.showInformationMessage(message.linkData, 'Yes', 'No').then(action => {
		if (action === 'Yes') {
			vscode.window.showInformationMessage('Please wait while the assistant types the command on your terminal. Check the chatbox for more information.');
			// Post message to handle API call and add messages to the conversation
			webviewView.webview.postMessage({ command: 'debug', errorMsg: message.errorMsg });
		}
	});
}

function parseCommand(text: string) {
	const list = text.match(/```.*\n(.*)\n```/) || [];
	return list.length > 0 ? list[1] : '';
}
