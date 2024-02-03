import { Request, Response } from "express";
import { controller, httpGet, httpPost } from "inversify-express-utils";
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
      this.logger.info('Starting GitHub OAuth process');
      const { code } = req.body;

      // Get the user
      const access_token = await this.oAuthService.getAccessToken(code);
      const user_login = await this.oAuthService.getUserLogin(access_token);

      await this.databaseService.userService.getUserByLogin(user_login)
        || await this.databaseService.userService.createUserByLogin(user_login);

      this.logger.info('GitHub OAuth process completed successfully');
      return res.status(200).json({ success: true, access_token: access_token });
  }

  @httpGet("/validate-token/")
  async validateToken(req: Request, res: Response) {
    // No caching because token validity is time dependent
    res.set('Cache-Control', 'no-store');
    const token = req.headers.authorization || "";

    // Validate the token
    try {
      const user_login = await this.oAuthService.getUserLogin(token);
      const user = await this.databaseService.userService.getUserByLogin(user_login);
      if (user === null) {
        throw new Error('No user found');
      }
    } catch {
      return res.status(400).json({ success: false });
    }
    return res.status(200).json({ success: true });
  }
}
