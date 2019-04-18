/**
 * Returns the number of clones for repo the last 2 weeks.
 */
exports.numberOfClones = async (octokit, repo, owner) => {
    // https://octokit.github.io/rest.js/#api-Repos-getClones
    const { data } = await octokit.repos.getClones({
        owner: owner, repo: repo,
    });
    console.log(`Clones: ${data.count}`);
}
