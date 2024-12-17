const { ApplicationCommandOptionType } = require("discord.js");
const roles = require("../config.js");

module.exports = {
    name: "downgrade",
    description: "Permet de rétrograder un employé.",
    admin: true,
    options: [
        {
            name: "employé",
            description: "L'employé à rétrograder",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "grade",
            description: "Le nouveau grade de l'employé",
            type: ApplicationCommandOptionType.String,
            choices: roles.grades.map(role => ({ name: role, value: role })),
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

        const currentRoleIndex = roles.grades.findIndex(role => role === currentEmployeeGrade);
        if (currentRoleIndex === -1) return errorEmbed("Le grade actuel de cet employé est invalide.", false, "editReply");

        const targetGrade = grade ?? roles.grades[currentRoleIndex + 1];
        if (!targetGrade) return errorEmbed("Aucun grade valide pour la rétrogradation n'a été trouvé.", false, "editReply");

        const executorIndex = roles.grades.findIndex(role => role === currentExecutorGrade);
        const targetGradeIndex = roles.grades.findIndex(role => role === targetGrade);

        if (executorIndex === -1) return errorEmbed("Votre grade actuel est invalide.", false, "editReply");
        if (targetGradeIndex === -1) return errorEmbed("Le grade cible est invalide.", false, "editReply");
        
        if (executorIndex >= currentRoleIndex)
            return errorEmbed(`Vous ne pouvez pas rétrograder cet employé car son grade actuel (**${currentEmployeeGrade}**) est égal ou supérieur au vôtre (**${currentExecutorGrade}**).`, false, "editReply");
        if (currentEmployeeGrade === targetGrade)
            return errorEmbed(`Cet employé a déjà le grade **${currentEmployeeGrade}**.`, false, "editReply");

        await client.db.setEmployee(employee.id, "grade", targetGrade);

        const data = {
            action: "downgradeEmployee",
            nom: employeeData.last_name,
            prenom: employeeData.first_name,
            grade: targetGrade,
        };
        await client.google.post(data);

        return successEmbed(`<@${employee.id}> a été rétrogradé au grade **${targetGrade}** !`, false, false, "editReply");
    }
};
