const ranks = require("../config/ranks");

async function checkRank(client, guildId, userId, vouches) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    // Find the highest rank they qualify for
    const newRank = ranks.find(r => vouches >= r.required);

    // All role IDs from ranks
    const rankRoleIds = ranks.map(r => r.id);

    // Remove ALL rank roles
    await member.roles.remove(rankRoleIds).catch(() => {});

    if (!newRank) {
        // They don't qualify for any rank
        return;
    }

    // Apply the new rank
    await member.roles.add(newRank.id).catch(() => {});

    // Announce change
    const channel = guild.channels.cache.get(process.env.RANK_ANNOUNCE_CHANNEL);
    if (channel) {
        channel.send(`🏆 <@${userId}> has reached **${newRank.name}** with **${vouches}** vouches!`);
    }
}

module.exports = { checkRank };
