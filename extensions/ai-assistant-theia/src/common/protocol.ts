import { JsonRpcServer } from '@theia/core/lib/common/messaging';
export const BackendClient = Symbol('BackendClient');

// Message Type
export type chatMessage = {
    role: string,
    content: string | null,
}

//OpenAI Backend Service
export const AIAssistantBackendService = Symbol('AIAssistantBackendService');
export const AIASSISTANTSERVICE_BACKEND_PATH = '/services/aiAssistantBackend';

export interface AIAssistantBackendService extends JsonRpcServer<BackendClient> {
    getAnswer(question: string): Promise<chatMessage>
}
export interface BackendClient {
    getName(): Promise<string>;
}