import { SlashCommandBuilder } from 'discord.js';
import splitMessage from '../../helpers/splitMessage.js';
import fetchRequest from '../../helpers/fetchRequest.js';

const baseEndpoint = 'https://api.zpi.my.id/v1/ai/';

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
                    { name: 'gpt-4o', value: 'gpt-4o' },
                    { name: 'grok-2', value: 'grok-2' },
                    { name: 'claude-3-sonnet', value: 'claude-3-sonnet' },
                )),

    async execute(interaction) {
        const prompt = interaction.options.getString('prompt');
        const model = interaction.options.getString('model') ?? 'gpt-4o';
        const apiEndpoint = baseEndpoint + model;

        // Defer the reply since the API call might take some time.
        await interaction.deferReply();

        // Get the long response from the LLM API.
        const llmOutput = await fetchRequest(apiEndpoint, prompt);

        // Split the output into message chunks if needed.
        const messages = splitMessage(llmOutput, 2000);

        // Option 1: You can edit the deferred reply with the first chunk...
        await interaction.editReply(messages.shift());

        if (messages.length === 0) { return }
        // ... and then send any additional chunks as follow-ups.
        for (const msg of messages) {
            await interaction.followUp(msg);
        }
    },
};
