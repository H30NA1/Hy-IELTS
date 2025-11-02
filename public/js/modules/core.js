// IELTS Test Core Module
class IELTSCore {
    constructor() {
        this.currentSection = 'listening';
        this.sections = ['listening', 'reading', 'grammar', 'writing'];
        this.answers = {
            listening: {},
            reading: {},
            grammar: {},
            writing: {
                task1: '',
                task2: ''
            }
        };
        this.translatedQuestions = new Set();
        this.translationPenalties = {};
        this.startTime = Date.now();
        this.timerInterval = null;
        this.testSubmitted = false;
        this.testData = null;
        this.userName = '';
        this.results = null;
        this.pdfUrl = null;
        this.reviewMode = false;

        // Initialize modules
        this.grading = new IELTSGrading();
        this.listening = new IELTSListening();
        this.reading = new IELTSReading();
        this.grammar = new IELTSGrammar();
        this.writing = new IELTSWriting();
        this.pdf = new IELTSPDF();
        this.userData = new IELTSUserData();

        // Make core available globally
        window.ieltsTest = this;
        window.userData = this.userData;
    }

    async initialize() {
        try {
            console.log('Initializing IELTS Test application...');
            
            // Update app title with dynamic version
            this.updateAppTitle();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load test data
            await this.loadTestData();
            
            // Initialize all modules
            await this.listening.initialize();
            await this.reading.initialize();
            this.grammar.initialize();
            this.writing.initialize();
            
            // Start timer and update UI
            this.startTimer();
            this.updateProgress();
            this.updateNavigation();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize test. Please refresh the page.');
        }
    }
    
    updateAppTitle() {
        // Generate dynamic version based on current date
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 0-based
        const version = `${year}.${month}`;
        
        const appTitle = document.getElementById('app-title');
        if (appTitle) {
            appTitle.textContent = `IELTS Mastery v${version}`;
        }
        
        // Update page title
        document.title = `IELTS Mastery v${version} - Full Exam Simulator`;
    }

    showNameModal() {
        // Show the name input modal when the page loads
        IELTSUtils.showModal('user-name-modal');
    }

