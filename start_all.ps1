# IELTS Test - Start All Servers
# This script starts both the TTS server and the Node.js server

Write-Host "🚀 Starting IELTS Practice Test Servers..." -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.9+ first." -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if TTS is installed
try {
    python -c "import TTS" 2>&1 | Out-Null
    Write-Host "✅ Coqui TTS installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Coqui TTS not found (will use browser voices as fallback)" -ForegroundColor Yellow
    Write-Host "   To install Coqui TTS, run: pip install TTS flask flask-cors" -ForegroundColor Cyan
    Write-Host ""
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray

# Start TTS Server (if TTS is installed)
if (Test-Path "tts_server.py") {
    try {
        python -c "import TTS" 2>&1 | Out-Null
        Write-Host "🎤 Starting Coqui TTS Server (Port 5050)..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "python tts_server.py; Read-Host 'Press Enter to close'"
        Start-Sleep -Seconds 3
        Write-Host "   TTS Server started successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Skipping TTS Server (Coqui TTS not installed)" -ForegroundColor Yellow
        Write-Host "   Browser voices will be used instead." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  tts_server.py not found, skipping TTS server" -ForegroundColor Yellow
}

Write-Host ""

# Kill any existing Node.js processes
Write-Host "🔄 Stopping any existing Node servers..." -ForegroundColor Cyan
taskkill /F /IM node.exe 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Start Node Server
Write-Host "🌐 Starting IELTS Web Server (Port 8111)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ All servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access the test at: http://localhost:8111" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔊 Audio System:" -ForegroundColor Cyan
Write-Host "   • If TTS Server is running → High-quality Coqui TTS voices" -ForegroundColor White
Write-Host "   • If TTS Server is offline → Browser voices (fallback)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Magenta
Write-Host "   • Use Google Chrome for best browser voice variety" -ForegroundColor White
Write-Host "   • Install Coqui TTS for professional-quality voices" -ForegroundColor White
Write-Host "   • See SETUP_COQUI_TTS.md for installation guide" -ForegroundColor White
Write-Host ""
Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# Start Node server
node server.js

