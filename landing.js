// Landing page logic only.
document.addEventListener('DOMContentLoaded', () => {
    const tileLayer = document.getElementById('tileLayer');
    if (!tileLayer) return;

    let navigating = false;
    const goToSite = () => {
        if (!navigating) {
            navigating = true;
            window.location.href = 'home.html';
        }
    };

    const enterBtn = document.getElementById('enterBtn');
    if (enterBtn) {
        enterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToSite();
        });
        setTimeout(() => enterBtn.classList.add('glow'), 2500);
    }

    window.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) goToSite();
    }, { passive: true });

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (touchStartY - e.changedTouches[0].clientY > 50) goToSite();
    }, { passive: true });

    const S = 50;
    const TS = 46;
    const colorStyles = ['t-green', 't-blue', 't-orange', 't-purple', 't-yellow', 't-white'];
    const isMobile = window.innerWidth < 640;
    const tileObjs = [];
    let mouse = { x: -1000, y: -1000 };
    let dragging = null;
    const dragOffset = { x: 0, y: 0 };

    const makeFragments = () => [
        { cells: [['C', 0, 0], ['R', 1, 0], ['O', 2, 0], ['S', 3, 0], ['S', 4, 0], ['L', 0, 1], ['U', 0, 2], ['E', 0, 3]] },
        { cells: [['P', 0, 0], ['U', 1, 0], ['Z', 2, 0], ['Z', 3, 0], ['L', 4, 0], ['E', 5, 0], ['L', 0, 1], ['A', 0, 2], ['Y', 0, 3]] },
        { cells: [['W', 0, 0], ['O', 1, 0], ['R', 2, 0], ['D', 3, 0], ['I', 0, 1], ['N', 0, 2]] },
        { cells: [['G', 0, 0], ['A', 1, 0], ['M', 2, 0], ['E', 3, 0], ['R', 0, 1], ['I', 0, 2], ['D', 0, 3]] },
        { cells: [['S', 0, 0], ['O', 1, 0], ['L', 2, 0], ['V', 3, 0], ['E', 4, 0], ['C', 0, 1], ['O', 0, 2], ['R', 0, 3], ['E', 0, 4]] },
        { cells: [['F', 0, 0], ['U', 1, 0], ['N', 2, 0], ['X', 0, 1], ['P', 1, 1]] },
        { cells: [['T', 0, 0], ['H', 1, 0], ['I', 2, 0], ['N', 3, 0], ['K', 4, 0], ['I', 0, 1], ['M', 0, 2], ['E', 0, 3]] },
        { cells: [['B', 0, 0], ['R', 1, 0], ['A', 2, 0], ['I', 3, 0], ['N', 4, 0], ['E', 0, 1], ['S', 0, 2], ['T', 0, 3]] },
        { cells: [['L', 0, 0], ['E', 1, 0], ['V', 2, 0], ['E', 3, 0], ['L', 4, 0], ['E', 0, 1], ['A', 0, 2], ['R', 0, 3], ['N', 0, 4]] },
        { cells: [['H', 0, 0], ['I', 0, 1], ['N', 0, 2], ['T', 0, 3]] }
    ];

    const getZones = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return [
            { x: vw * 0.02, y: vh * 0.04 }, { x: vw * 0.70, y: vh * 0.02 },
            { x: vw * 0.01, y: vh * 0.50 }, { x: vw * 0.80, y: vh * 0.40 },
            { x: vw * 0.04, y: vh * 0.80 }, { x: vw * 0.68, y: vh * 0.78 },
            { x: vw * 0.34, y: vh * 0.01 }, { x: vw * 0.32, y: vh * 0.84 },
            { x: vw * 0.87, y: vh * 0.12 }, { x: vw * 0.86, y: vh * 0.68 }
        ];
    };

    const buildTiles = () => {
        tileLayer.replaceChildren();
        tileObjs.length = 0;

        const frags = makeFragments();
        const zones = getZones();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cx = vw / 2;
        const cy = vh / 2;

        frags.forEach((frag, fi) => {
            if (fi >= zones.length) return;
            const zone = zones[fi];
            frag.cells.forEach(([letter, col, row]) => {
                const homeX = zone.x + col * S;
                const homeY = zone.y + row * S;
                if (homeX + TS > vw + 10 || homeY + TS > vh + 10) return;

                const div = document.createElement('div');
                div.className = `tile ${colorStyles[Math.floor(Math.random() * colorStyles.length)]}`;
                div.textContent = letter;

                const dist = Math.sqrt(Math.pow((homeX + TS / 2) - cx, 2) + Math.pow((homeY + TS / 2) - cy, 2));
                div.style.setProperty('--tile-opacity', Math.max(0.35, Math.min(0.85, (dist / Math.sqrt(cx * cx + cy * cy)) * 1.2)).toFixed(2));

                let sx;
                let sy;
                const edge = Math.floor(Math.random() * 4);
                if (edge === 0) {
                    sx = -80 - Math.random() * 400;
                    sy = Math.random() * vh;
                } else if (edge === 1) {
                    sx = vw + Math.random() * 400;
                    sy = Math.random() * vh;
                } else if (edge === 2) {
                    sx = Math.random() * vw;
                    sy = -80 - Math.random() * 400;
                } else {
                    sx = Math.random() * vw;
                    sy = vh + Math.random() * 400;
                }

                tileLayer.appendChild(div);
                tileObjs.push({
                    div,
                    homeX,
                    homeY,
                    x: sx,
                    y: sy,
                    rot: (Math.random() - 0.5) * 220,
                    vx: 0,
                    vy: 0,
                    vr: 0,
                    settled: false,
                    wigglePhase: Math.random() * Math.PI * 2,
                    wiggleDx: (Math.random() - 0.5) * 5,
                    wiggleDy: (Math.random() - 0.5) * 4,
                    wiggleDr: (Math.random() - 0.5) * 2
                });
            });
        });

        tileObjs.forEach((t, i) => {
            setTimeout(() => {
                t.settled = true;
                t.div.classList.add('visible');
            }, 100 + Math.floor(i / 8) * 140 + (i % 8) * 30 + Math.random() * 60);
        });
    };

    const physicsTick = () => {
        tileObjs.forEach((t) => {
            if (t === dragging) return;
            if (!t.settled) {
                t.div.style.transform = `translate(${t.x}px,${t.y}px) rotate(${t.rot}deg)`;
                return;
            }

            t.wigglePhase += 0.005;
            const wx = Math.sin(t.wigglePhase) * t.wiggleDx;
            const wy = Math.cos(t.wigglePhase * 0.7) * t.wiggleDy;
            const wr = Math.sin(t.wigglePhase * 0.5) * t.wiggleDr;

            t.vx += (t.homeX + wx - t.x) * 0.03;
            t.vy += (t.homeY + wy - t.y) * 0.03;
            t.vr += (wr - t.rot) * 0.02;

            const dx = t.x - mouse.x;
            const dy = t.y - mouse.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 100 && d > 0 && !dragging) {
                const force = ((100 - d) / 100) * 4;
                t.vx += (dx / d) * force;
                t.vy += (dy / d) * force;
                t.vr += (Math.random() - 0.5) * 2;
            }

            t.vx *= 0.88;
            t.vy *= 0.88;
            t.vr *= 0.88;
            t.x += t.vx;
            t.y += t.vy;
            t.rot += t.vr;
            t.div.style.transform = `translate(${t.x}px,${t.y}px) rotate(${t.rot}deg)`;
        });

        requestAnimationFrame(physicsTick);
    };

    buildTiles();
    physicsTick();

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    document.addEventListener('mousedown', (e) => {
        const tileEl = e.target.closest('.tile');
        if (!tileEl) return;
        const obj = tileObjs.find((t) => t.div === tileEl);
        if (!obj) return;
        dragging = obj;
        dragOffset.x = e.clientX - obj.x;
        dragOffset.y = e.clientY - obj.y;
        obj.div.classList.add('dragging');
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        dragging.x = e.clientX - dragOffset.x;
        dragging.y = e.clientY - dragOffset.y;
        dragging.rot = 0;
        dragging.div.style.transform = `translate(${dragging.x}px,${dragging.y}px) rotate(0deg)`;
    });

    window.addEventListener('mouseup', () => {
        if (dragging) {
            dragging.div.classList.remove('dragging');
            dragging = null;
        }
    });

    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const tileEl = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!tileEl || !tileEl.classList.contains('tile')) return;
        const obj = tileObjs.find((t) => t.div === tileEl);
        if (!obj) return;
        dragging = obj;
        dragOffset.x = touch.clientX - obj.x;
        dragOffset.y = touch.clientY - obj.y;
        obj.div.classList.add('dragging');
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        const touch = e.touches[0];
        dragging.x = touch.clientX - dragOffset.x;
        dragging.y = touch.clientY - dragOffset.y;
        dragging.div.style.transform = `translate(${dragging.x}px,${dragging.y}px) rotate(0deg)`;
    }, { passive: true });

    window.addEventListener('touchend', () => {
        if (dragging) {
            dragging.div.classList.remove('dragging');
            dragging = null;
        }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildTiles, 400);
    });

    const sparkleCanvas = document.getElementById('sparkleCanvas');
    if (!sparkleCanvas) return;

    const sCtx = sparkleCanvas.getContext('2d');
    const sparkles = [];
    const sColors = [[160, 232, 112], [255, 200, 0], [255, 150, 0], [237, 230, 216], [88, 204, 2]];

    const resizeSparkle = () => {
        sparkleCanvas.width = window.innerWidth;
        sparkleCanvas.height = window.innerHeight;
    };

    resizeSparkle();
    window.addEventListener('resize', resizeSparkle);

    class Sparkle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * sparkleCanvas.width;
            this.y = Math.random() * sparkleCanvas.height;
            this.r = Math.random() * 2.5 + 0.5;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.phase = Math.random() * Math.PI * 2;
            this.speed = 0.015 + Math.random() * 0.025;
            this.rgb = sColors[Math.floor(Math.random() * sColors.length)];
            this.maxAlpha = 0.1 + Math.random() * 0.14;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.phase += this.speed;
            if (this.x < -5 || this.x > sparkleCanvas.width + 5 || this.y < -5 || this.y > sparkleCanvas.height + 5) {
                this.reset();
            }
        }

        draw() {
            const a = this.maxAlpha * (0.4 + 0.6 * Math.sin(this.phase));
            sCtx.beginPath();
            sCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            sCtx.fillStyle = `rgba(${this.rgb[0]},${this.rgb[1]},${this.rgb[2]},${a})`;
            sCtx.fill();
        }
    }

    for (let i = 0; i < (isMobile ? 40 : 70); i++) {
        sparkles.push(new Sparkle());
    }

    const animateSparkles = () => {
        sCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
        sparkles.forEach((s) => {
            s.update();
            s.draw();
        });

        for (let i = 0; i < sparkles.length; i++) {
            for (let j = i + 1; j < sparkles.length; j++) {
                const d = Math.sqrt(Math.pow(sparkles[i].x - sparkles[j].x, 2) + Math.pow(sparkles[i].y - sparkles[j].y, 2));
                if (d < 75) {
                    sCtx.strokeStyle = `rgba(160, 232, 112, ${(1 - d / 75) * 0.03})`;
                    sCtx.lineWidth = 0.5;
                    sCtx.beginPath();
                    sCtx.moveTo(sparkles[i].x, sparkles[i].y);
                    sCtx.lineTo(sparkles[j].x, sparkles[j].y);
                    sCtx.stroke();
                }
            }
        }

        requestAnimationFrame(animateSparkles);
    };

    animateSparkles();
});
