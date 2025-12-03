const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const User = require("../models/User");
const { logToStaff } = require("../utils/log");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Remove vouches from a user (Admin only)")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("User to remove vouches from")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("amount")
                .setDescription("Amount to remove")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (amount <= 0)
            return interaction.reply({ content: "Amount must be positive.", ephemeral: true });

        let dbUser = await User.findOne({ userId: target.id });
        if (!dbUser) dbUser = await User.create({ userId: target.id });

        if (dbUser.vouches < amount)
            return interaction.reply({
                content: "❌ User does not have that many vouches.",
                ephemeral: true
            });

        dbUser.vouches -= amount;
        await dbUser.save();
		
		const Transaction = require("../models/Transaction");

		await Transaction.create({
			type: "REMOVE",
			senderId: interaction.user.id,
			recipientId: target.id,
			amount: amount
		});


        await interaction.reply(`🗑️ Removed **${amount} vouches** from **${target.tag}**.`);

        // 🔹 Log to staff channel
        await logToStaff(
            interaction.client,
            `🗑️ **REMOVE**\n` +
            `Admin: **${interaction.user.tag}** (\`${interaction.user.id}\`)\n` +
            `Target: **${target.tag}** (\`${target.id}\`)\n` +
            `Amount: **${amount}**\n` +
            `New balance: **${dbUser.vouches}**`
        );
    }
};
