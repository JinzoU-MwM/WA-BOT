# WhatsApp AI Bot

![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)

A WhatsApp bot that integrates with WAHA API and Groq AI to provide intelligent chat responses in both private and group conversations with advanced database functionality.

## Features

- 🤖 **Natural Language AI Chat** - Chat directly with AI in Indonesian or English
- 🔧 **MCP (Model Context Protocol) Integration** - Advanced AI tool usage
- 💬 Works in both private and group chats
- 📝 Conversation context awareness with memory
- 🔄 Automatic message processing
- 🛡️ Error handling and recovery
- 📊 Health check endpoints
- 🗄️ PostgreSQL database integration with SQLite fallback
- 📈 User data tracking and analytics
- 🔍 Advanced search capabilities
- 📋 Document management and shortage tracking
- 🏷️ Tag-based message organization
- 📊 Message statistics and insights
- 📈 Work status management and reporting

## 🚀 NEW: Natural Language AI Chat

**No more complex menus!** Now you can chat naturally with the AI bot:

### Example Conversations:
- **User:** "cari data user john" → AI finds users named John
- **User:** "cek kekurangan PT Maju Bersatu" → AI shows document shortages
- **User:** "tambah status PT Test proses legalitas" → AI adds new status
- **User:** "berapa total pesan hari ini?" → AI provides statistics
- **User:** "lihat laporan status kemarin" → AI shows yesterday's reports

### Supported Languages:
- 🇮🇩 Indonesian (Bahasa Indonesia)
- 🇬🇧 English

### AI Capabilities:
- ✅ Natural language understanding
- ✅ Contextual conversations with memory
- ✅ Database query automation
- ✅ Document management
- ✅ Status reporting
- ✅ Statistical analysis

## Prerequisites

