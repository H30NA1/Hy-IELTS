// Matching Renderer Module
export const matchingRenderer = {
    render(q, saved) {
        // Ensure saved is an object/array as needed
        const safeSaved = (saved && typeof saved === 'object') ? saved : {};

        switch (q.matchingType) {
            case 'dropdown':
                return this.renderDropdown(q, safeSaved);
            case 'click-connect':
                return this.renderClickConnect(q, safeSaved);
            case 'drag-box':
                return this.renderDragBox(q, safeSaved);
            case 'sort':
                return this.renderSort(q, safeSaved);
            default:
                return this.renderDropdown(q, safeSaved);
        }
    },

    renderDropdown(q, saved) {
        const pairs = q.pairs || [];
        return pairs.map((pair, idx) => `
            <div style="display:flex; gap:10px; margin-bottom:8px; align-items:center;">
                <div style="flex:1; font-size:0.9em; padding:8px; background:#f8fafc; border-radius:6px; color:#0f172a;">${pair.left}</div>
                <i class="fas fa-arrow-right" style="color:#94a3b8;"></i>
                <select class="match-select" data-qid="${q.id}" data-idx="${idx}" style="flex:1; padding:8px; border-radius:6px; border:1px solid #e2e8f0;">
                    <option value="">Select...</option>
                    ${pairs.map(p => `<option value="${p.right}" ${saved[idx] === p.right ? 'selected' : ''}>${p.right}</option>`).join('')}
                </select>
            </div>
        `).join('');
    },

    renderClickConnect(q, saved) {
        const pairs = q.pairs || [];
        return `
            <div class="click-match-container" data-qid="${q.id}" style="background:#f8fafc; padding:15px; border-radius:8px;">
                <div style="font-size:0.85em; color:#475569; margin-bottom:10px;">
                    <i class="fas fa-info-circle"></i> Click a blue item, then click a yellow item to connect
                </div>
                <div style="display:flex; gap:30px; justify-content:space-between;">
                    <div style="flex:1;">
                        ${pairs.map((p, i) => {
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
                        ${pairs.map((p, i) => `
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
        // DragBox uses q.groups = { "GroupA": ["item1", "item2"], ... }
        // Or q.pairs if it's old style.
        const groups = q.groups || {};
        const groupNames = Object.keys(groups);

        // Items to be dragged: all items from all groups, shuffled.
        let allItems = [];
        if (q.groups) {
            allItems = Object.values(q.groups).flat();
        } else if (q.pairs) {
            allItems = q.pairs.map(p => p.left);
        }

        // Filter out already placed items
        const placedItems = Object.values(saved).flat();
        const availableItems = allItems.filter(it => !placedItems.includes(it));

        return `
            <div class="drag-match-container" data-qid="${q.id}">
                <div style="font-size:0.85em; color:#475569; margin-bottom:10px;">
                    <i class="fas fa-hand-pointer"></i> Drag items from left to matching boxes on right
                </div>
                <div style="display:flex; gap:30px;">
                    <div class="drag-source" style="flex:1; min-height:150px; background:#f1f5f9; padding:15px; border-radius:8px; border:2px dashed #cbd5e1;">
                        <div style="font-size:0.75em; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Available Items</div>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">
                            ${availableItems.map((val, i) => `
                                <div class="draggable-item" draggable="true" data-qid="${q.id}" data-val="${val}"
                                    style="padding:8px 12px; background:white; border:2px solid #3b82f6; 
                                    border-radius:6px; cursor:move; transition:all 0.2s; font-size:0.9em; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                                    ${val}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
                        ${(groupNames.length ? groupNames : q.pairs.map(p => p.right)).map((name, i) => {
            const groupAnswers = saved[name] || [];
            return `
                                <div class="drop-zone" data-qid="${q.id}" data-group="${name}"
                                    style="padding:15px; min-height:80px; background:#fef3c7; border:2px dashed #f59e0b; 
                                    border-radius:8px; transition:all 0.2s;">
                                    <div style="font-size:0.85em; color:#0f172a; font-weight:700; margin-bottom:10px; border-bottom:1px solid rgba(245,158,11,0.3);">${name}</div>
                                    <div style="display:flex; flex-wrap:wrap; gap:5px;">
                                        ${groupAnswers.map(ans => `
                                            <div class="placed-item" data-qid="${q.id}" data-group="${name}" data-val="${ans}"
                                                style="padding:5px 10px; background:white; border:1px solid #10b981; border-radius:4px; font-size:0.85em; cursor:pointer;">
                                                ${ans} <i class="fas fa-times" style="font-size:0.8em; color:#ef4444; margin-left:5px;"></i>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderSort(q, saved) {
        // Sort uses items = ["word1", "word2"...]
        const initialItems = q.items || (q.pairs ? q.pairs.map(p => p.left) : []);
        // saved for sort should be an array of values in current order.
        const currentItems = (Array.isArray(saved) && saved.length === initialItems.length) ? saved : initialItems;

        return `
            <div class="sort-match-container" data-qid="${q.id}">
                <div style="font-size:0.85em; color:#475569; margin-bottom:10px;">
                    <i class="fas fa-sort"></i> Drag item up or down to change order
                </div>
                <div class="sortable-list" style="background:#f8fafc; padding:15px; border-radius:8px; display:flex; flex-direction:column; gap:8px;">
                    ${currentItems.map((val, idx) => `
                        <div class="sortable-item" draggable="true" data-qid="${q.id}" data-idx="${idx}" data-val="${val}"
                            style="padding:12px; background:white; border:2px solid #cbd5e1; 
                            border-radius:6px; cursor:move; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                            <span class="sort-text"><strong>${val}</strong></span>
                            <i class="fas fa-grip-vertical" style="color:#94a3b8;"></i>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    attachListeners(container, state) {
        // Dropdown
        container.querySelectorAll('.match-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const qid = sel.dataset.qid;
                const idx = sel.dataset.idx;
                const current = state.answers.grammar[qid] || {};
                current[idx] = e.target.value;
                state.setAnswer('grammar', qid, current);
            });
        });

        // Click-connect
        let selectedLeftIdx = null;
        container.querySelectorAll('.click-left-item').forEach(item => {
            item.addEventListener('click', () => {
                const qid = item.dataset.qid;
                container.querySelectorAll('.click-left-item').forEach(x => x.style.background = '#dbeafe');
                item.style.background = '#fde047';
                selectedLeftIdx = item.dataset.idx;
            });
        });

        container.querySelectorAll('.click-right-item').forEach(item => {
            item.addEventListener('click', () => {
                if (selectedLeftIdx !== null) {
                    const qid = item.dataset.qid;
                    const rightVal = item.dataset.val;
                    const cur = state.answers.grammar[qid] || {};
                    cur[selectedLeftIdx] = rightVal;
                    state.setAnswer('grammar', qid, cur);
                    if (window.grammar) window.grammar.renderLayout();
                    selectedLeftIdx = null;
                }
            });
        });

        // Drag-box and Sort (Drag & Drop)
        this.attachDragDrop(container, state);
    },

    attachDragDrop(container, state) {
        let draggedValue = null;
        let draggedQid = null;

        container.querySelectorAll('.draggable-item').forEach(item => {
            item.addEventListener('dragstart', () => {
                draggedValue = item.dataset.val;
                draggedQid = item.dataset.qid;
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
                draggedValue = null;
            });
        });

        // Drop zones for Drag-box
        container.querySelectorAll('.drop-zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => e.preventDefault());
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedValue && draggedQid === zone.dataset.qid) {
                    const group = zone.dataset.group;
                    const cur = state.answers.grammar[draggedQid] || {};
                    if (!cur[group]) cur[group] = [];
                    if (!cur[group].includes(draggedValue)) {
                        cur[group].push(draggedValue);
                        state.setAnswer('grammar', draggedQid, cur);
                        if (window.grammar) window.grammar.renderLayout();
                    }
                }
            });
        });

        // Remove item from Drag-box group
        container.querySelectorAll('.placed-item').forEach(item => {
            item.addEventListener('click', () => {
                const qid = item.dataset.qid;
                const group = item.dataset.group;
                const val = item.dataset.val;
                const cur = state.answers.grammar[qid] || {};
                if (cur[group]) {
                    cur[group] = cur[group].filter(i => i !== val);
                    state.setAnswer('grammar', qid, cur);
                    if (window.grammar) window.grammar.renderLayout();
                }
            });
        });

        // Sortable logic
        let draggedSortItem = null;
        container.querySelectorAll('.sortable-item').forEach(item => {
            item.addEventListener('dragstart', () => {
                draggedSortItem = item;
                item.classList.add('dragging');
            });
            item.addEventListener('dragend', () => {
                draggedSortItem = null;
                item.classList.remove('dragging');

                // Save new order
                const qid = item.dataset.qid;
                const list = item.closest('.sortable-list');
                const newOrder = [...list.querySelectorAll('.sortable-item')].map(el => el.dataset.val);
                state.setAnswer('grammar', qid, newOrder);
            });
        });

        const sortList = container.querySelector('.sortable-list');
        if (sortList) {
            sortList.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(sortList, e.clientY);
                if (afterElement == null) {
                    sortList.appendChild(draggedSortItem);
                } else {
                    sortList.insertBefore(draggedSortItem, afterElement);
                }
            });
        }
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
