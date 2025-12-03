const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../models/User");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Show the top users with the most vouches"),

    async execute(interaction) {
        await interaction.deferReply(); // in case it takes a moment

        // Find top 10 users sorted by vouches
        const topUsers = await User.find({})
            .sort({ vouches: -1 })
            .limit(10);

        if (topUsers.length === 0)
            return interaction.editReply("No users have any vouches yet!");

        let description = "";
        let rank = 1;

        for (const u of topUsers) {
            // Try to fetch the guild member
            const member = await interaction.guild.members.fetch(u.userId).catch(() => null);

            const name = member ? member.user.tag : `❓ Unknown User (${u.userId})`;

            description += `**#${rank}** — **${name}** • **${u.vouches} vouches**\n`;
            rank++;
        }

        const embed = new EmbedBuilder()
            .setTitle("🏆 Vouch Leaderboard")
            .setDescription(description)
            .setColor("#FFD700")
            .setFooter({ text: "Top 10 users with the most vouches" });

        interaction.editReply({ embeds: [embed] });
    }
};
