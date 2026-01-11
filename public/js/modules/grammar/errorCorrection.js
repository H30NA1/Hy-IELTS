// Error Correction Renderer Module
export const errorCorrectionRenderer = {
    render(q, saved) {
        const savedStr = (typeof saved === 'string') ? saved : '';

        if (q.subtype === 'identify') {
            return `
                <div class="error-words" style="display:flex; flex-wrap:wrap; gap:10px; padding:15px; background:var(--surface-secondary); border-radius:8px;">
                    ${q.errorWords.map(word => {
                const isSelected = savedStr === word;
                return `
                            <div class="error-word ${isSelected ? 'selected' : ''}" data-qid="${q.id}" data-word="${word}"
                                style="padding:8px 16px; border-radius:6px; cursor:pointer; border:2px solid var(--border-light); ${isSelected ? 'background:var(--danger-color); color:white; border-color:var(--danger-color);' : 'background:white;'}">
                                ${word}
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        } else if (q.subtype === 'correct') {
            return `
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="padding:10px 15px; background:var(--surface-secondary); border-radius:6px; border:2px solid var(--danger-color);">
                        Incorrect: <strong>${q.incorrectWord}</strong>
                    </div>
                    <i class="fas fa-arrow-right" style="color:var(--text-tertiary);"></i>
                    <input type="text" class="error-correct" data-qid="${q.id}" 
                        placeholder="Type correction..." value="${savedStr}"
                        style="flex:1; padding:12px; border-radius:6px; border:2px solid var(--success-color);">
                </div>
            `;
        } else {
            return `
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div style="padding:12px; background:var(--surface-secondary); border-radius:6px; border-left:4px solid var(--danger-color);">
                        <strong>Incorrect:</strong> ${q.incorrectSentence}
                    </div>
                    <textarea class="error-rewrite" data-qid="${q.id}" rows="2"
                        placeholder="Rewrite the sentence correctly..." 
                        style="width:100%; padding:12px; border-radius:6px; border:2px solid var(--success-color); resize:vertical;">${savedStr}</textarea>
                </div>
            `;
        }
    },

    attachListeners(container, state) {
        // Identify error
        container.querySelectorAll('.error-word').forEach(w => {
            w.addEventListener('click', () => {
                const qid = w.dataset.qid;
                const word = w.dataset.word;
                state.setAnswer('grammar', qid, word);
                if (window.grammar) window.grammar.renderLayout();
            });
        });

        // Type correction
        container.querySelectorAll('.error-correct').forEach(i => {
            i.addEventListener('input', (e) => {
                state.setAnswer('grammar', i.dataset.qid, e.target.value);
            });
        });

        // Rewrite
        container.querySelectorAll('.error-rewrite').forEach(t => {
            t.addEventListener('input', (e) => {
                state.setAnswer('grammar', t.dataset.qid, e.target.value);
            });
        });
    }
};
