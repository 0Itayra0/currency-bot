const { SlashCommandBuilder } = require("discord.js");
const User = require("../models/User");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vouches")
        .setDescription("Check your vouches or another user's")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("User to check")
                .setRequired(false)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser("user") || interaction.user;

        let dbUser = await User.findOne({ userId: target.id });
        if (!dbUser) dbUser = await User.create({ userId: target.id });

        interaction.reply(`📦 **${target.tag}** has **${dbUser.vouches} vouches**.`);
    }
};

