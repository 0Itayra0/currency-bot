const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const User = require("../models/User");
const { logToStaff } = require("../utils/log");
const { checkRank } = require("../utils/rankCheck");
const Transaction = require("../models/Transaction");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create")
        .setDescription("Create vouches and give them to a user (Admin only)")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("User who receives the vouches")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("amount")
                .setDescription("Amount of vouches to create")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const user = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (amount <= 0)
            return interaction.reply({ content: "❌ Amount must be positive.", flags: 64 });

        let dbUser = await User.findOne({ userId: user.id });
        if (!dbUser) dbUser = await User.create({ userId: user.id });

        dbUser.vouches += amount;
        await dbUser.save();

        // Log transaction
        await Transaction.create({
            type: "CREATE",
            senderId: interaction.user.id,
            recipientId: user.id,
            amount
        });

        // Rank update
        checkRank(interaction.client, interaction.guild.id, user.id, dbUser.vouches);

        // User reply
        await interaction.reply({
            content: `✅ Created **${amount}** vouches and gave them to **${user.tag}**.`,
            flags: 64
        });

        // Staff log
        await logToStaff(
            interaction.client,
            `🧾 **CREATE**\n` +
            `Admin: **${interaction.user.tag}** (\`${interaction.user.id}\`)\n` +
            `Target: **${user.tag}** (\`${user.id}\`)\n` +
            `Amount: **${amount}**\n` +
            `New Balance: **${dbUser.vouches}**`
        );
    }
};
