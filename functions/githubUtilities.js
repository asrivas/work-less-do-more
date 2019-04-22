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

/**
 * Returns the number of issues for repo.
 */
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
