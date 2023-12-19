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

        if (request.projectContext || request.userContext) {
            this.generateContextMessage(request);
        }
        const newContent = await this.getAnswerFromOpenAI(request.messages);

        return new Promise<MessageResponse>((resolve) => {
            resolve({ content: newContent });
        });
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
}
