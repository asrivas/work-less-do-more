const { google } = require('googleapis');

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

async function writeHello(sheets, spreadsheetId) {
    const values = [['Hello World']];
    const resource = {
        values,
    };
    const range = 'A1';
    const valueInputOption = 'USER_ENTERED'

    const { data } = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        resource,
        valueInputOption,
    })
    console.log('Updated cells: ' + data.updatedCells);
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


const main = async () => {
    const auth = await google.auth.getClient({ scopes: SCOPES });
    const sheets = google.sheets({ version: 'v4', auth });

    const drive = google.drive({ version: 'v3', auth })

    const title = 'Hello World';
    const id = await createSpreadsheet(sheets, title);
    await writeHello(sheets, id);
    await addUser(drive, id, 'fhinkel.demo@gmail.com');
}


main();