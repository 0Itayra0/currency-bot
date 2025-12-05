const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../models/User");
const shopItems = require("../config/shop");
const { logToStaff } = require("../utils/log");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("View or purchase shop items.")
        .addSubcommand(sub =>
            sub.setName("view")
               .setDescription("View available items in the shop.")
        )
        .addSubcommand(sub =>
            sub.setName("buy")
               .setDescription("Buy an item from the shop.")
               .addStringOption(opt =>
                    opt.setName("item")
                       .setDescription("Item ID to buy")
                       .setRequired(true)
                       .setAutocomplete(true)
               )
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();

        const filtered = shopItems
            .filter(item => item.id.toLowerCase().includes(focused.toLowerCase()))
            .slice(0, 25)
            .map(item => ({ name: `${item.name} (${item.price} vouches)`, value: item.id }));

        await interaction.respond(filtered);
    },

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // -------------------------------
        // /shop view
        // -------------------------------
        if (sub === "view") {
            const embed = new EmbedBuilder()
                .setTitle("🛒 Shop")
                .setDescription("Available items you can buy with vouches:")
                .setColor("Gold");

            shopItems.forEach(item => {
                embed.addFields({
                    name: `${item.name} — ${item.price} vouches`,
                    value: `${item.description}\nID: \`${item.id}\``,
                    inline: false
                });
            });

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        // -------------------------------
        // /shop buy
        // -------------------------------
        if (sub === "buy") {
            const itemId = interaction.options.getString("item");
            const item = shopItems.find(i => i.id === itemId);

            if (!item)
                return interaction.reply({ content: "❌ Invalid item ID.", flags: 64 });

            let userDB = await User.findOne({ userId: interaction.user.id });
            if (!userDB) userDB = await User.create({ userId: interaction.user.id });

            if (userDB.vouches < item.price)
                return interaction.reply({
                    content: `❌ You need **${item.price}** vouches but you only have **${userDB.vouches}**.`,
                    flags: 64
                });

            // Deduct cost
            userDB.vouches -= item.price;
            await userDB.save();

            // AUTOMATED ITEM HANDLING
            if (item.type === "role") {
                const role = interaction.guild.roles.cache.get(item.roleId);
                if (role) {
                    const member = interaction.guild.members.cache.get(interaction.user.id);
                    await member.roles.add(role).catch(() => {});
                }
            }

            if (item.type === "booster") {
                userDB.boosterUntil = Date.now() + 24 * 60 * 60 * 1000;
                await userDB.save();
            }

            // STAFF LOG
            await logToStaff(
                interaction.client,
                `🛒 **SHOP PURCHASE**\nUser: **${interaction.user.tag}**\nItem: **${item.name}**\nCost: **${item.price}**`
            );

            return interaction.reply({
                content: `✅ You bought **${item.name}** for **${item.price}** vouches!`,
                flags: 64
            });
        }
    }
};
