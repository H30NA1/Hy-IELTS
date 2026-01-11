// Multiple Choice Renderer Module
export const multipleChoiceRenderer = {
    render(q, saved) {
        if (q.multiSelect) {
            const savedArray = Array.isArray(saved) ? saved : [];
            return `
                <div class="options-grid" style="display:flex; flex-direction:column; gap:10px;">
                    ${q.options.map((opt, i) => {
                const val = String.fromCharCode(65 + i);
                const isSelected = savedArray.includes(val);
                return `
                            <div class="option-card multi ${isSelected ? 'selected' : ''}" 
                                data-qid="${q.id}" data-val="${val}" 
                                style="padding:12px 16px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:12px;">
                                <div class="checkbox" style="width:20px; height:20px; border:2px solid var(--border-medium); border-radius:4px; display:flex; align-items:center; justify-content:center; ${isSelected ? 'background:var(--primary-color); border-color:var(--primary-color);' : ''}">
                                    ${isSelected ? '<i class="fas fa-check" style="color:white; font-size:12px;"></i>' : ''}
                                </div>
                                <div class="option-indicator" style="width:28px; height:28px; background:var(--surface-secondary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:0.85em;">${val}</div>
                                <div class="option-text" style="flex:1;">${opt}</div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        } else {
            return `
                <div class="options-grid" style="display:flex; flex-direction:column; gap:10px;">
                    ${q.options.map((opt, i) => {
                const val = String.fromCharCode(65 + i);
                const isSelected = saved === val;
                return `
                            <div class="option-card ${isSelected ? 'selected' : ''}" 
                                data-qid="${q.id}" data-val="${val}" 
                                style="padding:12px 16px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap: 12px;">
                                <div class="option-indicator" style="width:28px; height:28px; background:var(--surface-secondary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:0.85em;">${val}</div>
                                <div class="option-text" style="flex:1;">${opt}</div>
                            </div>
                        `;
            }).join('')}
               </div>
            `;
        }
    },

    attachListeners(container, state) {
        // Single-select
        container.querySelectorAll('.option-card:not(.multi)').forEach(c => {
            c.addEventListener('click', () => {
                const qid = c.dataset.qid;
                const val = c.dataset.val;
                const parent = c.closest('.options-grid');
                parent.querySelectorAll('.option-card').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
                state.setAnswer('grammar', qid, val);
            });
        });

        // Multi-select
        container.querySelectorAll('.option-card.multi').forEach(c => {
            c.addEventListener('click', () => {
                const qid = c.dataset.qid;
                const val = c.dataset.val;
                const current = state.answers.grammar[qid] || [];
                const arr = Array.isArray(current) ? [...current] : [];

                if (arr.includes(val)) {
                    arr.splice(arr.indexOf(val), 1);
                } else {
                    arr.push(val);
                }
                state.setAnswer('grammar', qid, arr);

                // Re-render to update checkboxes
                if (window.grammar) window.grammar.renderLayout();
            });
        });
    }
};
