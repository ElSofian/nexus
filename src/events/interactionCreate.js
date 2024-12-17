const { Events, EmbedBuilder, ActionRowBuilder, ChannelType, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');

module.exports = {
	name: Events.InteractionCreate,
	run: async(client, interaction) => {
		if(!interaction.inGuild() || !interaction.guildId) return;

		// Functions
		
		function errorEmbed(description, justEmbed = false, replyType = "reply", ephemeral = true) {
			if(!justEmbed) return interaction[replyType]({ embeds: [new EmbedBuilder().setColor("Red").setDescription(description)], components: [], content: null, files: [], ephemeral: ephemeral }).catch(() => {});
			else return new EmbedBuilder().setColor("Red").setDescription(description)
		}
		
		function successEmbed(description, justEmbed = false, ephemeral = false, replyType = "reply") {
			if(!justEmbed) return interaction[replyType]({ embeds: [new EmbedBuilder().setColor("Green").setDescription(description)], components: [], content: null, files: [], ephemeral: ephemeral }).catch(() => {})
			else return new EmbedBuilder().setColor("Green").setDescription(description)
		}

		// -----------------------------------------
	
		const command = interaction.client.commands[interaction.commandName];
		if (!command && interaction.type !== InteractionType.MessageComponent && interaction.type !== InteractionType.ModalSubmit) {
			client.logger.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		if (command?.admin && !client.config.admins.includes(interaction.member.id) && !interaction.member.roles.cache.has(client.config.roles.manage)) return errorEmbed("Vous n'avez pas la permission d'utiliser cette commande.");
		if (command?.employeeOnly && !client.config.admins.includes(interaction.member.id) && !interaction.member.roles.cache.has(client.config.roles.employeeRoleId)) return errorEmbed("Vous n'avez pas la permission d'utiliser cette commande.");

		try {
			if (interaction.type == InteractionType.ApplicationCommand) return command.run(client, interaction, { errorEmbed, successEmbed });
			if (interaction.type == InteractionType.MessageComponent || interaction.type == InteractionType.ModalSubmit) {
				
				
				// INTERACTION WITH ABSENCE BUTTON

				if (interaction.customId == "absence" && interaction.message.id == client.config.messages.absenceId) {
					const modal = new ModalBuilder()
						.setCustomId("m_absence")
						.setTitle("Absence")
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("date")
									.setPlaceholder("Date de fin de votre absence (JJ/MM/AAAA)")
									.setLabel("Date de fin")
									.setStyle(TextInputStyle.Short)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("reason")
									.setPlaceholder("Raison de votre absence")
									.setLabel("Raison")
									.setStyle(TextInputStyle.Paragraph)
							)
						)

					await interaction.showModal(modal);

					const filter = i => i.customId == "m_absence";
					const collector = await interaction.awaitModalSubmit({ filter, time: 60000 });
					if (!collector) return console.log("Collector not found.");

					const date = collector.fields.getTextInputValue("date");
					const reason = collector.fields.getTextInputValue("reason");

					const dateCheck = client.functions.checkDate(date);
					if (!dateCheck.valid) return collector.reply({ embeds: [errorEmbed(dateCheck.errorMsg, true)], ephemeral: true });
					if (!reason) return collector.reply({ embeds: [errorEmbed("Veuillez entrer une raison.", true)], ephemeral: true });

					const [prenom, nom] = await client.db.getEmployeeName(interaction.member.user.id, "array");
					if (!prenom || !nom) return console.error(`Employé ${interaction.member.user.id} non trouvé.`);

					const data = {
						action: "setAbsence",
						prenom,
						nom,
						dateFin: date,
						raison: reason
					};

					const response = await axios.post(client.config.google.scriptURL, data, {
						headers: { 'Content-Type': 'application/json' }
					}).catch((error) => {
						console.error('Erreur lors de l\'ajout de l\'absence dans Google Sheets:', error);
					});

					if (response.status !== 200) {
						return console.error(`Erreur HTTP ${response.status}: ${response.data}`);
					}

					collector.reply({ embeds: [successEmbed("Votre absence a bien été enregistrée.", true)], ephemeral: true }).catch(() => {});
				}


				// -----------------------------------------


				// INTERACTION WITH PHONE/IBAN BUTTON

				if ((interaction.customId == "phone" || interaction.customId == "iban") && interaction.message.id == client.config.messages.editId) {
					const customId = interaction.customId;
					
					const embed = new EmbedBuilder()
					.setColor(client.config.embed.color)
					.setTitle(customId == "phone" ? "Numéro de Téléphone" : "IBAN")
					.setDescription(`Veuillez entrer votre ${customId == "phone" ? "nouveau numéro de téléphone" : "nouvel IBAN"}.
						
						**IMPORTANT:** Répondez en me mentionnant au début ! Exemple: <@${client.user.id}> ${customId == "phone" ? "2276628" : "3P9IBH"}`);

					const message = await interaction.reply({ embeds: [embed], ephemeral: true });
					if (!message) return;

					const filter = m => m.author.id == interaction.member.user.id && (m.content.startsWith(`<@${client.user.id}>`) || m.content.startsWith(`<@!${client.user.id}>`));
					const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

					collector.on('collect', async m => {
						const value = m.content.replace(/<@!?\d+>/, '').trim();
						if (!value) return await interaction.followUp({ embeds: [errorEmbed("Veuillez entrer une valeur valide.", true)], ephemeral: true });

						const [prenom, nom] = await client.db.getEmployeeName(interaction.member.id, "array");
						if (!prenom || !nom) return console.error(`Employé ${interaction.member.id} non trouvé.`);

						const data = {
							action: "editEmployee",
							prenom,
							nom,
							options: { key: customId == "phone" ? "telephone" : "iban", value }
						};

						const response = await axios.post(client.config.google.scriptURL, data, {
							headers: { 'Content-Type': 'application/json' }
						}).catch((error) => {
							console.error(`Erreur lors de l'ajout de ${customId == "phone" ? "numéro de téléphone" : "IBAN"} dans Google Sheets:`, error);
						});

						if (response.status !== 200) {
							return console.error(`Erreur HTTP ${response.status}: ${response.data}`);
						}

						await client.db.setEmployee(interaction.member.id, customId, value);

						await interaction.followUp({
							embeds: [successEmbed(`Votre **${customId == "phone" ? "numéro de téléphone" : "IBAN"}** a bien été enregistré.`, true)],
							ephemeral: true }).catch(() => {});

						message.delete().catch(() => {});
						m.delete().catch(() => {});
						collector.stop();
					});
				}
			
			}
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while reply or deferred command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};
