class ChatApp {
  projectName = "sampleProject";

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

    // Retrieve messages from the state
    // vscode.setState({ access_token: vscode.getState().access_token }); // To uncomment if needed to reset 
    this.loadMessages();
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
  }

  removeLoader() {
    this.displayLoading = false;
    const loader = document.getElementById("loader");
    if (loader) {
      loader.remove();
    }
  }

  async handleSendMessage() {
    const inputValue = this.input.value;

    if (inputValue.trim() === "") {
      return; // Don't process empty messages
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
      projectName: this.projectName,
    };

    const command = debug ? "debug-command" : "message";
    let APIResponse;
    let messageId = 0;

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
        !json.content.content ||
        json.content.role !== "assistant" ||
        !json.messageId
      ) {
        throw new Error(
          `An error occured while communicating with the backend, response is not valid: ${json}.`
        );
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
      messageId: messageId,
    });
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
