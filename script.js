/*
    File guide: Main application script.
    - Handles shared UI interactions (mobile sidebar, modals, notifications).
    - Contains puzzle data models and gameplay flow for play/create/game screens.
    - Updates progress, XP, streaks, and localStorage-backed state.
*/
// --- Mobile Navigation Toggle ---
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.toggle('mobile-expanded');
        });
    }
});

// --- Confetti Burst ---
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

// --- Data Structures ---

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
let currentPuzzle = null;
let gridModel = []; // 2D array representation
let timerInterval = null;
let secondsElapsed = 0;
let isTimerRunning = false;
let currentScore = 0;

// --- Initialization ---
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
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(42, 27, 24, 0.4)';
        overlay.style.backdropFilter = 'blur(12px)';
        overlay.style.display = 'none';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '10000';
        overlay.innerHTML = `
            <div style="background: var(--bg-surface); padding: 40px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); max-width: 400px; width: 90%; text-align: center; box-shadow: var(--shadow-elevated);">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--accent-gold, #f59e0b); margin-bottom: 24px; filter: drop-shadow(0 4px 8px rgba(244, 162, 97, 0.3));"></i>
                <h2 id="cc-title" style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.8rem; color: var(--text-primary); margin-bottom: 12px;"></h2>
                <p id="cc-message" style="color: var(--text-secondary); margin-bottom: 32px; font-size: 1.05rem; line-height: 1.6;"></p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <button class="btn btn-outline" id="cc-btn-cancel" style="width: 100%;">Cancel</button>
                    <button class="btn btn-primary" id="cc-btn-confirm" style="width: 100%;">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    document.getElementById('cc-title').innerText = title;
    document.getElementById('cc-message').innerText = message;
    
    overlay.style.display = 'flex';
    
    const btnCancel = document.getElementById('cc-btn-cancel');
    const btnConfirm = document.getElementById('cc-btn-confirm');
    
    const newCancel = btnCancel.cloneNode(true);
    const newConfirm = btnConfirm.cloneNode(true);
    btnCancel.parentNode.replaceChild(newCancel, btnCancel);
    btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);
    
    newCancel.addEventListener('click', () => overlay.style.display = 'none');
    newConfirm.addEventListener('click', () => {
        overlay.style.display = 'none';
        if (onConfirm) onConfirm();
    });
};

window.customAlert = function(title, message, type = 'info') {
    let overlay = document.getElementById('custom-alert-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-alert-modal';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(42, 27, 24, 0.4)';
        overlay.style.backdropFilter = 'blur(12px)';
        overlay.style.display = 'none';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '10000';
        overlay.innerHTML = `
            <div style="background: var(--bg-surface); padding: 40px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); max-width: 400px; width: 90%; text-align: center; box-shadow: var(--shadow-elevated);">
                <i id="ca-icon" class="fa-solid fa-circle-info" style="font-size: 3rem; margin-bottom: 24px;"></i>
                <h2 id="ca-title" style="font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px;"></h2>
                <p id="ca-message" style="color: var(--text-secondary); margin-bottom: 32px; font-size: 1.05rem; line-height: 1.6;"></p>
                <button class="btn btn-primary" id="ca-btn-ok" style="width: 100%;">OK</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    document.getElementById('ca-title').innerText = title;
    document.getElementById('ca-message').innerText = message;
    
    const icon = document.getElementById('ca-icon');
    if (type === 'error') {
        icon.className = 'fa-solid fa-circle-xmark';
        icon.style.color = 'var(--error)';
        icon.style.filter = 'drop-shadow(0 4px 8px rgba(224, 122, 95, 0.3))';
    } else if (type === 'success') {
        icon.className = 'fa-solid fa-circle-check';
        icon.style.color = 'var(--success)';
        icon.style.filter = 'drop-shadow(0 4px 8px rgba(129, 178, 154, 0.3))';
    } else if (type === 'warning') {
        icon.className = 'fa-solid fa-triangle-exclamation';
        icon.style.color = 'var(--accent-gold)';
        icon.style.filter = 'drop-shadow(0 4px 8px rgba(244, 162, 97, 0.3))';
    } else {
        icon.className = 'fa-solid fa-circle-info';
        icon.style.color = 'var(--accent-primary)';
        icon.style.filter = 'drop-shadow(0 4px 8px rgba(224, 122, 95, 0.3))';
    }
    
    overlay.style.display = 'flex';
    
    const btnOk = document.getElementById('ca-btn-ok');
    const newOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newOk, btnOk);
    
    newOk.addEventListener('click', () => overlay.style.display = 'none');
};

