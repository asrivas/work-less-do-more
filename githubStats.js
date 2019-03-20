const Octokit = require('@octokit/rest');
const octokit = new Octokit({auth: 'token d7106f7559568b2aa57fba67828052f473db29a9'});


const listOrgRepos = async () => {
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

const numberOfClones = async () => {
  // https://octokit.github.io/rest.js/#api-Repos-getClones
  const {data} = await octokit.repos.getClones({
    owner: 'fhinkel', repo: 'twitch'
  });
  console.log(data.count);
}

// listOrgRepos();
numberOfClones();