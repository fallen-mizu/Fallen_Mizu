/* =========================
ZEN SYSTEM — ALL IN ONE JS
(ADD-ONLY, NO HTML EDIT)
========================= */

(() => {

    /* =========================
    1. INJECT LOADER HTML
    ========================= */
    const loaderHTML = `
    <div id="zen-loader">
        <div class="zen-inner">
            <div class="zen-circle"></div>
            <div class="zen-text">
                <span>LOADING</span>
                <span class="jp">読み込み中</span>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', loaderHTML);


    /* =========================
    2. INJECT TOGGLE BUTTON
    ========================= */
    const toggleHTML = `
    <div class="zen-toggle">
        <span class="sun">☀</span>
        <span class="moon">☾</span>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toggleHTML);


    /* =========================
    3. INJECT CSS
    ========================= */
    const style = document.createElement('style');
    style.innerHTML = `
    /* LOADER */
    #zen-loader {
        position: fixed;
        inset: 0;
        background: var(--paper-white);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 1s ease, visibility 1s ease;
    }

    html.dark #zen-loader {
        background: #0F1113;
    }

    .zen-inner { text-align: center; }

    .zen-circle {
        width: 60px;
        height: 60px;
        border: 2px solid transparent;
        border-top: 2px solid var(--wasabi-red);
        border-radius: 50%;
        margin: 0 auto 20px;
        animation: zenSpin 1.2s linear infinite;
    }

    .zen-text {
        font-family: 'Noto Serif JP', serif;
        font-size: 0.7rem;
        letter-spacing: 3px;
        color: var(--ink-black);
    }

    .zen-text .jp {
        display: block;
        font-size: 0.65rem;
        opacity: 0.6;
        margin-top: 5px;
    }

    @keyframes zenSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    #zen-loader.hide {
        opacity: 0;
        visibility: hidden;
    }

    /* TOGGLE */
    .zen-toggle {
        position: fixed;
        bottom: 25px;
        right: 25px;
        z-index: 999;
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(10px);
        border: 1px solid var(--border-light);
        border-radius: 30px;
        padding: 6px 14px;
        font-family: 'Noto Serif JP', serif;
        font-size: 0.7rem;
        display: flex;
        gap: 10px;
        cursor: pointer;
        transition: 0.4s;
    }

    html.dark .zen-toggle {
        background: rgba(20,22,24,0.9);
        color: #E6E6E6;
    }

    .zen-toggle span {
        opacity: 0.4;
    }

    html.light .zen-toggle .sun,
    html.dark .zen-toggle .moon {
        opacity: 1;
    }
    `;
    document.head.appendChild(style);


    /* =========================
    4. LOADER CONTROL
    ========================= */
    window.addEventListener('load', () => {
        const loader = document.getElementById('zen-loader');

        setTimeout(() => {
            loader.classList.add('hide');

            setTimeout(() => {
                loader.remove();
            }, 1000);

        }, 1200);
    });


    /* =========================
    5. DARK MODE LOGIC
    ========================= */
    const root = document.documentElement;
    const toggle = document.querySelector('.zen-toggle');

    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem('zen-mode');

    if (savedMode) {
        root.classList.add(savedMode);
    } else {
        root.classList.add(systemDark ? 'dark' : 'light');
    }

    toggle.addEventListener('click', () => {
        if (root.classList.contains('dark')) {
            root.classList.replace('dark', 'light');
            localStorage.setItem('zen-mode', 'light');
        } else {
            root.classList.replace('light', 'dark');
            localStorage.setItem('zen-mode', 'dark');
        }
    });

})();

/* =========================
FAKE → REAL RESPONSE TIME
ULTRA SMOOTH ANIMATION
========================= */

