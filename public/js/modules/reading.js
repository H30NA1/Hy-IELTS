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

        // Render each passage with its questions
        readingSection.passages.forEach((passage, index) => {
            const passageNumber = index + 1;
            const containerId = `reading-passage${passageNumber}-questions`;
            this.renderPassageFromData(passage, containerId, passageNumber);
        });
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
        
        // Create options HTML
        let optionsHTML = '';
        options.forEach((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
            optionsHTML += `
                <div class="option" data-question="${questionData.id}" data-option="${index}">
                    <div class="option-label">${optionLetter}</div>
                    <div class="option-text" id="option-text-${questionData.id}-${index}">${option}</div>
                    <div class="option-translation" id="option-translation-${questionData.id}-${index}" style="display: none;">
                        <p class="translation-label">Vietnamese Translation:</p>
                        <p class="translation-text" id="option-translation-text-${questionData.id}-${index}">Translating...</p>
                    </div>
                </div>
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
        // Option selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option')) {
                const option = e.target.closest('.option');
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
                const questionId = e.target.name;
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
        const translationText = document.getElementById(`translation-text-${questionId}`);
        
        if (!translationDiv || !translationText) return;

        if (translationDiv.style.display === 'none') {
            translationDiv.style.display = 'block';
            translationText.textContent = 'Translating...';
            
            // Simulate translation (in real implementation, this would call translation API)
            setTimeout(() => {
                translationText.textContent = `Vietnamese translation for question ${questionId}`;
            }, 1000);

            // Add translation penalty
            if (window.ieltsTest) {
                window.ieltsTest.translatedQuestions.add(parseInt(questionId));
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
