const path = require('path');
const fs = require('fs');

// Környezeti változók betöltése (.env) dotenv-vel vagy közvetlen fájlolvasással
try {
    require('dotenv').config();
} catch (e) {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const eqIdx = trimmed.indexOf('=');
                    if (eqIdx > 0) {
                        const key = trimmed.slice(0, eqIdx).trim();
                        const val = trimmed.slice(eqIdx + 1).trim();
                        if (!process.env[key]) {
                            process.env[key] = val;
                        }
                    }
                }
            });
        }
    } catch (err) {}
}

const express = require('express');
const cors = require('cors');

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
let PORT = process.env.PORT || 3000;

if (PORT === '0.0.0.0') {
    PORT = 3000;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
    console.warn('[Warning] GEMINI_API_KEY is not set in .env! Built-in lessons will be used.');
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// ============================================================
// PERMANENT FILE CACHE DIRECTORY
// ============================================================
const CACHE_DIR = path.join(__dirname, '.cache');
if (!fs.existsSync(CACHE_DIR)) {
    try {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    } catch (e) {}
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayOfYear() {
    const now = new Date();
    return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}

// ============================================================
// BUILT-IN HIGH QUALITY ENGLISH LESSONS (FALLBACK)
// ============================================================
const BUILTIN_LESSONS = [
    {
        icon: "🍎",
        category: "Classical Mechanics",
        title: "Newton's First Law — The Principle of Inertia",
        body: `<p>Sir Isaac Newton's <strong>First Law of Motion</strong>, also known as the <strong>Law of Inertia</strong>, states: every object continues in its state of rest, or of uniform motion in a straight line, unless compelled to change that state by forces impressed upon it.</p>
<p>This means that maintaining motion requires <strong>no force at all</strong>! In our daily lives, sliding objects eventually stop only because invisible resistive forces — namely <strong>friction and air drag</strong> — continuously rob them of kinetic energy. In the vacuum of deep space, an object kicked into the void travels forever at constant speed.</p>
<p>When a car or bus brakes abruptly, your body lurches forward: your inertia attempts to preserve your previous forward velocity. This fundamental principle is why wearing seatbelts is essential and life-saving!</p>`,
        funFact: "The true measure of inertia is mass: the greater an object's mass, the more resistant it is to acceleration. A fully loaded 100,000-ton cargo vessel can take up to 8 kilometers to come to a complete halt after its engines are cut!",
        project: {
            icon: "🪙",
            title: "The Obedient Coin (Inertia in Action)",
            difficulty: "Easy (5 mins)",
            materials: ["1 glass drinking cup", "1 rigid index card or coaster", "1 metal coin"],
            steps: [
                "Place the rigid card horizontally over the mouth of the drinking glass.",
                "Position the coin directly in the center of the card, centered above the opening.",
                "Using your index finger, flick the card horizontally with a brisk, sharp snap.",
                "Observe: the card flies away laterally, while the coin drops straight into the glass!"
            ],
            explanation: "The horizontal flick accelerates only the card underneath. The coin's inertia keeps it stationary in space momentarily, and once the supporting surface disappears, gravity pulls it directly into the cup."
        }
    },
    {
        icon: "⚡",
        category: "Classical Dynamics",
        title: "Newton's Second Law — F = m · a",
        body: `<p>Newton's <strong>Second Law of Motion</strong> provides the fundamental mathematical foundation for all classical dynamics:</p>
<div class="formula-block">F = m · a</div>
<p>Where <span class="formula">F</span> denotes the net applied force (measured in Newtons, N), <span class="formula">m</span> is the mass of the object (in kilograms, kg), and <span class="formula">a</span> is the resulting acceleration (in m/s²).</p>
<p>This equation indicates that doubling the net force on an object doubles its acceleration. Conversely, doubling the object's mass halves the acceleration produced by that identical force.</p>
<p>High-performance racecars exploit this relationship ruthlessly: designers both maximize engine thrust (<span class="formula">F</span>) and strip out unnecessary weight using carbon composites (<span class="formula">m</span>) to maximize instantaneous acceleration.</p>`,
        funFact: "One Newton of force corresponds roughly to the gravitational force exerted on an average-sized apple held in your hand on Earth's surface — a fitting tribute to Isaac Newton's legendary apple story!",
        project: {
            icon: "🎈",
            title: "Hallway Balloon Rocket",
            difficulty: "Easy (10 mins)",
            materials: ["1 long balloon", "1 plastic drinking straw", "3-5 meters of string", "Adhesive tape"],
            steps: [
                "Thread the string through the straw, then tie both ends tightly between two chairs or door handles.",
                "Inflate the balloon, but do NOT tie the neck — simply hold it closed with your fingers.",
                "Tape the inflated balloon securely along the underside of the straw, with its nozzle facing one end.",
                "Release your fingers and watch the balloon rocket dash across the string at astonishing speed!"
            ],
            explanation: "Pressurized air escaping backward exerts an equal and opposite forward reaction force on the balloon. Because the balloon's total mass is tiny, this thrust produces an explosive forward acceleration."
        }
    },
    {
        icon: "🌊",
        category: "Fluid Dynamics",
        title: "Archimedes' Principle and Buoyancy",
        body: `<p>Any object completely or partially submerged in a fluid is buoyed upward by a force termed the <strong>buoyant force</strong>. This principle was formulated by the ancient Greek mathematician Archimedes over 2,200 years ago.</p>
<div class="formula-block">F_buoyant = ρ · V · g</div>
<p>The law states: the upward buoyant force is exactly equal to the <strong>weight of the fluid displaced by the object</strong>. If this buoyant force equals or exceeds the object's weight, the object floats on the surface!</p>
<p>This explains how a colossal 100,000-ton steel aircraft carrier floats effortlessly: its hollowed hull displaces a gigantic volume of seawater whose total weight equals the entire vessel's immense mass.</p>`,
        funFact: "Legend holds that Archimedes deduced this while settling into a full bathtub and noticing water spill over the rim. Excited by the epiphany, he sprinted naked through the streets of Syracuse shouting 'Eureka!' (I have found it!).",
        project: {
            icon: "🥚",
            title: "The Floating Egg Enigma",
            difficulty: "Easy (5 mins)",
            materials: ["1 raw egg", "1 tall glass of tap water", "4-5 tablespoons of table salt", "Spoon for stirring"],
            steps: [
                "Gently place the egg into the plain tap water: notice that it promptly sinks straight to the bottom.",
                "Remove the egg and stir in 4-5 tablespoons of salt until completely dissolved.",
                "Gently re-introduce the egg into the saline solution.",
                "Marvel at the result: the egg now stays suspended and floats near the top!"
            ],
            explanation: "Dissolving salt dramatically increases the density of the water. Once the fluid's density surpasses the average density of the egg, the weight of the displaced liquid exceeds the egg's weight, lifting it to the surface."
        }
    }
];

function getDailyLessonLocal() {
    const day = getDayOfYear();
    const template = BUILTIN_LESSONS[day % BUILTIN_LESSONS.length];
    return {
        ...template,
        lessonNumber: day + 1
    };
}

// ============================================================
// GEMINI API CALL FOR DAILY LESSON (ENGLISH)
// ============================================================
async function fetchFromGemini() {
    const dayOfYear = getDayOfYear();
    const topics = [
        "Newton's Laws of Motion", "Gravity and Planetary Orbits", "Bernoulli's Principle and Aerodynamics",
        "Speed of Sound and the Doppler Effect", "Conservation of Energy", "Dual Nature of Light and Photons",
        "Static Electricity and Lightning", "Thermal Expansion and States of Matter", "Resonance in Structures and Sound",
        "Surface Tension and Capillary Action", "Physics of Black Holes and Spacetime", "Refraction, Lenses and Total Internal Reflection",
        "Electromagnetic Induction and Faraday's Law", "Cosmic Rays and Atmospheric Showers", "Friction and Everyday Forces",
        "Centripetal Force and Rotational Motion", "The Laws of Thermodynamics", "Quantum Superposition Basics",
        "Atmospheric Pressure and Barometers", "Wave Interference and Standing Waves"
    ];
    const topic = topics[dayOfYear % topics.length];

    const prompt = `Write a comprehensive, engaging, and scientifically accurate physics lesson in English about: "${topic}".
Respond ONLY with a valid JSON object matching this exact structure:
{
  "icon": "1 relevant emoji",
  "category": "physics branch (e.g. Classical Mechanics, Thermodynamics, Optics, Astrophysics)",
  "title": "Engaging lesson title in English",
  "lessonNumber": ${dayOfYear + 1},
  "body": "Lesson content in clean HTML: at least 3 detailed, informative paragraphs enclosed in <p> tags. Use <strong> for critical physics terms. If relevant, include an inline formula with <span class='formula'>E = mc²</span> or a prominent block with <div class='formula-block'>F = m · a</div>.",
  "funFact": "2-3 surprising, mind-blowing sentences about this topic.",
  "project": {
    "icon": "1 relevant emoji",
    "title": "Creative home experiment title in English",
    "difficulty": "Easy (5-10 mins)",
    "materials": ["common household item 1", "common household item 2", "common household item 3"],
    "steps": ["Step 1 clearly explained", "Step 2 clearly explained", "Step 3 clearly explained", "Step 4 clearly explained"],
    "explanation": "2-3 clear sentences explaining the physics behind why this experiment works."
  }
}`;

    // Fast, reliable models in priority order
    const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

    for (const model of models) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000); // 12 seconds per model

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        responseMimeType: "application/json"
                    }
                })
            });

            clearTimeout(timeout);

            if (response.ok) {
                const data = await response.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawText) {
                    const parsed = JSON.parse(rawText);
                    if (parsed && parsed.title && parsed.body) {
                        return parsed;
                    }
                }
            } else {
                console.log(`[Gemini] ${model} HTTP ${response.status}`);
            }
        } catch (err) {
            console.log(`[Gemini] ${model} error: ${err.message}`);
        }
    }

    throw new Error('All Gemini model calls failed');
}

