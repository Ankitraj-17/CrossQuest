/*
    File guide: Main application script.
    - Handles shared UI interactions (mobile sidebar, modals, notifications).
    - Contains puzzle data models and gameplay flow for play/create/game screens.
    - Updates progress, XP, streaks, and localStorage-backed state.
*/
// --- Mobile Navigation Toggle ---
// Handles collapsing/expanding sidebar behavior on smaller screens.
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sidebar.classList.toggle('mobile-expanded');
        });

        // Close when clicking main content (backdrop effect)
        const mainArea = document.querySelector('.main-area');
        if (mainArea) {
            mainArea.addEventListener('click', () => {
                if (sidebar.classList.contains('mobile-expanded')) {
                    sidebar.classList.remove('mobile-expanded');
                }
            });
        }

        // Close button inside sidebar
        const closeBtn = document.createElement('button');
        closeBtn.className = 'sidebar-close';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        sidebar.appendChild(closeBtn);
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('mobile-expanded');
        });
    }
});

// --- Confetti Burst ---
// Lightweight canvas animation used after puzzle completion.
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', '#CE82FF', '#FFC800'];
    const particles = [];
    for (let i = 0; i < 120; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * -1,
            w: Math.random() * 10 + 5,
            h: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.rotation += p.rotSpeed;
            if (frame > 60) p.opacity -= 0.01;
            if (p.opacity > 0 && p.y < canvas.height + 50) {
                alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
        });
        frame++;
        if (alive) requestAnimationFrame(animate);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animate();
}

function createEl(tag, options = {}) {
    // Small helper to keep dynamic DOM creation readable and consistent.
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.attrs) {
        Object.entries(options.attrs).forEach(([key, value]) => {
            if (value !== undefined && value !== null) node.setAttribute(key, String(value));
        });
    }
    return node;
}

function applyGridSizeClass(element, prefix, size) {
    // Ensures only one size-class is active at a time (e.g., cw-grid-size-10).
    const classPrefix = `${prefix}-`;
    Array.from(element.classList).forEach((cls) => {
        if (cls.startsWith(classPrefix)) element.classList.remove(cls);
    });
    element.classList.add(`${classPrefix}${size}`);
}

// --- Data Structures ---
// Built-in puzzle payloads used by Play/Game pages.

const defaultPuzzleData = {
    id: 'daily-1',
    title: "Formula 1 Grand Prix Grid",
    difficulty: "Moderate",
    size: 10,
    words: [
        { answer: "SPEED", clue: "What F1 cars are known for", row: 0, col: 0, dir: "across", number: 1 },
        { answer: "SLIP", clue: "...stream (drafting behind another car)", row: 0, col: 0, dir: "down", number: 1 },
        { answer: "DRS", clue: "Drag Reduction System", row: 0, col: 4, dir: "down", number: 2 },
        { answer: "LAP", clue: "One circuit of the track", row: 2, col: 1, dir: "across", number: 3 },
        { answer: "PIT", clue: "Where tires get changed", row: 4, col: 2, dir: "across", number: 4 },
        { answer: "PACE", clue: "___ car (safety car)", row: 4, col: 2, dir: "down", number: 4 },
        { answer: "TYRE", clue: "Soft, Medium, or Hard compound", row: 2, col: 6, dir: "down", number: 5 },
        { answer: "HALO", clue: "Titanium cockpit protection device", row: 6, col: 5, dir: "across", number: 6 },
        { answer: "APEX", clue: "The innermost point of a corner", row: 5, col: 6, dir: "down", number: 6 },
        { answer: "RACE", clue: "Sunday's main event", row: 8, col: 4, dir: "across", number: 7 }
    ]
};

const builtinTopics = {
    'f1': defaultPuzzleData,
    'tech': {
        id: 'tech', title: "Tech & Code", difficulty: "Hard", size: 8,
        words: [
            { answer: "CODE", clue: "Programmer's text", row: 0, col: 0, dir: "across", number: 1 },
            { answer: "CPU", clue: "Brain of the computer", row: 0, col: 0, dir: "down", number: 1 },
            { answer: "BUG", clue: "Software error", row: 4, col: 2, dir: "across", number: 2 },
            { answer: "RAM", clue: "Temporary memory", row: 5, col: 4, dir: "across", number: 3 }
        ]
    },
    'safari': {
        id: 'safari', title: "Wild Safari", difficulty: "Easy", size: 8,
        words: [
            { answer: "LION", clue: "King of the jungle", row: 0, col: 0, dir: "across", number: 1 },
            { answer: "ZEBRA", clue: "Striped grassland animal", row: 1, col: 0, dir: "across", number: 2 },
            { answer: "GIRAFFE", clue: "Tallest land animal", row: 2, col: 0, dir: "across", number: 3 },
            { answer: "HIPPO", clue: "Big river-dwelling mammal", row: 4, col: 0, dir: "across", number: 4 },
            { answer: "SAFARI", clue: "Wildlife adventure trip", row: 6, col: 0, dir: "across", number: 5 },
            { answer: "TREE", clue: "Savanna shade source", row: 0, col: 7, dir: "down", number: 6 },
            { answer: "DUNE", clue: "A sand hill", row: 3, col: 6, dir: "down", number: 7 },
            { answer: "PAWS", clue: "Animal feet", row: 4, col: 7, dir: "down", number: 8 }
        ]
    }
};

