const { SlashCommandBuilder } = require('discord.js');
const baseEndpoint = 'https://api.zpi.my.id/v1/ai/'

async function fetchRequest(endpoint, prompt) {
    const body = {
        messages: [
          {
            role: "system",
            content: "You are LiberGPT"
          },
          {
            role: "user",
            content: prompt
          }
        ]
      };

    try {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseJson = await response.json();

    if (responseJson.data && responseJson.data.choices) {
        return responseJson.data.choices.content;
    } else {
        return "Unexpected response format: 'choices' key not found.";
    }
    } catch (error) {
        return `An error occurred: ${error.message}`;
    }
}

module.exports = {
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
        await interaction.deferReply()
        const llmOutput = await fetchRequest(apiEndpoint, prompt);
        await interaction.followUp(llmOutput)
	},
};