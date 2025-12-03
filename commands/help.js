const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show information about all bot commands"),

    async execute(interaction) {

        const helpEmbed = new EmbedBuilder()
            .setTitle("✨ Bot Help & Commands")
            .setColor("#7f5af0")
            .setDescription("Here’s how to use the vouch system. \nBelow are all available commands:")
            .addFields(
                {
                    name: "💸 /pay",
                    value: "Send vouches to another user.\n**Example:** `/pay user:@Name amount:5`\nA confirmation window will appear.",
                    inline: false
                },
                {
                    name: "📦 /vouches",
                    value: "Check your vouches or someone else's.",
                    inline: false
                },
                {
                    name: "🏆 /leaderboard",
                    value: "Shows the top users with the most vouches.",
                    inline: false
                },
                {
                    name: "📜 /transactions",
                    value: "View your transaction history.\nAdmins can view someone else's history.",
                    inline: false
                },
                {
                    name: "🛠️ Admin Only — /create",
                    value: "Give vouches to a user.\n**Example:** `/create user:@Name amount:10`",
                    inline: false
                },
                {
                    name: "🧹 Admin Only — /remove",
                    value: "Remove vouches from a user.\n**Example:** `/remove user:@Name amount:5`",
                    inline: false
                }
            )
            .setFooter({ text: "If you need help, message the server staff" });

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    }
};
