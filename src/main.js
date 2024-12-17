const { Client, Partials, GatewayIntentBits, Events } = require('discord.js');
const { QuickDB } = require('quick.db');
require('dotenv').config();
const loadCommands = require('./handlers/loadCommands.js');
const loadEvents = require ('./handlers/loadEvents.js');
const registerCommands = require('./handlers/registerCommands.js');

const db = new QuickDB();
const client = new Client({
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
	]
});

client.config = require('./config.js');
client.functions = new (require('./structures/Functions.js'))(client);
client.db = new (require('./structures/Database.js'))(client, db);
client.google = new (require('./structures/GoogleSheet.js'))(client);
client.logger = new (require('./structures/Logger.js'))();

const commands = loadCommands(client);
loadEvents(client);

client.login(process.env.TOKEN);

client.once(Events.ClientReady, (cient) => {
	registerCommands(client, commands);
});

// process.on('unhandledRejection', (error) => {
// 	console.error('Unhandled promise rejection:', error);
// });

// process.on('uncaughtException', (error) => {
// 	console.error('Unhandled promise rejection:', error);
// });

// process.on("exit", () => {
// 	if (client.interval)
// 		clearInterval(client.interval);
// })
