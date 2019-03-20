const Octokit = require('@octokit/rest');

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
  const {data} = await octokit.repos.getClones({
    owner: 'fhinkel', repo: 'twitch',
  });
  console.log(`Clones: ${data.count}`);
}

const numberOfViews = async (octokit) => {
  // https://octokit.github.io/rest.js/#api-Repos-getClones
  const {data} = await octokit.repos.getViews({
    owner: 'fhinkel', repo: 'twitch', per: 'day',
  });
  console.log(`Clones: ${data.count}`);
}

const main = async() => {
  const token = (await require('fs').promises.readFile('githubToken.json')).toString().trim();
  const octokit = new Octokit({auth: `token ${token}`});
  
  
  // listOrgRepos(octokit);
  numberOfClones(octokit);
  numberOfViews(octokit);
}

main();