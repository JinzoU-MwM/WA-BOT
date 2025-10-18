require('dotenv').config();
const express = require('express');
const WABot = require('./bot');

const app = express();
const PORT = 3010; // Fixed port as requested

// Load configuration
const config = {
    wahaApiUrl: process.env.WAHA_API_URL || 'http://localhost:3000',
    wahaSessionName: process.env.WAHA_SESSION_NAME || 'default',
    wahaApiKey: process.env.WAHA_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    botCommandKey: process.env.BOT_COMMAND_KEY || '!ai',
    botName: process.env.BOT_NAME || 'WA Bot',
    simulationMode: process.env.SIMULATION_MODE === 'true',
    monitoredChats: process.env.MONITORED_CHATS ? process.env.MONITORED_CHATS.split(',').map(chat => chat.trim()) : [],
    spamDetection: {
        maxMessagesPerMinute: parseInt(process.env.SPAM_MAX_MESSAGES_PER_MINUTE) || 20,  // Human-like: rapid conversation
        maxMessagesPerHour: parseInt(process.env.SPAM_MAX_MESSAGES_PER_HOUR) || 100,    // Human-like: active chatting
        maxMessagesPerDay: parseInt(process.env.SPAM_MAX_MESSAGES_PER_DAY) || 500,     // Human-like: very active user
        cooldownSeconds: parseInt(process.env.SPAM_COOLDOWN_SECONDS) || 1,             // Reduced: allow quick replies
        detectionThreshold: parseInt(process.env.SPAM_DETECTION_THRESHOLD) || 50       // Higher threshold to reduce false positives
    }
};

// Validate required environment variables
function validateConfig() {
    const missing = [];

    if (!config.groqApiKey) {
        missing.push('GROQ_API_KEY');
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nPlease copy .env.example to .env and fill in the required values.');
        process.exit(1);
    }

    console.log('✅ Configuration validated');
}

// Error handling middleware
function setupErrorHandling() {
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
        process.exit(0);
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        bot: {
            name: config.botName,
            commandKey: config.botCommandKey,
            wahaApiUrl: config.wahaApiUrl
        }
    });
});

// Bot status endpoint
app.get('/bot/status', (req, res) => {
    const status = {
        status: 'running',
        timestamp: new Date().toISOString(),
        simulationMode: config.simulationMode,
        config: {
            botName: config.botName,
            commandKey: config.botCommandKey,
            wahaSessionName: config.wahaSessionName,
            wahaApiUrl: config.wahaApiUrl
        }
    };

    // Include spam statistics if bot is initialized
    if (bot) {
        status.spamStats = bot.getSpamStats();
        status.spamConfig = config.spamDetection;
    }

    res.json(status);
});

let bot; // Global bot variable

// Test endpoint for simulation
app.post('/bot/test-message', express.json(), async (req, res) => {
    try {
        if (!bot) {
            return res.status(503).json({ error: 'Bot not initialized yet' });
        }

        const { message, chatId, from } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Simulate incoming message
        const testMessage = {
            id: Date.now().toString(),
            body: message,
            chatId: chatId || 'test-chat@c.us',
            from: from || 'test-user@c.us',
            timestamp: Date.now(),
            notifyName: 'Test User'
        };

        // Process the message
        await bot.handleIncomingMessage(testMessage);

        res.json({
            success: true,
            message: 'Test message processed',
            testMessage
        });
    } catch (error) {
        console.error('Error processing test message:', error);
        res.status(500).json({
            error: 'Failed to process test message',
            details: error.message
        });
    }
});

