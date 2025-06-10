import { Events, MessageFlags } from 'discord.js';
import safeReply from '../helpers/safeReply.js';

export default {
	name: Events.InteractionCreate,
	/**
	 * Handles incoming Discord interactions and routes them to appropriate command handlers
	 * @param {import('discord.js').Interaction} interaction - The Discord interaction
	 */
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		
		// Determine if command needs deferral based on command name
		const needsDeferral = ['ask'].includes(interaction.commandName);
		
		await safeReply(interaction, async () => {
			await command.execute(interaction);
		}, {
			deferReply: needsDeferral,
			ephemeral: false,
		});
	},
};