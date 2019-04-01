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

    const { data } = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        resource,
        valueInputOption,
    })
    console.log('Updated cells: ' + data.updatedCells);
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
    console.log(`Appending data: ${response.status}`);
}

const numberOfClones = async (octokit) => {
    try {

        // https://octokit.github.io/rest.js/#api-Repos-getClones
        const { data } = await octokit.repos.getClones({
            owner: 'GoogleCloudPlatform', repo: 'nodejs-getting-started',
        });
        console.log(`Clones: ${data.count}`);
        // Array of 2 weeks
        return data.clones;
    } catch (err) {
        console.log(err.HttpError);
    }
}

const addUser = async (drive, id, emailAddress) => {
    try {
        let { data } = await drive.permissions.create({
            fileId: id,
            type: 'user',
            resource: {
                type: 'user',
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

const deleteFile = async (drive, fileId) => {
    console.log(fileId);
    try {
        let res = await drive.files.delete(
            { fileId }
        );
        console.log(`Delete file: {res.status}`)
    } catch (err) {
        console.log('Deleting file failed.')
        console.log(err);
    }
}

const deleteAllFiles = async (drive) => {
    try {
        let { data } = await drive.files.list();
        for (const file of data.files) {
            await deleteFile(drive, file.id);
        }
    } catch (err) {
        console.log('Listing and deleting files failed.')
        console.log(err);
    }
}

const checkForSheet = async (drive, title) => {
    try {
        let { data } = await drive.files.list();
        for (const file of data.files) {
            if (file.name === title) {
                console.log(`Using existing file: ${file.id}`);
                return file.id;
            }
        }
    } catch (err) {
        console.log('Listing files failed.')
        console.log(err);
    }
}

const main = async () => {
    const auth = await google.auth.getClient({ scopes: SCOPES });
    const sheets = google.sheets({ version: 'v4', auth });

    const token = (await fs.readFile('githubToken.json')).toString().trim();
    const octokit = new Octokit({ auth: `token ${token}` });

    const drive = google.drive({ version: 'v3', auth })

    // await deleteAllFiles(drive);
    const title = 'Statistics from GitHub and food survey for I/O talk';
    let id = await checkForSheet(drive, title);
    if (!id) {
        id = await createSpreadsheet(sheets, title);
        await writeHeader(sheets, id, 0);
        await addUser(drive, id, 'fhinkel.demo@gmail.com');
        await addUser(drive, id, 'GSuite.demos@gmail.com');
    }
    let cloneData = await numberOfClones(octokit);
    await appendCloneData(sheets, id, cloneData);
}


main();