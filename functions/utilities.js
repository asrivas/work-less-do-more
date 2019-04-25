const { google } = require('googleapis');

module.exports = function (auth) {
  class SheetsHelpers {
    constructor() {
      if (!auth) {
        throw new Error('No authentication provided to SheetsHelpers');
      }
      this.sheets = google.sheets({ version: 'v4', auth });

    }

    async appendByColumn(spreadsheetId, value, columnLetter) {
      const range = 'Github Data!' + columnLetter + 2;
      console.log(`Append range: ${range}`)
      const valueInputOption = 'USER_ENTERED';
      const values = [];
      values.push([value]);

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption,
        resource: {
          values
        }
      });
      // TODO: check if it has already been run today.
      const updatedRange = response.data.updates.updatedRange;
      console.log(updatedRange)
      let [from, to] = updatedRange.split(':');
      let lastCell = Number(from.split('!' + columnLetter)[1]);
      console.log(`Appending value: ${value} in cell: ${columnLetter}${lastCell}`);
      return Number(lastCell);
    }   
    
    async appendTodaysDate(spreadsheetId) {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      today = today.toISOString().split('T')[0];
      console.log(`Split Date: ${today}`);
      return await this.appendByColumn(spreadsheetId, today, 'A');
    }

    /**
     * Creates a spreadsheet with the given title.
     */
    async createSpreadsheet(title) {
      const resource = {
        properties: {
          title,
        }
      }
      try {
        const { data } = await this.sheets.spreadsheets.create({ resource });
        console.log(`Created new spreadsheet with ID: ${data.spreadsheetId} `);
        return data.spreadsheetId;
      } catch (err) {
        console.log(`error: ${err} `);
        return err;
      }
    }

    async getSheetId(spreadsheetId, index) {
      const { data } = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });
      let { properties } = data.sheets[index]
      const sheetId = properties.sheetId;
      return sheetId;
    }

    async createChart(spreadsheetId, endRowIndex) {
      const sheetId = await this.getSheetId(spreadsheetId, 3);
      const requests = [{
        addChart: {
          "chart": {
            "spec": {
              "title": "Productivity Trends",
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
                    // Date Column
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
                    // Opened Issues
                    "series": {
                      "sourceRange": {
                        "sources": [
                          {
                            "sheetId": sheetId,
                            "startRowIndex": 0,
                            "endRowIndex": endRowIndex,
                            "startColumnIndex": 1,
                            "endColumnIndex": 2
                          }
                        ]
                      }
                    },
                    "targetAxis": "LEFT_AXIS"
                  },
                  {
                    // Closed Issues
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
                  {
                    // Open PRs
                    "series": {
                      "sourceRange": {
                        "sources": [
                          {
                            "sheetId": sheetId,
                            "startRowIndex": 0,
                            "endRowIndex": endRowIndex,
                            "startColumnIndex": 3,
                            "endColumnIndex": 4
                          }
                        ]
                      }
                    },
                    "targetAxis": "LEFT_AXIS"
                  },
                  {
                    // Closed PRs
                    "series": {
                      "sourceRange": {
                        "sources": [
                          {
                            "sheetId": sheetId,
                            "startRowIndex": 0,
                            "endRowIndex": endRowIndex,
                            "startColumnIndex": 4,
                            "endColumnIndex": 5
                          }
                        ]
                      }
                    },
                    "targetAxis": "LEFT_AXIS"
                  },
                  {
                    // Food Happiness
                    "series": {
                      "sourceRange": {
                        "sources": [
                          {
                            "sheetId": sheetId,
                            "startRowIndex": 0,
                            "endRowIndex": endRowIndex,
                            "startColumnIndex": 5,
                            "endColumnIndex": 6
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
              // Change to update later.
              "newSheet": true
            }
          }
        }
      }];

      const resource = {
        requests,
      }

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource,
      })
      console.log('Chart created with Id: ' + response.data.replies[0].addChart.chart.chartId);
    }

    async updateCellFormatToDate(spreadsheetId, githubLastRowIndex) {
      const formResponsesSheetId = await this.getSheetId(spreadsheetId, 0);
      const githubSheetId = await this.getSheetId(spreadsheetId, 3);

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

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource,
      });
      console.log(`Update cell format response: ${response.statusText}`);
    }
  }
  return SheetsHelpers;
}