(function () {
    const el = document.getElementById('response-time');
    if (!el) return;

    let displayed = 0;

    function animateTo(target) {
        const start = displayed;
        const duration = 1200; // smooth duration
        const startTime = performance.now();

        function frame(now) {
            const progress = Math.min((now - startTime) / duration, 1);

            // ease-out cubic (feels premium)
            const ease = 1 - Math.pow(1 - progress, 3);

            displayed = start + (target - start) * ease;

            el.textContent = displayed.toFixed(1) + ' ms';

            if (progress < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    async function updateResponseTimeSmooth() {
        const start = performance.now();

        try {
            await fetch('https://jsonplaceholder.typicode.com/todos/1?cache=' + Date.now(), {
                cache: 'no-store'
            });

            const real = performance.now() - start;

            // Clamp for realism (avoid weird spikes)
            const realistic = Math.max(8, Math.min(real, 120));

            // Start from near-zero illusion
            displayed = Math.random() * 2;

            animateTo(realistic);

        } catch {
            el.textContent = '-- ms';
        }
    }

    // Initial fake fast feel
    el.textContent = '0.0 ms';

    setTimeout(updateResponseTimeSmooth, 600);
    setInterval(updateResponseTimeSmooth, 4000);

})();

/* =========================
NEXT LEVEL RESPONSE UI
(SMOOTH + STATUS + VISUAL FX)
========================= */

(function () {
    const el = document.getElementById('response-time');
    if (!el) return;

    /* =========================
    CREATE STATUS ELEMENT
    ========================= */
    const status = document.createElement('div');
    status.style.fontSize = '0.6rem';
    status.style.opacity = '0.6';
    status.style.marginTop = '4px';
    status.style.letterSpacing = '1px';
    status.style.transition = 'all 0.4s ease';
    el.parentNode.appendChild(status);

    /* =========================
    INTERNAL STATE
    ========================= */
    let displayed = 0;

    function getStatus(ms) {
        if (ms < 30) return { text: '⚡ ULTRA FAST', color: '#4CAF50' };
        if (ms < 70) return { text: '✓ STABLE', color: '#2196F3' };
        if (ms < 120) return { text: '● NORMAL', color: '#FFC107' };
        return { text: '▲ SLOW', color: '#F44336' };
    }

    function animateTo(target) {
        const start = displayed;
        const duration = 1000;
        const startTime = performance.now();

        function frame(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            displayed = start + (target - start) * ease;

            el.textContent = displayed.toFixed(1) + ' ms';

            if (progress < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    function applyVisualFX(ms) {
        const parent = el.closest('.osaka-time-box');

        // subtle glow effect
        parent.style.transition = 'all 0.6s ease';

        if (ms < 30) {
            parent.style.boxShadow = '0 0 20px rgba(76,175,80,0.15)';
        } else if (ms < 70) {
            parent.style.boxShadow = '0 0 15px rgba(33,150,243,0.12)';
        } else if (ms < 120) {
            parent.style.boxShadow = '0 0 12px rgba(255,193,7,0.10)';
        } else {
            parent.style.boxShadow = '0 0 18px rgba(244,67,54,0.15)';
        }
    }

    async function update() {
        const start = performance.now();

        try {
            await fetch('https://jsonplaceholder.typicode.com/todos/1?cache=' + Date.now(), {
                cache: 'no-store'
            });

            const real = performance.now() - start;

            // clamp for realism
            const ms = Math.max(8, Math.min(real, 150));

            // start illusion
            displayed = Math.random() * 3;

            animateTo(ms);

            const s = getStatus(ms);
            status.textContent = s.text;
            status.style.color = s.color;

            applyVisualFX(ms);

        } catch {
            el.textContent = '-- ms';
            status.textContent = 'OFFLINE';
            status.style.color = '#999';
        }
    }

    /* =========================
    INIT
    ========================= */
    el.textContent = '0.0 ms';
    status.textContent = 'INITIALIZING...';

    setTimeout(update, 800);
    setInterval(update, 4000);

})();

/* =========================
ULTIMATE UI MODE
(GRAPH + GLASS + TREND + SYNC)
========================= */

(function () {
    const el = document.getElementById('response-time');
    const box = document.querySelector('.osaka-time-box');
    if (!el || !box) return;

    /* =========================
    GLASS EFFECT
    ========================= */
    box.style.backdropFilter = 'blur(10px)';
    box.style.webkitBackdropFilter = 'blur(10px)';
    box.style.background = 'rgba(255,255,255,0.4)';
    box.style.borderRadius = '12px';
    box.style.padding = '12px';

    if (document.documentElement.classList.contains('dark')) {
        box.style.background = 'rgba(20,22,24,0.4)';
    }

    /* =========================
    CREATE GRAPH CANVAS
    ========================= */
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 40;
    canvas.style.marginTop = '8px';
    canvas.style.opacity = '0.7';
    box.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    let history = [];

    function drawGraph() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (history.length < 2) return;

        ctx.beginPath();
        ctx.lineWidth = 1.5;

        for (let i = 0; i < history.length; i++) {
            const x = (i / (history.length - 1)) * canvas.width;
            const y = canvas.height - (history[i] / 150) * canvas.height;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#BC002D';
        ctx.stroke();
    }

    /* =========================
    TREND INDICATOR
    ========================= */
    const trend = document.createElement('div');
    trend.style.fontSize = '0.6rem';
    trend.style.marginTop = '3px';
    trend.style.opacity = '0.6';
    box.appendChild(trend);

    function updateTrend() {
        if (history.length < 2) return;

        const last = history[history.length - 1];
        const prev = history[history.length - 2];

        if (last < prev) {
            trend.textContent = '↘ improving';
            trend.style.color = '#4CAF50';
        } else if (last > prev) {
            trend.textContent = '↗ rising';
            trend.style.color = '#F44336';
        } else {
            trend.textContent = '→ stable';
            trend.style.color = '#999';
        }
    }

    /* =========================
    BREATHING ANIMATION
    ========================= */
    setInterval(() => {
        box.style.transform = 'scale(1.01)';
        setTimeout(() => {
            box.style.transform = 'scale(1)';
        }, 600);
    }, 4000);

    /* =========================
    LOADER SYNC (START EARLY)
    ========================= */
    let displayed = 0;

    function animateTo(target) {
        const start = displayed;
        const duration = 900;
        const startTime = performance.now();

        function frame(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            displayed = start + (target - start) * ease;

            el.textContent = displayed.toFixed(1) + ' ms';

            if (progress < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    async function update() {
        const start = performance.now();

        try {
            await fetch('https://jsonplaceholder.typicode.com/todos/1?cache=' + Date.now(), {
                cache: 'no-store'
            });

            const real = performance.now() - start;
            const ms = Math.max(8, Math.min(real, 150));

            displayed = Math.random() * 2;
            animateTo(ms);

            // push to history
            history.push(ms);
            if (history.length > 20) history.shift();

            drawGraph();
            updateTrend();

        } catch {
            el.textContent = '-- ms';
        }
    }

    /* =========================
    INIT (SYNC WITH LOADER)
    ========================= */
    el.textContent = '0.0 ms';
    history = [];

    setTimeout(update, 500);
    setInterval(update, 3500);

})();
