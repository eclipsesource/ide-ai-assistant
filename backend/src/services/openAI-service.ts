/**
 * @file openAI-service.ts
 * @summary This file contains the implementation of the OpenAIAssistantImpl class. This class implements the AIAssistantBackendService interface and is responsible for handling requests to the OpenAI API and returning responses to the client.
 * @requires @theia/core/shared/inversify
 * @requires openai
 * @requires ../config
 * @requires ../protocol
 */
import { inject, injectable } from '@theia/core/shared/inversify';
import { OpenAI } from "openai";
import { Logger } from '../config';
import { AIAssistantBackendService, Message, MessageRequest, MessageResponse } from '../protocol';


const openai = new OpenAI({
    apiKey: process.env.API_KEY ? process.env.API_KEY : "",
});

@injectable()
export class OpenAIAssistantImpl implements AIAssistantBackendService {
    
    constructor(@inject(Logger) private readonly logger: Logger) { }

    async getAnswer(request: MessageRequest): Promise<MessageResponse> {
        const [isValidRequest, errorMessage] = this.validRequest(request);
        if (!isValidRequest) {
            return new Promise<MessageResponse>((_, reject) => (reject(errorMessage)));
        }

        let error = "";
        const newContent = await this.getAnswerFromOpenAI(request.messages)
            .catch((e: string) => {
                error = e;
                const message: Message = { role: "assistant", content: "An error has occured. So we are not able to answer your question." };
                return message;
            });

        return { error: error, content: newContent };
    }

    private validRequest(request: MessageRequest): [boolean, string] {
        if (openai.apiKey === "") {
            return [false, "OpenAI API Key is not set"];
        }

        return [true, ""];
    }

    private async getAnswerFromOpenAI(messages: Message[]): Promise<Message> {
        let error = "";
        const chatCompletion = await openai.chat.completions.create({
            messages: messages,
            model: 'gpt-3.5-turbo',
        }).catch((e) => { this.logger.error(e); error = e.error.message; });

        if (chatCompletion === undefined) {
            return new Promise<Message>((_, reject) => { reject(error); });
        }

        return new Promise<Message>((resolve) => { resolve(chatCompletion.choices[0].message); });
    }
}
