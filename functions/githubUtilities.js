
const fs = require('fs').promises;

const Octokit = require('@octokit/rest');

module.exports = (filename) => {
  class GitHubHelpers {
    constructor() {
      this.filename = filename;
    }

    async init() {
      if (!this.filename) {
        throw new Error('No filename for token in GitHub Helpers');
      }
      const token = (await fs.readFile(this.filename)).toString().trim();
      this.octokit = new Octokit({ auth: `token ${token}` });
    }

    /**
     * Returns the number of clones for repo the last 2 weeks.
     */
    async numberOfClones(owner, repo) {
      console.log(`Fetching number of clones for repo: ${repo}`);
      try {
        // https://octokit.github.io/rest.js/#api-Repos-getClones
        let { data } = await this.octokit.repos.getClones({
          owner: owner, repo: repo,
        });
        console.log(`Clones: ${data}`);
        return data;
      } catch (err) {
        console.error('Could not get Github clones');
        console.error(err);
      }
    }

    // open issues and PRs
    async numberOfIssuesAndPrs(owner, repo) {
      console.log(`Fetching number of issues for repo: ${repo}`);
      try {
        const options = await this.octokit.issues.listForRepo.endpoint.merge({
          owner,
          repo
        });
        const issues = await this.octokit.paginate(options);
        console.log(`Found ${issues.length} issues`);
        let prs = issues.filter(entry => entry.pull_request);
        return [issues.length - prs.length, prs.length];
      } catch (err) {
        console.error('Could not get Github issues');
        console.error(err);
      }
    }

    // Since the beginning of time
    async numberOfClosedIssues(owner, repo) {
      console.log(`Fetching number of issues for repo: ${repo}`);
      try {
        const options = await this.octokit.issues.listForRepo.endpoint.merge({
          owner,
          repo,
          state: 'closed'
        });
        const issues = await this.octokit.paginate(options);
        console.log(`Found ${issues.length} issues`);
        let prs = issues.filter(entry => entry.pull_request);
        return [issues.length - prs.length, prs.length];
      } catch (err) {
        console.error('Could not get closed Github issues');
        console.error(err);
      }
    }

    async numberOfClosedIssuesYesterday(owner, repo) {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let date = new Date();
      today.setHours(0, 0, 0, 0);
      let yesterday = new Date(date.setDate(date.getDate() - 1));
      console.log(`Fetching number of closed issues for repo: ${repo}`);
      try {
        const options = await this.octokit.issues.listForRepo.endpoint.merge({
          owner,
          repo,
          state: 'closed',
          since: yesterday.toISOString(),
        });
        const issuesAndPrs = await this.octokit.paginate(options);
        console.log(`Found ${issuesAndPrs.length} issues and PRs`);
        let issues = issuesAndPrs.filter(entry => !entry.pull_request);

        issues = issues.filter(issue => {
          const closedAt = new Date(issue.closed_at);
          if ((closedAt.getTime() > yesterday.getTime())
            && (closedAt.getTime() < today.getTime())) {
            return true;
          }
          return false
        })
        return issues.length;
      } catch (err) {
        console.error('Could not get closed Github issues');
        console.error(err);
      }
    }

    async numberOfMergedPrsYesterday(owner, repo) {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let date = new Date();
      today.setHours(0, 0, 0, 0);
      let yesterday = new Date(date.setDate(date.getDate() - 1));
      console.log(`Fetching number of merged PRs for repo: ${repo}`);
      try {
        const options = await this.octokit.pulls.list.endpoint.merge({
          owner,
          repo,
          state: 'closed',
          since: yesterday.toISOString(),
        });
        let prs = await this.octokit.paginate(options);
        console.log(`Found ${prs.length} PRs`);

        prs = prs.filter(pr => {
          const mergedAt = new Date(pr.merged_at);
          if ((mergedAt.getTime() > yesterday.getTime())
            && (mergedAt.getTime() < today.getTime())) {
            return true;
          }
          return false
        })
        return prs.length;
      } catch (err) {
        console.error('Could not get closed Github PRs');
        console.error(err);
      }
    }
  }

  return GitHubHelpers;
}