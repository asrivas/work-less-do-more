const { google } = require('googleapis');

/**
 * Updates data into the chart from Github and mails a chart.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.githubChart = (req, res) => {
  setUp().then((id) => res.status(200).send(id));
};

async function setUp() {
  let auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  let id = await createSpreadsheet(sheets, "Sheet from function");
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
  } catch (err) {
    console.log(`error: ${err}`);
  }
  console.log(`Created new spreadsheet with ID: ${data.spreadsheetId}`);
  return data.spreadsheetId;
}
