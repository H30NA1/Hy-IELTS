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
            connectSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
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
        
        // If no date specified, use today's date
        // const testDate = date || moment().format('YYYY-MM-DD');
        const testDate = '2025-08-29';
        const questionsFile = path.join(questionsDir, `${testDate}.json`);
        
        console.log(`Attempting to load test data for date: ${testDate}`);
        console.log(`Looking for file: ${questionsFile}`);
        console.log(`Questions directory: ${questionsDir}`);
        
        // List all files in questions directory
        try {
            const allFiles = await fs.readdir(questionsDir);
            console.log('Available files in questions directory:', allFiles);
        } catch (dirError) {
            console.error('Error reading questions directory:', dirError);
        }
        
        // Check if the specific date file exists
        const fileExists = await fs.pathExists(questionsFile);
        console.log(`File exists check for ${questionsFile}:`, fileExists);
        
        if (fileExists) {
            console.log(`Loading file: ${questionsFile}`);
            testData = await fs.readJson(questionsFile);
            console.log(`Successfully loaded test data from: ${questionsFile}`);
            console.log('Test data keys:', Object.keys(testData || {}));
        } else {
            console.log(`File not found: ${questionsFile}, trying default file...`);
            // Fallback to the default file (2025-08-04)
            const defaultFile = path.join(questionsDir, '2025-08-05.json');
            console.log(`Looking for default file: ${defaultFile}`);
            
            const defaultExists = await fs.pathExists(defaultFile);
            console.log(`Default file exists: ${defaultExists}`);
            
            if (defaultExists) {
                console.log(`Loading default file: ${defaultFile}`);
                testData = await fs.readJson(defaultFile);
                console.log(`Successfully loaded default test data from: ${defaultFile}`);
                console.log('Test data keys:', Object.keys(testData || {}));
            } else {
                console.error('No test data files found. Available files:');
                const files = await fs.readdir(questionsDir);
                console.error('Files in questions directory:', files);
                throw new Error('No test data files found');
            }
        }
        
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

