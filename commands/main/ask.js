import { SlashCommandBuilder } from 'discord.js';
import splitMessage from '../../helpers/splitMessage.js';
import fetchRequest from '../../helpers/fetchRequest.js';

const baseEndpoint = 'https://api.zpi.my.id/v1/ai/copilot';

export default {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask LiberGPT anything using Copilot AI')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The content of your request')
                .setRequired(true)),

    async execute(interaction) {
        const prompt = interaction.options.getString('prompt');
        const apiEndpoint = baseEndpoint;

        // Defer the reply since the API call might take some time.
        await interaction.deferReply();

        console.log(`🔍 [ask] Calling API endpoint: ${apiEndpoint} with prompt length: ${prompt.length}`);
        const llmOutput = await fetchRequest(apiEndpoint, prompt);
        console.log('📥 [ask] Received output from API.');

        // Split the output into message chunks if needed.
        const messages = splitMessage(llmOutput, 2000);
        // debug message content length and the length of each message
        console.log(`🧩 [ask] Original Output length: ${llmOutput.length}`);
        console.log(`📏 [ask] Array length after split: ${messages.length}`);
        messages.forEach((msg, i) => console.log(`📝 [ask] Message ${i + 1} length: ${msg.length}`));


        // Option 1: You can edit the deferred reply with the first chunk...
        await interaction.editReply(messages.shift());

        if (messages.length === 0) { return }
        // ... and then send any additional chunks as follow-ups.
        for (const msg of messages) {
            await interaction.followUp(msg);
        }
    },
};
