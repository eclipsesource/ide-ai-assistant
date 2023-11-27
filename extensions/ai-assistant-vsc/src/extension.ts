import * as vscode from 'vscode';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	const provider = new AIAssistantProvider(context.extensionUri,  context);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(AIAssistantProvider.viewType, provider));

}

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
		this._view = webviewView;
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
			
				<link href="${chatStyleUri}" rel="stylesheet" />
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
