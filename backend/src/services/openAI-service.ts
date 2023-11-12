import { injectable } from '@theia/core/shared/inversify';
import { AIAssistantBackendService, Message, MessageRequest, MessageResponse } from '../protocol';
import { OpenAI } from "openai";
import 'reflect-metadata';
import * as dotenv from "dotenv";
import logger from '../loggers/logger';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.API_KEY ? process.env.API_KEY : "",
});

@injectable()
export class OpenAIAssistantImpl implements AIAssistantBackendService {
    // TODO: This API can fail and we would need to handle that. I believe we need to look into choices[0].finish_reason
    // Also adding all previous chatMessages would be nice, also add context
    async getAnswer(request: MessageRequest): Promise<MessageResponse> {
        const [isValidRequest, errorMessage] = this.validRequest(request);
        if (!isValidRequest) {
            return new Promise<MessageResponse>((_, reject) => (reject(errorMessage)));
        }

        let error = "";
        let newContent = await this.getAnswerFromOpenAI(request.messages)
            .catch((e: string) => {
                error = e;
                const message: Message = { role: "assistant", content: "An error has occured. So we are not able to answer your question." };
                return message;
            });

        return { error: error, content: newContent }
    }

    private validRequest(request: MessageRequest): [boolean, string] {
        if (openai.apiKey == "") {
            return [false, "OpenAI API Key is not set"];
        }
        return [true, ""]

    }

    private async getAnswerFromOpenAI(messages: Message[]): Promise<Message> {
        let error = "";
        const chatCompletion = await openai.chat.completions.create({
            messages: messages,
            model: 'gpt-3.5-turbo',
        }).catch((e) => { logger.log(e); error = e.error.message; });

        if (chatCompletion == undefined) {
            return new Promise<Message>((_, reject) => { reject(error) });
        }

        return new Promise<Message>((resolve) => { resolve(chatCompletion.choices[0].message) });
    }
}
