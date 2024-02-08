class ChatApp {

  constructor(access_token) {
    this.access_token = access_token;

    this.allMessages = [];
    this.input = document.getElementById("input");
    this.messagesContainer = document.getElementById("chat-messages");
    this.endpoint = `${BACKEND_URL}/services/aiAssistantBackend`;
    this.displayLoading = false;

    this.adjustTextareaHeight();

    // Setup event listeners
    this.setupEventListeners();

    // Get contexts
    this.contexts = { user: userContext, project: projectContext };

    // This is a debug line to remove all messages stored within the extension, uncomment to reset messages.
    // vscode.setState({ access_token: vscode.getState()?.access_token || this.access_token });
    
    // Retrieve messages from the state
    this.loadMessages();

    // Set variables to pass them to the other panel.
    vscode.postMessage({ command: "set-access-token", access_token: this.access_token });
  }

  loadMessages() {
    const state = vscode.getState();

    if (state && state.messages && state.messages.length > 0) {
      state.messages.forEach((message) => {
        this.addMessage(
          message.role,
          message.date,
          message.text,
          message.messageId,
          message.rating
        );
      });
    } else {
      this.addMessage(
        "assistant",
        new Date().toLocaleString(),
        "Hello, I am your AI assistant. How can I help you?"
      );
    }
  }

  adjustTextareaHeight() {
    this.input.style.height = "auto";
    this.input.style.height = this.input.scrollHeight + "px";
  }

  setupEventListeners() {
    document.getElementById("send").addEventListener("click", () => {
      this.handleSendMessage();
      this.adjustTextareaHeight();
    });
    this.input.addEventListener("input", () => this.adjustTextareaHeight());
    window.addEventListener("message", (event) =>
      this.handleReceivedMessage(event)
    );
    window.addEventListener("resize", () => this.adjustTextareaHeight());
    // Override default Enter behavior
    this.input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        document.getElementById("send").click();
      }
    });
  }

  addMessage(role, date, text, messageId = 0, rating = null) {
    const messageText = text.replace(/\n+$/, "").replace(/\n/g, "<br>");
    const messageType = role === "user" ? "request" : "response";
    const messageTitle = role === "user" ? "You" : "AI assistant";
    const messageHtmlId =
      messageId !== 0
        ? messageId
        : "message-id-" + (this.allMessages.length + 1);

    // Message header
    const messageHeaderDiv = this.createHtmlElement("div", [
      "message-header",
      `header-${messageType}`,
    ]);
    const messageTitleSpan = this.createHtmlElement(
      "span",
      ["message-title"],
      messageTitle
    );
    const separatorSpan = this.createHtmlElement("span", ["separator"], " - ");
    const messageDateSpan = this.createHtmlElement(
      "span",
      ["message-date"],
      date
    );

    messageHeaderDiv.appendChild(messageTitleSpan);
    messageHeaderDiv.appendChild(separatorSpan);
    messageHeaderDiv.appendChild(messageDateSpan);

    // Message text
    const messageTextDiv = this.createHtmlElement(
      "div",
      ["message-text", `msg-${messageType}`],
      messageText
    );

    // Message container
    const messageContainer = this.createHtmlElement(
      "div",
      ["message-container"],
      null,
      messageHtmlId
    );
    messageContainer.appendChild(messageHeaderDiv);
    messageContainer.appendChild(messageTextDiv);

    if (messageType === "response" && this.allMessages.length >= 1) {
      // Message rating
      const messageRatingDiv = this.createHtmlElement(
        "div",
        ["rating"],
        null,
        `star-rating-${messageHtmlId}`
      );
      for (let i = 5; i > 0; i--) {
        const ratingInput = this.createHtmlElement(
          "input",
          null,
          null,
          `star${i}-${messageHtmlId}`
        );
        ratingInput.type = "radio";
        ratingInput.name = `rating-${messageHtmlId}`;
        ratingInput.value = i;
        ratingInput.addEventListener("click", () =>
          this.handleRating(i, messageId)
        );
        rating && rating === i && (ratingInput.checked = true);
        const ratingLabel = this.createHtmlElement("label");
        ratingLabel.htmlFor = `star${i}-${messageHtmlId}`;

        messageRatingDiv.appendChild(ratingInput);
        messageRatingDiv.appendChild(ratingLabel);
      }
      messageContainer.appendChild(messageRatingDiv);
    }

    this.allMessages.push({ role, date, text, messageId, rating });
    this.saveMessages();
    this.messagesContainer.appendChild(messageContainer);
  }

  createHtmlElement(elementType, classList = null, content = null, id = null) {
    const newHtmlElement = document.createElement(elementType);
    classList &&
      classList.length > 0 &&
      newHtmlElement.classList.add(...classList);
    content && (newHtmlElement.innerHTML = content);
    id && (newHtmlElement.id = id);
    return newHtmlElement;
  }

  addLoader() {
    const loaderElement = this.createHtmlElement(
      "div",
      ["message-container"],
      null,
      "loader"
    );
    const loaderMessage = this.createHtmlElement("div", [
      "message-text",
      "msg-response",
    ]);
    loaderElement.appendChild(loaderMessage);
    if (this.displayLoading) {
      this.messagesContainer.appendChild(loaderElement);
    }
    document.getElementById("send").style.backgroundColor = "#1c401c";
    document.getElementById("send").style.color = "black";
  }

  removeLoader() {
    this.displayLoading = false;
    const loader = document.getElementById("loader");
    if (loader) {
      loader.remove();
    }
    document.getElementById("send").style.backgroundColor = "#4caf50";
    document.getElementById("send").style.color = "white";
  }

  async handleSendMessage() {
    const inputValue = this.input.value;

    if (inputValue.trim() === "") {
      return; // Don't process empty messages
    }
    if (this.displayLoading) {
      return; // Don't process messages while receiving a response
    }

    // Send the user question throught vscode so it will be displayed
    this.addMessage("user", new Date().toLocaleString(), inputValue);
    this.input.value = "";

    // Display loading message with delay
    this.displayLoading = true;
    setTimeout(() => {
      vscode.postMessage({
        command: "loading",
      });
    }, 200);
    await this.getAPIResponse();
  }

  async getAPIResponse(debug = false) {
    const filteredMessages = this.allMessages.map((message) => {
      return { role: message.role, content: message.text };
    });

    const request = {
      messages: filteredMessages,
      projectContext: this.contexts.project,
      userContext: this.contexts.user,
      access_token: this.access_token,
      project_name: projectName,
    };

    const command = debug ? "debug-command" : "message";
    let APIResponse;
    let messageId = 0;
    let displayResponse = true;

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          `Status Code: ${response.status}\n${json.error.errorMessage}`
        );
      }

      // Check if the response is valid
      if (
        !json.content ||
        (!json.content.content && !json.content.tool_calls) ||
        json.content.role !== "assistant" ||
        !json.messageId
      ) {
        throw new Error(
          `An error occured while communicating with the backend, response is not valid: ${json}.`
        );
      }

      APIResponse = json.content.content;
      messageId = json.messageId;

      const funcs = json.content.tool_calls;
      // Handle function calling
      if (funcs) {
        APIResponse = '';
        for (const f of funcs) {
          switch (f.function.name) {
            case 'openFile':
              const file = this.getFilePath(f);
              APIResponse += `The file needed for the issue specified is <a onClick="openFile('${file.name}', '${file.path}')"> ${file.name || file.path}</a>.\n`;
              break;
            case 'getGithubIssue':
              const issue = this.getIssueDetails(f);
              if (!issue.issueSolution) {
                this.getGithubIssue(issue.issueNumber);
                displayResponse = false;
              } else {
                APIResponse += '\n' + issue.issueDescription + '\n\n' + issue.issueSolution + '\n';
              }
              break;
          }
        }
      }

    } catch (error) {
      APIResponse = `An error occured.\n ${error}`;
    }

    if (displayResponse) {
      // Display the answer in the chat window
      vscode.postMessage({
        command: command,
        text: APIResponse,
        messageId: messageId
      });
    }
  }

  getFilePath(tool_call) {
    const file = JSON.parse(tool_call.function.arguments);
    return {
      path: file.filePath,
      name: file.fileName,
    };
  }

  getIssueDetails(tool_call) {
    const issue = JSON.parse(tool_call.function.arguments);
    return {
      issueNumber: issue.issueNumber,
      issueDescription: issue.issueDescription,
      issueSolution: issue.issueSolution
    };
  }

  async getGithubIssue(issueNumber) {
    // TODO: Remove hardcoding Issue #56
    const issue = {
      ownerName: "eclipse-theia",
      repoName: "theia",
      issueNumber: issueNumber
    };
    const request = { accessToken: this.access_token, issue: issue };
    const endpoint = BACKEND_URL + '/github/issue';
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        }
      });
      const json = await response.json();
      let newMessage = `The issue is titled ${json.issue.repository.issue.title}. `;
      newMessage += `This is the issue description. Explain the issue and give code with explanation to solve the issue. ${json.issue.repository.issue.body}`;
      this.allMessages.push({ role: 'user', text: newMessage });
      this.getAPIResponse();

    } catch (error) {
      console.error(error);
    }
  }

  handleReceivedMessage(event) {
    const message = event.data;
    switch (message.command) {
      case "response":
        this.removeLoader();
        this.addMessage(
          "assistant",
          new Date().toLocaleString(),
          message.text,
          message.messageId
        );
        break;
      case "loading":
        this.addLoader();
        break;
      case "debug":
        this.addMessage("user", new Date().toLocaleString(), message.errorMsg);
        setTimeout(() => this.addLoader(), 200);
        this.getAPIResponse(true);
        break;
    }
  }

  async handleRating(ratingValue, messageId) {
    this.allMessages.filter(
      (message) => message.messageId === messageId
    )[0].rating = ratingValue;
    // vscode.postMessage({ command: "test", text: `${JSON.stringify(this.allMessages)}}` });
    this.saveMessages();

    const request = { messageId, rating: ratingValue };
    const dbEndpoint = `${BACKEND_URL}/database/messages`;
    try {
      await fetch(dbEndpoint, {
        method: "PUT",
        body: JSON.stringify(request),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "Authorization": `Bearer ${this.access_token}`,
        },
      });
    } catch (error) {
      // Any errors in this API must not affect the user experience
    }
  }

  saveMessages() {
    const currentState = vscode.getState() || {};
    currentState.messages = this.allMessages;
    vscode.setState(currentState);
  }
}

async function openFile(name, path) {
  vscode.postMessage({
    command: 'open-file',
    url: path.endsWith(name) ? path : path + "\\" + name
  });
}