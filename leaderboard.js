// Leaderboard page logic only.
document.addEventListener('DOMContentLoaded', () => {
	const lbList = document.getElementById('lb-list-container');
	if (!lbList) return;

	const itemsToShow = 10;
	let currentData = [];

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
		lbList.replaceChildren();
		updatePodium(currentData);

		const listData = currentData.slice(3, itemsToShow + 3);
		if (listData.length === 0) {
			const noData = createEl('div', { className: 'lb-no-data' });
			noData.textContent = 'No more rankings yet!';
			lbList.replaceChildren(noData);
			return;
		}

		listData.forEach((entry, i) => {
			const diff = (entry.diff || 'Global').toUpperCase();
			const rank = i + 4;

			const row = document.createElement('div');
			row.className = 'lb-entry animate-slide-up';
			const rankSpan = createEl('span', { className: 'lb-rank', text: String(rank) });
			const avatar = createEl('div', { className: 'lb-user-avatar lb-avatar-forest', text: entry.name[0] });
			const userInfo = createEl('div', { className: 'lb-user-info' });
			userInfo.append(createEl('strong', { text: entry.name }), createEl('span', { className: 'lb-diff', text: diff }));
			const score = createEl('span', { className: 'lb-user-score', text: entry.score.toLocaleString() });
			row.append(rankSpan, avatar, userInfo, score);
			lbList.appendChild(row);
		});
	};

	document.querySelectorAll('.lb-tab').forEach((tab) => {
		tab.addEventListener('click', () => {
			document.querySelectorAll('.lb-tab').forEach((t) => t.classList.remove('active'));
			tab.classList.add('active');
		});
	});

	currentData = getLeaderboardData();
	renderLB();
});
