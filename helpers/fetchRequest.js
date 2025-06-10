/**
 * Sends a GET request to the Copilot AI endpoint and returns the AI response content
 * @param {string} endpoint - The base API endpoint URL
 * @param {string} prompt - The user's prompt to send to the AI
 * @returns {Promise<string>} The AI response content or error message
 */
export default async function fetchRequest(endpoint, prompt) {
    try {
        // Encode the prompt for URL parameter
        const encodedPrompt = encodeURIComponent(prompt);
        const fullUrl = `${endpoint}?text=${encodedPrompt}`;
        
        console.log(`🚀 [fetchRequest] Sending GET request to: ${fullUrl}`);

        const response = await fetch(fullUrl, { method: "GET" });
        console.log(`✅ [fetchRequest] Received response with status: ${response.status}`);

        if (!response.ok) {
            const errorResponse = await response.json();
            const errorObject = JSON.stringify(errorResponse, null, 2);
            throw new Error(`HTTP error! Error object: ${errorObject}`);
        }

        const responseJson = await response.json();

        if (responseJson.code === 200 && responseJson.response && responseJson.response.content) {
            console.log('🎉 [fetchRequest] Successfully retrieved content from Copilot response.');
            return responseJson.response.content;
        } else {
            console.log('⚠️ [fetchRequest] Unexpected response format: "content" key not found.');
            return "Unexpected response format: 'content' key not found.";
        }
    } catch (error) {
        console.log(`❌ [fetchRequest] Error: ${error.message}`);
        return `An error occurred: ${error.message}`;
    }
}