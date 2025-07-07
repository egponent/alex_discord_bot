// Command file: commands/utility/bless-us.js
// This command makes the bot join a voice channel and play an MP3 file.

const { SlashCommandBuilder } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus } = require('@discordjs/voice');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bless-us')
        .setDescription('Blesses you with a tune!'),
    async execute(interaction) {
        // 1. Get the voice channel of the user who sent the command
        const voiceChannel = interaction.member.voice.channel;

        // 2. Check if the user is in a voice channel
        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
        }

        // Defer reply as joining and playing might take a moment
        await interaction.deferReply();

        try {
            // 3. Join the voice channel
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            // 4. Create an audio player
            const player = createAudioPlayer({
                behaviors: {
                    // Don't do anything when there are no active subscribers
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });

            // 5. Create an audio resource from your MP3 file
            // IMPORTANT: Create a 'sounds' folder in your project's root directory
            // and place your mp3 file (e.g., 'blessing.mp3') inside it.
            const resource = createAudioResource(path.join(__dirname, '../../sounds/blessing.mp3'));

            // 6. Subscribe the connection to the player
            connection.subscribe(player);

            // 7. Play the resource
            player.play(resource);

            // 8. Listen for the player to finish
            player.on('stateChange', (oldState, newState) => {
                // When the song is finished (idle state), destroy the connection
                if (newState.status === 'idle') {
                    // Use a small delay to prevent abrupt disconnection
                    setTimeout(() => {
                        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                           connection.destroy();
                        }
                    }, 1000);
                }
            });

            // Handle connection errors
            connection.on('error', error => {
                console.error(`Voice connection error: ${error.message}`);
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }
            });

            // Handle player errors
            player.on('error', error => {
                console.error(`Error: ${error.message} with resource`);
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }
            });


            await interaction.editReply('Playing a blessing for you!');

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'There was an error trying to play the audio!', ephemeral: true });
        }
    },
};