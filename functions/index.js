const { google } = require('googleapis');
const utility = require('./utility');

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
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/gmail.send']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });
  const gmail = google.gmail({ version: 'v1', auth });
  const id = await createSpreadsheet(sheets, "Sheet from function");

  // TODO(asrivast): Use IAM, read email from request.  
  await utility.addUser(drive, id, 'gsuite.demos@gmail.com');
  await utility.addUser(drive, id, 'fhinkel.demo@gmail.com');

  await utility.sendEmail(gmail, 'gsuite.demos@gmail.com');
  await utility.sendEmail(gmail, 'fhinkel.demo@gmail.com');
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
    console.log(`Created new spreadsheet with ID: ${data.spreadsheetId}`);
    return data.spreadsheetId;
  } catch (err) {
    console.log(`error: ${err}`);
    return err;
  }
}




