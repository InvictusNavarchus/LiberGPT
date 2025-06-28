import { Events } from 'discord.js';
import logger from '../helpers/logger.js';
import fetchRequest from '../helpers/fetchRequest.js';
import splitMessage from '../helpers/splitMessage.js';

const endpoints = {
	copilot: 'https://api.zpi.my.id/v1/ai/copilot',
	blackbox: 'https://api.zpi.my.id/v1/ai/blackbox'
};

/**
 * Determines which AI model to use based on message content or defaults to copilot
 * @param {string} content - The message content to analyze
 * @returns {Object} Object containing the model name and endpoint
 */
function determineModel(content) {
	// Check if user specifically requests blackbox model
	if (content.toLowerCase().includes('blackbox') || content.toLowerCase().includes('bb:')) {
		return { model: 'blackbox', endpoint: endpoints.blackbox };
	}
	
	// Default to copilot
	return { model: 'copilot', endpoint: endpoints.copilot };
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
				context += `Original message: "${referencedMessage.content}"\n`;
				
				// Check for embeds in the original message
				if (referencedMessage.embeds && referencedMessage.embeds.length > 0) {
					context += `\nEmbeds in original message:\n`;
					referencedMessage.embeds.forEach((embed, index) => {
						context += `Embed ${index + 1}:\n`;
						if (embed.title) context += `- Title: ${embed.title}\n`;
						if (embed.description) context += `- Description: ${embed.description}\n`;
						if (embed.url) context += `- URL: ${embed.url}\n`;
						if (embed.author?.name) context += `- Author: ${embed.author.name}\n`;
						if (embed.fields && embed.fields.length > 0) {
							context += `- Fields:\n`;
							embed.fields.forEach(field => {
								context += `  * ${field.name}: ${field.value}\n`;
							});
						}
						if (embed.footer?.text) context += `- Footer: ${embed.footer.text}\n`;
						if (embed.timestamp) context += `- Timestamp: ${embed.timestamp}\n`;
						if (embed.color) context += `- Color: #${embed.color.toString(16).padStart(6, '0')}\n`;
						context += `\n`;
					});
				}
				
				context += `User's reply: "${userPrompt}"`;
				
				logger.info(`[mention] Message is a reply to: ${referencedMessage.author.username}`);
				logger.info(`[mention] Original message: "${referencedMessage.content.substring(0, 100)}..."`);
				if (referencedMessage.embeds && referencedMessage.embeds.length > 0) {
					logger.info(`[mention] Found ${referencedMessage.embeds.length} embed(s) in original message`);
				}
				
				return context;
			}
		} catch (error) {
			logger.error('[mention] Error fetching referenced message:', error);
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

		// Determine which AI model to use
		const { model, endpoint } = determineModel(prompt);
		
		// Clean the prompt by removing model-specific keywords
		prompt = prompt.replace(/\b(blackbox|bb:)\b/gi, '').trim();
		
		logger.info(`[mention] User ${message.author.tag} mentioned bot in ${message.guild?.name || 'DM'}`);
		logger.debug(`[mention] Prompt: "${prompt}"`);
		logger.info(`[mention] Using ${model} model`);

		try {
			// Send typing indicator to show the bot is processing
			await message.channel.sendTyping();

			// Get AI response using the determined model and endpoint
			const llmOutput = await fetchRequest(endpoint, prompt, model);
			logger.info('[mention] Received output from API.');

			// Split the output into message chunks if needed
			const messages = splitMessage(llmOutput, 2000);
			logger.debug(`[mention] Original Output length: ${llmOutput.length}`);
			logger.debug(`[mention] Array length after split: ${messages.length}`);
			messages.forEach((msg, i) => logger.debug(`[mention] Message ${i + 1} length: ${msg.length}`));

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
			logger.error('[mention] Error processing mention:', error);
			await message.reply({
				content: 'Sorry, I encountered an error while processing your request. Please try again later.',
				allowedMentions: { parse: [] }
			});
		}
	},
};
