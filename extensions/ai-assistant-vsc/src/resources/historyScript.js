const vscode = acquireVsCodeApi();
const BACKEND_URL = 'http://localhost:3001';
const infoDiv = document.getElementById('info');

var access_token = null;
var isDarkMode = (getComputedStyle(document.body).getPropertyValue('--vscode-editor-foreground') === "#1f1f1f");

class HistoryManager {
    messagesList = [];
    selected = false;

    constructor() {
        this.setupEventsListeners();
        this.contexts = { user: userContext, project: projectContext };
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
        infoDiv.textContent = `Generating the ReadME...`;
        this.postGenerateReadmeMessage(selectedMessages);
    }
    
    async postGenerateReadmeMessage(selectedMessages) {
        let messages = [];
        selectedMessages.forEach(message => {
            messages.push({ content: message.content, role: message.role });
        });
        
        const request = {
            messages: messages,
            projectContext: this.contexts.project,
            userContext: this.contexts.user,
            access_token: access_token,
            project_name: projectName,
        };
        
        vscode.postMessage({ command: 'generateReadME', request: request});
        return messages;
    }

    async handleConnection() {
        const mainDiv = document.getElementById("container");
        const encodedProjectName = encodeURIComponent(projectName);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        };

        try{
            const response = await fetch(`${BACKEND_URL}/database/isProjectLead/${encodedProjectName}`, {
                method: 'GET',
                headers: headers,
            });
            const json = await response.json();
            
            // We expect when the response is not ok to have an error message in the json.
            if (!response.ok) {
                throw json.error;
            }

            mainDiv.style.display = "flex";
            this.setupMessages();

        } catch (err) {
            mainDiv.style.display = "block";
            mainDiv.innerHTML = `<p> An error occured while fetching messages. If case you just switched workspaces, try reloading. 
            <br\> ${err.type}: <br\> ${err.errorMessage} </p>`;
            return;
        }
    }

    async setupMessages() {
        const bodyPlaceholder = document.getElementById("no-messages");
 
        bodyPlaceholder.textContent = "Fetching and summarizing messages...";
        let summarizedMessages = [];

        summarizedMessages = await this.summarizeMessages();

        if (summarizedMessages.length < 2) {
            bodyPlaceholder.textContent = "No messages received";
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
        const encodedProjectName = encodeURIComponent(projectName);
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
        case "get-access-token":
            access_token = message.access_token;
            break;
        }
    });
    
function main() {
    // This function is present to retreive access token from the extension (which comes from the other AI Assistant panel).
    const _historyManager = new HistoryManager();
    let intervalId = setInterval(() => {
        // When access_token is retreived, we can initialize the history manager.
        if (access_token !== null) {
            _historyManager.handleConnection();
            clearInterval(intervalId);
        } else {
            vscode.postMessage({ command: "get-access-token" });
        }
    }, 200);
}

vscode.postMessage({ command: "get-access-token" });
setTimeout(main, 20);
