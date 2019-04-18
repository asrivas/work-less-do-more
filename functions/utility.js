
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
        console.err(`Failed sharing with ${emailAddress}`);
        console.err(err);
    }
}