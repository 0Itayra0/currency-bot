const { google } = require("googleapis");
const fs = require("fs");

async function uploadBackupToDrive(filename, filepath) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/drive"],
        });

        const drive = google.drive({ version: "v3", auth });

        // 1️⃣ Create an empty file in your Drive folder
        const fileMetadata = {
            name: filename,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            fields: "id"
        });

        const fileId = file.data.id;

        // 2️⃣ Upload file content with MEDIA upload
        await drive.files.update({
            fileId: fileId,
            media: {
                mimeType: "application/json",
                body: fs.createReadStream(filepath)
            }
        });

        console.log(`☁️ Backup uploaded successfully! File ID: ${fileId}`);

    } catch (err) {
        console.error("❌ Google Drive upload failed:", err);
    }
}

module.exports = { uploadBackupToDrive };
