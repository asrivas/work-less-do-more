const fs = require('fs');
const readline = require('readline-promise').default;
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    const authorizedClient = await getNewToken(oAuth2Client);
    return authorizedClient;
  }
}

async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await rl.questionAsync('Enter the code form that page here: ');
  rl.close();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token stored to', TOKEN_PATH);
  return oAuth2Client;
}

async function readNumbers(sheets) {
  const ranges = ['Sheet1!A2:A', 'Sheet1!C2:C'];
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: '1Xk_Ga95VxShd-Df5olg_8dV0Ydw8B0l6bw5E2boUzmY',
    ranges,
  })
  if (data.valueRanges.length) {
    const numbers = data.valueRanges[0].values;
    const letters = data.valueRanges[1].values;
    console.log('Fancy Number, Favorite Letter:');
    for (let i = 0; i < numbers.length; i++) {
      console.log(`${numbers[i]}, ${letters[i]}`);
    }
  } else {
    console.log('No data found.');
  }
}

async function writeMoreNumbers(sheets, i) {
  const data = [{
    range: `Sheet1!A${i}:A`,
    values: [[100, 101, 102, 103, 104, 105, 106]],
    majorDimension: "COLUMNS",
  },
  {
    range: `Sheet1!C${i}:C`,
    values: [['X', 'Y', 'Z', 'U', 'V', 'W', 'R']],
    majorDimension: "COLUMNS",
  }];
  const resource = {
    valueInputOption: 'USER_ENTERED',
    data,
  };

  const response = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: '1Xk_Ga95VxShd-Df5olg_8dV0Ydw8B0l6bw5E2boUzmY',
    resource,
  })
  console.log('Updated cells: ' + response.data.totalUpdatedCells);
}

async function createChart(sheets) {
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId: '1Xk_Ga95VxShd-Df5olg_8dV0Ydw8B0l6bw5E2boUzmY',
  });
  let { properties } = data.sheets[1]
  const sheetId = properties.sheetId;
  const requests = [{
    addChart: {
      "chart": {
        "spec": {
          "title": "Model Q1 Sales",
          "basicChart": {
            "chartType": "COLUMN",
            "legendPosition": "BOTTOM_LEGEND",
            "axis": [
              {
                "position": "BOTTOM_AXIS",
                "title": "Model Numbers"
              },
              {
                "position": "LEFT_AXIS",
                "title": "Sales"
              }
            ],
            "domains": [
              {
                "domain": {
                  "sourceRange": {
                    "sources": [
                      {
                        "sheetId": sheetId,
                        "startRowIndex": 0,
                        "endRowIndex": 7,
                        "startColumnIndex": 0,
                        "endColumnIndex": 1
                      }
                    ]
                  }
                }
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
                        "endRowIndex": 7,
                        "startColumnIndex": 1,
                        "endColumnIndex": 2
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
                        "endRowIndex": 7,
                        "startColumnIndex": 2,
                        "endColumnIndex": 3
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
                        "endRowIndex": 7,
                        "startColumnIndex": 3,
                        "endColumnIndex": 4
                      }
                    ]
                  }
                },
                "targetAxis": "LEFT_AXIS"
              }
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
    spreadsheetId: '1Xk_Ga95VxShd-Df5olg_8dV0Ydw8B0l6bw5E2boUzmY',
    resource,
  })
  console.log('Chart created with Id: ' + response.data.replies[0].addChart.chart.chartId);
}

async function append(sheets) {
  const r = Math.floor(Math.random() * 1000);
  const resource = {
    values: [[r, r + 1, r + 2, r + 3, r + 4]],
    majorDimension: "COLUMNS",
  };

  const { data } = await sheets.spreadsheets.values.append({
    spreadsheetId: '1Xk_Ga95VxShd-Df5olg_8dV0Ydw8B0l6bw5E2boUzmY',
    range: `Sheet1!A2:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE', // should append if adding at the end
    resource,
  })
  console.log('Updated range: ' + data.tableRange);
}

const main = async () => {
  const content = fs.readFileSync('credentials.json');
  const auth = await authorize(JSON.parse(content));
  const sheets = google.sheets({ version: 'v4', auth });

  await createChart(sheets);

  // await writeMoreNumbers(sheets, 7)
  // await readNumbers(sheets);
  // await append(sheets);
}


main();