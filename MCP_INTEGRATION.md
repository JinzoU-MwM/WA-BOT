# MCP Integration - AI Chat System

## Overview

This WhatsApp Bot now includes MCP (Model Context Protocol) integration that enables natural language AI chat functionality, replacing the traditional menu system with a conversational interface.

## Architecture

### Components Added

1. **MCP Server** (`src/mcpServer.js`)
   - Exposes database operations as MCP tools
   - Provides standardized interface for AI to access data
   - Supports user management, document tracking, and status reporting

2. **AI Chat Service** (`src/aiChatService.js`)
   - Natural language processing for Indonesian and English
   - Intelligent tool selection based on user intent
   - Context-aware conversation management
   - Integration with Groq AI for intelligent responses

3. **Enhanced Bot Logic** (`src/bot.js`)
   - Updated to detect natural language triggers
   - Replaces menu navigation with AI chat
   - Maintains backward compatibility with traditional commands

## AI Capabilities

### Natural Language Understanding

The AI can understand and process requests in both Indonesian and English:

**Indonesian Examples:**
- "cari data user john" → Search for users named John
- "cek kekurangan PT Maju Bersatu" → Check document shortages
- "tambah status PT Test proses legalitas" → Add work status
- "lihat statistik pesan" → Show message statistics

**English Examples:**
- "find user john" → Search for users named John
- "check document shortage for PT Maju Bersatu" → Check shortages
- "add status PT Test legal process" → Add work status
- "show message statistics" → Show statistics

### Available MCP Tools

1. **search_users** - Search users by name, phone, or query
2. **get_all_users** - Retrieve all users with pagination
3. **get_message_statistics** - Get message analytics
4. **browse_by_tags** - Browse users by tags
5. **check_document_shortage** - Check PT document shortages
6. **add_document_shortage** - Add document shortage information
7. **get_work_status** - Get work status reports
8. **add_work_status** - Add new work status
9. **generate_ai_report** - Generate AI-formatted reports

## Usage

### For Users

Users can now chat naturally with the bot without learning specific commands:

```
User: cari data pengguna dengan nama andi
Bot: 🔍 Menemukan 2 pengguna dengan nama 'andi'...
      1. Andi Wijaya - Phone: 08123456789 - Tags: vip
      2. Andi Susanto - Phone: 08987654321 - Tags: new

User: cek kekurangan PT Maju Bersatu
Bot: 📋 Kekurangan Dokumen untuk PT Maju Bersatu:
      1. KTP
      2. Paspor yang masih berlaku
      3. SK PPIU
```

### For Developers

The MCP server can be extended with additional tools:

```javascript
// Add new tool in mcpServer.js
{
    name: 'custom_tool',
    description: 'Description of what the tool does',
    inputSchema: {
        type: 'object',
        properties: {
            parameter: {
                type: 'string',
                description: 'Parameter description',
            },
        },
        required: ['parameter'],
    },
}
```

## Benefits

1. **User Experience**: No need to learn complex menu navigation
2. **Natural Interaction**: Chat in everyday language
3. **Intelligent Responses**: AI understands context and intent
4. **Multilingual**: Supports Indonesian and English
5. **Extensible**: Easy to add new capabilities via MCP tools
6. **Backward Compatible**: Traditional commands still work

## Configuration

The MCP integration uses existing environment variables:

- `GROQ_API_KEY`: Required for AI processing
- Database settings for PostgreSQL/SQLite
- Standard bot configuration

## Future Enhancements

1. **Voice Input**: Support for voice messages
2. **More Languages**: Additional language support
3. **Advanced AI**: Enhanced reasoning capabilities
4. **Real-time Updates**: Live data synchronization
5. **Custom Prompts**: Configurable AI behavior

## Troubleshooting

### Common Issues

1. **AI Not Responding**: Check GROQ_API_KEY is valid
2. **Database Errors**: Verify database connection
3. **Tool Not Working**: Check service initialization

### Logs

Monitor logs for:
- AI chat processing: `AI chat response processed`
- Tool usage: `Executing tool: tool_name`
- Errors: `AI Chat Service error`

## Testing

Run the test script to verify functionality:

```bash
node test-ai-chat.js
```

This tests various AI chat scenarios and tool executions.