/**
 * Safely handles Discord interactions with built-in error handling for expired interactions
 * @param {import('discord.js').Interaction} interaction - The Discord interaction to handle
 * @param {Function} handler - Async function that handles the interaction
 * @param {Object} options - Options for handling the interaction
 * @param {boolean} options.deferReply - Whether to defer the reply before executing handler
 * @param {boolean} options.ephemeral - Whether the reply should be ephemeral
 */
import logger from './logger.js';

async function safeReply(interaction, handler, options = {}) {
  const { deferReply = false, ephemeral = false } = options;
  
  try {
    // If deferReply is true, try to defer the reply first
    if (deferReply && !interaction.replied && !interaction.deferred) {
      try {
        // Set a timeout to avoid getting stuck on network issues
        const deferPromise = interaction.deferReply({ ephemeral });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Defer reply timeout')), 2500)
        );
        
        await Promise.race([deferPromise, timeoutPromise]);
        logger.info(`Successfully deferred interaction ${interaction.id}`);
      } catch (deferError) {
        // If we can't defer, the interaction likely expired or network issue occurred
        if (deferError.code === 10062) {
          logger.warn(`Interaction ${interaction.id} expired before deferring`);
          return false;
        }
        
        // Handle network errors gracefully
        if (deferError.code === 'EAI_AGAIN' || deferError.message === 'Defer reply timeout') {
          logger.warn(`Network issue while deferring interaction ${interaction.id}: ${deferError.message}`);
          return false;
        }
        
        logger.error(`Unknown error while deferring interaction: ${deferError.message}`);
        return false;
      }
    }

    // Execute the handler function without timeout to preserve Discord's thinking indicator
    try {
      await handler();
      return true;
    } catch (handlerError) {
      // Handle network errors in the command execution
      if (handlerError.code === 'EAI_AGAIN') {
        logger.error(`Network error during command execution: ${handlerError.message}`);
        
        // Try to notify the user if the connection is back
        try {
          if (interaction.deferred && !interaction.replied) {
            await replyOrEdit(interaction, { content: "Network connectivity issue. Please try again later." });
          }
        } catch (notifyError) {
          logger.warn(`Couldn't notify user of network error: ${notifyError.message}`);
        }
        
        return false;
      }
      
      // Re-throw other errors to be caught by the outer try/catch
      throw handlerError;
    }
  } catch (error) {
    // Handle expired interactions gracefully
    if (error.code === 10062) {
      logger.warn(`Interaction ${interaction.id} expired during handling`);
      return false;
    }
    
    // For other errors, try to report them if possible
    logger.error(`Error handling interaction: ${error.message}`, { error });
    
    try {
      const errorMessage = 'There was an error while executing this command!';
      await replyOrEdit(interaction, { content: errorMessage, ephemeral: true });
    } catch (replyError) {
      // If we can't reply, just log it - nothing more we can do
      logger.error(`Failed to send error response: ${replyError.message}`, { error: replyError });
    }
    
    return false;
  }
}

/**
 * Replies to an interaction appropriately based on its state (deferred or replied)
 * @param {import('discord.js').Interaction} interaction - The Discord interaction
 * @param {string|import('discord.js').InteractionReplyOptions} content - Content to send
 * @returns {Promise<import('discord.js').Message|import('discord.js').InteractionResponse>}
 */
export function replyOrEdit(interaction, content) {
  return interaction.replied || interaction.deferred
    ? interaction.editReply(content)
    : interaction.reply(content);
}

export default safeReply;