    async loadTestData() {
        try {
            console.log('Fetching test data from /api/test-data...');
            const response = await fetch('/api/test-data');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.testData = await response.json();
            console.log('Test data loaded successfully:', this.testData.testTitle);
        } catch (error) {
            console.error('Failed to load test data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Navigation buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-btn')) {
                const btn = e.target.closest('.nav-btn');
                const section = btn.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            }
        });

        // Previous/Next buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#prev-btn')) {
                this.previousSection();
            } else if (e.target.closest('#next-btn')) {
                this.nextSection();
            }
        });

        // Submit test button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#submit-test-btn')) {
                this.submitTest();
            }
        });

        // Submit modal buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#confirm-submit')) {
                this.confirmSubmit();
            } else if (e.target.closest('#cancel-submit')) {
                IELTSUtils.hideModal('submit-modal');
            }
        });

        // Results modal buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#review-test')) {
                this.reviewTest();
            } else if (e.target.closest('#download-pdf')) {
                this.downloadPDF();
            } else if (e.target.closest('#view-history')) {
                this.userData.showUserHistory();
            } else if (e.target.closest('#new-test')) {
                this.newTest();
            }
        });

        // User name modal
        document.addEventListener('click', (e) => {
            if (e.target.closest('#start-test-btn')) {
                this.startTest();
            }
        });

        // Rules modal
        document.addEventListener('click', (e) => {
            if (e.target.closest('#acknowledge-rules-modal')) {
                this.acknowledgeRules();
            }
        });

        // User name input
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                const startBtn = document.getElementById('start-test-btn');
                if (startBtn) {
                    startBtn.disabled = e.target.value.trim().length === 0;
                }
            });
        }
    }

    startTest() {
        const nameInput = document.getElementById('user-name-input');
        if (nameInput && nameInput.value.trim()) {
            this.userName = nameInput.value.trim();
            console.log('Starting test for user:', this.userName);
            
            // Set current user in user data module
            this.userData.setCurrentUser(this.userName);
            
            IELTSUtils.hideModal('user-name-modal');
            IELTSUtils.showModal('exam-rules-modal');
        }
    }

    acknowledgeRules() {
        console.log('Rules acknowledged, closing modal...');
        IELTSUtils.hideModal('exam-rules-modal');
        this.initialize();
    }

    switchSection(section) {
        if (this.testSubmitted && !this.reviewMode) return;
        
        this.currentSection = section;
        this.updateNavigation();
        this.updateProgress();
        
        // Hide all sections
        document.querySelectorAll('.test-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Show current section
        const currentSectionElement = document.getElementById(section);
        if (currentSectionElement) {
            currentSectionElement.classList.add('active');
        }
        
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const currentNavBtn = document.querySelector(`[data-section="${section}"]`);
        if (currentNavBtn) {
            currentNavBtn.classList.add('active');
        }
        
        // Re-apply highlighting if in review mode (with small delay to ensure DOM is ready)
        if (this.reviewMode) {
            setTimeout(() => {
                this.applyReviewModeStyling();
            }, 100);
        }
    }

    previousSection() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        if (currentIndex > 0) {
            this.switchSection(this.sections[currentIndex - 1]);
        }
    }

    nextSection() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        if (currentIndex < this.sections.length - 1) {
            this.switchSection(this.sections[currentIndex + 1]);
        }
    }

    updateNavigation() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentIndex === this.sections.length - 1;
        }
    }

    updateProgress() {
        const totalQuestions = 100; // 40 listening + 30 reading + 20 grammar + 10 writing
        let answeredQuestions = 0;
        
        // Count answered questions from all sections
        answeredQuestions += Object.keys(this.answers.listening || {}).length;
        answeredQuestions += Object.keys(this.answers.reading || {}).length;
        answeredQuestions += Object.keys(this.answers.grammar || {}).length;
        
        // Count writing tasks with content
        if (this.answers.writing) {
            if (this.answers.writing.task1 && this.answers.writing.task1.trim()) answeredQuestions++;
            if (this.answers.writing.task2 && this.answers.writing.task2.trim()) answeredQuestions++;
        }
        
        const progress = (answeredQuestions / totalQuestions) * 100;
        const progressBar = document.getElementById('progress-bar-fill');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    updateActivity() {
        this.updateProgress();
    }

    addTranslationPenalty() {
        const questionId = event.target.closest('.translate-btn')?.dataset.question;
        if (!questionId) return;
        
        // Track translation usage
        if (!this.translationPenalties[questionId]) {
            this.translationPenalties[questionId] = -0.5;
            this.translatedQuestions.add(questionId);
            console.log(`⚠️ Translation penalty added for question ${questionId}: -0.5 marks`);
            console.log(`Total translation penalties: ${Object.keys(this.translationPenalties).length}`);
        }
    }

    startTimer() {
        // Don't start timer if in review mode
        if (this.reviewMode) {
            return;
        }
        
        // Clear any existing timer first
        this.stopTimer();
        
        this.timerInterval = setInterval(() => {
            // Double-check we're not in review mode (safety check)
            if (this.reviewMode) {
                this.stopTimer();
                return;
            }
            
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.textContent = IELTSUtils.formatTime(elapsed);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    async submitTest() {
        if (this.testSubmitted) return;
        
        // Show confirmation modal first
        IELTSUtils.showModal('submit-modal');
    }

    async confirmSubmit() {
        if (this.testSubmitted) return;
        
        try {
            console.log('Submitting test to server...');
            this.testSubmitted = true;
            this.stopTimer();
            
            // Hide submit modal
            IELTSUtils.hideModal('submit-modal');
            
            // Collect all answers
            const allAnswers = {
                ...this.answers,
                translatedQuestions: Array.from(this.translatedQuestions),
                translationPenalties: this.translationPenalties
            };
            
            // Calculate time spent
            const timeSpent = IELTSUtils.formatTime(Math.floor((Date.now() - this.startTime) / 1000));
            
            // Submit to server - this will save JSON and generate PDF with correct folder structure
            const response = await fetch('/api/submit-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: allAnswers,
                    timeSpent: timeSpent,
                    userName: this.userName || 'Anonymous',
                    userInfo: {
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                        submittedBy: 'user'
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Test submitted successfully');
                // Use server-calculated results
                this.results = result.results;
                this.submissionId = result.submissionId;
                this.pdfGenerated = result.pdfGenerated;
                
                // Show results
                this.showResults();
            } else {
                throw new Error(result.error || 'Failed to submit test');
            }
            
        } catch (error) {
            console.error('Error submitting test:', error);
            this.showError('Failed to submit test. Please try again.');
            // Reset state to allow retry
            this.testSubmitted = false;
        }
    }

    showResults() {
        // Update raw scores
        const listeningScore = document.getElementById('listening-score');
        const readingScore = document.getElementById('reading-score');
        const writingScore = document.getElementById('writing-score');
        const grammarScore = document.getElementById('grammar-score');
        const totalScore = document.getElementById('total-score');
        
        if (listeningScore) listeningScore.textContent = `${this.results.listening}/${this.results.listeningTotal}`;
        if (readingScore) readingScore.textContent = `${this.results.reading}/${this.results.readingTotal}`;
        if (writingScore) writingScore.textContent = `${this.results.writing}/${this.results.writingTotal}`;
        if (grammarScore) grammarScore.textContent = `${this.results.grammar || 0}/${this.results.grammarTotal || 20}`;
        // Total score is always normalized to be out of 100
        if (totalScore) totalScore.textContent = `${this.results.total}/100`;
        
        // Update band scores
        if (this.results.bands) {
            const listeningBand = document.getElementById('listening-band');
            const readingBand = document.getElementById('reading-band');
            const writingBand = document.getElementById('writing-band');
            const grammarBand = document.getElementById('grammar-band');
            const overallBand = document.getElementById('overall-band');
            
            if (listeningBand) listeningBand.textContent = `Band ${this.results.bands.listening}`;
            if (readingBand) readingBand.textContent = `Band ${this.results.bands.reading}`;
            if (writingBand) writingBand.textContent = `Band ${this.results.bands.writing}`;
            if (grammarBand) grammarBand.textContent = `Band ${this.results.bands.grammar || 0.0}`;
            if (overallBand) overallBand.textContent = this.results.bands.overall;
        }
        
        // Show translation penalty if any
        if (this.results.translationPenalty > 0) {
            const penaltyItem = document.getElementById('penalty-item');
            const penaltyScore = document.getElementById('penalty-score');
            if (penaltyItem) penaltyItem.style.display = 'flex';
            if (penaltyScore) penaltyScore.textContent = `-${this.results.translationPenalty}`;
        }
        
        // Show PDF download button
        const downloadBtn = document.getElementById('download-pdf');
        if (downloadBtn && this.pdfUrl) {
            downloadBtn.style.display = 'inline-flex';
            downloadBtn.href = this.pdfUrl;
        }
        
        IELTSUtils.showModal('results-modal');
    }

    reviewTest() {
        IELTSUtils.hideModal('results-modal');
        
        // Stop timer FIRST before setting review mode
        this.stopTimer();
        
        this.reviewMode = true;
        this.testSubmitted = false;
        
        // Update navigation to allow movement between sections
        this.updateNavigation();
        
        // Go to first section
        this.switchSection('listening');
        
        // Apply review mode styling (includes highlighting)
        this.applyReviewModeStyling();
        
        console.log('Review mode enabled - timer stopped, you can now navigate between sections');
    }

    applyReviewModeStyling() {
        // Disable all radio buttons and inputs
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.disabled = true;
            radio.style.pointerEvents = 'none';
        });
        
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.disabled = true;
            textarea.style.pointerEvents = 'none';
        });
        
        // Hide the Submit Test button during review
        const submitButton = document.getElementById('submit-test-btn');
        if (submitButton) {
            submitButton.style.display = 'none';
        }
        
        // Add review mode class to body
        document.body.classList.add('review-mode');
        
        // Highlight answers based on correctness
        this.highlightAnswers();
    }

    highlightAnswers() {
        console.log('🎨 highlightAnswers() called', { 
            hasResults: !!this.results, 
            hasTestData: !!this.testData,
            results: this.results,
            testData: this.testData ? 'exists' : 'missing'
        });
        
        if (!this.testData) {
            console.log('🎨 highlightAnswers() returning early - missing testData');
            return;
        }
        
        // Get correct answers from test data
        const correctAnswers = this.getCorrectAnswersFromTestData();
        console.log('🎨 Got correct answers:', correctAnswers);
        
        // Highlight listening, reading, and grammar answers
        this.highlightListeningReadingAnswers(correctAnswers);
        this.highlightGrammarAnswers(correctAnswers);
        
        // Highlight writing and speaking (these are always "correct" if they have content)
        this.highlightWritingSpeakingAnswers();
    }

    getCorrectAnswersFromTestData() {
        const correctAnswers = {};
        
        if (!this.testData || !this.testData.sections) return correctAnswers;
        
        // Get listening correct answers
        const listeningSection = this.testData.sections.find(s => s.id === 'listening');
        if (listeningSection && listeningSection.parts) {
            listeningSection.parts.forEach(part => {
                if (part.questions) {
                    part.questions.forEach(question => {
                        correctAnswers[question.id] = question.correctAnswer;
                    });
                }
            });
        }
        
        // Get reading correct answers
        const readingSection = this.testData.sections.find(s => s.id === 'reading');
        if (readingSection && readingSection.passages) {
            readingSection.passages.forEach(passage => {
                if (passage.questions) {
                    passage.questions.forEach(question => {
                        correctAnswers[question.id] = question.correctAnswer;
                    });
                }
            });
        }
        
        // Get grammar correct answers
        const grammarSection = this.testData.sections.find(s => s.id === 'grammar');
        if (grammarSection && grammarSection.questions) {
            grammarSection.questions.forEach(question => {
                correctAnswers[question.id] = question.correctAnswer;
            });
        }
        
        return correctAnswers;
    }

    highlightListeningReadingAnswers(correctAnswers) {
        console.log('🎨 Starting highlighting process...', { correctAnswers, userAnswers: this.answers.listening });
        
        // Highlight ALL listening questions (both answered and unanswered)
        if (this.testData && this.testData.sections) {
            const listeningSection = this.testData.sections.find(s => s.id === 'listening');
            if (listeningSection && listeningSection.parts) {
                listeningSection.parts.forEach(part => {
                    if (part.questions) {
                        part.questions.forEach(question => {
                            const questionId = question.id;
                            const correctAnswer = question.correctAnswer;
                            const userAnswer = this.answers.listening ? this.answers.listening[questionId] : null;
                            
                            // Always highlight the correct answer in green
                            const correctRadioButton = document.querySelector(`input[name="${questionId}"][value="${correctAnswer}"]`);
                            if (correctRadioButton) {
                                const correctLabel = correctRadioButton.closest('label') || correctRadioButton.parentElement;
                                if (correctLabel) {
                                    correctLabel.classList.remove('answer-correct', 'answer-wrong', 'answer-correct-option');
                                    correctLabel.classList.add('answer-correct-option');
                                }
                            }
                            
                            // If user answered, highlight their answer (green if correct, red if wrong)
                            if (userAnswer) {
                                const userRadioButton = document.querySelector(`input[name="${questionId}"][value="${userAnswer}"]`);
                                if (userRadioButton) {
                                    const userLabel = userRadioButton.closest('label') || userRadioButton.parentElement;
                                    if (userLabel) {
                                        userLabel.classList.remove('answer-correct', 'answer-wrong', 'answer-correct-option');
                                        if (userAnswer === correctAnswer) {
                                            userLabel.classList.add('answer-correct');
                                        } else {
                                            userLabel.classList.add('answer-wrong');
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            }
        }
        
        // Highlight ALL reading questions (both answered and unanswered)
        if (this.testData && this.testData.sections) {
            const readingSection = this.testData.sections.find(s => s.id === 'reading');
            if (readingSection && readingSection.passages) {
                readingSection.passages.forEach(passage => {
                    if (passage.questions) {
                        passage.questions.forEach(question => {
                            const questionId = question.id;
                            const correctAnswer = question.correctAnswer;
                            const userAnswer = this.answers.reading ? this.answers.reading[questionId] : null;
                            
                            // Always highlight the correct answer in green
                            const correctRadioButton = document.querySelector(`input[name="${questionId}"][value="${correctAnswer}"]`);
                            if (correctRadioButton) {
                                const correctLabel = correctRadioButton.closest('label') || correctRadioButton.parentElement;
                                if (correctLabel) {
                                    correctLabel.classList.remove('answer-correct', 'answer-wrong', 'answer-correct-option');
                                    correctLabel.classList.add('answer-correct-option');
                                }
                            }
                            
                            // If user answered, highlight their answer (green if correct, red if wrong)
                            if (userAnswer) {
                                const userRadioButton = document.querySelector(`input[name="${questionId}"][value="${userAnswer}"]`);
                                if (userRadioButton) {
                                    const userLabel = userRadioButton.closest('label') || userRadioButton.parentElement;
                                    if (userLabel) {
                                        userLabel.classList.remove('answer-correct', 'answer-wrong', 'answer-correct-option');
                                        if (userAnswer === correctAnswer) {
                                            userLabel.classList.add('answer-correct');
                                        } else {
                                            userLabel.classList.add('answer-wrong');
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            }
        }
    }

    highlightGrammarAnswers(correctAnswers) {
        console.log('🎨 Starting grammar highlighting process...', { correctAnswers, userAnswers: this.answers.grammar });
        
        // Highlight ALL grammar questions (both answered and unanswered)
        if (this.testData && this.testData.sections) {
            const grammarSection = this.testData.sections.find(s => s.id === 'grammar');
            if (grammarSection && grammarSection.questions) {
                grammarSection.questions.forEach(question => {
                    const questionId = question.id;
                    const correctAnswer = question.correctAnswer;
                    const userAnswer = this.answers.grammar ? this.answers.grammar[questionId] : null;
                    
                    // Always highlight the correct answer in green
                    const correctRadioButton = document.querySelector(`input[name="${questionId}"][value="${correctAnswer}"]`);
                    if (correctRadioButton) {
                        const correctLabel = correctRadioButton.closest('label') || correctRadioButton.parentElement;
                        if (correctLabel) {
                            correctLabel.classList.remove('answer-correct', 'answer-wrong', 'answer-correct-option');
                            correctLabel.classList.add('answer-correct-option');
                        }
                    }
                    
                    // If user answered, highlight their answer (green if correct, red if wrong)
                    if (userAnswer) {
                        const userRadioButton = document.querySelector(`input[name="${questionId}"][value="${userAnswer}"]`);
                        if (userRadioButton) {
                            const userLabel = userRadioButton.closest('label') || userRadioButton.parentElement;
                            if (userLabel) {
                                userLabel.classList.remove('answer-correct', 'answer-wrong', 'answer-correct-option');
                                if (userAnswer === correctAnswer) {
                                    userLabel.classList.add('answer-correct');
                                } else {
                                    userLabel.classList.add('answer-wrong');
                                }
                            }
                        }
                    }
                });
            }
        }
    }

    highlightWritingSpeakingAnswers() {
        // For writing and speaking, highlight based on whether they have content
        const writingTasks = ['writing-task1', 'writing-task2'];
        const speakingParts = ['speaking-part1', 'speaking-part2', 'speaking-part3'];
        
        writingTasks.forEach(taskId => {
            const textarea = document.getElementById(taskId);
            if (textarea) {
                const hasContent = textarea.value.trim().length > 0;
                textarea.style.backgroundColor = hasContent ? '#d4edda' : '#f8d7da';
                textarea.style.border = hasContent ? '2px solid #28a745' : '2px solid #dc3545';
            }
        });
        
        speakingParts.forEach(partId => {
            const textarea = document.getElementById(partId);
            if (textarea) {
                const hasContent = textarea.value.trim().length > 0;
                textarea.style.backgroundColor = hasContent ? '#d4edda' : '#f8d7da';
                textarea.style.border = hasContent ? '2px solid #28a745' : '2px solid #dc3545';
            }
        });
    }

    isAnswerCorrect(selectedOption, correctAnswer) {
        if (!correctAnswer) return false;
        
        // Convert selected option to letter (A, B, C, D)
        const optionLetter = String.fromCharCode(65 + parseInt(selectedOption));
        return optionLetter === correctAnswer;
    }

    newTest() {
        IELTSUtils.hideModal('results-modal');
        
        // Reset all data
        this.answers = {
            listening: {},
            reading: {},
            writing: {
                task1: '',
                task2: ''
            },
            speaking: {
                part1: '',
                part2: '',
                part3: ''
            }
        };
        this.translatedQuestions = new Set();
        this.translationPenalties = {};
        this.startTime = Date.now();
        this.testSubmitted = false;
        this.reviewMode = false;
        this.results = null;
        this.pdfUrl = null;
        
        // Reset timer
        this.startTimer();
        
        // Reset progress
        this.updateProgress();
        
        // Remove review mode styling
        this.removeReviewModeStyling();
        
        // Go to first section
        this.switchSection('listening');
        
        // Clear all form inputs
        this.clearAllInputs();
        
        console.log('New test started - all data reset');
    }

    removeReviewModeStyling() {
        // Remove review mode class from body
        document.body.classList.remove('review-mode');
        
        // Remove answer highlighting classes
        document.querySelectorAll('.answer-correct, .answer-wrong, .answer-correct-option').forEach(el => {
            el.classList.remove('answer-correct', 'answer-wrong', 'answer-correct-option');
        });
        
        // Reset textarea styles
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.style.backgroundColor = '';
            textarea.style.border = '';
        });
        
        // Re-enable all radio buttons and inputs
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.disabled = false;
            radio.style.pointerEvents = 'auto';
        });
        
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.disabled = false;
            textarea.style.pointerEvents = 'auto';
        });
        
        // Show the Submit Test button again
        const submitButton = document.getElementById('submit-test-btn');
        if (submitButton) {
            submitButton.style.display = '';
        }
        
        // Remove all highlighting classes
        document.querySelectorAll('label').forEach(label => {
            label.classList.remove('answer-correct', 'answer-wrong', 'answer-correct-option');
        });
        
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.style.backgroundColor = '';
            textarea.style.border = '';
        });
    }

    clearAllInputs() {
        // Clear listening answers
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Clear writing textareas
        const writingTextareas = document.querySelectorAll('#writing-task1, #writing-task2');
        writingTextareas.forEach(textarea => {
            textarea.value = '';
        });
        
        // Clear speaking textareas
        const speakingTextareas = document.querySelectorAll('#speaking-part1, #speaking-part2, #speaking-part3');
        speakingTextareas.forEach(textarea => {
            textarea.value = '';
        });
        
        // Update word counts
        this.updateWordCounts();
    }

    updateWordCounts() {
        // Update writing word counts
        const writingTask1 = document.getElementById('writing-task1');
        const writingTask2 = document.getElementById('writing-task2');
        const speakingPart1 = document.getElementById('speaking-part1');
        const speakingPart2 = document.getElementById('speaking-part2');
        const speakingPart3 = document.getElementById('speaking-part3');
        
        if (writingTask1) {
            const count1 = document.getElementById('word-count-1');
            if (count1) count1.textContent = IELTSUtils.countWords(writingTask1.value);
        }
        
        if (writingTask2) {
            const count2 = document.getElementById('word-count-2');
            if (count2) count2.textContent = IELTSUtils.countWords(writingTask2.value);
        }
        
        if (speakingPart1) {
            const count1 = document.getElementById('speaking-count-1');
            if (count1) count1.textContent = IELTSUtils.countWords(speakingPart1.value);
        }
        
        if (speakingPart2) {
            const count2 = document.getElementById('speaking-count-2');
            if (count2) count2.textContent = IELTSUtils.countWords(speakingPart2.value);
        }
        
        if (speakingPart3) {
            const count3 = document.getElementById('speaking-count-3');
            if (count3) count3.textContent = IELTSUtils.countWords(speakingPart3.value);
        }
    }

    downloadPDF() {
        this.pdf.downloadPDF();
    }

    showError(message) {
        IELTSUtils.showNotification(message, 'error');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IELTSCore;
}
