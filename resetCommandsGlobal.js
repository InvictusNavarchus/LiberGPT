require('dotenv').config()
const { REST, Routes } = require('discord.js');
const { APPLICATION_ID, GUILD_ID, TOKEN } = process.env

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started globally resetting application (/) commands on ALL guild`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(APPLICATION_ID),
			{ body: [] },
		);

		console.log(`Successfully reseted ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();