import state from '../utils/state.js';

export const reading = {
    render() {
        if (state.testData && state.testData.sections) {
            const section = state.testData.sections.find(s => s.id === 'reading');
            if (section && section.passages) {
                // Flatten passages into questions array
                this.questions = [];
                section.passages.forEach((p, idx) => {
                    const pQuestions = p.questions || [];
                    pQuestions.forEach(q => {
                        this.questions.push({ ...q, passage: idx + 1, passageContent: p.content });
                    });
                });
            }
        }

        if (!this.questions || this.questions.length === 0) {
            console.warn('Reading: No test data found, generating mocks.');
            this.questions = this.generateMockQuestions();
        }

        const sectionContainer = document.getElementById('reading');
        if (!sectionContainer) return;

        if (!this.currentPassage) this.currentPassage = 1;

        sectionContainer.innerHTML = '<div id="reading-container"></div>';

        this.renderLayout();
    },

    generateMockQuestions() {
        // Mock data logic retained...
        const questions = [];
        for (let pass = 1; pass <= 3; pass++) {
            let content = `
                <h2 style="margin-top:0; color:#1e293b;">Passage ${pass} Title</h2>
                <h4 style="color:#64748b; font-weight:normal; margin-bottom:1.5rem;">Subtitle or Introduction to the topic of Passage ${pass}</h4>
                <div style="font-size:1.05rem; line-height:1.8; color:#334155;">
                    <p><strong>Paragraph A</strong></p>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                    <p><strong>Paragraph B</strong></p>
                    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    <p>This paragraph contains specific details for Passage ${pass} questions.</p>
                    <p>[More text specific to Passage ${pass}...]</p>
                </div>
            `;

            for (let q = 1; q <= 10; q++) {
                const id = (pass - 1) * 10 + q;
                questions.push({
                    id: `reading-q${id}`,
                    passage: pass,
                    number: id,
                    instruction: `Passage ${pass}: Read and answer.`,
                    passageContent: content,
                    question: `Question ${id}: Reading comprehension check for Passage ${pass}.`,
                    options: ["True", "False", "Not Given"],
                    correctAnswer: "True"
                });
            }
        }
        return questions;
    },

    renderLayout() {
        const container = document.getElementById('reading-container');

        // 1. Render Tabs
        const tabsHtml = `
            <div class="category-tabs">
                ${[1, 2, 3].map(p => `
                    <button class="tab-btn ${p === this.currentPassage ? 'active' : ''}" data-pass="${p}">
                        Passage ${p}
                    </button>
                `).join('')}
            </div>
        `;

        // 2. Render Active Content
        const passQs = this.questions.filter(q => q.passage === this.currentPassage);
        const content = passQs[0].passageContent;

        const questionsListHtml = passQs.map(q => this.renderQuestionItem(q)).join('');

        const contentHtml = `
            <div class="inner-split-layout">
                <div class="content-side">
                    <div style="font-size:0.9rem; color:#64748b; margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">
                        Reading Passage ${this.currentPassage}
                    </div>
                    <div class="passage-text" style="background:#f8fafc; padding:2rem; border-radius:12px; border:1px solid #e2e8f0;">
                        ${content}
                    </div>
                </div>
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
        // Tab Listeners
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = parseInt(btn.dataset.pass);
                if (p !== this.currentPassage) {
                    this.currentPassage = p;
                    this.renderLayout();
                }
            });
        });

        // Question Listeners
        container.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => {
                const qid = card.dataset.qid;
                const val = card.dataset.val;

                const parent = card.closest('.options-grid');
                parent.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                state.setAnswer('reading', qid, val);
            });
        });

        // Nav Buttons
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        prevBtn.onclick = () => {
            if (this.currentPassage > 1) { this.currentPassage--; this.renderLayout(); window.scrollTo(0, 0); }
        };
        nextBtn.onclick = () => {
            if (this.currentPassage < 3) { this.currentPassage++; this.renderLayout(); window.scrollTo(0, 0); }
        };
        prevBtn.disabled = this.currentPassage === 1;
        nextBtn.disabled = this.currentPassage === 3;
    },

    renderQuestionItem(q) {
        const saved = state.answers.reading[q.id] || '';

        let innerContent = '';

        // Handle Fill in Blanks
        if (q.type === 'fill-in-blanks') {
            innerContent = `
                <div class="input-group" style="margin-top:10px;">
                    <input type="text" 
                        class="form-control" 
                        data-qid="${q.id}" 
                        value="${saved}"
                        placeholder="Answer..."
                        style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:8px; font-size:1rem;"
                        onchange="state.setAnswer('reading', '${q.id}', this.value)"
                    />
                </div>
            `;
        } else {
            // Handle MC / True-False
            let options = q.options;
            // Auto-generate options for T/F if missing
            if (!options && (q.type === 'true-false' || q.type === 'yes-no')) {
                options = ['True', 'False', 'Not Given'];
            }
            if (!options) options = ['A', 'B', 'C', 'D'];

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
        document.getElementById('question-indicator').textContent = `Reading Passage ${this.currentPassage} / 3`;
        const pct = ((this.currentPassage) / 3) * 100;
        document.getElementById('section-progress-fill').style.width = `${pct}%`;
    }
};
