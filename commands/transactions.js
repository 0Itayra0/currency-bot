const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Transaction = require("../models/Transaction");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("transactions")
        .setDescription("View your vouch transaction history")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("View another user's history (admin only)")
                .setRequired(false)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser("user") || interaction.user;
        const searchingSelf = target.id === interaction.user.id;

        // If viewing someone else, require admin permissions
        if (!searchingSelf && !interaction.member.permissions.has("Administrator")) {
            return interaction.reply({
                content: "❌ You can only view **your own** history.",
                flags: 64
            });
        }

        // Find last 10 transactions
        const history = await Transaction.find({
            $or: [
                { senderId: target.id },
                { recipientId: target.id }
            ]
        })
        .sort({ timestamp: -1 })
        .limit(10);

        if (history.length === 0) {
            return interaction.reply({
                content: `📭 No transactions found for **${target.tag}**.`,
                flags: 64
            });
        }

        let lines = "";

        for (const t of history) {
            const time = `<t:${Math.floor(t.timestamp.getTime() / 1000)}:R>`;
            let entry = "";

            if (t.type === "PAY") {
                if (t.senderId === target.id) {
                    entry = `📤 Sent **${t.amount}** to <@${t.recipientId}> • ${time}`;
                } else {
                    entry = `📥 Received **${t.amount}** from <@${t.senderId}> • ${time}`;
                }
            }

            if (t.type === "CREATE") {
                entry = `➕ Admin <@${t.senderId}> created **${t.amount}** for <@${t.recipientId}> • ${time}`;
            }

            if (t.type === "REMOVE") {
                entry = `➖ Admin <@${t.senderId}> removed **${t.amount}** from <@${t.recipientId}> • ${time}`;
            }

            lines += entry + "\n";
        }

        const embed = new EmbedBuilder()
            .setTitle(`📜 Transaction History — ${target.tag}`)
            .setDescription(lines)
            .setColor("#00aaff")
            .setFooter({ text: "Showing latest 10 transactions" });

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};
