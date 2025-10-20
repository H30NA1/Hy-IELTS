// IELTS Practice Test Application
class IELTSTest {
    constructor() {
        this.currentSection = 'listening';
        this.sections = ['listening', 'reading', 'writing', 'speaking'];
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
        this.translatedQuestions = new Set(); // Track which questions have been translated
        this.translationPenalties = {}; // Track translation penalties
        this.startTime = Date.now();
        this.timerInterval = null;
        this.testSubmitted = false;
        this.testData = null;
        this.results = null;
        this.reviewMode = false; // Add review mode state
        this.writingCheckTimeouts = {}; // For debounced writing checks
        this.userName = null; // Store user name
        
        // Countdown timer settings (2 hours 40 minutes = 160 minutes = 9600 seconds)
        this.totalTimeSeconds = 9600; // 2 hours 40 minutes
        this.remainingTimeSeconds = this.totalTimeSeconds;
        
        // Page leave detection settings
        this.pageLeaveTimeout = null;
        this.pageLeaveGracePeriod = 30000; // 30 seconds grace period
        this.isListeningActive = false; // Track if listening is active
        this.isWritingActive = false; // Track if writing is active
        this.lastActivityTime = Date.now();
        this.activityTimeout = 300000; // 5 minutes of inactivity before warning
        this.inactivityTimeout = null; // Timeout for inactivity checking
        
        // Setup debug functions
        this.setupGlobalDebugFunctions();
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing IELTS Test application...');
            
            // Show user name input modal first
            this.showUserNameModal();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    // Show user name input modal
    showUserNameModal() {
        const modal = document.getElementById('user-name-modal');
        modal.classList.add('active');
        
        // Focus on input
        const nameInput = document.getElementById('user-name-input');
        nameInput.focus();
        
        // Add event listeners for name input
        this.setupNameInputListeners();
    }
    
    // Setup name input validation and listeners
    setupNameInputListeners() {
        const nameInput = document.getElementById('user-name-input');
        const startBtn = document.getElementById('start-test-btn');
        const validation = document.getElementById('name-validation');
        
        // Real-time validation
        nameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim();
            this.validateUserName(name, validation, startBtn);
        });
        