1. **WAHA API Server**: A running WAHA instance for WhatsApp integration
2. **Groq API Key**: Get one from [Groq Console](https://console.groq.com/keys)
3. **PostgreSQL Database**: For data storage and analytics
4. **Node.js**: Version 16 or higher

## Installation

1. **Clone or setup the project**:
   ```bash
   cd wa-bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up PostgreSQL Database**:
   ```sql
   -- Connect to PostgreSQL as superuser
   CREATE DATABASE wa_bot;
   CREATE USER wa_bot_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE wa_bot TO wa_bot_user;
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

5. **Edit `.env` file with your configuration**:
   ```env
   # WAHA API Configuration
   WAHA_API_URL=http://localhost:3000
   WAHA_SESSION_NAME=default
   WAHA_API_KEY=your_waha_api_key_here

   # Groq API Configuration
   GROQ_API_KEY=your_groq_api_key_here

   # Bot Configuration
   BOT_COMMAND_KEY=!ai
   BOT_NAME=WA Bot

   # Server Configuration
   PORT=3001

   # PostgreSQL Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=wa_bot
   DB_USER=wa_bot_user
   DB_PASSWORD=your_secure_password
   ```

## Usage

### 1. Start PostgreSQL

Make sure your PostgreSQL server is running and the database is created.

### 2. Start WAHA Server

Make sure your WAHA server is running and accessible. Follow the [WAHA documentation](https://waha.devlike.pro/) for setup instructions.

### 3. Start the Bot

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Test Database Connection

```bash
# Test database functionality
node test-database.js
```

### 5. Use the Bot

In WhatsApp (connected to WAHA):

#### AI Assistant Commands
- **Private Chat**: Send `!ai your message here`
- **Group Chat**: Send `!ai your message here`

#### Database Commands 🆕
- **Access Database Menu**: Send `.data`

The `.data` command opens an interactive menu system where you can:
1. 🔍 Search user data (by name, phone, or tags)
2. 📋 View all users with pagination
3. 📈 Check message statistics
4. 🏷️ Browse users by tags
5. Interactive navigation with simple number selections

#### Features
- **Automatic Message Logging**: All messages and responses are automatically stored in the database
- **User Tracking**: User information and interaction history is tracked
- **Tag Support**: Use hashtags in messages (e.g., `#important #urgent`) to categorize conversations
- **Search Functionality**: Search users by name, phone number, tags, or all fields
- **Statistics**: View message counts, active users, and top chatters
- **Interactive Menu**: Navigate through database options using simple number responses

The bot will respond with AI-generated messages and maintain database records of all interactions.

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `WAHA_API_URL` | WAHA API server URL | `http://localhost:3000` |
| `WAHA_SESSION_NAME` | WAHA session name | `default` |
| `WAHA_API_KEY` | WAHA API key | Optional |
| `GROQ_API_KEY` | Groq API key | Required |
| `BOT_COMMAND_KEY` | Command to trigger bot | `!ai` |
| `BOT_NAME` | Bot's display name | `WA Bot` |
| `PORT` | Bot server port | `3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `wa_bot` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | Required |
| `SIMULATION_MODE` | Run without WAHA | `false` |
| `MONITORED_CHATS` | Specific chat IDs to monitor | All chats |

## API Endpoints

### Health Check
```
GET http://localhost:3001/health
```

### Bot Status
```
GET http://localhost:3001/bot/status
```

## How It Works

1. **Message Polling**: The bot polls WAHA API for new messages every 3 seconds
2. **Command Detection**: Checks if messages start with the configured command key
3. **AI Processing**: Sends user messages to Groq API with conversation context
4. **Response**: Sends AI responses back via WAHA API
5. **Context Memory**: Maintains conversation history for better responses

## Conversation Features

- **Context Awareness**: Remembers previous messages in the conversation
- **Group Intelligence**: Tracks separate conversations per user in group chats
- **Memory Management**: Automatically cleans up old messages (24-hour retention)
- **Smart Responses**: Uses conversation history for contextual replies

## Database Features 🆕

### Core Functionality
- **Automatic Data Collection**: All messages and user interactions are automatically logged to PostgreSQL
- **User Profiles**: Creates and maintains user profiles with interaction history
- **Message Analytics**: Tracks message statistics, user activity, and engagement metrics
- **Tag System**: Automatically extracts hashtags from messages for categorization
- **Search Capabilities**: Full-text search across user data, messages, and metadata

### Interactive Database Menu
The `.data` command provides an intuitive menu system:
1. **Search Users**: Find users by name, phone number, tags, or custom search terms
2. **Browse All Users**: Paginated list of all users with their details
3. **View Statistics**: Message counts, active users, top chatters, and engagement metrics
4. **Tag Browser**: Browse users by categories and hashtags
5. **Navigation**: Simple number-based navigation with back/next options

### Data Schema
- **user_data**: User profiles, contact information, preferences, and metadata
- **message_logs**: Complete message history with responses and timestamps
- **bot_commands**: Command usage tracking and analytics
- **Indexes**: Optimized search performance with full-text and tag indexes

### Privacy & Security
- **Data Encryption**: Secure database connections and encrypted storage
- **Access Control**: Configurable user permissions and data access
- **Data Retention**: Automatic cleanup of old data with configurable retention periods
- **Privacy Controls**: Options to exclude specific chats or users from tracking

## Error Handling

- Automatic retry logic for API failures
- Graceful error messages to users
- Comprehensive logging for debugging
- Protection against duplicate message processing

## Development

### Project Structure
```
wa-bot/
├── src/
│   ├── index.js              # Main application entry point
│   ├── bot.js                # Core bot logic and message handling
│   ├── wahaService.js        # WAHA API integration
│   ├── groqService.js        # Groq AI API integration
│   ├── databaseService.js    # PostgreSQL database operations
│   ├── dataMenuService.js    # Interactive database menu system
│   └── spamDetector.js       # Spam detection and rate limiting
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
├── test-database.js          # Database testing utility
└── README.md                 # This file
```

### Customization

You can modify:
- Bot command key in `.env`
- AI model in `groqService.js`
- Polling interval in `bot.js`
- Conversation retention period in `index.js`
- Database schema and queries in `databaseService.js`
- Menu options and responses in `dataMenuService.js`
- Tag extraction logic in `bot.js`

## Troubleshooting

### Common Issues

1. **WAHA Connection Failed**:
   - Ensure WAHA server is running
   - Check `WAHA_API_URL` in `.env`
   - Verify session name matches WAHA configuration

2. **Groq API Errors**:
   - Verify `GROQ_API_KEY` is valid
   - Check API key permissions
   - Monitor rate limits

3. **Database Connection Failed**:
   - Ensure PostgreSQL is running
   - Check database connection parameters in `.env`
   - Verify database exists and user has permissions
   - Run `node test-database.js` to test connection

4. **Bot Not Responding**:
   - Check if command key is correct
   - Verify message polling is active
   - Check logs for errors
   - Test with simulation mode: `SIMULATION_MODE=true`

5. **Data Menu Not Working**:
   - Verify database connection is established
   - Check if menu state is being maintained
   - Test with `node test-database.js`
   - Check for database permission issues

### Database Issues

1. **Connection Errors**:
   ```bash
   # Test database connection
   node test-database.js

   # Check PostgreSQL status
   pg_isready -h localhost -p 5432
   ```

2. **Missing Tables**:
   - Tables are created automatically on startup
   - Check console logs for table creation messages
   - Verify user has CREATE TABLE permissions

3. **Performance Issues**:
   - Check database indexes are created
   - Monitor connection pool usage
   - Consider increasing DB connection pool size

### Logs

The bot provides detailed console logging for:
- Connection status
- Message processing
- API responses
- Error details

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review console logs
- Verify environment configuration