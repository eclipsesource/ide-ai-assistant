const BACKEND_URL = 'http://localhost:3001';
const GITHUB_BACKEND_URL = `${BACKEND_URL}/github-oauth`;
const vscode = acquireVsCodeApi();
const THEIA_APP_NAME = 'Theia Browser Example';

class GitHubOAuth {
    access_token = null;
    infoDiv = document.getElementById('login-info');

    constructor() {
        this.clientId = 'f6843855679852363fae';

        this.baseGithubOAuthUrl = 'https://github.com/login/oauth/authorize';
        this.redirectUri = 'vscode://EclipseSource.ai-assistant-vsc';
        this.scope = 'user:email'

        this.setupLogin();
    }

    async setupLogin() {
        if (isTheia) {
            // Disable github Oauth for theia
            this.access_token = "[Your access token]"
            this.handleConnection();
            return;
        }
        // Retreive the state
        const state = await vscode.getState();
        if (state && state.access_token) {
            const isTokenValid = await this.verifyToken(state.access_token)

            if (isTokenValid) {
                this.access_token = state.access_token;
                this.handleConnection();
                vscode.postMessage({ command: 'info', text: "GitHub credentials retreived, you are connected." });
                return;
            }
        }
        this.attachLoginButtonEvent();
        this.listenForConnection();
    }

    async verifyToken(access_token) {
        const verifyUrl = `${GITHUB_BACKEND_URL}/validate-token/${access_token}`;
        return fetch(verifyUrl)
            .then(response => response.json())
            .then(data => {
                return data.success;
            })
            .catch(error => {
                return false;
            });
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
                    this.connectUser(message.code);
                    this.infoDiv.textContent = "You are now connected to GitHub.";
                    break;
            }
        });
    }

    async connectUser(oauthCode) {
        if (!oauthCode) {
            this.infoDiv.textContent = "No code received from GitHub. Please try again.";
            return;
        }
        this.infoDiv.textContent = oauthCode;
        await fetch(`${GITHUB_BACKEND_URL}/`, {
            method: "POST",
            body: JSON.stringify({ code: oauthCode }),
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
                // Store the access token as a state element
                this.access_token = data.access_token;
                vscode.setState({ access_token: this.access_token });

                this.handleConnection();
            })
            .catch(error => {
                this.infoDiv.textContent = "There was an error connecting with the backend, it might not be running." + error;
            });
    }

    handleConnection() {
        if (this.access_token) {
            document.getElementById("login-container").style.display = 'none';
            document.getElementById("chat-container").style.display = 'flex';

            if (document.getElementById("get-error")) {
                document.getElementById("get-error").style.display = 'none';
            }

            const _myChatApp = new ChatApp(this.access_token);
        }
    }
}

const githubOAuth = new GitHubOAuth();
