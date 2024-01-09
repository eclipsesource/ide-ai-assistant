import { Request, Response } from "express";
import { controller, httpGet, httpPut } from "inversify-express-utils";
import { inject } from "inversify";
import DatabaseService from "../services/database-service";
import { Logger } from "../config";

@controller("/database")
export class DatabaseController {
  @inject(DatabaseService) private databaseService: DatabaseService;
  @inject(Logger) private logger: Logger;

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

  @httpGet("/discussions")
  async getDiscussions(req: Request, res: Response) {
    const response = await this.databaseService.discussionService.getAllDiscussions();
    return res.json(response);
  }

  @httpGet("/messages")
  async getMessages(req: Request, res: Response) {
    const response = await this.databaseService.messageService.getAllMessages();
    return res.json(response);
  }

  @httpGet("discussions/:id")
  async getDiscussion(req: Request, res: Response) {
    const { id } = req.params;
    // const response = await this.discussionService.getDiscussionById(id);
    const messages = await this.databaseService.messageService.getMessagesByDiscussionId(id);
    return res.json(messages);
  }

  @httpPut("/messages")
  async updateMessage(request: Request, response: Response) {
    try {
      const {messageId} = request.body;
      this.databaseService.messageService.updateMessage(messageId, request.body);
      this.logger.info('Successfully updated message');
      return response.status(200).json({ success: true });
    } catch (error) {
      console.error('Error making update request:', error.message);
      response.status(500).json({ error: 'Internal server error' });
    }
  }
}
