import { Events, MessageFlags } from 'discord.js';
import safeReply from '../helpers/safeReply.js';

export default {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		
		await safeReply(interaction, async () => {
			await command.execute(interaction);
		}, {
			deferReply: true,
			ephemeral: false,
		});
	},
};