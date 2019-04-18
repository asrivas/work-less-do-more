const { google } = require('googleapis');
const Octokit = require('@octokit/rest');
const utilities = require('./utilities');
const githubUtilities = require('./githubUtilities');
const fs = require('fs').promises;

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
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  const id = await createSpreadsheet(sheets, "Sheet from function");

  // TODO(asrivast): Use IAM, read email from request.  
  await utilities.addUser(drive, id, 'gsuite.demos@gmail.com');
  await utilities.addUser(drive, id, 'fhinkel.demo@gmail.com');

  const token = (await fs.readFile('githubToken.json')).toString().trim();
  const octokit = new Octokit({ auth: `token ${token}` });
  let cloneData = await githubUtilties.numberOfClones(octokit, 'GoogleCloudPlatform', 'nodejs-getting-started');
  //await appendCloneData(sheets, id, cloneData);
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