window.playBuiltIn = function(topicId) {
    localStorage.setItem('cw_play_target', topicId);
    window.location.href = 'game.html';
};

// --- State ---
// Runtime state shared by game functions in this file.
let currentPuzzle = null;
let gridModel = []; // 2D array representation
let timerInterval = null;
let secondsElapsed = 0;
let isTimerRunning = false;
let currentScore = 0;

// --- Initialization ---
// Global UI helpers and modal systems.
window.deleteCustomPuzzle = function(id) {
    let puzzles = JSON.parse(localStorage.getItem('cw_custom_puzzles') || '[]');
    puzzles = puzzles.filter(p => p.id !== id);
    localStorage.setItem('cw_custom_puzzles', JSON.stringify(puzzles));
    window.location.reload();
};

window.customConfirm = function(title, message, onConfirm) {
    let overlay = document.getElementById('custom-confirm-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-confirm-modal';
        overlay.className = 'cw-modal-overlay';
        const card = createEl('div', { className: 'cw-dialog-card' });
        const icon = createEl('i', {
            className: 'fa-solid fa-triangle-exclamation cw-dialog-icon cw-dialog-icon-warning'
        });
        const heading = createEl('h2', {
            attrs: { id: 'cc-title' },
            className: 'cw-dialog-title'
        });
        const messageNode = createEl('p', {
            attrs: { id: 'cc-message' },
            className: 'cw-dialog-message'
        });
        const btnRow = createEl('div', { className: 'cw-dialog-actions' });
        const cancelBtn = createEl('button', {
            className: 'btn btn-outline',
            text: 'Cancel',
            attrs: { id: 'cc-btn-cancel' }
        });
        const confirmBtn = createEl('button', {
            className: 'btn btn-primary',
            text: 'Confirm',
            attrs: { id: 'cc-btn-confirm' }
        });
        btnRow.append(cancelBtn, confirmBtn);
        card.append(icon, heading, messageNode, btnRow);
        overlay.replaceChildren(card);
        document.body.appendChild(overlay);
    }
    
    document.getElementById('cc-title').innerText = title;
    document.getElementById('cc-message').innerText = message;
    
    overlay.classList.add('is-open');
    
    const btnCancel = document.getElementById('cc-btn-cancel');
    const btnConfirm = document.getElementById('cc-btn-confirm');
    
    // Clone-and-replace clears old listeners so callbacks do not stack across openings.
    const newCancel = btnCancel.cloneNode(true);
    const newConfirm = btnConfirm.cloneNode(true);
    btnCancel.parentNode.replaceChild(newCancel, btnCancel);
    btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);
    
    newCancel.addEventListener('click', () => overlay.classList.remove('is-open'));
    newConfirm.addEventListener('click', () => {
        overlay.classList.remove('is-open');
        if (onConfirm) onConfirm();
    });
};

window.customAlert = function(title, message, type = 'info') {
    let overlay = document.getElementById('custom-alert-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-alert-modal';
        overlay.className = 'cw-modal-overlay';
        const card = createEl('div', { className: 'cw-dialog-card' });
        const icon = createEl('i', {
            attrs: { id: 'ca-icon' },
            className: 'fa-solid fa-circle-info cw-dialog-icon cw-dialog-icon-info'
        });
        const heading = createEl('h2', {
            attrs: { id: 'ca-title' },
            className: 'cw-dialog-title'
        });
        const body = createEl('p', {
            attrs: { id: 'ca-message' },
            className: 'cw-dialog-message'
        });
        const okBtn = createEl('button', {
            className: 'btn btn-primary',
            text: 'OK',
            attrs: { id: 'ca-btn-ok' }
        });
        card.append(icon, heading, body, okBtn);
        overlay.replaceChildren(card);
        document.body.appendChild(overlay);
    }
    
    document.getElementById('ca-title').innerText = title;
    document.getElementById('ca-message').innerText = message;
    
    const icon = document.getElementById('ca-icon');
    icon.classList.remove('cw-dialog-icon-error', 'cw-dialog-icon-success', 'cw-dialog-icon-warning', 'cw-dialog-icon-info');
    if (type === 'error') {
        icon.className = 'fa-solid fa-circle-xmark';
        icon.classList.add('cw-dialog-icon', 'cw-dialog-icon-error');
    } else if (type === 'success') {
        icon.className = 'fa-solid fa-circle-check';
        icon.classList.add('cw-dialog-icon', 'cw-dialog-icon-success');
    } else if (type === 'warning') {
        icon.className = 'fa-solid fa-triangle-exclamation';
        icon.classList.add('cw-dialog-icon', 'cw-dialog-icon-warning');
    } else {
        icon.className = 'fa-solid fa-circle-info';
        icon.classList.add('cw-dialog-icon', 'cw-dialog-icon-info');
    }
    
    overlay.classList.add('is-open');
    
    const btnOk = document.getElementById('ca-btn-ok');
    const newOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newOk, btnOk);
    
    newOk.addEventListener('click', () => overlay.classList.remove('is-open'));
};

