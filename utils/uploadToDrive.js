const { google } = require("googleapis");

async function uploadBackupToDrive(filename, filepath) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/drive.file"],
        });

        const drive = google.drive({ version: "v3", auth });

        const fileMetadata = {
            name: filename,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
            owners: [
            { emailAddress: "kanadecdlarisvarsovec@gmail.com" }
            ]   
        };

        const media = {
            mimeType: "application/json",
            body: require("fs").createReadStream(filepath),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media,
            fields: "id",
        });

        console.log(`☁️ Backup uploaded to Drive (file ID: ${response.data.id})`);
    } catch (err) {
        console.error("❌ Google Drive upload failed:", err);
    }
}

module.exports = { uploadBackupToDrive };
