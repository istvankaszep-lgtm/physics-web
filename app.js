/* ============================================================
   ⚛️ EVERYDAY PHYSICS - BROWSER CLIENT SCRIPT
   ============================================================ */

// State
let currentLang = 'en';
let originalTexts = new Map();
let currentLessonData = null;
let isTranslating = false;

// Locales mapping for multilingual date rendering
const LANG_LOCALES = {
    en: 'en-US',
    hu: 'hu-HU',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    ro: 'ro-RO',
    pl: 'pl-PL',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ko: 'ko-KR',
    pt: 'pt-BR'
};

// ============================================================
// DATE HELPERS (DYNAMIC MULTILINGUAL DATES)
// ============================================================
function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayOfYear() {
    const now = new Date();
    return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}

function updateFormattedDate(lang = 'en') {
    const locale = LANG_LOCALES[lang] || 'en-US';
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString(locale, options);
    }
}

// ============================================================
// DATA FETCHING (API WITH PERSISTENT BROWSER CACHE)
// ============================================================
async function fetchDailyLesson() {
    const today = getTodayString();
    const cacheKey = 'everyday_physics_lesson_' + today;

    // 1. Check browser cache first for instant zero-latency loading
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.title && parsed.body) {
                return parsed;
            }
        }
    } catch (e) {}

    // 2. Fetch from the server (generous 25s timeout to let Gemini finish without premature fallback)
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        const res = await fetch('/api/lesson', { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            const json = await res.json();
            if (json && json.data && json.data.title) {
                // Save to localStorage for instant subsequent loads
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(json.data));
                } catch (e) {}
                return json.data;
            }
        }
    } catch (err) {
        console.warn('Network issue fetching daily lesson:', err.message);
    }

    // 3. Last-resort fallback only if completely disconnected
    const day = getDayOfYear();
    return {
        icon: "🍎",
        category: "Classical Mechanics",
        title: "Newton's First Law — The Principle of Inertia",
        lessonNumber: day + 1,
        body: `<p>Sir Isaac Newton's <strong>First Law of Motion</strong>, also known as the <strong>Law of Inertia</strong>, states: every object continues in its state of rest, or of uniform motion in a straight line, unless compelled to change that state by forces impressed upon it.</p>
<p>This means that maintaining motion requires <strong>no force at all</strong>! In our daily lives, sliding objects eventually stop only because invisible resistive forces — namely <strong>friction and air drag</strong> — continuously rob them of kinetic energy.</p>
<p>When a vehicle brakes abruptly, your body lurches forward: your inertia attempts to preserve your forward speed. This is why seatbelts are essential and life-saving!</p>`,
        funFact: "The true measure of inertia is mass: the greater an object's mass, the more resistant it is to acceleration. A 100,000-ton cargo vessel can take up to 8 kilometers to come to a complete halt after its engines stop!",
        project: {
            icon: "🪙",
            title: "The Obedient Coin (Inertia Experiment)",
            difficulty: "Easy (5 mins)",
            materials: ["1 drinking glass", "1 rigid index card or coaster", "1 coin"],
            steps: [
                "Place the rigid card horizontally over the top of the glass.",
                "Position the coin in the middle of the card, directly above the opening.",
                "Flick the card horizontally with a sharp, brisk finger snap.",
                "Watch: the card flies away, while the coin drops straight into the glass!"
            ],
            explanation: "The flick accelerates only the card. The coin's inertia keeps it stationary momentarily, and gravity pulls it straight down into the glass."
        }
    };
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderLesson(data) {
    if (!data) return;
    document.getElementById('lessonIcon').textContent = data.icon || '⚡';
    document.getElementById('lessonCategory').textContent = data.category || 'Physics';
    document.getElementById('lessonTitle').textContent = data.title || 'Daily Lesson';
    document.getElementById('lessonNumber').textContent = `#${data.lessonNumber || (getDayOfYear() + 1)}`;
    document.getElementById('lessonBody').innerHTML = data.body || '';
    document.getElementById('funfactText').innerHTML = data.funFact || '';
}

function renderProject(project) {
    if (!project) return;
    document.getElementById('projectIcon').textContent = project.icon || '🧪';
    document.getElementById('projectTitle').textContent = project.title || 'Daily Project';
    document.getElementById('projectDifficulty').textContent = project.difficulty || 'Easy';

    const materialsList = document.getElementById('projectMaterials');
    if (project.materials && Array.isArray(project.materials)) {
        materialsList.innerHTML = project.materials.map(m => `<li>✦ ${escapeHtml(m)}</li>`).join('');
    }

    const stepsList = document.getElementById('projectSteps');
    if (project.steps && Array.isArray(project.steps)) {
        stepsList.innerHTML = project.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    }

    document.getElementById('projectExplanation').innerHTML = project.explanation || '';
}

// ============================================================
// TRANSLATION SYSTEM
// ============================================================
function collectTranslatableElements() {
    const selectors = [
        '#lessonCategory', '#lessonTitle', '#lessonBody',
        '#funfactText', '#projectTitle', '#projectDifficulty',
        '#projectMaterials', '#projectSteps', '#projectExplanation',
        '[data-i18n]'
    ];
    const elements = [];
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (!originalTexts.has(el)) {
                originalTexts.set(el, el.innerHTML);
            }
            elements.push(el);
        });
    });
    return elements;
}

