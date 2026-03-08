/*
    File guide: Lightweight helpers for the game page.
    - Wires initial button/tab listeners after DOM is ready.
    - Manages clue tab switching between Across and Down panels.
*/

// Attach game-page listeners once the document is loaded.
document.addEventListener('DOMContentLoaded', () => {
    const btnCheck = document.getElementById('btn-check');
    if (btnCheck) {
        btnCheck.addEventListener('click', checkAnswers);

        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                window.customConfirm('Reset Puzzle', 'Are you sure you want to clear the grid?', () => {
                    loadPuzzle(currentPuzzle);
                    resetTimer();
                });
            });
        }

        const btnShowSolution = document.getElementById('btn-show-solution');
        if (btnShowSolution) {
            btnShowSolution.addEventListener('click', () => {
                window.customConfirm('Reveal Answers', 'Are you sure you want to reveal the answers? This will stop your score.', () => {
                    for (let r = 0; r < currentPuzzle.size; r++) {
                        for (let c = 0; c < currentPuzzle.size; c++) {
                            const cell = gridModel[r][c];
                            if (cell.answerChar !== null) {
                                const input = document.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
                                if (input) {
                                    input.value = cell.answerChar;
                                    cell.userInput = cell.answerChar;
                                    input.classList.remove('input-error');
                                    input.classList.add('input-success');
                                }
                            }
                        }
                    }
                    stopTimer();
                });
            });
        }

        const targetId = localStorage.getItem('cw_play_target') || 'daily-1';
        let puzzleToLoad = builtinTopics[targetId] || defaultPuzzleData;

        if (!builtinTopics[targetId] && targetId !== 'daily-1') {
            const customPuzzles = JSON.parse(localStorage.getItem('cw_custom_puzzles') || '[]');
            const found = customPuzzles.find((p) => p.id === targetId);
            if (found) puzzleToLoad = found;
        }

        try {
            const title = String(puzzleToLoad?.title || '');
            const isF1 = targetId === 'f1' || /\bformula\s*1\b|\bgrand\s*prix\b|\bf1\b/i.test(title);
            const isTech = targetId === 'tech' || /\btech\b|\bcode\b/i.test(title);
            const theme = isF1 ? 'f1' : (isTech ? 'tech' : '');
            if (theme) document.body.dataset.gameTheme = theme;
            else document.body.removeAttribute('data-game-theme');
        } catch (e) {
            // no-op
        }

        loadPuzzle(puzzleToLoad);
    }

    const btnReturnHome = document.getElementById('btn-return-home');
    if (btnReturnHome) {
        btnReturnHome.addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }

    const tabs = document.querySelectorAll('.clue-tab');
    if (tabs.length === 2) {
        tabs[0].addEventListener('click', () => switchClueTab('across'));
        tabs[1].addEventListener('click', () => switchClueTab('down'));
    }
});

function switchClueTab(dir) {
    // Keep tab button state and clue panel visibility in sync.
    document.querySelectorAll('.clue-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.clues-section').forEach(s => s.classList.remove('active'));
    if (dir === 'across') {
        document.querySelectorAll('.clue-tab')[0].classList.add('active');
        document.getElementById('clues-across').classList.add('active');
    } else {
        document.querySelectorAll('.clue-tab')[1].classList.add('active');
        document.getElementById('clues-down').classList.add('active');
    }
}
