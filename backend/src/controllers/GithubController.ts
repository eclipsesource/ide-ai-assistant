import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import GithubService from "../services/github-service";

@controller("/github")
export class GithubController {

  @inject(GithubService) private githubService: GithubService;
  @httpPost("/issue")
  async fetchGithubIssue(req: Request , res: Response) {
    const { access_token, issue } = req.body
    const response = await this.githubService.getGitHubIssue(access_token, issue);
    return res.status(200).json({ success: true, issue: response });
  }
}