window.showPremiumModal = function() {
    let overlay = document.getElementById('premium-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'premium-modal';
        overlay.className = 'modal-overlay premium-overlay';

        const modalCard = createEl('div', { className: 'card prem-modal-card animate-slide-up premium-modal-card' });
        const closeBtn = createEl('button', { attrs: { id: 'close-premium', type: 'button' }, className: 'premium-close-btn' });
        closeBtn.appendChild(createEl('i', { className: 'fa-solid fa-xmark' }));

        const content = createEl('div', { className: 'premium-content' });
        const header = createEl('div', { className: 'prem-header premium-header' });
        const title = createEl('h1', { className: 'premium-title' });
        title.append(createEl('i', { className: 'fa-solid fa-crown premium-title-icon' }), document.createTextNode(' Go Premium'));
        const subtitle = createEl('p', { className: 'premium-subtitle', text: 'Choose the perfect plan for your crossword journey' });
        header.append(title, subtitle);

        const cards = createEl('div', { className: 'prem-cards premium-cards' });

        // Reusable row builder for plan feature lists.
        const createFeature = (text, iconClass = 'fa-solid fa-check', extraClass = '') => {
            const li = createEl('li', { className: extraClass });
            li.append(createEl('i', { className: iconClass }), document.createTextNode(` ${text}`));
            return li;
        };

        const freeCard = createEl('div', { className: 'prem-card' });
        freeCard.append(
            createEl('div', { className: 'prem-card-icon prem-icon-bg-gray' }),
            createEl('h3', { className: 'prem-plan-name', text: 'Free' }),
            (() => { const p = createEl('div', { className: 'prem-price' }); p.appendChild(createEl('span', { className: 'prem-amount', text: '$0' })); return p; })(),
            createEl('p', { className: 'prem-desc', text: 'Get started for free' })
        );
        freeCard.querySelector('.prem-card-icon').appendChild(createEl('i', { className: 'fa-solid fa-seedling' }));
        const freeList = createEl('ul', { className: 'prem-list' });
        freeList.append(
            createFeature('5 puzzles per day'),
            createFeature('Standard leaderboard'),
            createFeature('Basic creation tools'),
            createFeature('Community forum')
        );
        const freeBtn = createEl('button', { attrs: { id: 'prem-btn-free', type: 'button' }, className: 'btn btn-outline premium-btn-full premium-btn-bottom', text: 'Current Plan' });
        freeCard.append(freeList, freeBtn);

        const proCard = createEl('div', { className: 'prem-card prem-card-pro premium-card-pro' });
        proCard.append(
            createEl('div', { className: 'prem-popular-tag', text: 'MOST POPULAR' }),
            createEl('div', { className: 'prem-card-icon prem-icon-bg-white' }),
            createEl('h3', { className: 'prem-plan-name prem-text-white', text: 'Pro' })
        );
        proCard.querySelector('.prem-card-icon').appendChild(createEl('i', { className: 'fa-solid fa-crown' }));
        const proPrice = createEl('div', { className: 'prem-price' });
        proPrice.append(
            createEl('span', { className: 'prem-amount prem-text-white', text: '$9.99' }),
            createEl('span', { className: 'prem-period prem-text-muted', text: '/mo' })
        );
        const proDesc = createEl('p', { className: 'prem-desc prem-desc-muted', text: 'Unlimited everything' });
        const proList = createEl('ul', { className: 'prem-list prem-list-pro' });
        proList.append(
            createFeature('Unlimited puzzles', 'fa-solid fa-check', 'prem-list-pro-item'),
            createFeature('Advanced creation tools', 'fa-solid fa-check', 'prem-list-pro-item'),
            createFeature('10x XP boost', 'fa-solid fa-check', 'prem-list-pro-item'),
            createFeature('Ad-free experience', 'fa-solid fa-check', 'prem-list-pro-item')
        );
        const proBtn = createEl('button', { attrs: { id: 'prem-btn-pro', type: 'button' }, className: 'btn premium-btn-full premium-btn-bottom prem-pro-btn', text: 'Get Pro Now' });
        proCard.append(proPrice, proDesc, proList, proBtn);

        const teamCard = createEl('div', { className: 'prem-card' });
        teamCard.append(
            createEl('div', { className: 'prem-card-icon prem-icon-bg-blue' }),
            createEl('h3', { className: 'prem-plan-name', text: 'Team' })
        );
        teamCard.querySelector('.prem-card-icon').appendChild(createEl('i', { className: 'fa-solid fa-users' }));
        const teamPrice = createEl('div', { className: 'prem-price' });
        teamPrice.append(
            createEl('span', { className: 'prem-amount', text: '$29.99' }),
            createEl('span', { className: 'prem-period', text: '/mo' })
        );
        const teamDesc = createEl('p', { className: 'prem-desc', text: 'For groups & classrooms' });
        const teamList = createEl('ul', { className: 'prem-list' });
        teamList.append(
            createFeature('Everything in Pro'),
            createFeature('Team puzzles'),
            createFeature('Private leaderboards'),
            createFeature('Admin dashboard')
        );
        const teamBtn = createEl('button', { attrs: { id: 'prem-btn-team', type: 'button' }, className: 'btn btn-blue premium-btn-full premium-btn-bottom', text: 'Contact Sales' });
        teamCard.append(teamPrice, teamDesc, teamList, teamBtn);

        cards.append(freeCard, proCard, teamCard);

        const faq = createEl('div', { className: 'premium-faq' });
        const faqTitle = createEl('h2', { className: 'premium-faq-title' });
        faqTitle.append(createEl('i', { className: 'fa-solid fa-circle-question' }), document.createTextNode(' Common Questions'));
        const accordion = createEl('div', { className: 'faq-accordion' });
        const makeFaqItem = (q, a) => {
            const item = createEl('div', { className: 'faq-item' });
            const qWrap = createEl('div', { className: 'faq-q' });
            qWrap.append(createEl('span', { text: q }), createEl('i', { className: 'fa-solid fa-chevron-down' }));
            const aWrap = createEl('div', { className: 'faq-a', text: a });
            item.append(qWrap, aWrap);
            item.addEventListener('click', () => item.classList.toggle('open'));
            return item;
        };
        accordion.append(
            makeFaqItem('Can I cancel anytime?', 'Yes! You can cancel your subscription at any time. Your Pro features will remain active until the end of your billing period.'),
            makeFaqItem('Do I keep my progress?', 'Absolutely. Your XP, streak, and all puzzle progress are saved forever regardless of your plan.')
        );
        faq.append(faqTitle, accordion);

        content.append(header, cards, faq);
        modalCard.append(closeBtn, content);
        overlay.replaceChildren(modalCard);
        document.body.appendChild(overlay);
        document.getElementById('close-premium').addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        // Add Listeners
        document.getElementById('prem-btn-free').addEventListener('click', () => {
            window.customAlert('Plan Info', 'You are already enjoying the Free plan features!', 'info');
        });

        document.getElementById('prem-btn-pro').addEventListener('click', () => {
            window.showPaymentModal();
        });

        document.getElementById('prem-btn-team').addEventListener('click', () => {
            window.customAlert('Request Sent', 'Our sales team has been notified. We will contact you via email within 24 hours.', 'success');
        });
    }
    setTimeout(() => overlay.classList.add('active'), 10);
};

