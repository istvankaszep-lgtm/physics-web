# ⚛️ Everyday Physics & NASA News

A modern, responsive science educational website featuring daily physics lessons, easy hands-on DIY experiments, real-time official NASA news, and built-in AI translation across 12 languages.

---

## ✨ Features

1. **📖 Daily Lesson (Everyday Physics)**:
   - Primary language is **English**.
   - Generated dynamically every day via Google Gemini AI (`gemini-3.1-flash-lite`).
   - Includes in-depth explanations, highlighted formulas, and a surprising **Did You Know?** fun fact.
   - Dual-layer caching (server disk cache + browser localStorage) guarantees instantaneous loading on first visit without needing refreshes.

2. **🔧 Daily Project**:
   - Simple, safe home physics experiments anyone can do with everyday household items.
   - Complete with required materials, step-by-step instructions, and scientific explanations.

3. **🚀 NASA News**:
   - Real-time updates directly from official NASA news feeds (Breaking News & APOD).
   - High-resolution space photography, publication dates, summaries, and direct links to official NASA.gov articles.

4. **🌐 Built-in 12-Language Translator**:
   - Translate the entire site with one click into Hungarian, German, French, Spanish, Italian, Romanian, Polish, Japanese, Chinese, Korean, or Portuguese.
   - **Dynamic Date Localization**: Month and weekday names automatically adapt to the selected language.

5. **🎨 Design & Favicon**:
   - Space-themed animated particle background.
   - Custom SVG physics atom favicon (`favicon.svg`).
   - Fully responsive on mobile, tablet, and desktop screens.

---

## 🚀 Running on Localhost or Debian Server

### 1. Install dependencies:
```bash
npm install
```

### 2. Start the server:
```bash
npm start
```
The server will bind to `http://0.0.0.0:3000` and immediately pre-fetch the day's lesson in the background.

### 3. Run continuously in the background (PM2):
```bash
sudo npm install -g pm2
pm2 start server.js --name "everyday-physics"
pm2 save
pm2 startup
```
