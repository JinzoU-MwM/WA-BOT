const WAHAService = require('./wahaService');
const GroqService = require('./groqService');
const SpamDetector = require('./spamDetector');

class WABot {
    constructor(config) {
        this.wahaService = new WAHAService(config.wahaApiUrl, config.wahaSessionName, config.wahaApiKey);
        this.groqService = new GroqService(config.groqApiKey);
        this.commandKey = config.botCommandKey;
        this.botName = config.botName;
        this.simulationMode = config.simulationMode || false;
        this.conversationHistory = new Map(); // Store conversation history per chat
        this.isProcessing = new Set(); // Track ongoing processing to avoid duplicates
        this.monitoredChats = config.monitoredChats || []; // List of chat IDs to monitor
        this.spamDetector = new SpamDetector(config.spamDetection); // Initialize spam detection with config
    }

    async initialize() {
        try {
            if (this.simulationMode) {
                console.log('🔧 Simulation mode: Skipping WAHA connection check');
                return true;
            }

            console.log('Checking WAHA connection...');
            const status = await this.wahaService.checkConnection();
            console.log('WAHA connection status:', status);
            return true;
        } catch (error) {
            console.error('Failed to initialize WAHA service:', error);
            return false;
        }
    }

    parseMessage(message) {
        // Extract message content and metadata
        return {
            id: message.id || '',
            content: message.body || message.text || '',
            chatId: message.chatId || message.from,
            from: message.from || message.author,
            timestamp: message.timestamp || Date.now(),
            isGroup: message.chatId ? message.chatId.includes('@g.us') : false,
            senderName: message.notifyName || message.pushname || 'Unknown'
        };
    }

    isBotCommand(messageContent) {
        return messageContent.toLowerCase().trim().startsWith(this.commandKey.toLowerCase());
    }

    extractUserMessage(messageContent) {
        return messageContent.trim()
            .substring(this.commandKey.length)
            .trim();
    }

    getConversationKey(chatId, sender) {
        // For group chats, track per user
        if (chatId.includes('@g.us')) {
            return `${chatId}_${sender}`;
        }
        // For private chats, use chat ID
        return chatId;
    }

    getConversationHistory(key) {
        if (!this.conversationHistory.has(key)) {
            this.conversationHistory.set(key, []);
        }
        return this.conversationHistory.get(key);
    }

    addToHistory(key, role, content) {
        const history = this.getConversationHistory(key);
        history.push({ role, content, timestamp: Date.now() });

        // Keep only last 20 messages to manage memory
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
    }

