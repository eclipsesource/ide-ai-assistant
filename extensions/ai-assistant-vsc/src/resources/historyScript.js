const vscode = acquireVsCodeApi();
const BACKEND_URL = 'http://localhost:3001';
const infoDiv = document.getElementById('info');

var project_name = null;
var access_token = null;

class HistoryManager {
    discussionsList = [];
    selected = false;

    async setupHistory() {
        const discussions = await this.getDiscussions();
        this.addDiscussions(discussions);
        
        // Event listener for checkbox
        document.getElementById('header-controls').querySelector('.history-checkbox').addEventListener('click', () => {
            this.selected = !this.selected;
            this.discussionsList.forEach(discussion => {
                discussion.setSelection(this.selected);
            });
        });

        // Event listener for send button
        document.getElementById('send-messages').addEventListener('click', () => {
            this.handleSending();
        });
    }

    async getDiscussions() {
        const encodedProjectName = encodeURIComponent(project_name);
        const response = await fetch(`${BACKEND_URL}/database/projects/${encodedProjectName}/discussions`);
        const discussions = await response.json();
        return discussions;
    }

    addDiscussions(discussions) {
        discussions.forEach((discussion, index) => {
            const discussionElement = new Discussion(discussion, index);
            this.discussionsList.push(discussionElement);
        });
    }

    handleSending() {
        // Retreives selected messages.
        const selectedMessages = [];
        this.discussionsList.forEach(discussion => {
            discussion.messagesBlockList.forEach(messageBlock => {
                if (messageBlock.selected) {
                    selectedMessages.push(messageBlock.message1);
                    selectedMessages.push(messageBlock.message2);
                }
            });
        });

        if (selectedMessages.length === 0) {
            infoDiv.textContent = "You must select at least one message.";
            return;
        }

        // Here send messages and do something with receiving
        infoDiv.textContent = `${selectedMessages.length} messages would be sent right now.`;
        // TODO
    }
}

class Discussion {
    discussionContainer = document.getElementById('discussions-container');
    darkMode = (getComputedStyle(document.body).getPropertyValue('--vscode-editor-foreground') === "#1f1f1f")
    messagesBlockList = [];
    selected = false;
    placeholder = false;

    constructor(discussion, discussionFrontId) {
        this.discussion = discussion;
        this.discussionFrontId = discussionFrontId;

        this.discussionElement = this.setupDiscussion();
        this.setupMessages();
    }

    setupDiscussion() {
        // Set the discussion
        const newDiscussion = this.createDiscussionDiv();
        this.discussionContainer.appendChild(newDiscussion);
        this.handleExpansion(newDiscussion);
        this.handleSelection(newDiscussion);

        return newDiscussion;
    }

    async setupMessages() {
        // Set a placeholder message
        this.discussionContainer.querySelector('.placeholder').style.display = 'block';

        // Set messages within the discussion
        const dbMessages = await this.getMessages(this.discussion._id);
        const filteredMessages = dbMessages.map((message) => {
            return { role: message.role, content: message.content };
        });

        const summarizeRequest = {
            messages: filteredMessages,
            access_token: access_token,
            project_name: project_name,
          };

        fetch(`${BACKEND_URL}/services/aiAssistantBackend/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(summarizeRequest),
        })
            .then(response => response.json())
            .then(messages => { 
                this.addMessagesBlock(messages);
            });
    }

    async getMessages(discussionId) {
        const requestUrl = `${BACKEND_URL}/database/discussions/${discussionId}/messages`;
        const response = await fetch(requestUrl);
        const messages = await response.json();
        return messages;
    }

    createDiscussionDiv() {
        const sampleDiv = document.getElementById('copy-samples').querySelector('.discussion');
        const newDiscussionDiv = sampleDiv.cloneNode(true);

        newDiscussionDiv.id = `discussion-${this.discussionFrontId}`;
        newDiscussionDiv.querySelector('.header-title').textContent = `DISCUSSION ${this.discussionFrontId + 1}`;
        this.darkMode && (newDiscussionDiv.querySelector('.header-arrow').classList.add('dark'));
        (this.discussionFrontId % 2 === 0) && (newDiscussionDiv.classList.add('highlighted'));

        return newDiscussionDiv;
    }

    handleExpansion(discussionDiv) {
        const header = discussionDiv.querySelector('.discussion-header');
        header.addEventListener('click', (event) => {
            const headerArrow = header.querySelector('.header-arrow');
            headerArrow.classList.toggle('expanded');
            const headerBody = discussionDiv.querySelector('.discussion-body');
            headerBody.classList.toggle('expanded');
        });
    }

    handleSelection(discussionDiv) {
        const checkbox = discussionDiv.querySelector('.history-checkbox');
        checkbox.addEventListener('click', (event) => {
            event.stopPropagation();
            this.setSelection(!this.selected);
        });
    }

    setSelection(selection) {
        const checkbox = this.discussionElement.querySelector(".history-checkbox");
        checkbox.checked = selection;
        this.selected = selection;
        this.messagesBlockList.forEach(messageBlock => {
            messageBlock.setSelection(this.selected);
        })
    }

    addMessagesBlock(messages) {
        if (messages.length < 2) {
            // TODO hide the whole discussion (display none) in that case?
            this.discussionContainer.querySelector('.placeholder').textContent = "No messages in this discussion.";
            return;
        }
        this.discussionContainer.querySelector('.placeholder').style.display = 'none';

        const discussionBody = this.discussionElement.querySelector('.discussion-body');
        let i = 0;
        while (i < messages.length - 1) {
            const message1 = messages[i];
            const message2 = messages[i + 1];
    
            const messageBlockElement = new MessageBlock(discussionBody, message1, message2, i);
            this.messagesBlockList.push(messageBlockElement);
            i += 2;
        }
    }
}

class MessageBlock {
    selected = false;

    constructor(discussionBody, message1, message2, messageBlockId) {
        this.discussionBody = discussionBody;
        this.message1 = message1;
        this.message2 = message2;
        this.messageBlockId = messageBlockId;

        this.messageBlock = this.setupMessageBlock();
    }

    setupMessageBlock() {
        const newMessageBlock = this.createMessageBlockDiv();
        this.discussionBody.appendChild(newMessageBlock);
        return newMessageBlock;
    }

    createMessageBlockDiv() {
        const sampleDiv = document.getElementById('copy-samples').querySelector('.message-block');
        const newMessageBlockDiv = sampleDiv.cloneNode(true);
        
        newMessageBlockDiv.id = `message-${this.messageBlockId}`;
        newMessageBlockDiv.querySelector('.message-request').innerHTML = `<strong>Question:</strong> ${this.message1.content}`;
        newMessageBlockDiv.querySelector('.message-request').id = this.message1._id;
        newMessageBlockDiv.querySelector('.message-response').innerHTML = `<strong>Response:</strong> ${this.message2.content}`;
        newMessageBlockDiv.querySelector('.message-response').id = this.message2._id;
        newMessageBlockDiv.addEventListener('click', () => {
            this.setSelection(!this.selected);
        });

        return newMessageBlockDiv;
    }

    setSelection(selection) {
        const checkbox = this.messageBlock.querySelector('.history-checkbox');
        checkbox.checked = selection;
        this.selected = selection;
    }
}

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
            _historyManager.setupHistory();
            clearInterval(intervalId);
        } else {
            vscode.postMessage({ command: "get-variables" });
        }
    }, 200);
}

vscode.postMessage({ command: "get-variables" });
setTimeout(main, 20);
