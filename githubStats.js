const Octokit = require('@octokit/rest')
const octokit = new Octokit ()

// Compare: https://developer.github.com/v3/repos/#list-organization-repositories
octokit.repos.listForOrg({
  org: 'octokit',
  type: 'public'
}).then(({ data, status, headers }) => {
  console.log(`Found ${data.length} repos:`);
  for(const repo of data) {
    console.log(repo.html_url);
    console.log(repo.full_name);
    console.log();
  }
  // handle data
})