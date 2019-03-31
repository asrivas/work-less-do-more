const fs = require('fs').promises;
const { google } = require('googleapis');
const Octokit = require('@octokit/rest');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

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

async function writeHeader(sheets, spreadsheetId) {
    const values = [['Timestamp', 'Unique Views', 'Unique Clones']];
    const resource = {
        values,
    };
    const range = 'A1:C1';
    const valueInputOption = 'USER_ENTERED'

    const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        resource,
        valueInputOption,
    })
    console.log('Updated cells: ' + response.data.totalUpdatedCells);
}

async function appendCloneData(sheets, spreadsheetId, cloneData) {
    const range = 'Sheet1!A2:C';
    const valueInputOption = 'USER_ENTERED';
    const values = [];
    for (const entry of cloneData) {
        values.push([entry.timestamp, , entry.uniques]);
    }

    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption,
        resource: {
            values
        }
    })
    console.log(response.status);
}

const numberOfClones = async (octokit) => {
    // https://octokit.github.io/rest.js/#api-Repos-getClones
    const { data } = await octokit.repos.getClones({
        owner: 'GoogleCloudPlatform', repo: 'nodejs-getting-started',
    });
    console.log(`Clones: ${data.count}`);
    // Array of 2 weeks
    return data.clones;
}

const main = async () => {
    const auth = await google.auth.getClient({scopes: SCOPES });
    const sheets = google.sheets({ version: 'v4', auth });

    // TODO move GitHub set up into helper method
    const token = (await fs.readFile('githubToken.json')).toString().trim();
    const octokit = new Octokit({ auth: `token ${token}` });

    const title = 'Generated GitHub Data';
    let id = await createSpreadsheet(sheets, title);
    await writeHeader(sheets, id, 0);
    let cloneData = await numberOfClones(octokit);
    await appendCloneData(sheets, id, cloneData);
}


main();