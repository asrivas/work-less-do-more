const { google } = require('googleapis'); // needed for auth

exports.main = async (title) => {
  let auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  const SheetHelpers = require('./sheetHelpers')(auth);
  const sheetHelpers = new SheetHelpers();

  const DriveHelpers = require('./driveHelpers')(auth);
  const driveHelpers = new DriveHelpers();

  let id;
  try {
    id = await driveHelpers.idOfSheet(title);
    if (!id) {
      id = await sheetHelpers.createSpreadsheet(title);
      await sheetHelpers.addSheet(id, 'Github Data');
    }
    await sheetHelpers.updateCellFormatToDate(id);

    // Add your teams' emails below.
    // If you get permissions errors, this could be due to a propogation delay.
    await driveHelpers.addUser(id, 'gsuite.demos@gmail.com');
    await driveHelpers.addUser(id, 'fhinkel.demo@gmail.com');
  } catch (err) {
    console.error(`Error: ${err}`);
    throw new Error(err);
  }

  const GitHubHelpers = require('./githubHelpers')(
    './githubToken.json',
    'nodejs',
    'node'
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

    const chartId = await sheetHelpers.getChartId(id);
    console.log(`chartId: ${chartId}`);
    if (!chartId) {
      await sheetHelpers.createChart(id, lastRowIndex);
    } else {
      await sheetHelpers.updateChart(id, lastRowIndex, chartId);
    }

  } catch (err) {
    console.error(`Error: ${err}`);
  }

  return id;
}

