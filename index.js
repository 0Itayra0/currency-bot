require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const { checkRank } = require("./utils/rankCheck");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// ---- Commands Collection ----
client.commands = new Collection();

// Load command files
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
const commandsJSON = [];

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commandsJSON.push(command.data.toJSON());
}

// ---- Register Slash Commands ----
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commandsJSON }
        );
        console.log("Slash commands registered.");
    } catch (e) {
        console.error(e);
    }
})();

// ---- Connect to MongoDB ----
mongoose.connect(process.env.MONGO)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// ---- Backups ----
const { runBackup } = require("./utils/backup");
setInterval(() => runBackup(client), 1000 * 60 * 60 * 6);
runBackup(client);

// Backup on shutdown
process.on("SIGINT", async () => {
    console.log("📦 Final backup...");
    await runBackup();
    process.exit(0);
});
// ===================================================
//  SLASH COMMAND HANDLER
// ===================================================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (e) {
        console.error(e);
        interaction.reply({ content: "❌ Error executing command", flags: 64 });
    }
});


// ===================================================
//  BUTTON HANDLER (PAY CONFIRMATION)
// ===================================================
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const User = require("./models/User");
    const Transaction = require("./models/Transaction");
    const { logToStaff } = require("./utils/log");
    const { getPaySession, deletePaySession } = require("./utils/paySessions");

    const userId = interaction.user.id;
    const session = getPaySession(userId);

    if (!session) {
        return interaction.reply({
            content: "❌ This payment session has expired.",
            flags: 64
        });
    }

    // CANCEL BUTTON
    if (interaction.customId === "cancel_pay") {
        deletePaySession(userId);
        return interaction.update({
            content: "❌ Payment canceled.",
            embeds: [],
            components: []
        });
    }

    // CONFIRM BUTTON
    if (interaction.customId === "confirm_pay") {
        const senderId = userId;
        const recipientId = session.recipientId;
        const amount = session.amount;

        const sender = interaction.user;
        const recipient = await interaction.client.users.fetch(recipientId);

        // Load database users
        let senderDB = await User.findOne({ userId: senderId });
        let recipientDB = await User.findOne({ userId: recipientId });

        if (!senderDB) senderDB = await User.create({ userId: senderId });
        if (!recipientDB) recipientDB = await User.create({ userId: recipientId });

        // Double-check balance before confirming
        if (senderDB.vouches < amount) {
            deletePaySession(userId);
            return interaction.update({
                content: "❌ Not enough vouches.",
                embeds: [],
                components: []
            });
        }

        // Perform transaction
        senderDB.vouches -= amount;
        recipientDB.vouches += amount;

        await senderDB.save();
        await recipientDB.save();

        checkRank(interaction.client, interaction.guild.id, senderId, senderDB.vouches);
        checkRank(interaction.client, interaction.guild.id, recipientId, recipientDB.vouches);



        // SAVE TRANSACTION
        await Transaction.create({
            type: "PAY",
            senderId,
            recipientId,
            amount
        });

        // Delete temporary session
        deletePaySession(userId);

        // Update UI
        await interaction.update({
            content: `💸 You paid **${amount}** vouches to **${recipient.tag}**.`,
            embeds: [],
            components: []
        });

        // Staff Log
        await logToStaff(
            interaction.client,
            `💸 **CONFIRMED PAYMENT**\n` +
            `From: **${sender.tag}** (\`${sender.id}\`)\n` +
            `To: **${recipient.tag}** (\`${recipient.id}\`)\n` +
            `Amount: **${amount}**\n` +
            `New balances → From: **${senderDB.vouches}**, To: **${recipientDB.vouches}**`
        );
    }
}); // <-- THIS was missing


// ===================================================
//  LOGIN (MUST BE AT BOTTOM)
// ===================================================
client.login(process.env.TOKEN);
