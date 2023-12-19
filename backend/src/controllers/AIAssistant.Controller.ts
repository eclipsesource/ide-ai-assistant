import { Response, Request as ExpressRequest } from "express";
import { inject } from "inversify";
import { controller, httpPost } from "inversify-express-utils";
import { AIASSISTANTSERVICE_BACKEND_PATH, AIAssistantBackendService, MessageRequest } from "../protocol";
import { validateBody } from "../config/validateBody-middleware";
import GithubOAuthService from "../services/github-oauth-service";
import { DiscussionService, MessageService, UserService } from "../database/services";
import { DiscussionType, UserType } from "../database/models";

interface Request extends ExpressRequest {
  user: UserType;
  body: any;
}

@controller(AIASSISTANTSERVICE_BACKEND_PATH)
export class AIAssistantController {
  private discussionService = new DiscussionService();
  private userService = new UserService();
  private messageService = new MessageService();
  private githubOAuthService = new GithubOAuthService();
  
  constructor() { }
  
  @inject(AIAssistantBackendService) private aiAssistant: AIAssistantBackendService;


  @httpPost("/", validateBody(MessageRequest))
  async getAnswer(req: Request, res: Response) {
    try {
      const { projectName } = req.body;
      const user = await this.getUser(req);
      
      const discussion = await this.getDiscussion(user, projectName);
      
      // Add user message to database
      const messageText = req.body.messages[req.body.messages.length - 1].content
      this.messageService.createMessage(discussion, "user", messageText, null, null);
      
      const response = await this.aiAssistant.getAnswer(req.body);
      if (response.content.content == null) {
        throw new Error("The response from the backend service is null");
      }
      
      // Add backend response message to database
      this.messageService.createMessage(discussion, "assistant", response.content.content, null, null);
      
      return res.json(response);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  async getUser(req: Request): Promise<UserType> {
      const { access_token } = req.body;
      const user_login = await this.githubOAuthService.getUserLogin(access_token);
      const user = await this.userService.getUserByLogin(user_login);
      if (user == null) {
          throw new Error(`User with login ${user_login} does not exist`);
      }

      return user;
    }
  
  async getDiscussion(user: UserType, projectName: string): Promise<DiscussionType> {
    let discussion = await this.discussionService.getDiscussion(user, projectName);
    if (discussion == null) {
      discussion = await this.discussionService.createDiscussion(user, projectName);
    }

    if (discussion == null) {
      throw new Error(`Discussion with user ${user} and project ${projectName} does not exist`);
    }

    return discussion;
  }
}
