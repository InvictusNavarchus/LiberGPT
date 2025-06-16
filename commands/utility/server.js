import { SlashCommandBuilder } from 'discord.js';
import logger from '../../helpers/logger.js';
import { replyOrEdit } from '../../helpers/safeReply.js';

export default {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the server.'),
	/**
	 * Executes the server command to provide server information
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction - The Discord interaction
	 */
	async execute(interaction) {
		await replyOrEdit(interaction, `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
	},
};