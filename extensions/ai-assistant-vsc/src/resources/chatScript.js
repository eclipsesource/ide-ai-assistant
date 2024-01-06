const AI_BACKEND_URL = 'http://localhost:3001/services/aiAssistantBackend';

class ChatApp {
    projectName = 'sampleProjectName';

    constructor(access_token) {
        this.access_token = access_token;

        this.allMessages = [];
        this.input = document.getElementById('input');
        this.messagesContainer = document.getElementById('chat-messages');
        this.endpoint = AI_BACKEND_URL;
        this.displayLoading = false;

        // Setup initial message
        this.addMessage('assistant', new Date().toLocaleString(), 'Hello, I am your AI assistant. How can I help you?');
        this.adjustTextareaHeight();

        // Setup event listeners
        this.setupEventListeners();

        // Get contexts
        this.contexts = { user: userContext, project: projectContext };
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
        document.getElementById('get-error')?.addEventListener('click', () => {
            this.getError();
        });
        this.input.addEventListener('input', () => this.adjustTextareaHeight());
        window.addEventListener('message', (event) => this.handleReceivedMessage(event));
        window.addEventListener('resize', () => this.adjustTextareaHeight());
        // Override default Enter behavior
        this.input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                document.getElementById('send').click();
            }
        });
    }

    addMessage(role, date, text, messageId = 0) {
        text = text.replace(/\n+$/, '').replace(/\n/g, '<br>');
        const messageType = role === "user" ? "request" : "response";
        const title = role === "user" ? "You" : "AI assistant";

        const messageHtml = `
            <div class="message-container" id=${messageId !== 0 ? messageId : "message-id-" + (this.allMessages.length + 1)}>
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

        // Display loading message with delay
        this.displayLoading = true;
        setTimeout(() => {
            vscode.postMessage({
                command: 'loading',
            });
        }, 200);
        await this.getAPIResponse();
    }

    async getAPIResponse(debug = false) {

        const request = {
            messages: this.allMessages,
            projectContext: this.contexts.project,
            userContext: this.contexts.user,
            access_token: this.access_token,
            projectName: this.projectName
        };

        const command = debug ? 'debug-command' : 'message';
        let APIResponse;
        let messageId = 0;

        try {

            const response = await fetch(this.endpoint, {
                method: "POST",
                body: JSON.stringify(request),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                }
            });
            const json = await response.json()

            // Check if the response is valid
            if (!json.content || !json.content.content || json.content.role !== "assistant" || !json.messageId) {
                throw new Error(`An error occured while communicating with the backend, response is not valid: ${json}.`);
            }

            APIResponse = json.content.content;
            messageId = json.messageId;

        } catch (error) {
            APIResponse = `An error occured.\n ${error}`;
        }

        // Display the answer in the chat window
        vscode.postMessage({
            command: command,
            text: APIResponse,
            messageId: messageId
        });
    }

    handleReceivedMessage(event) {
        const message = event.data;
        switch (message.command) {
            case 'response':
                this.removeLoader();
                this.addMessage('assistant', new Date().toLocaleString(), message.text, message.messageId);
                break;
            case 'loading':
                this.addLoader();
                break;
            case 'debug':
                this.addMessage('user', new Date().toLocaleString(), message.errorMsg);
                setTimeout(() => this.addLoader(), 200);
                this.getAPIResponse(true);
                break;
        }
    }

    getError() {
        let linkData = 'The assistant has detected an error in your execution. Do you want to ask the assistant for the command to solve it?';
        // Send a link to the terminal 
        vscode.postMessage({
            command: 'handle-error',
            linkData: linkData,
            errorMsg: 'I have an error in my terminal "missing glob package". Give me the terminal command to solve this.'
        });
    }

}
