const Octokit = require('@octokit/rest');
const fs = require('fs').promises;

const listOrgRepos = async (octokit) => {
  // Compare: https://developer.github.com/v3/repos/#list-organization-repositories
  const options = await octokit.repos.listForOrg.endpoint.merge({
    org: 'GoogleCloudPlatform',
    type: 'public'
  });
  const repos = await octokit.paginate(options);
  console.log(`Found ${repos.length} repos`);
  for (const repo of repos) {
    // console.log(repo.html_url);
    // console.log(repo.full_name);
    // console.log();
  }
}

const numberOfClones = async (octokit) => {
  // https://octokit.github.io/rest.js/#api-Repos-getClones
  const { data } = await octokit.repos.getClones({
    owner: 'GoogleCloudPlatform', repo: 'nodejs-getting-started',
  });
  console.log(`Clones: ${data.count}`);
}

const numberOfViews = async (octokit) => {
  const { data } = await octokit.repos.getViews({
    owner: 'GoogleCloudPlatform', repo: 'nodejs-getting-started', per: 'week',
  });
  console.log(`Views: ${data.count}`);
  // The 14 day period is split into 3 weeks, where first and last week do
  // not include data for all 7 weeks. Only look at the middle week where
  // data is complete.
  console.log(`Weekly views: ${data.views[1].count}`);

}

const popularContent = async (octokit) => {
  const { data } = await octokit.repos.getTopPaths({
    owner: 'GoogleCloudPlatform', repo: 'nodejs-getting-started', per: 'week',
  });
  // Only provides compound data for 14 days
  console.log(`Top path: ${data[0].path}, ${data[0].count} views`);
}

const main = async () => {
  const token = (await fs.readFile('githubToken.json')).toString().trim();
  const octokit = new Octokit({ auth: `token ${token}` });

  // listOrgRepos(octokit);
  await numberOfClones(octokit);
  await numberOfViews(octokit);
  await popularContent(octokit);
}

main();