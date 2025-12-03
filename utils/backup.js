const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

async function runBackup() {
    try {
        // Fetch all database data
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

        // Create filename: backup-YYYY-MM-DD_HH-mm-ss.json
        const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        const filepath = path.join(__dirname, "../backups", filename);

        // Save file
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        console.log(`💾 Backup created: ${filename}`);
    } catch (err) {
        console.error("Backup failed:", err);
    }
}

module.exports = { runBackup };
