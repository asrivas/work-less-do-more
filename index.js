const fs = require('fs');
const readline = require('readline-promise').default;
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  try {
    const token = fs.readFileSync(TOKEN_PATH);
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
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token stored to', TOKEN_PATH);
  return oAuth2Client;
}

async function listMajors(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
  })
  const rows = res.data.values;
  if (rows.length) {
    console.log('Name, Major:');
    for (const row of rows) {
      console.log(`${row[0]}, ${row[4]}`);
    }
  } else {
    console.log('No data found.');
  }
}

const main = async () => {
  const content = fs.readFileSync('credentials.json');
  const oAuthClient = await authorize(JSON.parse(content));
  await listMajors(oAuthClient);
}


main();