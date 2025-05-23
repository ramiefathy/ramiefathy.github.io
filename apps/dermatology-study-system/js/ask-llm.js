/**
 * Sends a question to the LLM and gets a response
 * @param {string} prompt - The prompt to send to the LLM
 * @param {Object} context - The context for the request
 * @returns {Promise<string>} The LLM's response
 */
async function askLLM(prompt, context) {
    try {
        // Prepare the system message based on the request type
        let systemMessage = '';
        switch (context.type) {
            case 'question_review':
                systemMessage = `You are an expert medical educator specializing in dermatology board exam question writing.
                    Your task is to review and evaluate questions for clarity, accuracy, difficulty, and technical quality.
                    Provide detailed feedback and specific suggestions for improvement.
                    Focus on ensuring questions are clear, unambiguous, and follow best practices for medical education.`;
                break;
            case 'question_enhancement':
                systemMessage = `You are an expert medical educator specializing in dermatology board exam question writing.
                    Your task is to enhance questions based on review feedback while maintaining their core content and difficulty level.
                    Ensure the enhanced questions are clear, accurate, and technically sound.
                    Follow best practices for medical education question writing.`;
                break;
            default:
                systemMessage = `You are an expert medical educator specializing in dermatology.
                    Your task is to provide clear, accurate, and educational responses to questions about dermatology.
                    Focus on explaining concepts and principles rather than just providing answers.
                    If you notice any misunderstandings, gently correct them and explain why.`;
        }

        // Prepare the full prompt with context
        const fullPrompt = `
            ${systemMessage}

            ${prompt}

            Please provide your response in the requested format.
            If you're enhancing a question, maintain the same structure and format as the original.
            If you're reviewing a question, provide detailed feedback and specific suggestions.
        `;

        // Call your LLM API here
        // This is a placeholder - replace with your actual LLM API call
        const response = await fetch('/api/ask-llm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: fullPrompt,
                context: context
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get response from LLM');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error asking LLM:', error);
        throw error;
    }
}

export default askLLM; 