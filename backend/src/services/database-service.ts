import { injectable } from "inversify";
import { UserService, DiscussionService, MessageService, ProjectService } from "../database/services";

@injectable()
export default class DatabaseService {
    public userService: UserService = new UserService();
    public discussionService: DiscussionService = new DiscussionService();
    public messageService: MessageService = new MessageService();
    public projectService: ProjectService = new ProjectService();
}
