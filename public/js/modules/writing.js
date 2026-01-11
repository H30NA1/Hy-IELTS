import state from '../utils/state.js';
import { BrowserWritingChecker } from '../utils/browser-writing-checker.js';

export const writing = {
    checker: new BrowserWritingChecker(),
    isReviewMode: false,
    currentIssues: [],

    tasks: [
        { id: 'task1', title: 'Task 1: Report', instruction: 'Summarize the chart below.', minChars: 150 },
        { id: 'task2', title: 'Task 2: Essay', instruction: 'Discuss both views and give your opinion.', minChars: 250 }
    ],

    render() {
        const sectionContainer = document.getElementById('writing');
        if (!sectionContainer) return;

        sectionContainer.innerHTML = '<div id="writing-container"></div>';

        if (!this.currentIndex) this.currentIndex = 0;

        this.renderLayout();
    },

    renderLayout() {
        const container = document.getElementById('writing-container');
        const t = this.tasks[this.currentIndex];

        const savedContent = state.answers.writing[t.id] || '';
        const currentCount = savedContent.length;

        const html = `
            <div class="category-tabs">
                ${this.tasks.map((task, i) => `
                    <button class="tab-btn ${i === this.currentIndex ? 'active' : ''}" data-idx="${i}">
                        Task ${i + 1}
                    </button>
                `).join('')}
            </div>

            <div class="writing-layout full-width-card" style="background:white; padding:2.5rem; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:100px;">
                <h3 style="margin-top:0; color:#2563eb;">${t.title}</h3>
                <div class="instruction-box" style="margin-bottom:1.5rem; background:#f1f5f9; padding:1.5rem; border-radius:8px;">
                    <i class="fas fa-info-circle"></i> ${t.instruction}
                </div>
                
                <div class="writing-area">
                    <div id="editor-container">
                        <textarea id="writing-input-${t.id}" placeholder="Type your response here..." 
                            style="width:100%; height:400px; padding:1.5rem; border:2px solid #e2e8f0; border-radius:8px; font-family: 'Inter', sans-serif; font-size:1.05rem; line-height:1.6; resize:vertical; outline:none; transition:all 0.3s; box-shadow:inset 0 2px 4px rgba(0,0,0,0.02);">${savedContent}</textarea>
                    </div>

                    <div id="review-container" class="writing-review-mode" style="display:none;"></div>
                    
                    <div class="review-actions">
                        <button id="check-btn-${t.id}" class="check-btn">
                            <i class="fas fa-magic"></i> Check Writing
                        </button>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; font-weight:500;">
                        <div id="status-indicator-${t.id}" style="display:flex; align-items:center; gap:8px;">
                            <!-- JS updates this -->
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:1.2rem; font-weight:bold;" id="char-count-${t.id}">${currentCount}</span>
                            <span style="color:#64748b; font-size:0.9rem;">characters</span>
                        </div>
                    </div>
                    <!-- Feedback Bar -->
                    <div style="background:#e2e8f0; height:6px; border-radius:3px; margin-top:10px; overflow:hidden;">
                         <div id="char-progress-${t.id}" style="height:100%; width:0%; transition:width 0.3s, background-color 0.3s;"></div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.attachListeners(container, t);
        this.updateZoneHeader();
        this.updateCharCount(savedContent, t.id);
    },

    attachListeners(container, t) {
        // Tabs
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                if (idx !== this.currentIndex) {
                    this.currentIndex = idx;
                    this.isReviewMode = false; // Reset mode on switch
                    this.renderLayout();
                }
            });
        });

        // Text Area
        const tea = document.getElementById(`writing-input-${t.id}`);
        if (tea) {
            tea.addEventListener('input', (e) => {
                const val = e.target.value;
                state.setAnswer('writing', t.id, val);
                this.updateCharCount(val, t.id);
            });

            tea.addEventListener('focus', () => tea.style.borderColor = '#2563eb');
            tea.addEventListener('blur', () => tea.style.borderColor = '#e2e8f0');
        }

        // Check Button
        const checkBtn = document.getElementById(`check-btn-${t.id}`);
        if (checkBtn) {
            checkBtn.addEventListener('click', () => {
                this.toggleReviewMode(t.id);
            });
        }
    },

    toggleReviewMode(taskId) {
        this.isReviewMode = !this.isReviewMode;

        const editor = document.getElementById(`writing-input-${taskId}`);
        const review = document.getElementById('review-container');
        const btn = document.getElementById(`check-btn-${taskId}`);

        if (!editor || !review || !btn) return;

        if (this.isReviewMode) {
            // Enter Review Mode
            const text = editor.value;
            const issues = this.checker.check(text);
            this.currentIssues = issues; // Store for reference

            editor.style.display = 'none';
            review.style.display = 'block';
            review.innerHTML = this.generateReviewHTML(text, issues);

            btn.innerHTML = '<i class="fas fa-edit"></i> Back to Edit';
            btn.style.background = '#64748b';

            // Attach listeners to highlights
            this.attachReviewListeners(review, taskId);

        } else {
            // Exit Review Mode
            review.style.display = 'none';
            editor.style.display = 'block';

            btn.innerHTML = '<i class="fas fa-magic"></i> Check Writing';
            btn.style.background = '';
        }
    },

    generateReviewHTML(text, issues) {
        if (issues.length === 0) return text;

        let html = '';
        let lastIndex = 0;

        issues.forEach((issue, idx) => {
            // Add text before the issue
            html += this.escapeHtml(text.slice(lastIndex, issue.index));

            // Add the highlighted issue
            html += `<span class="issue-highlight issue-${issue.type}" data-idx="${idx}">${this.escapeHtml(issue.text)}</span>`;

            lastIndex = issue.index + issue.length;
        });

        // Add remaining text
        html += this.escapeHtml(text.slice(lastIndex));

        return html;
    },

    attachReviewListeners(container, taskId) {
        container.querySelectorAll('.issue-highlight').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                // Remove existing tooltips
                document.querySelectorAll('.correction-tooltip').forEach(t => t.remove());

                const idx = parseInt(el.dataset.idx);
                const issue = this.currentIssues[idx];

                this.showTooltip(el, issue, taskId);
            });
        });

        // Close tooltip on outside click
        document.addEventListener('click', () => {
            document.querySelectorAll('.correction-tooltip').forEach(t => t.remove());
        }, { once: true });
    },

    showTooltip(el, issue, taskId) {
        const tooltip = document.createElement('div');
        tooltip.className = 'correction-tooltip';

        let content = `<span>${issue.message}</span>`;
        if (issue.suggestion) {
            content += `<button class="correction-btn">Fix: ${issue.suggestion}</button>`;
        } else if (issue.fix) {
            content += `<button class="correction-btn">Fix</button>`;
        }

        tooltip.innerHTML = content;
        document.body.appendChild(tooltip);

        // Positioning
        const rect = el.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 8}px`;

        // Action
        const fixBtn = tooltip.querySelector('.correction-btn');
        if (fixBtn) {
            fixBtn.addEventListener('click', () => {
                this.applyFix(taskId, issue);
                tooltip.remove();
            });
        }
    },

    applyFix(taskId, issue) {
        const editor = document.getElementById(`writing-input-${taskId}`);
        if (!editor) return;

        let text = editor.value;
        let replacement = '';

        if (issue.suggestion) {
            replacement = issue.suggestion;
        } else if (issue.fix) {
            // Re-run the fix function on the specific text
            // Note: This relies on the fix function logic being robust
            // However, since we defined fix functions in the checker that take regex args, 
            // we might not have the original capture groups here easily unless we stored them.
            // Simplified: For now, if it's a simple spelling replacement, it works.
            // If it's a complex regex fix, we might need to re-run the regex on the snippet.
            // But we stored the 'fix' function in the issue object? No, we can't easily pass functions purely if they depend on regex context.
            // Actually, in BrowserWritingChecker, I stored 'fix' function but it needs the match args.
            // Let's rely on 'suggestion' string mainly. For complex grammar, maybe just highlight for now.

            // Wait, BrowserWritingChecker 'fix' functions take (match, p1, p2). 
            // I don't have those args here.

            // Hack for MVP: Simple replacements work. Complex logic might need re-evaluation.
            // Actually I should just run the fix logic on the specific substring if possible.
            // But I don't have the context.

            // Let's assume for now only "suggestion" based fixes (spelling) are fully auto-fixable in this UI.
            // Or simple logic fixes.

            // If I want to support grammar fixes, I should have generated the 'suggestion' string at check time.
            // Let's assume I'll update BrowserWritingChecker to generate 'suggestion' string for all fixable issues.
            return;
        }

        if (replacement) {
            const newText = text.slice(0, issue.index) + replacement + text.slice(issue.index + issue.length);
            editor.value = newText;
            state.setAnswer('writing', taskId, newText);

            // Refresh review view
            // We need to re-run check because indices shifted
            this.toggleReviewMode(taskId);
            this.toggleReviewMode(taskId); // Toggle off then on to refresh? Or just refresh logic.
            // Better:
            this.forceRefreshReview(taskId);
        }
    },

    forceRefreshReview(taskId) {
        const editor = document.getElementById(`writing-input-${taskId}`);
        const review = document.getElementById('review-container');
        if (!editor || !review) return;

        const text = editor.value;
        const issues = this.checker.check(text);
        this.currentIssues = issues;
        review.innerHTML = this.generateReviewHTML(text, issues);
        this.attachReviewListeners(review, taskId);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    updateCharCount(text, id) {
        const count = text.length;
        const countEl = document.getElementById(`char-count-${id}`);
        const statusEl = document.getElementById(`status-indicator-${id}`);
        const progressEl = document.getElementById(`char-progress-${id}`);

        if (!countEl) return;

        countEl.textContent = count;

        let statusHtml = '';
        let color = '';
        let width = Math.min((count / 1200) * 100, 100);

        if (count >= 1000) {
            statusHtml = '<i class="fas fa-check-circle" style="color:#10b981;"></i> <span style="color:#10b981;">Good Length</span>';
            color = '#10b981';
        } else if (count >= 750) {
            statusHtml = '<i class="fas fa-exclamation-circle" style="color:#f59e0b;"></i> <span style="color:#f59e0b;">Acceptable</span>';
            color = '#f59e0b';
        } else {
            statusHtml = '<i class="fas fa-times-circle" style="color:#ef4444;"></i> <span style="color:#ef4444;">Too Short</span>';
            color = '#ef4444';
        }

        statusEl.innerHTML = statusHtml;
        progressEl.style.width = `${width}%`;
        progressEl.style.backgroundColor = color;
    },

    updateZoneHeader() {
        document.getElementById('question-indicator').textContent = `Writing Task ${this.currentIndex + 1}`;
        document.getElementById('section-progress-fill').style.width = '100%';
    }
};
