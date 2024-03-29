import * as vscode from 'vscode';
import { NodeContextReader } from './context/nodeContextReader';
import { activateTheia } from './theia';
import fs = require('fs');

const BACKEND_URL = 'http://localhost:3001';
interface ErrorObject {
	command: string;
	linkData: string;
	errorMsg: string;
}

const THEIA_APP_NAME = 'Eclipse Theia'; // 'Theia Browser Example';

// This method is called when your extension is activated
export const activate = async (context: vscode.ExtensionContext) => {

	const provider = new AIAssistantProvider(context.extensionUri, context);
	const historyProvider = new AIAssistantHistoryProvider(context.extensionUri, context);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(AIAssistantProvider.viewType, provider));
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(AIAssistantHistoryProvider.viewType, historyProvider));

	if (vscode.env.appName === THEIA_APP_NAME) {
		await activateTheia(THEIA_APP_NAME, context, provider);
	}

	context.subscriptions.push(vscode.window.registerUriHandler({
		handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
			const query = new URLSearchParams(uri.query);
			const code = query.get('code');

			provider.resolveOauthConnection(code);
			vscode.window.showInformationMessage(`Authorization was successful`);
		}
	}));
};

// This method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
	context.subscriptions.forEach((disposable) => {
		try {
			disposable.dispose();
		} catch (error) {
			console.error(error);
		}
	});
}

function getContext(extensionUri: vscode.Uri) {
	let userContextContent: any;
	let projectContextContent: any;
	try {
		const userContextPath = vscode.Uri.joinPath(extensionUri, 'src/context', 'user_context.txt').fsPath;
		userContextContent = fs.readFileSync(userContextPath, 'utf8');

	} catch (err) {
		console.error(`Unable to read user context file: ${err}`);
	}
	try {
		const projectContextPath = vscode.Uri.joinPath(extensionUri, 'src/context', 'project_context.txt').fsPath;
		projectContextContent = fs.readFileSync(projectContextPath, 'utf8');

	} catch (err) {
		console.error(`Unable to read project context file: ${err}`);
	}
	return [userContextContent, projectContextContent];
}

export class AIAssistantProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'ai-assistant-vsc.chatboxView';
	private _view?: vscode.WebviewView;
	private _context: vscode.ExtensionContext;

	constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
		this._context = context;
	}

	public async SendErrorNotification(message: ErrorObject) {
		showErrorNotification(message, this._view!);
	}


	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri,
				vscode.Uri.parse('http://localhost:3001')
			]
		};
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'message':
						webviewView.webview.postMessage({ command: 'response', text: message.text, messageId: message.messageId });
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
					case 'openExternal':
						vscode.env.openExternal(vscode.Uri.parse(message.url));
						return;
					case 'info':
						vscode.window.showInformationMessage(message.text);
						return;
					case 'set-access-token':
						this._context.globalState.update('access_token', message.access_token);
						return;
					case 'open-file':
						openFile(message.url, this._extensionUri);
						return;
				}
			},
			undefined,
			this._context.subscriptions
		);
	}

	public resolveOauthConnection(code: string | null) {
		this._view?.webview.postMessage({ command: 'githubOAuth', code: code });
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const chatScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/resources', 'chatScript.js'));
		const loginScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/resources', 'loginScript.js'));
		const chatStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/resources', 'chatStyle.css'));
		const nonce = getNonce();

		// Manage context files
		const rootDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		const contextReader = new NodeContextReader(rootDir);
		contextReader.generateContexts();
		const projectName = contextReader.getProjectName();

		const [userContextContent, projectContextContent] = getContext(this._extensionUri);

		return /*html*/`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${chatStyleUri}" rel="stylesheet">

				<title>AI Assistant</title>
			</head>
			<body>
				<div id="login-container" class="vscode-dark">
					<div id="login">
						<p>Sign in with GitHub to start chatting with the AI Assistant</p>
						<button id="login-button">Sign in with GitHub</button>
						<div id="login-info"></div>
					</div>
				</div>
				
				<div id="chat-container" class="vscode-dark">
					<div id="chat-messages">
						<!-- Messages will be added here by the script -->
					</div>
					<div id="input-container">
						<textarea id="input" placeholder="Type your message..." rows=1></textarea>
						<button id="send">Send</button>
					</div>
				</div>
			
				<script nonce=${nonce}>
					const isTheia = ${vscode.env.appName === THEIA_APP_NAME};
					const userContext = ${JSON.stringify(userContextContent)};
					const projectContext = ${JSON.stringify(projectContextContent)};
					const projectName = ${JSON.stringify(projectName)};
				</script>

				<script nonce="${nonce}" src="${chatScriptUri}"></script>
				<script nonce="${nonce}" src="${loginScriptUri}"></script>
				
			</body>
			</html>
		`;
	}
}

