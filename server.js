const path = require('path');
const fs = require('fs');

// Környezeti változók betöltése (.env) dotenv-vel vagy közvetlen fájlolvasással
try {
    require('dotenv').config();
} catch (e) {
    // Ha a dotenv csomag nincs telepítve, beolvassuk natívan:
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

// Ha a PORT-ba véletlenül a 0.0.0.0 IP címet írták, használjuk azt HOST-ként, és a port legyen 3000
if (PORT === '0.0.0.0') {
    PORT = 3000;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
    console.warn('[Figyelmeztetés] A GEMINI_API_KEY nincs beállítva a .env fájlban! A szerver a beépített fizika leckékkel fog működni.');
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// Cache a napi leckéhez
let cachedLesson = null;
let cachedDate = '';

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayOfYear() {
    const now = new Date();
    return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}

// ============================================================
// BEÉPÍTETT MINŐSÉGI NAPI LECKÉK (GARANTÁLT OFFLINE / FALLBACK MÓD)
// ============================================================
const BUILTIN_LESSONS = [
    {
        icon: "🍎",
        category: "Klasszikus Mechanika",
        title: "Newton I. törvénye — A Tehetetlenség Elve",
        body: `<p>Sir Isaac Newton <strong>első mozgástörvénye</strong>, a tehetetlenség elve kimondja: minden test mindaddig megőrzi nyugalmi állapotát vagy egyenes vonalú egyenletes mozgását, amíg egy külső erő arra nem kényszeríti, hogy állapotát megváltoztassa.</p>
<p>Ez azt jelenti, hogy a mozgás fenntartásához valójában <strong>nincs szükség erőre</strong>! A hétköznapokban azért állnak meg az elgurított tárgyak, mert a láthatatlan <strong>súrlódás és a légellenállás</strong> folyamatosan fékezi őket. A világűr vákuumában egy kilökött űrszonda örökké azonos sebességgel haladna.</p>
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
            explanation: "A pöccintés csak a kartonlapot gyorsítja fel oldalirányba. Az érme a tehetetlensége miatt a helyén maradna, és mivel a karton eltűnt alóla, a nehézségi erő (gravitáció) függőlegesen rántja a pohár aljára."
        }
    },
    {
        icon: "⚡",
        category: "Klasszikus Dinamika",
        title: "Newton II. törvénye — Az Erő és Gyorsulás Alaptörvénye",
        body: `<p>Newton <strong>második törvénye</strong> a fizika talán legismertebb és leggyakrabban használt összefüggése:</p>
<div class="formula-block">F = m · a</div>
<p>Ahol az <span class="formula">F</span> az eredő erő (Newtonban, N), az <span class="formula">m</span> a test tömege (kilogrammban, kg), az <span class="formula">a</span> pedig a gyorsulás (m/s²).</p>
<p>Ez azt jelenti, hogy ha kétszer akkora erőt fejtesz ki ugyanarra a testre, az kétszer gyorsabban fog felgyorsulni. Viszont ha a test tömege kétszer akkora, fele akkora gyorsulást fog elérni ugyanakkora erőtől.</p>
<p>Ez az egyenlet magyarázza a sportautók félelmetes gyorsulását is: vagy hatalmas motorerőt (<span class="formula">F</span>) adnak hozzá, vagy szénszálakkal radikálisan csökkentik az autó tömegét (<span class="formula">m</span>).</p>`,
        funFact: "1 Newton erő nagyjából akkora, mint amekkora erővel egy átlagos alma nyomja a tenyeredet a Föld gravitációja miatt. Isaac Newton tiszteletére nevezték el ezt a mértékegységet!",
        project: {
            icon: "🎈",
            title: "Léggömb-rakéta a folyosón",
            difficulty: "Könnyű (10 perc)",
            materials: ["1 db hosszú lufi", "1 db műanyag szívószál", "3-5 méter cérna vagy zsinór", "Ragasztószalag"],
            steps: [
                "Fűzd át a zsinórt a szívószálon, majd feszítsd ki a zsinórt vízszintesen két szék vagy ajtókilincs között.",
                "Fújd fel a lufit, de a száját ne kösd be, csak szorítsd össze az ujjaiddal.",
                "Ragasztószalaggal rögzítsd a lufit a szívószál aljához a kifújó nyílással a zsinór egyik vége felé.",
                "Engedd el a lufi száját, és figyeld, ahogy elképesztő sebességgel végigszáguld a zsinóron!"
            ],
            explanation: "A kiáramló levegő ellenkező irányú erőt fejt ki a lufira (rakétaelv), és mivel a lufi tömege minimális, az F=m·a törvény értelmében óriási gyorsulást ér el."
        }
    },
    {
        icon: "🌊",
        category: "Folyadékok Mechanikája",
        title: "Archimédész Törvénye és a Felhajtóerő",
        body: `<p>Minden folyadékba vagy gázba merülő testre egy felfelé irányuló erő hat, amit <strong>felhajtóerőnek</strong> nevezünk. Archimédész görög tudós fedezte fel ezt több mint 2200 évvel ezelőtt.</p>
<div class="formula-block">F_fel = ρ · V · g</div>
<p>A törvény kimondja: a felhajtóerő pontosan egyenlő a <strong>test által kiszorított folyadék súlyával</strong>. Ha a felhajtóerő nagyobb vagy egyenlő a test súlyával, a test lebeg vagy úszik a felszínen!</p>
<p>Ez a zseniális elv magyarázza, hogy miért képes a vízen úszni egy 100 000 tonnás acél repülőgép-hordozó hajó: a hajótest üreges formája miatt akkora hatalmas térfogatú vizet szorít ki, amelynek súlya megegyezik a hajó teljes tömegével.</p>`,
        funFact: "A monda szerint Archimédész a fürdőkádban ülve jött rá a megoldásra, amikor meglátta, hogy a teste felemeli a vízszintet. Annyira fellelkesült, hogy meztelenül futott ki Szürakusza utcáira azt kiabálva: »Heuréka!« (Megtaláltam!).",
        project: {
            icon: "🥚",
            title: "A lebegő tojás rejtélye",
            difficulty: "Könnyű (5 perc)",
            materials: ["1 db nyers tojás", "1 nagy pohár víz", "4-5 evőkanál konyhasó", "Kanál a keveréshez"],
            steps: [
                "Tedd a tojást a sima csapvízzel teli pohárba: a tojás azonnal lesüllyed az aljára.",
                "Vedd ki a tojást, majd keverj a vízbe 4-5 púpos evőkanál sót, amíg teljesen fel nem oldódik.",
                "Helyezd vissza a tojást a sós vízbe.",
                "Csodáld meg: a tojás nem süllyed el, hanem büszkén lebeg a víz felszínén!"
            ],
            explanation: "A só hozzáadásával megnövelted a víz sűrűségét. Mivel a sós víz sűrűbb lett a tojásnál, a kiszorított sós víz súlya (a felhajtóerő) már elegendő ahhoz, hogy a felszínen tartsa a tojást."
        }
    },
    {
        icon: "🌈",
        category: "Optika és Fénytan",
        title: "A Fénytörés és a Szivárvány Titka",
        body: `<p>A fény vákuumban 300 000 km/s sebességgel száguld, de amint sűrűbb közegbe (pl. vízbe vagy üvegbe) lép, <strong>lelassul és megváltoztatja haladási irányát</strong>. Ezt a jelenséget nevezzük <strong>fénytörésnek</strong>.</p>
<p>A fehér napfény valójában nem fehér: az összes látható szín (vörös, narancs, sárga, zöld, kék, ibolya) keveréke. Mivel a különböző hullámhosszú színek eltérő mértékben törnek meg a közeghatáron, az összetett fény komponenseire bomlik.</p>
<p>Amikor eső után kisüt a nap, a levegőben lebegő milliónyi apró vízcsepp úgy viselkedik, mint egy-egy apró prizma: megtörik, visszaverik és színeire bontják a napfényt — így születik meg a pompás szivárvány!</p>`,
        funFact: "A szivárvány a valóságban egy teljes 360 fokos kör! A talajról nézve a Föld horizontja kitakarja az alsó felét, de repülőgépről vagy magas hegycsúcsról nézve néha megfigyelhető a tökéletes kör alakú szivárvány.",
        project: {
            icon: "🔄",
            title: "A nyíl, ami megfordítja az irányát",
            difficulty: "Nagyon könnyű (3 perc)",
            materials: ["1 db sima falú, henger alakú üvegpohár", "1 lap papír", "Filctoll", "Csapvíz"],
            steps: [
                "Rajzolj egy vastag, jobbra mutató vízszintes nyilat ( ➔ ) a papírlapra.",
                "Állítsd az üres poharat a papír elé kb. 10 cm távolságra: a nyíl még mindig jobbra mutat.",
                "Lassan töltsd fel a poharat vízzel a nyíl szintje fölé.",
                "Nézz át a vízzel teli poháron: a nyíl hirtelen balra fog mutatni ( ⬅ )!"
            ],
            explanation: "A henger alakú vízzel teli pohár gyűjtőlencseként (domború lencse) működik. A fénysugarak a poháron áthaladva egy fókuszpontban metszik egymást, majd keresztezik egymás útját, így a látott kép vízszintesen megfordul."
        }
    },
    {
        icon: "🧲",
        category: "Elektromágnesesség",
        title: "Mágnesesség és a Föld Láthatatlan Pajzsa",
        body: `<p>A mágnesesség a természet egyik legalapvetőbb kölcsönhatása, amely mozgó elektromos töltésekből (elektronok keringéséből és spinjéből) ered. Minden mágnesnek van egy északi és egy déli pólusa; az azonosak taszítják, az ellentétesek vonzzák egymást.</p>
<p>Bármilyen darabokra vágsz egy mágnest, soha nem kapsz magányos északi vagy déli pólust (mágneses monopólust): minden egyes darab azonnal egy új, teljes kétpólusú mágnessé válik!</p>
<p>A Föld maga is egy hatalmas mágnes, amelyet a magjában örvénylő folyékony vas és nikkel dinamó-hatása hoz létre. Ez a mágneses mező létfontosságú: mint egy kozmikus pajzs, eltéríti a Napból érkező gyilkos napszelet és sugárzást.</p>`,
        funFact: "A Föld mágneses pólusai nem állandóak: lassan vándorolnak, és a Föld története során átlagosan 200 000 - 300 000 évente teljesen felcserélődtek (a Déli-sark lett az Északi és fordítva)! Legutóbb mintegy 780 000 éve történt pólusváltás.",
        project: {
            icon: "🧭",
            title: "Készíts saját működő iránytűt!",
            difficulty: "Könnyű (5 perc)",
            materials: ["1 db varrótű vagy gémkapocs", "1 db hűtőmágnes", "1 db parafadugó karika (vagy levél/hungarocell)", "1 tál víz"],
            steps: [
                "Dörzsöld a varrótű hegyét a hűtőmágnes egyik pólusához legalább 30-40 alkalommal EGYETLEN irányban (ne oda-vissza!).",
                "Szúrd át a felmágnesezett tűt vízszintesen a parafa szeleten.",
                "Óvatosan helyezd a dugót a vízzel teli tál közepére.",
                "Figyeld meg: a dugó lassan elfordul, és a tű pontosan észak-déli irányba fog beállni!"
            ],
            explanation: "A dörzsöléssel az acéltűben lévő mikroszkopikus mágneses domének egy irányba rendeződtek, így a tű állandó mágnessé vált. A vízen szabadon lebegve a Föld mágneses mezője az északi és déli pólus felé fordítja."
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
// GEMINI API HÍVÁS (SERVER OLDALON, TIMEOUT-TAL ÉS RETRY-VEL)
// ============================================================
async function fetchFromGemini() {
    const dayOfYear = getDayOfYear();
    const topics = [
        "Newton mozgástörvényei", "A gravitáció és szabadesés", "A Bernoulli-elv és a repülés",
        "A hangsebesség és a Doppler-hatás", "Az energia megmaradás törvénye", "A fény kettős természete",
        "Statikus elektromosság és villámok", "Hőtágulás és halmazállapotok", "Rezonancia a hidakon és hangszerekben",
        "Felületi feszültség", "A Fekete lyukak fizikája", "Optikai csalódások és tükrök",
        "Elektromágneses indukció", "Kozmikus sugárzás", "Súrlódás és kenőanyagok"
    ];
    const topic = topics[dayOfYear % topics.length];

    const prompt = `Írj egy professzionális, izgalmas és közérthető fizika leckét a következő témáról magyarul: "${topic}".
A válasz KIZÁRÓLAG egy érvényes JSON objektum legyen a következő struktúrával:
{
  "icon": "1 releváns emoji",
  "category": "fizika ága (pl. Termodinamika, Kvantumfizika)",
  "title": "A lecke címe",
  "lessonNumber": ${dayOfYear + 1},
  "body": "A lecke szövege HTML formátumban: legalább 3 részletes bekezdés <p> tagekben, <strong> kiemelésekkel, és ha van, <div class='formula-block'>képlet</div> blokkal.",
  "funFact": "2-3 megdöbbentő, érdekes mondat erről a témáról.",
  "project": {
    "icon": "1 releváns emoji",
    "title": "Otthon elvégezhető kísérlet címe",
    "difficulty": "Könnyű (5-10 perc)",
    "materials": ["hétköznapi eszköz 1", "hétköznapi eszköz 2", "hétköznapi eszköz 3"],
    "steps": ["1. lépés", "2. lépés", "3. lépés", "4. lépés"],
    "explanation": "2-3 mondatos tudományos magyarázat a kísérlet működéséről."
  }
}`;

    // Modellek prioritási sorrendben (első a stabil, elérhető gemini-3.1-flash-lite)
    const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    
    for (const model of models) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 7000); // 7 mp timeout modellenként

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
            }
        } catch (err) {
            // Próbáljuk a következő modellt
            console.log(`[Gemini] ${model} hiba: ${err.message}`);
        }
    }

    throw new Error('Minden Gemini modell hívás sikertelen volt');
}

// ============================================================
// API VÉGPONTOK
// ============================================================

// Napi lecke lekérése
app.get('/api/lesson', async (req, res) => {
    const today = getTodayString();

    // Ha van cache erre a napra, azonnal adjuk vissza
    if (cachedLesson && cachedDate === today) {
        return res.json({ success: true, source: 'cache', data: cachedLesson });
    }

    try {
        console.log(`[API] Napi lecke generálása Gemini AI-val: ${today}...`);
        const lesson = await fetchFromGemini();
        cachedLesson = lesson;
        cachedDate = today;
        return res.json({ success: true, source: 'gemini', data: lesson });
    } catch (error) {
        console.log(`[API] Gemini API nem elérhető (${error.message}). Beépített lecke használata.`);
        const fallback = getDailyLessonLocal();
        return res.json({ success: true, source: 'builtin', data: fallback });
    }
});

// Fordítási végpont
app.post('/api/translate', async (req, res) => {
    const { texts, targetLang } = req.body;
    if (!texts || !Array.isArray(texts) || !targetLang) {
        return res.status(400).json({ error: 'Érvénytelen kérés' });
    }

    if (targetLang === 'hu') {
        return res.json({ translated: texts });
    }

    const langNames = {
        en: 'English', de: 'German', fr: 'French', es: 'Spanish',
        it: 'Italian', ro: 'Romanian', pl: 'Polish', ja: 'Japanese',
        zh: 'Chinese', ko: 'Korean', pt: 'Portuguese'
    };

    const targetName = langNames[targetLang] || targetLang;

    try {
        const prompt = `Translate the following array of HTML/text strings into ${targetName}.
Keep all HTML tags (like <p>, <strong>, <span class="formula">, <div class="formula-block">) untouched!
Return ONLY a valid JSON array of translated strings in the exact same order and length:
${JSON.stringify(texts)}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
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
        console.log(`[Translate] Hiba: ${e.message}`);
    }

    // Fallback: ha a fordítás nem sikerült, adjuk vissza az eredeti szövegeket
    return res.json({ translated: texts });
});

// Szerver állapot
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Minden más kérésre index.html kiszolgálása
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`========================================`);
    console.log(`🔬 Napi Fizika Szerver elindult!`);
    console.log(`🌐 Figyelés: http://${HOST}:${PORT}`);
    console.log(`📡 Debian szerveren: http://SZERVER_IP:${PORT}`);
    console.log(`========================================`);
});
