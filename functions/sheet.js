const { google } = require('googleapis'); // needed for auth

exports.main = async (title) => {
  let auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  const SheetHelpers = require('./sheetHelpers')(auth);
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
    throw new Error(err);
  }

  const GitHubHelpers = require('./githubHelpers')(
    './githubToken.json',
    'GoogleCloudPlatform',
    'nodejs-getting-started'
  );
  const gitHubHelpers = new GitHubHelpers();

  try {
    await gitHubHelpers.init();

    let today = new Date()
    today = today.toISOString().split('T')[0];

    let date = new Date(today);
    date = date.toLocaleDateString("en-US", { timeZone: 'UTC' });

    const formScore = await sheetHelpers.getAvgFormScore(id, date);

    let [openIssues, openPullRequests] = await gitHubHelpers.numberOfIssuesAndPrs();
    let closedIssues = await gitHubHelpers.numberOfClosedIssuesYesterday();
    let mergedPullRequests = await gitHubHelpers.numberOfMergedPrsYesterday();

    const lastRowIndex = await sheetHelpers.appendOrUpdateRowData(id,
      [[date, openIssues, closedIssues, openPullRequests, mergedPullRequests, formScore]]);
    await sheetHelpers.updateCellFormatToDate(id, lastRowIndex);

    const chartId = await sheetHelpers.getChartId(id);
    console.log(`chartId: ${chartId}`);
    if (!chartId) {
      await sheetHelpers.createChart(id, lastRowIndex);
    } else {
      await sheetHelpers.updateChart(id, lastRowIndex, chartId);
    }

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

