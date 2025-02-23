// Utility function to split a message into chunks that respect Discord's 2000 character limit.
export default function splitMessage(text, maxLength = 2000) {
    // If the text is already within the limit, return it as an array with one element.
    if (text.length <= maxLength) return [text];

    // Split by newline to try to keep the message structure intact.
    const lines = text.split('\n');
    const messages = [];
    let currentMessage = '';

    for (const line of lines) {
        // Check if adding this line would exceed the limit (add 1 for the newline character).
        if (currentMessage.length + line.length + 1 > maxLength) {
            // If the line itself is too long to fit even on its own, break it into smaller pieces.
            if (line.length > maxLength) {
                // Push the current message if there's content.
                if (currentMessage.length > 0) {
                    messages.push(currentMessage);
                    currentMessage = '';
                }
                // Slice the long line into chunks of maxLength.
                for (let i = 0; i < line.length; i += maxLength) {
                    messages.push(line.substring(i, i + maxLength));
                }
            } else {
                // Otherwise, push the current message and start a new one with the current line.
                messages.push(currentMessage);
                currentMessage = line;
            }
        } else {
            // Append the line. Add a newline if currentMessage is not empty.
            currentMessage += currentMessage ? '\n' + line : line;
        }
    }
    // If there's any text left, push it as well.
    if (currentMessage.length > 0) messages.push(currentMessage);

    return messages;
}