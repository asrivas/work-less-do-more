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
    let [numberOfOpenIssues, numberOfPRs] = await gitHubHelpers.numberOfIssuesAndPrs(
      'GoogleCloudPlatform', 'nodejs-getting-started');
    console.log(`Number of open issues: ${numberOfOpenIssues}`);
    console.log(`Number of open PRs: ${numberOfPRs}`);
    await sheetHelpers.appendByColumn(id, numberOfOpenIssues, 'B');

    let closedIssues = await gitHubHelpers.numberOfClosedIssuesYesterday(
      'GoogleCloudPlatform', 'nodejs-getting-started');
    console.log(`Number of closed issues yesterday: ${closedIssues}`);
    await sheetHelpers.appendByColumn(id, closedIssues, 'C');
    await sheetHelpers.appendByColumn(id, numberOfPRs, 'D');


    const lastRowIndex = await sheetHelpers.appendTodaysDate(id);    

    let mergedPrs = await gitHubHelpers.numberOfMergedPrsYesterday(
      'GoogleCloudPlatform', 'nodejs-getting-started');
      console.log(`Number of mergedPRs yesterday: ${mergedPrs}`);
      await sheetHelpers.appendByColumn(id, mergedPrs, 'E');

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