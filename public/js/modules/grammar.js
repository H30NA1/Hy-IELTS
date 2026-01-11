import state from '../utils/state.js';

// Lazy-loaded renderers
let renderers = {};

export const grammar = {
    async render() {
        // Read data from state
        if (state.testData && state.testData.sections) {
            const grammarSection = state.testData.sections.find(s => s.id === 'grammar');
            if (grammarSection && grammarSection.questions) {
                this.questions = grammarSection.questions;
            }
        }

        // Fallback to mocks only if NO data exists
        if (!this.questions) {
            console.warn('Grammar: No test data found, generating mocks.');
            this.questions = this.generateMockQuestions();
        }

        const sectionContainer = document.getElementById('grammar');
        if (!sectionContainer) return;

        sectionContainer.innerHTML = '<div id="grammar-container"></div>';
        if (!this.currentType) this.currentType = 'multiple-choice';

        await this.loadRenderer(this.currentType);
        this.renderLayout();
    },

    async loadRenderer(type) {
        // Lazy load renderer modules on demand
        if (renderers[type]) return;

        const rendererMap = {
            'multiple-choice': './grammar/multipleChoice.js',
            'fill-in-blanks': './grammar/fillInBlanks.js',
            'matching': './grammar/matching.js',
            'error-correction': './grammar/errorCorrection.js'
        };

        if (rendererMap[type]) {
            const module = await import(rendererMap[type]);
            const rendererKey = type === 'multiple-choice' ? 'multipleChoiceRenderer' :
                type === 'fill-in-blanks' ? 'fillInBlanksRenderer' :
                    type === 'matching' ? 'matchingRenderer' : 'errorCorrectionRenderer';
            renderers[type] = module[rendererKey];
        }
    },

    generateMockQuestions() {
        const questions = [];
        const types = ['multiple-choice', 'fill-in-blanks', 'matching', 'error-correction'];

        for (let i = 1; i <= 60; i++) {
            const type = types[Math.floor((i - 1) / 15)];
            let q = { id: `grammar-q${i}`, type, number: i };

            switch (type) {
                case 'multiple-choice':
                    const mcTypes = ['standard', 'true-false', 'multi-select'];
                    q.subtype = mcTypes[(i - 1) % 3];
                    q.question = q.subtype === 'standard' ? `Choose the correct word:<br>I _____ to the store yesterday.` :
                        q.subtype === 'true-false' ? `Is this correct?<br>"She don't like swimming."` :
                            `Select ALL correct sentences:`;
                    q.options = q.subtype === 'standard' ? ["go", "went", "gone", "going"] :
                        q.subtype === 'true-false' ? ["True - Correct", "False - Incorrect"] :
                            ["He has worked here for 5 years.", "They was going to the park.", "She speaks English fluently.", "We doesn't have time."];
                    if (q.subtype === 'multi-select') q.multiSelect = true;
                    break;

                case 'fill-in-blanks':
                    const fibTypes = ['single', 'multiple', 'dropdown'];
                    q.subtype = fibTypes[(i - 16) % 3];
                    q.question = q.subtype === 'single' ? `Type the correct form:<br>She usually _____ the bus.` :
                        q.subtype === 'multiple' ? `Fill ALL blanks:<br>I _____ studying English _____ three years.` :
                            `Select the correct word:<br>They _____ to the cinema last night.`;
                    if (q.subtype === 'multiple') q.blanks = 2;
                    if (q.subtype === 'dropdown') q.dropdownOptions = ["go", "went", "gone", "going"];
                    break;

                case 'matching':
                    const matchTypes = ['dropdown', 'click-connect', 'drag-box', 'sort'];
                    q.matchingType = matchTypes[(i - 31) % 4];
                    q.question = `Match items (${q.matchingType.replace('-', ' ')}):`;
                    q.pairs = [
                        { left: "Present Simple", right: "I work every day" },
                        { left: "Past Simple", right: "I worked yesterday" },
                        { left: "Present Perfect", right: "I have worked here" },
                        { left: "Future", right: "I will work tomorrow" }
                    ];
                    break;

                case 'error-correction':
                    const errTypes = ['identify', 'correct', 'rewrite'];
                    q.subtype = errTypes[(i - 46) % 3];
                    q.question = q.subtype === 'identify' ? `Click the error:<br>He don't like eating vegetables.` :
                        q.subtype === 'correct' ? `Type the correction for <u>don't</u>:<br>She <u>don't</u> speak French.` :
                            `Rewrite correctly:<br>"They was going to the shop."`;
                    if (q.subtype === 'identify') q.errorWords = ["don't", "like", "eating", "vegetables"];
                    if (q.subtype === 'correct') q.incorrectWord = "don't";
                    if (q.subtype === 'rewrite') q.incorrectSentence = "They was going to the shop.";
                    break;
            }
            questions.push(q);
        }
        return questions;
    },

    renderLayout() {
        const container = document.getElementById('grammar-container');
        const types = [
            { id: 'multiple-choice', label: 'Multiple Choice' },
            { id: 'fill-in-blanks', label: 'Fill in Blanks' },
            { id: 'matching', label: 'Matching' },
            { id: 'error-correction', label: 'Error ID' }
        ];

        const tabsHtml = `
            <div class="category-tabs" style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
                ${types.map(t => `
                    <button class="tab-btn ${t.id === this.currentType ? 'active' : ''}" data-type="${t.id}"
                        style="padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer;">
                        ${t.label}
                    </button>
                `).join('')}
            </div>
        `;

        const activeQs = this.questions.filter(q => q.type === this.currentType);
        const contentHtml = `
            <div class="questions-list-centered" style="display:flex; flex-direction:column; gap:2rem; width:100%;">
                ${activeQs.map(q => this.renderQuestionItem(q)).join('')}
            </div>
        `;

        container.innerHTML = tabsHtml + contentHtml;
        this.attachListeners(container, types);
        this.updateZoneHeader();
    },

    renderQuestionItem(q) {
        const saved = state.answers.grammar[q.id];
        const renderer = renderers[q.type];
        const inner = renderer ? renderer.render(q, saved) : '';

        return `
            <div class="question-item component-card" style="padding:1.5rem; border-radius:8px;">
                <div class="question-header" style="font-weight:600; margin-bottom:1rem;">
                    <span style="background:var(--primary-color); color:white; padding:4px 10px; border-radius:6px; font-size:0.9em; margin-right:10px;">${q.number}</span>
                    <span style="font-size:0.75em; color:var(--text-tertiary); text-transform:uppercase; margin-right:10px;">${q.subtype || q.matchingType || 'standard'}</span>
                    <br>
                    <span style="margin-top:8px; display:inline-block;">${q.question}</span>
                </div>
                ${inner}
            </div>
        `;
    },

    attachListeners(container, types) {
        // Tab switching with lazy loading
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newType = btn.dataset.type;
                if (newType !== this.currentType) {
                    this.currentType = newType;
                    await this.loadRenderer(newType);
                    this.renderLayout();
                }
            });
        });

        // Attach type-specific listeners
        const renderer = renderers[this.currentType];
        if (renderer && renderer.attachListeners) {
            renderer.attachListeners(container, state);
        }

        // Nav buttons
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn && nextBtn) {
            prevBtn.onclick = async () => {
                const idx = types.findIndex(t => t.id === this.currentType);
                if (idx > 0) {
                    this.currentType = types[idx - 1].id;
                    await this.loadRenderer(this.currentType);
                    this.renderLayout();
                }
            };
            nextBtn.onclick = async () => {
                const idx = types.findIndex(t => t.id === this.currentType);
                if (idx < types.length - 1) {
                    this.currentType = types[idx + 1].id;
                    await this.loadRenderer(this.currentType);
                    this.renderLayout();
                }
            };
            prevBtn.disabled = this.currentType === types[0].id;
            nextBtn.disabled = this.currentType === types[types.length - 1].id;
        }
    },

    updateZoneHeader() {
        const indicator = document.getElementById('question-indicator');
        const progress = document.getElementById('section-progress-fill');

        if (indicator) {
            indicator.textContent = `Grammar: ${this.currentType.replace('-', ' ')}`;
        }
        if (progress) {
            progress.style.width = '100%';
        }
    }
};

// Make available globally for renderer callbacks
window.grammar = grammar;
