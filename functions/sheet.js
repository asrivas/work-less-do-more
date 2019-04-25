const { google } = require('googleapis'); // needed for auth

exports.main = async (title) => {
  let auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  const SheetHelpers = require('./utilities')(auth);
  const sheetHelpers = new SheetHelpers();

  const DriveHelpers = require('./driveHelpers')(auth);
  const driveHelpers = new DriveHelpers();

  let newSheet;
  let id;
  try {
    id = await driveHelpers.idOfSheet(title);
    if (!id) {
      id = await sheetHelpers.createSpreadsheet(title);
      newSheet = true;
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  }

  const GitHubHelpers = require('./githubUtilities')('./githubToken.json');
  const gitHubHelpers = new GitHubHelpers();

  try {
    await gitHubHelpers.init();
    let [numberOfIssues, numberOfPRs] = await gitHubHelpers.numberOfIssuesAndPrs(
      'GoogleCloudPlatform', 'nodejs-getting-started');
    console.log(`Number of open issues: ${numberOfIssues}`);
    console.log(`Number of open PRs: ${numberOfPRs}`);

    let closedIssues = await gitHubHelpers.numberOfClosedIssuesYesterday(
      'GoogleCloudPlatform', 'nodejs-getting-started');
    console.log(`Number of closed issues yesterday: ${closedIssues}`);

    const lastRowIndex = await sheetHelpers.appendTodaysDate(id);

    await sheetHelpers.updateCellFormatToDate(id, lastRowIndex);
    await sheetHelpers.createChart(id, lastRowIndex);

    if (newSheet) {
      //  TODO(asrivast): Use IAM, read email from request.  
      await driveHelpers.addUser(id, 'gsuite.demos@gmail.com');
      await driveHelpers.addUser(id, 'fhinkel.demo@gmail.com');
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  }

  return id;
}