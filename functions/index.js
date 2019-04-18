const { google } = require('googleapis');

/**
 * Updates data into the chart from Github and mails a chart.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.githubChart = (req, res) => {
    let message = req.query.message || req.body.message || 'Hello World!';
    setUp().then(()=> res.status(200).send(message));
};

async function setUp() {
    let auth = await google.auth.getClient({
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });
    await createSpreadsheet(sheets, "Sheet from function");
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
    const { data } = await sheets.spreadsheets.create({ resource });
    console.log(`Created new spreadsheet with ID: ${data.spreadsheetId}`);
    return data.spreadsheetId;
}
