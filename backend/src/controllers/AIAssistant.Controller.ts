import { Response, Request as ExpressRequest } from "express";
import { inject } from "inversify";
import { controller, httpGet, httpPost } from "inversify-express-utils";
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
      const { project_name, access_token } = req.body;
      
      const user = await this.getUser(access_token || null);
      const project = await this.getProject(project_name);
      const discussion = await this.getDiscussion(user, project);
      
      // Add user message to database
      const messageText = req.body.messages[req.body.messages.length - 1].content;
      this.databaseService.messageService.createMessage(discussion, "user", messageText, null);
      
      const response = await this.aiAssistant.getAnswer(req.body);
      if (response.content.content === null) {
        throw new Error("The response from the backend service is null");
      }
      
      // Add backend response message to database
      const APIMessage = await this.databaseService.messageService.createMessage(discussion, "assistant", response.content.content, null);
      
      return res.json({ ...response, messageId: APIMessage._id.toString() });
  }

  @httpGet("/summarize/:project_name")
  async summarizeMessages(req: Request, res: Response) {
    const projectName = decodeURIComponent(req.params.project_name);
    const user = await this.getUser(req.headers.authorization || null);
    const project = await this.databaseService.projectService.getProjectByName(projectName);

    if (!project || !project.projectLeads.includes(user._id)) {
      throw new Error(`User ${user.login} is not a project lead of project ${projectName}`);
    }

    // Retreive all messages and format as a request
    const allMessages = await this.databaseService.messageService.getAllMessagesByProject(project);
    const filteredMessages = allMessages.map((message) => {
      return { role: message.role, content: message.content };
    });
    const newRequest = { ...req.body, messages: filteredMessages };

    // Call the actual function to summarize messages
    const response = await this.aiAssistant.summarizeMessages(newRequest);
    return res.json(response);
  }

  async getUser(access_token: string | null): Promise<UserType> {
    if (access_token === null) {
        throw new Error("No access token provided");
    }
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
