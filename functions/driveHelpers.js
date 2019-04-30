const { google } = require('googleapis');

module.exports = auth => {
  class DriveHelpers {
    constructor() {
      if (!auth) {
        throw new Error('No authentication provided to DriveHelpers');
      }
      this.drive = google.drive({ version: 'v3', auth });
    }

    async addUser(id, emailAddress) {
      try {
        let { data } = await this.drive.permissions.create({
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
        console.error(`Failed sharing with ${emailAddress}`);
        console.error(err);
      }
    }

    async idOfSheet(title) {
      try {
        let { data } = await this.drive.files.list();
        if (!data.files) {
          return;
        }
        for (const file of data.files) {
          if (file.name === title) {
            console.log(`Using existing file: ${file.id}`);
            return file.id;
          }
        }
      } catch (err) {
        console.log('Listing files failed.')
        console.log(err);
        throw new Error(err);
      }
    }

  }

  return DriveHelpers;
}