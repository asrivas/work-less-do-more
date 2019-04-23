exports.addUser = async (drive, id, emailAddress) => {
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
    console.error(`Failed sharing with ${emailAddress}`);
    console.error(err);
  }
}

exports.idOfSheet = async (drive, title) => {
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