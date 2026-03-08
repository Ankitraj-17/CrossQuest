// Play page logic only.
document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.challenge-card:not(.card-pro)').forEach((card) => {
		card.classList.add('is-clickable');
		card.addEventListener('click', () => {
			const topicId = card.getAttribute('data-play-id');
			if (topicId && window.playBuiltIn) {
				window.playBuiltIn(topicId);
			}
		});
	});

	document.querySelectorAll('.challenge-card.card-pro').forEach((card) => {
		card.classList.add('is-clickable');
		card.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (window.showPremiumModal) {
				window.showPremiumModal();
			}
		});
	});

	const customList = document.getElementById('custom-puzzle-list');
	if (!customList) return;

	const savedPuzzles = JSON.parse(localStorage.getItem('cw_custom_puzzles') || '[]');
	customList.replaceChildren();

	const createCard = createEl('div', { className: 'creator-card create-new' });
	const createIcon = createEl('div', { className: 'cc-icon', text: '+' });
	const createInfo = createEl('div', { className: 'cc-info' });
	createInfo.append(createEl('h4', { text: 'Create New' }), createEl('p', { text: 'Design your own challenge' }));
	createCard.append(createIcon, createInfo);
	customList.appendChild(createCard);

	savedPuzzles.forEach((puzzle) => {
		let dateStr = 'Unknown Date';
		if (puzzle.createdAt) dateStr = new Date(puzzle.createdAt).toLocaleDateString();

		const card = createEl('div', { className: 'creator-card' });
		const badge = createEl('div', { className: 'cc-badge', text: `${puzzle.size}x` });
		const info = createEl('div', { className: 'cc-info' });
		const title = createEl('h4', { text: puzzle.title });
		const meta = createEl('div', { className: 'cc-meta' });

		const byYou = createEl('span');
		byYou.append(createEl('i', { className: 'fa-solid fa-user cc-meta-user-icon' }), document.createTextNode(' Created by You'));
		meta.append(byYou, createEl('span', { text: dateStr }));

		const actions = createEl('div', { className: 'cc-actions' });
		const deleteBtn = createEl('button', { className: 'btn-cs-del', attrs: { 'data-id': puzzle.id } });
		deleteBtn.append(createEl('i', { className: 'fa-solid fa-trash' }), document.createTextNode(' Discard'));
		actions.append(deleteBtn, createEl('i', { className: 'fa-regular fa-clock cc-clock-icon' }));

		info.append(title, meta, actions, createEl('div', { className: 'cc-custom-label', text: 'Custom' }));
		const playBtn = createEl('button', { className: 'btn-cs-play', attrs: { 'data-id': puzzle.id } });
		playBtn.appendChild(createEl('i', { className: 'fa-solid fa-play' }));

		card.append(badge, info, playBtn);
		customList.appendChild(card);
	});

	customList.addEventListener('click', (e) => {
		if (e.target.closest('.create-new')) {
			window.location.href = 'create.html';
			return;
		}
		const delBtn = e.target.closest('.btn-cs-del');
		if (delBtn) {
			window.deleteCustomPuzzle(delBtn.dataset.id);
			return;
		}
		const playBtn = e.target.closest('.btn-cs-play');
		if (playBtn) {
			localStorage.setItem('cw_play_target', playBtn.dataset.id);
			window.location.href = 'game.html';
		}
	});
});
