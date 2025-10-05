// IELTS Writing Module
class IELTSWriting {
    constructor() {
        this.tasks = [];
        this.wordCounts = {};
    }

    initialize() {
        this.setupEventListeners();
        this.initializeWordCountTracking();
    }

    setupEventListeners() {
        // Writing word count tracking
        ['writing-task1', 'writing-task2'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                // Initialize word count for existing content
                this.updateWordCount(id, textarea.value);
                
                textarea.addEventListener('input', (e) => {
                    console.log(`Writing textarea input detected: ${id}, value length: ${e.target.value.length}`);
                    this.updateWordCount(e.target.id, e.target.value);
                    this.saveAnswer(e.target.id, e.target.value);
                    this.updateActivity();
                });
                
                // Also listen for paste events
                textarea.addEventListener('paste', (e) => {
                    setTimeout(() => {
                        this.updateWordCount(id, textarea.value);
                        this.saveAnswer(id, textarea.value);
                        this.updateActivity();
                    }, 10);
                });
            } else {
                console.warn(`Writing textarea with id ${id} not found`);
            }
        });

        // Writing assessment buttons
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

        // Writing translation buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.writing-translate-btn')) {
                const btn = e.target.closest('.writing-translate-btn');
                const taskId = btn.dataset.task;
                if (taskId) {
                    this.translateWritingTask(taskId);
                }
            }
        });
    }

    initializeWordCountTracking() {
        ['writing-task1', 'writing-task2'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                this.updateWordCount(id, textarea.value);
            }
        });
    }

    updateWordCount(textareaId, text) {
        const wordCount = IELTSUtils.countWords(text);
        const taskNumber = textareaId.replace('writing-task', '');
        const wordCountElement = document.getElementById(`word-count-${taskNumber}`);
        
        if (wordCountElement) {
            wordCountElement.textContent = `${wordCount} words`;
            
            // Update word count styling based on requirements
            if (taskNumber === '1') {
                // Task 1: 150 words minimum
                if (wordCount >= 150) {
                    wordCountElement.className = 'word-count good';
                } else if (wordCount >= 100) {
                    wordCountElement.className = 'word-count warning';
                } else {
                    wordCountElement.className = 'word-count poor';
                }
            } else if (taskNumber === '2') {
                // Task 2: 250 words minimum
                if (wordCount >= 250) {
                    wordCountElement.className = 'word-count good';
                } else if (wordCount >= 200) {
                    wordCountElement.className = 'word-count warning';
                } else {
                    wordCountElement.className = 'word-count poor';
                }
            }
        }
        
        this.wordCounts[textareaId] = wordCount;
    }

    saveAnswer(textareaId, text) {
        if (window.ieltsTest) {
            const taskKey = textareaId.replace('writing-', '');
            if (!window.ieltsTest.answers.writing) {
                window.ieltsTest.answers.writing = {};
            }
            window.ieltsTest.answers.writing[taskKey] = text;
        }
    }

    checkWritingTask(taskId) {
        const textarea = document.getElementById(`writing-task${taskId}`);
        if (!textarea) return;

        const text = textarea.value.trim();
        const wordCount = IELTSUtils.countWords(text);
        const feedbackElement = document.getElementById(`writing-feedback-${taskId}`);
        
        if (!feedbackElement) return;

        let feedback = '';
        let feedbackClass = '';

        if (taskId === '1') {
            // Task 1 feedback
            if (wordCount >= 150) {
                feedback = '✅ Good! You have met the minimum word requirement for Task 1.';
                feedbackClass = 'success';
            } else if (wordCount >= 100) {
                feedback = '⚠️ You are close to the minimum word requirement (150 words). Consider adding more details.';
                feedbackClass = 'warning';
            } else {
                feedback = '❌ You need to write at least 150 words for Task 1. Please expand your response.';
                feedbackClass = 'error';
            }
        } else if (taskId === '2') {
            // Task 2 feedback
            if (wordCount >= 250) {
                feedback = '✅ Excellent! You have met the minimum word requirement for Task 2.';
                feedbackClass = 'success';
            } else if (wordCount >= 200) {
                feedback = '⚠️ You are close to the minimum word requirement (250 words). Consider adding more examples or details.';
                feedbackClass = 'warning';
            } else {
                feedback = '❌ You need to write at least 250 words for Task 2. Please expand your response with more examples and details.';
                feedbackClass = 'error';
            }
        }

        feedbackElement.innerHTML = `<div class="feedback ${feedbackClass}">${feedback}</div>`;
        feedbackElement.style.display = 'block';
    }

    translateWritingTask(taskId) {
        const instructionElement = document.getElementById(`task${taskId}-instruction`);
        const translationElement = document.getElementById(`task${taskId}-translation`);
        const translationText = document.getElementById(`task${taskId}-translation-text`);
        
        if (!instructionElement || !translationElement || !translationText) return;

        if (translationElement.style.display === 'none') {
            translationElement.style.display = 'block';
            translationText.textContent = 'Translating...';
            
            // Simulate translation
            setTimeout(() => {
                translationText.textContent = `Vietnamese translation for Task ${taskId} instruction`;
            }, 1000);
        } else {
            translationElement.style.display = 'none';
        }
    }

    updateActivity() {
        if (window.ieltsTest && window.ieltsTest.updateActivity) {
            window.ieltsTest.updateActivity();
        }
    }

    getAnswers() {
        const answers = {};
        ['writing-task1', 'writing-task2'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                const taskKey = id.replace('writing-', '');
                answers[taskKey] = textarea.value;
            }
        });
        return answers;
    }

    reset() {
        ['writing-task1', 'writing-task2'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.value = '';
                this.updateWordCount(id, '');
            }
        });

        // Hide all feedback
        ['writing-feedback-1', 'writing-feedback-2'].forEach(id => {
            const feedback = document.getElementById(id);
            if (feedback) {
                feedback.style.display = 'none';
            }
        });

        // Hide all translations
        ['task1-translation', 'task2-translation'].forEach(id => {
            const translation = document.getElementById(id);
            if (translation) {
                translation.style.display = 'none';
            }
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IELTSWriting;
}
