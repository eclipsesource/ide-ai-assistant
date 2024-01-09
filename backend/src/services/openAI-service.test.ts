import 'reflect-metadata';
import container from "../backendmodule";
import { AIAssistantBackendService } from "../protocol";



describe("OpenAI-Service", () => {
    beforeEach(() => {
        process.env.API_KEY = undefined;
    });


    it("Should throw an error on a invalid request", async () => {
        process.env.API_KEY = "";
        const openAIAssistantImpl = container.get<AIAssistantBackendService>(AIAssistantBackendService);
        const inValidRequest = { messages: [], access_token: "", projectName: "" };
        await expect(openAIAssistantImpl.getAnswer(inValidRequest)).rejects.toThrowErrorMatchingSnapshot();
    });
});