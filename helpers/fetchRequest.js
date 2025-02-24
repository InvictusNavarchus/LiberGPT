export default async function fetchRequest(endpoint, prompt) {
    const body = {
        messages: [
            {
                role: "system",
                content: "You are LiberGPT"
            },
            {
                role: "user",
                content: prompt
            }
        ]
    };

    try {
        console.log(`🚀 [fetchRequest] Sending request to: ${endpoint}`);
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        console.log(`✅ [fetchRequest] Received response with status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseJson = await response.json();

        if (responseJson.data && responseJson.data.choices) {
            console.log('🎉 [fetchRequest] Successfully retrieved choices from response.');
            return responseJson.data.choices.content;
        } else {
            console.log('⚠️ [fetchRequest] Unexpected response format: "choices" key not found.');
            return "Unexpected response format: 'choices' key not found.";
        }
    } catch (error) {
        console.log(`❌ [fetchRequest] Error: ${error.message}`);
        return `An error occurred: ${error.message}`;
    }
}