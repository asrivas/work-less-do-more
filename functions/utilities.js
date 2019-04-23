const { google } = require('googleapis');

module.exports = function (auth) {
  class SheetsHelpers {
    constructor() {
      if (!auth) {
        throw new Error('No authentication provided to SheetsHelpers');
      }
      this.sheets = google.sheets({ version: 'v4', auth });

    }
    async appendTodaysDate(spreadsheetId) {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      const range = 'Github Data!A2';
      const valueInputOption = 'USER_ENTERED';
      const values = [];
      values.push([today.toISOString()]);

      const response = await this.sheets.spreadsheets.values.append({
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

    async appendCloneData(spreadsheetId, cloneData) {
      const range = 'Sheet1!A2';
      const valueInputOption = 'USER_ENTERED';
      const values = [];
      for (const entry of cloneData) {
        let date = entry.timestamp.split('T')[0];
        values.push([date, , entry.uniques]);
      }

      const response = await this.sheets.spreadsheets.values.append({
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
      const sheetId = await this.getSheetId(spreadsheetId, 1);
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

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource,
      })
      console.log('Chart created with Id: ' + response.data.replies[0].addChart.chart.chartId);
    }

    async updateCellFormatToDate(spreadsheetId, githubLastRowIndex) {
      const formResponsesSheetId = await this.getSheetId(spreadsheetId, 0);
      const githubSheetId = await this.getSheetId(spreadsheetId, 1);

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

