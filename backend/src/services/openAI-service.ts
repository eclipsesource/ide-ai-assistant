/**
 * @file openAI-service.ts
 * @summary This file contains the implementation of the OpenAIAssistantImpl class. This class implements the AIAssistantBackendService interface and is responsible for handling requests to the OpenAI API and returning responses to the client.
 * @requires @theia/core/shared/inversify
 * @requires openai
 * @requires ../config
 * @requires ../protocol
 */
import { injectable } from '@theia/core/shared/inversify';
import { OpenAI } from "openai";
import { BadRequestException, BaseException } from '../config';
import { AIAssistantBackendService, Message, MessageRequest, MessageResponse } from '../protocol';


const openai = new OpenAI({
    apiKey: process.env.API_KEY ? process.env.API_KEY : "",
});

@injectable()
export class OpenAIAssistantImpl implements AIAssistantBackendService {

    async getAnswer(request: MessageRequest): Promise<MessageResponse> {
        const [isValidRequest, errorMessage] = this.validRequest(request);
        if (!isValidRequest) {
            throw new BadRequestException(errorMessage);
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
        const chatCompletion = await openai.chat.completions.create({
            messages: messages,
            model: process.env.OPENAI_MODEL ? process.env.OPENAI_MODEL : "gpt-3.5-turbo",
        }).catch((e) => {
            throw new BaseException(e.error.type, e.status, e.error.message);
        });

        return new Promise<Message>((resolve) => { resolve(chatCompletion!.choices[0].message); });
    }
}
