/**
 * Memory Manager for Discord Bot
 * Manages chat history per channel with configurable memory limits
 */
import logger from './logger.js';

class MemoryManager {
    constructor() {
        // Store memory per channel: channelId -> array of messages
        this.channelMemories = new Map();
        // Store cleanup timers per channel: channelId -> timeout
        this.cleanupTimers = new Map();
        
        // Get memory limit from environment variable with validation
        const memoryLimitEnv = parseInt(process.env.MEMORY_LIMIT);
        this.memoryLimit = (memoryLimitEnv && memoryLimitEnv > 0 && memoryLimitEnv <= 100) ? memoryLimitEnv : 20;
        
        // Get cleanup interval from environment variable with validation (in hours)
        const cleanupIntervalEnv = parseFloat(process.env.MEMORY_CLEANUP_INTERVAL_HOURS);
        this.cleanupIntervalHours = (cleanupIntervalEnv && cleanupIntervalEnv > 0 && cleanupIntervalEnv <= 168) ? cleanupIntervalEnv : 1;
        
        logger.info(`[MemoryManager] Initialized with memory limit: ${this.memoryLimit}, cleanup interval: ${this.cleanupIntervalHours} hours`);
    }

    /**
     * Converts hours to milliseconds
     * @param {number} hours - Number of hours to convert
     * @returns {number} Equivalent milliseconds
     */
    hoursToMs(hours) {
        return hours * 60 * 60 * 1000;
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
        try {
            // Validate inputs
            if (!channelId || !userId || !username || content === undefined || content === null) {
                logger.warn(`[MemoryManager] Invalid parameters for addMessage: channelId=${channelId}, userId=${userId}, username=${username}, content=${typeof content}`);
                return;
            }

            if (!this.channelMemories.has(channelId)) {
                this.channelMemories.set(channelId, []);
            }

            const memory = this.channelMemories.get(channelId);
            const messageEntry = {
                userId,
                username,
                content: String(content).substring(0, 1000), // Limit content length to prevent memory bloat
                role,
                timestamp: timestamp.toISOString()
            };

            memory.push(messageEntry);

            // Maintain memory limit by removing oldest messages
            while (memory.length > this.memoryLimit) {
                const removed = memory.shift();
                logger.debug(`[MemoryManager] Removed old message from ${removed.username} in channel ${channelId}`);
            }

            // Reset cleanup timer for this channel
            this.resetCleanupTimer(channelId);

            logger.debug(`[MemoryManager] Added message from ${username} to channel ${channelId}. Memory size: ${memory.length}`);
        } catch (error) {
            logger.error(`[MemoryManager] Error adding message to channel ${channelId}: ${error.message}`, error);
        }
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
        try {
            // Validate inputs
            if (!channelId) {
                logger.warn(`[MemoryManager] Invalid channelId for formatMemoryContext: ${channelId}`);
                return '';
            }

            const memory = this.getChannelMemory(channelId);
            
            if (memory.length === 0) {
                return '';
            }

            const header = '[Recent conversation history]\n';
            const footer = '[End of conversation history]\n\n';
            let totalLength = header.length + footer.length;
            
            // Build context from most recent messages, working backwards
            const validMessages = [];
            let messageCount = 0;
            
            for (let i = memory.length - 1; i >= 0; i--) {
                const msg = memory[i];
                if (!msg || !msg.username || !msg.content) {
                    continue; // Skip malformed messages
                }
                
                const messageStr = `${msg.username} (${msg.role || 'user'}): ${msg.content}\n`;
                
                // Check if adding this message would exceed the limit
                if (totalLength + messageStr.length > maxContextLength) {
                    break;
                }
                
                validMessages.push(messageStr);
                totalLength += messageStr.length;
                messageCount++;
            }
            
            if (validMessages.length === 0) {
                return '';
            }
            
            // Reverse the messages to get chronological order and build final context
            const context = header + validMessages.reverse().join('') + footer;
            
            logger.debug(`[MemoryManager] Generated context of ${context.length} characters from ${messageCount} messages for channel ${channelId}`);
            return context;
        } catch (error) {
            logger.error(`[MemoryManager] Error formatting memory context for channel ${channelId}: ${error.message}`, error);
            return ''; // Return empty string on error to allow AI request to continue
        }
    }

    /**
     * Clears memory for a specific channel
     * @param {string} channelId - The Discord channel ID
     */
    clearChannelMemory(channelId) {
        const hadMemory = this.channelMemories.has(channelId);
        this.channelMemories.delete(channelId);
        
        // Clear cleanup timer for this channel
        if (this.cleanupTimers.has(channelId)) {
            clearTimeout(this.cleanupTimers.get(channelId));
            this.cleanupTimers.delete(channelId);
        }
        
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
     * Removes channels that haven't been active for more than the configured cleanup interval
     */
    cleanup() {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - this.hoursToMs(this.cleanupIntervalHours));
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

    /**
     * Resets the cleanup timer for a specific channel
     * @param {string} channelId - The Discord channel ID
     */
    resetCleanupTimer(channelId) {
        // Clear existing timer if it exists
        if (this.cleanupTimers.has(channelId)) {
            clearTimeout(this.cleanupTimers.get(channelId));
        }

        // Set new timer for this channel
        const cleanupTimeoutMs = this.hoursToMs(this.cleanupIntervalHours);
        const timer = setTimeout(() => {
            try {
                // Check if the timer is still registered and channel still has memory
                if (this.cleanupTimers.has(channelId) && this.channelMemories.has(channelId)) {
                    logger.info(`[MemoryManager] Cleaning up inactive channel ${channelId} after ${this.cleanupIntervalHours} hours of inactivity`);
                    this.clearChannelMemory(channelId);
                } else {
                    logger.debug(`[MemoryManager] Timer callback executed for channel ${channelId}, but channel was already cleaned up`);
                }
            } catch (error) {
                logger.error(`[MemoryManager] Error in cleanup timer callback for channel ${channelId}: ${error.message}`, error);
            }
        }, cleanupTimeoutMs);

        this.cleanupTimers.set(channelId, timer);
        logger.debug(`[MemoryManager] Reset cleanup timer for channel ${channelId} (${this.cleanupIntervalHours} hours)`);
    }
}

// Create and export a singleton instance
const memoryManager = new MemoryManager();

export default memoryManager;
