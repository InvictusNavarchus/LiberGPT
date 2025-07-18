import { SlashCommandBuilder } from 'discord.js';
import logger from '../../helpers/logger.js';
import splitMessage from '../../helpers/splitMessage.js';
import fetchRequest from '../../helpers/fetchRequest.js';
import { replyOrEdit } from '../../helpers/safeReply.js';
import memoryManager from '../../helpers/memoryManager.js';

const endpoints = {
    copilot: 'https://api.zpi.my.id/v1/ai/copilot',
    blackbox: 'https://api.zpi.my.id/v1/ai/blackbox'
};

export default {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask LiberGPT anything')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The content of your request')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('model')
                .setDescription('LLM Model to use')
                .setRequired(false)
                .addChoices(
                    { name: 'copilot', value: 'copilot' },
                    { name: 'blackbox', value: 'blackbox' },
                )),

    /**
     * Executes the ask command to interact with AI models
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - The Discord interaction
     */
    async execute(interaction) {
        const prompt = interaction.options.getString('prompt');
        const model = interaction.options.getString('model') ?? 'copilot';
        const apiEndpoint = endpoints[model];
        const channelId = interaction.channel.id;
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const userMessageTimestamp = new Date(); // Store timestamp when user initiated the request

        // Add user message to memory
        try {
            memoryManager.addMessage(channelId, userId, username, prompt, 'user', userMessageTimestamp);
        } catch (error) {
            logger.error(`[ask] Error adding user message to memory: ${error.message}`, error);
        }
        
        // Get memory context for this channel
        let memoryContext = '';
        try {
            // Get max context length from environment variable with validation
            const maxContextLengthEnv = parseInt(process.env.MAX_TOTAL_INPUT_LENGTH);
            const maxContextLength = (maxContextLengthEnv && maxContextLengthEnv > 0 && maxContextLengthEnv <= 10000) ? maxContextLengthEnv : 4000;
            
            memoryContext = memoryManager.formatMemoryContext(channelId, maxContextLength);
        } catch (error) {
            logger.error(`[ask] Error formatting memory context: ${error.message}`, error);
            // Continue without memory context
        }

        logger.info(`[ask] Calling API: ${apiEndpoint}, Model: ${model}, Prompt length: ${prompt.length}, Memory context length: ${memoryContext.length}`);
        const llmOutput = await fetchRequest(apiEndpoint, prompt, model, memoryContext);
        logger.info('[ask] Received output from API.');

        // Add bot response to memory with timestamp based on user message time
        try {
            // Bot response should be timestamped just after the user message for chronological order
            const botResponseTimestamp = new Date(userMessageTimestamp.getTime() + 1); // +1ms after user message
            memoryManager.addMessage(channelId, interaction.client.user.id, interaction.client.user.username, llmOutput, 'assistant', botResponseTimestamp);
        } catch (error) {
            logger.error(`[ask] Error adding bot response to memory: ${error.message}`, error);
            // Continue without storing the response
        }

        // Split the output into message chunks if needed.
        const messages = splitMessage(llmOutput, 2000);
        // debug message content length and the length of each message
        logger.debug(`[ask] Original Output length: ${llmOutput.length}`);
        logger.debug(`[ask] Array length after split: ${messages.length}`);
        messages.forEach((msg, i) => logger.debug(`[ask] Message ${i + 1} length: ${msg.length}`));

        // Use replyOrEdit to handle the first chunk appropriately based on interaction state
        await replyOrEdit(interaction, messages.shift());

        if (messages.length === 0) { return }
        // ... and then send any additional chunks as follow-ups.
        for (const msg of messages) {
            await interaction.followUp(msg);
        }
    },
};
