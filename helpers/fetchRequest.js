/**
 * Sends a GET request to the AI endpoint and returns the AI response content
 * @param {string} endpoint - The base API endpoint URL
 * @param {string} prompt - The user's prompt to send to the AI
 * @param {string} model - The AI model to use ('copilot' or 'blackbox')
 * @returns {Promise<string>} The AI response content or error message
 */
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
        
        console.log(`🚀 [fetchRequest] Sending GET request to: ${proxiedUrl}`);

        const response = await fetch(proxiedUrl, { method: "GET" });
        console.log(`✅ [fetchRequest] HTTP Response Details:`);
        console.log(`   - Status Code: ${response.status}`);
        console.log(`   - Status Text: ${response.statusText}`);

        if (!response.ok) {
            console.log(`❌ [fetchRequest] HTTP Error Details:`);
            console.log(`   - Status Code: ${response.status}`);
            console.log(`   - Status Text: ${response.statusText}`);
            
            let errorResponse;
            try {
                errorResponse = await response.json();
                console.log(`   - Response Body: ${JSON.stringify(errorResponse, null, 2)}`);
            } catch (parseError) {
                const textResponse = await response.text();
                console.log(`   - Response Body (text): ${textResponse}`);
                errorResponse = { error: textResponse };
            }
            
            throw new Error(`HTTP ${response.status} ${response.statusText}: ${JSON.stringify(errorResponse)}`);
        }

        const responseJson = await response.json();

        if (responseJson.code === 200 && responseJson.response && responseJson.response.content) {
            console.log(`🎉 [fetchRequest] Successfully retrieved content from ${model} response.`);
            return responseJson.response.content;
        } else {
            console.log('⚠️ [fetchRequest] Unexpected response format: "content" key not found.');
            return "Unexpected response format: 'content' key not found.";
        }
    } catch (error) {
        console.log(`❌ [fetchRequest] Error occurred:`);
        console.log(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        return `An error occurred: ${error.message}`;
    }
}