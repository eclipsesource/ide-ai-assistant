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
import { ChatCompletionTool } from 'openai/resources/';

import { DefaultInstructionMessage, InstructionMessageGenerateReadME, SummarizeInstructionMessage } from './InstructionMessages';

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

    async generateReadME(request: MessageRequest): Promise<string> {
        let instructionMessage = InstructionMessageGenerateReadME;
        instructionMessage += `Here is the current README: \n${request.readme}\n`;
        request.messages.unshift({ role: "user", content: instructionMessage });

        const newContent = await this.getAnswerFromOpenAI(request.messages);

        return new Promise<string>((resolve) => {
            resolve(newContent.content!);
        });
    }
    
    private validRequest(request: MessageRequest): [boolean, string] {
        // This is more of a placeholder function. If we want to add more validation to the request, we can do it here.
        return [true, ""];
    }

    private async getAnswerFromOpenAI(messages: Message[]): Promise<Message> {
        const tools: ChatCompletionTool[] = [
            {
                type: "function",
                function: {
                    name: "openFile",
                    description: "Open a file from relative path",
                    parameters: {
                        type: "object",
                        properties: {
                            fileName: {
                                type: "string",
                                description: "Name of the relevant file"
                            },
                            filePath: {
                                type: "string",
                                description: "Relative path of the file from root"
                            },
                        },
                        required: ["fileName", "filePath"]
                    }
                }
            }, {
                type: "function",
                function: {
                    name: "getGithubIssue",
                    description: "Send github issue number",
                    parameters: {
                        type: "object",
                        properties: {
                            issueNumber: {
                                type: "integer",
                                description: "Github issue number"
                            },
                            issueDescription: {
                                type: "string",
                                description: "Explanation of the issue"
                            },
                            issueSolution: {
                                type: "string",
                                description: "Relevant information or code to solve the issue"
                            }
                        },
                        required: ["issueNumber"]
                    }
                }
            }
        ];
        const chatCompletion = await this.openai.chat.completions.create({
            messages: messages,
            model: process.env.OPENAI_MODEL ? process.env.OPENAI_MODEL : "gpt-3.5-turbo",
            tools: tools,
            tool_choice: 'auto'
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
    
    private generateContextMessage(request: MessageRequest, instructionMessage: string|null = null) {  
        var InstructionMessage = DefaultInstructionMessage;

        if (instructionMessage) {
            InstructionMessage = instructionMessage;
        }

        if (request.userContext) {
            InstructionMessage += "This is the user context: " + request.userContext + "\n";
        }
        if (request.projectContext) {
            InstructionMessage += "This is the project context: " + request.projectContext;
        }

        request.messages.unshift({ role: "user", content: InstructionMessage });
    }

    private generateSummarizeMessage(request: MessageRequest): Message {
        const InstructionMessage = SummarizeInstructionMessage(request);
        return { role: "user", content: InstructionMessage };
    }
}