// ============================================================
// SOLID DUAL-LAYER CACHE (IN-MEMORY + DISK)
// ============================================================
let inMemoryLesson = null;
let inMemoryDate = '';
let activeLessonPromise = null;

async function getOrFetchDailyLesson() {
    const today = getTodayString();
    const cacheFilePath = path.join(CACHE_DIR, `lesson_${today}.json`);

    // 1. In-memory cache: fastest and identical for all connected devices
    if (inMemoryLesson && inMemoryDate === today) {
        return { success: true, source: 'memory_cache', data: inMemoryLesson, date: today };
    }

    // 2. Persistent disk cache
    if (fs.existsSync(cacheFilePath)) {
        try {
            const raw = fs.readFileSync(cacheFilePath, 'utf8');
            const data = JSON.parse(raw);
            if (data && data.title && data.body) {
                inMemoryLesson = data;
                inMemoryDate = today;
                return { success: true, source: 'disk_cache', data, date: today };
            }
        } catch (e) {}
    }

    // 3. If an API request is already in-flight, await the same promise (deduplication)
    if (activeLessonPromise) {
        const data = await activeLessonPromise;
        return { success: true, source: 'gemini_shared', data, date: today };
    }

    // 4. Initiate single Gemini fetch
    activeLessonPromise = (async () => {
        try {
            console.log(`[API] Generating daily lesson with Gemini AI for ${today}...`);
            const lesson = await fetchFromGemini();
            // Store immediately in memory so every device gets the exact same lesson
            inMemoryLesson = lesson;
            inMemoryDate = today;
            // Also save to disk
            try {
                fs.writeFileSync(cacheFilePath, JSON.stringify(lesson, null, 2), 'utf8');
                console.log(`[Cache] Successfully cached lesson for ${today}`);
            } catch (wErr) {
                console.warn('[Cache Write Note]', wErr.message);
            }
            return lesson;
        } finally {
            activeLessonPromise = null;
        }
    })();

    try {
        const lesson = await activeLessonPromise;
        return { success: true, source: 'gemini', data: lesson, date: today };
    } catch (error) {
        console.log(`[API] Gemini API unavailable (${error.message}). Using built-in lesson.`);
        const fallback = getDailyLessonLocal();
        inMemoryLesson = fallback;
        inMemoryDate = today;
        return { success: true, source: 'builtin', data: fallback, date: today };
    }
}

