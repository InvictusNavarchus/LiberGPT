import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import logger from './helpers/logger.js';
const __dirname = import.meta.dirname;

logger.info('🚀 Starting the bot...');

const token = process.env.TOKEN;

const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.GuildMessages, 
		GatewayIntentBits.MessageContent
	] 
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

logger.info('📂 Loading commands...');
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = (await import(filePath)).default;
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			logger.info(`✅ Command loaded: ${command.data.name}`);
		} else {
			logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

logger.info('🎉 Loading events...');
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = (await import(filePath)).default;
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
		logger.info(`🔄 One-time event loaded: ${event.name}`);
	} else {
		client.on(event.name, (...args) => event.execute(...args));
		logger.info(`🔁 Event loaded: ${event.name}`);
	}
}

logger.info('🔑 Logging in...');
client.login(token).then(() => {
	logger.info('✅ Bot logged in successfully!');
}).catch(err => {
	logger.error(`❌ Failed to log in: ${err}`);
});