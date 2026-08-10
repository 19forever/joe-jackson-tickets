# 🗺️ Joe Jackson Memorabilia Museum – Development Roadmap

Archiv koncertních lístků, plakátů, programů a memorabilií Joe Jacksona.

---

## 🚀 Planované Funkcionality (To-Do List)

### 📸 1. Správa médií a obrázků
- [ ] **Automatický Watermarking**
  - Implementovat skript/funkci (v Pythonu nebo přípravě dat), která automaticky vloží diskrétní vodoznak/logo *Joe Jackson Memorabilia Museum* do skenů před publikací.
  - Ochrana originálních skenů před neautorizovaným přebíráním.

### 🔒 2. Bezpečnost a Správa dat
- [ ] **Oddělení veřejné části a administrace**
  - Oddělit `index.html` (veřejný čtenářský režim) od editačního rozhraní (`edit_ticket.html`).
  - Zabezpečit editační část (např. pomocí GitHub Actions + Netlify CMS / Decap CMS, příp. password-protected admin rozhraním), aby úpravy mohl provádět pouze autorizovaný správce.

### 🔗 3. Architektura dat a Relace (Prolinky)
- [ ] **Refaktorování relací mezi předměty (ID-based Relink)**
  - Nahradit stávající nepraktické párování přes shodný text `INFO_TEXT`.
  - Zvést nový sloupec (např. `SHOW_ID` nebo `EVENT_ID`), který jednoznačně propojí lístek, plakát, program i tričko k jedné konkrétní koncertní události.

### 🎲 4. Interaktivita a UX
- [ ] **Tlačítko "Surprise Me!" (Náhodný záznam)** HOTOVO
  - Přidat do horní lišty tlačítko, které náhodně vybere a otevře detail jednoho koncertu/memorabilie z celé databáze.
  - Skvělý prvek pro objevování méně známých koncertů a bootlegů.

### 📱 5. PWA (Progressive Web App) & Launch
- [ ] **PWA Funkcionalita** *(Až při přechodu na finální doménu)*
  - Přidat `manifest.json` a Service Worker pro offline prohlížení, instalaci na plochu mobilu a rychlé načítání.
- [ ] **Příprava na produkční doménu**
  - Nastavení Vercel / GitHub Pages s vlastní doménou.

---

## 💡 Další návrhy na zlepšení (K diskusi)

### 📊 📊 Vizualizace a Statistiky (Dashboard)
- [ ] **Interaktivní mapa koncertů (Leaflet.js / Mapbox)**
  - Zobrazení špendlíků na mapě světa, kde všude Joe Jackson hrál (a ze kterých míst máme lístky).
- [ ] **Statistický přehled (Stats Tab)**
  - Grafy: *Top 5 nejčastějších měst*, *Top 5 navštívených hal*, *Počet záznamů podle dekád (70s, 80s, 90s...)*.

### 🎧 🎧 Zvukové a Vizuální zážitky
- [ ] **Spotify / Apple Music Embed**
  - Pokud je u koncertu známý setlist, přidat tlačítko *"Přehrát studiový playlist turné"* na Spotify.
- [ ] **Audio Bootleg Player**
  - Možnost připojit přímý odkaz na mp3/audio záznam koncertu (pokud existuje v archivu).

### 🔍 🔍 Pokročilé vyhledávání a Filtry
- [ ] **Filtr podle zemí (Country Filter)**
  - Kromě měst přidat i filtr podle států (USA, UK, Germany, Czechia...).
- [ ] **Tagy událostí**
  - Štítky typu: `Festival`, `TV Appearance`, `Acoustic Show`, `Cancelled Show`.

---

## 🛠️ Architektura Kódu & Refaktoring
- [ ] **Extrakce JS a CSS do samostatných souborů**
  - Rozdělit `index.html` na `styles.css` a `app.js` pro snazší údržbu a rychlejší načítání.