// ============================================================
// API ENDPOINTS
// ============================================================

// Daily lesson endpoint
app.get('/api/lesson', async (req, res) => {
    try {
        const result = await getOrFetchDailyLesson();
        return res.json({ success: true, source: result.source, data: result.data, date: result.date });
    } catch (error) {
        const fallback = getDailyLessonLocal();
        return res.json({ success: true, source: 'builtin', data: fallback, date: getTodayString() });
    }
});

// Translation endpoint (translates from English to targetLang)
app.post('/api/translate', async (req, res) => {
    const { texts, targetLang } = req.body;
    if (!texts || !Array.isArray(texts) || !targetLang) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    // English is the primary source language
    if (targetLang === 'en') {
        return res.json({ translated: texts });
    }

    const langNames = {
        hu: 'Hungarian', de: 'German', fr: 'French', es: 'Spanish',
        it: 'Italian', ro: 'Romanian', pl: 'Polish', ja: 'Japanese',
        zh: 'Simplified Chinese', ko: 'Korean', pt: 'Portuguese'
    };

    const targetName = langNames[targetLang] || targetLang;

    try {
        const prompt = `You are a professional science translator. Translate the following array of HTML and text strings from English into ${targetName}.
Keep all HTML tags (such as <p>, <strong>, <span class="formula">, <div class="formula-block">, <a>) completely untouched!
Return ONLY a valid JSON array of translated strings with the exact same length and order:
${JSON.stringify(texts)}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json"
                }
            })
        });

        clearTimeout(timeout);

        if (response.ok) {
            const data = await response.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (raw) {
                const translatedArr = JSON.parse(raw);
                if (Array.isArray(translatedArr) && translatedArr.length === texts.length) {
                    return res.json({ translated: translatedArr });
                }
            }
        }
    } catch (e) {
        console.log(`[Translate] Error: ${e.message}`);
    }

    // Fallback: return originals if translation failed
    return res.json({ translated: texts });
});

// Server health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ============================================================
// NASA NEWS (RSS FEED PARSING)
// ============================================================
let cachedNasaNews = null;
let cachedNasaTime = 0;
const NASA_CACHE_MS = 30 * 60 * 1000; // 30 mins cache

function cleanHtmlEntities(text) {
    if (!text) return '';
    return text
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#038;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

function parseNasaRss(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
        const block = match[1];

        const getTag = (tag) => {
            const r = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${tag}>`, 'i');
            const m = block.match(r);
            return m ? m[1].trim() : '';
        };

        const title = cleanHtmlEntities(getTag('title'));
        const link = getTag('link');
        const description = cleanHtmlEntities(getTag('description'));
        const pubDate = getTag('pubDate');

        let image = '';
        const enclosureMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
        if (enclosureMatch) {
            image = enclosureMatch[1].replace(/&#038;/g, '&');
        } else {
            const mediaMatch = block.match(/<media:content[^>]+url=["']([^"']+)["']/i);
            if (mediaMatch) image = mediaMatch[1].replace(/&#038;/g, '&');
        }
        if (!image) {
            const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) image = imgMatch[1].replace(/&#038;/g, '&');
        }

        if (title && link) {
            items.push({
                title,
                link,
                description: description.slice(0, 300),
                pubDate,
                image
            });
        }
    }
    return items;
}

app.get('/api/nasa-news', async (req, res) => {
    const now = Date.now();

    if (cachedNasaNews && (now - cachedNasaTime) < NASA_CACHE_MS) {
        return res.json({ success: true, source: 'cache', articles: cachedNasaNews });
    }

    const feeds = [
        'https://www.nasa.gov/rss/dyn/breaking_news.rss',
        'https://www.nasa.gov/news-release/feed/',
        'https://www.nasa.gov/feed/'
    ];

    for (const feedUrl of feeds) {
        try {
            console.log(`[NASA] Fetching RSS feed: ${feedUrl}`);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(feedUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'EverydayPhysics/1.0 (Educational Science Website)',
                    'Accept': 'application/rss+xml, application/xml, text/xml'
                }
            });
            clearTimeout(timeout);

            if (response.ok) {
                const xml = await response.text();
                const articles = parseNasaRss(xml);
                if (articles.length > 0) {
                    cachedNasaNews = articles;
                    cachedNasaTime = now;
                    console.log(`[NASA] Loaded ${articles.length} news articles from ${feedUrl}`);
                    return res.json({ success: true, source: feedUrl, articles });
                }
            }
        } catch (err) {
            console.log(`[NASA] ${feedUrl} error: ${err.message}`);
        }
    }

    return res.status(503).json({ success: false, error: 'NASA news feed currently unavailable.' });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================
// SERVER INITIALIZATION & BACKGROUND WARMUP
// ============================================================
app.listen(PORT, HOST, () => {
    console.log(`========================================`);
    console.log(`⚛️ Everyday Physics Server started!`);
    console.log(`🌐 Listening on: http://${HOST}:${PORT}`);
    console.log(`📡 Remote access: http://SERVER_IP:${PORT}`);
    console.log(`========================================`);

    // Warm up the daily lesson in the background immediately!
    setTimeout(() => {
        console.log('[Warmup] Pre-fetching today\'s lesson in the background...');
        getOrFetchDailyLesson().catch(err => console.log('[Warmup Note]', err.message));
    }, 500);
});
