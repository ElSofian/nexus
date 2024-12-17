const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "set",
    description: "Permet set une value d'un employé.",
    admin: true,
    options: [
        {
            name: "employé",
            description: "L'employé à voir.",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "key",
            description: "Key.",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "value",
            description: "Value.",
            type: ApplicationCommandOptionType.String,
            required: true
        },
    ],
    run: async(client, interaction, { successEmbed, errorEmbed }) => {
        const employee = interaction.options.getUser("employé");
        const key = interaction.options.getString("key");
        const value = interaction.options.getString("value");

        if (interaction.member.id != "683269450086219777") return errorEmbed("Vous n'avez pas la permission d'utiliser cette commande.");

        const employeeData = await client.db.getEmployee(employee.id);
        if (!employeeData) return errorEmbed("L'employé est introuvable.");

        const res = await client.db.setEmployee(employee.id, key, value);
        if (!res) return errorEmbed("Erreur lors de la modification de l'employé.");

        const newEmoployeeData = await client.db.getEmployee(employee.id);
        console.log(newEmoployeeData);
        successEmbed("Employé modifié.", false, true);
    }
}