    async handleIncomingMessage(message) {
        try {
            const parsedMessage = this.parseMessage(message);
            const processingKey = `${parsedMessage.chatId}_${parsedMessage.id}`;

            // Skip if already processing this message
            if (this.isProcessing.has(processingKey)) {
                return;
            }

            // Skip bot's own messages
            if (parsedMessage.from === 'bot' || parsedMessage.senderName === this.botName) {
                return;
            }

            // Check if this is a bot command
            if (!this.isBotCommand(parsedMessage.content)) {
                return;
            }

            // Spam detection disabled - allow free messaging

            this.isProcessing.add(processingKey);

            try {
                console.log(`Processing command from ${parsedMessage.senderName} in ${parsedMessage.isGroup ? 'group' : 'private'} chat`);

                const userMessage = this.extractUserMessage(parsedMessage.content);
                if (!userMessage) {
                    const welcomeMessage = 'Hello! 👋 I am an AI assistant. Please type your message after the command key to chat with me.';

                    if (this.simulationMode) {
                        console.log(`🔧 [SIMULATION] Welcome message to ${parsedMessage.senderName}: ${welcomeMessage}`);
                    } else {
                        await this.wahaService.sendMessage(parsedMessage.chatId, welcomeMessage);
                    }
                    return;
                }

                // Get conversation history
                const conversationKey = this.getConversationKey(parsedMessage.chatId, parsedMessage.from);
                const history = this.getConversationHistory(conversationKey);

                // Show typing indicator
                await this.sendTypingIndicator(parsedMessage.chatId);

                // Get AI response
                const response = await this.groqService.chatWithContext(history, userMessage);

                if (response.success) {
                    // Send response (or simulate)
                    if (this.simulationMode) {
                        console.log(`🔧 [SIMULATION] Response to ${parsedMessage.senderName}: ${response.content}`);
                    } else {
                        await this.wahaService.sendMessage(parsedMessage.chatId, response.content);
                    }

                    // Update conversation history
                    this.addToHistory(conversationKey, 'user', userMessage);
                    this.addToHistory(conversationKey, 'assistant', response.content);

                    console.log(`AI response processed for ${parsedMessage.senderName}`);
                } else {
                    const errorMessage = 'Sorry, I encountered an error while processing your request. Please try again later.';

                    if (this.simulationMode) {
                        console.log(`🔧 [SIMULATION] Error message to ${parsedMessage.senderName}: ${errorMessage}`);
                    } else {
                        await this.wahaService.sendMessage(parsedMessage.chatId, errorMessage);
                    }

                    console.error('Groq API error:', response.error);
                }

                // Mark message as read (optional, ignore errors)
                if (parsedMessage.id && !this.simulationMode) {
                    try {
                        await this.wahaService.markAsRead(parsedMessage.chatId, parsedMessage.id);
                    } catch (readError) {
                        // Ignore markAsRead errors as it's not critical functionality
                        console.log('⚠️ Could not mark message as read (non-critical):', readError.message);
                    }
                }

            } finally {
                this.isProcessing.delete(processingKey);
            }

        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    async sendTypingIndicator(chatId) {
        // WAHA doesn't have a direct typing indicator API
        // This is a placeholder for future implementation
        // We could send a temporary message like "Typing..." if needed
    }

    async startPolling(intervalMs = 3000) {
        if (this.simulationMode) {
            console.log('🔧 Simulation mode: Message polling disabled');
            return;
        }

        console.log('🔄 Starting message polling for ALL incoming messages...');
        console.log('📱 Bot will respond to anyone sending messages with command key:', this.commandKey);

        let lastMessageTimestamp = Date.now();

        setInterval(async () => {
            try {
                // Try to get recent messages from all chats
                const messages = await this.wahaService.getMessages(20);

                if (Array.isArray(messages)) {
                    for (const message of messages) {
                        // Only process incoming messages (not from me) that are newer than last check
                        if (!message.fromMe &&
                            message.timestamp &&
                            message.timestamp * 1000 > lastMessageTimestamp &&
                            message.body) {

                            console.log(`📨 New message from ${message.from || message.chatId}: "${message.body}"`);
                            await this.handleIncomingMessage(message);
                        }
                    }
                }

                lastMessageTimestamp = Date.now();
            } catch (error) {
                console.error('Error in polling loop:', error.message);
            }
        }, intervalMs);
    }

    async cleanup() {
        // Clean up old conversation history
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [key, history] of this.conversationHistory.entries()) {
            const filtered = history.filter(msg =>
                now - msg.timestamp < maxAge
            );

            if (filtered.length === 0) {
                this.conversationHistory.delete(key);
            } else {
                this.conversationHistory.set(key, filtered);
            }
        }

        // Clean up spam detection data
        this.spamDetector.cleanup();
    }

    // Method to report a user for spam (can be triggered by admins)
    reportUser(userId, reporterId) {
        this.spamDetector.reportUser(userId, reporterId);
        console.log(`📢 User ${userId} reported for spam by ${reporterId}`);
    }

    // Get spam statistics for monitoring
    getSpamStats() {
        return {
            totalRateLimits: this.spamDetector.rateLimits.size,
            totalCooldowns: this.spamDetector.cooldowns.size,
            totalReputations: this.spamDetector.userReputation.size,
            recentMessages: this.spamDetector.recentMessages.length
        };
    }
}

module.exports = WABot;