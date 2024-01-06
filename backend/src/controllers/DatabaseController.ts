import { Request, Response } from "express";
import { controller, httpGet } from "inversify-express-utils";
import { inject } from "inversify";
import DatabaseService from "../services/database-service";

@controller("/database")
export class DatabaseController {
  @inject(DatabaseService) private databaseService: DatabaseService;

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

}
