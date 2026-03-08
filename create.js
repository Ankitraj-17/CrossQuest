// Create page logic only.
document.addEventListener('DOMContentLoaded', () => {
    const btnGenerateGrid = document.getElementById('btn-generate-grid');
    if (!btnGenerateGrid) return;

    let creatorGrid = [];
    let creatorWords = [];
    let creatorClues = {};
    let currentTool = 'select';

    document.querySelectorAll('.size-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.size-pill').forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            const sizeSelect = document.getElementById('create-size');
            if (sizeSelect) {
                sizeSelect.value = pill.dataset.size;
                sizeSelect.dispatchEvent(new Event('change'));
            }
        });
    });

    const btnSelect = document.getElementById('tool-select');
    const btnBlock = document.getElementById('tool-block');
    const btnFillBlack = document.getElementById('tool-fill-black');

    if (btnSelect) {
        btnSelect.addEventListener('click', (e) => {
            currentTool = 'select';
            e.currentTarget.classList.add('active');
            if (btnBlock) btnBlock.classList.remove('active');
        });
    }

    if (btnBlock) {
        btnBlock.addEventListener('click', (e) => {
            currentTool = 'block';
            e.currentTarget.classList.add('active');
            if (btnSelect) btnSelect.classList.remove('active');
        });
    }

    function refreshCreatorClues(size) {
        let wordNumber = 1;
        const detectedWords = [];

        document.querySelectorAll('#creator-board .cw-number').forEach((el) => el.remove());

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (creatorGrid[r][c].isBlack) continue;

                let needsNumber = false;

                const canAcross = c === 0 || creatorGrid[r][c - 1].isBlack;
                const validAcrossEnd = c + 1 < size && !creatorGrid[r][c + 1].isBlack;
                if (canAcross && validAcrossEnd) {
                    let ans = '';
                    let tempC = c;
                    while (tempC < size && !creatorGrid[r][tempC].isBlack) {
                        ans += creatorGrid[r][tempC].char || '?';
                        tempC++;
                    }
                    detectedWords.push({ number: wordNumber, dir: 'across', answer: ans, row: r, col: c });
                    needsNumber = true;
                }

                const canDown = r === 0 || creatorGrid[r - 1][c].isBlack;
                const validDownEnd = r + 1 < size && !creatorGrid[r + 1][c].isBlack;
                if (canDown && validDownEnd) {
                    let ans = '';
                    let tempR = r;
                    while (tempR < size && !creatorGrid[tempR][c].isBlack) {
                        ans += creatorGrid[tempR][c].char || '?';
                        tempR++;
                    }
                    detectedWords.push({ number: wordNumber, dir: 'down', answer: ans, row: r, col: c });
                    needsNumber = true;
                }

                if (needsNumber) {
                    const cell = document.querySelector(`.editor-mode .cw-cell[data-row="${r}"][data-col="${c}"]`);
                    if (cell) {
                        const numSpan = document.createElement('span');
                        numSpan.className = 'cw-number';
                        numSpan.innerText = String(wordNumber);
                        cell.appendChild(numSpan);
                    }
                    wordNumber++;
                }
            }
        }

        creatorWords = detectedWords;
        const container = document.getElementById('creator-clues-container');
        if (!container) return;
        container.replaceChildren();

        if (creatorWords.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-clues-state';
            emptyState.textContent = 'Add white cells and letters to detect words.';
            container.replaceChildren(emptyState);
            return;
        }

        const acrossWords = creatorWords.filter((w) => w.dir === 'across');
        const downWords = creatorWords.filter((w) => w.dir === 'down');

        const cluesSection = createEl('div', { className: 'clues-section' });

        const acrossGroup = createEl('div', { className: 'clue-group' });
        const acrossHeader = createEl('h4', { className: 'clues-column-header' });
        const acrossHeaderLeft = createEl('span');
        acrossHeaderLeft.append(createEl('i', { className: 'fa-solid fa-arrows-left-right' }), document.createTextNode(' Across'));
        const acrossCount = createEl('span', { className: 'clue-count-badge', text: String(acrossWords.length), attrs: { id: 'across-count' } });
        acrossHeader.append(acrossHeaderLeft, acrossCount);
        const acrossList = createEl('div', { className: 'clue-list-h', attrs: { id: 'clues-across-list' } });
        acrossGroup.append(acrossHeader, acrossList);

        const downGroup = createEl('div', { className: 'clue-group' });
        const downHeader = createEl('h4', { className: 'clues-column-header' });
        const downHeaderLeft = createEl('span');
        downHeaderLeft.append(createEl('i', { className: 'fa-solid fa-arrows-up-down' }), document.createTextNode(' Down'));
        const downCount = createEl('span', { className: 'clue-count-badge', text: String(downWords.length), attrs: { id: 'down-count' } });
        downHeader.append(downHeaderLeft, downCount);
        const downList = createEl('div', { className: 'clue-list-h', attrs: { id: 'clues-down-list' } });
        downGroup.append(downHeader, downList);

        cluesSection.append(acrossGroup, downGroup);
        container.replaceChildren(cluesSection);

        creatorWords.forEach((word) => {
            const key = `${word.number}-${word.dir}`;
            const existingClue = creatorClues[key] || '';

            const card = document.createElement('div');
            card.className = 'clue-card-h';

            const numPill = createEl('div', { className: 'clue-num-pill', text: String(word.number) });
            const inputWrap = createEl('div', { className: 'clue-input-wrap' });
            const clueInput = createEl('input', { className: 'clue-entry-input', attrs: { type: 'text', placeholder: 'Describe clue...' } });
            clueInput.value = existingClue;
            inputWrap.appendChild(clueInput);
            const len = createEl('div', { className: 'clue-word-len', text: String(word.answer.length) });
            card.append(numPill, inputWrap, len);

            clueInput.addEventListener('input', (e) => {
                creatorClues[key] = e.target.value;
            });

            if (word.dir === 'across') acrossList.appendChild(card);
            else downList.appendChild(card);
        });
    }

    function initCreatorGrid() {
        const size = parseInt(document.getElementById('create-size').value, 10);
        const board = document.getElementById('creator-board');
        board.replaceChildren();
        applyGridSizeClass(board, 'creator-grid-size', size);

        creatorGrid = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ isBlack: false, char: '' })));

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cellDiv = document.createElement('div');
                cellDiv.classList.add('cw-cell');
                cellDiv.dataset.row = String(r);
                cellDiv.dataset.col = String(c);

                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;

                input.addEventListener('input', (e) => {
                    creatorGrid[r][c] = { ...creatorGrid[r][c], char: e.target.value.toUpperCase() };
                    e.target.value = e.target.value.toUpperCase();
                    refreshCreatorClues(size);
                });

                cellDiv.appendChild(input);
                cellDiv.addEventListener('click', () => {
                    if (currentTool === 'block') {
                        const isBlack = !creatorGrid[r][c].isBlack;
                        creatorGrid[r][c] = { isBlack, char: '' };
                        if (isBlack) {
                            cellDiv.classList.add('black-cell');
                            input.value = '';
                            input.classList.add('cell-input-hidden');
                        } else {
                            cellDiv.classList.remove('black-cell');
                            input.classList.remove('cell-input-hidden');
                        }
                        refreshCreatorClues(size);
                    } else if (!creatorGrid[r][c].isBlack) {
                        input.focus();
                    }
                });

                board.appendChild(cellDiv);
            }
        }

        refreshCreatorClues(size);
    }

    if (btnFillBlack) {
        btnFillBlack.addEventListener('click', () => {
            const size = parseInt(document.getElementById('create-size').value, 10);
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (!creatorGrid[r][c].isBlack && !creatorGrid[r][c].char) {
                        creatorGrid[r][c] = { isBlack: true, char: '' };
                        const cellDiv = document.querySelector(`.editor-mode .cw-cell[data-row="${r}"][data-col="${c}"]`);
                        if (cellDiv) {
                            cellDiv.classList.add('black-cell');
                            const input = cellDiv.querySelector('input');
                            if (input) {
                                input.value = '';
                                input.classList.add('cell-input-hidden');
                            }
                        }
                    }
                }
            }
            refreshCreatorClues(size);
        });
    }

    btnGenerateGrid.addEventListener('click', initCreatorGrid);
    document.getElementById('create-size').addEventListener('change', initCreatorGrid);
    initCreatorGrid();

    document.getElementById('btn-save-puzzle').addEventListener('click', () => {
        const title = document.getElementById('create-title').value.trim() || 'Custom Puzzle';
        const size = parseInt(document.getElementById('create-size').value, 10);

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!creatorGrid[r][c].isBlack && !creatorGrid[r][c].char) {
                    creatorGrid[r][c] = { isBlack: true, char: '' };
                    const cellDiv = document.querySelector(`.editor-mode .cw-cell[data-row="${r}"][data-col="${c}"]`);
                    if (cellDiv) {
                        cellDiv.classList.add('black-cell');
                        const input = cellDiv.querySelector('input');
                        if (input) {
                            input.value = '';
                            input.classList.add('cell-input-hidden');
                        }
                    }
                }
            }
        }

        refreshCreatorClues(size);

        const finalWords = creatorWords.map((w) => {
            const key = `${w.number}-${w.dir}`;
            return { ...w, clue: creatorClues[key] || `Clue for ${w.answer}` };
        });

        if (finalWords.length === 0) {
            window.customAlert('Incomplete Puzzle', 'You need at least one valid word to save a puzzle. Type letters across connected white cells before publishing.', 'error');
            return;
        }

        const customPuzzle = {
            id: `custom-${Date.now()}`,
            title,
            difficulty: 'Custom',
            size,
            words: finalWords,
            createdAt: Date.now()
        };

        const savedPuzzles = JSON.parse(localStorage.getItem('cw_custom_puzzles') || '[]');
        savedPuzzles.push(customPuzzle);
        localStorage.setItem('cw_custom_puzzles', JSON.stringify(savedPuzzles));

        window.customAlert('Success Publishing!', `Puzzle "${title}" successfully published!`, 'success');
        window.location.href = 'play.html';
    });
});
