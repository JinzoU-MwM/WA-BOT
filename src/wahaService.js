const axios = require('axios');

class WAHAService {
    constructor(apiUrl, sessionName, apiKey = null) {
        this.apiUrl = apiUrl;
        this.sessionName = sessionName;
        this.apiKey = apiKey;
    }

    createAuthClient(authMethod = 'bearer') {
        const headers = {};

        if (this.apiKey) {
            switch (authMethod) {
                case 'bearer':
                    headers['Authorization'] = `Bearer ${this.apiKey}`;
                    break;
                case 'apikey':
                    headers['X-API-Key'] = this.apiKey;
                    break;
                case 'basic':
                    headers['Authorization'] = `Basic ${Buffer.from(this.apiKey).toString('base64')}`;
                    break;
                case 'custom':
                    headers['apikey'] = this.apiKey;
                    break;
            }
        }

        return axios.create({
            baseURL: this.apiUrl,
            timeout: 30000,
            headers
        });
    }

    async checkConnection() {
        try {
            // Try different authentication methods
            const authMethods = this.apiKey ? ['bearer', 'apikey', 'custom'] : ['none'];

            // Try multiple endpoints to check WAHA connection
            const endpoints = [
                '/api/sessions',
                '/api/status',
                '/',
                '/api/session/status'
            ];

            for (const authMethod of authMethods) {
                const client = authMethod === 'none' ?
                    axios.create({ baseURL: this.apiUrl, timeout: 30000 }) :
                    this.createAuthClient(authMethod);

                for (const endpoint of endpoints) {
                    try {
                        const response = await client.get(endpoint);
                        console.log(`✅ WAHA connection successful via ${endpoint} (auth: ${authMethod})`);
                        this.client = client; // Store the working client
                        return { status: 'connected', endpoint, authMethod };
                    } catch (err) {
                        console.log(`⚠️ Endpoint ${endpoint} failed with ${authMethod}:`, err.response?.status);
                        continue;
                    }
                }
            }

            throw new Error('All WAHA endpoints and authentication methods failed');
        } catch (error) {
            console.error('Error checking WAHA connection:', error.message);
            throw error;
        }
    }

    async sendMessage(chatId, message) {
        try {
            // Try the working sendText endpoint first
            let url = `/api/sendText`;
            if (this.apiKey) {
                url += `?apikey=${this.apiKey}`;
            }

            const response = await this.client.post(url, {
                session: this.sessionName,
                chatId: chatId,
                text: message
            });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error.message);
            throw error;
        }
    }

    async getMessages(limit = 50, chatId = null) {
        try {
            // If chatId is provided, fetch messages from that specific chat
            if (chatId) {
                const params = {
                    chatId: chatId,
                    limit: limit,
                    withMedia: false,
                    count: true
                };

                if (this.apiKey) {
                    params.apikey = this.apiKey;
                }

                const response = await this.client.get('/api/messages', { params });
                return response.data;
            }

            // Try to get messages for the session with API key in query
            let url = `/api/messages${this.sessionName ? `/${this.sessionName}` : ''}`;
            const params = { limit, withMedia: false };

            if (this.apiKey) {
                params.apikey = this.apiKey;
            }

            const response = await this.client.get(url, { params });
            return response.data;
        } catch (error) {
            // If we have a chatId and the above failed, try the simple format
            if (chatId) {
                try {
                    const params = { chatId: chatId, limit: limit };
                    if (this.apiKey) {
                        params.apikey = this.apiKey;
                    }

                    const response = await this.client.get('/api/messages', { params });
                    return response.data;
                } catch (chatError) {
                    console.error(`Error fetching messages for chat ${chatId}:`, chatError.message);
                    throw chatError;
                }
            }

            // Try alternative endpoint for global messages
            try {
                const params = { limit, withMedia: false };
                if (this.apiKey) {
                    params.apikey = this.apiKey;
                }

                const response = await this.client.get('/api/messages', { params });
                return response.data;
            } catch (fallbackError) {
                console.error('Error fetching messages:', error.message);
                throw fallbackError;
            }
        }
    }

    async markAsRead(chatId, messageId) {
        try {
            const response = await this.client.post(`/api/markAsRead`, {
                session: this.sessionName,
                chatId: chatId,
                messageId: messageId
            });
            return response.data;
        } catch (error) {
            console.error('Error marking message as read:', error.message);
            throw error;
        }
    }
}

module.exports = WAHAService;