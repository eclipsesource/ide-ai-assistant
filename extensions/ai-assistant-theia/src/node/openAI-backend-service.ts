import { injectable } from '@theia/core/shared/inversify';
import { AIAssistantBackendService, chatMessage } from '../common/protocol';
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: "", // TODO: since this is a prototype, the apikey is hardcoded at the moment
  });

@injectable()
export class OpenAIAssistantImpl implements AIAssistantBackendService {
    //private client?: BackendClient;
    dispose(): void {
        // do nothing
    }
    setClient(): void {
        //this.client = client;
    }

    // TODO: This API can fail and we would need to handle that. I believe we need to look into choices[0].finish_reason
    // Also adding all previous chatMessages would be nice, also add context
    async getAnswer(question: string): Promise<chatMessage> {
        if (openai.apiKey == "") {
            return new Promise<chatMessage>((resolve, reject) => (reject("No API Key")));
        }

        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: question }],
            model: 'gpt-3.5-turbo',
          });
        return new Promise<chatMessage>((resolve) => { resolve(chatCompletion.choices[0].message) });
    }
}
