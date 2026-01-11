import state from '../utils/state.js';
import { voiceRotationManager } from '../utils/voice-rotation-manager.js';

export const listening = {
    currentVoice: null,
    isSpeaking: false,
    async render() {
        if (state.testData && state.testData.sections) {
            const section = state.testData.sections.find(s => s.id === 'listening');
            if (section && section.parts) {
                // Flatten parts into a questions array with 'part' property
                this.questions = [];
                section.parts.forEach(p => {
                    const pQuestions = p.questions || [];
                    pQuestions.forEach(q => {
                        this.questions.push({ ...q, part: p.partNumber || p.id, transcript: p.script ? JSON.stringify(p.script) : '' });
                    });
                });
            }
        }

        if (!this.questions || this.questions.length === 0) {
            console.warn('Listening: No test data found, generating mocks.');
            this.questions = this.generateMockQuestions();
        }

        if (!voiceRotationManager.isInitialized) {
            await voiceRotationManager.initialize();
        }

        const sectionContainer = document.getElementById('listening');
        if (!sectionContainer) return;

        if (!this.currentPart) this.currentPart = 1;

        sectionContainer.innerHTML = '<div id="listening-container"></div>';

        this.renderLayout();
    },

    generateMockQuestions() {
        // ... (Same Mock Data Logic as before likely fine, just shortening for brevity in this tool call if needed, but I'll include full for safety)
        const questions = [];
        for (let part = 1; part <= 4; part++) {
            let transcript = `(Transcript for Part ${part})`;
            if (part === 1) transcript = `<strong>Customer:</strong> Hi, I'd like to return these books.<br><strong>Librarian:</strong> Sure. Let me check...`;
            if (part === 2) transcript = `<strong>Guide:</strong> Welcome to the park. On your left you'll see...`;
            if (part === 3) transcript = `<strong>Student 1:</strong> What did you think of the lecture?<br><strong>Student 2:</strong> It was interesting, but...`;
            if (part === 4) transcript = `<strong>Lecturer:</strong> Today we are discussing the history of urban planning...`;

            for (let q = 1; q <= 10; q++) {
                const id = (part - 1) * 10 + q;
                questions.push({
                    id: `listening-q${id}`,
                    part: part,
                    number: id,
                    instruction: `Questions ${id}-${id}: Listen and answer.`,
                    question: `Question ${id}: Mock question text for Part ${part}.`,
                    transcript: transcript,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    correctAnswer: "A"
                });
            }
        }
        return questions;
    },

    renderLayout() {
        const container = document.getElementById('listening-container');

        // 1. Render Tabs (Use data-part instead of inline click)
        const tabsHtml = `
            <div class="category-tabs" id="listening-tabs">
                ${[1, 2, 3, 4].map(p => `
                    <button class="tab-btn ${p === this.currentPart ? 'active' : ''}" data-part="${p}">
                        Part ${p}
                    </button>
                `).join('')}
            </div>
        `;

        // 2. Render Active Part Content
        const partQs = this.questions.filter(q => q.part === this.currentPart);
        const transcript = partQs[0].transcript;

        const questionsListHtml = partQs.map(q => this.renderQuestionItem(q)).join('');

        const contentHtml = `
            <div class="inner-split-layout">
                <!-- Left: Content Side -->
                <div class="content-side">
                    <h3 style="margin-top:0; color:#2563eb;">Part ${this.currentPart} Audio</h3>
                     <div class="instruction-box" style="margin-bottom:1rem;">
                        <i class="fas fa-info-circle"></i> Questions ${partQs[0].number}-${partQs[partQs.length - 1].number}
                    </div>

                    <div class="audio-player-custom" style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:1.5rem;">
                         <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                            <button id="play-audio-btn" class="btn btn-primary btn-sm" style="min-width:100px;">
                                <i class="fas fa-play"></i> Play
                            </button>
                            <button id="stop-audio-btn" class="btn btn-sm" style="display:none; background:#ef4444; color:white; min-width:100px;">
                                <i class="fas fa-stop"></i> Stop
                            </button>
                            <div style="flex:1; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                                <div id="audio-progress" style="width:0%; height:100%; background:linear-gradient(90deg, #3b82f6, #8b5cf6); transition:width 0.3s;"></div>
                            </div>
                        </div>
                        <div id="voice-info" style="font-size:0.85em; color:#64748b; min-height:20px; display:flex; align-items:center; gap:8px;">
                            <span>🎤 Ready to play</span>
                        </div>
                    </div>

                    <button id="transcript-toggle-btn" class="transcript-toggle">
                        <i class="fas fa-file-alt"></i> Show/Hide Transcript
                    </button>
                    <div id="transcript-text" class="transcript-box" style="display:block;">
                        <h4>Transcript</h4>
                        <p>${transcript}</p>
                    </div>
                </div>

                <!-- Right: Questions Side -->
                <div class="questions-side">
                    ${questionsListHtml}
                </div>
            </div>
        `;

        container.innerHTML = tabsHtml + contentHtml;
        this.attachListeners(container);
        this.updateZoneHeader();
    },

    attachListeners(container) {
        // Tab Switching
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = parseInt(btn.dataset.part);
                if (p !== this.currentPart) {
                    this.currentPart = p;
                    this.renderLayout();
                }
            });
        });

        // Question Options
        container.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => {
                const qid = card.dataset.qid;
                const val = card.dataset.val;

                const parent = card.closest('.options-grid');
                parent.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                state.setAnswer('listening', qid, val);
                // No palette to update anymore
            });
        });

        // Audio Player & Transcript (Simple Toggles)
        const playBtn = container.querySelector('#play-audio-btn');
        const stopBtn = container.querySelector('#stop-audio-btn');
        const voiceInfo = container.querySelector('#voice-info');
        const audioProgress = container.querySelector('#audio-progress');

        if (playBtn) {
            playBtn.addEventListener('click', async () => {
                if (this.isSpeaking) {
                    voiceRotationManager.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
                    this.isSpeaking = false;
                    return;
                }

                const partQs = this.questions.filter(q => q.part === this.currentPart);
                const transcript = partQs[0].transcript;
                const cleanText = transcript.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

                this.currentVoice = voiceRotationManager.getNextVoice();

                if (!this.currentVoice) {
                    voiceInfo.innerHTML = '<span style="color:#ef4444;">❌ No voices available</span>';
                    return;
                }

                const voiceData = voiceRotationManager.getVoiceInfo(this.currentVoice);
                const randomParams = voiceRotationManager.generateRandomVoiceParameters();

                voiceInfo.innerHTML = `
                    <span style="color:#3b82f6; font-weight:600;">🎤 ${voiceData.region}</span> 
                    <span style="color:#64748b;">${this.currentVoice.name}</span>
                    <span style="color:#94a3b8; margin-left:8px; font-size:0.9em;">
                        Speed: ${randomParams.rate}x | Pitch: ${randomParams.pitch}x
                    </span>
                `;

                playBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
                audioProgress.style.width = '100%';
                this.isSpeaking = true;

                try {
                    await voiceRotationManager.speak(cleanText, this.currentVoice, {
                        rate: randomParams.rate,
                        pitch: randomParams.pitch,
                        volume: randomParams.volume,
                        onStart: () => {
                            console.log('🔊 Speaking with:', voiceData, 'Params:', randomParams);
                        },
                        onEnd: () => {
                            playBtn.style.display = 'inline-block';
                            stopBtn.style.display = 'none';
                            audioProgress.style.width = '0%';
                            playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                            this.isSpeaking = false;
                        },
                        onError: (error) => {
                            console.error('❌ TTS Error:', error);
                            voiceInfo.innerHTML = '<span style="color:#ef4444;">❌ Playback error</span>';
                            playBtn.style.display = 'inline-block';
                            stopBtn.style.display = 'none';
                            audioProgress.style.width = '0%';
                            this.isSpeaking = false;
                        }
                    });
                } catch (error) {
                    console.error('❌ Failed to speak:', error);
                    voiceInfo.innerHTML = '<span style="color:#ef4444;">❌ Failed to play audio</span>';
                    playBtn.style.display = 'inline-block';
                    stopBtn.style.display = 'none';
                    audioProgress.style.width = '0%';
                    this.isSpeaking = false;
                }
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                voiceRotationManager.stop();
                playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                playBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';
                audioProgress.style.width = '0%';
                voiceInfo.innerHTML = '<span>🎤 Ready to play</span>';
                this.isSpeaking = false;
            });
        }

        const transBtn = container.querySelector('#transcript-toggle-btn');
        if (transBtn) {
            transBtn.addEventListener('click', () => {
                const box = document.getElementById('transcript-text');
                box.style.display = box.style.display === 'none' ? 'block' : 'none';
            });
        }

        // Global Nav Buttons Override
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        // Remove old listeners to prevent stacking? 
        // Best practice: Cloning or named functions. For now, simple replacement via onclick property (which overrides).
        prevBtn.onclick = () => {
            if (this.currentPart > 1) { this.currentPart--; this.renderLayout(); window.scrollTo(0, 0); }
        };
        nextBtn.onclick = () => {
            if (this.currentPart < 4) { this.currentPart++; this.renderLayout(); window.scrollTo(0, 0); }
        };

        prevBtn.disabled = this.currentPart === 1;
        nextBtn.disabled = this.currentPart === 4;
    },

    renderQuestionItem(q) {
        const saved = state.answers.listening[q.id] || '';

        let innerContent = '';

        if (q.type === 'fill-in-blanks') {
            innerContent = `
                <div class="input-group" style="margin-top:10px;">
                    <input type="text" 
                        class="form-control" 
                        data-qid="${q.id}" 
                        value="${saved}"
                        placeholder="Type your answer..."
                        style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:8px; font-size:1rem;"
                        onchange="state.setAnswer('listening', '${q.id}', this.value)"
                    />
                </div>
            `;
        } else {
            // Handle Multiple Choice / True-False / Matching (as dropdowns or options)
            // Ensure options exist for True/False if missing
            let options = q.options;
            if (!options && (q.type === 'true-false' || q.type === 'yes-no')) {
                options = ['True', 'False', 'Not Given'];
            }
            if (!options) options = ['A', 'B', 'C', 'D']; // Fallback

            innerContent = `
            <div class="options-grid single-col">
                ${options.map((opt, i) => {
                const val = String.fromCharCode(65 + i);
                const isSelected = saved === val ? 'selected' : '';
                return `
                    <div class="option-card ${isSelected}" data-qid="${q.id}" data-val="${val}" style="padding:1rem; border:2px solid #e2e8f0; border-radius:8px; margin-bottom:0.5rem; cursor:pointer; transition:all 0.2s;">
                        <div class="option-indicator" style="width:28px; height:28px; font-weight:bold;">${val}</div>
                        <div class="option-text" style="font-size:1rem;">${opt}</div>
                    </div>
                    `;
            }).join('')}
            </div>
            `;
        }

        return `
        <div class="question-item component-card" id="q-item-${q.number}" style="margin-bottom: 2rem;">
            <div class="question-header" style="font-weight:600; margin-bottom:1rem; font-size: 1.1rem; color:#1e293b;">
                <span style="background:#2563eb; color:white; padding:4px 10px; border-radius:6px; font-size:0.9em; margin-right:10px;">${q.number}</span>
                ${q.question || q.questionText || 'Question'}
            </div>
            ${innerContent}
        </div>
        `;
    },

    updateZoneHeader() {
        document.getElementById('question-indicator').textContent = `Listening Part ${this.currentPart} / 4`;
        const pct = ((this.currentPart) / 4) * 100;
        document.getElementById('section-progress-fill').style.width = `${pct}%`;
    }
};
