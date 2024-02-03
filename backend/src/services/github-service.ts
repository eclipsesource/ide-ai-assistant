import { injectable } from "inversify";
import { GitHubIssueRequest } from "../protocol";

@injectable()
export default class GithubService implements GithubService {

  async getGitHubIssue(accessToken: string, issue: GitHubIssueRequest): Promise<any> {

    const apiUrl = 'https://api.github.com/graphql';

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const query = `
    query {
      repository(owner: "${issue.ownerName}", name: "${issue.repoName}") {
        issue(number: ${issue.issueNumber}) {
          title
          body
        }
      }
    }
  `;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ query: query }),
    });
    const data = await response.json();
    if (data.data) {
      return data.data;
    }
    throw new Error('Unable to fetch GH issue');
  }

}