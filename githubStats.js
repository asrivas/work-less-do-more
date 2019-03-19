const Octokit = require('@octokit/rest')
const octokit = new Octokit()


const listOrgRepos = async () => {

  // Compare: https://developer.github.com/v3/repos/#list-organization-repositories
  const { data } = await octokit.repos.listForOrg({
    org: 'GoogleCloudPlatform',
    type: 'public'
  });
  console.log(`Found ${data.length} repos`);
  for (const repo of data) {
    // console.log(repo.html_url);
    // console.log(repo.full_name);
    // console.log();
  }
}

listOrgRepos();