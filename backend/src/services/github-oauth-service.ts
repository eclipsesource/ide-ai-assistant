import { Octokit } from "@octokit/rest";
import { injectable } from "inversify";
import { OAuthService } from "../protocol";

@injectable()
export default class GithubOAuthService implements OAuthService {
  clientId = 'f6843855679852363fae';
  clientSecret = process.env.CLIENT_SECRET;

  async getAccessToken(user_code: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: user_code,
      }),
    });

    const data = await response.json();
    if (data) {
      return data.access_token;
    }

    throw new Error('No access token received');
  }

  async getUserLogin(accessToken: string): Promise<string> {

    const octokit = new Octokit({
      auth: accessToken,
    });

    const { data: user } = await octokit.rest.users.getAuthenticated();

    if (user && user.login) {
      return user.login;
    }

    throw new Error('No github login is associated with given access token');
  }

  async validateToken(token: string): Promise<boolean> {
    const octokit = new Octokit({
      auth: token,
    });

    try {
      await octokit.rest.users.getAuthenticated();
      return true;
    } catch (e) {
      return false;
    }
  }

}

