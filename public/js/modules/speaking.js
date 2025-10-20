// IELTS Speaking Module
class IELTSSpeaking {
    constructor() {
        this.parts = [];
        this.wordCounts = {};
    }

    initialize() {
        this.setupEventListeners();
        this.initializeWordCountTracking();
    }

    setupEventListeners() {
        // Speaking word count tracking
        ['speaking-part1', 'speaking-part2', 'speaking-part3'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                // Initialize word count for existing content
                this.updateWordCount(id, textarea.value);
                
                textarea.addEventListener('input', (e) => {
                    console.log(`Speaking textarea input detected: ${id}, value length: ${e.target.value.length}`);
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
                console.warn(`Speaking textarea with id ${id} not found`);
            }
        });
    }

    initializeWordCountTracking() {
        ['speaking-part1', 'speaking-part2', 'speaking-part3'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                this.updateWordCount(id, textarea.value);
            }
        });
    }

    updateWordCount(textareaId, text) {
        const wordCount = IELTSUtils.countWords(text);
        const partNumber = textareaId.replace('speaking-part', '');
        const wordCountElement = document.getElementById(`speaking-count-${partNumber}`);
        
        if (wordCountElement) {
            wordCountElement.textContent = `${wordCount} words`;
            
            // Update word count styling based on speaking requirements
            if (partNumber === '1') {
                // Part 1: Short answers (15-50 words typical)
                if (wordCount >= 30) {
                    wordCountElement.className = 'word-count good';
                } else if (wordCount >= 15) {
                    wordCountElement.className = 'word-count warning';
                } else {
                    wordCountElement.className = 'word-count poor';
                }
            } else if (partNumber === '2') {
                // Part 2: Long turn (100-200 words typical for 1-2 minutes)
                if (wordCount >= 150) {
                    wordCountElement.className = 'word-count good';
                } else if (wordCount >= 100) {
                    wordCountElement.className = 'word-count warning';
                } else {
                    wordCountElement.className = 'word-count poor';
                }
            } else if (partNumber === '3') {
                // Part 3: Discussion (50-150 words typical)
                if (wordCount >= 100) {
                    wordCountElement.className = 'word-count good';
                } else if (wordCount >= 50) {
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
            const partKey = textareaId.replace('speaking-', '');
            if (!window.ieltsTest.answers.speaking) {
                window.ieltsTest.answers.speaking = {};
            }
            window.ieltsTest.answers.speaking[partKey] = text;
        }
    }

    updateActivity() {
        if (window.ieltsTest && window.ieltsTest.updateActivity) {
            window.ieltsTest.updateActivity();
        }
    }

    getAnswers() {
        const answers = {};
        ['speaking-part1', 'speaking-part2', 'speaking-part3'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                const partKey = id.replace('speaking-', '');
                answers[partKey] = textarea.value;
            }
        });
        return answers;
    }

    reset() {
        ['speaking-part1', 'speaking-part2', 'speaking-part3'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.value = '';
                this.updateWordCount(id, '');
            }
        });
    }

    // Speaking-specific methods
    startRecording(partNumber) {
        // This would integrate with Web Speech API or other recording functionality
        console.log(`Starting recording for Part ${partNumber}`);
        // Implementation would go here
    }

    stopRecording(partNumber) {
        // This would stop recording and process the audio
        console.log(`Stopping recording for Part ${partNumber}`);
        // Implementation would go here
    }

    playSampleAudio(partNumber) {
        // This would play sample audio for the speaking part
        console.log(`Playing sample audio for Part ${partNumber}`);
        // Implementation would go here
    }

    getSpeakingTips(partNumber) {
        const tips = {
            1: [
                "Keep your answers short and to the point",
                "Use personal examples when possible",
                "Don't memorize answers - be natural",
                "Practice common topics like work, studies, hobbies"
            ],
            2: [
                "Use the 1-minute preparation time wisely",
                "Structure your talk: introduction, main points, conclusion",
                "Speak for the full 1-2 minutes",
                "Use linking words to connect ideas",
                "Include personal examples and details"
            ],
            3: [
                "Give detailed answers with examples",
                "Express and justify your opinions",
                "Compare and contrast different ideas",
                "Use a range of vocabulary and grammar",
                "Think about the question before answering"
            ]
        };

        return tips[partNumber] || [];
    }

    showSpeakingTips(partNumber) {
        const tips = this.getSpeakingTips(partNumber);
        const tipsHtml = tips.map(tip => `<li>${tip}</li>`).join('');
        
        IELTSUtils.showNotification(`
            <strong>Speaking Tips for Part ${partNumber}:</strong>
            <ul>${tipsHtml}</ul>
        `, 'info');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IELTSSpeaking;
}
