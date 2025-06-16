import { SlashCommandBuilder } from 'discord.js';
import logger from '../../helpers/logger.js';
import { replyOrEdit } from '../../helpers/safeReply.js';

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	/**
	 * Executes the ping command
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction - The Discord interaction
	 */
	async execute(interaction) {
		await replyOrEdit(interaction, 'Pong!');
	},
};