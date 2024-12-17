const { ApplicationCommandOptionType } = require("discord.js");
const roles = require("../config.js");

module.exports = {
    name: "remove",
    description: "Permet de retirer une spécialité à un employé.",
    admin: true,
    options: [{
        name: "spécialité",
        description: "La spécialité à retirer",
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: "employé",
            description: "L'employé à qui retirer la spécialité",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "spécialité-1",
            description: "La spécialité à retirer",
            type: ApplicationCommandOptionType.String,
            choices: roles.specialities.map(role => ({ name: role, value: role })),
            required: true
        },
        {
            name: "spécialité-2",
            description: "La spécialité à retirer",
            type: ApplicationCommandOptionType.String,
            choices: roles.specialities.map(role => ({ name: role, value: role })),
            required: false
        },
        {
            name: "spécialité-3",
            description: "La spécialité à retirer",
            type: ApplicationCommandOptionType.String,
            choices: roles.specialities.map(role => ({ name: role, value: role })),
            required: false
        }]
    }],
    run: async(client, interaction, { successEmbed, errorEmbed }) => {
        
        await interaction.deferReply({ ephemeral: true });
        
        const employee = interaction.options.getUser("employé");
        let specialities = [
            interaction.options.getString("spécialité-1"),
            interaction.options.getString("spécialité-2"),
            interaction.options.getString("spécialité-3"),
        ].filter(speciality => speciality);

        specialities = [...new Set(specialities)];

        if (!employee) return errorEmbed("L'employé est introuvable.", false, "editReply");
        if (!specialities.length) return errorEmbed("Aucune spécialité n'a été sélectionnée.", false, "editReply");

        const employeeData = await client.db.getEmployee(employee.id);
        if (!employeeData) return errorEmbed("L'employé est introuvable.", false, "editReply");

        const invalidSpecialities = specialities.filter(speciality => !employeeData.specialities.includes(speciality));
        if (invalidSpecialities.length > 0)
            return errorEmbed(`L'employé n'a pas les spécialités suivantes : **${invalidSpecialities.join(", ")}**.`, false, "editReply");

        for (const speciality of specialities) {
            await client.db.removeSpeciality(employee.id, speciality);
        }

        const data = {
            action: "removeSpeciality",
            nom: employeeData.last_name,
            prenom: employeeData.first_name,
            specialities: specialities,
        };

        await client.google.post(data);

        successEmbed(`Les spécialités **${specialities.join(", ")}** ont bien été retirées à ${employee}.`, false, false, "editReply");
    }
};
