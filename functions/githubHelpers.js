
const fs = require('fs').promises;

const Octokit = require('@octokit/rest');

module.exports = (filename, owner, repo) => {
  class GitHubHelpers {
    constructor() {
      this.filename = filename;
      this.owner = owner;
      this.repo = repo;
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
    async numberOfClones() {
      console.log(`Fetching number of clones for repo: ${this.repo}`);
      try {
        // https://octokit.github.io/rest.js/#api-Repos-getClones
        let { data } = await this.octokit.repos.getClones({
          owner: this.owner,
          repo: this.repo,
        });
        return data;
      } catch (err) {
        console.error('Could not get Github clones');
        console.error(err);
      }
    }

    // open issues and PRs
    async numberOfIssuesAndPrs() {
      console.log(`Fetching number of issues for repo: ${this.repo}`);
      try {
        const options = await this.octokit.issues.listForRepo.endpoint.merge({
          owner: this.owner,
          repo: this.repo,
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
    async numberOfClosedIssues() {
      console.log(`Fetching number of issues for repo: ${this.repo}`);
      try {
        const options = await this.octokit.issues.listForRepo.endpoint.merge({
          owner: this.owner,
          repo: this.repo,
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

    async numberOfClosedIssuesYesterday() {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let date = new Date();
      today.setHours(0, 0, 0, 0);
      let yesterday = new Date(date.setDate(date.getDate() - 1));
      console.log(`Fetching number of closed issues for repo: ${this.repo}`);
      try {
        const options = await this.octokit.issues.listForRepo.endpoint.merge({
          owner: this.owner,
          repo: this.repo,
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

    async numberOfMergedPrsYesterday() {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let date = new Date();
      today.setHours(0, 0, 0, 0);
      let yesterday = new Date(date.setDate(date.getDate() - 1));
      console.log(`Fetching number of merged PRs for repo: ${this.repo}`);
      try {
        // Only get the last 100 updated PRs. Assuming we didn't update more
        // than 100 PRs since yesterday.
        const { data } = await this.octokit.pulls.list({
          owner: this.owner,
          repo: this.repo,
          state: 'closed',
          sort: 'updated',
          direction: 'desc',
          per_page: 100, 
        });
        console.log(`Found ${data.length} PRs`);

        let prs = data.filter(pr => pr.merged_at);
        console.log(`Found ${prs.length} merged PRs`);

        prs = data.filter(pr => {
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