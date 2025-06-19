import { SlashCommandBuilder } from 'discord.js';
import logger from '../../helpers/logger.js';
import { replyOrEdit } from '../../helpers/safeReply.js';

export default {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	/**
	 * Executes the user command to provide user information
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction - The Discord interaction
	 */
	async execute(interaction) {
		await replyOrEdit(interaction, `This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);
	},
};