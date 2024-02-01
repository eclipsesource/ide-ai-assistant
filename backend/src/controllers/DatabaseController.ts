import { Request, Response } from "express";
import { controller, httpGet, httpPut } from "inversify-express-utils";
import { OAuthService } from "../protocol";
import { inject } from "inversify";
import DatabaseService from "../services/database-service";
import { Logger } from "../config";
import { UserType } from "../database/models";

@controller("/database")
export class DatabaseController {
  @inject(DatabaseService) private databaseService: DatabaseService;
  @inject(Logger) private logger: Logger;
  @inject(OAuthService) private oAuthService: OAuthService;

  @httpGet("/users")
  async getDatabase(req: Request, res: Response) {
    const response = await this.databaseService.userService.getAllUsers();
    return res.json(response);
  }

  @httpGet("/projects")
  async getProjects(req: Request, res: Response) {
    const response = await this.databaseService.projectService.getAllProjects();
    return res.json(response);
  }

  @httpGet("/projects/:project_name/discussions")
  async getDiscussions(req: Request, res: Response) {
    const projectName = decodeURIComponent(req.params.project_name);
    const project = await this.databaseService.projectService.getProjectByName(projectName);
    if (!project) {
      throw new Error(`Project with name ${projectName} does not exist`);
    }
    const response = await this.databaseService.discussionService.getDiscussionByProject(project);
    return res.json(response);
  }

  @httpGet("/discussions/:discussionId/messages")
  async getMessages(req: Request, res: Response) {
    const response = await this.databaseService.messageService.getMessagesByDiscussionId(req.params.discussionId);
    return res.json(response);
  }

  // Only function accessed from user interface
  @httpPut("/messages")
  async updateMessage(request: Request, response: Response) {
    const { messageId } = request.body;
    const user = await this.getUser(request.headers.authorization || null);

    const message = await this.databaseService.messageService.getMessageById(messageId);
    const discussion = await this.databaseService.discussionService.getDiscussionById(message?.discussionId._id.toString() || "");
    if (!discussion || discussion.userId.toString() !== user._id.toString()) {
      throw new Error(`User ${user.login} is not the owner of the discussion ${discussion?._id.toString()}`);
    }

    this.databaseService.messageService.updateMessage(messageId, request.body);
    this.logger.info('Successfully updated message');
    return response.status(200).json({ success: true });
  }

  @httpGet("/isProjectLead/:projectName")
  async isUserProjectLead(req: Request, res: Response) {
    const projectName = decodeURIComponent(req.params.projectName);
    const user = await this.getUser(req.headers.authorization || null);
    const project = await this.databaseService.projectService.getProjectByName(projectName);
    if (!project) {
      throw new Error(`Project with name ${projectName} does not exist`);
    }
    if (project.projectLeads.includes(user._id)) {
      return res.status(200).json({ message: 'User is a project lead' });
    }
    return res.status(401).json({ error: `User ${user.login} is not a project lead of project ${projectName}` });
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
}
