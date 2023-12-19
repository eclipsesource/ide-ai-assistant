import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import DatabaseService from "../services/database-service";
import { Logger } from "../config";
import { OAuthService } from "../protocol";

@controller("/github-oauth")
export class GithubOauthController {

  @inject(OAuthService) private oAuthService: OAuthService;
  @inject(DatabaseService) private databaseService: DatabaseService;
  @inject(Logger) private logger: Logger;

  @httpPost("/")
  async startGithubOAuth(req: Request, res: Response) {
    try {
      this.logger.info('Starting GitHub OAuth process');
      const { code } = req.body;

      // Get the user
      const access_token = await this.oAuthService.getAccessToken(code);
      const user_login = await this.oAuthService.getUserLogin(access_token);

      let user = await this.databaseService.userService.getUserByLogin(user_login);

      if (user == null) {
        await this.databaseService.userService.createUserByLogin(user_login);
      }

      this.logger.info('GitHub OAuth process completed successfully');
      return res.status(200).json({ success: true, access_token: access_token });
    } catch (error) {
      this.logger.error('An error occurred while starting the GitHub OAuth process:' + error);
      return res.status(500).json({ error: 'An error occurred while starting the GitHub OAuth process' });
    }
  }
}
