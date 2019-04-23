const { google } = require('googleapis');
const Octokit = require('@octokit/rest');
const githubUtilities = require('./githubUtilities');
const fs = require('fs').promises;

addUser = async (drive, id, emailAddress) => {
  try {
    let { data } = await drive.permissions.create({
      fileId: id,
      type: 'user',
      resource: {
        type: 'user',
        // TODO(asrivast): Lower this permission level. 
        role: 'writer',
        emailAddress,
        transferOwnership: false,
      },
    });
    console.log(`Permission Id: ${data.id}`);
  } catch (err) {
    console.error(`Failed sharing with ${emailAddress}`);
    console.error(err);
  }
}

appendCloneData = async (sheets, spreadsheetId, cloneData) => {
  const range = 'Sheet1!A2';
  const valueInputOption = 'USER_ENTERED';
  const values = [];
  for (const entry of cloneData) {
    let date = entry.timestamp.split('T')[0];
    values.push([date, , entry.uniques]);
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption,
    resource: {
      values
    }
  });
  const updatedRange = response.data.updates.updatedRange;
  console.log(`Appending data: ${response.status}`);
  return Number(updatedRange.split(':')[1].split('C')[1]);
}

exports.setUp = async (title) => {
  // let auth = await google.auth.getClient({
  //   scopes: ['https://www.googleapis.com/auth/drive.file']
  // });
  // const sheets = google.sheets({ version: 'v4', auth });
  // const drive = google.drive({ version: 'v3', auth });

  // let id = await idOfSheet(drive, title);
  // if (!id) {
  //   id = await createSpreadsheet(sheets, title);
  // }

  const token = (await fs.readFile('./githubToken.json')).toString().trim();
  const octokit = new Octokit({ auth: `token ${token}` });
  console.log('Fetching github data');

  try {
    // let [numberOfIssues, numberOfPRs] = await githubUtilities.numberOfIssuesAndPrs(octokit,
    //   'GoogleCloudPlatform', 'nodejs-getting-started');
    // console.log(`Number of open issues: ${numberOfIssues}`);
    // console.log(`Number of open PRs: ${numberOfPRs}`);

    // [numberOfIssues, numberOfPRs] = await githubUtilities.numberOfClosedIssues(octokit,
    //   'GoogleCloudPlatform', 'nodejs-getting-started');
    // console.log(`Number of closed issues: ${numberOfIssues}`);
    // console.log(`Number of closed PRs: ${numberOfPRs}`);

    let closedIssues = await githubUtilities.numberOfClosedIssuesYesterday(octokit, 'GoogleCloudPlatform', 'nodejs-getting-started')
    console.log(`Number of closed issues yesterday: ${closedIssues}`);
    return;

    const cloneData = await githubUtilities.numberOfClones(octokit,
      'GoogleCloudPlatform', 'nodejs-getting-started');
    const lastRowIndex = await appendCloneData(sheets, id, cloneData.clones).catch(err => console.error(err));
    await updateCellFormatToDate(sheets, id, lastRowIndex);
    await createChart(sheets, id, lastRowIndex);
  } catch (err) {
    console.error(`Error: ${err}`);
  }

  //  TODO(asrivast): Use IAM, read email from request.  
  await addUser(drive, id, 'gsuite.demos@gmail.com');
  await addUser(drive, id, 'fhinkel.demo@gmail.com');

  return id;
}

/**
 * Creates a spreadsheet with the given title.
 */
async function createSpreadsheet(sheets, title) {
  const resource = {
    properties: {
      title,
    }
  }
  try {
    const { data } = await sheets.spreadsheets.create({ resource });
    console.log(`Created new spreadsheet with ID: ${data.spreadsheetId} `);
    return data.spreadsheetId;
  } catch (err) {
    console.log(`error: ${err} `);
    return err;
  }
}


const idOfSheet = async (drive, title) => {
  try {
    let { data } = await drive.files.list();
    for (const file of data.files) {
      if (file.name === title) {
        console.log(`Using existing file: ${file.id}`);
        return file.id;
      }
    }
  } catch (err) {
    console.log('Listing files failed.')
    console.log(err);
  }
}

async function getSheetId(sheets, spreadsheetId, index) {
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId,
  });
  let { properties } = data.sheets[index]
  const sheetId = properties.sheetId;
  return sheetId;
}

async function createChart(sheets, spreadsheetId, endRowIndex) {
  const sheetId = await getSheetId(sheets, spreadsheetId, 1);
  const requests = [{
    addChart: {
      "chart": {
        "spec": {
          "title": "Best data ever",
          "basicChart": {
            "chartType": "LINE",
            "legendPosition": "BOTTOM_LEGEND",
            "axis": [
              {
                "position": "BOTTOM_AXIS",
                "title": "Date"
              },
              {
                "position": "LEFT_AXIS",
                "title": "Number of Clones"
              }
            ],
            "series": [
              {
                "series": {
                  "sourceRange": {
                    "sources": [
                      {
                        "sheetId": sheetId,
                        "startRowIndex": 0,
                        "endRowIndex": endRowIndex,
                        "startColumnIndex": 0,
                        "endColumnIndex": 1
                      }
                    ]
                  }
                },
                "targetAxis": "LEFT_AXIS"
              },
              {
                "series": {
                  "sourceRange": {
                    "sources": [
                      {
                        "sheetId": sheetId,
                        "startRowIndex": 0,
                        "endRowIndex": endRowIndex,
                        "startColumnIndex": 2,
                        "endColumnIndex": 3
                      }
                    ]
                  }
                },
                "targetAxis": "LEFT_AXIS"
              },
            ],
            "headerCount": 1
          }
        },
        "position": {
          "newSheet": true
        }
      }
    }
  }];

  const resource = {
    requests,
  }

  const response = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource,
  })
  console.log('Chart created with Id: ' + response.data.replies[0].addChart.chart.chartId);
}

async function updateCellFormatToDate(sheets, spreadsheetId, githubLastRowIndex) {
  const formResponsesSheetId = await getSheetId(sheets, spreadsheetId, 0);
  const githubSheetId = await getSheetId(sheets, spreadsheetId, 1);

  const requests = [{
    repeatCell: {
      range: {
        sheetId: formResponsesSheetId,
        startRowIndex: 0,
        endRowIndex: githubLastRowIndex,
        startColumnIndex: 0,
        endColumnIndex: 1
      },
      cell: {
        userEnteredFormat: {
          numberFormat: {
            type: 'DATE'
          }
        }
      },
      fields: 'userEnteredFormat(numberFormat)'
    },
    repeatCell: {
      range: {
        sheetId: githubSheetId,
        startRowIndex: 0,
        endRowIndex: githubLastRowIndex,
        startColumnIndex: 0,
        endColumnIndex: 1
      },
      cell: {
        userEnteredFormat: {
          numberFormat: {
            type: 'DATE'
          }
        }
      },
      fields: 'userEnteredFormat(numberFormat)'
    },

  }];
  const resource = {
    requests,
  }

  const response = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource,
  });
  console.log(response);
}

