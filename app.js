/* ============================================================
   NAPI FIZIKA - BÖNGÉSZŐ KLIENS SCRIPT
   ============================================================ */

// Állapotváltozók
let currentLang = 'hu';
let originalTexts = new Map();
let currentLessonData = null;
let isTranslating = false;

// ============================================================
// DÁTUM SEGÉDFÜGGVÉNYEK
// ============================================================
function getFormattedDate() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date().toLocaleDateString('hu-HU', options);
}

function getDayOfYear() {
    const now = new Date();
    return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}

// ============================================================
// ADATLEKÉRÉS (SZERVER API VAGY HELYI TARTALÉK)
// ============================================================
async function fetchDailyLesson() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 mp max

        const res = await fetch('/api/lesson', { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            const json = await res.json();
            if (json && json.data) {
                return json.data;
            }
        }
    } catch (err) {
        console.warn('Nem sikerült elérni a /api/lesson végpontot, tartalék lecke betöltése:', err.message);
    }

    // Kliensoldali azonnali tartalék lecke ha a szerver nem válaszolna
    const day = getDayOfYear();
    return {
        icon: "🍎",
        category: "Klasszikus Mechanika",
        title: "Newton I. törvénye — A Tehetetlenség Elve",
        lessonNumber: day + 1,
        body: `<p>Sir Isaac Newton <strong>első mozgástörvénye</strong>, a tehetetlenség elve kimondja: minden test mindaddig megőrzi nyugalmi állapotát vagy egyenes vonalú egyenletes mozgását, amíg egy külső erő arra nem kényszeríti, hogy állapotát megváltoztassa.</p>
<p>Ez azt jelenti, hogy a mozgás fenntartásához valójában <strong>nincs szükség erőre</strong>! A hétköznapokban azért állnak meg az elgurított tárgyak, mert a láthatatlan <strong>súrlódás és a légellenállás</strong> folyamatosan fékezi őket.</p>
<p>Amikor a busz vagy autó hirtelen fékez, a tested előrelendül: a tehetetlenséged miatt tovább akarsz haladni az eddigi sebességgel. Ezért kötelező és életmentő a biztonsági öv használata!</p>`,
        funFact: "A tehetetlenség mértéke a tömeg: minél nagyobb egy test tömege, annál nehezebb megváltoztatni a mozgását. Egy 100 000 tonnás teherhajónak akár 5-8 kilométerre is szüksége van a teljes megálláshoz a motorok leállítása után!",
        project: {
            icon: "🪙",
            title: "Az engedelmes érme (Tehetetlenségi kísérlet)",
            difficulty: "Könnyű (5 perc)",
            materials: ["1 db üvegpohár", "1 db merev kartonlap vagy névjegykártya", "1 db érme"],
            steps: [
                "Helyezd a kartonlapot a pohár szájára.",
                "Tedd az érmét a karton közepére, pontosan a pohár nyílása fölé.",
                "Egy határozott, vízszintes pöccintéssel üsd el a kartonlapot az ujjaddal.",
                "Figyeld meg: a kartonlap kirepül, de az érme egyenesen belepottyan a pohárba!"
            ],
            explanation: "A pöccintés csak a kartonlapot gyorsítja fel oldalirányba. Az érme a tehetetlensége miatt a helyén maradna, és mivel a karton eltűnt alóla, a gravitáció egyenesen a pohár aljára rántja."
        }
    };
}

// ============================================================
// MEGJELENÍTŐ FÜGGVÉNYEK (RENDER)
// ============================================================
function renderLesson(data) {
    if (!data) return;
    document.getElementById('lessonIcon').textContent = data.icon || '⚡';
    document.getElementById('lessonCategory').textContent = data.category || 'Fizika';
    document.getElementById('lessonTitle').textContent = data.title || 'Napi Lecke';
    document.getElementById('lessonNumber').textContent = `#${data.lessonNumber || (getDayOfYear() + 1)}`;
    document.getElementById('lessonBody').innerHTML = data.body || '';
    document.getElementById('funfactText').innerHTML = data.funFact || '';
}

function renderProject(project) {
    if (!project) return;
    document.getElementById('projectIcon').textContent = project.icon || '🧪';
    document.getElementById('projectTitle').textContent = project.title || 'Napi Projekt';
    document.getElementById('projectDifficulty').textContent = project.difficulty || 'Könnyű';

    const materialsList = document.getElementById('projectMaterials');
    if (project.materials && Array.isArray(project.materials)) {
        materialsList.innerHTML = project.materials.map(m => `<li>✦ ${m}</li>`).join('');
    }

    const stepsList = document.getElementById('projectSteps');
    if (project.steps && Array.isArray(project.steps)) {
        stepsList.innerHTML = project.steps.map(s => `<li>${s}</li>`).join('');
    }

    document.getElementById('projectExplanation').innerHTML = project.explanation || '';
}

// ============================================================
// FORDÍTÁSI RENDSZER
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
    if (targetLang === 'hu') {
        // Eredeti magyar szövegek visszaállítása
        originalTexts.forEach((html, el) => {
            el.innerHTML = html;
        });
        currentLang = 'hu';
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
            showToast('A fordítás nem sikerült. Próbáld újra később!');
        }
    } catch (err) {
        console.error('Fordítási hiba:', err);
        showToast('Hálózati hiba a fordítás közben.');
    } finally {
        isTranslating = false;
        overlay.classList.remove('visible');
    }
}

// ============================================================
// INTERAKTÍV FELÜLET VEZÉRLÉS
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
                // Első alkalommal betöltjük a NASA híreket
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

            document.getElementById('currentLang').textContent = option.textContent.trim();
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
// ANIMÁLT RÉSZECSKÉS HÁTTÉR
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

        // Kapcsolatok rajzolása a közeli pontok között
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
// ALKALMAZÁS INDÍTÁSA
// ============================================================
async function initApp() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = getFormattedDate();
    }

    setupTabs();
    setupLanguageSelector();
    initParticles();

    const loadingOverlay = document.getElementById('loadingOverlay');

    try {
        currentLessonData = await fetchDailyLesson();
        renderLesson(currentLessonData);
        if (currentLessonData && currentLessonData.project) {
            renderProject(currentLessonData.project);
        }
    } catch (e) {
        console.error('Hiba az inicializáláskor:', e);
    } finally {
        // Garantáltan eltüntetjük a töltőképernyőt, soha nem ragad be
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', initApp);

// ============================================================
// NASA HÍREK BETÖLTÉSE ÉS MEGJELENÍTÉSE
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
                listEl.innerHTML = '<div class="nasa-error">🛸 Jelenleg nem érhetők el NASA hírek. Próbáld újra később!</div>';
            }
        } else {
            listEl.innerHTML = '<div class="nasa-error">🛸 Jelenleg nem érhetők el NASA hírek. Próbáld újra később!</div>';
        }
    } catch (err) {
        console.error('NASA hírek betöltési hiba:', err);
        listEl.innerHTML = '<div class="nasa-error">🛸 Hálózati hiba. Ellenőrizd az internetkapcsolatot!</div>';
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
        // Dátum formázása
        let dateStr = '';
        if (article.pubDate) {
            try {
                const d = new Date(article.pubDate);
                if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString('hu-HU', {
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

        // Kép megjelenítése (ha van)
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
                        Olvasd el a NASA.gov-on
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