window.showPaymentModal = function() {
    let overlay = document.getElementById('payment-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'payment-modal';
        overlay.className = 'modal-overlay payment-overlay';

        const card = createEl('div', { className: 'card animate-slide-up payment-card' });
        const closeBtn = createEl('button', { attrs: { id: 'close-payment', type: 'button' }, className: 'payment-close-btn' });
        closeBtn.appendChild(createEl('i', { className: 'fa-solid fa-xmark' }));

        const header = createEl('div', { className: 'payment-header' });
        const iconWrap = createEl('div', { className: 'payment-icon-wrap' });
        iconWrap.appendChild(createEl('i', { className: 'fa-solid fa-credit-card' }));
        header.append(
            iconWrap,
            createEl('h2', { className: 'payment-title', text: 'Payment Details' }),
            createEl('p', { className: 'payment-subtitle', text: 'Complete your upgrade to CrossQuest Pro' })
        );

        const fields = createEl('div', { className: 'payment-fields' });
        const makeField = (label, placeholder, extraClass = '') => {
            const wrap = createEl('div', { className: extraClass });
            wrap.append(
                createEl('label', { className: 'payment-label', text: label }),
                createEl('input', { className: 'input-field payment-input', attrs: { type: 'text', placeholder } })
            );
            return wrap;
        };

        fields.append(
            makeField('Cardholder Name', 'John Doe'),
            (() => {
                const wrap = createEl('div');
                wrap.appendChild(createEl('label', { className: 'payment-label', text: 'Card Number' }));
                const cardNumWrap = createEl('div', { className: 'payment-card-number-wrap' });
                cardNumWrap.append(
                    createEl('input', { className: 'input-field payment-input payment-input-card-number', attrs: { type: 'text', placeholder: '0000 0000 0000 0000' } }),
                    createEl('i', { className: 'fa-solid fa-credit-card payment-card-number-icon' })
                );
                wrap.appendChild(cardNumWrap);
                return wrap;
            })(),
            (() => {
                const row = createEl('div', { className: 'payment-two-col' });
                row.append(
                    makeField('Expiry Date', 'MM / YY', 'payment-col'),
                    makeField('CVC', '123', 'payment-col')
                );
                return row;
            })()
        );

        const actions = createEl('div', { className: 'payment-actions' });
        const confirmBtn = createEl('button', { attrs: { id: 'confirm-payment', type: 'button' }, className: 'btn btn-green payment-confirm-btn', text: 'PAY $9.99 & START PRO' });
        confirmBtn.prepend(createEl('i', { className: 'fa-solid fa-lock' }), document.createTextNode(' '));
        const backBtn = createEl('button', { attrs: { id: 'back-to-plans', type: 'button' }, className: 'payment-back-btn', text: 'Back to Plans' });
        backBtn.prepend(createEl('i', { className: 'fa-solid fa-arrow-left' }), document.createTextNode(' '));
        actions.append(confirmBtn, backBtn);

        card.append(closeBtn, header, fields, actions);
        overlay.replaceChildren(card);
        document.body.appendChild(overlay);

        document.getElementById('close-payment').addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        document.getElementById('back-to-plans').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                window.showPremiumModal();
            }, 300);
        });

        document.getElementById('confirm-payment').addEventListener('click', () => {
            const btn = document.getElementById('confirm-payment');
            const loadingIcon = document.createElement('i');
            loadingIcon.className = 'fa-solid fa-circle-notch fa-spin';
            btn.replaceChildren(loadingIcon, document.createTextNode(' PROCESSING...'));
            btn.classList.add('is-loading');
            
            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    document.getElementById('premium-modal').classList.remove('active');
                    window.customAlert('Success!', 'Welcome to CrossQuest Pro! Your unlimited access starts now.', 'success');
                }, 300);
            }, 2000);
        });
    }
    setTimeout(() => overlay.classList.add('active'), 10);
};

