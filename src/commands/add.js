const { ApplicationCommandOptionType } = require("discord.js");
const roles = require("../config.js");

module.exports = {
    name: "add",
    description: "Permet d'ajouter une spécialité à un employé.",
    admin: true,
    options: [{
        name: "spécialité",
        description: "La spécialité à ajouter",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: "employé",
                description: "L'employé à qui ajouter la spécialité",
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: "spécialité-1",
                description: "La spécialité à ajouter",
                type: ApplicationCommandOptionType.String,
                choices: roles.specialities.map(role => ({ name: role, value: role })),
                required: true
            },
            {
                name: "spécialité-2",
                description: "La spécialité à ajouter",
                type: ApplicationCommandOptionType.String,
                choices: roles.specialities.map(role => ({ name: role, value: role })),
                required: false
            },
            {
                name: "spécialité-3",
                description: "La spécialité à ajouter",
                type: ApplicationCommandOptionType.String,
                choices: roles.specialities.map(role => ({ name: role, value: role })),
                required: false
            }
        ]
    }],
    run: async (client, interaction, { successEmbed, errorEmbed }) => {
        
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();

        if (subcommand == "spécialité") {
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

            const alreadyHasSpecialities = specialities.filter(speciality => employeeData.specialities.includes(speciality));
            if (alreadyHasSpecialities.length > 0) {
                return errorEmbed(`L'employé a déjà les spécialités suivantes : **${alreadyHasSpecialities.join(", ")}**.`, false, "editReply");
            }

            const addedSpecialities = [];
            for (const speciality of specialities) {
                const added = await client.db.addSpeciality(employee.id, speciality);
                if (added) addedSpecialities.push(speciality);
            }

            if (!addedSpecialities.length)
                return errorEmbed("Aucune spécialité n'a pu être ajoutée.", false, "editReply");

            const data = {
                action: "addSpeciality",
                nom: employeeData.last_name,
                prenom: employeeData.first_name,
                specialities: addedSpecialities,
            };

            await client.google.post(data);

            successEmbed(`Les spécialités **${addedSpecialities.join(", ")}** ont bien été ajoutées à ${employee}.`, false, false, "editReply");
        }
    }
};
