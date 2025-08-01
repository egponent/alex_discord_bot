// This script registers commands GLOBALLY.
// Global commands can take up to an hour to appear in all servers.

const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json'); // guildId is not needed for global deployment
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Grab all the command folders from the commands directory
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy the commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands for GLOBAL deployment.`);

		// The put method is used to fully refresh all commands across all servers
		const data = await rest.put(
			// Use applicationCommands instead of applicationGuildCommands
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
	} catch (error) {
		console.error(error);
	}
})();
