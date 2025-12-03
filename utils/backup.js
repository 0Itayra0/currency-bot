const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { uploadBackupToDrive } = require("./uploadToDrive");

async function runBackup() {
    try {
        const users = await User.find({});
        const transactions = await Transaction.find({});

        const data = {
            timestamp: new Date().toISOString(),
            users: users.map(u => ({
                userId: u.userId,
                vouches: u.vouches
            })),
            transactions: transactions.map(t => ({
                type: t.type,
                senderId: t.senderId,
                recipientId: t.recipientId,
                amount: t.amount,
                timestamp: t.timestamp
            }))
        };

        const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        const filepath = path.join(__dirname, "../backups", filename);

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`💾 Local backup saved: ${filename}`);

        await uploadBackupToDrive(filename, filepath);

    } catch (err) {
        console.error("Backup failed:", err);
    }
}

module.exports = { runBackup };
