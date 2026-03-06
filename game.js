/*
    File guide: Lightweight helpers for the game page.
    - Wires initial button/tab listeners after DOM is ready.
    - Manages clue tab switching between Across and Down panels.
*/

// Attach game-page listeners once the document is loaded.
document.addEventListener('DOMContentLoaded', () => {
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