// Initialize test data
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
        if (!testData.sections || !testData.sections.grammar) {
            clearTimeout(timeout);
            return res.status(500).json({ error: 'Invalid test data structure' });
        }
        
        console.log('Test data loaded successfully, sending response');
        console.log('Test data structure:', {
            hasSections: !!testData.sections,
            sections: Object.keys(testData.sections),
            grammarQuestions: testData.sections.grammar?.questions?.length || 0
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
        
        // Calculate results
        const results = calculateResults(answers);
        
        // Create submission data
        const submission = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userInfo: userInfo || {},
            userName: userName || 'Anonymous',
            answers,
            results,
            timeSpent,
            testData: {
                testId: testData.testId,
                testDate: testData.testDate,
                testTitle: testData.testTitle
            }
        };
        
        // Create user-specific folder structure
        const sanitizedUserName = userName ? userName.replace(/[^a-zA-Z0-9]/g, '_') : 'Anonymous';
        const date = moment().format('YYYY-MM-DD');
        const userDir = path.join(dataDir, sanitizedUserName);
        const dateDir = path.join(userDir, date);
        
        // Ensure directories exist
        await fs.ensureDir(userDir);
        await fs.ensureDir(dateDir);
        
        // Create filename with user name and timestamp
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const filename = `${sanitizedUserName}_${timestamp}.json`;
        const filepath = path.join(dateDir, filename);
        
        // Save to JSON file
        await fs.writeJson(filepath, submission, { spaces: 2 });
        
        // Generate PDF with user-specific naming
        const pdfPath = await generatePDF(submission, sanitizedUserName, timestamp);
        
        res.json({
            success: true,
            submissionId: submission.id,
            results,
            pdfUrl: `/api/download-pdf/${submission.id}`,
            userName: sanitizedUserName
        });
        
    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({ success: false, error: 'Failed to submit test' });
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

// Helper functions
function calculateResults(answers) {
    let grammarScore = 0;
    let readingScore = 0;
    let listeningScore = 0;
    let writingScore = 0;
    let translationPenalty = 0;
    
    if (!testData) {
        return { grammar: 0, reading: 0, listening: 0, writing: 0, total: 0, grammarTotal: 30, readingTotal: 20, listeningTotal: 10, writingTotal: 15, translationPenalty: 0 };
    }
    
    // Calculate grammar score (30 points - 1 point per question)
    if (answers.grammar) {
        Object.entries(answers.grammar).forEach(([questionId, selectedOption]) => {
            const question = testData.sections.grammar.questions.find(q => q.id === parseInt(questionId));
            if (question) {
                const isTranslated = answers.translatedQuestions && answers.translatedQuestions.includes(parseInt(questionId));
                const isCorrect = selectedOption === question.correct;
                
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
    
    // Calculate reading score (20 points - 1 point per question)
    if (answers.reading) {
        const allReadingQuestions = [
            ...testData.sections.reading.passages[0].questions,
            ...testData.sections.reading.passages[1].questions
        ];
        Object.entries(answers.reading).forEach(([questionId, selectedOption]) => {
            const question = allReadingQuestions.find(q => q.id === parseInt(questionId));
            if (question) {
                const isTranslated = answers.translatedQuestions && answers.translatedQuestions.includes(parseInt(questionId));
                const isCorrect = selectedOption === question.correct;
                
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
    
    // Calculate listening score (10 points - 2 points per question)
    if (answers.listening) {
        const allListeningQuestions = [
            ...testData.sections.listening.scripts[0].questions,
            ...testData.sections.listening.scripts[1].questions
        ];
        
        // Check for transcript usage first
        const transcriptUsed = answers.translationPenalties && 
            Object.keys(answers.translationPenalties).some(key => key.startsWith('transcript-') && !key.includes('translation'));
        
        if (transcriptUsed) {
            translationPenalty += 1; // Add transcript penalty once
        }
        
        Object.entries(answers.listening).forEach(([questionId, selectedOption]) => {
            const question = allListeningQuestions.find(q => q.id === parseInt(questionId));
            if (question) {
                const isTranslated = answers.translatedQuestions && answers.translatedQuestions.includes(parseInt(questionId));
                const isCorrect = selectedOption === question.correct;
                
                if (transcriptUsed) {
                    if (isTranslated) {
                        // Transcript + Translation used
                        translationPenalty += 0.5; // Additional translation penalty
                        
                        if (isCorrect) {
                            listeningScore += 0.5; // 2 points - 1 transcript penalty - 0.5 translation penalty
                        } else {
                            listeningScore += 0; // 0 points - 1 transcript penalty - 0.5 translation penalty - 0.5 wrong answer
                        }
                    } else {
                        // Only transcript used
                        if (isCorrect) {
                            listeningScore += 1; // 2 points - 1 transcript penalty
                        } else {
                            listeningScore += 0; // 0 points - 1 transcript penalty - 1 wrong answer
                        }
                    }
                } else {
                    if (isTranslated) {
                        // Only translation used
                        translationPenalty += 0.5;
                        
                        if (isCorrect) {
                            listeningScore += 1.5; // 2 points - 0.5 translation penalty
                        } else {
                            listeningScore += 0; // 0 points - 0.5 translation penalty - 1.5 wrong answer
                        }
                    } else {
                        // No penalties
                        if (isCorrect) {
                            listeningScore += 2; // 2 points
                        } else {
                            listeningScore += 0; // 0 points
                        }
                    }
                }
            }
        });
    }
    
    // Calculate writing score (15 points - based on word count)
    if (answers.writing) {
        Object.entries(answers.writing).forEach(([taskKey, text]) => {
            if (text && text.trim().length > 0) {
                const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                const wordCount = words.length;
                
                // Word count scoring: above 50 words = 0.5, above 80 words = 1 point
                // Each task can earn up to 5 points (15 total / 3 tasks)
                let taskScore = 0;
                if (wordCount >= 80) {
                    taskScore = 5; // Full points for 80+ words
                } else if (wordCount >= 50) {
                    taskScore = 2.5; // Half points for 50-79 words
                } else {
                    taskScore = 0; // No points for less than 50 words
                }
                
                writingScore += taskScore;
            }
        });
    }
    
    // Calculate total translation penalty
    if (answers.translationPenalties) {
        // Sum all penalties from the translationPenalties object
        const penaltySum = Object.values(answers.translationPenalties).reduce((sum, penalty) => sum + penalty, 0);
        translationPenalty += penaltySum;
    }
    
    const totalScore = grammarScore + readingScore + listeningScore + writingScore;
    
    return {
        grammar: Math.round(grammarScore * 100) / 100,
        reading: Math.round(readingScore * 100) / 100,
        listening: Math.round(listeningScore * 100) / 100,
        writing: Math.round(writingScore * 100) / 100,
        total: Math.max(0, Math.round(totalScore * 100) / 100), // Ensure total doesn't go below 0
        grammarTotal: 30, // 30 grammar questions
        readingTotal: 20, // 20 reading questions
        listeningTotal: 10, // 10 listening questions (2 points each)
        writingTotal: 15, // 15 writing points (5 per task)
        translationPenalty: Math.round(translationPenalty * 100) / 100
    };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function generatePDF(submission, userName, timestamp) {
    try {
        // Create PDFs directory
        const pdfsDir = path.join(__dirname, 'pdfs');
        await fs.ensureDir(pdfsDir);
        
        // Generate HTML content
        const htmlContent = generatePDFHTML(submission);
        
        // Launch browser
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        const pdfPath = path.join(pdfsDir, `${userName}_${timestamp}.pdf`);
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true
        });
        
        await browser.close();
        return pdfPath;
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

function generatePDFHTML(submission) {
    const { results, answers, testData: submissionTestData } = submission;
    
    // Load the current test data for PDF generation
    const currentTestData = testData;
    
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
                <span>${results.grammar}/${results.grammarTotal}</span>
            </div>
            <div class="result-item">
                <span>Reading:</span>
                <span>${results.reading}/${results.readingTotal}</span>
            </div>
            <div class="result-item">
                <span>Listening:</span>
                <span>${results.listening}/${results.listeningTotal}</span>
            </div>
            <div class="result-item">
                <span>Writing:</span>
                <span>${results.writing}/${results.writingTotal}</span>
            </div>
            <div class="result-item total">
                <span>Total Score:</span>
                <span>${results.total}/${results.grammarTotal + results.readingTotal + results.listeningTotal + results.writingTotal}</span>
            </div>
            <div class="result-item">
                <span>Time Spent:</span>
                <span>${submission.timeSpent || 'N/A'}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>${currentTestData.sections.grammar.title}</h2>
            ${currentTestData.sections.grammar.questions.map(q => {
                const selected = answers.grammar && answers.grammar[q.id];
                const isCorrect = selected === q.correct;
                
                return `
                    <div class="question">
                        <div class="question-number">Question ${q.id}</div>
                        <div class="question-text">${q.question}</div>
                        <div class="options">
                            ${q.options.map((option, index) => {
                                let className = 'option';
                                if (index === q.correct) className += ' correct';
                                if (index === selected && !isCorrect) className += ' incorrect';
                                if (index === selected) className += ' selected';
                                
                                return `<div class="${className}">${String.fromCharCode(65 + index)}) ${option}</div>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="section">
            <h2>${currentTestData.sections.reading.title}</h2>
            
            ${currentTestData.sections.reading.passages.map((passage, passageIndex) => `
                <div class="passage">
                    <h3>${passage.title}</h3>
                    <p>${passage.content}</p>
                </div>
                
                ${passage.questions.map(q => {
                    const selected = answers.reading && answers.reading[q.id];
                    const isCorrect = selected === q.correct;
                    
                    return `
                        <div class="question">
                            <div class="question-number">Question ${q.id}</div>
                            <div class="question-text">${q.question}</div>
                            <div class="options">
                                ${q.options.map((option, index) => {
                                    let className = 'option';
                                    if (index === q.correct) className += ' correct';
                                    if (index === selected && !isCorrect) className += ' incorrect';
                                    if (index === selected) className += ' selected';
                                    
                                    return `<div class="${className}">${String.fromCharCode(65 + index)}) ${option}</div>`;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            `).join('')}
        </div>
        
        <div class="section">
            <h2>${currentTestData.sections.listening.title}</h2>
            
            ${currentTestData.sections.listening.scripts.map((script, scriptIndex) => `
                <div class="script">
                    <h3>Script ${scriptIndex + 1}</h3>
                    <p>${script.content}</p>
                </div>
                
                ${script.questions.map(q => {
                    const selected = answers.listening && answers.listening[q.id];
                    const isCorrect = selected === q.correct;
                    
                    return `
                        <div class="question">
                            <div class="question-number">Question ${q.id}</div>
                            <div class="question-text">${q.question}</div>
                            <div class="options">
                                ${q.options.map((option, index) => {
                                    let className = 'option';
                                    if (index === q.correct) className += ' correct';
                                    if (index === selected && !isCorrect) className += ' incorrect';
                                    if (index === selected) className += ' selected';
                                    
                                    return `<div class="${className}">${String.fromCharCode(65 + index)}) ${option}</div>`;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            `).join('')}
        </div>
        
        <div class="section">
            <h2>${currentTestData.sections.writing.title}</h2>
            
            ${currentTestData.sections.writing.tasks.map((task, index) => {
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

        const perfectResults = calculateResults(perfectAnswers);
        const partialResults = calculateResults(partialAnswers);

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
                        listening: 10,
                        writing: 15,
                        total: 40,
                        grammarTotal: 30,
                        readingTotal: 20,
                        listeningTotal: 35,
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
                totalPoints: 100,
                breakdown: {
                    grammar: '30 points (30 questions)',
                    reading: '20 points (20 questions)',
                    listening: '35 points (10 questions)',
                    writing: '15 points (3 tasks, 5 points each)'
                },
                penalties: {
                    translation: '0.5 points per translation',
                    transcript: '1.0 point per transcript use'
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