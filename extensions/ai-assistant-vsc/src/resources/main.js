// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const ENDPOINT = '';
const TOKEN = '';

(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('#ask-bot-button')?.addEventListener('click', () => {
        askBot();
    });

    function askBot() {
        const question = document.getElementById('user-question').value;
        console.log("button clicked: ", question);
        fetch(ENDPOINT, {
            method: "POST",
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: question
                }]
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": "Bearer " + TOKEN
            }
        }).then((response) => response.json()
        ).then((json) => {
            console.log(json);
            document.getElementById('bot-response').textContent = json.choices[0].message.content;
        });
    }
}());

