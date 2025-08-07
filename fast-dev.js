const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting IELTS Practice Test (Fast Mode)...\n');

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

// Check server readiness
async function checkReady() {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
        try {
            console.log(`\n🔍 Checking server readiness (attempt ${attempts + 1}/${maxAttempts})...`);
            await checkServerReady();
            console.log('✅ Server is ready!');
            console.log('🌐 Access your application at: http://localhost:8080');
            console.log('📊 Health check: http://localhost:8080/api/health');
            console.log('\n💡 For hot reload with BrowserSync, use: npm run hot');
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
}

// Check server after a short delay
setTimeout(checkReady, 1000);

// Handle server exit
server.on('close', (code) => {
    console.log(`\n❌ Server stopped with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill();
    process.exit(0);
}); 