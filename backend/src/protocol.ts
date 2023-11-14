//Frontend protocols
export type Message = {
    role: "assistant"|"user",
    content: string | null,
};

export type MessageRequest = {
    messages: Message[],
    projectContext?: string,
    userContext?: string,
};

export type MessageResponse = {
    error: string,
    content?: Message,
};

//OpenAI Backend Service
export const AIAssistantBackendService = Symbol('AIAssistantBackendService');
export const AIASSISTANTSERVICE_BACKEND_PATH = '/services/aiAssistantBackend';

export interface AIAssistantBackendService {
    getAnswer(question: MessageRequest): Promise<MessageResponse>
}