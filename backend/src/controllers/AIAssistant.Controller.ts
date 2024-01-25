import { Response, Request as ExpressRequest } from "express";
import { inject } from "inversify";
import { controller, httpPost } from "inversify-express-utils";
import { AIASSISTANTSERVICE_BACKEND_PATH, AIAssistantBackendService, OAuthService, MessageRequest } from "../protocol";
import { validateBody } from "../config/validateBody-middleware";
import { DiscussionType, ProjectType, UserType } from "../database/models";
import DatabaseService from "../services/database-service";

interface Request extends ExpressRequest {
  user: UserType;
  body: any;
}

@controller(AIASSISTANTSERVICE_BACKEND_PATH)
export class AIAssistantController {
  
  @inject(AIAssistantBackendService) private aiAssistant: AIAssistantBackendService;
  @inject(OAuthService) private oAuthService: OAuthService;
  @inject(DatabaseService) private databaseService: DatabaseService;

  @httpPost("/", validateBody(MessageRequest))
  async getAnswer(req: Request, res: Response) {
      const { project_name } = req.body;
      
      const user = await this.getUser(req);
      const project = await this.getProject(project_name);
      const discussion = await this.getDiscussion(user, project);
      
      // Add user message to database
      const messageText = req.body.messages[req.body.messages.length - 1].content;
      this.databaseService.messageService.createMessage(discussion, "user", messageText, null, null);
      
      const response = await this.aiAssistant.getAnswer(req.body);
      if (response.content.content === null) {
        throw new Error("The response from the backend service is null");
      }
      
      // Add backend response message to database
      const APIMessage = await this.databaseService.messageService.createMessage(discussion, "assistant", response.content.content, null, null);
      
      return res.json({ ...response, messageId: APIMessage._id.toString() });
  }

  @httpPost("/summarize", validateBody(MessageRequest))
  async summarizeMessages(req: Request, res: Response) {
    await this.getUser(req); // Assert aceess_token is valid

    const response = await this.aiAssistant.summarizeMessages(req.body);
    return res.json(response);
  }

  async getUser(req: Request): Promise<UserType> {
      const { access_token } = req.body;
      const user_login = await this.oAuthService.getUserLogin(access_token);
      const user = await this.databaseService.userService.getUserByLogin(user_login);
      if (user === null) {
          // User should exists, or be created in github-oauth-controller
          throw new Error(`User with login ${user_login} does not exist`);
      }

      return user;
    }
  
  async getProject(project_name: string): Promise<ProjectType> {
    const project = await this.databaseService.projectService.getProjectByName(project_name)
                  || await this.databaseService.projectService.createProject(project_name);
    return project;
  }

  async getDiscussion(user: UserType, project: ProjectType): Promise<DiscussionType> {
    const discussion = await this.databaseService.discussionService.getDiscussion(user, project)
                    || await this.databaseService.discussionService.createDiscussion(user, project);
    return discussion;
  }
}
