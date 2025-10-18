const axios = require('axios');

class GroqService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: 'https://api.groq.com/openai/v1',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }

    async chatCompletion(messages, model = 'llama-3.1-8b-instant') {
        try {
            const response = await this.client.post('/chat/completions', {
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 1,
                stream: false
            });

            return {
                success: true,
                content: response.data.choices[0].message.content,
                usage: response.data.usage
            };
        } catch (error) {
            console.error('Error calling Groq API:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    async simpleChat(userMessage, context = null) {
        const messages = [];

        // Add system context if provided
        if (context) {
            messages.push({
                role: 'system',
                content: context
            });
        }

        // Add system message for AI behavior
        messages.push({
            role: 'system',
            content: 'You are a helpful AI assistant. Be concise, friendly, and helpful. Respond in a natural conversational style.'
        });

        // Add user message
        messages.push({
            role: 'user',
            content: userMessage
        });

        return await this.chatCompletion(messages);
    }

    async chatWithContext(history, userMessage, maxHistory = 5) {
        const messages = [];

        // Add system message
        messages.push({
            role: 'system',
            content: 'You are a helpful AI assistant. Be concise, friendly, and helpful. Respond in a natural conversational style.'
        });

        // Add recent conversation history
        const recentHistory = history.slice(-maxHistory * 2); // Last 5 exchanges (each has user + assistant)
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage
        });

        return await this.chatCompletion(messages);
    }
}

module.exports = GroqService;