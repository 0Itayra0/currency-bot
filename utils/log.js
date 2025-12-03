const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

async function logToStaff(client, message) {
    if (!LOG_CHANNEL_ID) return; // no log channel set

    try {
        const channel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!channel || !channel.isTextBased()) return;

        await channel.send(message);
    } catch (err) {
        console.error("Failed to send log message:", err);
    }
}

module.exports = { logToStaff };