        // Enter key to start test
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !startBtn.disabled) {
                this.startTest();
            }
        });
        
        // Start test button
        startBtn.addEventListener('click', () => {
            this.startTest();
        });
    }
    
    // Validate user name
    validateUserName(name, validation, startBtn) {
        if (name.length < 2) {
            validation.textContent = 'Name must be at least 2 characters long';
            validation.className = 'name-validation invalid';
            startBtn.disabled = true;
        } else if (name.length > 50) {
            validation.textContent = 'Name must be less than 50 characters';
            validation.className = 'name-validation invalid';
            startBtn.disabled = true;
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            validation.textContent = 'Name can only contain letters and spaces';
            validation.className = 'name-validation invalid';
            startBtn.disabled = true;
        } else {
            validation.textContent = '✓ Valid name';
            validation.className = 'name-validation valid';
            startBtn.disabled = false;
        }
    }
    
    // Start the test after name input
    async startTest() {
        const nameInput = document.getElementById('user-name-input');
        const userName = nameInput.value.trim();
        
        if (!userName || userName.length < 2) {
            return;
        }
        
        this.userName = userName;
        
        // Hide name input modal
        this.closeModal('user-name-modal');
        
        // Show rules modal
        this.showRulesModal();
    }
    
    // Show rules modal
    showRulesModal() {
        const modal = document.getElementById('exam-rules-modal');
        if (!modal) {
            console.error('Rules modal not found');
            return;
        }
        
        modal.classList.add('active');
        
        // Clear any existing event listeners by removing and re-adding the button
        const acknowledgeBtn = document.getElementById('acknowledge-rules-modal');
        if (acknowledgeBtn) {
            // Remove the old button
            acknowledgeBtn.remove();
            
            // Create a new button with the same content
            const newBtn = document.createElement('button');
            newBtn.className = 'btn btn-primary';
            newBtn.id = 'acknowledge-rules-modal';
            newBtn.innerHTML = '<i class="fas fa-check"></i> I Understand and Agree to Follow These Rules';
            
            // Add the new button to the modal
            const modalActions = modal.querySelector('.modal-actions');
            if (modalActions) {
                modalActions.appendChild(newBtn);
            }
            
            // Add event listener to the new button
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Rules acknowledged, closing modal...');
                this.acknowledgeRules();
            });
        }
    }
    
    // Acknowledge rules and start the actual test
    async acknowledgeRules() {
        console.log('acknowledgeRules called');
        
        try {
            // Hide rules modal immediately
            const modal = document.getElementById('exam-rules-modal');
            if (modal) {
                modal.classList.remove('active');
                console.log('Modal hidden');
            }
            
            // Store acknowledgment
            localStorage.setItem('ielts-rules-acknowledged', 'true');
            localStorage.setItem('ielts-user-name', this.userName);
            
            // Show success message
            this.showMessage('Rules acknowledged. Good luck with your test!', 'info');
            
            // Wait a moment for modal transition
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Start the actual test initialization
            console.log('Starting test initialization...');
            await this.initializeTest();
            
        } catch (error) {
            console.error('Error in acknowledgeRules:', error);
            this.showError('Failed to start test. Please refresh the page.');
        }
    }
    
    // Initialize the actual test
    async initializeTest() {
        try {
            console.log('Initializing test for user:', this.userName);
            
            // Initialize speech synthesis voices
            this.initializeSpeechSynthesis();
            
            // Load test data from server with retry mechanism
            console.log('Fetching test data from /api/test-data...');
            
            // Retry mechanism for API calls
            let response;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    console.log(`API attempt ${attempts + 1}/${maxAttempts}...`);
                    response = await fetch('/api/test-data');
                    
                    if (response.ok) {
                        break;
                    } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    attempts++;
                    console.warn(`API attempt ${attempts} failed:`, error.message);
                    
                    if (attempts >= maxAttempts) {
                        throw error;
                    }
                    
                    const delay = Math.min(500 * Math.pow(2, attempts - 1), 2000);
                    console.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            this.testData = await response.json();
            console.log('Test data loaded successfully:', this.testData.testTitle);
            
            // Setup UI components
            this.setupEventListeners();
            this.renderListeningQuestions();
            this.renderReadingQuestions();
            this.renderWritingTasks();
            this.renderSpeakingTasks();
            this.startTimer();
            this.updateProgress();
            this.updateNavigation();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to load test data:', error);
            
            let errorMessage = error.message;
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Server error: Test data not found. Please contact support.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error: Internal server error. Please try again later.';
            }
            
            this.showError(`${errorMessage} Please refresh the page or contact support if the problem persists.`);
        }
    }
    
    initializeSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            // Load voices when they become available
            const voices = window.speechSynthesis.getVoices();
            
            if (voices.length > 0) {
                console.log('Speech synthesis voices loaded:', voices.length);
                this.availableVoices = voices;
            } else {
                // Wait for voices to load
                window.speechSynthesis.onvoiceschanged = () => {
                    const loadedVoices = window.speechSynthesis.getVoices();
                    console.log('Speech synthesis voices loaded:', loadedVoices.length);
                    this.availableVoices = loadedVoices;
                };
            }
            
            console.log('Speech synthesis initialized');
        } else {
            console.warn('Speech synthesis not supported in this browser');
        }
    }
    
    // Get the best available voice for IELTS listening
    getBestVoice() {
        if (!this.availableVoices || this.availableVoices.length === 0) {
            return null;
        }
        
        // Priority order: British English, American English, any English, any voice
        const britishVoice = this.availableVoices.find(voice => 
            voice.lang.startsWith('en-GB') && voice.name.toLowerCase().includes('british')
        );
        
        const americanVoice = this.availableVoices.find(voice => 
            voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('american')
        );
        
        const englishVoice = this.availableVoices.find(voice => 
            voice.lang.startsWith('en')
        );
        
        return britishVoice || americanVoice || englishVoice || this.availableVoices[0];
    }
    
    // Create dynamic TTS controls
    createTTSControls(scriptId) {
        const scriptContainer = document.querySelector(`#script${scriptId}-text`).parentElement;
        
        // Check if controls already exist
        if (scriptContainer.querySelector('.tts-controls')) {
            return;
        }
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'tts-controls';
        controlsDiv.innerHTML = `
            <div class="tts-settings">
                <div class="tts-control-group">
                    <label for="speed-select-${scriptId}">Speed:</label>
                    <select id="speed-select-${scriptId}" class="speed-select">
                        <option value="0.8">Slow (0.8x)</option>
                        <option value="0.9" selected>Normal (0.9x)</option>
                        <option value="1.0">Fast (1.0x)</option>
                        <option value="1.1">Very Fast (1.1x)</option>
                    </select>
                </div>
                <div class="tts-control-group">
                    <label for="pitch-select-${scriptId}">Pitch:</label>
                    <select id="pitch-select-${scriptId}" class="pitch-select">
                        <option value="0.9">Low</option>
                        <option value="1.0" selected>Normal</option>
                        <option value="1.1">High</option>
                    </select>
                </div>
            </div>
            <div class="tts-info">
                <p><i class="fas fa-info-circle"></i> <strong>Listening Mode:</strong> Random voice, speed, and pitch for realistic IELTS experience</p>
            </div>
        `;
        
        // Insert controls before the script text
        const scriptText = scriptContainer.querySelector(`#script${scriptId}-text`);
        scriptText.parentNode.insertBefore(controlsDiv, scriptText);
        
        // Add event listeners
        this.setupTTSEventListeners(scriptId);
    }
    
    populateVoiceOptions(scriptId) {
        const voiceSelect = document.getElementById(`voice-select-${scriptId}`);
        if (!voiceSelect || !this.availableVoices) return;
        
        // Clear existing options except the first one
        while (voiceSelect.children.length > 1) {
            voiceSelect.removeChild(voiceSelect.lastChild);
        }
        
        // Add available voices
        this.availableVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }
    
    setupTTSEventListeners(scriptId) {
        // TTS controls are hidden, so no event listeners needed
        console.log('TTS controls hidden for script', scriptId);
    }
    
    updateTTSVoice(scriptId) {
        const voiceSelect = document.getElementById(`voice-select-${scriptId}`);
        if (voiceSelect && voiceSelect.value !== 'auto') {
            const selectedVoice = this.availableVoices.find(voice => voice.name === voiceSelect.value);
            if (selectedVoice) {
                this.currentVoice = selectedVoice;
            }
        } else {
            this.currentVoice = this.getBestVoice();
        }
    }
    
    updateTTSSpeed(scriptId) {
        const speedSelect = document.getElementById(`speed-select-${scriptId}`);
        if (speedSelect) {
            this.currentSpeed = parseFloat(speedSelect.value);
        }
    }
    
    updateTTSPitch(scriptId) {
        const pitchSelect = document.getElementById(`pitch-select-${scriptId}`);
        if (pitchSelect) {
            this.currentPitch = parseFloat(pitchSelect.value);
        }
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
                this.updateActivity();
            });
        });
        
        // Footer buttons
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousSection();
            this.updateActivity();
        });
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextSection();
            this.updateActivity();
        });
        
        // Writing word count - improved with better error handling
        ['writing-task1', 'writing-task2'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                // Initialize word count for existing content
                this.updateWordCount(id, textarea.value);
                
                textarea.addEventListener('input', (e) => {
                    console.log(`Textarea input detected: ${id}, value length: ${e.target.value.length}`);
                    this.updateWordCount(e.target.id, e.target.value);
                    this.answers.writing[id.replace('writing-', '')] = e.target.value;
                    
                    // Add real-time writing check (debounced)
                    this.debouncedWritingCheck(e.target.id, e.target.value);
                    this.updateActivity();
                });
                
                // Also listen for paste events
                textarea.addEventListener('paste', (e) => {
                    setTimeout(() => {
                        console.log(`Textarea paste detected: ${id}, value length: ${textarea.value.length}`);
                        this.updateWordCount(id, textarea.value);
                    }, 100);
                });
            } else {
                console.warn(`Textarea with id ${id} not found`);
            }
        });
        
        // Speaking word count - improved with better error handling
        ['speaking-part1', 'speaking-part2', 'speaking-part3'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                // Initialize word count for existing content
                this.updateWordCount(id, textarea.value);
                
                textarea.addEventListener('input', (e) => {
                    console.log(`Speaking textarea input detected: ${id}, value length: ${e.target.value.length}`);
                    this.updateWordCount(e.target.id, e.target.value);
                    this.answers.speaking[id.replace('speaking-', '')] = e.target.value;
                    this.updateActivity();
                });
                
                // Also listen for paste events
                textarea.addEventListener('paste', (e) => {
                    setTimeout(() => {
                        this.updateWordCount(id, textarea.value);
                        this.answers.speaking[id.replace('speaking-', '')] = textarea.value;
                        this.updateActivity();
                    }, 10);
                });
            } else {
                console.warn(`Speaking textarea with id ${id} not found`);
            }
        });
        
        // Writing assessment buttons - using event delegation for better reliability
        document.addEventListener('click', (e) => {
            if (e.target.closest('.writing-check-btn')) {
                const btn = e.target.closest('.writing-check-btn');
                const taskId = btn.dataset.task;
                if (taskId) {
                    this.checkWritingTask(taskId);
                    this.updateActivity();
                }
            }
        });
        
        // Writing translation buttons - using event delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.writing-translate-btn')) {
                const btn = e.target.closest('.writing-translate-btn');
                const taskId = btn.dataset.task;
                if (taskId) {
                    this.translateWritingTask(taskId);
                    this.updateActivity();
                }
            }
        });
        
        // Event delegation for dynamically created elements
        document.addEventListener('click', (e) => {
            // Passage translation buttons
            if (e.target.closest('.passage-translate-btn')) {
                const btn = e.target.closest('.passage-translate-btn');
                const passageId = btn.dataset.passage;
                this.translatePassage(passageId);
                this.updateActivity();
            }
            
            // Question translation buttons
            if (e.target.closest('.translate-btn') && !e.target.closest('.passage-translate-btn') && !e.target.closest('.writing-translate-btn') && !e.target.closest('.transcript-translate-btn')) {
                const btn = e.target.closest('.translate-btn');
                const questionId = btn.dataset.question;
                if (questionId) {
                    this.translateQuestion(questionId);
                    this.updateActivity();
                }
            }
        });
        
        // Modal events
        document.getElementById('cancel-submit').addEventListener('click', () => this.closeModal('submit-modal'));
        document.getElementById('confirm-submit').addEventListener('click', () => this.submitTest());
        document.getElementById('review-test').addEventListener('click', () => this.reviewTest());
        document.getElementById('new-test').addEventListener('click', () => this.newTest());
        document.getElementById('download-pdf').addEventListener('click', () => this.downloadPDF());
        
        // Exam rules acknowledgment
        const acknowledgeBtn = document.getElementById('acknowledge-rules');
        if (acknowledgeBtn) {
            acknowledgeBtn.addEventListener('click', () => this.acknowledgeRules());
        }
        
        // Page visibility monitoring with improved detection
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Activity tracking
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), { passive: true });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
            this.updateActivity();
        });
        
        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (!this.testSubmitted) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }
    
    // Update activity timestamp
    updateActivity() {
        this.lastActivityTime = Date.now();
        
        // Clear any existing inactivity timeout
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
        }
        
        // Set new inactivity timeout
        this.inactivityTimeout = setTimeout(() => {
            this.checkInactivity();
        }, this.activityTimeout);
    }
    
    // Check for inactivity and provide warning
    checkInactivity() {
        const timeSinceLastActivity = Date.now() - this.lastActivityTime;
        const minutesInactive = Math.floor(timeSinceLastActivity / 60000);
        
        if (minutesInactive >= 5 && !this.testSubmitted) {
            // Show inactivity warning
            this.showInactivityWarning(minutesInactive);
        }
    }
    
    // Show inactivity warning
    showInactivityWarning(minutesInactive) {
        const warningModal = document.createElement('div');
        warningModal.className = 'modal active';
        warningModal.id = 'inactivity-warning-modal';
        warningModal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-clock"></i> Inactivity Warning</h3>
                <p><strong>You have been inactive for ${minutesInactive} minutes.</strong></p>
                <p>If you continue to be inactive, your test may be marked as invalid.</p>
                <p><strong>Current section:</strong> ${this.currentSection.charAt(0).toUpperCase() + this.currentSection.slice(1)}</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="continue-activity">Continue Test</button>
                    <button class="btn btn-secondary" id="submit-inactive">Submit Test</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warningModal);
        
        // Add event listeners
        document.getElementById('continue-activity').addEventListener('click', () => {
            this.closeModal('inactivity-warning-modal');
            this.updateActivity();
        });
        
        document.getElementById('submit-inactive').addEventListener('click', () => {
            this.closeModal('inactivity-warning-modal');
            this.submitInvalidTest();
        });
    }
    
    renderGrammarQuestions() {
        if (!this.testData || !this.testData.sections || !this.testData.sections.grammar) return;
        
        const container = document.getElementById('grammar-questions');
        container.innerHTML = '';
        
        this.testData.sections.grammar.questions.forEach(q => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.innerHTML = `
                <div class="question-header">
                    <div class="question-header-top">
                        <span class="question-number">Question ${q.id}</span>
                        <button class="translate-btn" data-question="${q.id}" title="Translate to Vietnamese (0.5 grade penalty)">
                            <i class="fas fa-language"></i>
                            <span>Translate</span>
                        </button>
                    </div>
                    <div class="question-text" id="question-text-${q.id}">${q.question}</div>
                    <div class="question-translation" id="question-translation-${q.id}" style="display: none;">
                        <p class="translation-label">Vietnamese Translation:</p>
                        <p class="translation-text" id="translation-text-${q.id}">Translating...</p>
                    </div>
                </div>
                <div class="options">
                    ${q.options.map((option, index) => `
                        <div class="option" data-question="${q.id}" data-option="${index}">
                            <div class="option-label">${String.fromCharCode(65 + index)}</div>
                            <div class="option-text" id="option-text-${q.id}-${index}">${option}</div>
                            <div class="option-translation" id="option-translation-${q.id}-${index}" style="display: none;">
                                <p class="translation-text" id="option-translation-text-${q.id}-${index}">Translating...</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Add event listeners to options
            questionDiv.querySelectorAll('.option').forEach(option => {
                option.addEventListener('click', (e) => {
                    this.selectOption(e.currentTarget);
                });
            });
            
            // Add event listener to translation button
            const translateBtn = questionDiv.querySelector('.translate-btn');
            translateBtn.addEventListener('click', (e) => {
                this.translateQuestion(q.id);
            });
            
            container.appendChild(questionDiv);
        });
    }
    
    renderSpeakingTasks() {
        // Speaking tasks are already rendered in HTML, just need to initialize them
        console.log('Speaking tasks initialized');
    }
    
    renderReadingQuestions() {
        if (!this.testData || !this.testData.sections || !this.testData.sections.reading) return;
        
        // Render Passage 1 content and questions
        const passage1Container = document.querySelector('#reading .passage-container:nth-child(2) .passage-text');
        if (passage1Container && this.testData.sections.reading.passages[0]) {
            const passage = this.testData.sections.reading.passages[0];
            passage1Container.innerHTML = `
                <div class="passage-header">
                    <h4>${passage.title}</h4>
                    <button class="translate-btn passage-translate-btn" data-passage="1" title="Translate passage to Vietnamese (0.5 grade penalty)">
                        <i class="fas fa-language"></i>
                        <span>Translate</span>
                    </button>
                </div>
                <div class="passage-content" id="passage1-content">
                    <p>${passage.content}</p>
                </div>
                <div class="passage-translation" id="passage1-translation" style="display: none;">
                    <p class="translation-label">Vietnamese Translation:</p>
                    <p class="translation-text" id="passage1-translation-text">Translating...</p>
                </div>
            `;
        }
        
        const container1 = document.getElementById('reading-passage1-questions');
        container1.innerHTML = '';
        
        this.testData.sections.reading.passages[0].questions.forEach(q => {
            const questionDiv = this.createQuestionElement(q);
            container1.appendChild(questionDiv);
        });
        
        // Render Passage 2 content and questions
        const passage2Container = document.querySelector('#reading .passage-container:nth-child(3) .passage-text');
        if (passage2Container && this.testData.sections.reading.passages[1]) {
            const passage = this.testData.sections.reading.passages[1];
            passage2Container.innerHTML = `
                <div class="passage-header">
                    <h4>${passage.title}</h4>
                    <button class="translate-btn passage-translate-btn" data-passage="2" title="Translate passage to Vietnamese (0.5 grade penalty)">
                        <i class="fas fa-language"></i>
                        <span>Translate</span>
                    </button>
                </div>
                <div class="passage-content" id="passage2-content">
                    <p>${passage.content}</p>
                </div>
                <div class="passage-translation" id="passage2-translation" style="display: none;">
                    <p class="translation-label">Vietnamese Translation:</p>
                    <p class="translation-text" id="passage2-translation-text">Translating...</p>
                </div>
            `;
        }
        
        const container2 = document.getElementById('reading-passage2-questions');
        container2.innerHTML = '';
        
        this.testData.sections.reading.passages[1].questions.forEach(q => {
            const questionDiv = this.createQuestionElement(q);
            container2.appendChild(questionDiv);
        });
    }
    
    renderListeningQuestions() {
        if (!this.testData || !this.testData.sections || !this.testData.sections.listening) return;
        
        // Render Part 1 questions (Questions 1-10)
        const container1 = document.getElementById('listening-part1-questions');
        if (container1) {
            container1.innerHTML = '';
            // Generate sample questions for Part 1 (Questions 1-10)
            for (let i = 1; i <= 10; i++) {
                const questionDiv = this.createListeningQuestionElement(i, 'A', 'B', 'C', 'D');
                container1.appendChild(questionDiv);
            }
        }
        
        // Render Part 2 questions (Questions 11-20)
        const container2 = document.getElementById('listening-part2-questions');
        if (container2) {
            container2.innerHTML = '';
            for (let i = 11; i <= 20; i++) {
                const questionDiv = this.createListeningQuestionElement(i, 'A', 'B', 'C', 'D');
                container2.appendChild(questionDiv);
            }
        }
        
        // Render Part 3 questions (Questions 21-30)
        const container3 = document.getElementById('listening-part3-questions');
        if (container3) {
            container3.innerHTML = '';
            for (let i = 21; i <= 30; i++) {
                const questionDiv = this.createListeningQuestionElement(i, 'A', 'B', 'C', 'D');
                container3.appendChild(questionDiv);
            }
        }
        
        // Render Part 4 questions (Questions 31-40)
        const container4 = document.getElementById('listening-part4-questions');
        if (container4) {
            container4.innerHTML = '';
            for (let i = 31; i <= 40; i++) {
                const questionDiv = this.createListeningQuestionElement(i, 'A', 'B', 'C', 'D');
                container4.appendChild(questionDiv);
            }
        }
    }
    
    renderWritingTasks() {
        if (!this.testData || !this.testData.sections || !this.testData.sections.writing) return;
        
        // Render Task 1
        const task1Instruction = document.getElementById('task1-instruction');
        if (task1Instruction && this.testData.sections.writing.tasks[0]) {
            task1Instruction.textContent = this.testData.sections.writing.tasks[0].instruction;
        }
        
        // Render Task 2
        const task2Instruction = document.getElementById('task2-instruction');
        if (task2Instruction && this.testData.sections.writing.tasks[1]) {
            task2Instruction.textContent = this.testData.sections.writing.tasks[1].instruction;
        }
        
        // Render Task 3
        const task3Instruction = document.getElementById('task3-instruction');
        if (task3Instruction && this.testData.sections.writing.tasks[2]) {
            task3Instruction.textContent = this.testData.sections.writing.tasks[2].instruction;
        }
    }
    
    createQuestionElement(q) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
            <div class="question-header">
                <div class="question-header-top">
                    <span class="question-number">Question ${q.id}</span>
                    <button class="translate-btn" data-question="${q.id}" title="Translate to Vietnamese (0.5 grade penalty)">
                        <i class="fas fa-language"></i>
                        <span>Translate</span>
                    </button>
                </div>
                <div class="question-text" id="question-text-${q.id}">${q.question}</div>
                <div class="question-translation" id="question-translation-${q.id}" style="display: none;">
                    <p class="translation-label">Vietnamese Translation:</p>
                    <p class="translation-text" id="translation-text-${q.id}">Translating...</p>
                </div>
            </div>
            <div class="options">
                ${q.options.map((option, index) => `
                    <div class="option" data-question="${q.id}" data-option="${index}">
                        <div class="option-label">${String.fromCharCode(65 + index)}</div>
                        <div class="option-text" id="option-text-${q.id}-${index}">${option}</div>
                        <div class="option-translation" id="option-translation-${q.id}-${index}" style="display: none;">
                            <p class="translation-text" id="option-translation-text-${q.id}-${index}">Translating...</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${q.explanation ? `
                <div class="explanation" id="explanation-${q.id}" style="display: none;">
                    <p class="explanation-label">Explanation:</p>
                    <p class="explanation-text" id="explanation-text-${q.id}">${q.explanation}</p>
                    <div class="explanation-translation" id="explanation-translation-${q.id}" style="display: none;">
                        <p class="translation-label">Vietnamese Translation:</p>
                        <p class="translation-text" id="explanation-translation-text-${q.id}">Translating...</p>
                    </div>
                </div>
            ` : ''}
        `;
        
        // Add event listeners to options
        questionDiv.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectOption(e.currentTarget);
            });
        });
        
        // Add event listener to translation button
        const translateBtn = questionDiv.querySelector('.translate-btn');
        translateBtn.addEventListener('click', (e) => {
            this.translateQuestion(q.id);
        });
        
        return questionDiv;
    }
    
    setupListeningControls() {
        // Setup play buttons
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.playScript(parseInt(e.currentTarget.dataset.script));
            });
        });
        
        // Setup show transcript buttons
        document.querySelectorAll('.show-transcript-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showTranscript(parseInt(e.currentTarget.dataset.script));
            });
        });
        
        // Setup transcript translation buttons
        document.querySelectorAll('.transcript-translate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.translateTranscript(parseInt(e.currentTarget.dataset.script));
            });
        });
    }
    
    playScript(scriptId) {
        const playBtn = document.getElementById(`play-script${scriptId}`);
        if (!playBtn) {
            console.error(`Play button for script ${scriptId} not found`);
            return;
        }
        
        const icon = playBtn.querySelector('i');
        if (!icon) {
            console.error(`Icon element for script ${scriptId} not found`);
            return;
        }
        
        // Get the script content for TTS
        const scriptContent = document.getElementById(`script${scriptId}-content`);
        const scriptText = scriptContent ? scriptContent.textContent : `Script ${scriptId} content`;
        
        if (icon.classList.contains('fa-play')) {
            // Start playing
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            this.updateButtonText(playBtn, 'Pause Script');
            
            // Mark listening as active
            this.isListeningActive = true;
            
            // Use Web Speech API for TTS
            if ('speechSynthesis' in window) {
                try {
                    // Check if speech synthesis is paused (browser autoplay policy)
                    if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    }
                    
                    // Stop any existing speech
                    window.speechSynthesis.cancel();
                    
                    // Create speech utterance
                    const utterance = new SpeechSynthesisUtterance(scriptText);
                    
                    // Generate NEW random settings for each play
                    const randomSpeed = this.getRandomSpeed();
                    const randomPitch = this.getRandomPitch();
                    const randomVoice = this.getRandomVoice();
                    
                    // Apply the new random settings
                    utterance.rate = randomSpeed;
                    utterance.pitch = randomPitch;
                    utterance.volume = 1.0;
                    
                    // Set random voice for each script
                    if (randomVoice) {
                        utterance.voice = randomVoice;
                    }
                    
                    // Event handlers
                    utterance.onstart = () => {
                        // Show minimal feedback without settings details
                        this.showMessage(`Playing Script ${scriptId}...`, 'info');
                        this.isListeningActive = true;
                    };
                    
                    utterance.onend = () => {
                        if (icon.classList.contains('fa-pause')) {
                            icon.classList.remove('fa-pause');
                            icon.classList.add('fa-play');
                            this.updateButtonText(playBtn, 'Play Script');
                            this.showMessage(`Script ${scriptId} finished`, 'info');
                            this.isListeningActive = false;
                        }
                    };
                    
                    utterance.onerror = (event) => {
                        console.error('Speech synthesis error:', event);
                        this.showAudioError(`Speech synthesis error: ${event.error}`);
                        // Reset button state
                        icon.classList.remove('fa-pause');
                        icon.classList.add('fa-play');
                        this.updateButtonText(playBtn, 'Play Script');
                        this.isListeningActive = false;
                    };
                    
                    utterance.onpause = () => {
                        this.showMessage('Script paused', 'info');
                        this.isListeningActive = false;
                    };
                    
                    utterance.onresume = () => {
                        this.showMessage('Script resumed', 'info');
                        this.isListeningActive = true;
                    };
                    
                    // Start speaking
                    window.speechSynthesis.speak(utterance);
                    
                } catch (error) {
                    console.error('Error starting speech synthesis:', error);
                    this.showAudioError(`Failed to start speech synthesis: ${error.message}`);
                    // Reset button state
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                    this.updateButtonText(playBtn, 'Play Script');
                    this.isListeningActive = false;
                }
            } else {
                // Fallback to simulation if TTS not available
                this.showMessage(`Playing Script ${scriptId}... (Audio simulation)`, 'info');
                this.isListeningActive = true;
                setTimeout(() => {
                    if (icon.classList.contains('fa-pause')) {
                        icon.classList.remove('fa-pause');
                        icon.classList.add('fa-play');
                        this.updateButtonText(playBtn, 'Play Script');
                        this.showMessage(`Script ${scriptId} finished`, 'info');
                        this.isListeningActive = false;
                    }
                }, scriptId === 1 ? 45000 : 35000);
            }
        } else {
            // Pause/Stop
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            this.updateButtonText(playBtn, 'Play Script');
            
            // Stop speech synthesis
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            
            this.isListeningActive = false;
            this.showMessage('Script stopped', 'info');
        }
    }
    
    // Helper function to safely update button text content
    updateButtonText(button, newText) {
        try {
            if (!button) {
                console.error('Button is null or undefined');
                return;
            }
            
            // First try to find a span element
            const textElement = button.querySelector('span');
            if (textElement) {
                textElement.textContent = newText;
                return;
            }
            
            // If no span element, find and update the text node directly
            const childNodes = button.childNodes;
            
            // Look for the last text node (which should be the button text)
            for (let i = childNodes.length - 1; i >= 0; i--) {
                const node = childNodes[i];
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    node.textContent = newText;
                    return;
                }
            }
            
            // If no text node found, append the text as a new text node
            button.appendChild(document.createTextNode(newText));
            
        } catch (error) {
            console.error('Error updating button text:', error);
        }
    }
    
    showTranscript(scriptId) {
        const scriptText = document.getElementById(`script${scriptId}-text`);
        const showBtn = document.getElementById(`show-transcript${scriptId}`);
        
        if (!scriptText) {
            console.error(`Script text element for script ${scriptId} not found`);
            return;
        }
        
        if (!showBtn) {
            console.error(`Show transcript button for script ${scriptId} not found`);
            return;
        }
        
        scriptText.style.display = 'block';
        showBtn.style.display = 'none';
        
        // Apply -1 mark penalty
        this.showTranscriptPenalty(scriptId);
        
        this.showMessage(`Transcript ${scriptId} shown (-1 mark penalty)`, 'warning');
    }
    
    async translateTranscript(scriptId) {
        try {
            const scriptContent = document.getElementById(`script${scriptId}-content`);
            const translationElement = document.getElementById(`script${scriptId}-translation`);
            const translationText = document.getElementById(`script${scriptId}-translation-text`);
            
            if (!scriptContent) {
                console.error(`Script content element for script ${scriptId} not found`);
                return;
            }
            
            if (!translationElement) {
                console.error(`Translation element for script ${scriptId} not found`);
                return;
            }
            
            if (!translationText) {
                console.error(`Translation text element for script ${scriptId} not found`);
                return;
            }
            
            const scriptText = scriptContent.textContent;
            translationElement.style.display = 'block';
            translationText.textContent = 'Translating...';
            
            // Look for Vietnamese translation in the script data
            const script = this.testData.sections.listening.scripts.find(s => s.id === parseInt(scriptId));
            if (script && script.contentVi) {
                // Use the Vietnamese content from the data
                translationText.textContent = script.contentVi;
            } else {
                // Fallback to translation API
                const translatedScript = await this.translateText(scriptText);
                translationText.textContent = translatedScript;
            }
            
            // Apply -0.5 mark penalty
            this.showTranscriptTranslationPenalty(scriptId);
            
        } catch (error) {
            console.error('Transcript translation error:', error);
            this.showError('Translation failed. Please try again.');
        }
    }
    
    showTranscriptPenalty(scriptId) {
        const penalty = -1;
        this.translationPenalties[`transcript-${scriptId}`] = penalty;
        
        const message = `Transcript penalty applied: ${penalty} mark`;
        this.showMessage(message, 'warning');
        
        // Update penalty display if it exists
        const penaltyDisplay = document.getElementById('translation-penalty-display');
        if (penaltyDisplay) {
            this.updatePenaltyDisplay();
        }
    }
    
    showTranscriptTranslationPenalty(scriptId) {
        const penalty = -0.5;
        this.translationPenalties[`transcript-translation-${scriptId}`] = penalty;
        
        const message = `Transcript translation penalty applied: ${penalty} mark`;
        this.showMessage(message, 'warning');
        
        // Update penalty display if it exists
        const penaltyDisplay = document.getElementById('translation-penalty-display');
        if (penaltyDisplay) {
            this.updatePenaltyDisplay();
        }
    }
    
    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: var(--border-radius-sm);
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        if (type === 'warning') {
            messageDiv.style.backgroundColor = 'var(--warning-color)';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = 'var(--error-color)';
        } else {
            messageDiv.style.backgroundColor = 'var(--primary-color)';
        }
        
        document.body.appendChild(messageDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
    
    showAudioError(message) {
        console.error('Audio error:', message);
        
        // Create a more user-friendly error message
        let userMessage = 'Audio playback issue';
        
        if (message.includes('interrupted')) {
            userMessage = 'Audio stopped';
        } else if (message.includes('not-allowed')) {
            userMessage = 'Audio permission required';
        } else if (message.includes('network')) {
            userMessage = 'Audio connection issue';
        } else if (message.includes('timeout')) {
            userMessage = 'Audio loading timeout';
        }
        
        this.showMessage(userMessage, 'warning');
    }
    
    updatePenaltyDisplay() {
        const penaltyDisplay = document.getElementById('translation-penalty-display');
        if (penaltyDisplay) {
            const totalPenalty = Object.values(this.translationPenalties).reduce((sum, penalty) => sum + penalty, 0);
            penaltyDisplay.textContent = `Total Translation Penalty: -${Math.abs(totalPenalty)} marks`;
        }
    }
    
    selectOption(optionElement) {
        if (this.testSubmitted) return;
        
        const questionId = parseInt(optionElement.dataset.question);
        const optionIndex = parseInt(optionElement.dataset.option);
        const section = this.getQuestionSection(questionId);
        
        // Clear previous selection for this question
        const questionContainer = optionElement.closest('.question');
        questionContainer.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Select new option
        optionElement.classList.add('selected');
        
        // Save answer
        this.answers[section][questionId] = optionIndex;
        
        // Update progress
        this.updateProgress();
    }
    
    getQuestionSection(questionId) {
        if (questionId <= 30) return 'grammar';
        if (questionId <= 50) return 'reading';
        if (questionId <= 60) return 'listening';
        return 'writing';
    }
    
    async translateQuestion(questionId) {
        // Check if already translated
        if (this.translatedQuestions.has(questionId)) {
            return;
        }
        
        // Mark as translated and apply penalty
        this.translatedQuestions.add(questionId);
        
        // Add translation penalty to the penalties object
        this.translationPenalties[`question-${questionId}`] = -0.5;
        
        try {
            // Get question data
            const question = this.findQuestionById(questionId);
            if (!question) return;
            
            // Show translation loading
            const questionTranslation = document.getElementById(`question-translation-${questionId}`);
            const translationText = document.getElementById(`translation-text-${questionId}`);
            
            if (questionTranslation && translationText) {
                questionTranslation.style.display = 'block';
                translationText.textContent = 'Translating...';
            }
            
            // Get Vietnamese translation from question data
            const questionText = document.getElementById(`question-text-${questionId}`);
            if (questionText) {
                // Look for Vietnamese translation in the question data
                const vietnameseQuestion = question.questionVi || question.vietnamese || question.vi;
                if (vietnameseQuestion) {
                    translationText.textContent = vietnameseQuestion;
                } else {
                    // Fallback to translation API
                    const translatedQuestion = await this.translateText(questionText.textContent);
                    translationText.textContent = translatedQuestion;
                }
            }
            
            // Translate options
            for (let i = 0; i < question.options.length; i++) {
                const optionTranslation = document.getElementById(`option-translation-${questionId}-${i}`);
                const optionTranslationText = document.getElementById(`option-translation-text-${questionId}-${i}`);
                
                if (optionTranslation && optionTranslationText) {
                    optionTranslation.style.display = 'block';
                    optionTranslationText.textContent = 'Translating...';
                    
                    // Look for Vietnamese translation in the option data
                    const vietnameseOption = question.optionsVi && question.optionsVi[i] || 
                                          question.options[i].vietnamese || 
                                          question.options[i].vi;
                    
                    if (vietnameseOption) {
                        optionTranslationText.textContent = vietnameseOption;
                    } else {
                        // Fallback to translation API
                        const optionText = document.getElementById(`option-text-${questionId}-${i}`);
                        if (optionText) {
                            const translatedOption = await this.translateText(optionText.textContent);
                            optionTranslationText.textContent = translatedOption;
                        }
                    }
                }
            }
            
            // Translate explanation if it exists
            if (question.explanation) {
                const explanationElement = document.getElementById(`explanation-${questionId}`);
                const explanationTranslation = document.getElementById(`explanation-translation-${questionId}`);
                const explanationTranslationText = document.getElementById(`explanation-translation-text-${questionId}`);
                
                if (explanationElement && explanationTranslation && explanationTranslationText) {
                    // Show the explanation
                    explanationElement.style.display = 'block';
                    explanationTranslation.style.display = 'block';
                    explanationTranslationText.textContent = 'Translating...';
                    
                    // Look for Vietnamese translation in the explanation data
                    const vietnameseExplanation = question.explanationVi || question.explanation?.vietnamese || question.explanation?.vi;
                    
                    if (vietnameseExplanation) {
                        explanationTranslationText.textContent = vietnameseExplanation;
                    } else {
                        // Fallback to translation API
                        const explanationText = document.getElementById(`explanation-text-${questionId}`);
                        if (explanationText) {
                            const translatedExplanation = await this.translateText(explanationText.textContent);
                            explanationTranslationText.textContent = translatedExplanation;
                        }
                    }
                }
            }
            
            // Show penalty notification
            this.showTranslationPenalty(questionId);
            
        } catch (error) {
            console.error('Translation error:', error);
            this.showError('Translation failed. Please try again.');
        }
    }
    
    async translateWritingTask(taskId) {
        try {
            // Check if already translated
            const translationKey = `writing-task-${taskId}`;
            if (this.translationPenalties[translationKey]) {
                this.showMessage('Translation already applied for this task', 'warning');
                return;
            }
            
            // Get the instruction text
            const instructionElement = document.getElementById(`task${taskId}-instruction`);
            if (!instructionElement) return;
            
            const instructionText = instructionElement.textContent;
            
            // Show translation loading
            const translationElement = document.getElementById(`task${taskId}-translation`);
            const translationText = document.getElementById(`task${taskId}-translation-text`);
            
            if (translationElement && translationText) {
                translationElement.style.display = 'block';
                translationText.textContent = 'Translating...';
            }
            
            // Look for Vietnamese translation in the writing task data
            const writingTask = this.testData.sections.writing.tasks.find(task => task.id === parseInt(taskId));
            if (writingTask && writingTask.instructionVi) {
                // Use the Vietnamese instruction from the data
                translationText.textContent = writingTask.instructionVi;
            } else {
                // Fallback to translation API
                const translatedInstruction = await this.translateText(instructionText);
                translationText.textContent = translatedInstruction;
            }
            
            // Apply translation penalty (-0.5 points)
            this.translationPenalties[translationKey] = -0.5;
            
            // Show penalty notification
            this.showTranslationPenalty(translationKey);
            
            // Update penalty display if it exists
            const penaltyDisplay = document.getElementById('translation-penalty-display');
            if (penaltyDisplay) {
                this.updatePenaltyDisplay();
            }
            
            console.log(`Translation penalty applied for writing task ${taskId}: -0.5 points`);
            
        } catch (error) {
            console.error('Translation error:', error);
            this.showError('Translation failed. Please try again.');
        }
    }
    
    async translatePassage(passageId) {
        try {
            // Get the passage content
            const passageContent = document.getElementById(`passage${passageId}-content`);
            if (!passageContent) return;
            
            // Show translation loading
            const translationElement = document.getElementById(`passage${passageId}-translation`);
            const translationText = document.getElementById(`passage${passageId}-translation-text`);
            
            if (translationElement && translationText) {
                translationElement.style.display = 'block';
                translationText.textContent = 'Translating...';
            }
            
            // Look for Vietnamese translation in the passage data
            const passage = this.testData.sections.reading.passages[passageId - 1];
            if (passage && passage.contentVi) {
                // Use the Vietnamese content from the data
                translationText.textContent = passage.contentVi;
            } else {
                // Fallback to translation API
                const passageText = passageContent.textContent;
                const translatedPassage = await this.translateText(passageText);
                translationText.textContent = translatedPassage;
            }
            
            // Show penalty notification
            this.showTranslationPenalty(`passage-${passageId}`);
            
        } catch (error) {
            console.error('Passage translation error:', error);
            this.showError('Translation failed. Please try again.');
        }
    }
    
    findQuestionById(questionId) {
        // Convert questionId to integer for proper comparison
        const questionIdInt = parseInt(questionId);
        
        // Search in all sections using the new data structure
        if (this.testData.sections.grammar) {
            const question = this.testData.sections.grammar.questions.find(q => q.id === questionIdInt);
            if (question) return question;
        }
        
        if (this.testData.sections.reading) {
            const allReadingQuestions = [
                ...this.testData.sections.reading.passages[0].questions,
                ...this.testData.sections.reading.passages[1].questions
            ];
            const question = allReadingQuestions.find(q => q.id === questionIdInt);
            if (question) return question;
        }
        
        if (this.testData.sections.listening) {
            const allListeningQuestions = [
                ...this.testData.sections.listening.scripts[0].questions,
                ...this.testData.sections.listening.scripts[1].questions
            ];
            const question = allListeningQuestions.find(q => q.id === questionIdInt);
            if (question) return question;
        }
        
        return null;
    }
    
    async translateText(text) {
        // Simple Vietnamese translations for common IELTS vocabulary
        const translations = {
            'what': 'cái gì',
            'when': 'khi nào',
            'where': 'ở đâu',
            'why': 'tại sao',
            'how': 'như thế nào',
            'which': 'cái nào',
            'who': 'ai',
            'choose': 'chọn',
            'select': 'chọn',
            'answer': 'trả lời',
            'correct': 'đúng',
            'incorrect': 'sai',
            'true': 'đúng',
            'false': 'sai',
            'agree': 'đồng ý',
            'disagree': 'không đồng ý',
            'yes': 'có',
            'no': 'không',
            'maybe': 'có thể',
            'probably': 'có lẽ',
            'definitely': 'chắc chắn',
            'always': 'luôn luôn',
            'never': 'không bao giờ',
            'sometimes': 'đôi khi',
            'often': 'thường xuyên',
            'rarely': 'hiếm khi',
            'usually': 'thường',
            'occasionally': 'thỉnh thoảng',
            'frequently': 'thường xuyên',
            'seldom': 'ít khi',
            'hardly': 'hầu như không',
            'scarcely': 'hầu như không',
            'barely': 'hầu như không',
            'almost': 'gần như',
            'nearly': 'gần như',
            'about': 'khoảng',
            'approximately': 'xấp xỉ',
            'around': 'khoảng',
            'roughly': 'khoảng',
            'exactly': 'chính xác',
            'precisely': 'chính xác',
            'accurately': 'chính xác',
            'correctly': 'đúng',
            'properly': 'đúng cách',
            'appropriately': 'phù hợp',
            'suitably': 'phù hợp',
            'adequately': 'đầy đủ',
            'sufficiently': 'đủ',
            'enough': 'đủ',
            'plenty': 'nhiều',
            'much': 'nhiều',
            'many': 'nhiều',
            'few': 'ít',
            'little': 'ít',
            'some': 'một số',
            'any': 'bất kỳ',
            'all': 'tất cả',
            'every': 'mỗi',
            'each': 'mỗi',
            'both': 'cả hai',
            'either': 'hoặc',
            'neither': 'không ai',
            'none': 'không ai',
            'nothing': 'không có gì',
            'everything': 'tất cả',
            'something': 'cái gì đó',
            'anything': 'bất cứ cái gì',
            'someone': 'ai đó',
            'anyone': 'bất cứ ai',
            'everyone': 'mọi người',
            'no one': 'không ai',
            'somebody': 'ai đó',
            'anybody': 'bất cứ ai',
            'everybody': 'mọi người',
            'nobody': 'không ai'
        };
        
        // Simple translation logic (in a real app, you'd use a proper translation API)
        let translatedText = text;
        
        // Replace common words
        Object.entries(translations).forEach(([english, vietnamese]) => {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translatedText = translatedText.replace(regex, vietnamese);
        });
        
        // Add Vietnamese context markers
        translatedText = `[VI] ${translatedText}`;
        
        return translatedText;
    }
    
    showTranslationPenalty(questionId) {
        // Remove any existing notification for this question first
        const existingNotification = document.querySelector(`[data-question="${questionId}"] .translation-penalty-notification`);
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'translation-penalty-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Translation used - 0.5 grade penalty applied to this question</span>
        `;
        
        // Add to the question
        const questionElement = document.querySelector(`[data-question="${questionId}"]`);
        if (questionElement) {
            questionElement.appendChild(notification);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }
    
    switchSection(section) {
        if (this.testSubmitted && !this.reviewMode) return;
        
        if (this.sections.includes(section)) {
            this.currentSection = section;
            
            // Update section-specific tracking
            this.isListeningActive = section === 'listening';
            this.isWritingActive = section === 'writing';
            
            // Hide all sections
            document.querySelectorAll('.test-section').forEach(s => {
                s.classList.remove('active');
            });
            
            // Show target section
            const targetSection = document.getElementById(section);
            if (targetSection) {
                targetSection.classList.add('active');
            } else {
                console.warn(`Section element not found: ${section}`);
            }
            
            // Update navigation
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const activeNavBtn = document.querySelector(`[data-section="${section}"]`);
            if (activeNavBtn) {
                activeNavBtn.classList.add('active');
            }
            
            // Update progress
            this.updateProgress();
            
            // Clear any existing page leave timeout when switching sections
            if (this.pageLeaveTimeout) {
                clearTimeout(this.pageLeaveTimeout);
                this.pageLeaveTimeout = null;
            }
            
            // Update activity
            this.updateActivity();
            
            // Force update navigation to ensure buttons are properly enabled
            this.updateNavigation();
            
            console.log(`Switched to section: ${section}`, {
                reviewMode: this.reviewMode,
                testSubmitted: this.testSubmitted
            });
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
        } else if (this.reviewMode) {
            // In review mode, loop back to first section
            this.switchSection(this.sections[0]);
        } else {
            // Show submit modal on last section
            this.showSubmitModal();
        }
    }
    
    updateNavigation() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        // Debug logging
        console.log('updateNavigation called:', {
            currentSection: this.currentSection,
            currentIndex: currentIndex,
            sections: this.sections,
            isLastSection: currentIndex === this.sections.length - 1,
            reviewMode: this.reviewMode,
            testSubmitted: this.testSubmitted
        });
        
        // Update section indicator
        const sectionNames = {
            'grammar': 'Section A',
            'reading': 'Section B', 
            'listening': 'Section C',
            'writing': 'Section D'
        };
        
        const currentSectionElement = document.getElementById('current-section');
        if (currentSectionElement) {
            currentSectionElement.textContent = sectionNames[this.currentSection];
        }
        
        // Update button states
        if (this.reviewMode) {
            // In review mode, always enable both buttons for navigation
            if (prevBtn) {
                prevBtn.disabled = false;
                prevBtn.style.display = 'inline-flex';
            }
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.style.display = 'inline-flex';
                nextBtn.innerHTML = currentIndex === this.sections.length - 1 ? 
                    'First Section <i class="fas fa-chevron-right"></i>' : 
                    'Next <i class="fas fa-chevron-right"></i>';
            }
        } else {
            // Normal test mode
            if (prevBtn) {
                prevBtn.disabled = currentIndex === 0;
                prevBtn.style.display = 'inline-flex';
            }
            if (nextBtn) {
                nextBtn.disabled = false; // Always enable submit button
                nextBtn.style.display = 'inline-flex';
                nextBtn.innerHTML = currentIndex === this.sections.length - 1 ? 
                    'Submit <i class="fas fa-check"></i>' : 
                    'Next <i class="fas fa-chevron-right"></i>';
            }
        }
        
        // Debug logging for button states
        console.log('Button states:', {
            prevBtnDisabled: prevBtn ? prevBtn.disabled : 'N/A',
            nextBtnDisabled: nextBtn ? nextBtn.disabled : 'N/A',
            nextBtnText: nextBtn ? nextBtn.innerHTML : 'N/A'
        });
        
        // Force enable the submit button if we're on the last section (not in review mode)
        if (currentIndex === this.sections.length - 1 && !this.reviewMode) {
            if (nextBtn) {
                nextBtn.disabled = false;
                console.log('Forced enable submit button');
            }
        }
        
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach((btn, index) => {
            btn.classList.toggle('active', btn.dataset.section === this.currentSection);
            // Enable all nav buttons in review mode
            if (this.reviewMode) {
                btn.disabled = false;
                btn.style.display = 'inline-flex';
            }
        });
        
        // Additional check to ensure submit button is enabled
        this.ensureSubmitButtonEnabled();
    }
    
    ensureSubmitButtonEnabled() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        const nextBtn = document.getElementById('next-btn');
        
        if (currentIndex === this.sections.length - 1 && nextBtn.disabled) {
            console.log('Submit button was disabled, forcing enable');
            nextBtn.disabled = false;
            nextBtn.innerHTML = 'Submit <i class="fas fa-check"></i>';
        }
    }
    
    updateProgress() {
        const totalQuestions = 60; // 30 grammar + 20 reading + 10 listening
        let answeredQuestions = 0;
        
        // Count answered questions
        Object.values(this.answers.grammar).forEach(() => answeredQuestions++);
        Object.values(this.answers.reading).forEach(() => answeredQuestions++);
        Object.values(this.answers.listening).forEach(() => answeredQuestions++);
        
        const progress = (answeredQuestions / totalQuestions) * 100;
        document.getElementById('progress-bar-fill').style.width = `${progress}%`;
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.remainingTimeSeconds--;
            
            if (this.remainingTimeSeconds <= 0) {
                this.handleTimeUp();
                return;
            }
            
            this.updateTimerDisplay();
        }, 1000);
        
        // Initial display
        this.updateTimerDisplay();
    }
    
    updateTimerDisplay() {
        const hours = Math.floor(this.remainingTimeSeconds / 3600);
        const minutes = Math.floor((this.remainingTimeSeconds % 3600) / 60);
        const seconds = this.remainingTimeSeconds % 60;
        
        let timeDisplay;
        if (hours > 0) {
            timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        document.getElementById('time-display').textContent = timeDisplay;
        
        // Update timer styling based on remaining time
        const timerElement = document.getElementById('timer');
        timerElement.classList.remove('warning', 'danger');
        
        if (this.remainingTimeSeconds <= 300) { // 5 minutes or less
            timerElement.classList.add('danger');
        } else if (this.remainingTimeSeconds <= 900) { // 15 minutes or less
            timerElement.classList.add('warning');
        }
    }
    
    handleTimeUp() {
        this.stopTimer();
        this.testSubmitted = true;
        
        // Show time up modal
        this.showTimeUpModal();
    }
    
    showTimeUpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'time-up-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>⏰ Time's Up!</h3>
                <p>Your test time has expired. The test will be automatically submitted with your current answers.</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="submit-time-up">Submit Test</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener
        document.getElementById('submit-time-up').addEventListener('click', () => {
            this.submitTestFromTimeUp();
        });
    }
    
    async submitTestFromTimeUp() {
        try {
            this.closeModal('time-up-modal');
            this.showLoading('Submitting test...');
            
            const timeSpent = this.formatTimeSpent();
            
            const response = await fetch('/api/submit-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: {
                        ...this.answers,
                        translatedQuestions: Array.from(this.translatedQuestions)
                    },
                    timeSpent,
                    userInfo: {
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                        submittedBy: 'time_up'
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.results = result.results;
                this.submissionId = result.submissionId;
                this.pdfUrl = result.pdfUrl;
                this.showResults();
            } else {
                throw new Error(result.error || 'Failed to submit test');
            }
            
        } catch (error) {
            console.error('Error submitting test:', error);
            this.showError('Failed to submit test. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    formatTimeSpent() {
        const elapsedSeconds = this.totalTimeSeconds - this.remainingTimeSeconds;
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateWordCount(textareaId, text) {
        // Extract the task number from the textarea ID (e.g., "writing-task1" -> "1")
        const taskNumber = textareaId.replace('writing-task', '');
        const wordCountElement = document.getElementById(`word-count-${taskNumber}`);
        
        if (!wordCountElement) {
            console.warn(`Word count element not found for ${textareaId}`);
            return;
        }
        
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        
        // Track writing activity
        if (wordCount > 0) {
            this.isWritingActive = true;
            this.updateActivity();
        }
        
        // Calculate score based on word count
        let score = 0;
        let scoreText = '';
        
        if (wordCount >= 80) {
            score = 5;
            scoreText = 'Full points';
            wordCountElement.className = 'word-count good';
        } else if (wordCount >= 50) {
            score = 2.5;
            scoreText = 'Half points';
            wordCountElement.className = 'word-count low';
        } else {
            score = 0;
            scoreText = 'No points';
            wordCountElement.className = 'word-count low';
        }
        
        // Update the word count display with cleaner format
        wordCountElement.textContent = `${wordCount} words`;
        
        // Add data attribute for CSS to show/hide based on content
        wordCountElement.setAttribute('data-words', wordCount.toString());
        
        // Add tooltip or title for score information
        wordCountElement.title = `${wordCount} words - ${scoreText} (${score}/5)`;
        
        console.log(`Updated word count for ${textareaId}: ${wordCount} words - ${scoreText}`);
    }
    
    showSubmitModal() {
        // Remove frontend restriction - always show submit modal
        document.getElementById('submit-modal').classList.add('active');
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            
            // Remove from DOM if it's a temporary modal
            if (modalId === 'time-up-modal' || modalId === 'user-name-modal' || modalId === 'exam-rules-modal') {
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300); // Wait for transition to complete
            }
        }
    }
    
    async submitTest() {
        try {
            this.closeModal('submit-modal');
            this.showLoading('Submitting test...');
            
            const timeSpent = this.formatTimeSpent();
            
            const response = await fetch('/api/submit-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: {
                        ...this.answers,
                        translatedQuestions: Array.from(this.translatedQuestions),
                        translationPenalties: this.translationPenalties || {}
                    },
                    timeSpent,
                    userName: this.userName || 'Anonymous',
                    userInfo: {
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                        submittedBy: 'user'
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.testSubmitted = true;
                this.stopTimer();
                this.results = result.results;
                this.submissionId = result.submissionId;
                this.pdfUrl = result.pdfUrl;
                this.showResults();
            } else {
                throw new Error(result.error || 'Failed to submit test');
            }
            
        } catch (error) {
            console.error('Error submitting test:', error);
            this.showError('Failed to submit test. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    showResults() {
        // Update raw scores
        document.getElementById('listening-score').textContent = `${this.results.listening}/${this.results.listeningTotal}`;
        document.getElementById('reading-score').textContent = `${this.results.reading}/${this.results.readingTotal}`;
        document.getElementById('writing-score').textContent = `${this.results.writing}/${this.results.writingTotal}`;
        document.getElementById('speaking-score').textContent = `${this.results.speaking}/${this.results.speakingTotal}`;
        document.getElementById('total-score').textContent = `${this.results.total}/${this.results.listeningTotal + this.results.readingTotal + this.results.writingTotal + this.results.speakingTotal}`;
        
        // Update band scores
        if (this.results.bands) {
            document.getElementById('listening-band').textContent = `Band ${this.results.bands.listening}`;
            document.getElementById('reading-band').textContent = `Band ${this.results.bands.reading}`;
            document.getElementById('writing-band').textContent = `Band ${this.results.bands.writing}`;
            document.getElementById('speaking-band').textContent = `Band ${this.results.bands.speaking}`;
            document.getElementById('overall-band').textContent = this.results.bands.overall;
        }
        
        // Show translation penalty if any
        if (this.results.translationPenalty > 0) {
            document.getElementById('penalty-item').style.display = 'flex';
            document.getElementById('penalty-score').textContent = `-${this.results.translationPenalty}`;
        }
        
        // Show PDF download button
        const downloadBtn = document.getElementById('download-pdf');
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.href = this.pdfUrl;
        
        document.getElementById('results-modal').classList.add('active');
    }
    
    reviewTest() {
        this.closeModal('results-modal');
        this.reviewMode = true; // Enable review mode
        this.testSubmitted = false; // Allow navigation in review mode
        
        // Switch to first section and highlight answers
        this.switchSection('grammar');
        this.highlightAnswers();
        
        // Force update navigation to enable all buttons
        this.updateNavigation();
        
        // Show review mode indicator
        this.showReviewModeIndicator();
        
        console.log('Review mode activated:', {
            reviewMode: this.reviewMode,
            currentSection: this.currentSection,
            testSubmitted: this.testSubmitted
        });
    }
    
    showReviewModeIndicator() {
        // Create or update review mode indicator
        let indicator = document.getElementById('review-mode-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'review-mode-indicator';
            indicator.className = 'review-mode-indicator';
            indicator.innerHTML = `
                <i class="fas fa-eye"></i>
                <span>Review Mode - You can navigate between sections</span>
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }
    
    highlightAnswers() {
        // Highlight correct and incorrect answers
        this.highlightSectionAnswers('grammar', this.testData.sections.grammar.questions);
        this.highlightSectionAnswers('reading', [
            ...this.testData.sections.reading.passages[0].questions,
            ...this.testData.sections.reading.passages[1].questions
        ]);
        this.highlightSectionAnswers('listening', [
            ...this.testData.sections.listening.scripts[0].questions,
            ...this.testData.sections.listening.scripts[1].questions
        ]);
    }
    
    highlightSectionAnswers(section, questions) {
        questions.forEach(question => {
            const selectedOption = this.answers[section][question.id];
            const correctOption = question.correct;
            
            // Highlight selected option
            if (selectedOption !== undefined) {
                const selectedElement = document.querySelector(`[data-question="${question.id}"][data-option="${selectedOption}"]`);
                if (selectedElement) {
                    selectedElement.classList.add(selectedOption === correctOption ? 'correct' : 'incorrect');
                }
            }
            
            // Highlight correct option if not selected
            if (selectedOption !== correctOption) {
                const correctElement = document.querySelector(`[data-question="${question.id}"][data-option="${correctOption}"]`);
                if (correctElement) {
                    correctElement.classList.add('correct');
                }
            }
        });
    }
    
    downloadPDF() {
        if (this.pdfUrl) {
            window.open(this.pdfUrl, '_blank');
        }
    }
    
    newTest() {
        if (confirm('Are you sure you want to start a new test? All current progress will be lost.')) {
            this.reviewMode = false; // Reset review mode
            location.reload();
        }
    }
    
    handleKeyboard(e) {
        if (this.testSubmitted && !this.reviewMode) return;
        
        // Navigation with arrow keys
        if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.previousSection();
        } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.nextSection();
        }
        
        // Option selection with A, B, C, D keys (only in test mode, not review mode)
        if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase()) && this.currentSection !== 'writing' && !this.reviewMode) {
            e.preventDefault();
            const optionIndex = e.key.toLowerCase().charCodeAt(0) - 97; // a=0, b=1, c=2, d=3
            const activeQuestion = document.querySelector('.question:focus-within') || 
                                 document.querySelector('.question');
            
            if (activeQuestion) {
                const options = activeQuestion.querySelectorAll('.option');
                if (options[optionIndex]) {
                    this.selectOption(options[optionIndex]);
                }
            }
        }
    }
    
    showLoading(message) {
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        const loadingContent = overlay.querySelector('.loading-content');
        loadingContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
        `;
        
        const spinner = overlay.querySelector('.spinner');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        `;
        
        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(overlay);
    }
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    showError(message) {
        console.error('Error:', message);
        
        // Create a better error display
        const errorModal = document.createElement('div');
        errorModal.className = 'modal active';
        errorModal.id = 'error-modal';
        errorModal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorModal);
    }

    checkRulesAcknowledgment() {
        const acknowledged = localStorage.getItem('ielts-rules-acknowledged');
        if (acknowledged === 'true') {
            const rulesBanner = document.getElementById('exam-rules-banner');
            if (rulesBanner) {
                rulesBanner.classList.add('hidden');
            }
        }
    }

    handleVisibilityChange() {
        if (document.hidden && !this.testSubmitted) {
            // Clear any existing timeout
            if (this.pageLeaveTimeout) {
                clearTimeout(this.pageLeaveTimeout);
            }
            
            // Check if we're in listening or writing section (more lenient)
            const isLenientSection = this.currentSection === 'listening' || this.currentSection === 'writing';
            const gracePeriod = isLenientSection ? this.pageLeaveGracePeriod * 2 : this.pageLeaveGracePeriod; // Double grace period for listening/writing
            
            // Set timeout for page leave detection with grace period
            this.pageLeaveTimeout = setTimeout(() => {
                if (document.hidden && !this.testSubmitted) {
                    // Only show warning if still hidden after grace period
                    this.showCheatingWarning();
                }
            }, gracePeriod);
            
            // Update last activity time
            this.lastActivityTime = Date.now();
        } else if (!document.hidden) {
            // Page is visible again - clear the timeout
            if (this.pageLeaveTimeout) {
                clearTimeout(this.pageLeaveTimeout);
                this.pageLeaveTimeout = null;
            }
            
            // Update last activity time
            this.lastActivityTime = Date.now();
        }
    }

    showCheatingWarning() {
        const warningModal = document.createElement('div');
        warningModal.className = 'modal active';
        warningModal.id = 'cheating-warning-modal';
        warningModal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-exclamation-triangle"></i> Page Leave Detected</h3>
                <p><strong>You have been away from the test page for an extended period.</strong></p>
                <p>This may be considered a violation of IELTS exam rules if you were using external resources or getting help.</p>
                <p><strong>Current section:</strong> ${this.currentSection.charAt(0).toUpperCase() + this.currentSection.slice(1)}</p>
                <p><strong>Time away:</strong> ${Math.round(this.pageLeaveGracePeriod / 1000)} seconds</p>
                <div class="warning-options">
                    <p><strong>If you were:</strong></p>
                    <ul>
                        <li>Listening to audio content - This is acceptable</li>
                        <li>Taking notes or using legitimate study aids - This is acceptable</li>
                        <li>Using external resources or getting help - This is a violation</li>
                    </ul>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="continue-test">Continue Test (No Violation)</button>
                    <button class="btn btn-secondary" id="submit-test">Submit Test as Invalid</button>
                    <button class="btn btn-warning" id="restart-test">Restart Test</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warningModal);
        
        // Add event listeners
        document.getElementById('continue-test').addEventListener('click', () => {
            this.closeModal('cheating-warning-modal');
            this.lastActivityTime = Date.now();
        });
        
        document.getElementById('submit-test').addEventListener('click', () => {
            this.submitInvalidTest();
        });
        
        document.getElementById('restart-test').addEventListener('click', () => {
            this.closeModal('cheating-warning-modal');
            this.newTest();
        });
    }

    async submitInvalidTest() {
        try {
            this.closeModal('cheating-warning-modal');
            this.showLoading('Submitting invalid test...');
            
            const timeSpent = this.formatTimeSpent();
            
            const response = await fetch('/api/submit-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: {
                        ...this.answers,
                        translatedQuestions: Array.from(this.translatedQuestions),
                        translationPenalties: this.translationPenalties || {}
                    },
                    timeSpent,
                    userInfo: {
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                        submittedBy: 'cheating_violation',
                        violation: 'page_left'
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.testSubmitted = true;
                this.stopTimer();
                this.results = result.results;
                this.submissionId = result.submissionId;
                this.pdfUrl = result.pdfUrl;
                this.showResults();
            } else {
                throw new Error(result.error || 'Failed to submit test');
            }
            
        } catch (error) {
            console.error('Error submitting invalid test:', error);
            this.showError('Failed to submit test. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Writing Assessment Methods
    debouncedWritingCheck(textareaId, text) {
        const taskId = textareaId.replace('writing-', '');
        
        // Clear existing timeout
        if (this.writingCheckTimeouts[taskId]) {
            clearTimeout(this.writingCheckTimeouts[taskId]);
        }
        
        // Set new timeout for debounced check (increased from 2 seconds to 5 seconds)
        this.writingCheckTimeouts[taskId] = setTimeout(() => {
            if (text.trim().length > 10) { // Only check if there's substantial text
                this.checkWritingTask(taskId, text);
            }
        }, 5000); // Increased from 2000ms to 5000ms for better user experience
    }

    async checkWritingTask(taskId, text = null) {
        try {
            const textareaId = `writing-${taskId}`;
            const textareaElement = document.getElementById(textareaId);
            
            console.log('checkWritingTask called:', { taskId, textareaId, textareaExists: !!textareaElement });
            
            if (!textareaElement) {
                console.error(`Textarea element not found: ${textareaId}`);
                this.showWritingFeedback(taskId, {
                    error: 'Writing area not found. Please refresh the page.'
                });
                return;
            }
            
            const textToCheck = text || textareaElement.value;
            
            if (!textToCheck.trim()) {
                this.showWritingFeedback(taskId, {
                    error: 'Please write some text before checking.'
                });
                return;
            }

            // Get task information from test data
            const task = this.testData?.sections?.writing?.tasks?.find(t => t.id === parseInt(taskId));
            if (!task) {
                console.error('Task not found:', taskId, 'Available tasks:', this.testData?.sections?.writing?.tasks);
                this.showWritingFeedback(taskId, {
                    error: 'Task information not found. Please refresh the page.'
                });
                return;
            }

            console.log('Sending request to /api/writing/check:', {
                text: textToCheck.substring(0, 100) + '...',
                taskType: task.type,
                wordLimit: task.wordLimit
            });

            const response = await fetch('/api/writing/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: textToCheck,
                    taskType: task.type,
                    wordLimit: task.wordLimit
                })
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Response result:', result);
            
            if (result.success) {
                this.showWritingFeedback(taskId, result);
            } else {
                this.showWritingFeedback(taskId, {
                    error: result.error || 'Failed to check writing.'
                });
            }
        } catch (error) {
            console.error('Error checking writing:', error);
            this.showWritingFeedback(taskId, {
                error: 'Failed to check writing. Please try again. Error: ' + error.message
            });
        }
    }

    showWritingFeedback(taskId, result) {
        const feedbackContainer = document.getElementById(`writing-feedback-${taskId}`);
        if (!feedbackContainer) return;

        if (result.error) {
            feedbackContainer.innerHTML = `
                <div class="writing-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${result.error}</span>
                </div>
            `;
            feedbackContainer.style.display = 'block';
            return;
        }

        const { results, feedback } = result;
        
        let feedbackHTML = `
            <div class="writing-feedback-header">
                <h4>Writing Assessment - ${results.overall.grade} (${results.overall.score}/100)</h4>
                <div class="writing-scores">
                    <span class="score-item">
                        <i class="fas fa-language"></i>
                        Grammar: ${results.grammar.score}/100
                    </span>
                    <span class="score-item">
                        <i class="fas fa-edit"></i>
                        Mechanics: ${results.mechanics.score}/100
                    </span>
                    <span class="score-item">
                        <i class="fas fa-book"></i>
                        Content: ${results.content.score}/100
                    </span>
                </div>
            </div>
        `;

        // Word count feedback
        if (results.wordCount.feedback) {
            feedbackHTML += `
                <div class="word-count-feedback ${results.wordCount.feedback.includes('Good') ? 'positive' : 'warning'}">
                    <i class="fas fa-${results.wordCount.feedback.includes('Good') ? 'check' : 'exclamation-triangle'}"></i>
                    <span>${results.wordCount.feedback}</span>
                </div>
            `;
        }

        // Strengths
        if (feedback.strengths.length > 0) {
            feedbackHTML += `
                <div class="feedback-section strengths">
                    <h5><i class="fas fa-thumbs-up"></i> Strengths</h5>
                    <ul>
                        ${feedback.strengths.map(strength => `<li>${strength}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Areas for improvement
        if (feedback.areas.length > 0) {
            feedbackHTML += `
                <div class="feedback-section areas">
                    <h5><i class="fas fa-tools"></i> Areas for Improvement</h5>
                    <ul>
                        ${feedback.areas.map(area => `<li>${area}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Specific suggestions
        if (feedback.suggestions.length > 0) {
            feedbackHTML += `
                <div class="feedback-section suggestions">
                    <h5><i class="fas fa-lightbulb"></i> Specific Suggestions</h5>
                    <ul>
                        ${feedback.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        feedbackContainer.innerHTML = feedbackHTML;
        feedbackContainer.style.display = 'block';
    }

    async checkAllWritingTasks() {
        try {
            const response = await fetch('/api/writing/check-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    writingAnswers: this.answers.writing,
                    testDate: this.testData.testDate
                })
            });

            const result = await response.json();
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.error || 'Failed to check writing tasks');
            }
        } catch (error) {
            console.error('Error checking all writing tasks:', error);
            throw error;
        }
    }

    // Get random voice for listening scripts
    getRandomVoice() {
        if (!this.availableVoices || this.availableVoices.length === 0) {
            return null;
        }
        
        // Filter for English voices only
        const englishVoices = this.availableVoices.filter(voice => 
            voice.lang.startsWith('en')
        );
        
        if (englishVoices.length === 0) {
            return this.availableVoices[0]; // Fallback to any voice
        }
        
        // Return random English voice
        const randomIndex = Math.floor(Math.random() * englishVoices.length);
        return englishVoices[randomIndex];
    }
    
    // Get random speed between 0.8 and 1.2 with more variation
    getRandomSpeed() {
        // More variation: 0.7 to 1.3 for more realistic IELTS experience
        return 0.7 + Math.random() * 0.6; // Random between 0.7 and 1.3
    }
    
    // Get random pitch between 0.8 and 1.2 with more variation
    getRandomPitch() {
        // More variation: 0.7 to 1.3 for more natural voice variation
        return 0.7 + Math.random() * 0.6; // Random between 0.7 and 1.3
    }

    // Force close modal and start test (fallback method)
    forceStartTest() {
        console.log('Force starting test...');
        
        // Force hide all modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Store acknowledgment
        localStorage.setItem('ielts-rules-acknowledged', 'true');
        localStorage.setItem('ielts-user-name', this.userName || 'Anonymous');
        
        // Start test initialization
        this.initializeTest();
    }
    
    // Add global function for debugging
    setupGlobalDebugFunctions() {
        window.forceStartTest = () => this.forceStartTest();
        window.debugModals = () => {
            const modals = document.querySelectorAll('.modal');
            console.log('Active modals:', Array.from(modals).map(m => ({ id: m.id, active: m.classList.contains('active') })));
        };
        window.debugWordCount = () => this.debugWordCount();
        window.debugReviewMode = () => this.debugReviewMode();
    }

    // Debug method to test word count functionality
    debugWordCount() {
        console.log('=== Word Count Debug ===');
        ['writing-task1', 'writing-task2'].forEach(id => {
            const textarea = document.getElementById(id);
            const taskNumber = id.replace('writing-task', '');
            const wordCountElement = document.getElementById(`word-count-${taskNumber}`);
            
            console.log(`${id}:`, {
                textareaExists: !!textarea,
                textareaValue: textarea ? textarea.value : 'N/A',
                wordCountElementExists: !!wordCountElement,
                wordCountElementText: wordCountElement ? wordCountElement.textContent : 'N/A'
            });
        });
    }

    // Debug method to test review mode functionality
    debugReviewMode() {
        console.log('=== Review Mode Debug ===');
        console.log({
            reviewMode: this.reviewMode,
            testSubmitted: this.testSubmitted,
            currentSection: this.currentSection,
            sections: this.sections
        });
        
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        console.log('Navigation buttons:', {
            prevBtnExists: !!prevBtn,
            prevBtnDisabled: prevBtn ? prevBtn.disabled : 'N/A',
            prevBtnDisplay: prevBtn ? prevBtn.style.display : 'N/A',
            nextBtnExists: !!nextBtn,
            nextBtnDisabled: nextBtn ? nextBtn.disabled : 'N/A',
            nextBtnDisplay: nextBtn ? nextBtn.style.display : 'N/A'
        });
        
        // Check all nav buttons
        document.querySelectorAll('.nav-btn').forEach((btn, index) => {
            console.log(`Nav button ${index}:`, {
                section: btn.dataset.section,
                disabled: btn.disabled,
                display: btn.style.display,
                active: btn.classList.contains('active')
            });
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing IELTS Test application...');
    new IELTSTest();
});

// Fallback initialization if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded, initialize immediately
    console.log('DOM already loaded, initializing IELTS Test application immediately...');
    new IELTSTest();
}

// Global cache refresh function (can be called from browser console)
window.refreshCache = function() {
    console.log('Manual cache refresh triggered');
    
    // Clear all caches
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            return Promise.all(cacheNames.map(function(name) {
                return caches.delete(name);
            }));
        }).then(function() {
            console.log('All caches cleared');
            // Force page reload
            window.location.reload(true);
        }).catch(function(error) {
            console.log('Error clearing caches:', error);
            // Force page reload anyway
            window.location.reload(true);
        });
    } else {
        // Fallback: just reload the page
        window.location.reload(true);
    }
};

// Global force reload function
window.forceReload = function() {
    console.log('Force reload triggered');
    window.location.reload(true);
};

// Add cache refresh to window object for easy access
window.clearIELTSCache = function() {
    console.log('IELTS cache cleared');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload(true);
};
