const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const WritingChecker = require('./writing-checker');
const multer = require('multer');

// Configure Multer
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const { userName, date } = req.body;
        const sanitizedUserName = userName ? userName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_') : 'Anonymous';
        const folderDate = date || moment().format('YYYY-MM-DD');
        const uploadDir = path.join(__dirname, 'data', sanitizedUserName, 'answers', folderDate);
        await fs.ensureDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'speaking.mp4');
    }
});
const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 8111;

// Function to find an available port
async function findAvailablePort(startPort) {
    const net = require('net');

    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.listen(startPort, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // Try the next port
                findAvailablePort(startPort + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

// Initialize writing checker
const writingChecker = new WritingChecker();

// Middleware
// Configure CSP to allow necessary resources while blocking service workers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "http://localhost:5050"], // Allow local TTS server
            imgSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "blob:"], // Allow blob URLs for audio
            frameSrc: ["'none'"],
            workerSrc: ["'none'"], // Block service workers
            childSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));

// Add aggressive cache-busting headers for static files
app.use((req, res, next) => {
    // Add version parameter to force cache invalidation
    if (req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.html')) {
        // Add timestamp to force cache invalidation
        const timestamp = Date.now();
        if (req.path.endsWith('.html') && !req.query.v) {
            return res.redirect(`${req.path}?v=${timestamp}`);
        }

        // Set aggressive cache control headers
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.setHeader('Last-Modified', new Date().toUTCString());
        res.setHeader('ETag', `"${timestamp}"`);
    }
    next();
});
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Upload Speaking Endpoint
app.post('/api/upload-speaking', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({ success: true, filename: req.file.filename });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Create directories if they don't exist
const dataDir = path.join(__dirname, 'data');
const questionsDir = path.join(__dirname, 'questions');
fs.ensureDirSync(dataDir);
fs.ensureDirSync(questionsDir);

// Load test data from JSON file
let testData = null;

async function loadTestData(date = null) {
    try {
        console.log('=== loadTestData called ===');

        // Get all available JSON files in questions directory (recursively)
        async function getAllJsonFiles(dir) {
            const files = [];
            const items = await fs.readdir(dir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    // Recursively search subdirectories
                    const subFiles = await getAllJsonFiles(fullPath);
                    files.push(...subFiles);
                } else if (item.isFile() && item.name.endsWith('.json')) {
                    files.push(fullPath);
                }
            }

            return files;
        }

        // Get all available JSON files
        const allJsonFiles = await getAllJsonFiles(questionsDir);
        console.log('All available JSON test files:', allJsonFiles.map(f => path.relative(questionsDir, f)));

        if (allJsonFiles.length === 0) {
            throw new Error('No test data files found in questions directory');
        }

        let questionsFile = null;

        // If date is specified, try to find that specific file
        if (date) {
            const testDate = moment(date).format('YYYY-MM-DD');
            questionsFile = allJsonFiles.find(f => f.includes(testDate));
            console.log(`Looking for test file with date: ${testDate}`);
        }

        // If no specific file found, try today's date
        if (!questionsFile) {
            const todayDate = moment().format('YYYY-MM-DD');
            questionsFile = allJsonFiles.find(f => f.includes(todayDate));
            console.log(`Looking for today's test file: ${todayDate}`);
        }

        // If still no file found, use the most recent file (sort by date in filename)
        if (!questionsFile) {
            // Sort files by date (newest first)
            const sortedFiles = allJsonFiles.sort((a, b) => {
                const dateRegex = /(\d{4}-\d{2}-\d{2})/;
                const dateA = a.match(dateRegex)?.[1] || '0000-00-00';
                const dateB = b.match(dateRegex)?.[1] || '0000-00-00';
                return dateB.localeCompare(dateA); // Descending order
            });
            questionsFile = sortedFiles[0];
            console.log('Using most recent test file:', path.relative(questionsDir, questionsFile));
        }

        console.log(`Loading test file: ${questionsFile}`);
        console.log(`Questions directory: ${questionsDir}`);

        // Load the test data
        testData = await fs.readJson(questionsFile);
        console.log(`Successfully loaded test data from: ${path.relative(questionsDir, questionsFile)}`);
        console.log('Test data keys:', Object.keys(testData || {}));

        // Validate test data structure
        if (!testData) {
            throw new Error('Test data is null after loading');
        }

        if (!testData.sections) {
            throw new Error('Test data missing sections property');
        }

        console.log('Test data validation passed');
        console.log('=== loadTestData completed ===');

        return testData;
    } catch (error) {
        console.error('Error loading test data:', error);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

// Initialize test data (defaults to today or newest)
loadTestData().catch(console.error);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        testData: testData ? 'loaded' : 'not loaded',
        uptime: process.uptime()
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Cache busting endpoint
app.get('/api/cache-bust', (req, res) => {
    res.json({
        timestamp: Date.now(),
        message: 'Cache busted',
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Force reload endpoint
app.get('/api/force-reload', (req, res) => {
    res.json({
        timestamp: Date.now(),
        message: 'Force reload triggered',
        serverTime: new Date().toISOString()
    });
});


// Add headers to prevent service worker registration and improve security
app.use((req, res, next) => {
    // Block service worker registration
    res.setHeader('Service-Worker-Allowed', '');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Additional security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
});

// API endpoint to get test data
app.get('/api/test-data', async (req, res) => {
    try {
        console.log('API /api/test-data called');

        // Set a longer timeout for better user experience
        const timeout = setTimeout(() => {
            res.status(408).json({ error: 'Request timeout' });
        }, 15000); // Increased from 5 seconds to 15 seconds

        if (!testData) {
            clearTimeout(timeout);
            return res.status(500).json({ error: 'Test data not loaded' });
        }

        // Validate test data structure
        if (!testData.sections) {
            clearTimeout(timeout);
            return res.status(500).json({ error: 'Invalid test data structure' });
        }

        // Check if it's the new IELTS structure (array) or old structure (object)
        const isNewStructure = Array.isArray(testData.sections);
        const hasRequiredSections = isNewStructure ?
            testData.sections.some(s => ['listening', 'reading', 'writing', 'speaking'].includes(s.id)) :
            testData.sections.grammar || testData.sections.listening;

        if (!hasRequiredSections) {
            clearTimeout(timeout);
            return res.status(500).json({ error: 'Test data missing required sections' });
        }

        console.log('Test data loaded successfully, sending response');
        console.log('Test data structure:', {
            hasSections: !!testData.sections,
            sections: Array.isArray(testData.sections) ? testData.sections.map(s => s.id) : Object.keys(testData.sections),
            totalQuestions: testData.totalQuestions || 0
        });

        clearTimeout(timeout);
        res.json(testData);
    } catch (error) {
        console.error('Error serving test data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/test-data/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const data = await loadTestData(date);

        // Return the original data structure to match frontend expectations
        res.json(data);
    } catch (error) {
        console.error('Error serving test data for date:', error);
        res.status(404).json({ error: 'Test data not found for this date' });
    }
});

app.post('/api/submit-test', async (req, res) => {
    try {
        const { answers, timeSpent, userInfo, userName } = req.body;

        if (!testData) {
            await loadTestData();
        }

        // Calculate results (pass testData for maxBand)
        const results = calculateResults(answers, testData);

        // Create submission data (include full testData for PDF generation)
        const submission = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userInfo: userInfo || {},
            userName: userName || 'Anonymous',
            answers,
            results,
            timeSpent,
            testData: testData // Include full testData for PDF generation
        };

        // Create user-specific folder structure
        // Structure: {userName}/answers/{YYYY_MM_DD}/ (both JSON and PDF in same folder)
        const sanitizedUserName = userName ? userName.replace(/[^a-zA-Z0-9]/g, '_') : 'Anonymous';
        // const date = moment().format('YYYY_MM_DD'); // Use underscores for folder name (e.g., 2025_10_31)
        const date = '2025-11-25';
        const userDir = path.join(dataDir, sanitizedUserName);
        const answersDir = path.join(userDir, 'answers');
        const dateDir = path.join(answersDir, date); // Single folder for both JSON and PDF

        // Ensure directories exist
        await fs.ensureDir(userDir);
        await fs.ensureDir(answersDir);
        await fs.ensureDir(dateDir);
        console.log(`📁 Created directory structure: ${dateDir}`);

        // Create filename with timestamp in Y-m-d H:i:s format (using underscores and dashes instead of space and colons for filename compatibility)
        // Format: YYYY-MM-DD_HH-mm-ss (e.g., 2025-01-19_14-30-45)
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const jsonFilename = `${timestamp}.json`;
        const jsonFilepath = path.join(dateDir, jsonFilename);

        // Save to JSON file
        await fs.writeJson(jsonFilepath, submission, { spaces: 2 });
        console.log(`✅ JSON saved to: ${jsonFilepath}`);

        // Generate PDF with user-specific naming and save in same date folder
        let pdfPath = null;
        try {
            pdfPath = await generatePDF(submission, sanitizedUserName, timestamp, dateDir);
            console.log(`✅ PDF generated successfully: ${pdfPath}`);
        } catch (pdfError) {
            console.error('❌ Error generating PDF:', pdfError);
            console.error('PDF Error details:', pdfError.message);
            console.error('PDF Error stack:', pdfError.stack);
            // Don't fail the entire submission if PDF generation fails
            // PDF can be regenerated later
        }

        res.json({
            success: true,
            submissionId: submission.id,
            results,
            pdfUrl: pdfPath ? `/api/download-pdf/${submission.id}` : null,
            pdfGenerated: pdfPath !== null,
            userName: sanitizedUserName
        });

    } catch (error) {
        console.error('❌ Error submitting test:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Failed to submit test',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/api/download-pdf/:submissionId', (req, res) => {
    const { submissionId } = req.params;
    const pdfPath = path.join(__dirname, 'pdfs', `${submissionId}.pdf`);

    if (fs.existsSync(pdfPath)) {
        res.download(pdfPath);
    } else {
        res.status(404).json({ error: 'PDF not found' });
    }
});

// PDF generation endpoint
// Server-side PDF HTML generation function
function generatePDFHTML(userName, results, answers, testData) {
    const timestamp = new Date().toLocaleString();

    // Generate detailed question breakdown
    const listeningQuestions = generateListeningQuestionsHTML(testData, answers);
    const readingQuestions = generateReadingQuestionsHTML(testData, answers);
    const writingAnswers = generateWritingAnswersHTML(answers);
    const speakingAnswers = generateSpeakingAnswersHTML(answers);

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>IELTS Test Results - ${userName}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 2.5em;
                }
                .header p {
                    margin: 10px 0 0 0;
                    opacity: 0.9;
                }
                .overall-score {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin-bottom: 30px;
                    text-align: center;
                }
                .overall-score h2 {
                    color: #667eea;
                    margin-top: 0;
                }
                .band-score {
                    font-size: 3em;
                    font-weight: bold;
                    color: #667eea;
                    margin: 20px 0;
                }
                .section-scores {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .section-score {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                .section-score h3 {
                    color: #667eea;
                    margin-top: 0;
                }
                .score-value {
                    font-size: 2em;
                    font-weight: bold;
                    color: #333;
                }
                .band-value {
                    font-size: 1.5em;
                    color: #667eea;
                    margin-top: 10px;
                }
                .questions-section {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin-bottom: 30px;
                }
                .questions-section h3 {
                    color: #667eea;
                    margin-top: 0;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 10px;
                }
                .question-item {
                    margin-bottom: 20px;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #e5e7eb;
                }
                .question-item.correct {
                    background-color: #d4edda;
                    border-left-color: #28a745;
                }
                .question-item.incorrect {
                    background-color: #f8d7da;
                    border-left-color: #dc3545;
                }
                .question-item.unanswered {
                    background-color: #fff3cd;
                    border-left-color: #ffc107;
                }
                .question-text {
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #333;
                }
                .options {
                    margin-left: 20px;
                }
                .option {
                    margin-bottom: 5px;
                    padding: 5px 10px;
                    border-radius: 4px;
                }
                .option.correct {
                    background-color: #d4edda;
                    color: #155724;
                    font-weight: bold;
                }
                .option.incorrect {
                    background-color: #f8d7da;
                    color: #721c24;
                    font-weight: bold;
                }
                .option.user-answer {
                    background-color: #cce5ff;
                    color: #004085;
                    font-weight: bold;
                }
                .test-info {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin-bottom: 20px;
                }
                .footer {
                    text-align: center;
                    color: #666;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎓 IELTS Test Results</h1>
                <p>Test completed on ${timestamp}</p>
                <p>Candidate: ${userName}</p>
            </div>

            <div class="overall-score">
                <h2>Overall IELTS Band Score</h2>
                <div class="band-score">${results.overallCEFR ? results.overallCEFR : results.overallBand}</div>
                ${results.overallCEFR ? '<p style="color:#667eea; font-weight:bold;">CEFR Level</p>' : ''}
                <p>Total Raw Score: ${results.totalRawScore}/120</p>
            </div>

            <div class="section-scores">
                <div class="section-score">
                    <h3>🎧 Listening</h3>
                    <div class="score-value">${results.listening.score}/40</div>
                    <div class="band-value">Band ${results.listening.band}</div>
                </div>
                <div class="section-score">
                    <h3>📖 Reading</h3>
                    <div class="score-value">${results.reading.score}/40</div>
                    <div class="band-value">Band ${results.reading.band}</div>
                </div>
                <div class="section-score">
                    <h3>✏️ Writing</h3>
                    <div class="score-value">${results.writing.score}/20</div>
                    <div class="band-value">Band ${results.writing.band}</div>
                </div>
                <div class="section-score">
                    <h3>🗣️ Speaking</h3>
                    <div class="score-value">${results.speaking.score}/20</div>
                    <div class="band-value">Band ${results.speaking.band}</div>
                </div>
            </div>

            ${listeningQuestions}
            ${readingQuestions}
            ${writingAnswers}
            ${speakingAnswers}

            <div class="test-info">
                <h3>Test Information</h3>
                <p><strong>Test Date:</strong> ${timestamp}</p>
                <p><strong>Test Type:</strong> IELTS Practice Test</p>
                <p><strong>Total Questions:</strong> 120</p>
                <p><strong>Time Allocated:</strong> 3 hours 30 minutes</p>
            </div>

            <div class="footer">
                <p>Generated by IELTS Starter 1.0 - Practice Test System</p>
                <p>This is a practice test result. For official IELTS scores, please take the official IELTS test.</p>
            </div>
        </body>
        </html>
    `;
}

// Helper functions for generating question HTML
function generateListeningQuestionsHTML(testData, answers) {
    if (!testData || !testData.sections) return '';

    const listeningSection = testData.sections.find(s => s.id === 'listening');
    if (!listeningSection || !listeningSection.parts) return '';

    let html = '<div class="questions-section"><h3>🎧 Listening Section - Detailed Answers</h3>';

    listeningSection.parts.forEach((part, partIndex) => {
        if (part.questions) {
            html += `<h4>Part ${partIndex + 1}: ${part.title}</h4>`;

            part.questions.forEach((question, questionIndex) => {
                const questionId = question.id;
                const userAnswer = answers.listening ? answers.listening[questionId] : null;
                const correctAnswer = question.correctAnswer;
                const isCorrect = userAnswer === correctAnswer;
                const isAnswered = userAnswer !== null && userAnswer !== undefined;

                let questionClass = 'unanswered';
                if (isAnswered) {
                    questionClass = isCorrect ? 'correct' : 'incorrect';
                }

                html += `
                    <div class="question-item ${questionClass}">
                        <div class="question-text">Question ${questionIndex + 1}: ${question.questionText}</div>
                        <div class="options">
                `;

                question.options.forEach((option, optionIndex) => {
                    const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
                    let optionClass = '';

                    if (optionLetter === correctAnswer) {
                        optionClass = 'correct';
                    } else if (optionLetter === userAnswer) {
                        optionClass = 'incorrect';
                    }

                    html += `<div class="option ${optionClass}">${optionLetter}) ${option}</div>`;
                });

                html += `
                        </div>
                        <div style="margin-top: 10px; font-size: 0.9em;">
                            <strong>Your Answer:</strong> ${userAnswer || 'Not answered'} | 
                            <strong>Correct Answer:</strong> ${correctAnswer} | 
                            <strong>Status:</strong> ${isAnswered ? (isCorrect ? '✓ Correct' : '✗ Incorrect') : 'Not answered'}
                        </div>
                    </div>
                `;
            });
        }
    });

    html += '</div>';
    return html;
}

function generateReadingQuestionsHTML(testData, answers) {
    if (!testData || !testData.sections) return '';

    const readingSection = testData.sections.find(s => s.id === 'reading');
    if (!readingSection || !readingSection.passages) return '';

    let html = '<div class="questions-section"><h3>📖 Reading Section - Detailed Answers</h3>';

    readingSection.passages.forEach((passage, passageIndex) => {
        if (passage.questions) {
            html += `<h4>Passage ${passageIndex + 1}: ${passage.title}</h4>`;

            passage.questions.forEach((question, questionIndex) => {
                const questionId = question.id;
                const userAnswer = answers.reading ? answers.reading[questionId] : null;
                const correctAnswer = question.correctAnswer;
                const isCorrect = userAnswer === correctAnswer;
                const isAnswered = userAnswer !== null && userAnswer !== undefined;

                let questionClass = 'unanswered';
                if (isAnswered) {
                    questionClass = isCorrect ? 'correct' : 'incorrect';
                }

                html += `
                    <div class="question-item ${questionClass}">
                        <div class="question-text">Question ${questionIndex + 1}: ${question.questionText}</div>
                        <div class="options">
                `;

                question.options.forEach((option, optionIndex) => {
                    const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
                    let optionClass = '';

                    if (optionLetter === correctAnswer) {
                        optionClass = 'correct';
                    } else if (optionLetter === userAnswer) {
                        optionClass = 'incorrect';
                    }

                    html += `<div class="option ${optionClass}">${optionLetter}) ${option}</div>`;
                });

                html += `
                        </div>
                        <div style="margin-top: 10px; font-size: 0.9em;">
                            <strong>Your Answer:</strong> ${userAnswer || 'Not answered'} | 
                            <strong>Correct Answer:</strong> ${correctAnswer} | 
                            <strong>Status:</strong> ${isAnswered ? (isCorrect ? '✓ Correct' : '✗ Incorrect') : 'Not answered'}
                        </div>
                    </div>
                `;
            });
        }
    });

    html += '</div>';
    return html;
}

function generateWritingAnswersHTML(answers) {
    if (!answers.writing) return '';

    let html = '<div class="questions-section"><h3>✏️ Writing Section - Your Answers</h3>';

    if (answers.writing.task1) {
        html += `
            <div class="question-item">
                <div class="question-text">Task 1: Describe the chart/graph</div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>Word Count:</strong> ${answers.writing.task1WordCount || 0} words<br>
                    <strong>Your Answer:</strong><br>
                    <div style="margin-top: 10px; white-space: pre-wrap;">${answers.writing.task1 || 'No answer provided'}</div>
                </div>
            </div>
        `;
    }

    if (answers.writing.task2) {
        html += `
            <div class="question-item">
                <div class="question-text">Task 2: Essay</div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>Word Count:</strong> ${answers.writing.task2WordCount || 0} words<br>
                    <strong>Your Answer:</strong><br>
                    <div style="margin-top: 10px; white-space: pre-wrap;">${answers.writing.task2 || 'No answer provided'}</div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function generateSpeakingAnswersHTML(answers) {
    if (!answers.speaking) return '';

    let html = '<div class="questions-section"><h3>🗣️ Speaking Section - Your Answers</h3>';

    if (answers.speaking.part1) {
        html += `
            <div class="question-item">
                <div class="question-text">Part 1: Introduction and Interview</div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>Your Answer:</strong><br>
                    <div style="margin-top: 10px; white-space: pre-wrap;">${answers.speaking.part1 || 'No answer provided'}</div>
                </div>
            </div>
        `;
    }

    if (answers.speaking.part2) {
        html += `
            <div class="question-item">
                <div class="question-text">Part 2: Long Turn</div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>Your Answer:</strong><br>
                    <div style="margin-top: 10px; white-space: pre-wrap;">${answers.speaking.part2 || 'No answer provided'}</div>
                </div>
            </div>
        `;
    }

    if (answers.speaking.part3) {
        html += `
            <div class="question-item">
                <div class="question-text">Part 3: Discussion</div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>Your Answer:</strong><br>
                    <div style="margin-top: 10px; white-space: pre-wrap;">${answers.speaking.part3 || 'No answer provided'}</div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

app.post('/api/generate-pdf', async (req, res) => {
    let browser = null;
    try {
        const { userName, results, answers, testData, timestamp } = req.body;

        console.log('📄 /api/generate-pdf called with:', {
            userName,
            hasResults: !!results,
            hasAnswers: !!answers,
            hasTestData: !!testData,
            resultsKeys: results ? Object.keys(results) : null
        });

        if (!userName || !results || !answers || !testData) {
            console.error('❌ Missing required fields:', { userName: !!userName, results: !!results, answers: !!answers, testData: !!testData });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Sanitize username for file system
        const sanitizedUserName = userName.replace(/[^a-zA-Z0-9]/g, '_');
        const date = moment().format('YYYY_MM_DD'); // Folder: YYYY_MM_DD
        const timestampStr = timestamp ? moment(timestamp).format('YYYY-MM-DD_HH-mm-ss') : moment().format('YYYY-MM-DD_HH-mm-ss');

        // Create user-specific directory structure: data/{userName}/answers/{YYYY_MM_DD}/
        const userDir = path.join(dataDir, sanitizedUserName);
        const answersDir = path.join(userDir, 'answers');
        const dateDir = path.join(answersDir, date); // Single folder for both JSON and PDF

        console.log('📁 Creating directory structure:', { userDir, answersDir, dateDir });

        // Create directories
        await fs.ensureDir(userDir);
        await fs.ensureDir(answersDir);
        await fs.ensureDir(dateDir);
        console.log('✅ Directories created successfully');

        // Create submission object for consistency (include full testData for PDF generation)
        const submission = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userInfo: {},
            userName: userName,
            answers,
            results,
            timeSpent: 0,
            testData: testData // Include full testData for PDF generation
        };

        // Save answers JSON with correct filename: YYYY-MM-DD_HH-mm-ss.json
        const jsonFilename = `${timestampStr}.json`;
        const jsonFilePath = path.join(dateDir, jsonFilename);
        console.log('💾 Saving JSON to:', jsonFilePath);

        await fs.writeJson(jsonFilePath, submission, { spaces: 2 });
        console.log('✅ JSON saved successfully');

        // Generate HTML content using the submission-based function
        let htmlContent;
        try {
            htmlContent = generatePDFHTML(submission);
            console.log('✅ HTML content generated');
        } catch (htmlError) {
            console.error('❌ Error generating HTML:', htmlError);
            throw new Error(`Failed to generate HTML: ${htmlError.message}`);
        }

        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });

        // Generate PDF filename: YYYY-MM-DD_HH-mm-ss.pdf
        const pdfFilename = `${timestampStr}.pdf`;
        const pdfPath = path.join(dateDir, pdfFilename);
        console.log('📄 Generating PDF at:', pdfPath);

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true,
            timeout: 30000
        });

        // Save PDF to date directory
        await fs.writeFile(pdfPath, pdfBuffer);
        console.log('✅ PDF saved successfully');

        // Verify PDF was created
        const pdfExists = await fs.pathExists(pdfPath);
        if (pdfExists) {
            const stats = await fs.stat(pdfPath);
            console.log(`✅ PDF verified: ${pdfPath} (${stats.size} bytes)`);
        } else {
            console.error(`❌ PDF was not created at: ${pdfPath}`);
        }

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);

        // Send PDF buffer
        res.send(pdfBuffer);

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to generate PDF', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
    } finally {
        // Always close browser
        if (browser) {
            try {
                await browser.close();
                console.log('🔒 Browser closed');
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
    }
});

// Get user's test history
app.get('/api/user/:userName/tests', async (req, res) => {
    try {
        const { userName } = req.params;
        const sanitizedUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userDir = path.join(__dirname, 'user-data', sanitizedUserName);
        const answersDir = path.join(userDir, 'answers');

        if (!await fs.pathExists(answersDir)) {
            return res.json({ tests: [] });
        }

        const files = await fs.readdir(answersDir);
        const testFiles = files.filter(file => file.endsWith('.json'));

        const tests = [];
        for (const file of testFiles) {
            const filePath = path.join(answersDir, file);
            const testData = await fs.readJson(filePath);
            tests.push({
                timestamp: testData.timestamp,
                fileName: file,
                results: testData.results,
                overallBand: testData.results.overallBand
            });
        }

        // Sort by timestamp (newest first)
        tests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ tests });

    } catch (error) {
        console.error('Error retrieving user tests:', error);
        res.status(500).json({ error: 'Failed to retrieve user tests' });
    }
});

// Get specific test data for a user
app.get('/api/user/:userName/test/:timestamp', async (req, res) => {
    try {
        const { userName, timestamp } = req.params;
        const sanitizedUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userDir = path.join(__dirname, 'user-data', sanitizedUserName);
        const answersDir = path.join(userDir, 'answers');
        const filePath = path.join(answersDir, `answers_${timestamp}.json`);

        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const testData = await fs.readJson(filePath);
        res.json(testData);

    } catch (error) {
        console.error('Error retrieving test data:', error);
        res.status(500).json({ error: 'Failed to retrieve test data' });
    }
});

// Get user's PDF files
app.get('/api/user/:userName/pdfs', async (req, res) => {
    try {
        const { userName } = req.params;
        const sanitizedUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userDir = path.join(__dirname, 'user-data', sanitizedUserName);
        const pdfsDir = path.join(userDir, 'pdfs');

        if (!await fs.pathExists(pdfsDir)) {
            return res.json({ pdfs: [] });
        }

        const files = await fs.readdir(pdfsDir);
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));

        const pdfs = pdfFiles.map(file => {
            const timestamp = file.replace('IELTS_Test_Results_', '').replace('.pdf', '');
            return {
                fileName: file,
                timestamp: timestamp,
                downloadUrl: `/api/user/${userName}/pdf/${timestamp}`
            };
        });

        // Sort by timestamp (newest first)
        pdfs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ pdfs });

    } catch (error) {
        console.error('Error retrieving user PDFs:', error);
        res.status(500).json({ error: 'Failed to retrieve user PDFs' });
    }
});

// Download specific PDF for a user
app.get('/api/user/:userName/pdf/:timestamp', async (req, res) => {
    try {
        const { userName, timestamp } = req.params;
        const sanitizedUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userDir = path.join(__dirname, 'user-data', sanitizedUserName);
        const pdfsDir = path.join(userDir, 'pdfs');
        const pdfPath = path.join(pdfsDir, `IELTS_Test_Results_${timestamp}.pdf`);

        if (!await fs.pathExists(pdfPath)) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        res.download(pdfPath);

    } catch (error) {
        console.error('Error downloading PDF:', error);
        res.status(500).json({ error: 'Failed to download PDF' });
    }
});

// Admin routes for managing questions
app.get('/api/questions/list', async (req, res) => {
    try {
        const files = await fs.readdir(questionsDir);
        const questionFiles = files.filter(file => file.endsWith('.json'));

        const questionSets = [];
        for (const file of questionFiles) {
            const filePath = path.join(questionsDir, file);
            const data = await fs.readJson(filePath);
            questionSets.push({
                filename: file,
                testId: data.testId,
                testDate: data.testDate,
                testTitle: data.testTitle,
                totalQuestions: data.totalQuestions,
                lastModified: (await fs.stat(filePath)).mtime
            });
        }

        res.json(questionSets);
    } catch (error) {
        console.error('Error listing question files:', error);
        res.status(500).json({ error: 'Failed to list question files' });
    }
});

app.post('/api/questions/upload', async (req, res) => {
    try {
        const { testData, filename } = req.body;

        if (!testData || !filename) {
            return res.status(400).json({ error: 'Missing test data or filename' });
        }

        const filePath = path.join(questionsDir, filename);
        await fs.writeJson(filePath, testData, { spaces: 2 });

        res.json({ success: true, message: 'Question file uploaded successfully' });
    } catch (error) {
        console.error('Error uploading question file:', error);
        res.status(500).json({ error: 'Failed to upload question file' });
    }
});

// Writing Assessment API Endpoints
app.post('/api/writing/check', async (req, res) => {
    try {
        const { text, taskType, wordLimit } = req.body;

        console.log('Writing check request:', { text: text?.substring(0, 100) + '...', taskType, wordLimit });

        if (!text || !taskType) {
            console.log('Missing required fields:', { text: !!text, taskType: !!taskType });
            return res.status(400).json({ error: 'Missing text or task type' });
        }

        // Check if writingChecker is properly initialized
        if (!writingChecker) {
            console.error('WritingChecker not initialized');
            return res.status(500).json({ error: 'Writing checker not available' });
        }

        // Check writing using the WritingChecker
        const results = writingChecker.checkWriting(text, taskType, wordLimit);
        const detailedFeedback = writingChecker.generateDetailedFeedback(results);

        console.log('Writing check completed successfully');

        res.json({
            success: true,
            results,
            feedback: detailedFeedback
        });
    } catch (error) {
        console.error('Error checking writing:', error);
        res.status(500).json({ error: 'Failed to check writing: ' + error.message });
    }
});

app.post('/api/writing/check-all', async (req, res) => {
    try {
        const { writingAnswers, testDate } = req.body;

        if (!writingAnswers) {
            return res.status(400).json({ error: 'Missing writing answers' });
        }

        // Load test data to get task information
        const testData = await loadTestData(testDate);
        if (!testData) {
            return res.status(404).json({ error: 'Test data not found' });
        }

        const writingResults = {};
        const overallWritingScore = {
            total: 0,
            count: 0,
            average: 0
        };

        // Check each writing task
        for (const [taskKey, text] of Object.entries(writingAnswers)) {
            if (text && text.trim()) {
                const task = testData.sections.writing.tasks.find(t => t.id === parseInt(taskKey.replace('task', '')));
                if (task) {
                    const results = writingChecker.checkWriting(text, task.type, task.wordLimit);
                    writingResults[taskKey] = {
                        taskId: task.id,
                        taskTitle: task.title,
                        results,
                        feedback: writingChecker.generateDetailedFeedback(results)
                    };

                    overallWritingScore.total += results.overall.score;
                    overallWritingScore.count++;
                }
            }
        }

        // Calculate average score
        if (overallWritingScore.count > 0) {
            overallWritingScore.average = Math.round(overallWritingScore.total / overallWritingScore.count);
        }

        res.json({
            success: true,
            writingResults,
            overallWritingScore
        });
    } catch (error) {
        console.error('Error checking all writing tasks:', error);
        res.status(500).json({ error: 'Failed to check writing tasks' });
    }
});

app.get('/api/writing/sample-feedback', async (req, res) => {
    try {
        const { taskType } = req.query;

        if (!taskType) {
            return res.status(400).json({ error: 'Missing task type' });
        }

        // Generate sample feedback for the task type
        const sampleText = getSampleText(taskType);
        const results = writingChecker.checkWriting(sampleText, taskType);
        const feedback = writingChecker.generateDetailedFeedback(results);

        res.json({
            success: true,
            sampleText,
            results,
            feedback
        });
    } catch (error) {
        console.error('Error generating sample feedback:', error);
        res.status(500).json({ error: 'Failed to generate sample feedback' });
    }
});

// IELTS Band Score Conversion Functions
function convertToIELTSBand(rawScore, section, totalQuestions, maxBand = 9) {
    const percentage = (rawScore / totalQuestions) * 100;
    let baseBand = 0.0; // Band calculated on 0-9 scale

    switch (section) {
        case 'listening':
            // IELTS Listening: 40 questions total
            // Band 5: 16/40, Band 6: 23/40, Band 7: 30/40, Band 8: 35/40
            if (percentage >= 87.5) baseBand = 9.0;
            else if (percentage >= 82.5) baseBand = 8.5;
            else if (percentage >= 77.5) baseBand = 8.0;
            else if (percentage >= 72.5) baseBand = 7.5;
            else if (percentage >= 67.5) baseBand = 7.0;
            else if (percentage >= 62.5) baseBand = 6.5;
            else if (percentage >= 57.5) baseBand = 6.0;
            else if (percentage >= 52.5) baseBand = 5.5;
            else if (percentage >= 47.5) baseBand = 5.0;
            else if (percentage >= 42.5) baseBand = 4.5;
            else if (percentage >= 37.5) baseBand = 4.0;
            else baseBand = 3.5;
            break;

        case 'reading':
            // IELTS Reading Academic: 40 questions total
            // Band 5: 15/40, Band 6: 23/40, Band 7: 30/40, Band 8: 35/40
            if (percentage >= 87.5) baseBand = 9.0;
            else if (percentage >= 82.5) baseBand = 8.5;
            else if (percentage >= 77.5) baseBand = 8.0;
            else if (percentage >= 72.5) baseBand = 7.5;
            else if (percentage >= 67.5) baseBand = 7.0;
            else if (percentage >= 62.5) baseBand = 6.5;
            else if (percentage >= 57.5) baseBand = 6.0;
            else if (percentage >= 52.5) baseBand = 5.5;
            else if (percentage >= 47.5) baseBand = 5.0;
            else if (percentage >= 42.5) baseBand = 4.5;
            else if (percentage >= 37.5) baseBand = 4.0;
            else baseBand = 3.5;
            break;

        case 'writing':
            // IELTS Writing: Based on 4 criteria, each scored 0-9
            // Simplified conversion for our system
            if (percentage >= 90) baseBand = 9.0;
            else if (percentage >= 80) baseBand = 8.0;
            else if (percentage >= 70) baseBand = 7.0;
            else if (percentage >= 60) baseBand = 6.0;
            else if (percentage >= 50) baseBand = 5.0;
            else if (percentage >= 40) baseBand = 4.0;
            else baseBand = 3.0;
            break;

        case 'speaking':
            // IELTS Speaking: Based on 4 criteria (fluency, coherence, lexical resource, grammar, pronunciation)
            if (percentage >= 90) baseBand = 9.0;
            else if (percentage >= 80) baseBand = 8.0;
            else if (percentage >= 70) baseBand = 7.0;
            else if (percentage >= 60) baseBand = 6.0;
            else if (percentage >= 50) baseBand = 5.0;
            else if (percentage >= 40) baseBand = 4.0;
            else baseBand = 3.0;
            break;

        case 'grammar':
            // Grammar: 20 questions total
            if (percentage >= 90) baseBand = 9.0;
            else if (percentage >= 80) baseBand = 8.0;
            else if (percentage >= 70) baseBand = 7.0;
            else if (percentage >= 60) baseBand = 6.0;
            else if (percentage >= 50) baseBand = 5.0;
            else if (percentage >= 40) baseBand = 4.0;
            else baseBand = 3.0;
            break;

        default:
            baseBand = 0.0;
    }

    // Scale the band score to the maxBand specified in JSON (e.g., if maxBand is 4, scale 9.0 to 4.0)
    // Formula: scaledBand = (baseBand / 9.0) * maxBand
    const scaledBand = (baseBand / 9.0) * maxBand;

    // Round to nearest 0.1 for precision (e.g., 3.5, 3.6, 3.7, 4.0)
    return Math.round(scaledBand * 10) / 10;
}

function calculateOverallBandScore(listeningBand, readingBand, writingBand, speakingBand, grammarBand) {
    // Calculate overall band score (average of tested sections only)
    // Exclude speaking if it's 0 (not tested)
    const bands = [listeningBand, readingBand, writingBand, grammarBand];
    if (speakingBand > 0) {
        bands.push(speakingBand);
    }

    const total = bands.reduce((sum, band) => sum + band, 0);
    const average = total / bands.length;

    // Round to nearest 0.1 for precision (e.g., 3.5, 3.6, 3.7, 4.0)
    return Math.round(average * 10) / 10;
}

// Helper functions
function calculateResults(answers, testData = null) {
    let listeningScore = 0;
    let readingScore = 0;
    let writingScore = 0;
    let speakingScore = 0;
    let translationPenalty = 0;

    if (!testData) {
        return {
            listening: 0, reading: 0, writing: 0, speaking: 0, total: 0,
            listeningTotal: 40, readingTotal: 40, writingTotal: 20, speakingTotal: 20,
            translationPenalty: 0,
            bands: { listening: 0, reading: 0, writing: 0, speaking: 0, overall: 0 }
        };
    }

    // Calculate listening score (40 questions - 1 point per question)
    if (answers.listening) {
        // Get all listening questions from all parts
        const listeningSection = testData.sections.find(s => s.id === 'listening');
        const allListeningQuestions = [];
        if (listeningSection && listeningSection.parts) {
            listeningSection.parts.forEach(part => {
                if (part.questions) {
                    allListeningQuestions.push(...part.questions);
                }
            });
        }

        Object.entries(answers.listening).forEach(([questionId, selectedOption]) => {
            const question = allListeningQuestions.find(q => q.id === questionId);
            console.log(`Listening Q${questionId}: selected=${selectedOption}, correct=${question?.correctAnswer}, match=${question ? (selectedOption === question.correctAnswer) : 'NO QUESTION FOUND'}`);
            if (question) {
                const isTranslated = answers.translatedQuestions && answers.translatedQuestions.includes(questionId);
                const isCorrect = selectedOption === question.correctAnswer;

                if (isTranslated) {
                    // Translation used: 0.5 penalty, then 0.5 for wrong answer
                    if (isCorrect) {
                        listeningScore += 0.5; // 1 point - 0.5 translation penalty
                    } else {
                        listeningScore += 0; // 0 points - 0.5 translation penalty - 0.5 wrong answer
                    }
                    translationPenalty += 0.5;
                } else {
                    // No translation: 1 point for correct, 0 for wrong
                    if (isCorrect) {
                        listeningScore += 1;
                    } else {
                        listeningScore += 0;
                    }
                }
            }
        });
    }

    // Calculate reading score (30 questions - 1 point per question)
    if (answers.reading) {
        // Get all reading questions from all passages
        const readingSection = testData.sections.find(s => s.id === 'reading');
        const allReadingQuestions = [];
        if (readingSection && readingSection.passages) {
            readingSection.passages.forEach(passage => {
                if (passage.questions) {
                    allReadingQuestions.push(...passage.questions);
                }
            });
        }

        Object.entries(answers.reading).forEach(([questionId, selectedOption]) => {
            const question = allReadingQuestions.find(q => q.id === questionId);
            console.log(`Reading Q${questionId}: selected=${selectedOption}, correct=${question?.correctAnswer}, match=${question ? (selectedOption === question.correctAnswer) : 'NO QUESTION FOUND'}`);
            if (question) {
                const isTranslated = answers.translatedQuestions && answers.translatedQuestions.includes(questionId);
                const isCorrect = selectedOption === question.correctAnswer;

                if (isTranslated) {
                    // Translation used: 0.5 penalty, then 0.5 for wrong answer
                    if (isCorrect) {
                        readingScore += 0.5; // 1 point - 0.5 translation penalty
                    } else {
                        readingScore += 0; // 0 points - 0.5 translation penalty - 0.5 wrong answer
                    }
                    translationPenalty += 0.5;
                } else {
                    // No translation: 1 point for correct, 0 for wrong
                    if (isCorrect) {
                        readingScore += 1;
                    } else {
                        readingScore += 0;
                    }
                }
            }
        });
    }

    // Calculate writing score (2 tasks - 10 points each)
    if (answers.writing) {
        Object.entries(answers.writing).forEach(([taskKey, text]) => {
            if (text && text.trim().length > 0) {
                const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                const wordCount = words.length;

                // Word count scoring for IELTS Writing
                let taskScore = 0;
                if (taskKey === 'task1') {
                    // Task 1: 150 words minimum
                    if (wordCount >= 150) {
                        taskScore = 10; // Full points for 150+ words
                    } else if (wordCount >= 100) {
                        taskScore = 7; // Partial points for 100-149 words
                    } else if (wordCount >= 50) {
                        taskScore = 4; // Some points for 50-99 words
                    } else {
                        taskScore = 0; // No points for less than 50 words
                    }
                } else if (taskKey === 'task2') {
                    // Task 2: 250 words minimum
                    if (wordCount >= 250) {
                        taskScore = 10; // Full points for 250+ words
                    } else if (wordCount >= 200) {
                        taskScore = 8; // Good points for 200-249 words
                    } else if (wordCount >= 150) {
                        taskScore = 6; // Partial points for 150-199 words
                    } else if (wordCount >= 100) {
                        taskScore = 4; // Some points for 100-149 words
                    } else {
                        taskScore = 0; // No points for less than 100 words
                    }
                }

                writingScore += taskScore;
            }
        });
    }

    // Calculate speaking score (3 parts - based on content quality)
    if (answers.speaking) {
        Object.entries(answers.speaking).forEach(([partKey, text]) => {
            if (text && text.trim().length > 0) {
                const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                const wordCount = words.length;

                // Speaking scoring based on content length and quality
                let partScore = 0;
                if (partKey === 'part1') {
                    // Part 1: Short answers
                    if (wordCount >= 50) {
                        partScore = 7; // Good response
                    } else if (wordCount >= 30) {
                        partScore = 5; // Adequate response
                    } else if (wordCount >= 15) {
                        partScore = 3; // Basic response
                    } else {
                        partScore = 0; // Insufficient response
                    }
                } else if (partKey === 'part2') {
                    // Part 2: Long turn (1-2 minutes)
                    if (wordCount >= 200) {
                        partScore = 7; // Excellent long turn
                    } else if (wordCount >= 150) {
                        partScore = 5; // Good long turn
                    } else if (wordCount >= 100) {
                        partScore = 3; // Adequate long turn
                    } else {
                        partScore = 0; // Insufficient long turn
                    }
                } else if (partKey === 'part3') {
                    // Part 3: Discussion
                    if (wordCount >= 150) {
                        partScore = 6; // Good discussion
                    } else if (wordCount >= 100) {
                        partScore = 4; // Adequate discussion
                    } else if (wordCount >= 50) {
                        partScore = 2; // Basic discussion
                    } else {
                        partScore = 0; // Insufficient discussion
                    }
                }

                speakingScore += partScore;
            }
        });
    }

    // Calculate grammar score (20 questions - 1 point per question)
    let grammarScore = 0;
    if (answers.grammar) {
        // Get grammar questions
        const grammarSection = testData.sections.find(s => s.id === 'grammar');
        const grammarQuestions = grammarSection ? grammarSection.questions : [];

        Object.entries(answers.grammar).forEach(([questionId, selectedOption]) => {
            const question = grammarQuestions.find(q => q.id === questionId);
            console.log(`Grammar Q${questionId}: selected=${selectedOption}, correct=${question?.correctAnswer}, match=${question ? (selectedOption === question.correctAnswer) : 'NO QUESTION FOUND'}`);
            if (question) {
                const isTranslated = answers.translatedQuestions && answers.translatedQuestions.includes(questionId);
                const isCorrect = selectedOption === question.correctAnswer;

                if (isTranslated) {
                    // Translation used: 0.5 penalty, then 0.5 for wrong answer
                    if (isCorrect) {
                        grammarScore += 0.5; // 1 point - 0.5 translation penalty
                    } else {
                        grammarScore += 0; // 0 points - 0.5 translation penalty - 0.5 wrong answer
                    }
                    translationPenalty += 0.5;
                } else {
                    // No translation: 1 point for correct, 0 for wrong
                    if (isCorrect) {
                        grammarScore += 1;
                    } else {
                        grammarScore += 0;
                    }
                }
            }
        });
    }

    // Calculate total translation penalty
    if (answers.translationPenalties) {
        // Sum all penalties from the translationPenalties object
        const penaltySum = Object.values(answers.translationPenalties).reduce((sum, penalty) => sum + penalty, 0);
        translationPenalty += penaltySum;
    }

    // Get maxBand from testData (defaults to 9 if not specified)
    const maxBand = (testData && testData.maxBand) ? testData.maxBand : 9;

    // Calculate IELTS Band Scores (scaled to maxBand)
    const listeningBand = convertToIELTSBand(listeningScore, 'listening', 40, maxBand);
    const readingBand = convertToIELTSBand(readingScore, 'reading', 30, maxBand);
    const writingBand = convertToIELTSBand(writingScore, 'writing', 20, maxBand);
    const speakingBand = convertToIELTSBand(speakingScore, 'speaking', 20, maxBand);
    const grammarBand = convertToIELTSBand(grammarScore, 'grammar', 20, maxBand);
    const overallBand = calculateOverallBandScore(listeningBand, readingBand, writingBand, speakingBand, grammarBand);

    const totalScore = listeningScore + readingScore + writingScore + speakingScore + grammarScore;

    // Define section totals (can be updated if more questions are added)
    const listeningTotal = 40; // 40 listening questions
    const readingTotal = 30; // 30 reading questions
    const writingTotal = 20; // 20 writing points (10 per task)
    const speakingTotal = 20; // 20 speaking points
    const grammarTotal = 20; // 20 grammar questions [ASSUMPTION based on convertToIELTSBand]

    // Calculate Overall Percentage (for CEFR)
    const totalQuestions = listeningTotal + readingTotal + writingTotal + speakingTotal + grammarTotal;
    // Note: totalQuestions above is a mix of question counts and max scores. 
    // Ideally we should sum the raw scores and max possible raw scores.

    const maxRawScore = listeningTotal + readingTotal + writingTotal + speakingTotal + grammarTotal;
    const totalPercentage = (totalScore / maxRawScore) * 100;

    let overallCEFR = null;
    let sectionCEFR = {};

    if (testData && testData.cefrLevel) {
        const targetLevel = testData.cefrLevel;

        // internal helper for CEFR
        const getCefr = (pct, target) => {
            if (target === 'B1') {
                if (pct >= 85) return 'B1';
                if (pct >= 50) return 'A2';
                return 'A1';
            }
            if (target === 'A2') {
                if (pct >= 80) return 'A2';
                return 'A1';
            }
            return null;
        };

        overallCEFR = getCefr(totalPercentage, targetLevel);
        sectionCEFR = {
            listening: getCefr((listeningScore / listeningTotal) * 100, targetLevel),
            reading: getCefr((readingScore / readingTotal) * 100, targetLevel),
            writing: getCefr((writingScore / writingTotal) * 100, targetLevel),
            speaking: getCefr((speakingScore / speakingTotal) * 100, targetLevel),
            grammar: getCefr((grammarScore / grammarTotal) * 100, targetLevel),
        };
    }

    const cappedTotal = Math.min(100, Math.max(0, Math.round(totalPercentage * 100) / 100));

    return {
        listening: { score: Math.round(listeningScore * 100) / 100, band: listeningBand, cefr: sectionCEFR.listening },
        reading: { score: Math.round(readingScore * 100) / 100, band: readingBand, cefr: sectionCEFR.reading },
        writing: { score: Math.round(writingScore * 100) / 100, band: writingBand, cefr: sectionCEFR.writing },
        speaking: { score: Math.round(speakingScore * 100) / 100, band: speakingBand, cefr: sectionCEFR.speaking },
        grammar: { score: Math.round(grammarScore * 100) / 100, band: grammarBand, cefr: sectionCEFR.grammar },
        total: cappedTotal,
        totalRawScore: totalScore,
        listeningTotal: listeningTotal,
        readingTotal: readingTotal,
        writingTotal: writingTotal,
        speakingTotal: speakingTotal,
        grammarTotal: grammarTotal,
        translationPenalty: Math.round(translationPenalty * 100) / 100,
        overallBand: overallBand,
        overallCEFR: overallCEFR,
        bands: {
            listening: listeningBand,
            reading: readingBand,
            writing: writingBand,
            speaking: speakingBand,
            grammar: grammarBand,
            overall: overallBand,
            overallCEFR: overallCEFR,
            sectionCEFR: sectionCEFR
        }
    };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function generatePDF(submission, userName, timestamp, dateDir) {
    let browser = null;
    try {
        // Use the dateDir provided (folder structure: {userName}/pdfs/{YYYY-MM-DD}/)
        // If dateDir is not provided, fallback to old location
        const pdfsDir = dateDir || path.join(__dirname, 'pdfs');
        await fs.ensureDir(pdfsDir);
        console.log(`📁 PDF directory: ${pdfsDir}`);

        // Verify directory was created
        const dirExists = await fs.pathExists(pdfsDir);
        if (!dirExists) {
            throw new Error(`Failed to create PDF directory: ${pdfsDir}`);
        }

        // Generate HTML content
        console.log('📝 Generating HTML content for PDF...');
        let htmlContent;
        try {
            htmlContent = generatePDFHTML(submission);
            console.log('✅ HTML content generated successfully');
        } catch (htmlError) {
            console.error('❌ Error generating HTML content:', htmlError);
            throw new Error(`Failed to generate HTML: ${htmlError.message}`);
        }

        // Launch browser
        console.log('🌐 Launching browser for PDF generation...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        console.log('📄 Loading HTML content into browser...');
        await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });

        // Generate PDF filename in Y-m-d H:i:s format (using dashes instead of colons for Windows compatibility)
        // Format: YYYY-MM-DD_HH-mm-ss.pdf
        const pdfFilename = `${timestamp}.pdf`;
        const pdfPath = path.join(pdfsDir, pdfFilename);

        console.log(`📄 Generating PDF at: ${pdfPath}`);

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true,
            timeout: 30000
        });

        console.log('✅ PDF file created, closing browser...');

        // Verify PDF was created
        const pdfExists = await fs.pathExists(pdfPath);
        if (pdfExists) {
            const stats = await fs.stat(pdfPath);
            console.log(`✅ PDF successfully saved: ${pdfPath} (${stats.size} bytes)`);
            return pdfPath;
        } else {
            throw new Error(`PDF file was not created at: ${pdfPath}`);
        }

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        console.error('Error stack:', error.stack);
        throw error;
    } finally {
        // Always close browser
        if (browser) {
            try {
                await browser.close();
                console.log('🔒 Browser closed');
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
    }
}

function generatePDFHTML(submission) {
    const { results, answers, testData: submissionTestData } = submission;

    // Debug logging
    console.log('PDF Generation - submission:', JSON.stringify(submission, null, 2));
    console.log('PDF Generation - results:', JSON.stringify(results, null, 2));

    // Use testData from submission (which now includes full testData), fallback to global testData
    const currentTestData = submissionTestData || testData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>IELTS Test Results - ${submission.id}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .results-summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .result-item { display: flex; justify-content: space-between; margin: 10px 0; }
            .total { font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 10px; }
            .section { margin-bottom: 40px; }
            .section h2 { color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
            .question { margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .question-number { background: #2563eb; color: white; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-bottom: 10px; }
            .option { margin: 5px 0; padding: 8px; border-radius: 4px; }
            .correct { background: #d1fae5; border: 2px solid #10b981; }
            .incorrect { background: #fee2e2; border: 2px solid #ef4444; }
            .selected { background: #fef2f2; border: 2px solid #ef4444; }
            .writing-task { margin-bottom: 30px; }
            .writing-content { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; white-space: pre-wrap; }
            .passage { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb; }
            .chart { margin: 20px 0; }
            .bar { background: #2563eb; color: white; padding: 10px; margin: 5px 0; border-radius: 4px; }
            .script { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb; }
            .pie-chart { margin: 20px 0; }
            .pie-item { display: flex; justify-content: space-between; padding: 8px; margin: 5px 0; background: #e2e8f0; border-radius: 4px; }
            .pie-item:nth-child(odd) { background: #f1f5f9; }
            .pie-item span:first-child { font-weight: bold; }
            .pie-item span:last-child { color: #2563eb; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${currentTestData.testTitle} - Test Results</h1>
            <p>Submission ID: ${submission.id}</p>
            <p>Test Date: ${currentTestData.testDate}</p>
            <p>Submission Date: ${moment(submission.timestamp).format('MMMM Do YYYY, h:mm:ss a')}</p>
        </div>
        
        <div class="results-summary">
            <h2>Test Summary</h2>
            <div class="result-item">
                <span>Grammar & Vocabulary:</span>
                <span>${results.grammar || 0}/${results.grammarTotal || 20} (Band ${results.bands?.grammar || 0})</span>
            </div>
            <div class="result-item">
                <span>Reading:</span>
                <span>${results.reading || 0}/${results.readingTotal || 30} (Band ${results.bands?.reading || 0})</span>
            </div>
            <div class="result-item">
                <span>Listening:</span>
                <span>${results.listening || 0}/${results.listeningTotal || 40} (Band ${results.bands?.listening || 0})</span>
            </div>
            <div class="result-item">
                <span>Writing:</span>
                <span>${results.writing || 0}/${results.writingTotal || 20} (Band ${results.bands?.writing || 0})</span>
            </div>
            <div class="result-item total">
                <span>Overall IELTS Band Score:</span>
                <span>${results.bands?.overall || 0}</span>
            </div>
            <div class="result-item">
                <span>Total Raw Score:</span>
                <span>${results.total || 0}/100</span>
            </div>
            <div class="result-item">
                <span>Time Spent:</span>
                <span>${submission.timeSpent || 'N/A'}</span>
            </div>
        </div>
        
        <div class="section">
            ${(() => {
            const grammarSection = currentTestData.sections.find(s => s.id === 'grammar');
            if (!grammarSection || !grammarSection.questions) return '';

            return `
                    <h2>${grammarSection.title || 'Grammar & Language Use'}</h2>
                    ${grammarSection.questions.map((q, qIndex) => {
                const selected = answers.grammar && answers.grammar[q.id];
                // Convert letter answer (A, B, C, D) to index (0, 1, 2, 3)
                const correctIndex = q.correctAnswer ? q.correctAnswer.charCodeAt(0) - 65 : -1;
                const selectedIndex = selected ? selected.charCodeAt(0) - 65 : -1;
                const isCorrect = selected === q.correctAnswer;

                return `
                            <div class="question">
                                <div class="question-number">Question ${qIndex + 1}</div>
                                <div class="question-text">${q.questionText || q.question}</div>
                                <div class="options">
                                    ${q.options.map((option, index) => {
                    let className = 'option';
                    if (index === correctIndex) className += ' correct';
                    if (index === selectedIndex && !isCorrect) className += ' incorrect';
                    if (index === selectedIndex) className += ' selected';

                    return `<div class="${className}">${option}</div>`;
                }).join('')}
                                </div>
                                ${q.explanation ? `<div class="explanation"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
                            </div>
                        `;
            }).join('')}
                `;
        })()}
        </div>
        
        <div class="section">
            ${(() => {
            const readingSection = currentTestData.sections.find(s => s.id === 'reading');
            if (!readingSection || !readingSection.passages) return '';

            return `
                    <h2>${readingSection.title}</h2>
                    ${readingSection.passages.map((passage, passageIndex) => `
                <div class="passage">
                    <h3>${passage.title}</h3>
                    <p>${passage.content}</p>
                </div>
                
                ${passage.questions.map(q => {
                const selected = answers.reading && answers.reading[q.id];
                const correctAnswer = q.correctAnswer;
                const isCorrect = selected === correctAnswer;

                return `
                        <div class="question">
                            <div class="question-number">Question ${q.id}</div>
                            <div class="question-text">${q.questionText || q.question}</div>
                            <div class="options">
                                ${q.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    let className = 'option';
                    if (optionLetter === correctAnswer) className += ' correct';
                    if (optionLetter === selected && !isCorrect) className += ' incorrect';
                    if (optionLetter === selected) className += ' selected';

                    return `<div class="${className}">${optionLetter}) ${option}</div>`;
                }).join('')}
                            </div>
                        </div>
                    `;
            }).join('')}
                    `).join('')}
                `;
        })()}
        </div>
        
        <div class="section">
            ${(() => {
            const listeningSection = currentTestData.sections.find(s => s.id === 'listening');
            if (!listeningSection || !listeningSection.parts) return '';

            return `
                    <h2>${listeningSection.title}</h2>
                    ${listeningSection.parts.map((part, partIndex) => {
                if (!part.questions) return '';

                return `
                            <div class="script">
                                <h3>${part.title || `Part ${partIndex + 1}`}</h3>
                                ${part.script ? `<p><strong>Script:</strong> ${JSON.stringify(part.script).substring(0, 200)}...</p>` : ''}
                            </div>
                            
                            ${part.questions.map(q => {
                    const selected = answers.listening && answers.listening[q.id];
                    const correctAnswer = q.correctAnswer;
                    const isCorrect = selected === correctAnswer;

                    return `
                                    <div class="question">
                                        <div class="question-number">Question ${q.id}</div>
                                        <div class="question-text">${q.questionText || q.question}</div>
                                        <div class="options">
                                            ${q.options.map((option, index) => {
                        const optionLetter = String.fromCharCode(65 + index);
                        let className = 'option';
                        if (optionLetter === correctAnswer) className += ' correct';
                        if (optionLetter === selected && !isCorrect) className += ' incorrect';
                        if (optionLetter === selected) className += ' selected';

                        return `<div class="${className}">${optionLetter}) ${option}</div>`;
                    }).join('')}
                                        </div>
                                    </div>
                                `;
                }).join('')}
                        `;
            }).join('')}
                `;
        })()}
        </div>
        
        <div class="section">
            ${(() => {
            const writingSection = currentTestData.sections.find(s => s.id === 'writing');
            if (!writingSection || !writingSection.tasks) return '';

            return `
                    <h2>${writingSection.title}</h2>
                    ${writingSection.tasks.map((task, index) => {
                // Get the correct task key from answers - frontend stores as 'task1', 'task2', 'task3'
                const taskKey = `task${index + 1}`;
                const writingAnswer = answers.writing && answers.writing[taskKey];

                return `
                    <div class="writing-task">
                        <h3>${task.title}</h3>
                        <p><strong>Prompt:</strong> ${task.instruction}</p>
                        ${task.chartData && task.type !== 'data_description' ? `
                            <div class="chart">
                                <h4>${task.chartData.title || 'Chart Data'}</h4>
                                ${(task.chartData.data || []).map(item => `
                                    <div class="bar" style="width: ${item.percentage || 0}%">${item.activity || item.method || 'Unknown'} - ${item.percentage || 0}%</div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${task.type === 'data_description' && task.chartData && task.chartData.data ? `
                            <div class="pie-chart">
                                <h4>${task.chartData.title || 'Chart Data'}</h4>
                                ${task.chartData.data.map(item => `
                                    <div class="pie-item">
                                        <span>${item.activity || item.method || 'Unknown'}</span>
                                        <span>${item.percentage || 0}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        <div class="writing-content">
                            ${writingAnswer && writingAnswer.trim() ? writingAnswer : 'No response provided'}
                        </div>
                    </div>
                `;
            }).join('')}
                `;
        })()}
        </div>
    </body>
    </html>
    `;
}

// Helper function to get sample text for different task types
function getSampleText(taskType) {
    const samples = {
        thank_you_note: `Dear neighbor,

Thank you so much for watering my plants while i was away. i really appreciate your help and kindness. The plants look great and healthy.

As a small token of my gratitude, i would like to offer you a gift. Please let me know when would be convenient for you to receive it.

Best regards,
Your neighbor`,

        opinion_essay: `I agree that mobile phones should be switched off during family meals. This rule helps families spend quality time together without distractions.

One reason i support this is that it encourages better communication. When phones are off, family members can have meaningful conversations and share their daily experiences. For example, my family implemented this rule last year, and we now have much better discussions during dinner.

However, there is one disadvantage: some people might miss important calls or messages. This could be problematic in emergency situations.`,

        data_description: `The chart shows the favorite free-time activities of 100 adults. Watching movies is the most popular activity, with 40% of people choosing this option. Exercising comes second with 30%, followed by reading books at 20%. Playing video games is the least popular activity with only 10%.

The data indicates that passive entertainment like watching movies is more popular than active pursuits. However, exercising still represents a significant portion of people's leisure time, showing that many adults value physical activity.`
    };

    return samples[taskType] || samples.thank_you_note;
}

// Test grading system endpoint
app.get('/api/test-grading', (req, res) => {
    try {
        // Create sample test data for grading verification
        const sampleTestData = {
            sections: {
                grammar: {
                    questions: [
                        { id: 1, correct: 0 },
                        { id: 2, correct: 1 },
                        { id: 3, correct: 2 },
                        { id: 4, correct: 3 },
                        { id: 5, correct: 0 }
                    ]
                },
                reading: {
                    passages: [
                        {
                            questions: [
                                { id: 31, correct: 1 },
                                { id: 32, correct: 2 },
                                { id: 33, correct: 0 },
                                { id: 34, correct: 3 },
                                { id: 35, correct: 1 }
                            ]
                        },
                        {
                            questions: [
                                { id: 36, correct: 2 },
                                { id: 37, correct: 0 },
                                { id: 38, correct: 1 },
                                { id: 39, correct: 3 },
                                { id: 40, correct: 2 }
                            ]
                        }
                    ]
                },
                listening: {
                    scripts: [
                        {
                            questions: [
                                { id: 51, correct: 0 },
                                { id: 52, correct: 1 },
                                { id: 53, correct: 2 },
                                { id: 54, correct: 3 },
                                { id: 55, correct: 0 }
                            ]
                        },
                        {
                            questions: [
                                { id: 56, correct: 1 },
                                { id: 57, correct: 2 },
                                { id: 58, correct: 0 },
                                { id: 59, correct: 3 },
                                { id: 60, correct: 1 }
                            ]
                        }
                    ]
                }
            }
        };

        // Store original test data
        const originalTestData = testData;
        testData = sampleTestData;

        // Test case 1: Perfect score
        const perfectAnswers = {
            grammar: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 0 },
            reading: { 31: 1, 32: 2, 33: 0, 34: 3, 35: 1, 36: 2, 37: 0, 38: 1, 39: 3, 40: 2 },
            listening: { 51: 0, 52: 1, 53: 2, 54: 3, 55: 0, 56: 1, 57: 2, 58: 0, 59: 3, 60: 1 },
            writing: { task1: 'Sample writing task 1 with more than 10 characters', task2: 'Sample writing task 2 with more than 10 characters', task3: 'Sample writing task 3 with more than 10 characters' }
        };

        // Test case 2: Partial score with penalties
        const partialAnswers = {
            grammar: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 0 }, // 3/5 correct
            reading: { 31: 1, 32: 0, 33: 0, 34: 3, 35: 1, 36: 2, 37: 0, 38: 1, 39: 3, 40: 2 }, // 7/10 correct
            listening: { 51: 0, 52: 1, 53: 0, 54: 3, 55: 0, 56: 1, 57: 2, 58: 0, 59: 3, 60: 1 }, // 7/10 correct
            writing: { task1: 'Sample writing task 1 with more than 10 characters', task2: '', task3: 'Sample writing task 3 with more than 10 characters' },
            translationPenalties: { 'question-1': -0.5, 'question-31': -0.5, 'transcript-1': -1.0 }
        };

        const perfectResults = calculateResults(perfectAnswers, testData);
        const partialResults = calculateResults(partialAnswers, testData);

        // Restore original test data
        testData = originalTestData;

        res.json({
            success: true,
            testCases: {
                perfectScore: {
                    answers: perfectAnswers,
                    results: perfectResults,
                    expected: {
                        grammar: 5,
                        reading: 10,
                        listening: 20,
                        writing: 15,
                        total: 85,
                        grammarTotal: 30,
                        readingTotal: 20,
                        listeningTotal: 20,
                        writingTotal: 15
                    }
                },
                partialScore: {
                    answers: partialAnswers,
                    results: partialResults,
                    expected: {
                        grammar: 3,
                        reading: 7,
                        listening: 7,
                        writing: 10,
                        total: 27,
                        translationPenalty: 2.0
                    }
                }
            },
            gradingSystem: {
                totalPoints: 120,
                breakdown: {
                    listening: '40 points (40 questions)',
                    reading: '40 points (40 questions)',
                    writing: '20 points (2 tasks, 10 points each)',
                    speaking: '20 points (3 parts, based on content quality)'
                },
                penalties: {
                    translation: '0.5 points per translation',
                    transcript: '1.0 point per transcript use'
                },
                bandScores: {
                    description: 'IELTS Band Scores are calculated based on raw scores and converted to the 9-band scale',
                    listening: 'Based on 40-question IELTS standard',
                    reading: 'Based on Academic Reading IELTS standard',
                    writing: 'Based on task completion and word count',
                    speaking: 'Based on fluency, coherence, lexical resource, grammar, and pronunciation'
                }
            }
        });

    } catch (error) {
        console.error('Error testing grading system:', error);
        res.status(500).json({ error: 'Failed to test grading system' });
    }
});

// Start server
async function startServer() {
    try {
        const availablePort = await findAvailablePort(PORT);

        app.listen(availablePort, () => {
            console.log(`IELTS Practice Test Server running on port ${availablePort}`);
            console.log(`Access the test at: http://localhost:${availablePort}`);
            console.log(`For ngrok: ngrok http ${availablePort}`);
            console.log(`Questions directory: ${questionsDir}`);
            console.log(`Data directory: ${dataDir}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();