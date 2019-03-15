const fs = require('fs').promises;
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

const main = async () => {
  try {
    const content = await fs.readFile('credentials.json');
    authorize(JSON.parse(content), listMajors);
  } catch (err) {
    console.log('Error loading client secret file: ' + err);
  }
}

async function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  try {
    const token = await fs.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  } catch (err) {
    getNewToken(oAuth2Client, callback);
  }
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code form that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, async (err, token) => {
      if (err) {
        return console.log('Error while trying to retrieve access token', err);
      }
      oAuth2Client.setCredentials(token);
      try {
        await fs.writeFile(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to', TOKEN_PATH);
        callback(oAuth2Client);
      } catch (err) {
        console.log(err);
      }
    });
  });
}

function listMajors(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.get({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
  }, (err, res) => {
    if (err) {
      return console.log('The API returned an error: ' + err);
    }
    const rows = res.data.values;
    if (rows.length) {
      console.log('Name, Major:');
      rows.map(row => {
        console.log(`${row[0]}, ${row[4]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
}

main();