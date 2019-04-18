
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

exports.sendEmail = async (gmail, emailAddress) => {
    const rawEmail = createEmailBody(emailAddress);
    try {
        let resp = await gmail.users.messages.send({
            userId: 'me',
            resource: {
                raw: rawEmail
            }
        });
        console.log(`Gmail response: ${resp}`);
    } catch(err) {
        console.error(err);
    }
}

function createEmailBody(emailAddress) {
    const email_lines = [];

    email_lines.push('From: me');
    email_lines.push(`To: ${emailAddress}`);
    email_lines.push('Content-type: text/html;charset=iso-8859-1');
    email_lines.push('MIME-Version: 1.0');
    email_lines.push('Subject: Hello via the Gmail API!');
    email_lines.push('');
    email_lines.push('testing testing');
    email_lines.push('Node is hard');

    const email = email_lines.join('\r\n').trim();

    const base64EncodedEmail = Buffer.from(email).toString('base64');
    base64EncodedEmail = base64EncodedEmail.replace(/\+/g, '-').replace(/\//g, '_');
    return base64EncodedEmail;
}
