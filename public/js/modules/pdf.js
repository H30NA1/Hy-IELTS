// IELTS PDF Generation Module
class IELTSPDF {
    constructor() {
        this.pdfUrl = null;
    }

    async generatePDF(userName, results, answers, testData) {
        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName,
                    results,
                    answers,
                    testData,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            this.pdfUrl = URL.createObjectURL(blob);
            
            return this.pdfUrl;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    downloadPDF() {
        if (this.pdfUrl) {
            const link = document.createElement('a');
            link.href = this.pdfUrl;
            link.download = `IELTS_Test_Results_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    generateHTMLContent(userName, results, answers, testData) {
        const timestamp = new Date().toLocaleString();
        
        // Generate detailed question breakdown
        const listeningQuestions = this.generateListeningQuestionsHTML(testData, answers);
        const readingQuestions = this.generateReadingQuestionsHTML(testData, answers);
        const writingAnswers = this.generateWritingAnswersHTML(answers);
        const speakingAnswers = this.generateSpeakingAnswersHTML(answers);
        
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
                        max-width: 1000px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .header {
                        text-align: center;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 2.5em;
                    }
                    .header p {
                        margin: 10px 0 0 0;
                        font-size: 1.2em;
                    }
                    .results-section {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        margin-bottom: 30px;
                    }
                    .band-scores {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .band-score {
                        text-align: center;
                        padding: 20px;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                    }
                    .band-score h3 {
                        margin: 0 0 10px 0;
                        font-size: 1.1em;
                    }
                    .band-score .score {
                        font-size: 2.5em;
                        font-weight: bold;
                        margin: 0;
                    }
                    .overall-score {
                        text-align: center;
                        padding: 30px;
                        background: linear-gradient(135deg, #2563eb, #1d4ed8);
                        color: white;
                        border-radius: 10px;
                        margin-bottom: 30px;
                    }
                    .overall-score h2 {
                        margin: 0 0 10px 0;
                        font-size: 1.5em;
                    }
                    .overall-score .score {
                        font-size: 4em;
                        font-weight: bold;
                        margin: 0;
                    }
                    .detailed-results {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .result-item {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        border-left: 4px solid #667eea;
                    }
                    .result-item h4 {
                        margin: 0 0 10px 0;
                        color: #667eea;
                    }
                    .result-item .score {
                        font-size: 1.5em;
                        font-weight: bold;
                        color: #333;
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
                    }
                    .test-info h3 {
                        color: #667eea;
                        margin-top: 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding: 20px;
                        color: #666;
                        font-size: 0.9em;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎓 IELTS Test Results</h1>
                    <p>Candidate: ${userName}</p>
                    <p>Test Date: ${timestamp}</p>
                </div>

                <div class="results-section">
                    <div class="overall-score">
                        <h2>Overall IELTS Band Score</h2>
                        <div class="score">${results.bands.overall}</div>
                    </div>

                    <div class="band-scores">
                        <div class="band-score">
                            <h3>Listening</h3>
                            <div class="score">${results.bands.listening}</div>
                        </div>
                        <div class="band-score">
                            <h3>Reading</h3>
                            <div class="score">${results.bands.reading}</div>
                        </div>
                        <div class="band-score">
                            <h3>Writing</h3>
                            <div class="score">${results.bands.writing}</div>
                        </div>
                        <div class="band-score">
                            <h3>Speaking</h3>
                            <div class="score">${results.bands.speaking}</div>
                        </div>
                    </div>

                    <div class="detailed-results">
                        <div class="result-item">
                            <h4>Listening</h4>
                            <div class="score">${results.listening}/${results.listeningTotal}</div>
                            <p>Band Score: ${results.bands.listening}</p>
                        </div>
                        <div class="result-item">
                            <h4>Reading</h4>
                            <div class="score">${results.reading}/${results.readingTotal}</div>
                            <p>Band Score: ${results.bands.reading}</p>
                        </div>
                        <div class="result-item">
                            <h4>Writing</h4>
                            <div class="score">${results.writing}/${results.writingTotal}</div>
                            <p>Band Score: ${results.bands.writing}</p>
                        </div>
                        <div class="result-item">
                            <h4>Speaking</h4>
                            <div class="score">${results.speaking}/${results.speakingTotal}</div>
                            <p>Band Score: ${results.bands.speaking}</p>
                        </div>
                    </div>

                    ${results.translationPenalty > 0 ? `
                        <div class="result-item" style="border-left-color: #ef4444;">
                            <h4>Translation Penalty</h4>
                            <div class="score" style="color: #ef4444;">-${results.translationPenalty}</div>
                            <p>Points deducted for using translation assistance</p>
                        </div>
                    ` : ''}
                </div>

                ${listeningQuestions}

                ${readingQuestions}

                ${writingAnswers}

                ${speakingAnswers}

                <div class="test-info">
                    <h3>Test Information</h3>
                    <p><strong>Test Title:</strong> ${testData.testTitle || 'IELTS Practice Test'}</p>
                    <p><strong>Total Questions:</strong> ${results.listeningTotal + results.readingTotal} multiple choice questions</p>
                    <p><strong>Writing Tasks:</strong> 2 tasks (Task 1: 150+ words, Task 2: 250+ words)</p>
                    <p><strong>Speaking Parts:</strong> 3 parts (Introduction, Long turn, Discussion)</p>
                    <p><strong>Total Raw Score:</strong> ${results.total}/${results.listeningTotal + results.readingTotal + results.writingTotal + results.speakingTotal}</p>
                </div>

                <div class="footer">
                    <p>This is an automated IELTS practice test result. For official IELTS certification, please register for an official IELTS test.</p>
                    <p>Generated on ${timestamp}</p>
                </div>
            </body>
            </html>
        `;
    }

    generateListeningQuestionsHTML(testData, answers) {
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

    generateReadingQuestionsHTML(testData, answers) {
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

    generateWritingAnswersHTML(answers) {
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

    generateSpeakingAnswersHTML(answers) {
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
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IELTSPDF;
}
