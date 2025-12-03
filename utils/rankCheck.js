const ranks = require(..configranks);

async function checkRank(client, guildId, userId, newVouches) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const member = await guild.members.fetch(userId).catch(() = null);
    if (!member) return;

     Find highest rank the user qualifies for
    const eligibleRanks = ranks.filter(r = newVouches = r.required);

    const newRank = eligibleRanks[eligibleRanks.length - 1];  highest tier
    if (!newRank) return;

     Check if user already has this rank
    const hasRank = member.roles.cache.has(newRank.id);

     Remove all rank roles
    const rankIds = ranks.map(r = r.id);
    await member.roles.remove(rankIds).catch(() = {});

     Apply new one
    await member.roles.add(newRank.id).catch(() = {});

     ANNOUNCEMENT CHANNEL
    const announce = client.channels.cache.get(process.env.RANK_ANNOUNCE_CHANNEL_ID);

    if (!hasRank) {
         Rank up or rank down message
        if (announce) {
            await announce.send(
                newVouches = newRank.required
                     `🏆 @${userId} has ranked up to ${newRank.name}! Congrats!`
                     `📉 @${userId} has been demoted to ${newRank.name}.`
            );
        }
    }
}

module.exports = { checkRank };
