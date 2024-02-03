const vscode = acquireVsCodeApi();
const BACKEND_URL = 'http://localhost:3001';
const infoDiv = document.getElementById('info');

var project_name = null;
var access_token = null;
var isDarkMode = (getComputedStyle(document.body).getPropertyValue('--vscode-editor-foreground') === "#1f1f1f");

class HistoryManager {
    messagesList = [];
    selected = false;

    constructor() {
        this.setupEventsListeners();
    }

    async setupEventsListeners() {
        // Event listener for checkbox
        document.getElementById('header-controls').querySelector('.history-checkbox').addEventListener('click', () => {
            this.selected = !this.selected;
            this.messagesList.forEach(message => {
                message.setSelection(this.selected);
            });
        });

        // Event listener for send button
        document.getElementById('send-messages').addEventListener('click', () => {
            this.handleSending();
        });
    }

    handleSending() {
        // Retreives selected messages.
        const selectedMessages = [];
        this.messagesList.forEach(message => {
            if (message.selected) {
                selectedMessages.push(message.message1);
                selectedMessages.push(message.message2);
            }
        });

        if (selectedMessages.length === 0) {
            infoDiv.textContent = "You must select at least one message.";
            return;
        }

        // Here send messages and do something with receiving
        infoDiv.textContent = `${selectedMessages.length} messages would be sent right now.`;
        // TODO
    }

    async handleConnection() {
        const mainDiv = document.getElementById("container");
        const encodedProjectName = encodeURIComponent(project_name);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        };

        fetch(`${BACKEND_URL}/database/isProjectLead/${encodedProjectName}`, {
            method: 'GET',
            headers: headers,
        })
        .then(async response => {
            if (!response.ok) {
                const err = await response.json();
                throw err.error;
            }
            return response.json();
        }).then(() => {
            mainDiv.style.display = "flex";
            this.setupMessages();
        }).catch((error) => {
            mainDiv.style.display = "block";
            mainDiv.innerHTML = `<p> An error occured while fetching messages: \n ${error} </p>`;
            return;
        })
    }

    async setupMessages() {
        const bodyPlaceholder = document.getElementById("no-messages");

        bodyPlaceholder.textContent = "Fetching and summarizing messages...";
        let summarizedMessages = [];

        try {
            summarizedMessages = await this.summarizeMessages();

            if (summarizedMessages.length < 2) {
                bodyPlaceholder.textContent = "No messages received";
                return;
            }
        } catch (error) {
            bodyPlaceholder.textContent = "An error occured while fetching messages: \n" + error;
            return;
        }
        bodyPlaceholder.textContent = "";

        const messagesContainer = document.getElementById('messages-list');
        let i = 0;
        while (i*2 + 1 < summarizedMessages.length) {
            const message1 = summarizedMessages[i*2];
            const message2 = summarizedMessages[i*2 + 1];

            const messageBlockElement = new MessageBlock(messagesContainer, message1, message2, i);
            this.messagesList.push(messageBlockElement);
            i += 1;
        }

    }

    async summarizeMessages() {
        const encodedProjectName = encodeURIComponent(project_name);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
          };
        const response = await fetch(`${BACKEND_URL}/services/aiAssistantBackend/summarize/${encodedProjectName}`, {
            method: 'GET',
            headers: headers,
        });

        return await response.json();
    }
}

class MessageBlock {
    selected = false;

    constructor(container, message1, message2, messageBlockId) {
        this.container = container;
        this.message1 = message1;
        this.message2 = message2;
        this.messageBlockId = messageBlockId;

        this.messageElement = this.setupMessageBlock();
    }

    setupMessageBlock() {
        const newMessageBlock = this.createMessageBlockDiv();
        this.container.appendChild(newMessageBlock);

        this.handleExpansion(newMessageBlock);
        this.handleEvents(newMessageBlock);
        return newMessageBlock;
    }

    createMessageBlockDiv() {
        const sampleDiv = document.getElementById('copy-samples').querySelector('.message-container');
        const newMessageBlockDiv = sampleDiv.cloneNode(true);
        
        newMessageBlockDiv.id = `message-${this.messageBlockId}`;
        isDarkMode && (newMessageBlockDiv.querySelector('.header-arrow').classList.add('dark'));
        (this.messageBlockId % 2 === 0) && (newMessageBlockDiv.classList.add('highlighted'));
        newMessageBlockDiv.querySelector(".header-title").textContent = `Question ${this.messageBlockId + 1}`;
        newMessageBlockDiv.querySelector('.message-request').innerHTML = `<strong>Question:</strong> ${this.message1.content}`;
        newMessageBlockDiv.querySelector('.message-response').innerHTML = `<strong>Response:</strong> ${this.message2.content}`;
        
        return newMessageBlockDiv;
    }

    handleExpansion(messageElement) {
        const header = messageElement.querySelector('.message-header');
        header.addEventListener('click', (event) => {
            event.stopPropagation();
            const headerArrow = header.querySelector('.header-arrow');
            headerArrow.classList.toggle('expanded');
            const blockBody = this.messageElement.querySelector('.message-body');
            blockBody.classList.toggle('expanded');
        });
    }

    handleEvents(messageElement) {
        messageElement.addEventListener('click', (event) => {
            event.stopPropagation();
            this.setSelection(!this.selected);
        });
    }

    setSelection(selection) {
        const checkbox = this.messageElement.querySelector('.history-checkbox');
        checkbox.checked = selection;
        this.selected = selection;
    }
}

// This is how we retreive from the extension the project name and the access token.
window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
        case "get-variables":
            project_name = message.project_name;
            access_token = message.access_token;
            break;
    }
});

function main() {
    const _historyManager = new HistoryManager();
    let intervalId = setInterval(() => {
        if (access_token !== null && project_name !== null) {
            _historyManager.handleConnection();
            clearInterval(intervalId);
        } else {
            vscode.postMessage({ command: "get-variables" });
        }
    }, 200);
}

vscode.postMessage({ command: "get-variables" });
setTimeout(main, 20);
