# 🚀 WAHA Setup Guide

## 📋 Prerequisites

1. **Docker Desktop** - Download and install from [docker.com](https://www.docker.com/products/docker-desktop)
2. **WhatsApp Number** - A phone number for the bot
3. **API Keys** - Already configured in your `.env` file

## 🐳 Quick Start (Recommended)

### Option 1: Run the Setup Script
```bash
# Windows
start-waha.bat

# Linux/Mac
bash start-waha.sh
```

### Option 2: Manual Docker Setup
```bash
# Start WAHA container
docker run -d --name waha-fresh -p 3000:3000 --env-file waha-config.env -v "./sessions:/app/sessions" -v "./logs:/app/logs" devlikeapro/waha
```

### Option 3: Docker Compose (Complete Setup)
```bash
# Start both WAHA and Bot
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f waha
docker-compose logs -f bot
```

## ⚙️ Configuration

### WAHA Configuration (`waha-config.env`)
```env
API_ENABLED=true
API_KEY=berhasil123
ENGINE=nowjs
SESSIONS=default
LOG_LEVEL=info
CORS_ENABLED=true
CORS_ORIGIN=*
```

### Bot Configuration (`.env`)
```env
WAHA_API_URL=http://localhost:3000
WAHA_API_KEY=berhasil123
WAHA_SESSION_NAME=default
GROQ_API_KEY=your_groq_key
BOT_COMMAND_KEY=!P
BOT_NAME=WA Bot
```

## 🔧 Verification Steps

1. **Check WAHA Status**
   ```bash
   curl http://localhost:3000
   ```

2. **Test API Authentication**
   ```bash
   curl -H "Authorization: Bearer berhasil123" http://localhost:3000/api/sessions
   ```

3. **Check Bot Status**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/bot/status
   ```

## 📱 WhatsApp Setup

1. **Scan QR Code**
   - Open http://localhost:3000 in your browser
   - Click "Connect" or "Start Session"
   - Scan the QR code with WhatsApp

2. **Verify Connection**
   - Check session status at http://localhost:3000
   - Look for "Connected" status

3. **Test the Bot**
   - Send `!P hello` to your bot number
   - Bot should respond with AI message

## 🛠️ Troubleshooting

### Port Conflicts
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill process if needed
taskkill /F /PID <PID>
```

### Docker Issues
```bash
# Stop and remove container
docker stop waha-fresh
docker rm waha-fresh

# View logs
docker logs waha-fresh
```

### Bot Connection Issues
1. Check if WAHA is running: `curl http://localhost:3000`
2. Verify API key is correct
3. Check bot logs for errors
4. Ensure SIMULATION_MODE=false in .env

## 📊 Monitoring

### WAHA Endpoints
- **Web UI**: http://localhost:3000
- **API Docs**: http://localhost:3000
- **Sessions**: http://localhost:3000/api/sessions

### Bot Endpoints
- **Health**: http://localhost:3001/health
- **Status**: http://localhost:3001/bot/status
- **Test**: `POST http://localhost:3001/bot/test-message`

### Example Test Request
```bash
curl -X POST http://localhost:3001/bot/test-message \
  -H "Content-Type: application/json" \
  -d '{"message": "!P Hello World"}'
```

## 🔄 Development Workflow

1. **Start WAHA**: `docker run ...` or `docker-compose up -d waha`
2. **Connect WhatsApp**: Scan QR code at http://localhost:3000
3. **Start Bot**: `npm run dev`
4. **Test**: Send `!P hello` to your bot number
5. **Debug**: Check logs and monitor endpoints

## 📁 File Structure
```
wa-bot/
├── src/                 # Bot source code
├── sessions/            # WhatsApp session data
├── logs/               # Application logs
├── waha-config.env     # WAHA configuration
├── docker-compose.yml  # Docker setup
├── start-waha.bat      # Windows setup script
└── .env               # Bot configuration
```

## 🎯 Next Steps

1. Start WAHA using one of the methods above
2. Connect WhatsApp to WAHA
3. Test bot functionality
4. Customize bot behavior as needed