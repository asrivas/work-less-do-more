const { google } = require('googleapis');

module.exports = function (auth) {
  class SheetsHelpers {
    constructor() {
      if (!auth) {
        throw new Error('No authentication provided to SheetsHelpers');
      }
      this.sheets = google.sheets({ version: 'v4', auth });

    }

    async appendOrUpdateRowData(spreadsheetId, row) {
      const range = 'Github Data!A2';
      console.log(`Append range: ${range}`)
      const valueInputOption = 'USER_ENTERED';
      let today = new Date(row[0][0]);
      today.setHours(0, 0, 0, 0);

      // Check if analysis has been run today already.
      const dateColumnResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Github Data!A1:A'
      });

      const rowLength = dateColumnResponse.data.values.length;
      const lastUpdate = new Date(dateColumnResponse.data.values[rowLength - 1]);

      console.log(`lastUpdate: ${lastUpdate}, today: ${today}`);

      if(lastUpdate.getTime() === today.getTime()) {
        // Already run today, clear out for fresh data
        console.log('Data already run for this date');
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: 'Github Data!A' + rowLength + ':F' + rowLength
        });
      } else {
        console.log('fetching new data for today');
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption,
        resource: {
          values: row
        }
      });
      const updatedRange = response.data.updates.updatedRange;
      console.log(updatedRange)
      let [from, to] = updatedRange.split(':');
      console.log(`Range response from: ${from}`)
      let lastCell = Number(from.split('!A')[1]);
      return Number(lastCell);
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


    async readFormData(spreadsheetId) {
      const range = 'Form Responses 1!A2:B';
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      let m = new Map();
      for (const value of response.data.values) {
        let [date, score] = value;
        if (!m.has(date)) {
          m.set(date, []);
        }
        let scores = m.get(date);
        m.set(date, [...scores, Number(score)]);
      }
      console.log(m);
      return m;
    }

    async getAvgFormScore(spreadsheetId, date) {
      console.log(date);
      const m = await this.readFormData(spreadsheetId);
      const scores = m.get(date) || [];
      let avg = scores.reduce((acc, score) => score + acc, 0)/scores.length;
      console.log(avg)
      return avg;
    }
  }
  return SheetsHelpers;
}