window.showUpgradeModal = window.showPremiumModal;

document.addEventListener('DOMContentLoaded', () => {
    const upgradeBtn = document.getElementById('btn-upgrade-pro');
    if (upgradeBtn) upgradeBtn.addEventListener('click', () => window.showPremiumModal());

    // Intercept any clicks to premium links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href="premium.html"]');
        if (link) {
            e.preventDefault();
            window.showPremiumModal();
        }
    });
    
    // --- Local Profile System ---
    // Stores and reuses a local-only profile name/avatar style.
    let localProfile = localStorage.getItem('cw_local_profile_name');
    if (!localProfile) {
        localProfile = 'Guest Scholar';
        localStorage.setItem('cw_local_profile_name', localProfile);
    }
    
    // Custom Prompt Modal
    window.customPrompt = function(title, message, defaultValue, onSubmit) {
        let overlay = document.getElementById('custom-prompt-modal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'custom-prompt-modal';
            overlay.className = 'cw-modal-overlay';
            const card = createEl('div', { className: 'cw-dialog-card cw-dialog-card-prompt' });
            const icon = createEl('i', {
                className: 'fa-solid fa-user-pen cw-dialog-icon cw-dialog-icon-info'
            });
            const heading = createEl('h2', {
                attrs: { id: 'cp-title' },
                className: 'cw-dialog-title cw-dialog-title-prompt'
            });
            const body = createEl('p', {
                attrs: { id: 'cp-message' },
                className: 'cw-dialog-message cw-dialog-message-prompt'
            });
            const input = createEl('input', {
                className: 'input-field',
                attrs: { id: 'cp-input', type: 'text' }
            });
            input.classList.add('cw-dialog-input');
            const actions = createEl('div', { className: 'cw-dialog-actions cw-dialog-actions-prompt' });
            const cancel = createEl('button', {
                className: 'btn btn-outline',
                text: 'Cancel',
                attrs: { id: 'cp-btn-cancel' }
            });
            const save = createEl('button', {
                className: 'btn btn-primary',
                text: 'Save Name',
                attrs: { id: 'cp-btn-ok' }
            });
            actions.append(cancel, save);
            card.append(icon, heading, body, input, actions);
            overlay.replaceChildren(card);
            document.body.appendChild(overlay);
        }

        document.getElementById('cp-title').innerText = title;
        document.getElementById('cp-message').innerText = message;
        const input = document.getElementById('cp-input');
        input.value = defaultValue || '';

        overlay.classList.add('is-open');
        setTimeout(() => input.focus(), 100);

        const btnOk = document.getElementById('cp-btn-ok');
        const btnCancel = document.getElementById('cp-btn-cancel');
        const newOk = btnOk.cloneNode(true);
        const newCancel = btnCancel.cloneNode(true);
        btnOk.replaceWith(newOk);
        btnCancel.replaceWith(newCancel);

        const close = () => { overlay.classList.remove('is-open'); };

        newOk.addEventListener('click', () => {
            const val = input.value.trim();
            close();
            if (onSubmit) onSubmit(val);
        });
        newCancel.addEventListener('click', close);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') newOk.click();
            if (e.key === 'Escape') close();
        });
    };

    function getAvatarClass(name) {
        const classes = [
            'avatar-grad-green',
            'avatar-grad-blue',
            'avatar-grad-orange',
            'avatar-grad-red',
            'avatar-grad-purple',
            'avatar-grad-gold'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return classes[Math.abs(hash) % classes.length];
    }

    document.querySelectorAll('.user-profile').forEach(el => {
        const nameSpan = el.querySelector('.username');
        const avatarSpan = el.querySelector('.avatar');
        if (nameSpan) nameSpan.innerText = localProfile;
        if (avatarSpan) {
            avatarSpan.innerText = localProfile.charAt(0).toUpperCase();
            avatarSpan.classList.remove('avatar-grad-green', 'avatar-grad-blue', 'avatar-grad-orange', 'avatar-grad-red', 'avatar-grad-purple', 'avatar-grad-gold');
            avatarSpan.classList.add(getAvatarClass(localProfile));
        }
        
        el.classList.add('is-clickable');
        el.title = 'Click to edit your Scholar Name';
        el.addEventListener('click', () => {
            window.customPrompt(
                'Change Scholar Name',
                'Enter your new identity (minimum 3 characters):',
                localProfile,
                (newName) => {
                    if (newName && newName.length >= 3) {
                        localStorage.setItem('cw_local_profile_name', newName);
                        window.location.reload();
                    } else if (newName !== null && newName.length > 0) {
                        window.customAlert('Invalid Name', 'Name must be at least 3 characters.', 'warning');
                    }
                }
            );
        });
    });

});

