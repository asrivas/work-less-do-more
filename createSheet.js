const fs = require('fs').promises;
const readline = require('readline-promise').default;
const { google } = require('googleapis');
const Octokit = require('@octokit/rest');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'token.json';

async function authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]
    );

    try {
        const token = (await fs.readFile(TOKEN_PATH)).toString();
        oAuth2Client.setCredentials(JSON.parse(token));
        return oAuth2Client;
    } catch (err) {
        const authorizedClient = await getNewToken(oAuth2Client);
        return authorizedClient;
    }
}

async function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const code = await rl.questionAsync('Enter the code form that page here: ');
    rl.close();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
    console.log('Token stored to', TOKEN_PATH);
    return oAuth2Client;
}

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
    const content = (await fs.readFile('credentials.json')).toString();
    const auth = await authorize(JSON.parse(content));
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