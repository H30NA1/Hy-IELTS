// Matching Renderer Module
export const matchingRenderer = {
    render(q, saved) {
        switch (q.matchingType) {
            case 'dropdown':
                return this.renderDropdown(q, saved);
            case 'click-connect':
                return this.renderClickConnect(q, saved);
            case 'drag-box':
                return this.renderDragBox(q, saved);
            case 'sort':
                return this.renderSort(q, saved);
            default:
                return this.renderDropdown(q, saved);
        }
    },

    renderDropdown(q, saved) {
        return q.pairs.map((pair, idx) => `
            <div style="display:flex; gap:10px; margin-bottom:8px; align-items:center;">
                <div style="flex:1; font-size:0.9em; padding:8px; background:#f8fafc; border-radius:6px; color:#0f172a;">${pair.left}</div>
                <i class="fas fa-arrow-right" style="color:#94a3b8;"></i>
                <select class="match-select" data-qid="${q.id}" data-idx="${idx}" style="flex:1; padding:8px; border-radius:6px; border:1px solid #e2e8f0;">
                    <option value="">Select...</option>
                    ${q.pairs.map(p => `<option value="${p.right}" ${saved[idx] === p.right ? 'selected' : ''}>${p.right}</option>`).join('')}
                </select>
            </div>
        `).join('');
    },

    renderClickConnect(q, saved) {
        return `
            <div class="click-match-container" data-qid="${q.id}" style="background:#f8fafc; padding:15px; border-radius:8px;">
                <div style="font-size:0.85em; color:#475569; margin-bottom:10px;">
                    <i class="fas fa-info-circle"></i> Click a blue item, then click a yellow item to connect
                </div>
                <div style="display:flex; gap:30px; justify-content:space-between;">
                    <div style="flex:1;">
                        ${q.pairs.map((p, i) => {
            const isConnected = saved[i] !== undefined;
            return `
                                <div class="click-left-item" data-qid="${q.id}" data-idx="${i}" 
                                    style="padding:10px; margin-bottom:8px; background:${isConnected ? '#dcfce7' : '#dbeafe'}; 
                                    border:2px solid ${isConnected ? '#10b981' : '#3b82f6'}; border-radius:6px; cursor:pointer; transition:all 0.2s;">
                                    ${p.left} ${isConnected ? '✓' : ''}
                                </div>
                            `;
        }).join('')}
                    </div>
                    <div style="flex:1;">
                        ${q.pairs.map((p, i) => `
                            <div class="click-right-item" data-qid="${q.id}" data-val="${p.right}" 
                                style="padding:10px; margin-bottom:8px; background:#fef3c7; border:2px solid #f59e0b; 
                                border-radius:6px; cursor:pointer; transition:all 0.2s;">
                                ${p.right}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderDragBox(q, saved) {
        return `
            <div class="drag-match-container" data-qid="${q.id}">
                <div style="font-size:0.85em; color:#475569; margin-bottom:10px;">
                    <i class="fas fa-hand-pointer"></i> Drag items from left to matching boxes on right
                </div>
                <div style="display:flex; gap:30px;">
                    <div class="drag-source" style="flex:1; min-height:200px; background:#f1f5f9; padding:15px; border-radius:8px; border:2px dashed #cbd5e1;">
                        ${q.pairs.map((p, i) => {
            const isDragged = Object.values(saved).includes(p.left);
            return isDragged ? '' : `
                                <div class="draggable-item" draggable="true" data-qid="${q.id}" data-val="${p.left}" data-idx="${i}"
                                    style="padding:10px; margin-bottom:8px; background:white; border:2px solid #3b82f6; 
                                    border-radius:6px; cursor:move; transition:all 0.2s;">
                                    ${p.left}
                                </div>
                            `;
        }).join('')}
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
                        ${q.pairs.map((p, i) => `
                            <div class="drop-zone" data-qid="${q.id}" data-target="${p.right}" data-idx="${i}"
                                style="padding:15px; min-height:50px; background:#fef3c7; border:2px dashed #f59e0b; 
                                border-radius:8px; transition:all 0.2s;">
                                <div style="font-size:0.85em; color:#0f172a; font-weight:600; margin-bottom:5px;">${p.right}</div>
                                ${saved[i] ? `<div style="padding:8px; background:white; border:2px solid #10b981; border-radius:4px;">${saved[i]}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderSort(q, saved) {
        const savedOrder = saved.order || q.pairs.map((_, i) => i);
        return `
            <div class="sort-match-container" data-qid="${q.id}">
                <div style="font-size:0.85em; color:#475569; margin-bottom:10px;">
                    <i class="fas fa-sort"></i> Drag to reorder items to match correctly
                </div>
                <div class="sortable-list" style="background:#f8fafc; padding:15px; border-radius:8px;">
                    ${savedOrder.map(originalIdx => {
            const pair = q.pairs[originalIdx];
            return `
                            <div class="sortable-item" draggable="true" data-qid="${q.id}" data-idx="${originalIdx}"
                                style="padding:12px; margin-bottom:8px; background:white; border:2px solid #cbd5e1; 
                                border-radius:6px; cursor:move; display:flex; justify-content:space-between; align-items:center;">
                                <span><strong>${pair.left}</strong> → ${pair.right}</span>
                                <i class="fas fa-grip-vertical" style="color:#94a3b8;"></i>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    attachListeners(container, state) {
        // Dropdown
        container.querySelectorAll('.match-select').forEach(s => {
            s.addEventListener('change', (e) => {
                const qid = s.dataset.qid;
                const idx = s.dataset.idx;
                const cur = state.answers.grammar[qid] || {};
                cur[idx] = e.target.value;
                state.setAnswer('grammar', qid, cur);
            });
        });

        // Click-connect
        this.attachClickConnect(container, state);

        // Drag-box
        this.attachDragBox(container, state);

        // Sort
        this.attachSort(container, state);
    },

    attachClickConnect(container, state) {
        const matchContainers = container.querySelectorAll('.click-match-container');
        matchContainers.forEach(matchContainer => {
            const qid = matchContainer.dataset.qid;
            let selectedLeftIdx = null;

            matchContainer.querySelectorAll('.click-left-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    matchContainer.querySelectorAll('.click-left-item').forEach(i => {
                        i.style.boxShadow = 'none';
                        i.style.transform = 'scale(1)';
                    });
                    item.style.boxShadow = '0 0 0 4px var(--primary-color)';
                    item.style.transform = 'scale(1.02)';
                    selectedLeftIdx = item.dataset.idx;
                });
            });

            matchContainer.querySelectorAll('.click-right-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (selectedLeftIdx !== null) {
                        const rightVal = item.dataset.val;
                        const cur = state.answers.grammar[qid] || {};
                        cur[selectedLeftIdx] = rightVal;
                        state.setAnswer('grammar', qid, cur);
                        if (window.grammar) window.grammar.renderLayout();
                    }
                });
            });
        });
    },

    attachDragBox(container, state) {
        let draggedElement = null;

        container.querySelectorAll('.draggable-item').forEach(item => {
            item.addEventListener('dragstart', () => {
                draggedElement = item;
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
            });
        });

        container.querySelectorAll('.drop-zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.style.background = '#fde047';
            });
            zone.addEventListener('dragleave', () => {
                zone.style.background = '#fef3c7';
            });
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.style.background = '#fef3c7';

                if (draggedElement) {
                    const qid = zone.dataset.qid;
                    const idx = zone.dataset.idx;
                    const val = draggedElement.dataset.val;
                    const cur = state.answers.grammar[qid] || {};
                    cur[idx] = val;
                    state.setAnswer('grammar', qid, cur);
                    if (window.grammar) window.grammar.renderLayout();
                }
            });
        });
    },

    attachSort(container, state) {
        let draggedItem = null;

        container.querySelectorAll('.sortable-item').forEach(item => {
            item.addEventListener('dragstart', () => {
                draggedItem = item;
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const sortableList = item.closest('.sortable-list');
                const afterElement = this.getDragAfterElement(sortableList, e.clientY);
                if (afterElement == null) {
                    sortableList.appendChild(draggedItem);
                } else {
                    sortableList.insertBefore(draggedItem, afterElement);
                }
            });
            item.addEventListener('drop', () => {
                const qid = item.dataset.qid;
                const sortableList = item.closest('.sortable-list');
                const items = [...sortableList.querySelectorAll('.sortable-item')];
                const newOrder = items.map(el => parseInt(el.dataset.idx));
                const cur = state.answers.grammar[qid] || {};
                cur.order = newOrder;
                state.setAnswer('grammar', qid, cur);
            });
        });
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
};
