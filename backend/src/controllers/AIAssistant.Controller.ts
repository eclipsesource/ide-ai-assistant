import { Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpPost } from "inversify-express-utils";
import { AIASSISTANTSERVICE_BACKEND_PATH, AIAssistantBackendService } from "../protocol";

@controller(AIASSISTANTSERVICE_BACKEND_PATH)
export class AIAssistantController {
  constructor(@inject(AIAssistantBackendService) private aiAssistant: AIAssistantBackendService) { }

  @httpPost("/")
  async getAnswer(req: Request, res: Response) {
    const response = await this.aiAssistant.getAnswer(req.body);
    return res.json(response);
  }
}