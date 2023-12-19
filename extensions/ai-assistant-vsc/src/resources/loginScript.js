const GITHUB_BACKEND_URL = 'http://localhost:3001/github-oauth';
const vscode = acquireVsCodeApi();

class GitHubOAuth {
    oauthCode = null;
    infoDiv = document.getElementById('login-info');

    constructor() {
        this.clientId = 'f6843855679852363fae';

        this.baseGithubOAuthUrl = 'https://github.com/login/oauth/authorize';
        this.redirectUri = 'vscode://EclipseSource.ai-assistant-vsc';
        this.scope = 'user:email'

        this.attachLoginButtonEvent();
        this.listenForConnection();
    }

    openGitHubOAuthUrl() {
        const githubOAuthUrl = `${this.baseGithubOAuthUrl}?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${this.scope}`;

        vscode.postMessage({ command: 'openExternal', url: githubOAuthUrl });
    }

    attachLoginButtonEvent() {
        document.getElementById('login-button').addEventListener('click', () => {
            this.infoDiv.textContent = "An authorization window will open in your browser. Please authorize the application.";

            this.openGitHubOAuthUrl();
        });
    }

    listenForConnection() {
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'githubOAuth':
                    this.oauthCode = message.code;
                    this.connectUser();
                    this.infoDiv.textContent = "You are now connected to GitHub.";
                    break;
            }
        });
    }

    async connectUser() {
        if (!this.oauthCode) {
            this.infoDiv.textContent = "No code received from GitHub. Please try again.";
            return;
        }
        this.infoDiv.textContent = this.oauthCode;
        await fetch(`${GITHUB_BACKEND_URL}`, {
            method: "POST",
            body: JSON.stringify({ code: this.oauthCode }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            }
        })
            .then(response => response.json())
            .then(data => {
                this.infoDiv.textContent = JSON.stringify(data);
                if (!data.success) {
                    throw new Error("There was an error connecting, please retry.");
                }
                this.handleConnection(data.access_token);
            })
            .catch(error => {
                this.infoDiv.textContent = "There was an error connecting with the backend, it might not be running." + error;
            });
    }

    handleConnection(access_token) {
        if (access_token) {
            document.getElementById("login-container").style.display = 'none';
            document.getElementById("chat-container").style.display = 'flex';

            if (document.getElementById("get-error")) {
                document.getElementById("get-error").style.display = 'none';
            }
            const _myChatApp = new ChatApp(access_token);
        }
    }
}

const githubOAuth = new GitHubOAuth();