async function translatePage(targetLang) {
    // 1. Immediately update date format and day/month names to match the selected language
    updateFormattedDate(targetLang);

    // 2. If English is selected, restore pristine original text immediately
    if (targetLang === 'en') {
        originalTexts.forEach((html, el) => {
            el.innerHTML = html;
        });
        currentLang = 'en';
        return;
    }

    if (isTranslating) return;
    isTranslating = true;

    const overlay = document.getElementById('translateOverlay');
    overlay.classList.add('visible');

    try {
        const elements = collectTranslatableElements();
        const textsToTranslate = elements.map(el => originalTexts.get(el) || el.innerHTML);

        const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                texts: textsToTranslate,
                targetLang: targetLang
            })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.translated && Array.isArray(data.translated)) {
                elements.forEach((el, index) => {
                    if (data.translated[index]) {
                        el.innerHTML = data.translated[index];
                    }
                });
                currentLang = targetLang;
            }
        } else {
            showToast('Translation service unavailable. Please try again later.');
        }
    } catch (err) {
        console.error('Translation error:', err);
        showToast('Network error during translation.');
    } finally {
        isTranslating = false;
        overlay.classList.remove('visible');
    }
}

// ============================================================
// UI NAVIGATION & INTERACTIVITY
// ============================================================
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

            if (targetTab === 'lesson') {
                document.getElementById('lessonContent').classList.add('active');
            } else if (targetTab === 'project') {
                document.getElementById('projectContent').classList.add('active');
            } else if (targetTab === 'nasa') {
                document.getElementById('nasaContent').classList.add('active');
                loadNasaNewsOnce();
            }
        });
    });
}

function setupLanguageSelector() {
    const btn = document.getElementById('langBtn');
    const dropdown = document.getElementById('langDropdown');

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.toggle('open');
        dropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        btn.classList.remove('open');
        dropdown.classList.remove('open');
    });

    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', async () => {
            const lang = option.dataset.lang;

            document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');

            document.getElementById('currentLang').textContent = option.textContent.trim().replace(/^[^\s]+\s+/, '');
            btn.classList.remove('open');
            dropdown.classList.remove('open');

            await translatePage(lang);
        });
    });
}

function showToast(message) {
    const toast = document.getElementById('errorToast');
    const toastText = document.getElementById('toastText');
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 4000);
}

// ============================================================
// ANIMATED PARTICLE BACKGROUND
// ============================================================
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = Math.min(70, Math.floor((canvas.width * canvas.height) / 16000));
        const colors = ['#4f8fff', '#8b5cf6', '#06d6a0', '#ff6b9d'];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.8,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: (Math.random() - 0.5) * 0.4,
                opacity: Math.random() * 0.5 + 0.15,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.fill();
        });

        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    ctx.globalAlpha = 0.06 * (1 - dist / 110);
                    ctx.strokeStyle = '#4f8fff';
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });
}

// ============================================================
// NASA NEWS LOADING & RENDERING
// ============================================================
let nasaNewsLoaded = false;

async function loadNasaNewsOnce() {
    if (nasaNewsLoaded) return;
    nasaNewsLoaded = true;

    const loadingEl = document.getElementById('nasaLoading');
    const listEl = document.getElementById('nasaNewsList');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch('/api/nasa-news', { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json();
            if (data.success && data.articles && data.articles.length > 0) {
                renderNasaNews(data.articles);
            } else {
                listEl.innerHTML = '<div class="nasa-error">🛸 NASA news currently unavailable. Please try again later!</div>';
            }
        } else {
            listEl.innerHTML = '<div class="nasa-error">🛸 NASA news currently unavailable. Please try again later!</div>';
        }
    } catch (err) {
        console.error('NASA news fetch error:', err);
        listEl.innerHTML = '<div class="nasa-error">🛸 Network error fetching NASA news. Check your connection!</div>';
    } finally {
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    }
}

function renderNasaNews(articles) {
    const listEl = document.getElementById('nasaNewsList');
    if (!listEl) return;

    listEl.innerHTML = articles.map(article => {
        let dateStr = '';
        if (article.pubDate) {
            try {
                const d = new Date(article.pubDate);
                if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString(LANG_LOCALES[currentLang] || 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } else {
                    dateStr = article.pubDate;
                }
            } catch (e) {
                dateStr = article.pubDate;
            }
        }

        const imageHtml = article.image
            ? `<div class="nasa-news-image" style="background-image: url('${article.image}')"></div>`
            : '';

        return `
        <div class="nasa-news-card">
            <div class="nasa-news-card-inner">
                ${imageHtml}
                <div class="nasa-news-body">
                    <div>
                        ${dateStr ? `<div class="nasa-news-date">📅 ${dateStr}</div>` : ''}
                        <h3 class="nasa-news-title">${escapeHtml(article.title)}</h3>
                        ${article.description ? `<p class="nasa-news-summary">${escapeHtml(article.description)}</p>` : ''}
                    </div>
                    <a href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer" class="nasa-news-link" data-i18n-skip>
                        Read on NASA.gov
                    </a>
                </div>
            </div>
        </div>`;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// APP INITIALIZATION
// ============================================================
async function initApp() {
    // 1. Render default English date
    updateFormattedDate('en');

    // 2. Setup UI
    setupTabs();
    setupLanguageSelector();
    initParticles();

    // 3. Load lesson with graceful loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');

    try {
        currentLessonData = await fetchDailyLesson();
        renderLesson(currentLessonData);
        if (currentLessonData && currentLessonData.project) {
            renderProject(currentLessonData.project);
        }
        // Cache original English texts for instant reverse translation
        collectTranslatableElements();
    } catch (e) {
        console.error('Initialization error:', e);
    } finally {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', initApp);
