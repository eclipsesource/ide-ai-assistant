import {
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

//Frontend protocols
export class Message {
    @IsString()
    @IsNotEmpty()
    role: "assistant" | "user";
    @IsString()
    @IsNotEmpty()
    content: string | null;
};

export class MessageRequest {
    @IsArray()
    @ArrayMinSize(1)
    @IsNotEmpty()
    messages: Message[];

    @IsString()
    @IsOptional()
    projectContext?: string;

    @IsString()
    @IsOptional()
    userContext?: string;

    @IsString()
    access_token: string;

    @IsString()
    project_name: string;
}

export type MessageResponse = {
    content: Message,
};

//OpenAI Backend Service
export const AIAssistantBackendService = Symbol('AIAssistantBackendService');
export const OAuthService = Symbol('OAuthService');
export const AIASSISTANTSERVICE_BACKEND_PATH = '/services/aiAssistantBackend';

export interface AIAssistantBackendService {
    getAnswer(question: MessageRequest): Promise<MessageResponse>
    summarizeMessages(messages: MessageRequest): Promise<Message[]>
}

export interface OAuthService {
    getAccessToken(user_code: string): Promise<string>;
    getUserLogin(accessToken: string): Promise<string>;
}
