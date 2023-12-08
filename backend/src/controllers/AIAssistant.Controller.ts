import { Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpPost } from "inversify-express-utils";
import { AIASSISTANTSERVICE_BACKEND_PATH, AIAssistantBackendService, MessageRequest } from "../protocol";
import { validateBody } from "../config/validateBody-middleware";
import GithubOAuthService from "../services/github-oauth-service";

@controller(AIASSISTANTSERVICE_BACKEND_PATH)
export class AIAssistantController {
  private githubOAuthService: GithubOAuthService;
  
  constructor() {
    this.githubOAuthService = new GithubOAuthService();
  }
  
  @inject(AIAssistantBackendService) private aiAssistant: AIAssistantBackendService;


  @httpPost("/github-oauth")
  async startGithubOAuth(req: Request, res: Response) {
    try {
      console.log('Starting GitHub OAuth process')
      const { code } = req.body;
      // console.log(req.body, code)
      await this.githubOAuthService.getUserToken(code);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('An error occurred while starting the GitHub OAuth process:', error);
      return res.status(500).json({ error: 'An error occurred while starting the GitHub OAuth process' });
    }
  }

  @httpPost("/", validateBody(MessageRequest))
  async getAnswer(req: Request, res: Response) {
    const response = await this.aiAssistant.getAnswer(req.body);
    return res.json(response);
  }
}
