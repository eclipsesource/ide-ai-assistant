/**
 * @file openAI-service.ts
 * @summary This file contains the implementation of the OpenAIAssistantImpl class. This class implements the AIAssistantBackendService interface and is responsible for handling requests to the OpenAI API and returning responses to the client.
 * @requires @theia/core/shared/inversify
 * @requires openai
 * @requires ../config
 * @requires ../protocol
 */
import { injectable } from 'inversify';
import { OpenAI } from "openai";
import { BadRequestException, BaseException } from '../config';
import { AIAssistantBackendService, Message, MessageRequest, MessageResponse } from '../protocol';


@injectable()
export class OpenAIAssistantImpl implements AIAssistantBackendService {

    private readonly openai = new OpenAI({
        apiKey: process.env.API_KEY ? process.env.API_KEY : "",
    });

    async getAnswer(request: MessageRequest): Promise<MessageResponse> {
        const [isValidRequest, errorMessage] = this.validRequest(request);
        if (!isValidRequest) {
            throw new BadRequestException(errorMessage);
        }

        this.generateContextMessage(request);

        const newContent = await this.getAnswerFromOpenAI(request.messages);

        return new Promise<MessageResponse>((resolve) => {
            resolve({ content: newContent });
        });
    }

    async summarizeMessages(request: MessageRequest): Promise<Message[]> {
        const [isValidRequest, errorMessage] = this.validRequest(request);
        if (!isValidRequest) {
            throw new BadRequestException(errorMessage);
        }

        const formatedMessages: Message[] = [];
        formatedMessages.push(this.generateSummarizeMessage(request));
        formatedMessages.push({"role": "user", content: JSON.stringify(request.messages) });

        const answer: Message = await this.getAnswerFromOpenAI(formatedMessages);

        if (answer.content === null) {
            throw new BaseException("OpenAI returned null", 500, "OpenAI returned null");
        }

        // Parse the markdown returned by OpenAI to get the JSON object
        const parsedText = answer.content.replace(/```json\n|\n```/g, '').trim();
        const newMessages = JSON.parse(parsedText);
        if (!Array.isArray(newMessages) || !newMessages.every(msg => typeof msg === 'object' && 'content' in msg)) {
            throw new BaseException("OpenAI returned invalid JSON", 500, "OpenAI returned invalid JSON");
        }

        return new Promise<Message[]>((resolve) => { resolve( newMessages ); });
    }

    private validRequest(request: MessageRequest): [boolean, string] {
        // This is more of a placeholder function. If we want to add more validation to the request, we can do it here.
        return [true, ""];
    }

    private async getAnswerFromOpenAI(messages: Message[]): Promise<Message> {
        const chatCompletion = await this.openai.chat.completions.create({
            messages: messages,
            model: process.env.OPENAI_MODEL ? process.env.OPENAI_MODEL : "gpt-3.5-turbo",
        }).catch((e) => {
            throw new BaseException(e.error.type, e.status, e.error.message);
        });

        return new Promise<Message>((resolve) => { resolve(chatCompletion!.choices[0].message); });
    }

    /**
     * This function generates a context message based on the user and project context provided in the request.
     * The generated context message is then added to the beginning of the messages array in the request.
     *
     * @param {MessageRequest} request - The request object containing userContext and projectContext.
     */
    private generateContextMessage(request: MessageRequest) {
        var InstructionMessage = `You are an AI assistant in an IDE. 
        You are helping a developer with a project.
        You are an expert in the project and should be able to answer any question about it precisly and concisely.
        If the user gives you an terminal error, you should give them a command to fix it.
        This command should be given in a code snippet.
        If multiple commands are needed you should give them in one code snippet on one line, and separate each command with a space then a semicolon.
        If you decide to give commands you should start the message by saying to the user that you have pasted commands in the terminal, and the user should review and execute them.
        `;

        if (request.userContext) {
            InstructionMessage += "This is the user context: " + request.userContext + "\n";
        }
        if (request.projectContext) {
            InstructionMessage += "This is the project context: " + request.projectContext;
        }

        request.messages.unshift({ role: "user", content: InstructionMessage });
    }

    private generateSummarizeMessage(request: MessageRequest): Message {
        const InstructionMessage = `
        You are an AI assistant in an IDE.
        You are helping a developper, which is a project lead on the currently opened project ${request.project_name}.
        The main goal here is for you to summarize a list of messages. 
        These messages correspond to discussions between other developpers working on this project and an AI assistant.
        Theses messages will be passed as message content in the next message.
        Please return a JSON object containing the summarized messages following the format: 
        [{content: "message 1 request goes here", role: "user"}, {content: "message 1 response goes here", role: "assistant"}, ...]
        The role should either be 'user' for the questions or 'assistant' for the responses.
        You need to send the messages only by pairs, with one question and one answer. It's necessary.

        What is asked of you is to summarize the potentially long list of messages.
        You are free to summarize as much as possible while keeping structure and sense for a project lead.
        You could remove messages that are irrelevant to the project, only contain gibberish, or that are asked multiple times.
        You could shorten long messages in order to keep only the important parts.
        You should remove parts that are not relative to programming, or relative to any AI Assistant - user interaction (such as ... further assistance).

        You may return an empty list (no messages) if none are important.

        The final goal will be that the project lead will review those summarized messages, and will then update the project README with the important information.
        `;

        return { role: "user", content: InstructionMessage };
    }
}
