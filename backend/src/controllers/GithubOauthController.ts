import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import GithubOAuthService from "../services/github-oauth-service";

import { UserService } from "../database/services/UserService";

@controller("/github-oauth")
export class GithubOauthController {
  private githubOAuthService: GithubOAuthService;
  private userService = new UserService();
  
  constructor() {
    this.githubOAuthService = new GithubOAuthService();
  }

  @httpPost("/")
  async startGithubOAuth(req: Request, res: Response) {
    try {
      console.log('Starting GitHub OAuth process')
      const { code } = req.body;

      // Get the user
      const access_token = await this.githubOAuthService.getAccessToken(code);
      const user_email = await this.githubOAuthService.getUserEmail(access_token);

      let user = await this.userService.getUserByEmail(user_email);

      if (user == null) {
        await this.userService.createUserByEmail(user_email);
      }

      return res.status(200).json({ success: true, access_token: access_token });
    } catch (error) {
      console.error('An error occurred while starting the GitHub OAuth process:', error);
      return res.status(500).json({ error: 'An error occurred while starting the GitHub OAuth process' });
    }
  }

}
