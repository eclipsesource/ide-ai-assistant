import { UserService } from "../database/services/UserService";

export default class GithubOAuthService {
  clientId = 'f6843855679852363fae';
  clientSecret = process.env.CLIENT_SECRET;
  userService = new UserService();

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

  async getUserEmail(accessToken: string): Promise<string> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data) {
      return data[0].email;
    }

    throw new Error('No email received');
  }

}

