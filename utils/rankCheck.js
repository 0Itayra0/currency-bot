const ranks = require("../config/ranks");

async function checkRank(client, guildId, userId, vouches) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    const announceChannel = guild.channels.cache.get(process.env.RANK_ANNOUNCE_CHANNEL);

    // Identify old rank (the one user currently has)
    const oldRank = ranks.find(r => member.roles.cache.has(r.id));

    // Determine new rank based on vouches
    const newRank = ranks.find(r => vouches >= r.required);

    // If nothing changes — skip all
    if (oldRank && newRank && oldRank.id === newRank.id) return;

    // Remove ALL rank roles
    const allRankIds = ranks.map(r => r.id);
    await member.roles.remove(allRankIds).catch(() => {});

    // Assign new rank if one exists
    if (newRank) {
        await member.roles.add(newRank.id).catch(() => {});
    }

    // If no announce channel → stop here (no crash)
    if (!announceChannel) return;

    // ------------------------------
    // ANNOUNCEMENT LOGIC IMPROVED ❤️
    // ------------------------------

    // FIRST time ever getting a rank
    if (!oldRank && newRank) {
        return announceChannel.send(
            `✨ **FIRST RANK UNLOCKED!** ✨\n` +
            `Congratulations <@${userId}>! You’ve reached **${newRank.name}** with **${vouches}** vouches! 🎉`
        );
    }

    // Lost ALL ranks (vouches too low)
    if (oldRank && !newRank) {
        return announceChannel.send(
            `⚠️ <@${userId}> has dropped below **${ranks[ranks.length - 1].required}** vouches.\n` +
            `They have **lost all rank roles**. 😢`
        );
    }

    // RANK UP (old required < new required)
    if (oldRank && newRank && oldRank.required < newRank.required) {
        return announceChannel.send(
            `🏆 **RANK UP!** 🏆\n` +
            `<@${userId}> has been promoted from **${oldRank.name}** → **${newRank.name}**!\n` +
            `They now have **${vouches}** vouches! 🎉🔥`
        );
    }

    // RANK DOWN (old required > new required)
    if (oldRank && newRank && oldRank.required > newRank.required) {
        return announceChannel.send(
            `📉 **RANK DOWNGRADE** 📉\n` +
            `<@${userId}> dropped from **${oldRank.name}** → **${newRank.name}**.\n` +
            `They now have **${vouches}** vouches. Stay strong ❤️`
        );
    }
}

module.exports = { checkRank };
