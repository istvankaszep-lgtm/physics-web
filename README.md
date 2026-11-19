# 🔬 Napi Fizika & NASA Hírek

Modern, tudományos weboldal napi fizika leckékkel, otthon elvégezhető kísérleti projektekkel, és valós idejű hivatalos NASA űrhírekkel.

---

## ✨ Főbb funkciók

1. **📖 Napi Fizika Lecke** — Minden nap új téma a fizikából, közérthető magyarázattal, kiemelt képletekkel és megdöbbentő érdekességekkel (**Fun Fact**). A Gemini AI (`gemini-3.1-flash-lite`) generálja, offline módban pedig beépített leckékből töltődik be.
2. **🔧 Napi Projekt** — Bárki által otthon elvégezhető, biztonságos és egyszerű fizikai kísérletek (anyaglista, lépések, magyarázat).
3. **🚀 NASA Hírek** — Valós idejű, közvetlen hírfolyam a **NASA hivatalos hírcsatornájából** (APOD, űrkutatás, felfedezések). Minden hírnél közvetlen link visz a hivatalos NASA.gov cikkhez.
4. **🌐 Beépített többnyelvű fordító** — 12 nyelv támogatása (magyar, angol, német, francia, spanyol, olasz, román, lengyel, japán, kínai, koreai, portugál) a Google Gemini segítségével.
5. **🎨 Modern látványvilág** — Sötét űr-téma interaktív részecske háttérrel és reszponzív (mobilbarát) elrendezéssel.

---

## 📁 Fájlstruktúra

- `server.js` — Node.js Express szerver (Gemini API hívások, NASA RSS hírfolyam feldolgozás, fordítás, cache)
- `index.html` — A weboldal szerkezete (Napi Lecke, Napi Projekt, NASA Hírek fülek)
- `style.css` — Dizájn és kártya stílusok
- `app.js` — Kliensoldali interakciók és adatrenderelés
- `package.json` — Függőségek (`express`, `dotenv`, `cors`)
- `.env` — API kulcs és hálózati beállítások (`HOST=0.0.0.0`, `PORT=3000`)
- `.env.example` — Sablon környezeti fájl (GitHubra biztonságos)
- `.gitignore` — Titkos adatok és csomagok kizárása

---

## 🚀 Futtatás helyben vagy Debian szerveren

### 1. Függőségek telepítése
```bash
npm install
```

### 2. Indítás
```bash
npm start
```
A szerver elindul a `http://0.0.0.0:3000` címen, és a helyi hálózaton vagy a Debian szerver IP-címén keresztül bárhonnan elérhető.

### 3. Futtatás a háttérben PM2-vel (Debian szerveren ajánlott):
```bash
sudo npm install -g pm2
pm2 start server.js --name "napi-fizika"
pm2 save
pm2 startup
```
