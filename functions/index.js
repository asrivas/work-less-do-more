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
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });
  const id = await createSpreadsheet(sheets, "Sheet from function");

  // TODO(asrivast): Use IAM, read email from request.  
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
    console.log(`Created new spreadsheet with ID: ${data.spreadsheetId}`);
    return data.spreadsheetId;
  } catch (err) {
    console.log(`error: ${err}`);
    return err;
  }
}

const addUser = async (drive, id, emailAddress) => {
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
    console.log(`Failed sharing with ${emailAddress}`);
    console.log(err);
  }
}

