/**
 * Memory Manager for Discord Bot
 * Manages chat history per channel with configurable memory limits
 */
import logger from './logger.js';

class MemoryManager {
    constructor() {
        // Store memory per channel: channelId -> array of messages
        this.channelMemories = new Map();
        // Get memory limit from environment variable, default to 10
        this.memoryLimit = parseInt(process.env.MEMORY_LIMIT) || 10;
        // Get cleanup interval from environment variable (in hours), default to 1 hour
        this.cleanupIntervalHours = parseInt(process.env.MEMORY_CLEANUP_INTERVAL_HOURS) || 1;
        
        logger.info(`[MemoryManager] Initialized with memory limit: ${this.memoryLimit}, cleanup interval: ${this.cleanupIntervalHours} hours`);
    }

    /**
     * Adds a message to the channel's memory
     * @param {string} channelId - The Discord channel ID
     * @param {string} userId - The Discord user ID
     * @param {string} username - The Discord username
     * @param {string} content - The message content
     * @param {string} role - The role of the message ('user', 'assistant', 'system')
     * @param {Date} timestamp - When the message was sent
     */
    addMessage(channelId, userId, username, content, role = 'user', timestamp = new Date()) {
        if (!this.channelMemories.has(channelId)) {
            this.channelMemories.set(channelId, []);
        }

        const memory = this.channelMemories.get(channelId);
        const messageEntry = {
            userId,
            username,
            content: content.substring(0, 1000), // Limit content length to prevent memory bloat
            role,
            timestamp: timestamp.toISOString()
        };

        memory.push(messageEntry);

        // Maintain memory limit by removing oldest messages
        while (memory.length > this.memoryLimit) {
            const removed = memory.shift();
            logger.debug(`[MemoryManager] Removed old message from ${removed.username} in channel ${channelId}`);
        }

        logger.debug(`[MemoryManager] Added message from ${username} to channel ${channelId}. Memory size: ${memory.length}`);
    }

    /**
     * Gets the memory context for a channel
     * @param {string} channelId - The Discord channel ID
     * @returns {Array} Array of message objects in chronological order
     */
    getChannelMemory(channelId) {
        const memory = this.channelMemories.get(channelId) || [];
        logger.debug(`[MemoryManager] Retrieved ${memory.length} messages for channel ${channelId}`);
        return [...memory]; // Return a copy to prevent external modifications
    }

    /**
     * Formats the channel memory into a context string for AI
     * @param {string} channelId - The Discord channel ID
     * @param {number} maxContextLength - Maximum length of context string (default: 2000)
     * @returns {string} Formatted context string
     */
    formatMemoryContext(channelId, maxContextLength = 2000) {
        const memory = this.getChannelMemory(channelId);
        
        if (memory.length === 0) {
            return '';
        }

        let context = '[Recent conversation history]\n';
        let totalLength = context.length;
        
        // Build context from most recent messages, working backwards
        const contextMessages = [];
        
        for (let i = memory.length - 1; i >= 0; i--) {
            const msg = memory[i];
            const messageStr = `${msg.username} (${msg.role}): ${msg.content}\n`;
            
            // Check if adding this message would exceed the limit
            if (totalLength + messageStr.length > maxContextLength) {
                break;
            }
            
            contextMessages.unshift(messageStr);
            totalLength += messageStr.length;
        }
        
        if (contextMessages.length === 0) {
            return '';
        }
        
        context += contextMessages.join('');
        context += '[End of conversation history]\n\n';
        
        logger.debug(`[MemoryManager] Generated context of ${context.length} characters from ${contextMessages.length} messages for channel ${channelId}`);
        return context;
    }

    /**
     * Clears memory for a specific channel
     * @param {string} channelId - The Discord channel ID
     */
    clearChannelMemory(channelId) {
        const hadMemory = this.channelMemories.has(channelId);
        this.channelMemories.delete(channelId);
        
        if (hadMemory) {
            logger.info(`[MemoryManager] Cleared memory for channel ${channelId}`);
        }
    }

    /**
     * Gets memory statistics
     * @returns {Object} Object containing memory statistics
     */
    getMemoryStats() {
        const stats = {
            totalChannels: this.channelMemories.size,
            memoryLimit: this.memoryLimit,
            channels: {}
        };

        for (const [channelId, memory] of this.channelMemories.entries()) {
            stats.channels[channelId] = {
                messageCount: memory.length,
                oldestMessage: memory.length > 0 ? memory[0].timestamp : null,
                newestMessage: memory.length > 0 ? memory[memory.length - 1].timestamp : null
            };
        }

        return stats;
    }

    /**
     * Cleanup old memories to prevent memory leaks
     * Removes channels that haven't been active for more than 24 hours
     */
    cleanup() {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        let cleanedChannels = 0;

        for (const [channelId, memory] of this.channelMemories.entries()) {
            if (memory.length === 0) {
                this.channelMemories.delete(channelId);
                cleanedChannels++;
                continue;
            }

            // Check if the newest message is older than cutoff
            const newestMessage = memory[memory.length - 1];
            const messageTime = new Date(newestMessage.timestamp);
            
            if (messageTime < cutoffTime) {
                this.channelMemories.delete(channelId);
                cleanedChannels++;
            }
        }

        if (cleanedChannels > 0) {
            logger.info(`[MemoryManager] Cleaned up ${cleanedChannels} inactive channels`);
        }
    }
}

// Create and export a singleton instance
const memoryManager = new MemoryManager();

// Set up periodic cleanup using configurable interval
const cleanupIntervalMs = memoryManager.cleanupIntervalHours * 60 * 60 * 1000;
setInterval(() => {
    memoryManager.cleanup();
}, cleanupIntervalMs);

export default memoryManager;
