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
        console.log(`Clones: ${data.count}`);
    } catch (err) {
        console.error('Could not get Github clones');
        console.error(err);
    }
}
