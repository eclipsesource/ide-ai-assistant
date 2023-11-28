ENDPOINT = 'http://localhost:3001/services/aiAssistantBackend';

class ChatApp {

    constructor() {
        this.allMessages = [];
        this.vscode = acquireVsCodeApi();
        this.input = document.getElementById('input');
        this.messagesContainer = document.getElementById('chat-messages');
        this.endpoint = ENDPOINT;
        this.displayLoading = false;

        // Setup initial message
        this.addMessage('assistant', new Date().toLocaleString(), 'Hello, I am your AI assistant. How can I help you?');
        this.adjustTextareaHeight();

        // Setup event listeners
        this.setupEventListeners();

        // Get contexts
        this.contexts = {user: userContext, project: projectContext};
    }

    adjustTextareaHeight() {
        this.input.style.height = 'auto';
        this.input.style.height = this.input.scrollHeight + 'px';
    }

    setupEventListeners() {
        document.getElementById('send').addEventListener('click', () => {
            this.handleSendMessage();
            this.adjustTextareaHeight();
        });
        this.input.addEventListener('input', () => this.adjustTextareaHeight());
        window.addEventListener('message', (event) => this.handleReceivedMessage(event));
        window.addEventListener('resize', () => this.adjustTextareaHeight());
        // Override default Enter behavior
        this.input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                document.getElementById('send').click();
            }
        });
    }

    addMessage(role, date, text) {
        text = text.replace(/\n+$/, '').replace(/\n/g, '<br>');
        const messageType = role === "user" ? "request" : "response";
        const title = role === "user" ? "You" : "AI assistant";

        const messageHtml = `
            <div class="message-container" id=message-id-${this.allMessages.length + 1}>
                <div class="message-header header-${messageType}">
                    <span class="message-title">${title}</span>
                    <span class="separator"> - </span>
                    <span class="message-date">${date}</span>
                </div>
                <div class="message-text msg-${messageType}">${text}</div>
            </div>
        `;

        this.allMessages.push({ role, content: text });
        this.messagesContainer.innerHTML += messageHtml;
    }

    addLoader() {
        const messageHtml = `
            <div class="message-container" id=loader>
                <div class="message-text msg-response"></div>
            </div>
        `;
        if (this.displayLoading) {
            this.messagesContainer.innerHTML += messageHtml;
        }
    }

    removeLoader() {
        this.displayLoading = false;
        const loader = document.getElementById('loader');
        if (loader) {
            loader.remove();
        }
    }

    async handleSendMessage() {
        const inputValue = this.input.value;

        if (inputValue.trim() === '') {
            return; // Don't process empty messages
        }

        // Send the user question throught vscode so it will be displayed
        this.addMessage('user', new Date().toLocaleString(), inputValue);
        this.input.value = '';

        let APIResponse;

        // Display loading message with delay
        this.displayLoading = true;
        setTimeout(() => {
            this.vscode.postMessage({
                command: 'loading',
            });
        }, 200);

        const request = {
            messages: this.allMessages,
            projectContext: this.contexts.project,
            userContext: this.contexts.user
        }

        await fetch(this.endpoint, {
            method: "POST",
            body: JSON.stringify(request),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            }
        })
            .then(response => response.json())
            .then(json => {
                // We need to check the answer is valid
                if (!json.content || !json.content.content || json.content.role !== "assistant") {
                    throw new Error("An error occured while communicating with the backend.");
                }
                APIResponse = json.content.content;
            })
            .catch(error => {
                console.error(error);
                APIResponse = `An error occured.\n ${error}`;
            });

        // Display the answer in the chat window
        this.vscode.postMessage({
            command: 'message',
            text: APIResponse
        });
    }

    handleReceivedMessage(event) {
        const message = event.data;
        switch (message.command) {
            case 'response':
                this.removeLoader();
                this.addMessage('assistant', new Date().toLocaleString(), message.text);
                break;
            case 'loading':
                this.addLoader();
                break;
        }
    }
}

const myChatApp = new ChatApp();
