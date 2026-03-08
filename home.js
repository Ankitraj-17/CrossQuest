// Home page logic only.
document.addEventListener('DOMContentLoaded', () => {
	const btnStartDaily = document.getElementById('btn-start-daily');
	if (btnStartDaily) {
		btnStartDaily.addEventListener('click', () => {
			localStorage.setItem('cw_play_target', 'daily-1');
			window.location.href = 'game.html';
		});
	}

	document.querySelectorAll('.card-pro, .bento-mini.bento-scramble, .bento-mini.bento-match, .bento-puzzle-item.locked').forEach((el) => {
		el.classList.add('is-clickable');
		el.addEventListener('click', (e) => {
			e.stopPropagation();
			window.showPremiumModal();
		});
	});

	const xp = parseInt(localStorage.getItem('cw_total_xp') || '0', 10);
	const streak = parseInt(localStorage.getItem('cw_streak') || '0', 10);
	const lastDay = localStorage.getItem('cw_last_active_day');
	const today = new Date().toDateString();

	if (lastDay !== today) {
		if (lastDay === new Date(Date.now() - 86400000).toDateString()) {
			localStorage.setItem('cw_streak', String(streak + 1));
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
	if (totalXpEl) totalXpEl.textContent = String(xp);

	const dxp = parseInt(localStorage.getItem('cw_daily_xp') || '0', 10);
	const dxpBar = document.getElementById('daily-xp-bar');
	const dxpText = document.getElementById('daily-xp-text');
	if (dxpBar) dxpBar.style.width = `${Math.min(100, (dxp / 50) * 100)}%`;
	if (dxpText) dxpText.textContent = `${Math.min(dxp, 50)} / 50`;

	const dp = parseInt(localStorage.getItem('cw_daily_puzzles') || '0', 10);
	const dpBar = document.getElementById('daily-puzzle-bar');
	const dpText = document.getElementById('daily-puzzle-text');
	if (dpBar) dpBar.style.width = `${Math.min(100, (dp / 2) * 100)}%`;
	if (dpText) dpText.textContent = `${Math.min(dp, 2)} / 2`;

	const level = Math.floor(xp / 100) + 1;
	const levelBadge = document.getElementById('level-badge');
	if (levelBadge) levelBadge.textContent = String(level);

	const levelNameEl = document.querySelector('.level-name');
	if (levelNameEl) {
		const names = ['Beginner', 'Apprentice', 'Scholar', 'Expert', 'Master', 'Grandmaster'];
		levelNameEl.textContent = names[Math.min(level - 1, names.length - 1)];
	}

	const ring = document.getElementById('level-ring-fill');
	if (ring) {
		const circumference = 2 * Math.PI * 52;
		ring.style.strokeDasharray = String(circumference);
		const progress = (xp % 100) / 100;
		ring.style.strokeDashoffset = String(circumference - (progress * circumference));
	}

	document.querySelectorAll('.bento-puzzle-item[data-puzzle-topic]').forEach((item) => {
		item.addEventListener('click', () => {
			const topicId = item.getAttribute('data-puzzle-topic');
			if (window.playBuiltIn) window.playBuiltIn(topicId);
		});
	});
});
