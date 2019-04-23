const fs = require('fs').promises;

const { google } = require('googleapis');
const Octokit = require('@octokit/rest');

const sheetHelpers = require('./utilities');
const gitHubHelpers = require('./githubUtilities');
const driveHelpers = require('./driveHelpers');

exports.main = async (title) => {
  let auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  let id = await driveHelpers.idOfSheet(drive, title);
  let newSheet;
  if (!id) {
    id = await sheetHelpers.createSpreadsheet(sheets, title);
    newSheet = true;
  }

  const token = (await fs.readFile('./githubToken.json')).toString().trim();
  const octokit = new Octokit({ auth: `token ${token}` });
  console.log('Fetching github data');

  try {
    // let [numberOfIssues, numberOfPRs] = await gitHubHelpers.numberOfIssuesAndPrs(octokit,
    //   'GoogleCloudPlatform', 'nodejs-getting-started');
    // console.log(`Number of open issues: ${numberOfIssues}`);
    // console.log(`Number of open PRs: ${numberOfPRs}`);

    // [numberOfIssues, numberOfPRs] = await gitHubHelpers.numberOfClosedIssues(octokit,
    //   'GoogleCloudPlatform', 'nodejs-getting-started');
    // console.log(`Number of closed issues: ${numberOfIssues}`);
    // console.log(`Number of closed PRs: ${numberOfPRs}`);

    // let closedIssues = await gitHubHelpers.numberOfClosedIssuesYesterday(octokit,
    //     'GoogleCloudPlatform', 'nodejs-getting-started');
    // console.log(`Number of closed issues yesterday: ${closedIssues}`);
    sheetHelpers.appendTodaysDate(sheets, id);
    return;

    const cloneData = await gitHubHelpers.numberOfClones(octokit,
      'GoogleCloudPlatform', 'nodejs-getting-started');
    const lastRowIndex = await sheetHelpers.appendCloneData(sheets, id, cloneData.clones).catch(err => console.error(err));
    await sheetHelpers.updateCellFormatToDate(sheets, id, lastRowIndex);
    await sheetHelpers.createChart(sheets, id, lastRowIndex);
  } catch (err) {
    console.error(`Error: ${err}`);
  }

  if (newSheet) {
    //  TODO(asrivast): Use IAM, read email from request.  
    await driveHelpers.addUser(drive, id, 'gsuite.demos@gmail.com');
    await driveHelpers.addUser(drive, id, 'fhinkel.demo@gmail.com');
  }

  return id;
}