// --- Crossword Logic ---
// Core puzzle load/render pipeline for board + clues.

function loadPuzzle(puzzleInfo) {
    currentPuzzle = puzzleInfo;

    // Theme hook for the Game page (used by game.css)
    try {
        const targetId = localStorage.getItem('cw_play_target') || '';
        const title = String(puzzleInfo?.title || '');
        const id = String(puzzleInfo?.id || '');

        const isF1 =
            targetId === 'f1' ||
            id === 'f1' ||
            /\bformula\s*1\b|\bgrand\s*prix\b|\bf1\b/i.test(title);

        const isTech =
            targetId === 'tech' ||
            id === 'tech' ||
            /\btech\b|\bcode\b/i.test(title);

        const theme = isF1 ? 'f1' : (isTech ? 'tech' : '');

        if (document?.body) {
            if (theme) document.body.dataset.gameTheme = theme;
            else document.body.removeAttribute('data-game-theme');
        }
    } catch (e) {
        // no-op: theme is decorative
    }
    
    // Check if on play page
    const titleDisp = document.getElementById('puzzle-title-display');
    const diffDisp = document.getElementById('puzzle-difficulty-display');
    if (titleDisp && diffDisp) {
        titleDisp.innerText = puzzleInfo.title;
        diffDisp.innerText = puzzleInfo.difficulty;

        // Keep the base pill style and only toggle modifiers
        diffDisp.classList.add('difficulty-tag');
        diffDisp.classList.remove('tag-hard', 'tag-med');
        if (puzzleInfo.difficulty === 'Hard') diffDisp.classList.add('tag-hard');
        else if (puzzleInfo.difficulty === 'Medium') diffDisp.classList.add('tag-med');
    }
    
    // Build a blank grid model first, then map each word into it.
    // `answerChar === null` means blocked/black cell.
    gridModel = [];
    for (let r = 0; r < puzzleInfo.size; r++) {
        let row = [];
        for (let c = 0; c < puzzleInfo.size; c++) {
            row.push({ answerChar: null, number: null, userInput: '' });
        }
        gridModel.push(row);
    }

    // Populate grid model from words
    if (puzzleInfo.words && Array.isArray(puzzleInfo.words)) {
        puzzleInfo.words.forEach(word => {
        let r = word.row;
        let c = word.col;
        
        // Ensure starting cell has number
        gridModel[r][c].number = word.number;

        for (let i = 0; i < word.answer.length; i++) {
            gridModel[r][c].answerChar = word.answer[i];
            
            if (word.dir === "across") c++;
            else if (word.dir === "down") r++;
        }
    });
    }

    renderGrid(puzzleInfo.size);
    renderClues(puzzleInfo.words);
    
    const scoreDisp = document.getElementById('score');
    if (scoreDisp) scoreDisp.innerText = '0';
    
    resetTimer();
}

function renderGrid(size) {
    size = parseInt(size, 10);
    const board = document.getElementById('crossword-board');
    board.replaceChildren();
    board.style.setProperty('--cw-grid-size', String(size));
    applyGridSizeClass(board, 'cw-grid-size', size);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cellData = gridModel[r][c];
            
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cw-cell');
            
            if (cellData.answerChar === null) {
                cellDiv.classList.add('black-cell');
            } else {
                // Create input
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = r;
                input.dataset.col = c;
                
                input.addEventListener('input', handleCellInput);
                input.addEventListener('keydown', handleCellKeydown);
                input.addEventListener('focus', handleCellFocus);
                
                cellDiv.appendChild(input);

                // Add number if exists
                if (cellData.number) {
                    const numSpan = document.createElement('span');
                    numSpan.classList.add('cell-number');
                    numSpan.innerText = cellData.number;
                    cellDiv.appendChild(numSpan);
                }
            }
            board.appendChild(cellDiv);
        }
    }
}

