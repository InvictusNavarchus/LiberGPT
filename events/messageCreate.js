import { Events } from 'discord.js';
import fetchRequest from '../helpers/fetchRequest.js';
import splitMessage from '../helpers/splitMessage.js';

const baseEndpoint = 'https://api.zpi.my.id/v1/ai/copilot';

export default {
	name: Events.MessageCreate,
	/**
	 * Handles incoming messages and responds when the bot is mentioned
	 * @param {import('discord.js').Message} message - The Discord message
	 */
	async execute(message) {
		// Ignore messages from bots
		if (message.author.bot) return;

		// Check if the bot is mentioned in the message
		if (!message.mentions.has(message.client.user)) return;

		// Remove the bot mention from the message content to get clean prompt
		const prompt = message.content
			.replace(/<@!?\d+>/g, '') // Remove all user mentions
			.trim();

		// If there's no content after removing mentions, ignore
		if (!prompt) return;

		console.log(`🔍 [mention] User ${message.author.tag} mentioned bot in ${message.guild?.name || 'DM'}`);
		console.log(`🔍 [mention] Prompt: "${prompt}"`);
		console.log(`🔍 [mention] Using copilot model`);

		try {
			// Send typing indicator to show the bot is processing
			await message.channel.sendTyping();

			// Get AI response using copilot model
			const llmOutput = await fetchRequest(baseEndpoint, prompt, 'copilot');
			console.log('📥 [mention] Received output from API.');

			// Split the output into message chunks if needed
			const messages = splitMessage(llmOutput, 2000);
			console.log(`🧩 [mention] Original Output length: ${llmOutput.length}`);
			console.log(`📏 [mention] Array length after split: ${messages.length}`);
			messages.forEach((msg, i) => console.log(`📝 [mention] Message ${i + 1} length: ${msg.length}`));

			// Send the first message as a reply
			await message.reply(messages.shift());

			// Send any additional chunks as follow-up messages
			for (const msg of messages) {
				await message.channel.send(msg);
			}

		} catch (error) {
			console.error('❌ [mention] Error processing mention:', error);
			await message.reply('Sorry, I encountered an error while processing your request. Please try again later.');
		}
	},
};
