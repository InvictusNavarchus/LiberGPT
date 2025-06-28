/**
 * Sends a POST request to the AI endpoint and returns the AI response content
 * @param {string} endpoint - The API endpoint URL
 * @param {string} prompt - The user's prompt to send to the AI
 * @param {string} model - The AI model to use ('copilot' or 'blackbox')
 * @returns {Promise<string>} The AI response content or error message
 */
import logger from './logger.js';

/**
 * Generates a random ID for blackbox messages
 * @returns {string} A random alphanumeric ID
 */
function generateRandomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default async function fetchRequest(endpoint, prompt, model) {
    try {
        let requestBody;
        
        if (model === 'blackbox') {
            // Blackbox API format
            requestBody = {
                mode: "realtime",
                stream: "false",
                messages: [
                    {
                        id: generateRandomId(),
                        role: "system",
                        content: "You are LiberGPT. A helpful Assistant"
                    },
                    {
                        id: generateRandomId(),
                        role: "user",
                        content: prompt
                    }
                ]
            };
        } else {
            // Copilot API format
            requestBody = {
                stream: "false",
                messages: [
                    {
                        role: "system",
                        content: "You are LiberGPT. A helpful Assistant"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            };
        }
        
        logger.info(`[fetchRequest] Sending POST request to: ${endpoint}`);
        logger.debug(`[fetchRequest] Request body: ${JSON.stringify(requestBody, null, 2)}`);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
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
            logger.debug(`[fetchRequest] Full response: ${JSON.stringify(responseJson, null, 2)}`);
            return "Unexpected response format: 'content' key not found.";
        }
    } catch (error) {
        logger.error(`[fetchRequest] Error occurred: ${error.message}`, { error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2) });
        return `An error occurred: ${error.message}`;
    }
}