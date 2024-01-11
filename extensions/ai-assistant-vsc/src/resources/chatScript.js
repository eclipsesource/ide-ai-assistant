const BACKEND_URL = 'http://localhost:3001/';

class ChatApp {
    projectName = 'sampleProjectName';

    constructor(access_token) {
        this.access_token = access_token;

        this.allMessages = [];
        this.input = document.getElementById('input');
        this.messagesContainer = document.getElementById('chat-messages');
        this.endpoint = BACKEND_URL + 'services/aiAssistantBackend';
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
        const msgId = messageId !== 0 ? messageId : "message-id-" + (this.allMessages.length + 1);

        const messageHtml = `
            <div class="message-header header-${messageType}">
                <span class="message-title">${title}</span>
                <span class="separator"> - </span>
                <span class="message-date">${date}</span>
            </div>
            <div class="message-text msg-${messageType}">${text}</div>
        `;

        const ratingHtml = `
            <div class="rating" id="star-rating"> 
            <input type="radio" id="star5-${msgId}" name="rating-${msgId}" value="5" onClick="handleRating(5, '${messageId}')">
            <label for="star5-${msgId}"></label>
            <input type="radio" id="star4-${msgId}" name="rating-${msgId}" value="4" onClick="handleRating(4, '${messageId}')">
            <label for="star4-${msgId}"></label>
            <input type="radio" id="star3-${msgId}" name="rating-${msgId}" value="3" onClick="handleRating(3, '${messageId}')">
            <label for="star3-${msgId}"></label>
            <input type="radio" id="star2-${msgId}" name="rating-${msgId}" value="2" onClick="handleRating(2, '${messageId}')">
            <label for="star2-${msgId}"></label>
            <input type="radio" id="star1-${msgId}" name="rating-${msgId}" value="1" onClick="handleRating(1, '${messageId}')">
            <label for="star1-${msgId}"></label>
            </div>
        `;

        const ratedMessageHtml = messageType === "response" && this.allMessages.length > 1 ? messageHtml + ratingHtml : messageHtml;

        const messageElement = this.createDiv(msgId, "message-container", ratedMessageHtml);

        this.allMessages.push({ role, content: text });
        this.messagesContainer.appendChild(messageElement);
    }

    addLoader() {
        const loaderElement = this.createDiv("loader", "message-container", '<div class="message-text msg-response"></div>');
        if (this.displayLoading) {
            this.messagesContainer.appendChild(loaderElement);
        }
    }

    createDiv(id, className, content) {
        const messageElement = document.createElement("div");
        messageElement.id = id;
        messageElement.className = className;
        messageElement.innerHTML = content;
        return messageElement;
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
            const json = await response.json();

            if (!response.ok){
                throw new Error(`Status Code: ${response.status}\n${json.error.errorMessage}`);
            }

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

}

// Method to update the rating for an API response asynchronously
async function handleRating(ratingValue, messageId) {
    const request = { messageId, rating: ratingValue }
    const dbEndpoint = BACKEND_URL + 'database/messages';
    try {
        await fetch(dbEndpoint, {
            method: "PUT",
            body: JSON.stringify(request),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            }
        });
    } catch (error) {
        // Any errors in this API must not affect the user experience
    }
};
