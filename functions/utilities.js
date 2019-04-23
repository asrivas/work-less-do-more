
exports.appendTodaysDate = async (sheets, spreadsheetId) => {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  const range = 'Github Data!A2';
  const valueInputOption = 'USER_ENTERED';
  const values = [];
  values.push([today.toISOString()]);

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption,
    resource: {
      values
    }
  });
  const updatedRange = response.data.updates.updatedRange;
  console.log(updatedRange)
  let [from, to] = updatedRange.split(':');
  let lastCell = Number(from.split('!A')[1]);
  console.log(`Appending date in cell: ${lastCell}`);
  return Number(lastCell);
}

exports.appendCloneData = async (sheets, spreadsheetId, cloneData) => {
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


/**
 * Creates a spreadsheet with the given title.
 */
exports.createSpreadsheet = async (sheets, title) => {
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

exports.getSheetId = async (sheets, spreadsheetId, index) => {
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId,
  });
  let { properties } = data.sheets[index]
  const sheetId = properties.sheetId;
  return sheetId;
}

exports.createChart = async (sheets, spreadsheetId, endRowIndex) => {
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

exports.updateCellFormatToDate = async(sheets, spreadsheetId, githubLastRowIndex) => {
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

