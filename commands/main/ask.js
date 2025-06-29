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

        // Add user message to memory
        try {
            memoryManager.addMessage(channelId, userId, username, prompt, 'user');
        } catch (error) {
            logger.error(`[ask] Error adding user message to memory: ${error.message}`, error);
        }
        
        // Get memory context for this channel
        let memoryContext = '';
        try {
            memoryContext = memoryManager.formatMemoryContext(channelId, 1500);
        } catch (error) {
            logger.error(`[ask] Error formatting memory context: ${error.message}`, error);
            // Continue without memory context
        }

        logger.info(`[ask] Calling API: ${apiEndpoint}, Model: ${model}, Prompt length: ${prompt.length}, Memory context length: ${memoryContext.length}`);
        const llmOutput = await fetchRequest(apiEndpoint, prompt, model, memoryContext);
        logger.info('[ask] Received output from API.');

        // Add bot response to memory
        try {
            memoryManager.addMessage(channelId, interaction.client.user.id, interaction.client.user.username, llmOutput, 'assistant');
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
