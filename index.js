// ─────────────────────────────────────────────
// Luka’s Clean Ticket Bot (All replies in embeds)
// Prefix: .
// ─────────────────────────────────────────────

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField
} = require("discord.js");
const express = require("express");

// ─────────────────────────────────────────────
// EXPRESS SERVER FOR RENDER
// ─────────────────────────────────────────────
const app = express();
app.get("/", (req, res) => res.send("Bot is online"));
app.listen(3000);

// ─────────────────────────────────────────────
// DISCORD CLIENT
// ─────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const PREFIX = ".";
let ticketCounter = 0;

// ─────────────────────────────────────────────
// SEND TICKET PANEL — .panel
// ─────────────────────────────────────────────
client.on("messageCreate", async (msg) => {
    if (!msg.content.startsWith(PREFIX + "panel")) return;
    if (msg.author.bot) return;

    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("❌ You need **Admin** permission to use this command.");
        return msg.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Panel")
        .setDescription(
            "Choose the type of ticket you want to create:\n\n" +
            "🛠 **Support** – Normal help\n" +
            "🤝 **Middleman** – Trading help\n" +
            "📢 **Partnership** – Advertising / Partnerships"
        )
        .setColor("#2b2d31");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("support_ticket").setLabel("Support").setEmoji("🛠").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("middleman_ticket").setLabel("Middleman").setEmoji("🤝").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("partnership_ticket").setLabel("Partnership").setEmoji("📢").setStyle(ButtonStyle.Primary)
    );

    msg.channel.send({ embeds: [embed], components: [row] });
});

// ─────────────────────────────────────────────
// TICKET BUTTON HANDLER
// ─────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const types = {
        support_ticket: { name: "Support", emoji: "🛠" },
        middleman_ticket: { name: "Middleman", emoji: "🤝" },
        partnership_ticket: { name: "Partnership", emoji: "📢" }
    };

    const type = types[interaction.customId];
    if (!type) return;

    ticketCounter++;
    const ticketName = `ticket-${ticketCounter}`;

    const channel = await interaction.guild.channels.create({
        name: ticketName,
        type: 0,
        permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            }
        ]
    });    const ticketEmbed = new EmbedBuilder()
        .setTitle(`${type.emoji} ${type.name} Ticket`)
        .setDescription(
            `Welcome <@${interaction.user.id}>!\n\nA staff member will assist you shortly.\n\n` +
            `> Ticket Number: **#${ticketCounter}**`
        )
        .setColor("#2b2d31");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim").setEmoji("🧾").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("close_ticket").setLabel("Close").setEmoji("🔒").setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [ticketEmbed], components: [row] });

    const confirmEmbed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setDescription(`🎫 Your **${type.name} Ticket** has been created:\n${channel}`);

    interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
});

// ─────────────────────────────────────────────
// CLAIM + CLOSE BUTTONS
// ─────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "claim_ticket") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            const embed = new EmbedBuilder()
                .setColor("#ff0000")
                .setDescription("❌ Only staff can **claim** a ticket.");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setDescription(`🧾 Ticket claimed by **${interaction.user.tag}**.`);
        return interaction.reply({ embeds: [embed] });
    }

    if (interaction.customId === "close_ticket") {
        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setDescription("🔒 Ticket will close in **3 seconds**...");
        interaction.reply({ embeds: [embed] });

        setTimeout(() => {
            interaction.channel.delete().catch(() => {});
        }, 3000);
    }
});

// ─────────────────────────────────────────────
// ADD USER TO TICKET — .add @user
// ─────────────────────────────────────────────
client.on("messageCreate", async (msg) => {
    if (!msg.content.startsWith(PREFIX + "add")) return;
    if (msg.author.bot) return;

    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("❌ You need **Manage Channels** to use this.");
        return msg.reply({ embeds: [embed] });
    }

    const user = msg.mentions.users.first();
    if (!user) {
        const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("❌ Please mention a **valid user**.");
        return msg.reply({ embeds: [embed] });
    }

    await msg.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
    });

    const embed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setDescription(`✅ **${user.tag}** has been added to this ticket.`);
    msg.reply({ embeds: [embed] });
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
