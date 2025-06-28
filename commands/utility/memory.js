import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import logger from '../../helpers/logger.js';
import memoryManager from '../../helpers/memoryManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('memory')
        .setDescription('Manage bot memory')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Show memory statistics for this channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear memory for this channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Show recent memory for this channel')),

    /**
     * Executes the memory command to manage bot memory
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - The Discord interaction
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const channelId = interaction.channel.id;

        try {
            switch (subcommand) {
                case 'stats': {
                    const stats = memoryManager.getMemoryStats();
                    const channelStats = stats.channels[channelId];
                    
                    let response = `**Memory Statistics**\n`;
                    response += `Memory Limit: ${stats.memoryLimit} messages per channel\n`;
                    response += `Total Active Channels: ${stats.totalChannels}\n\n`;
                    
                    if (channelStats) {
                        response += `**This Channel:**\n`;
                        response += `Messages Stored: ${channelStats.messageCount}\n`;
                        response += `Oldest Message: ${channelStats.oldestMessage ? new Date(channelStats.oldestMessage).toLocaleString() : 'None'}\n`;
                        response += `Newest Message: ${channelStats.newestMessage ? new Date(channelStats.newestMessage).toLocaleString() : 'None'}`;
                    } else {
                        response += `**This Channel:** No messages stored`;
                    }
                    
                    await interaction.reply({
                        content: response,
                        ephemeral: true
                    });
                    break;
                }

                case 'clear': {
                    memoryManager.clearChannelMemory(channelId);
                    await interaction.reply({
                        content: '✅ Memory cleared for this channel.',
                        ephemeral: true
                    });
                    logger.info(`[memory] User ${interaction.user.tag} cleared memory for channel ${channelId}`);
                    break;
                }

                case 'show': {
                    const memory = memoryManager.getChannelMemory(channelId);
                    
                    if (memory.length === 0) {
                        await interaction.reply({
                            content: 'No messages stored in memory for this channel.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    let response = `**Recent Memory (${memory.length} messages):**\n\`\`\`\n`;
                    
                    // Show last 10 messages to avoid hitting Discord's character limit
                    const recentMessages = memory.slice(-10);
                    
                    for (const msg of recentMessages) {
                        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
                        const truncatedContent = msg.content.length > 100 
                            ? msg.content.substring(0, 100) + '...' 
                            : msg.content;
                        response += `[${timestamp}] ${msg.username} (${msg.role}): ${truncatedContent}\n`;
                    }
                    
                    response += '```';
                    
                    // If response is too long, truncate it
                    if (response.length > 1900) {
                        response = response.substring(0, 1897) + '...```';
                    }
                    
                    await interaction.reply({
                        content: response,
                        ephemeral: true
                    });
                    break;
                }

                default:
                    await interaction.reply({
                        content: 'Unknown subcommand.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            logger.error(`[memory] Error executing memory command: ${error.message}`, error);
            await interaction.reply({
                content: 'An error occurred while processing the memory command.',
                ephemeral: true
            });
        }
    },
};
