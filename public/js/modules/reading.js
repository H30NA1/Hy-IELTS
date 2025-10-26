// IELTS Reading Module
class IELTSReading {
    constructor() {
        this.passages = [];
        this.questions = [];
        this.testData = null;
    }

    async initialize() {
        await this.loadTestData();
        this.renderPassages();
        this.renderQuestions();
        this.setupEventListeners();
    }

    async loadTestData() {
        try {
            const response = await fetch('/api/test-data');
            const data = await response.json();
            this.testData = data;
            console.log('Reading module loaded test data:', data);
        } catch (error) {
            console.error('Error loading test data for reading:', error);
        }
    }

    renderPassages() {
        if (!this.testData || !this.testData.sections) {
            console.error('No test data available for reading passages');
            return;
        }

        const readingSection = this.testData.sections.find(section => section.id === 'reading');
        if (!readingSection || !readingSection.passages) {
            console.error('No reading section or passages found in test data');
            return;
        }

        // Render each passage with its content and questions
        readingSection.passages.forEach((passage, index) => {
            const passageNumber = index + 1;
            const containerId = `reading-passage${passageNumber}-questions`;
            const contentId = `reading-passage${passageNumber}-content`;
            
            // Load passage content
            this.loadPassageContent(passage, contentId);
            
            // Render questions
            this.renderPassageFromData(passage, containerId, passageNumber);
        });
    }

    loadPassageContent(passageData, contentId) {
        const contentElement = document.getElementById(contentId);
        if (!contentElement) {
            console.error(`Content element not found: ${contentId}`);
            return;
        }

        if (passageData.content) {
            contentElement.innerHTML = `<p>${passageData.content}</p>`;
            console.log(`Loaded passage content for ${contentId}:`, passageData.content.substring(0, 100) + '...');
        } else {
            console.error(`No content found for passage:`, passageData);
        }
    }

    renderPassageFromData(passageData, containerId, passageNumber) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        if (passageData.questions && Array.isArray(passageData.questions)) {
            passageData.questions.forEach((questionData, index) => {
                const questionDiv = this.createQuestionElementFromData(questionData, passageNumber, index + 1);
                container.appendChild(questionDiv);
            });
        }
    }

    renderQuestions() {
        // Questions are rendered in renderPassages method
    }

    createQuestionElementFromData(questionData, passageNumber, questionNumber) {
        const questionDiv = IELTSUtils.createElement('div', 'question');
        
        const questionText = questionData.questionText || `Question ${questionNumber}`;
        const options = questionData.options || ["Option A", "Option B", "Option C", "Option D"];
        const translation = questionData.translation || "";
        
        // Create options HTML with PROPER RADIO BUTTONS
        let optionsHTML = '';
        options.forEach((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
            optionsHTML += `
                <label class="option">
                    <input type="radio" 
                           name="reading-${questionData.id}" 
                           value="${optionLetter}"
                           id="${questionData.id}-${optionLetter}">
                    <div class="option-label">${optionLetter}</div>
                    <div class="option-text">${option}</div>
                </label>
            `;
        });
        
        questionDiv.innerHTML = `
            <div class="question-header">
                <div class="question-header-top">
                    <span class="question-number">Question ${questionNumber}</span>
                    <button class="translate-btn" data-question="${questionData.id}" title="Translate to Vietnamese (0.5 grade penalty)">
                        <i class="fas fa-language"></i>
                        <span>Translate</span>
                    </button>
                </div>
                <div class="question-text" id="question-text-${questionData.id}">${questionText}</div>
                <div class="question-translation" id="question-translation-${questionData.id}" style="display: none;">
                    <p class="translation-label">Vietnamese Translation:</p>
                    <p class="translation-text" id="translation-text-${questionData.id}">${translation}</p>
                </div>
            </div>
            <div class="options">
                ${optionsHTML}
            </div>
        `;

        return questionDiv;
    }

    setupEventListeners() {
        // Option selection (only for reading section)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option')) {
                const option = e.target.closest('.option');
                // Only process if this option is in the reading section
                const readingSection = option.closest('#reading');
                if (!readingSection) return;
                
                const questionId = option.dataset.question;
                const optionIndex = option.dataset.option;
                
                this.selectOption(questionId, optionIndex);
            }
        });

        // Translation buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.translate-btn')) {
                const btn = e.target.closest('.translate-btn');
                const questionId = btn.dataset.question;
                this.translateQuestion(questionId);
            }
        });

        // Radio button changes for reading questions
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio' && e.target.name.startsWith('reading-')) {
                const questionId = e.target.name.replace('reading-', '');
                const selectedValue = e.target.value;
                this.saveReadingAnswer(questionId, selectedValue);
            }
        });
    }

    saveReadingAnswer(questionId, selectedValue) {
        // Store answer in the core module
        if (window.ieltsTest) {
            if (!window.ieltsTest.answers.reading) {
                window.ieltsTest.answers.reading = {};
            }
            window.ieltsTest.answers.reading[questionId] = selectedValue;
            window.ieltsTest.updateActivity();
            console.log(`📖 Saved reading answer: ${questionId} = ${selectedValue}`);
        }
    }

    selectOption(questionId, optionIndex) {
        // Remove previous selection for this question
        const questionContainer = document.querySelector(`[data-question="${questionId}"]`).closest('.question');
        const allOptions = questionContainer.querySelectorAll('.option');
        allOptions.forEach(option => option.classList.remove('selected'));

        // Select new option
        const selectedOption = document.querySelector(`[data-question="${questionId}"][data-option="${optionIndex}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Store answer
        if (window.ieltsTest) {
            if (!window.ieltsTest.answers.reading) {
                window.ieltsTest.answers.reading = {};
            }
            window.ieltsTest.answers.reading[questionId] = optionIndex;
            window.ieltsTest.updateActivity();
        }
    }

    translateQuestion(questionId) {
        const translationDiv = document.getElementById(`question-translation-${questionId}`);
        
        if (!translationDiv) {
            console.warn(`Translation div not found for question: ${questionId}`);
            return;
        }

        // Toggle translation visibility (translation text is already in HTML)
        if (translationDiv.style.display === 'none' || !translationDiv.style.display) {
            translationDiv.style.display = 'block';

            // Add translation penalty
            if (window.ieltsTest) {
                window.ieltsTest.addTranslationPenalty();
            }
        } else {
            translationDiv.style.display = 'none';
        }
    }

    getAnswers() {
        const answers = {};
        const selectedOptions = document.querySelectorAll('.option.selected');
        
        selectedOptions.forEach(option => {
            const questionId = option.dataset.question;
            const optionIndex = option.dataset.option;
            answers[questionId] = optionIndex;
        });

        return answers;
    }

    reset() {
        const allOptions = document.querySelectorAll('.option');
        allOptions.forEach(option => option.classList.remove('selected'));
        
        const allTranslations = document.querySelectorAll('.question-translation');
        allTranslations.forEach(translation => translation.style.display = 'none');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IELTSReading;
}
