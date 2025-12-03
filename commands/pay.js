const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const User = require("../models/User");
const { logToStaff } = require("../utils/log");
const { checkCooldown } = require("../utils/cooldowns");
const {
    createPaySession,
    getPaySession,
    deletePaySession
} = require("../utils/paySessions");
const { checkRank } = require("../utils/rankCheck");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Pay vouches to another user")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("User to pay")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("amount")
                .setDescription("Amount of vouches to pay")
                .setRequired(true)
        ),

    async execute(interaction) {
        //  Cooldown check (10 seconds)
        const remaining = checkCooldown("pay", interaction.user.id, 10);
        if (remaining) {
            return interaction.reply({
                content: `⏳ Slow down! You can use **/pay** again in **${remaining}s**.`,
                flags: 64
            });
        }

        const sender = interaction.user;
        const recipient = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (recipient.id === sender.id)
            return interaction.reply({
                content: "You cannot pay yourself.",
                flags: 64
            });

        if (amount <= 0)
            return interaction.reply({
                content: "Amount must be positive.",
                flags: 64
            });

        // Load sender data to verify balance BEFORE confirmation
        let senderDB = await User.findOne({ userId: sender.id });
        if (!senderDB) senderDB = await User.create({ userId: sender.id });

        if (senderDB.vouches < amount)
            return interaction.reply({
                content: "❌ You don't have enough vouches for that payment.",
                flags: 64
            });

        // Save temp session
        createPaySession(sender.id, recipient.id, amount);

        // Confirmation embed
        const embed = new EmbedBuilder()
            .setTitle("💸 Payment Confirmation")
            .setDescription(
                `You are about to pay **${amount} vouches** to **${recipient.tag}**.\n\n` +
                `Do you confirm this transaction?`
            )
            .setColor("#ffaa00");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("confirm_pay")
                .setLabel("Confirm")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("cancel_pay")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: 64
        });
    }
};