// Webhook endpoint for WAHA
app.post('/webhook', express.json(), async (req, res) => {
    try {
        if (!bot) {
            return res.status(503).json({ error: 'Bot not initialized yet' });
        }

        console.log('📥 Received webhook:', JSON.stringify(req.body, null, 2));

        // Handle WAHA webhook format: {"chatId": "11111111111@c.us", "text": "Hi there!", "session": "default"}
        if (req.body.chatId && req.body.text) {
            const message = {
                id: Date.now().toString(),
                body: req.body.text,
                text: req.body.text,
                chatId: req.body.chatId,
                from: req.body.chatId,
                timestamp: Date.now(),
                notifyName: 'WhatsApp User',
                session: req.body.session || 'default'
            };

            await bot.handleIncomingMessage(message);
            console.log(`✅ Processed message from ${req.body.chatId}: "${req.body.text}"`);
        }
        // Handle WAHA event format (the real format being sent)
        else if (req.body.event && req.body.payload) {
            const payload = req.body.payload;

            if ((req.body.event === 'message' || req.body.event === 'message.any') &&
                payload.body &&
                payload.from &&
                !payload.fromMe) {

                const message = {
                    id: payload.id || Date.now().toString(),
                    body: payload.body,
                    text: payload.body,
                    chatId: payload.from,
                    from: payload.from,
                    timestamp: payload.timestamp || Date.now(),
                    notifyName: payload.notifyName || 'WhatsApp User',
                    session: req.body.session || 'default'
                };

                await bot.handleIncomingMessage(message);
                console.log(`✅ Processed message from ${payload.from}: "${payload.body}"`);
            }
        }
        // Handle multiple messages format
        else if (req.body.messages && Array.isArray(req.body.messages)) {
            for (const msg of req.body.messages) {
                if (msg.chatId && (msg.body || msg.text)) {
                    const message = {
                        id: msg.id || Date.now().toString(),
                        body: msg.body || msg.text,
                        text: msg.text || msg.body,
                        chatId: msg.chatId,
                        from: msg.from || msg.chatId,
                        timestamp: msg.timestamp || Date.now(),
                        notifyName: msg.notifyName || 'WhatsApp User',
                        session: msg.session || 'default'
                    };

                    await bot.handleIncomingMessage(message);
                    console.log(`✅ Processed message from ${msg.chatId}: "${msg.body || msg.text}"`);
                }
            }
        }
        // Handle other webhook formats
        else {
            const messages = req.body.event && req.body.event.data ? req.body.event.data : [req.body];
            for (const message of messages) {
                if (message && (message.body || message.text)) {
                    await bot.handleIncomingMessage(message);
                }
            }
        }

        res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            error: 'Failed to process webhook',
            details: error.message
        });
    }
});

// Start server and bot
async function startServer() {
    try {
        // Setup error handling
        setupErrorHandling();

        // Validate configuration
        validateConfig();

        // Create and initialize bot
        console.log('🤖 Initializing WA Bot...');
        bot = new WABot(config);

        // Check WAHA connection
        if (config.simulationMode) {
            console.log('🔧 Running in SIMULATION MODE - WAHA connection not required');
            console.log('💭 Bot will simulate message handling for testing');
        } else {
            const initialized = await bot.initialize();
            if (!initialized) {
                console.error('⚠️  WAHA connection failed, but bot will continue in limited mode');
                console.log('📱 To use full functionality, ensure WAHA is running on:', config.wahaApiUrl);
                console.log('🔧 Or set SIMULATION_MODE=true in .env for testing');
            } else {
                console.log('✅ WAHA service initialized successfully');
            }
        }

        // Start Express server on fixed port
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 Express server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🤖 Bot status: http://localhost:${PORT}/bot/status`);
            console.log(`🔗 Webhook URL: http://192.168.18.182:${PORT}/webhook`);
        }).on('error', (err) => {
            console.error('❌ Failed to start server:', err);
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Please stop the other process or change the PORT in .env`);
            }
            process.exit(1);
        });

        // Start message polling (DISABLED - WAHA requires chatId for each request)
        console.log('📡 Bot ready to receive messages via webhook');
        console.log('🔗 Webhook URL: http://localhost:' + PORT + '/webhook');
        console.log('💡 Configure WAHA to send webhooks to this URL for real-time message processing');
        console.log('🧪 Use test endpoint: http://localhost:' + PORT + '/bot/test-message for testing');

        // For now, disable polling as WAHA API requires specific chatId
        // if (!config.simulationMode) {
        //     bot.startPolling(3000);
        // }

        // Cleanup old conversations every hour
        setInterval(() => {
            bot.cleanup();
            console.log('🧹 Cleaned up old conversation history');
        }, 60 * 60 * 1000);

        console.log('✅ Bot started successfully!');
        console.log(`📝 Command key: "${config.botCommandKey}"`);
        console.log(`🤖 Bot name: "${config.botName}"`);
        console.log('💬 The bot will respond to messages starting with the command key in both private and group chats.');

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the application
startServer();
