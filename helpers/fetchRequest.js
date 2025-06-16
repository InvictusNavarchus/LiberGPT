/**
 * Sends a GET request to the AI endpoint and returns the AI response content
 * @param {string} endpoint - The base API endpoint URL
 * @param {string} prompt - The user's prompt to send to the AI
 * @param {string} model - The AI model to use ('copilot' or 'blackbox')
 * @returns {Promise<string>} The AI response content or error message
 */
import logger from './logger.js';

export default async function fetchRequest(endpoint, prompt, model) {
    try {
        const encodedPrompt = encodeURIComponent(prompt);
        let fullUrl;

        if (model === 'blackbox') {
            // Blackbox requires additional parameters
            const encodedSystemPrompt = encodeURIComponent("You are LiberGPT. A helpful Assistant");
            fullUrl = `${endpoint}?text_prompt=${encodedPrompt}&system_prompt=${encodedSystemPrompt}&search_mode=false&think_mode=false`;
        } else {
            // Copilot endpoint
            fullUrl = `${endpoint}?text=${encodedPrompt}`;
        }
        
        // Use CORS proxy to bypass connection issues
        const proxiedUrl = `https://cors.fadel.web.id/${fullUrl}`;
        
        logger.info(`[fetchRequest] Sending GET request to: ${proxiedUrl}`);

        const response = await fetch(proxiedUrl, { method: "GET" });
        logger.info(`[fetchRequest] HTTP Response Details: Status Code: ${response.status}, Status Text: ${response.statusText}`);

        if (!response.ok) {
            logger.error(`[fetchRequest] HTTP Error Details: Status Code: ${response.status}, Status Text: ${response.statusText}`);
            
            let errorResponse;
            try {
                errorResponse = await response.json();
                logger.error(`[fetchRequest] Response Body: ${JSON.stringify(errorResponse, null, 2)}`);
            } catch (parseError) {
                const textResponse = await response.text();
                logger.error(`[fetchRequest] Response Body (text): ${textResponse}`);
                errorResponse = { error: textResponse };
            }
            
            throw new Error(`HTTP ${response.status} ${response.statusText}: ${JSON.stringify(errorResponse)}`);
        }

        const responseJson = await response.json();

        if (responseJson.code === 200 && responseJson.response && responseJson.response.content) {
            logger.info(`[fetchRequest] Successfully retrieved content from ${model} response.`);
            
            let content = responseJson.response.content;
            
            // Special handling for blackbox model - include references if available
            if (model === 'blackbox' && responseJson.response.reference && responseJson.response.reference.length > 0) {
                logger.info(`[fetchRequest] Found ${responseJson.response.reference.length} references from blackbox model.`);
                
                const references = responseJson.response.reference
                    .map((ref, index) => `${index + 1}. [${ref.title}](${ref.link})`)
                    .join('\n');
                
                content += '\n\n**References:**\n' + references;
            }
            
            return content;
        } else {
            logger.warn('[fetchRequest] Unexpected response format: "content" key not found.');
            return "Unexpected response format: 'content' key not found.";
        }
    } catch (error) {
        logger.error(`[fetchRequest] Error occurred: ${error.message}`, { error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2) });
        return `An error occurred: ${error.message}`;
    }
}