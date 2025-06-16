import { Events } from 'discord.js';
import logger from '../helpers/logger.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		logger.info(`Ready! Logged in as ${client.user.tag}`);
	},
};