function renderClues(words) {
    const acrossList = document.getElementById('clues-across');
    const downList = document.getElementById('clues-down');
    acrossList.replaceChildren();
    downList.replaceChildren();

    words.forEach(word => {
        const li = document.createElement('li');
        const num = document.createElement('strong');
        num.textContent = `${word.number}.`;
        li.append(num, document.createTextNode(` ${word.clue}`));
        li.dataset.wordId = word.answer;
        li.dataset.row = word.row;
        li.dataset.col = word.col;
        li.dataset.dir = word.dir;

        li.addEventListener('click', () => {
            // Focus the first input of this word
            const inputs = document.querySelectorAll(`input[data-row="${word.row}"][data-col="${word.col}"]`);
            if (inputs.length > 0) {
                inputs[0].focus();
            }
        });

        if (word.dir === "across") {
            acrossList.appendChild(li);
        } else {
            downList.appendChild(li);
        }
    });
}

// --- Interaction Logic ---
// Cell input, keyboard navigation, and cursor movement rules.

let currentDirection = 'across'; // Which way does typing advance?

function handleCellFocus(e) {
    const input = e.target;
    // Optional: highlight associated clue or word cells
}

function handleCellInput(e) {
    const input = e.target;
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    
    // Source of truth is the model; UI input mirrors it.
    gridModel[r][c].userInput = input.value.toUpperCase();
    input.value = input.value.toUpperCase();

    // Start timer on first interaction
    if (!isTimerRunning && input.value !== '') {
        startTimer();
    }

    if (input.value !== '') {
        input.classList.remove('error');
        // Duolingo-style tile placement bounce
        const cellDiv = input.closest('.cw-cell');
        if (cellDiv) {
            cellDiv.classList.remove('tile-placed');
            void cellDiv.offsetWidth; // trigger reflow
            cellDiv.classList.add('tile-placed');
        }
        advanceCursor(r, c, 1);
    }
}

function handleCellKeydown(e) {
    const input = e.target;
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);

    if (e.key === 'Backspace') {
        if (input.value === '') {
            // Move back and delete
            e.preventDefault();
            const prevInput = advanceCursor(r, c, -1);
            if (prevInput) {
                prevInput.value = '';
                gridModel[parseInt(prevInput.dataset.row)][parseInt(prevInput.dataset.col)].userInput = '';
            }
        } else {
            // Delete current
            gridModel[r][c].userInput = '';
        }
    } else if (e.key === 'ArrowRight') {
        currentDirection = 'across';
        advanceCursor(r, c, 1, 'across');
    } else if (e.key === 'ArrowLeft') {
        currentDirection = 'across';
        advanceCursor(r, c, -1, 'across');
    } else if (e.key === 'ArrowDown') {
        currentDirection = 'down';
        advanceCursor(r, c, 1, 'down');
    } else if (e.key === 'ArrowUp') {
        currentDirection = 'down';
        advanceCursor(r, c, -1, 'down');
    }
}

function advanceCursor(r, c, step, forceDirection = null) {
    let dir = forceDirection || currentDirection;
    let nextR = r;
    let nextC = c;
    
    // Attempt up to currentPuzzle.size jumps to find next valid cell
    // to skip over black cells properly when arrow-keying.
    const maxJumps = currentPuzzle.size;
    
    for (let jump = 0; jump < maxJumps; jump++) {
        if (dir === 'across') {
            nextC += step;
        } else {
            nextR += step;
        }
        
        // Out of bounds check
        if (nextR < 0 || nextR >= currentPuzzle.size || nextC < 0 || nextC >= currentPuzzle.size) {
            return null;
        }

        const nextInput = document.querySelector(`input[data-row="${nextR}"][data-col="${nextC}"]`);
        if (nextInput) {
            nextInput.focus();
            return nextInput;
        }
        // If no input, it's a black cell. Loop continues to next jump.
    }
    
    return null;
}

// --- Validation ---
// Answer checking, score calculation, and win-state side effects.

