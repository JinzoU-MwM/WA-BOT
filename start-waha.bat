@echo off
title WAHA Startup Options

echo ========================================
echo        WAHA WhatsApp Bot Setup
echo ========================================
echo.
echo 1. Using Docker (Recommended)
echo    docker run -d --name waha-fresh -p 3000:3000 --env-file waha-config.env -v "./sessions:/app/sessions" -v "./logs:/app/logs" devlikeapro/waha
echo.
echo 2. Using Docker Compose (Full setup)
echo    docker-compose up -d waha
echo.
echo 3. Manual Setup Instructions:
echo    - Start Docker Desktop
echo    - Run one of the above commands
echo    - Check http://localhost:3000
echo.
echo After starting WAHA:
echo ✅ Check WAHA: http://localhost:3000
echo ✅ Bot will connect automatically
echo ✅ Send "!P hello" to test
echo.
echo ========================================
set /p choice="Choose an option (1/2) or press any key to exit: "

if "%choice%"=="1" (
    echo.
    echo Starting WAHA with Docker...
    docker run -d --name waha-fresh -p 3000:3000 --env-file waha-config.env -v "./sessions:/app/sessions" -v "./logs:/app/logs" devlikeapro/waha
    timeout /t 5
    echo.
    echo WAHA should be starting...
    echo Check http://localhost:3000 in 30 seconds
) else if "%choice%"=="2" (
    echo.
    echo Starting WAHA with Docker Compose...
    docker-compose up -d waha
    timeout /t 5
    echo.
    echo WAHA should be starting...
    echo Check http://localhost:3000 in 30 seconds
) else (
    echo.
    echo Please start Docker Desktop and run one of the commands manually
)

echo.
echo Press any key to exit...
pause >nul