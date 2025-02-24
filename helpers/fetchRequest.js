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
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseJson = await response.json();

        if (responseJson.data && responseJson.data.choices) {
            return responseJson.data.choices.content;
        } else {
            return "Unexpected response format: 'choices' key not found.";
        }
    } catch (error) {
        return `An error occurred: ${error.message}`;
    }
}