function checkAnswers() {
    let allCorrect = true;
    let filledCount = 0;
    let totalChars = 0;

    for (let r = 0; r < currentPuzzle.size; r++) {
        for (let c = 0; c < currentPuzzle.size; c++) {
            const cell = gridModel[r][c];
            // Only validate cells that are part of an actual word (have an answerChar)
            // Skip orphaned white cells that might exist from legacy custom saves
            if (cell.answerChar !== null) {
                totalChars++;
                const input = document.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
                if (input && cell.userInput !== '') {
                    filledCount++;
                    const cellDiv = input.closest('.cw-cell');
                    if (cell.userInput === cell.answerChar) {
                        input.classList.remove('input-error');
                        input.classList.add('input-success');
                        input.classList.remove('error-pulse');
                        if (cellDiv) { cellDiv.classList.remove('incorrect'); cellDiv.classList.add('correct'); }
                    } else {
                        input.classList.remove('input-success');
                        input.classList.add('input-error');
                        input.classList.add('error-pulse');
                        if (cellDiv) { cellDiv.classList.remove('correct'); cellDiv.classList.add('incorrect'); }
                        allCorrect = false;
                    }
                } else if (input) {
                    allCorrect = false;
                }
            }
        }
    }

    // Score rewards completion speed and coverage (faster + more filled = higher score).
    if (totalChars > 0) {
        currentScore = Math.floor((filledCount / totalChars) * 1000) - (secondsElapsed * 2);
    }
    if (currentScore < 0) currentScore = 0;
    
    const scoreDisp = document.getElementById('score');
    if(scoreDisp) scoreDisp.innerText = currentScore;

    // Immediately trigger win condition, even if empty or incorrect, as requested
    handleWin(filledCount, totalChars);
}

function handleWin(filledCount = 0, totalChars = 0) {
    stopTimer();
    
    // Play subtle animation on board
    document.querySelectorAll('.cw-cell input').forEach(inp => {
        inp.classList.add('win-pulse');
    });

    // Populate modal stats text based on completion
    const finalScoreEl = document.getElementById('final-score');
    const finalTimeEl = document.getElementById('final-time');
    const titleEl = document.querySelector('#success-modal h2');
    const subtitleEl = document.querySelector('#success-modal p');
    
    if (finalScoreEl) finalScoreEl.innerText = currentScore;
    if (finalTimeEl) finalTimeEl.innerText = formatTime(secondsElapsed);
    
    if (titleEl && subtitleEl) {
        if (filledCount === totalChars && currentScore > 0) {
            titleEl.innerText = 'Magnificent!';
            subtitleEl.innerText = 'You have conquered the grid with scholarly precision.';
        } else {
            titleEl.innerText = 'Board Submitted';
            subtitleEl.innerText = `You filled in ${filledCount} out of ${totalChars} letters.`;
        }
    }

    // Save to Leaderboard using LocalName
    let localProfile = localStorage.getItem('cw_local_profile_name') || "Guest Scholar";
    // Persist attempt so Leaderboard page can render without a backend.
    saveScoreToLeaderboard(localProfile, currentPuzzle.difficulty || 'Custom', secondsElapsed, currentScore);

    // Award XP (Duolingo-style)
    const xp = parseInt(localStorage.getItem('cw_total_xp') || '0');
    const xpGain = filledCount === totalChars ? 20 : 10;
    localStorage.setItem('cw_total_xp', xp + xpGain);
    const dxp = parseInt(localStorage.getItem('cw_daily_xp') || '0');
    localStorage.setItem('cw_daily_xp', dxp + xpGain);
    const dp = parseInt(localStorage.getItem('cw_daily_puzzles') || '0');
    localStorage.setItem('cw_daily_puzzles', dp + 1);
    // Update streak
    localStorage.setItem('cw_last_active_day', new Date().toDateString());

    // Show XP toast
    const toast = document.getElementById('xp-toast');
    if (toast) {
      toast.textContent = `+${xpGain} XP`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // Show Success Modal & launch confetti
    document.getElementById('success-modal').classList.add('active');
    launchConfetti();

    // Close button targets leaderboard URL
    document.getElementById('btn-close-modal').onclick = () => {
        document.getElementById('success-modal').classList.remove('active');
        window.location.href = 'leaderboard.html';
    };
}

// --- Timer ---
// Simple elapsed-time stopwatch tied to first user input.

function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    
    const timerDisp = document.getElementById('timer');
    if (!timerDisp) return;
    
    timerInterval = setInterval(() => {
        secondsElapsed++;
        if (timerDisp) timerDisp.innerText = formatTime(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
}

function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    
    const timerDisp = document.getElementById('timer');
    const scoreDisp = document.getElementById('score');
    
    if (timerDisp) timerDisp.innerText = '00:00';
    if (scoreDisp) scoreDisp.innerText = '0';
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// --- Leaderboard Logic (LocalStorage) ---
// Persistence helpers for reading/writing leaderboard entries.

function getLeaderboardData() {
    const raw = localStorage.getItem('cw_leaderboard');
    if (raw) return JSON.parse(raw);
    // Seed data shown for first-time users when no local scores exist yet.
    return [
        { name: "WordMaster99", diff: "Hard", time: 135, score: 9800 },
        { name: "LexiconLover", diff: "Hard", time: 165, score: 9550 },
        { name: "PuzzlePro", diff: "Moderate", time: 110, score: 9200 }
    ];
}

function saveScoreToLeaderboard(name, diff, timeSecs, score) {
    const data = getLeaderboardData();
    data.push({ name, diff, time: timeSecs, score });
    // Sort by score descending
    data.sort((a, b) => b.score - a.score);
    localStorage.setItem('cw_leaderboard', JSON.stringify(data));
}
