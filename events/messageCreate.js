import { Events } from 'discord.js';
import fetchRequest from '../helpers/fetchRequest.js';
import splitMessage from '../helpers/splitMessage.js';

const baseEndpoint = 'https://api.zpi.my.id/v1/ai/copilot';

/**
 * Extracts the model type from the endpoint URL
 * @param {string} endpoint - The API endpoint URL
 * @returns {string} The model type ('copilot', 'blackbox', etc.)
 */
function getModelFromEndpoint(endpoint) {
	if (endpoint.includes('/blackbox')) return 'blackbox';
	if (endpoint.includes('/copilot')) return 'copilot';
	return 'copilot'; // default fallback
}

/**
 * Builds a prompt with reply context if the message is a reply
 * @param {import('discord.js').Message} message - The Discord message
 * @returns {Promise<string>} The formatted prompt with context
 */
async function buildPromptWithContext(message) {
	// Remove the bot mention from the message content to get clean prompt
	const userPrompt = message.content
		.replace(/<@!?\d+>/g, '') // Remove all user mentions
		.trim();

	// If there's no content after removing mentions, return empty
	if (!userPrompt) return '';

	// Check if this message is a reply to another message
	if (message.reference && message.reference.messageId) {
		try {
			// Fetch the referenced message
			const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
			
			if (referencedMessage) {
				// Build context with the original message
				let context = `[Replying to message from ${referencedMessage.author.username}]\n`;
				context += `Original message: "${referencedMessage.content}"\n\n`;
				context += `User's reply: "${userPrompt}"`;
				
				console.log(`🔗 [mention] Message is a reply to: ${referencedMessage.author.username}`);
				console.log(`🔗 [mention] Original message: "${referencedMessage.content.substring(0, 100)}..."`);
				
				return context;
			}
		} catch (error) {
			console.error('❌ [mention] Error fetching referenced message:', error);
			// Fall back to just the user prompt if we can't fetch the reference
		}
	}

	return userPrompt;
}

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

		// Build the prompt with reply context if available
		let prompt = await buildPromptWithContext(message);

		// If there's no content after removing mentions, ignore
		if (!prompt) return;

		const model = getModelFromEndpoint(baseEndpoint);
		console.log(`🔍 [mention] User ${message.author.tag} mentioned bot in ${message.guild?.name || 'DM'}`);
		console.log(`🔍 [mention] Prompt: "${prompt}"`);
		console.log(`🔍 [mention] Using ${model} model`);

		try {
			// Send typing indicator to show the bot is processing
			await message.channel.sendTyping();

			// Get AI response using the determined model
			const llmOutput = await fetchRequest(baseEndpoint, prompt, model);
			console.log('📥 [mention] Received output from API.');

			// Split the output into message chunks if needed
			const messages = splitMessage(llmOutput, 2000);
			console.log(`🧩 [mention] Original Output length: ${llmOutput.length}`);
			console.log(`📏 [mention] Array length after split: ${messages.length}`);
			messages.forEach((msg, i) => console.log(`📝 [mention] Message ${i + 1} length: ${msg.length}`));

			// Send the first message as a reply
			await message.reply({
				content: messages.shift(),
				allowedMentions: { parse: [] }
			});

			// Send any additional chunks as follow-up messages
			for (const msg of messages) {
				await message.channel.send({
					content: msg,
					allowedMentions: { parse: [] }
				});
			}

		} catch (error) {
			console.error('❌ [mention] Error processing mention:', error);
			await message.reply({
				content: 'Sorry, I encountered an error while processing your request. Please try again later.',
				allowedMentions: { parse: [] }
			});
		}
	},
};
