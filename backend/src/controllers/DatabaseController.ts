import { Request, Response } from "express";
import { controller, httpGet } from "inversify-express-utils";
import { UserService, DiscussionService, MessageService } from "../database/services";

@controller("/database")
export class DatabaseController {
  private userService = new UserService();
  private discussionService = new DiscussionService();
  private messageService = new MessageService();
  


  @httpGet("/users")
  async getDatabase(req: Request, res: Response) {
    const response = await this.userService.getAllUsers();
    return res.json(response);
  }

  @httpGet("/discussions")
  async getDiscussions(req: Request, res: Response) {
    const response = await this.discussionService.getAllDiscussions();
    return res.json(response);
  }

  @httpGet("/messages")
  async getMessages(req: Request, res: Response) {
    const response = await this.messageService.getAllMessages();
    return res.json(response);
  }

  @httpGet("discussions/:id")
  async getDiscussion(req: Request, res: Response) {
    const { id } = req.params;
    // const response = await this.discussionService.getDiscussionById(id);
    const messages = await this.messageService.getMessagesByDiscussionId(id);
    return res.json(messages);
  }

}
