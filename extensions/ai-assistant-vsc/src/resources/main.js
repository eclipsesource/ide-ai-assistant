// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const ENDPOINT = 'http://localhost:3001/services/aiAssistantBackend';

(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('#ask-bot-button')?.addEventListener('click', () => {
        askBot();
    });

    function askBot() {
        const question = document.getElementById('user-question').value;
        console.log("button clicked: ", question);
        const request = {
            messages: [{
                role: "user",
                content: question
            }]
        };
        fetch(ENDPOINT, {
            method: "POST",
            body: JSON.stringify(request),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            }
        }).then((response) => response.json()
        ).then((json) => {
            console.log(json);
            try {
                document.getElementById('bot-response').textContent = json.content.content;
            } catch (err) {
                document.getElementById('bot-response').textContent = 'Unfortunaty our assistant is not functioning at the moment. Please try again later.';
                console.error(err);
            }
        });
    }
}());

