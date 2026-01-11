// Fill in Blanks Renderer Module
export const fillInBlanksRenderer = {
    render(q, saved) {
        if (q.subtype === 'multiple') {
            const savedObj = (saved && typeof saved === 'object' && !Array.isArray(saved)) ? saved : {};
            return `
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${[...Array(q.blanks)].map((_, i) => `
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-weight:600; color:var(--text-secondary);">Blank ${i + 1}:</span>
                            <input type="text" class="fill-input-multi" data-qid="${q.id}" data-idx="${i}"
                                placeholder="Type here..." value="${savedObj[i] || ''}"
                                style="flex:1; padding:10px; border-radius:6px; border:2px solid var(--border-light);">
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (q.subtype === 'dropdown') {
            const savedStr = (typeof saved === 'string') ? saved : '';
            return `
                <select class="fill-dropdown" data-qid="${q.id}" 
                    style="width:100%; padding:12px; border-radius:6px; border:2px solid var(--border-light); font-size:1rem;">
                    <option value="">Select...</option>
                    ${q.dropdownOptions.map(opt => `
                        <option value="${opt}" ${savedStr === opt ? 'selected' : ''}>${opt}</option>
                    `).join('')}
                </select>
            `;
        } else {
            const savedStr = (typeof saved === 'string') ? saved : '';
            return `
                <input type="text" class="fill-input" data-qid="${q.id}" 
                    placeholder="Type your answer..." value="${savedStr}"
                    style="width:100%; padding:12px; border-radius:6px; border:2px solid var(--border-light); font-size:1rem;">
            `;
        }
    },

    attachListeners(container, state) {
        // Single input
        container.querySelectorAll('.fill-input').forEach(i => {
            i.addEventListener('input', (e) => {
                state.setAnswer('grammar', i.dataset.qid, e.target.value);
            });
        });

        // Multiple inputs
        container.querySelectorAll('.fill-input-multi').forEach(i => {
            i.addEventListener('input', (e) => {
                const qid = i.dataset.qid;
                const idx = i.dataset.idx;
                const current = state.answers.grammar[qid] || {};
                current[idx] = e.target.value;
                state.setAnswer('grammar', qid, current);
            });
        });

        // Dropdown
        container.querySelectorAll('.fill-dropdown').forEach(s => {
            s.addEventListener('change', (e) => {
                state.setAnswer('grammar', s.dataset.qid, e.target.value);
            });
        });
    }
};
