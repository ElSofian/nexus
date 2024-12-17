const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "reset",
    description: "Permet de reset la base de données.",
    admin: true,
    run: async(client, interaction, { successEmbed, errorEmbed }) => {
        await client.db.reset();
        successEmbed("La base de données a été réinitialisée.");
    }
}