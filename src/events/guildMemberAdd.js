const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    run: async(client, member) => {
        // Ajoute le role employé à un membre lorsqu'il rejoint le serveur, décommentez la ligne ci-dessous pour activer la fonctionnalité
        // member.roles.add(client.config.roles.clientId).catch(e => console.error(e));  
    }
}