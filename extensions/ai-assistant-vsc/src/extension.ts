import * as vscode from 'vscode';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	const provider = new AIAssistantProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(AIAssistantProvider.viewType, provider));
	const disposable = vscode.commands.registerCommand('ai-assistant-vsc.openAssistant', () => {
		vscode.window.showInformationMessage('Opening widget from ai-assistant-vsc!');
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

class AIAssistantProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'ai-assistant-vsc.chatboxView';
	private _view?: vscode.WebviewView;
	constructor(private readonly _extensionUri: vscode.Uri) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
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
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		return '';
	}
}
