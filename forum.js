// Forum page logic only.
document.addEventListener('DOMContentLoaded', () => {
	const forumFeed = document.getElementById('forum-feed');
	if (!forumFeed) return;

	const loadPosts = () => {
		const stored = JSON.parse(localStorage.getItem('cw_forum_posts') || '[]');
		const defaults = [
			{ user: 'WordNerd42', content: 'Pro tip: always start with the 3-letter words first - they give you anchor letters for the longer ones!', date: '2 hours ago', likes: 12, tag: 'tips', replies: 3 },
			{ user: 'PuzzleMaker', content: 'Just created a space-themed crossword with 25 clues. Check it out in the Play section!', date: '5 hours ago', likes: 8, tag: 'showcase', replies: 1 },
			{ user: 'NewSolver', content: 'How do you approach a grid when you have no idea about any of the clues? Any strategies?', date: '1 day ago', likes: 5, tag: 'help', replies: 7 }
		];

		const all = [...stored.slice().reverse(), ...defaults];
		forumFeed.replaceChildren();

		all.forEach((post, i) => {
			const initial = (post.user || 'U')[0].toUpperCase();
			const avatarClasses = ['forum-avatar-c1', 'forum-avatar-c2', 'forum-avatar-c3', 'forum-avatar-c4', 'forum-avatar-c5'];
			const avatarClass = avatarClasses[i % avatarClasses.length];
			const tagClass = `post-tag-${post.tag || 'general'}`;

			const card = document.createElement('div');
			card.className = 'forum-post animate-slide-up';

			const postTop = createEl('div', { className: 'post-top' });
			const avatar = createEl('div', { className: `forum-avatar ${avatarClass}`, text: initial });
			const postHeader = createEl('div', { className: 'post-header' });
			const userMeta = createEl('div', { className: 'post-user-meta' });
			userMeta.append(
				createEl('strong', { className: 'post-user', text: post.user || 'Anonymous' }),
				createEl('span', { className: `post-tag ${tagClass}`, text: (post.tag || 'general').toUpperCase() })
			);
			postHeader.appendChild(userMeta);
			postTop.append(avatar, postHeader, createEl('span', { className: 'post-time', text: post.date || 'just now' }));

			const content = createEl('p', { className: 'post-content', text: post.content });
			const actions = createEl('div', { className: 'post-actions' });
			const likeBtn = createEl('button', { className: 'post-action-btn' });
			likeBtn.append(createEl('i', { className: 'fa-regular fa-heart' }), document.createTextNode(` ${post.likes || 0}`));
			const replyBtn = createEl('button', { className: 'post-action-btn' });
			replyBtn.append(createEl('i', { className: 'fa-regular fa-comment' }), document.createTextNode(` ${post.replies || 0}`));
			const saveBtn = createEl('button', { className: 'post-action-btn' });
			saveBtn.appendChild(createEl('i', { className: 'fa-regular fa-bookmark' }));
			actions.append(likeBtn, replyBtn, saveBtn);

			card.append(postTop, content, actions);
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

	document.querySelectorAll('.tag-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			document.querySelectorAll('.tag-btn').forEach((b) => b.classList.remove('active'));
			btn.classList.add('active');
		});
	});

	window.filterTopic = function(btn) {
		document.querySelectorAll('.topic-chip').forEach((t) => t.classList.remove('active'));
		btn.classList.add('active');
	};

	loadPosts();
});
