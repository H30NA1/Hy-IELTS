import state from '../utils/state.js';
import { SpeechRecognizer } from '../utils/speech-recognizer.js';

export const speaking = {
    recognizer: new SpeechRecognizer(),
    currentPart: 1,
    isRecording: false,

    mockQuestions: {
        1: {
            title: "Part 1: Introduction",
            questions: [
                "What is your full name?",
                "Do you work or are you a student?",
                "What do you like to do in your free time?"
            ]
        },
        2: {
            title: "Part 2: Cue Card",
            topic: "Describe a memorable journey you have taken.",
            bullets: [
                "Where you went",
                "How you traveled",
                "Who you went with",
                "And explain why this journey was memorable to you"
            ]
        },
        3: {
            title: "Part 3: Discussion",
            questions: [
                "Do you think people travel enough these days?",
                "How has travel changed compared to the past?",
                "What are the benefits of traveling to foreign countries?"
            ]
        }
    },

    render() {
        const container = document.getElementById('speaking');
        if (!container) return;

        if (!this.currentPart) this.currentPart = 1;

        container.innerHTML = `
            <div id="speaking-container" class="speaking-layout">
                ${this.renderSidebar()}
                ${this.renderMainContent()}
            </div>
        `;

        this.attachListeners();
        this.updateZoneHeader();
    },

    renderSidebar() {
        return `
            <div class="speaking-sidebar">
                <div class="part-nav">
                    ${[1, 2, 3].map(p => `
                        <button class="part-btn ${p === this.currentPart ? 'active' : ''}" data-part="${p}">
                            Part ${p}
                        </button>
                    `).join('')}
                </div>
                <div class="speaking-tips">
                    <h4><i class="fas fa-lightbulb"></i> Tips</h4>
                    <p>Speak clearly and naturally.</p>
                    <p>Don't worry about minor mistakes.</p>
                    <p>Keep going even if you hesitate.</p>
                </div>
            </div>
        `;
    },

    renderMainContent() {
        const data = this.mockQuestions[this.currentPart];
        let content = '';

        if (this.currentPart === 2) {
            content = `
                <div class="cue-card">
                    <h3>${data.topic}</h3>
                    <p>You should say:</p>
                    <ul>
                        ${data.bullets.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            content = `
                <div class="questions-list">
                    ${data.questions.map((q, i) => `
                        <div class="speaking-q">
                            <span class="q-num">${i + 1}</span>
                            <span class="q-text">${q}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const savedTranscript = state.answers.speaking?.[`part${this.currentPart}`] || '';

        return `
            <div class="speaking-main">
                <div class="speaking-header">
                    <h2>${data.title}</h2>
                </div>
                
                <div class="speaking-content">
                    ${content}
                </div>

                <div class="recording-area">
                    <div class="transcript-box">
                        <label>Your Answer (Transcript)</label>
                        <textarea id="speaking-transcript" placeholder="Press record and start speaking..." readonly>${savedTranscript}</textarea>
                    </div>

                    <div class="controls">
                        <button id="record-btn" class="record-btn ${this.isRecording ? 'recording' : ''}">
                            <div class="pulse-ring"></div>
                            <i class="fas ${this.isRecording ? 'fa-stop' : 'fa-microphone'}"></i>
                            <span>${this.isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                        </button>
                        <div class="status-text" id="recording-status">
                            ${this.isRecording ? 'Listening...' : 'Ready to record'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    attachListeners() {
        const container = document.getElementById('speaking-container');
        if (!container) return;

        container.querySelectorAll('.part-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = parseInt(btn.dataset.part);
                if (p !== this.currentPart) {
                    this.stopRecording();
                    this.currentPart = p;
                    this.render();
                }
            });
        });

        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                this.toggleRecording();
            });
        }
    },

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    },

    startRecording() {
        if (!this.recognizer.isSupported()) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        const textarea = document.getElementById('speaking-transcript');
        if (textarea) textarea.value = '';
        this.saveTranscript('');

        this.isRecording = true;
        this.updateUIState();

        this.recognizer.start(
            (result) => {
                if (textarea) {
                    textarea.value = result.full;
                    textarea.scrollTop = textarea.scrollHeight;
                    this.saveTranscript(result.full);
                }
            },
            (error) => {
                console.error('Speech error:', error);
                this.stopRecording();
                document.getElementById('recording-status').textContent = 'Error: ' + error;
            },
            () => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }
        );
    },

    stopRecording() {
        this.isRecording = false;
        this.recognizer.stop();
        this.updateUIState();
    },

    updateUIState() {
        const btn = document.getElementById('record-btn');
        const status = document.getElementById('recording-status');

        if (btn) {
            if (this.isRecording) {
                btn.classList.add('recording');
                btn.querySelector('i').className = 'fas fa-stop';
                btn.querySelector('span').textContent = 'Stop Recording';
                status.textContent = 'Listening...';
                status.classList.add('active');
            } else {
                btn.classList.remove('recording');
                btn.querySelector('i').className = 'fas fa-microphone';
                btn.querySelector('span').textContent = 'Start Recording';
                status.textContent = 'Ready to record';
                status.classList.remove('active');
            }
        }
    },

    saveTranscript(text) {
        state.setAnswer('speaking', `part${this.currentPart}`, text);
    },

    updateZoneHeader() {
        document.getElementById('question-indicator').textContent = `Speaking Section`;
        document.getElementById('section-progress-fill').style.width = '0%';
    }
};