window.showPremiumModal = function() {
    let overlay = document.getElementById('premium-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'premium-modal';
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);backdrop-filter:blur(8px);display:none;align-items:flex-start;justify-content:center;z-index:10000;overflow-y:auto;padding:40px 20px;';
        
        overlay.innerHTML = `
            <div class="card prem-modal-card animate-slide-up" style="max-width: 900px; width: 100%; position: relative; padding: 0; background: var(--bg-page); margin-bottom: 40px;">
                <button id="close-premium" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem; color: var(--text-tertiary); cursor: pointer; z-index: 10;"><i class="fa-solid fa-xmark"></i></button>
                
                <div style="padding: 40px;">
                    <div class="prem-header" style="text-align: center; margin-bottom: 32px; border-bottom: 2px solid var(--border-color); padding-bottom: 20px;">
                        <h1 style="font-size: 2.2rem; font-weight: 900; color: var(--text-primary);"><i class="fa-solid fa-crown" style="color: #FFC800; margin-right: 12px;"></i> Go Premium</h1>
                        <p style="color: var(--text-secondary); font-weight: 600;">Choose the perfect plan for your crossword journey</p>
                    </div>

                    <div class="prem-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; align-items: stretch; margin-bottom: 40px;">
                        <!-- Free -->
                        <div class="prem-card">
                            <div class="prem-card-icon prem-icon-bg-gray"><i class="fa-solid fa-seedling"></i></div>
                            <h3 class="prem-plan-name">Free</h3>
                            <div class="prem-price"><span class="prem-amount">$0</span></div>
                            <p class="prem-desc">Get started for free</p>
                            <ul class="prem-list">
                                <li><i class="fa-solid fa-check"></i> 5 puzzles per day</li>
                                <li><i class="fa-solid fa-check"></i> Standard leaderboard</li>
                                <li><i class="fa-solid fa-check"></i> Basic creation tools</li>
                                <li><i class="fa-solid fa-check"></i> Community forum</li>
                            </ul>
                            <button id="prem-btn-free" class="btn btn-outline w-100" style="margin-top: auto;">Current Plan</button>
                        </div>

                        <!-- Pro -->
                        <div class="prem-card prem-card-pro" style="transform: scale(1.05); z-index: 2; box-shadow: 0 20px 50px rgba(45, 94, 69, 0.3);">
                            <div class="prem-popular-tag">⭐ MOST POPULAR</div>
                            <div class="prem-card-icon prem-icon-bg-white"><i class="fa-solid fa-crown"></i></div>
                            <h3 class="prem-plan-name prem-text-white">Pro</h3>
                            <div class="prem-price"><span class="prem-amount prem-text-white">$9.99</span><span class="prem-period prem-text-muted">/mo</span></div>
                            <p class="prem-desc prem-desc-muted">Unlimited everything</p>
                            <ul class="prem-list">
                                <li style="color: white;"><i class="fa-solid fa-check" style="color: #A0E870;"></i> <strong>Unlimited</strong> puzzles</li>
                                <li style="color: white;"><i class="fa-solid fa-check" style="color: #A0E870;"></i> Advanced creation tools</li>
                                <li style="color: white;"><i class="fa-solid fa-check" style="color: #A0E870;"></i> <strong>10x</strong> XP boost</li>
                                <li style="color: white;"><i class="fa-solid fa-check" style="color: #A0E870;"></i> Ad-free experience</li>
                            </ul>
                            <button id="prem-btn-pro" class="btn w-100 btn-lg prem-pro-btn" style="background:#fff; color:var(--green); margin-top: auto;">Get Pro Now</button>
                        </div>

                        <!-- Team -->
                        <div class="prem-card">
                            <div class="prem-card-icon prem-icon-bg-blue" style="background: #E0F2FE; color: #1CB0F6;"><i class="fa-solid fa-users"></i></div>
                            <h3 class="prem-plan-name">Team</h3>
                            <div class="prem-price"><span class="prem-amount">$29.99</span><span class="prem-period">/mo</span></div>
                            <p class="prem-desc">For groups & classrooms</p>
                            <ul class="prem-list">
                                <li><i class="fa-solid fa-check"></i> Everything in Pro</li>
                                <li><i class="fa-solid fa-check"></i> Team puzzles</li>
                                <li><i class="fa-solid fa-check"></i> Private leaderboards</li>
                                <li><i class="fa-solid fa-check"></i> Admin dashboard</li>
                            </ul>
                            <button id="prem-btn-team" class="btn btn-blue w-100" style="margin-top: auto;">Contact Sales</button>
                        </div>
                    </div>

                    <!-- FAQ -->
                    <div class="premium-faq">
                        <h2 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-circle-question" style="color: #1CB0F6;"></i> Common Questions</h2>
                        <div class="faq-accordion">
                            <div class="faq-item" onclick="this.classList.toggle('open')">
                                <div class="faq-q"><span>Can I cancel anytime?</span><i class="fa-solid fa-chevron-down"></i></div>
                                <div class="faq-a">Yes! You can cancel your subscription at any time. Your Pro features will remain active until the end of your billing period.</div>
                            </div>
                            <div class="faq-item" onclick="this.classList.toggle('open')">
                                <div class="faq-q"><span>Do I keep my progress?</span><i class="fa-solid fa-chevron-down"></i></div>
                                <div class="faq-a">Absolutely. Your XP, streak, and all puzzle progress are saved forever regardless of your plan.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('close-premium').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 300);
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
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('active'), 10);
};

window.showPaymentModal = function() {
    let overlay = document.getElementById('payment-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'payment-modal';
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;z-index:20000;padding:20px;';
        
        overlay.innerHTML = `
            <div class="card animate-slide-up" style="max-width: 480px; width: 100%; padding: 40px; background: #FFFDF9; border-radius: 28px; border: 3px solid #D6CCBA; border-bottom: 8px solid #1B3A2D; position: relative;">
                <button id="close-payment" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem; color: #7A9486; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="width: 60px; height: 60px; background: rgba(160, 232, 112, 0.15); color: #2D5E45; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 16px;">
                        <i class="fa-solid fa-credit-card"></i>
                    </div>
                    <h2 style="font-size: 1.8rem; font-weight: 900; color: #1B3A2D; margin-bottom: 8px;">Payment Details</h2>
                    <p style="color: #3E5E4E; font-weight: 600; font-size: 0.95rem;">Complete your upgrade to CrossQuest Pro</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 32px;">
                    <div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #7A9486; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; margin-left: 4px;">Cardholder Name</label>
                        <input type="text" placeholder="John Doe" class="input-field" style="background: #FFF; border-color: #D6CCBA; font-weight: 700;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #7A9486; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; margin-left: 4px;">Card Number</label>
                        <div style="position: relative;">
                            <input type="text" placeholder="0000 0000 0000 0000" class="input-field" style="background: #FFF; border-color: #D6CCBA; font-weight: 700; padding-left: 45px;">
                            <i class="fa-solid fa-credit-card" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #D6CCBA;"></i>
                        </div>
                    </div>
                    <div style="display: flex; gap: 16px;">
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #7A9486; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; margin-left: 4px;">Expiry Date</label>
                            <input type="text" placeholder="MM / YY" class="input-field" style="background: #FFF; border-color: #D6CCBA; font-weight: 700; text-align: center;">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #7A9486; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; margin-left: 4px;">CVC</label>
                            <input type="text" placeholder="123" class="input-field" style="background: #FFF; border-color: #D6CCBA; font-weight: 700; text-align: center;">
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button id="confirm-payment" class="btn btn-green btn-lg" style="width: 100%; border-bottom-width: 6px;">
                        <i class="fa-solid fa-lock"></i> PAY $9.99 & START PRO
                    </button>
                    <button id="back-to-plans" style="background: none; border: none; color: #7A9486; font-weight: 800; font-size: 0.85rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px;">
                        <i class="fa-solid fa-arrow-left"></i> Back to Plans
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('close-payment').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 300);
        });

        document.getElementById('back-to-plans').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
                window.showPremiumModal();
            }, 300);
        });

        document.getElementById('confirm-payment').addEventListener('click', () => {
            const btn = document.getElementById('confirm-payment');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> PROCESSING...';
            btn.style.opacity = '0.8';
            btn.style.pointerEvents = 'none';
            
            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    document.getElementById('premium-modal').classList.remove('active');
                    setTimeout(() => document.getElementById('premium-modal').style.display = 'none', 300);
                    window.customAlert('Success!', 'Welcome to CrossQuest Pro! Your unlimited access starts now.', 'success');
                }, 300);
            }, 2000);
        });
    }
    overlay.style.display = 'flex';
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
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(42,27,24,0.4);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;z-index:9999;';
            overlay.innerHTML = `
                <div style="background: var(--bg-surface); padding: 40px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); max-width: 420px; width: 90%; text-align: center; box-shadow: var(--shadow-elevated); animation: fadeIn 0.3s ease-out;">
                    <i class="fa-solid fa-user-pen" style="font-size: 3rem; margin-bottom: 24px; color: var(--accent-primary); filter: drop-shadow(0 4px 8px rgba(240,113,103,0.3));"></i>
                    <h2 id="cp-title" style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.8rem; color: var(--text-primary); margin-bottom: 8px;"></h2>
                    <p id="cp-message" style="color: var(--text-secondary); margin-bottom: 24px; font-size: 1rem; line-height: 1.5;"></p>
                    <input type="text" id="cp-input" class="input-field" style="width: 100%; margin-bottom: 24px; font-size: 1.1rem; padding: 12px 16px; text-align: center; font-weight: 600; border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-outline" id="cp-btn-cancel" style="flex: 1;">Cancel</button>
                        <button class="btn btn-primary" id="cp-btn-ok" style="flex: 1;">Save Name</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        document.getElementById('cp-title').innerText = title;
        document.getElementById('cp-message').innerText = message;
        const input = document.getElementById('cp-input');
        input.value = defaultValue || '';

        overlay.style.display = 'flex';
        setTimeout(() => input.focus(), 100);

        const btnOk = document.getElementById('cp-btn-ok');
        const btnCancel = document.getElementById('cp-btn-cancel');
        const newOk = btnOk.cloneNode(true);
        const newCancel = btnCancel.cloneNode(true);
        btnOk.replaceWith(newOk);
        btnCancel.replaceWith(newCancel);

        const close = () => { overlay.style.display = 'none'; };

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

    function getAvatarColor(name) {
        const colors = [
            'linear-gradient(135deg, #58CC02, #46A302)', // Green
            'linear-gradient(135deg, #1CB0F6, #1899D6)', // Blue
            'linear-gradient(135deg, #FF9600, #E08600)', // Orange
            'linear-gradient(135deg, #FF4B4B, #EA2B2B)', // Red
            'linear-gradient(135deg, #CE82FF, #B366E2)', // Purple
            'linear-gradient(135deg, #FFC800, #D4B200)'  // Gold
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    document.querySelectorAll('.user-profile').forEach(el => {
        const nameSpan = el.querySelector('.username');
        const avatarSpan = el.querySelector('.avatar');
        if (nameSpan) nameSpan.innerText = localProfile;
        if (avatarSpan) {
            avatarSpan.innerText = localProfile.charAt(0).toUpperCase();
            avatarSpan.style.background = getAvatarColor(localProfile);
        }
        
        el.style.cursor = 'pointer';
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

    // --- Home Page ---
    const btnStartDaily = document.getElementById('btn-start-daily');
    if (btnStartDaily) {
        btnStartDaily.addEventListener('click', (e) => {
            localStorage.setItem('cw_play_target', 'daily-1');
            window.location.href = 'game.html';
        });
    }

    document.querySelectorAll('.card-pro, .bento-mini.bento-scramble, .bento-mini.bento-match, .bento-puzzle-item.locked').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            window.showPremiumModal();
        });
    });

    // --- Library Page Launch Logic ---
    document.querySelectorAll('.challenge-card:not(.card-pro)').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const topicId = card.getAttribute('data-play-id');
            if (topicId && window.playBuiltIn) {
                window.playBuiltIn(topicId);
            }
        });
    });

    const customList = document.getElementById('custom-puzzle-list');
    if (customList) {
        const createCardHTML = `
            <div class="creator-card create-new">
               <div class="cc-icon">+</div>
               <div class="cc-info">
                 <h4>Create New</h4>
                 <p>Design your own challenge</p>
               </div>
            </div>
        `;

        let savedPuzzles = JSON.parse(localStorage.getItem('cw_custom_puzzles') || '[]');
        
        let cardsHTML = '';
        savedPuzzles.forEach(puzzle => {
            let dateStr = "Unknown Date";
            if (puzzle.createdAt) {
                const d = new Date(puzzle.createdAt);
                dateStr = d.toLocaleDateString();
            }
            
            cardsHTML += `
            <div class="creator-card">
               <div class="cc-badge">${puzzle.size}x</div>
               <div class="cc-info">
                 <h4>${puzzle.title}</h4>
                 <div class="cc-meta">
                     <span><i class="fa-solid fa-user" style="font-size: 0.7rem; margin-right: 4px;"></i> Created by You</span>
                     <span>${dateStr}</span>
                 </div>
                 <div class="cc-actions">
                     <button class="btn-cs-del" data-id="${puzzle.id}"><i class="fa-solid fa-trash"></i> Discard</button>
                     <i class="fa-regular fa-clock" style="color: #64748B; font-size: 0.9rem;"></i>
                 </div>
                 <div style="font-size: 0.8rem; color: #64748B; margin-top: 4px; font-weight: 600;">Custom</div>
               </div>
               <button class="btn-cs-play" data-id="${puzzle.id}"><i class="fa-solid fa-play"></i></button>
            </div>
            `;
        });
        
        customList.innerHTML = createCardHTML + cardsHTML;
        
        customList.addEventListener('click', (e) => {
            if (e.target.closest('.create-new')) {
                window.location.href = 'create.html';
                return;
            }
            const delBtn = e.target.closest('.btn-cs-del');
            if (delBtn) {
                const id = delBtn.dataset.id;
                window.deleteCustomPuzzle(id);
                return;
            }
            const playBtn = e.target.closest('.btn-cs-play');
            if (playBtn) {
                const id = playBtn.dataset.id;
                localStorage.setItem('cw_play_target', id);
                window.location.href = 'game.html';
                return;
            }
        });
    }

    // --- Game Page ---
    const btnCheck = document.getElementById('btn-check');
    if (btnCheck) {
        btnCheck.addEventListener('click', checkAnswers);
        
        document.getElementById('btn-reset').addEventListener('click', () => {
            window.customConfirm('Reset Puzzle', 'Are you sure you want to clear the grid?', () => {
                loadPuzzle(currentPuzzle);
                resetTimer();
            });
        });
        
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
                                    input.style.color = 'var(--success)';
                                }
                            }
                        }
                    }
                    stopTimer();
                });
            });
        }

        // Load puzzle data dynamically
        let targetId = localStorage.getItem('cw_play_target') || 'daily-1';
        let puzzleToLoad = builtinTopics[targetId] || defaultPuzzleData;
        
        if (!builtinTopics[targetId] && targetId !== 'daily-1') {
             const customPuzzles = JSON.parse(localStorage.getItem('cw_custom_puzzles') || '[]');
             const found = customPuzzles.find(p => p.id === targetId);
             if (found) puzzleToLoad = found;
        }

        // Apply decorative theme as early as possible on the Game page
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
    

    
    // --- Create Page ---
    const btnGenerateGrid = document.getElementById('btn-generate-grid');
    if (btnGenerateGrid) {
        let creatorGrid = [];
        let creatorWords = [];
        let creatorClues = {};
        let currentTool = 'select';

        // Size pill buttons
        document.querySelectorAll('.size-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
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
        
        if (btnSelect) btnSelect.addEventListener('click', (e) => {
            currentTool = 'select';
            e.currentTarget.classList.add('active');
            if(btnBlock) btnBlock.classList.remove('active');
        });
        
        if (btnBlock) btnBlock.addEventListener('click', (e) => {
            currentTool = 'block';
            e.currentTarget.classList.add('active');
            if(btnSelect) btnSelect.classList.remove('active');
        });
        
        if (btnFillBlack) btnFillBlack.addEventListener('click', () => {
            const size = parseInt(document.getElementById('create-size').value);
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
                                input.style.display = 'none';
                            }
                        }
                    }
                }
            }
            refreshCreatorClues(size);
        });

        function refreshCreatorClues(size) {
            let wordNumber = 1;
            let detectedWords = [];
            
            document.querySelectorAll('#creator-board .cw-number').forEach(el => el.remove());

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (creatorGrid[r][c].isBlack) continue;
                    
                    let needsNumber = false;
                    
                    const canAcross = (c === 0 || creatorGrid[r][c-1].isBlack);
                    const validAcrossEnd = (c+1 < size && !creatorGrid[r][c+1].isBlack);
                    if (canAcross && validAcrossEnd) {
                        let ans = '';
                        let tempC = c;
                        while(tempC < size && !creatorGrid[r][tempC].isBlack) {
                            ans += creatorGrid[r][tempC].char || '?';
                            tempC++;
                        }
                        detectedWords.push({ number: wordNumber, dir: 'across', answer: ans, row: r, col: c });
                        needsNumber = true;
                    }
                    
                    const canDown = (r === 0 || creatorGrid[r-1][c].isBlack);
                    const validDownEnd = (r+1 < size && !creatorGrid[r+1][c].isBlack);
                    if (canDown && validDownEnd) {
                        let ans = '';
                        let tempR = r;
                        while(tempR < size && !creatorGrid[tempR][c].isBlack) {
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
                            numSpan.style.position = 'absolute';
                            numSpan.style.top = '2px';
                            numSpan.style.left = '4px';
                            numSpan.style.fontSize = '0.7rem';
                            numSpan.style.color = 'var(--text-secondary)';
                            numSpan.innerText = wordNumber;
                            cell.appendChild(numSpan);
                        }
                        wordNumber++;
                    }
                }
            }
            
            creatorWords = detectedWords;
            const container = document.getElementById('creator-clues-container');
            if(!container) return;
            container.innerHTML = '';
            
            if (creatorWords.length === 0) {
                container.innerHTML = '<div class="empty-clues-state">Add white cells and letters to detect words.</div>';
                return;
            }

            const acrossWords = creatorWords.filter(w => w.dir === 'across');
            const downWords = creatorWords.filter(w => w.dir === 'down');

            let html = `
                <div class="clues-section">
                    <div class="clue-group">
                        <h4 class="clues-column-header">
                            <span><i class="fa-solid fa-arrows-left-right"></i> Across</span>
                            <span class="clue-count-badge" id="across-count">${acrossWords.length}</span>
                        </h4>
                        <div id="clues-across-list" class="clue-list-h"></div>
                    </div>
                    <div class="clue-group">
                        <h4 class="clues-column-header">
                            <span><i class="fa-solid fa-arrows-up-down"></i> Down</span>
                            <span class="clue-count-badge" id="down-count">${downWords.length}</span>
                        </h4>
                        <div id="clues-down-list" class="clue-list-h"></div>
                    </div>
                </div>
            `;
            container.innerHTML = html;

            const acrossList = document.getElementById('clues-across-list');
            const downList = document.getElementById('clues-down-list');

            creatorWords.forEach(word => {
                const key = `${word.number}-${word.dir}`;
                const existingClue = creatorClues[key] || '';
                
                const card = document.createElement('div');
                card.className = 'clue-card-h';
                
                card.innerHTML = `
                    <div class="clue-num-pill">${word.number}</div>
                    <div class="clue-input-wrap">
                        <input type="text" placeholder="Describe clue..." class="clue-entry-input" value="${existingClue}" />
                    </div>
                    <div class="clue-word-len">${word.answer.length}</div>
                `;
                
                const clueInput = card.querySelector('.clue-entry-input');
                clueInput.addEventListener('input', (e) => {
                    creatorClues[key] = e.target.value;
                });
                
                if (word.dir === 'across') {
                    acrossList.appendChild(card);
                } else {
                    downList.appendChild(card);
                }
            });
        }

        function initCreatorGrid() {
            const size = parseInt(document.getElementById('create-size').value);
            const board = document.getElementById('creator-board');
            board.innerHTML = '';
            board.style.gridTemplateColumns = `repeat(${size}, 48px)`;
            board.style.gridTemplateRows = `repeat(${size}, 48px)`;
        
            creatorGrid = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ isBlack: false, char: '' })));
            
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const cellDiv = document.createElement('div');
                    cellDiv.classList.add('cw-cell');
                    cellDiv.dataset.row = r;
                    cellDiv.dataset.col = c;
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    
                    input.addEventListener('input', (e) => {
                       creatorGrid[r][c] = { ...creatorGrid[r][c], char: e.target.value.toUpperCase() };
                       e.target.value = e.target.value.toUpperCase();
                       refreshCreatorClues(size);
                    });
                    
                    cellDiv.appendChild(input);

                    cellDiv.addEventListener('click', (e) => {
                        if (currentTool === 'block') {
                            const isBlack = !creatorGrid[r][c].isBlack;
                            creatorGrid[r][c] = { isBlack, char: '' };
                            if (isBlack) {
                                cellDiv.classList.add('black-cell');
                                input.value = '';
                                input.style.display = 'none';
                            } else {
                                cellDiv.classList.remove('black-cell');
                                input.style.display = 'block';
                            }
                            refreshCreatorClues(size);
                        } else {
                            if (!creatorGrid[r][c].isBlack) input.focus();
                        }
                    });
                    board.appendChild(cellDiv);
                }
            }
            refreshCreatorClues(size);
        }

        btnGenerateGrid.addEventListener('click', initCreatorGrid);
        document.getElementById('create-size').addEventListener('change', initCreatorGrid);
        
        // Setup initial blank slate
        initCreatorGrid();
        
        document.getElementById('btn-save-puzzle').addEventListener('click', () => {
            const title = document.getElementById('create-title').value.trim() || 'Custom Puzzle';
            const size = parseInt(document.getElementById('create-size').value);
            
            // Auto-fill empty cells with black blocks
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
                                input.style.display = 'none';
                            }
                        }
                    }
                }
            }
            refreshCreatorClues(size);
            
            let finalWords = [];
            
            for (let w of creatorWords) {
                const key = `${w.number}-${w.dir}`;
                const text = creatorClues[key] || `Clue for ${w.answer}`;
                finalWords.push({ ...w, clue: text });
            }
            
            if (finalWords.length === 0) {
                window.customAlert('Incomplete Puzzle', 'You need at least one valid word to save a puzzle. Type letters across connected white cells before publishing.', 'error');
                return;
            }
            
            const customPuzzle = {
                id: 'custom-' + Date.now(),
                title: title,
                difficulty: "Custom",
                size: size,
                words: finalWords,
                createdAt: Date.now()
            };
            
            let savedPuzzles = JSON.parse(localStorage.getItem('cw_custom_puzzles') || '[]');
            savedPuzzles.push(customPuzzle);
            localStorage.setItem('cw_custom_puzzles', JSON.stringify(savedPuzzles));
            
            window.customAlert('Success Publishing!', `Puzzle "${title}" successfully published!`, 'success');
            window.location.href = 'play.html';
        });
    }

    // --- Home Page ---
    const bStartDaily = document.getElementById('btn-start-daily');
    if (bStartDaily) {
        bStartDaily.addEventListener('click', () => {
            localStorage.setItem('cw_play_target', 'daily-1');
            window.location.href = 'game.html';
        });

        const xp = parseInt(localStorage.getItem('cw_total_xp') || '0');
        const streak = parseInt(localStorage.getItem('cw_streak') || '0');
        const lastDay = localStorage.getItem('cw_last_active_day');
        const today = new Date().toDateString();
        
        if (lastDay !== today) {
            if (lastDay === new Date(Date.now() - 86400000).toDateString()) {
                localStorage.setItem('cw_streak', streak + 1);
            } else { 
                localStorage.setItem('cw_streak', '1'); 
            }
            localStorage.setItem('cw_last_active_day', today);
            localStorage.setItem('cw_daily_xp', '0');
            localStorage.setItem('cw_daily_puzzles', '0');
        }

        const streakEl = document.getElementById('streak-count');
        const totalXpEl = document.getElementById('total-xp');
        if (streakEl) streakEl.textContent = localStorage.getItem('cw_streak') || '1';
        if (totalXpEl) totalXpEl.textContent = xp;

        const dxp = parseInt(localStorage.getItem('cw_daily_xp') || '0');
        const dxpBar = document.getElementById('daily-xp-bar');
        const dxpText = document.getElementById('daily-xp-text');
        if (dxpBar) dxpBar.style.width = Math.min(100, (dxp / 50) * 100) + '%';
        if (dxpText) dxpText.textContent = `${Math.min(dxp, 50)} / 50`;

        const dp = parseInt(localStorage.getItem('cw_daily_puzzles') || '0');
        const dpBar = document.getElementById('daily-puzzle-bar');
        const dpText = document.getElementById('daily-puzzle-text');
        if (dpBar) dpBar.style.width = Math.min(100, (dp / 2) * 100) + '%';
        if (dpText) dpText.textContent = `${Math.min(dp, 2)} / 2`;

        const level = Math.floor(xp / 100) + 1;
        const levelBadge = document.getElementById('level-badge');
        if (levelBadge) levelBadge.textContent = level;
        
        const levelNameEl = document.querySelector('.level-name');
        if (levelNameEl) {
            const names = ['Beginner','Apprentice','Scholar','Expert','Master','Grandmaster'];
            levelNameEl.textContent = names[Math.min(level - 1, names.length - 1)];
        }

        const ring = document.getElementById('level-ring-fill');
        if (ring) {
            const circumference = 2 * Math.PI * 52;
            ring.style.strokeDasharray = circumference;
            const progress = (xp % 100) / 100;
            ring.style.strokeDashoffset = circumference - (progress * circumference);
        }

        // Home puzzle items (data-puzzle-topic="f1" or "tech")
        document.querySelectorAll('.bento-puzzle-item[data-puzzle-topic]').forEach(item => {
            item.addEventListener('click', () => {
                const topicId = item.getAttribute('data-puzzle-topic');
                if (window.playBuiltIn) window.playBuiltIn(topicId);
            });
        });
    }

    // --- Forum Page ---
    const forumFeed = document.getElementById('forum-feed');
    if (forumFeed) {
        const loadPosts = () => {
            const stored = JSON.parse(localStorage.getItem('cw_forum_posts') || '[]');
            const defaults = [
                { user: 'WordNerd42', content: 'Pro tip: always start with the 3-letter words first — they give you anchor letters for the longer ones!', date: '2 hours ago', likes: 12, tag: 'tips', replies: 3 },
                { user: 'PuzzleMaker', content: 'Just created a space-themed crossword with 25 clues. Check it out in the Play section!', date: '5 hours ago', likes: 8, tag: 'showcase', replies: 1 },
                { user: 'NewSolver', content: 'How do you approach a grid when you have no idea about any of the clues? Any strategies?', date: '1 day ago', likes: 5, tag: 'help', replies: 7 },
            ];
            const all = [...stored.slice().reverse(), ...defaults];
            forumFeed.innerHTML = '';

            all.forEach((post, i) => {
                const tagColors = { tips: '#856404', help: '#0284C7', showcase: '#166534', puzzles: '#5a4200' };
                const tagBgs = { tips: '#fff9e6', help: '#F0F9FF', showcase: '#F0FDF4', puzzles: '#FFF7ED' };
                const tagColor = tagColors[post.tag] || '#64748B';
                const tagBg = tagBgs[post.tag] || '#F1F5F9';
                const initial = (post.user || 'U')[0].toUpperCase();
                const avatarColors = ['#2d5e45','#3e7a5c','#1b3a2d','#4ade80','#fbbf24'];
                const avatarBg = avatarColors[i % avatarColors.length];

                const card = document.createElement('div');
                card.className = 'forum-post animate-slide-up';
                card.style.animationDelay = `${i * 0.1}s`;
                card.innerHTML = `
                    <div class="post-top">
                        <div class="forum-avatar" style="background: ${avatarBg};">${initial}</div>
                        <div class="post-header">
                            <div class="post-user-meta">
                                <strong class="post-user">${post.user || 'Anonymous'}</strong>
                                <span class="post-tag" style="color: ${tagColor}; background: ${tagBg};">${(post.tag || 'general').toUpperCase()}</span>
                            </div>
                        </div>
                        <span class="post-time">${post.date || 'just now'}</span>
                    </div>
                    <p class="post-content">${post.content}</p>
                    <div class="post-actions">
                        <button class="post-action-btn"><i class="fa-regular fa-heart"></i> ${post.likes || 0}</button>
                        <button class="post-action-btn"><i class="fa-regular fa-comment"></i> ${post.replies || 0}</button>
                        <button class="post-action-btn"><i class="fa-regular fa-bookmark"></i></button>
                    </div>
                `;
                forumFeed.appendChild(card);
            });
        };

        const publishBtn = document.getElementById('btn-publish-post');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => {
                const user = (document.getElementById('forum-username')?.value || '').trim() || 'Guest';
                const content = (document.getElementById('forum-content')?.value || '').trim();
                if (!content) return;
                const activeTag = document.querySelector('.tag-btn.active');
                const tag = activeTag ? activeTag.dataset.tag : 'tips';
                const posts = JSON.parse(localStorage.getItem('cw_forum_posts') || '[]');
                posts.push({ user, content, date: 'just now', likes: 0, tag, replies: 0 });
                localStorage.setItem('cw_forum_posts', JSON.stringify(posts));
                const contentArea = document.getElementById('forum-content');
                if (contentArea) contentArea.value = '';
                loadPosts();
            });
        }

        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        window.filterTopic = function(btn, topic) {
            document.querySelectorAll('.topic-chip').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
        };

        loadPosts();
    }

    // --- Landing Page ---
    const tileLayer = document.getElementById('tileLayer');
    if (tileLayer) {
        let navigating = false;
        const goToSite = () => { if (!navigating) { navigating = true; window.location.href = 'home.html'; } };
        
        const enterBtn = document.getElementById('enterBtn');
        if (enterBtn) {
            enterBtn.addEventListener('click', (e) => { e.preventDefault(); goToSite(); });
            setTimeout(() => enterBtn.classList.add('glow'), 2500);
            enterBtn.addEventListener('mouseenter', () => {
                const rect = enterBtn.getBoundingClientRect();
                for (let i = 0; i < 6; i++) {
                    const s = new Sparkle();
                    s.x = rect.left + Math.random() * rect.width;
                    s.y = rect.top + Math.random() * rect.height;
                    s.vy = -1 - Math.random() * 1.5;
                    s.vx = (Math.random() - 0.5) * 2;
                    s.maxAlpha = 0.4; s.r = 2 + Math.random() * 2;
                    if (window.sparkles) window.sparkles.push(s);
                }
            });
        }

        window.addEventListener('wheel', (e) => { if (e.deltaY > 0) goToSite(); }, { passive: true });
        let touchStartY = 0;
        window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
        window.addEventListener('touchend', (e) => { if (touchStartY - e.changedTouches[0].clientY > 50) goToSite(); }, { passive: true });

        const S = 50, TS = 46;
        const colorStyles = ['t-green','t-blue','t-orange','t-purple','t-yellow','t-white'];
        const isMobile = window.innerWidth < 640;
        const tileObjs = [];
        let mouse = { x: -1000, y: -1000 };
        let dragging = null;
        let dragOffset = { x: 0, y: 0 };

        const makeFragments = () => [
            { cells: [['C',0,0],['R',1,0],['O',2,0],['S',3,0],['S',4,0], ['L',0,1],['U',0,2],['E',0,3]] },
            { cells: [['P',0,0],['U',1,0],['Z',2,0],['Z',3,0],['L',4,0],['E',5,0], ['L',0,1],['A',0,2],['Y',0,3]] },
            { cells: [['W',0,0],['O',1,0],['R',2,0],['D',3,0], ['I',0,1],['N',0,2]] },
            { cells: [['G',0,0],['A',1,0],['M',2,0],['E',3,0], ['R',0,1],['I',0,2],['D',0,3]] },
            { cells: [['S',0,0],['O',1,0],['L',2,0],['V',3,0],['E',4,0], ['C',0,1],['O',0,2],['R',0,3],['E',0,4]] },
            { cells: [['F',0,0],['U',1,0],['N',2,0], ['X',0,1],['P',1,1]] },
            { cells: [['T',0,0],['H',1,0],['I',2,0],['N',3,0],['K',4,0], ['I',0,1],['M',0,2],['E',0,3]] },
            { cells: [['B',0,0],['R',1,0],['A',2,0],['I',3,0],['N',4,0], ['E',0,1],['S',0,2],['T',0,3]] },
            { cells: [['L',0,0],['E',1,0],['V',2,0],['E',3,0],['L',4,0], ['E',0,1],['A',0,2],['R',0,3],['N',0,4]] },
            { cells: [['H',0,0],['I',0,1],['N',0,2],['T',0,3]] },
        ];

        const getZones = () => {
            const vw = window.innerWidth, vh = window.innerHeight;
            return [
                { x: vw * 0.02, y: vh * 0.04 }, { x: vw * 0.70, y: vh * 0.02 },
                { x: vw * 0.01, y: vh * 0.50 }, { x: vw * 0.80, y: vh * 0.40 },
                { x: vw * 0.04, y: vh * 0.80 }, { x: vw * 0.68, y: vh * 0.78 },
                { x: vw * 0.34, y: vh * 0.01 }, { x: vw * 0.32, y: vh * 0.84 },
                { x: vw * 0.87, y: vh * 0.12 }, { x: vw * 0.86, y: vh * 0.68 },
            ];
        };

        const buildTiles = () => {
            tileLayer.innerHTML = '';
            tileObjs.length = 0;
            const frags = makeFragments();
            const zones = getZones();
            const vw = window.innerWidth, vh = window.innerHeight, cx = vw / 2, cy = vh / 2;

            frags.forEach((frag, fi) => {
                if (fi >= zones.length) return;
                const zone = zones[fi];
                frag.cells.forEach(([letter, col, row]) => {
                    const homeX = zone.x + col * S, homeY = zone.y + row * S;
                    if (homeX + TS > vw + 10 || homeY + TS > vh + 10) return;
                    const div = document.createElement('div');
                    div.className = `tile ${colorStyles[Math.floor(Math.random() * colorStyles.length)]}`;
                    div.textContent = letter;
                    div.style.width = TS + 'px'; div.style.height = TS + 'px';
                    const dist = Math.sqrt(Math.pow((homeX + TS / 2) - cx, 2) + Math.pow((homeY + TS / 2) - cy, 2));
                    div.style.setProperty('--tile-opacity', Math.max(0.35, Math.min(0.85, (dist / Math.sqrt(cx*cx + cy*cy)) * 1.2)).toFixed(2));
                    let sx, sy;
                    const edge = Math.floor(Math.random() * 4);
                    if (edge === 0) { sx = -80 - Math.random() * 400; sy = Math.random() * vh; }
                    else if (edge === 1) { sx = vw + Math.random() * 400; sy = Math.random() * vh; }
                    else if (edge === 2) { sx = Math.random() * vw; sy = -80 - Math.random() * 400; }
                    else { sx = Math.random() * vw; sy = vh + Math.random() * 400; }
                    tileLayer.appendChild(div);
                    tileObjs.push({ div, homeX, homeY, x: sx, y: sy, rot: (Math.random() - 0.5) * 220, vx: 0, vy: 0, vr: 0, settled: false, wigglePhase: Math.random() * Math.PI * 2, wiggleDx: (Math.random() - 0.5) * 5, wiggleDy: (Math.random() - 0.5) * 4, wiggleDr: (Math.random() - 0.5) * 2 });
                });
            });
            tileObjs.forEach((t, i) => setTimeout(() => { t.settled = true; t.div.classList.add('visible'); }, 100 + Math.floor(i / 8) * 140 + (i % 8) * 30 + Math.random() * 60));
        };

        const physicsTick = () => {
            tileObjs.forEach(t => {
                if (t === dragging) return;
                if (!t.settled) { t.div.style.transform = `translate(${t.x}px,${t.y}px) rotate(${t.rot}deg)`; return; }
                t.wigglePhase += 0.005;
                const wx = Math.sin(t.wigglePhase) * t.wiggleDx, wy = Math.cos(t.wigglePhase * 0.7) * t.wiggleDy, wr = Math.sin(t.wigglePhase * 0.5) * t.wiggleDr;
                t.vx += (t.homeX + wx - t.x) * 0.03; t.vy += (t.homeY + wy - t.y) * 0.03; t.vr += (wr - t.rot) * 0.02;
                const dx = t.x - mouse.x, dy = t.y - mouse.y, d = Math.sqrt(dx*dx + dy*dy);
                if (d < 100 && d > 0 && !dragging) { const force = (100 - d) / 100 * 4; t.vx += (dx / d) * force; t.vy += (dy / d) * force; t.vr += (Math.random() - 0.5) * 2; }
                t.vx *= 0.88; t.vy *= 0.88; t.vr *= 0.88; t.x += t.vx; t.y += t.vy; t.rot += t.vr;
                t.div.style.transform = `translate(${t.x}px,${t.y}px) rotate(${t.rot}deg)`;
            });
            requestAnimationFrame(physicsTick);
        };

        buildTiles(); physicsTick();
        document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
        document.addEventListener('mousedown', (e) => {
            const tileEl = e.target.closest('.tile'); if (!tileEl) return;
            const obj = tileObjs.find(t => t.div === tileEl); if (!obj) return;
            dragging = obj; dragOffset.x = e.clientX - obj.x; dragOffset.y = e.clientY - obj.y;
            obj.div.classList.add('dragging'); e.preventDefault();
        });
        window.addEventListener('mousemove', (e) => { if (!dragging) return; dragging.x = e.clientX - dragOffset.x; dragging.y = e.clientY - dragOffset.y; dragging.rot = 0; dragging.div.style.transform = `translate(${dragging.x}px,${dragging.y}px) rotate(0deg)`; });
        window.addEventListener('mouseup', () => { if (dragging) { dragging.div.classList.remove('dragging'); dragging = null; } });
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0]; const tileEl = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!tileEl || !tileEl.classList.contains('tile')) return;
            const obj = tileObjs.find(t => t.div === tileEl); if (!obj) return;
            dragging = obj; dragOffset.x = touch.clientX - obj.x; dragOffset.y = touch.clientY - obj.y; obj.div.classList.add('dragging');
        }, { passive: true });
        window.addEventListener('touchmove', (e) => { if (!dragging) return; const touch = e.touches[0]; dragging.x = touch.clientX - dragOffset.x; dragging.y = touch.clientY - dragOffset.y; dragging.div.style.transform = `translate(${dragging.x}px,${dragging.y}px) rotate(0deg)`; }, { passive: true });
        window.addEventListener('touchend', () => { if (dragging) { dragging.div.classList.remove('dragging'); dragging = null; } });
        let resizeTimer; window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(buildTiles, 400); });

        const sparkleCanvas = document.getElementById('sparkleCanvas');
        if (sparkleCanvas) {
            const sCtx = sparkleCanvas.getContext('2d');
            let sparkles = [];
            const sColors = [[160, 232, 112], [255, 200, 0], [255, 150, 0], [237, 230, 216], [88, 204, 2]];
            const resizeSparkle = () => { sparkleCanvas.width = window.innerWidth; sparkleCanvas.height = window.innerHeight; };
            resizeSparkle(); window.addEventListener('resize', resizeSparkle);
            class Sparkle {
                constructor() { this.reset(); }
                reset() { this.x = Math.random() * sparkleCanvas.width; this.y = Math.random() * sparkleCanvas.height; this.r = Math.random() * 2.5 + 0.5; this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3; this.phase = Math.random() * Math.PI * 2; this.speed = 0.015 + Math.random() * 0.025; this.rgb = sColors[Math.floor(Math.random() * sColors.length)]; this.maxAlpha = 0.1 + Math.random() * 0.14; }
                update() { this.x += this.vx; this.y += this.vy; this.phase += this.speed; if (this.x < -5 || this.x > sparkleCanvas.width + 5 || this.y < -5 || this.y > sparkleCanvas.height + 5) this.reset(); }
                draw() { const a = this.maxAlpha * (0.4 + 0.6 * Math.sin(this.phase)); sCtx.beginPath(); sCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2); sCtx.fillStyle = `rgba(${this.rgb[0]},${this.rgb[1]},${this.rgb[2]},${a})`; sCtx.fill(); }
            }
            for (let i = 0; i < (isMobile ? 40 : 70); i++) sparkles.push(new Sparkle());
            const animateSparkles = () => {
                sCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
                sparkles.forEach(s => { s.update(); s.draw(); });
                for (let i = 0; i < sparkles.length; i++) {
                    for (let j = i + 1; j < sparkles.length; j++) {
                        const d = Math.sqrt(Math.pow(sparkles[i].x - sparkles[j].x, 2) + Math.pow(sparkles[i].y - sparkles[j].y, 2));
                        if (d < 75) { sCtx.strokeStyle = `rgba(160, 232, 112, ${(1 - d / 75) * 0.03})`; sCtx.lineWidth = 0.5; sCtx.beginPath(); sCtx.moveTo(sparkles[i].x, sparkles[i].y); sCtx.lineTo(sparkles[j].x, sparkles[j].y); sCtx.stroke(); }
                    }
                }
                requestAnimationFrame(animateSparkles);
            };
            animateSparkles();
            window.Sparkle = Sparkle; window.sparkles = sparkles;
        }
    }

    // --- Leaderboard Page ---
    const lbList = document.getElementById('lb-list-container');
    if (lbList) {
        let itemsToShow = 10;
        let currentData = [];
        const loadLeaderboardData = () => {
            currentData = getLeaderboardData();
            renderLB();
        };

        const updatePodium = (data) => {
            const p1 = data[0] || { name: '-', score: 0 };
            const p2 = data[1] || { name: '-', score: 0 };
            const p3 = data[2] || { name: '-', score: 0 };

            if (document.getElementById('p1-name')) document.getElementById('p1-name').innerText = p1.name;
            if (document.getElementById('p1-score')) document.getElementById('p1-score').innerText = p1.score.toLocaleString();
            if (document.getElementById('p2-name')) document.getElementById('p2-name').innerText = p2.name;
            if (document.getElementById('p2-score')) document.getElementById('p2-score').innerText = p2.score.toLocaleString();
            if (document.getElementById('p3-name')) document.getElementById('p3-name').innerText = p3.name;
            if (document.getElementById('p3-score')) document.getElementById('p3-score').innerText = p3.score.toLocaleString();
        };

        const renderLB = () => {
            lbList.innerHTML = '';
            updatePodium(currentData);
            
            // Show only from 4th place onwards in the list if podium exists
            const listData = currentData.slice(3, itemsToShow + 3);
            if (listData.length === 0) {
                lbList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--color-text-mut);">No more rankings yet!</div>';
                return;
            }

            listData.forEach((entry, i) => {
                const diff = (entry.diff || 'Global').toUpperCase();
                const rank = i + 4;
                const row = document.createElement('div');
                row.className = 'lb-entry animate-slide-up';
                row.style.animationDelay = `${i * 0.05}s`;
                row.innerHTML = `<span class="lb-rank">${rank}</span><div class="lb-user-avatar" style="background:#2D5E45">${entry.name[0]}</div><div class="lb-user-info"><strong>${entry.name}</strong><span class="lb-diff">${diff}</span></div><span class="lb-user-score">${entry.score.toLocaleString()}</span>`;
                lbList.appendChild(row);
            });
        };

        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                // Potential filtering logic here
            });
        });

        loadLeaderboardData();
    }

});

// --- Crossword Logic ---

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
    
    // Reset State
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
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${size}, var(--cell-size, 52px))`;
    board.style.gridTemplateRows = `repeat(${size}, var(--cell-size, 52px))`;

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
    acrossList.innerHTML = '';
    downList.innerHTML = '';

    words.forEach(word => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${word.number}.</strong> ${word.clue}`;
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

let currentDirection = 'across'; // Which way does typing advance?

function handleCellFocus(e) {
    const input = e.target;
    // Optional: highlight associated clue or word cells
}

function handleCellInput(e) {
    const input = e.target;
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    
    // Save to model
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
                        input.style.color = 'var(--success)';
                        input.classList.remove('error-pulse');
                        if (cellDiv) { cellDiv.classList.remove('incorrect'); cellDiv.classList.add('correct'); }
                    } else {
                        input.style.color = 'var(--error)';
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

    // Calculate dynamic score
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
    // Save score to local storage leaderboard
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

function getLeaderboardData() {
    const raw = localStorage.getItem('cw_leaderboard');
    if (raw) return JSON.parse(raw);
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
