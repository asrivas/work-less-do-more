/**
 * Returns the number of clones for repo the last 2 weeks.
 */
exports.numberOfClones = async (octokit, owner, repo) => {
  console.log(`Fetching number of clones for repo: ${repo}`);
  try {
    // https://octokit.github.io/rest.js/#api-Repos-getClones
    let { data } = await octokit.repos.getClones({
      owner: owner, repo: repo,
    });
    console.log(`Clones: ${data}`);
    console.log(data);
    return data;
  } catch (err) {
    console.error('Could not get Github clones');
    console.error(err);
  }
}

// open issues and PRs
exports.numberOfIssuesAndPrs = async (octokit, owner, repo) => {
  console.log(`Fetching number of issues for repo: ${repo}`);
  try {
    const options = await octokit.issues.listForRepo.endpoint.merge({
      owner,
      repo
    });
    const issues = await octokit.paginate(options);
    console.log(`Found ${issues.length} issues`);
    let prs = issues.filter(entry => entry.pull_request);
    return [issues.length - prs.length, prs.length];
  } catch (err) {
    console.error('Could not get Github issues');
    console.error(err);
  }
}

// Since the beginning of time
exports.numberOfClosedIssues = async (octokit, owner, repo) => {
  console.log(`Fetching number of issues for repo: ${repo}`);
  try {
    const options = await octokit.issues.listForRepo.endpoint.merge({
      owner,
      repo,
      state: 'closed'
    });
    const issues = await octokit.paginate(options);
    console.log(`Found ${issues.length} issues`);
    let prs = issues.filter(entry => entry.pull_request);
    console.log(issues[0]);
    return [issues.length - prs.length, prs.length];
  } catch (err) {
    console.error('Could not get closed Github issues');
    console.error(err);
  }
}

exports.numberOfClosedIssuesYesterday = async (octokit, owner, repo) => {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let yesterday = new Date(today.setDate(today.getDate() - 10));
  console.log(`Fetching number of closed issues for repo: ${repo}`);
  try {
    const options = await octokit.issues.listForRepo.endpoint.merge({
      owner,
      repo,
      state: 'closed',
      since: yesterday.toISOString(),
    });
    const issuesAndPrs = await octokit.paginate(options);
    console.log(`Found ${issuesAndPrs.length} issues and PRs`);
    let issues = issuesAndPrs.filter(entry => !entry.pull_request);
    issues = issues.filter(issue => {
      const closedAt = new Date(issue.closed_at);
      if (closedAt.getTime() > yesterday.getTime()
        && closedAt.getTime() < today.getTime()) {
        return true;
      }
      return false
    })
    console.log(issues[0]);
    return issues.length;
  } catch (err) {
    console.error('Could not get closed Github issues');
    console.error(err);
  }
}