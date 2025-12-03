const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

async function runBackup(client) {
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

        // Create folder if doesn't exist
        const backupFolder = path.join(__dirname, "../backups");
        if (!fs.existsSync(backupFolder)) {
            fs.mkdirSync(backupFolder);
        }

        // File name
        const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        const filepath = path.join(backupFolder, filename);

        // Write file
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        console.log(`💾 Local backup created: ${filename}`);

        // Send to Discord channel
        const backupChannel = client.channels.cache.get(process.env.BACKUP_CHANNEL_ID);
        if (!backupChannel) {
            console.error("❌ Backup channel not found.");
            return;
        }

        await backupChannel.send({
            content: `💾 **New automatic backup created!**\nTimestamp: <t:${Math.floor(Date.now() / 1000)}:F>`,
            files: [filepath]
        });

        console.log("📤 Backup uploaded to Discord successfully!");

    } catch (err) {
        console.error("❌ Backup failed:", err);
    }
}

module.exports = { runBackup };