export class AIAssistantHistoryProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'ai-assistant-vsc.historyView';
	private _view?: vscode.WebviewView;
	private _context: vscode.ExtensionContext;

	constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
		this._context = context;
	}

	public async SendErrorNotification(message: ErrorObject) {
		showErrorNotification(message, this._view!);
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri,
				vscode.Uri.parse('http://localhost:3001')
			]
		};
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'generateReadME':
						let request = message.request;
						// vscode.window.showInformationMessage('Generating new README.md file');

						// Add original README to the request
						if (!vscode.workspace.workspaceFolders) {
							vscode.window.showWarningMessage('AI Assistant could not generate new README, no workspace opened');
							return;
						}
						const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'README.md');
						const fileSystem = vscode.workspace.fs;
						let originalContent = await fileSystem.readFile(filePath);
						request.readme = originalContent.toString();

						const newReadME = await this.sendGenerateReadMERequest(request);

						// Create a new untitled file
						const uri = vscode.Uri.parse("untitled:" + vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "GeneratedReadME.md"));
						const document = await vscode.workspace.openTextDocument(uri);
						const editor = new vscode.WorkspaceEdit();
						editor.insert(uri, new vscode.Position(0, 0), newReadME);
						vscode.workspace.applyEdit(editor);

						// Show the diff between the original content and the new file
						await vscode.workspace.openTextDocument(filePath);
						vscode.commands.executeCommand("vscode.diff", filePath, uri);

						vscode.window.showInformationMessage("Do you want to overwrite the readme", 'Yes', 'No').then(async action => {
							if (action === 'Yes') {
								vscode.window.showInformationMessage('File overwritten');
								const newContent = document.getText();

								// Write the content of File B to File A
								await vscode.workspace.fs.writeFile(filePath, Buffer.from(newContent));
							}
							if (action === 'No') {
								vscode.window.showInformationMessage('You can manually make changes and save the file');
							}
						});
						return;
					case 'message':
						vscode.window.showInformationMessage(message.text);
						return;
					case 'get-access-token':
						vscode.window.showInformationMessage(message);
						webviewView.webview.postMessage({ command: 'get-access-token', access_token: this._context.globalState.get('access_token') });
						return;
				}
			},
			undefined,
			this._context.subscriptions
		);
	}

	private async sendGenerateReadMERequest(request: any) {
		const response = await fetch(`${BACKEND_URL}/services/aiAssistantBackend/generateReadME`, {
			method: "POST",
			body: JSON.stringify(request),
			headers: {
				"Content-type": "application/json; charset=UTF-8",
			},
		});
		const json = await response.json();

		if (!response.ok) {
			throw new Error(
				`Status Code: ${response.status}\n${json.error.errorMessage}`
			);
		}
		return json;
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const historyScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/resources', 'historyScript.js'));
		const historyStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/resources', 'historyStyle.css'));
		const arrowImageUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/resources', 'arrow.png'));
		const nonce = getNonce();

		// Manage context files
		const rootDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		const contextReader = new NodeContextReader(rootDir);
		contextReader.generateContexts();
		const projectName = contextReader.getProjectName();

		const [userContextContent, projectContextContent] = getContext(this._extensionUri);

		return /*html*/`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${historyStyleUri}" rel="stylesheet">
				<script nonce=${nonce}>
					const userContext = ${JSON.stringify(userContextContent)};
					const projectContext = ${JSON.stringify(projectContextContent)};
					const projectName = ${JSON.stringify(projectName)};
				</script>
				<script defer nonce="${nonce}" src="${historyScriptUri}"></script>

				<style>
					:root {
						--arrow-image: url('${arrowImageUri}');
					}
				</style>
				<title>Messages history</title>
			</head>
			<body>

				<div id="container">
					<div id="header">
						<h3 id="history-title">Messages History</h3>
						<p id="history-explanation">This interface is designed for the project leads.
						You will have the ability to review a summary of messages sent by developpers on current project.
						You have the option to ask the AI to modify the README file of the project, based on those messages.
						You can choose to either send all messages or pick a selection. <p>
						<div id="header-controls">
							<input type="button" id="send-messages" value="Send" />
							<input type="checkbox" class="history-checkbox" />
						</div>
						<div id="info"></div>
					</div>

					<div id="main">
						<div id="messages-list">
							<!-- Messages will be added here by the script -->
							<p id="no-messages">No messages to show</p>
						</div>
					
					</div>
				</div>

				<div id="copy-samples" style="display: none">

					<!-- Sample message container element to be copied -->
					<div class="message-container">
						<div class="content-container">
							<div class="message-header">
								<div class="header-arrow"></div>
								<h5 class="header-title"></h5>
							</div>
							<div class="message-body">
								<p class="message-element message-request"></p>
								<p class="message-element message-response"></p>
							</div>
						</div>
						<input type="checkbox" class="history-checkbox" />
					</div>
				</div>


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

// Function to select an active terminal
function getActiveTerminal(): vscode.Terminal | undefined {
	return vscode.window.activeTerminal;
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

async function openFile(filename: string, extensionUri: vscode.Uri) {
	const extUri = vscode.workspace.workspaceFolders?.at(0)?.uri || extensionUri;
	let uri = vscode.Uri.joinPath(extUri, filename).fsPath;
	let doc = await vscode.workspace.openTextDocument(uri);
	await vscode.window.showTextDocument(doc, { preview: false });
}
