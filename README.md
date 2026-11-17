# 🔬 Napi Fizika — Debian Szerver Telepítési Útmutató

Ez a projekt egy modern, letisztult fizika oktató weboldal, amely napi fizikai leckéket és otthon elvégezhető kísérleti projekteket mutat be több nyelven, Google Gemini AI integrációval.

---

## 📁 Projekt Fájlok

- `server.js` — Node.js Express háttérszerver (kezeli a Gemini API hívásokat, cache-t és fordításokat)
- `index.html` — A weboldal felülete
- `style.css` — Sötét, modern űr-stílusú dizájn és animációk
- `app.js` — Böngészőoldali interaktív kód (fülek, fordítás, részecske háttér)
- `package.json` — Szükséges Node.js csomagok leírása
- `.env` — API kulcs és port konfiguráció
- `.gitignore` — Nem követendő fájlok (`node_modules/`, `.env`)

---

## 🚀 1. Feltöltés a Debian Szerverre

### A) Módszer: WinSCP vagy FileZilla (Grafikus felület)
1. Csatlakozz a Debian szerveredhez SFTP-n keresztül (IP cím, felhasználónév, jelszó vagy SSH kulcs).
2. Másold fel a teljes `fizika-weboldal` mappát a szerverre, például ide:  
   `/var/www/fizika-weboldal` vagy a home mappádba: `/home/felhasznalonev/fizika-weboldal`.

### B) Módszer: SCP (Parancssorból Windowsról)
Nyiss egy PowerShellt, és futtasd:
```bash
scp -r "C:\Users\istva\Desktop\fizika-weboldal" felhasznalonev@SZERVER_IP:/home/felhasznalonev/
```

---

## ⚙️ 2. Telepítés és Indítás a Debian Szerveren

Lépj be a szerverre SSH-val, majd kövesd az alábbi pár lépést:

### 1. Lépés: Node.js és NPM telepítése (ha még nincs fent)
```bash
sudo apt update
sudo apt install -y nodejs npm
```

Ellenőrizd a verziót:
```bash
node -v
npm -v
```

### 2. Lépés: Lépj be a projekt mappájába és telepítsd a függőségeket
```bash
cd /home/felhasznalonev/fizika-weboldal
npm install
```

### 3. Lépés: Tesztindítás
```bash
npm start
```
Ekkor a szerver elindul a `3000`-es porton!
Böngészőből már eléred: `http://SZERVER_IP:3000`

---

## 🔄 3. Futtatás a Háttérben (hogy a terminál bezárása után is menjen)

Használd a **PM2** folyamatkezelőt, amely automatikusan újraindítja az oldalt szerver újrainduláskor is:

```bash
# PM2 telepítése globálisan
sudo npm install -g pm2

# Indítás a háttérben
pm2 start server.js --name "napi-fizika"

# Automatikus indítás beállítása rendszerindításkor
pm2 startup
pm2 save
```

Hasznos PM2 parancsok:
- `pm2 status` — Folyamatok állapota
- `pm2 logs napi-fizika` — Élő naplófájlok megtekintése
- `pm2 restart napi-fizika` — Újraindítás

---

## 🛡️ 4. Tűzfal beállítása (ha van UFW aktív)

Ha fut a szervereden az UFW tűzfal, engedélyezd a 3000-es portot:
```bash
sudo ufw allow 3000/tcp
```

---

## 🌐 5. Opcionális: Nginx Reverse Proxy (80-as / 443-as port, saját domain név)

Ha szeretnéd, hogy a weboldal a standard 80-as porton vagy domain néven keresztül működjön:

1. Telepítsd az Nginx-et:
   ```bash
   sudo apt install -y nginx
   ```
2. Hozz létre egy új konfigurációs fájlt:
   ```bash
   sudo nano /etc/nginx/sites-available/fizika
   ```
3. Másold bele a következő blokkot:
   ```nginx
   server {
       listen 80;
       server_name a_te_domained.hu vagy a_szerver_ipje;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Engedélyezd és indítsd újra az Nginx-et:
   ```bash
   sudo ln -s /etc/nginx/sites-available/fizika /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
