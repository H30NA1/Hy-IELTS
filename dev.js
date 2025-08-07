const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('🚀 Starting IELTS Practice Test with Hot Reload...\n');

// Start the server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
});

// Function to check if server is ready
function checkServerReady() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8080/api/health', (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                reject(new Error(`Server responded with status ${res.statusCode}`));
            }
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.setTimeout(2000, () => {
            req.destroy();
            reject(new Error('Server health check timeout'));
        });
    });
}

// Wait for server to be ready, then start browser-sync
async function startBrowserSync() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        try {
            console.log(`\n🔍 Checking server readiness (attempt ${attempts + 1}/${maxAttempts})...`);
            await checkServerReady();
            console.log('✅ Server is ready!');
            break;
        } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
                console.log('❌ Server failed to start within expected time');
                server.kill();
                process.exit(1);
            }
            console.log(`⏳ Server not ready yet, waiting... (${error.message})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n🌐 Starting Browser Sync...\n');
    
    const browserSync = spawn('npx', ['browser-sync', 'start', '--config', 'bs-config.js'], {
        stdio: 'inherit',
        shell: true
    });
    
    // Handle browser-sync exit
    browserSync.on('close', (code) => {
        console.log(`\n❌ Browser Sync stopped with code ${code}`);
        server.kill();
        process.exit(code);
    });
}

// Start browser sync after a short delay
setTimeout(startBrowserSync, 1000);

// Handle server exit
server.on('close', (code) => {
    console.log(`\n❌ Server stopped with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    server.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down development server...');
    server.kill();
    process.exit(0);
}); 