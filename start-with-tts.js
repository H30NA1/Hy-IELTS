#!/usr/bin/env node
/**
 * IELTS Practice Test - Smart Startup Script
 * Automatically starts TTS server (if available) + Node server
 * Usage: npm start
 */

const { spawn } = require('child_process');
const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPython() {
    try {
        execSync('python --version', { stdio: 'pipe' });
        return true;
    } catch {
        try {
            execSync('python3 --version', { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    }
}

function checkTTS() {
    try {
        execSync('python -c "import TTS"', { stdio: 'pipe' });
        return true;
    } catch {
        try {
            execSync('python3 -c "import TTS"', { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    }
}

function getPythonCommand() {
    try {
        execSync('python --version', { stdio: 'pipe' });
        return 'python';
    } catch {
        return 'python3';
    }
}

async function startServers() {
    log('\n🚀 Starting IELTS Practice Test Servers...', 'bright');
    log('═'.repeat(50), 'gray');
    
    const hasPython = checkPython();
    const hasTTS = hasPython && checkTTS();
    
    // Check Python
    if (hasPython) {
        log('✅ Python found', 'green');
    } else {
        log('⚠️  Python not found (will use browser voices)', 'yellow');
    }
    
    // Check TTS
    if (hasTTS) {
        log('✅ Coqui TTS installed', 'green');
    } else if (hasPython) {
        log('⚠️  Coqui TTS not installed (will use browser voices)', 'yellow');
        log('   Install with: pip install TTS flask flask-cors', 'cyan');
    }
    
    log('═'.repeat(50), 'gray');
    log('', 'reset');
    
    let ttsProcess = null;
    
    // Start TTS server if available
    if (hasPython && hasTTS) {
        log('🎤 Starting Coqui TTS Server (Port 5050)...', 'cyan');
        
        const pythonCmd = getPythonCommand();
        ttsProcess = spawn(pythonCmd, ['tts_server.py'], {
            stdio: 'inherit',
            shell: true
        });
        
        ttsProcess.on('error', (error) => {
            log(`⚠️  TTS Server error: ${error.message}`, 'yellow');
            log('   Continuing with browser voices...', 'yellow');
        });
        
        // Wait a bit for TTS server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        log('   ✅ TTS Server started', 'green');
        log('', 'reset');
    }
    
    // Start Node server
    log('🌐 Starting IELTS Web Server (Port 8111)...', 'cyan');
    log('═'.repeat(50), 'gray');
    log('', 'reset');
    
    const nodeProcess = spawn('node', ['server.js'], {
        stdio: 'inherit',
        shell: true
    });
    
    // Handle process termination
    const cleanup = () => {
        log('\n\n🛑 Shutting down servers...', 'yellow');
        if (ttsProcess) {
            ttsProcess.kill();
        }
        nodeProcess.kill();
        process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    nodeProcess.on('exit', (code) => {
        if (ttsProcess) {
            ttsProcess.kill();
        }
        process.exit(code);
    });
    
    // Show startup summary after Node server starts
    setTimeout(() => {
        log('', 'reset');
        log('═'.repeat(50), 'gray');
        log('✅ All servers started successfully!', 'green');
        log('', 'reset');
        log('📱 Access the test at: http://localhost:8111', 'yellow');
        log('', 'reset');
        
        if (hasTTS) {
            log('🔊 Audio System: Coqui TTS (High Quality)', 'cyan');
            log('   • Professional neural voices', 'gray');
            log('   • Multiple accents (US, UK, AU)', 'gray');
        } else {
            log('🔊 Audio System: Browser Voices', 'cyan');
            log('   • Use Google Chrome for 30+ voices', 'gray');
            if (hasPython && !hasTTS) {
                log('   • Install TTS for better quality: pip install TTS flask flask-cors', 'gray');
            }
        }
        
        log('', 'reset');
        log('💡 Tips:', 'magenta');
        log('   • Press Ctrl+C to stop all servers', 'gray');
        log('   • Use Google Chrome for best voice variety', 'gray');
        if (!hasTTS && hasPython) {
            log('   • See SETUP_COQUI_TTS.md for TTS installation', 'gray');
        }
        log('', 'reset');
        log('═'.repeat(50), 'gray');
        log('', 'reset');
    }, 1000);
}

// Start everything
startServers().catch(error => {
    log(`\n❌ Startup error: ${error.message}`, 'red');
    process.exit(1);
});

