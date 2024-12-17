const { ApplicationCommandOptionType } = require("discord.js");
const roles = require("../config.js");

module.exports = {
    name: "upgrade",
    description: "Permet de promouvoir un employé.",
    admin: true,
    options: [
        {
            name: "employé",
            description: "L'employé à promouvoir",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "grade",
            description: "Le nouveau grade de l'employé",
            type: ApplicationCommandOptionType.String,
            choices: roles.grades.map(role => ({ name: role, value: role })), // Assure-toi que "roles.grades" existe
            required: false
        }
    ],
    run: async (client, interaction, { successEmbed, errorEmbed }) => {
        await interaction.deferReply({ ephemeral: true });

        const executor = interaction.user; // Utilisateur qui exécute la commande
        const employee = interaction.options.getUser("employé");
        const grade = interaction.options.getString("grade");

        const executorData = await client.db.getEmployee(executor.id);
        if (!executorData) return errorEmbed("Vos informations n'ont pas été trouvées dans la base de données.", false, "editReply");

        const employeeData = await client.db.getEmployee(employee.id);
        if (!employeeData) return errorEmbed("Cet employé n'est pas présent dans la base de données de l'entreprise.", false, "editReply");

        const currentExecutorGrade = executorData.grade;
        const currentEmployeeGrade = employeeData.grade;

        const targetGrade = grade ?? roles.grades[roles.grades.findIndex(r => r === currentEmployeeGrade) - 1];
        if (!targetGrade) return errorEmbed("Aucun grade cible valide n'a été trouvé pour la promotion.", false, "editReply");

        const executorIndex = roles.grades.findIndex(role => role === currentExecutorGrade);
        const targetGradeIndex = roles.grades.findIndex(role => role === targetGrade);

        if (executorIndex === -1) return errorEmbed("Votre grade actuel est invalide.", false, "editReply");
        if (targetGradeIndex === -1) return errorEmbed("Le grade cible est invalide.", false, "editReply");

        if (executorIndex >= targetGradeIndex)
            return errorEmbed(`Vous ne pouvez pas promouvoir cet employé au grade **${targetGrade}** car votre grade actuel (**${currentExecutorGrade}**) est insuffisant.`, false, "editReply");
        if (currentEmployeeGrade === targetGrade)
            return errorEmbed(`Cet employé a déjà le grade **${currentEmployeeGrade}**.`, false, "editReply");

        await client.db.setEmployee(employee.id, "grade", targetGrade);

        const data = {
            action: "upgradeEmployee",
            nom: employeeData.last_name,
            prenom: employeeData.first_name,
            grade: targetGrade,
        };
        await client.google.post(data);

        return successEmbed(`<@${employee.id}> a été promu au grade **${targetGrade}** !`, false, false, "editReply");
    }
};
