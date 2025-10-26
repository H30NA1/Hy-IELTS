// IELTS Test Main Application
// This file loads all modules and initializes the application

// Load all modules
    const modules = [
        'js/modules/utils.js',
        'js/modules/grading.js',
        'js/modules/coqui-tts.js',
        'js/modules/listening.js',
        'js/modules/reading.js',
        'js/modules/grammar.js',
        'js/modules/writing.js',
        'js/modules/pdf.js',
        'js/modules/user-data.js',
        'js/modules/core.js'
    ];

// Function to load scripts dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load all modules and initialize the application
async function initializeApplication() {
    try {
        console.log('Loading IELTS Test modules...');
        
        // Load all modules
        for (const module of modules) {
            await loadScript(module);
        }
        
        console.log('All modules loaded successfully');
        
        // Initialize the application
        const app = new IELTSCore();
        await app.initialize();
        
        // Make it available as IELTSTest for backward compatibility
        window.IELTSTest = app;
        
        // Show the name input modal
        app.showNameModal();
        
        console.log('IELTS Test application ready');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h2>Error Loading Application</h2>
                <p>Failed to load the IELTS test application. Please refresh the page.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px;">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    initializeApplication();
}
