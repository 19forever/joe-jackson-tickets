To je skvělá zpráva! Vlastní doména **`joejackson.band`** dodá celému muzeu maximální kredibilitu a profesionální vzhled.

Tady je kompletní, finální verze roadmapy aktualizovaná o vaši doménu a všechny dosud realizované kroky:

---

# 🗺️ Joe Jackson Memorabilia Museum – Development Roadmap

Archiv koncertních lístků, plakátů, programů a memorabilií Joe Jacksona na doméně **`joejackson.band`**.

---

## 🚀 Stav vývoje & Plánované funkcionality

### 📸 1. Správa médií a obrázků

* [x] **Automatická komprese příloh** (Integrována do `ticket_form.html` pomocí HTML5 Canvas na max. 1600 px).
* [ ] **Automatický Watermarking**
* Implementovat skript/funkci, která automaticky vloží diskrétní vodoznak/logo *Joe Jackson Memorabilia Museum* do skenů před publikací.



### 🔒 2. Bezpečnost a Správa dat

* [x] **Oddělení veřejné části a administrace** (Veřejné muzeum `index_short.html` vs. administrátorský editor `edit_ticket_new.html` propojený přes GitHub PAT API).
* [x] **Veřejná podatelna příspěvků** (`ticket_form.html` s odesíláním přes FormSubmit.co na váš e-mail bez rizika přepsání databáze cizími lidmi).

### 🔗 3. Architektura dat a Relace

* [x] **Párování přes `SHOW_ID**` (Jednoznačný klíč propojuje lístek, plakát, program i videa ke stejnému koncertu).

### 🎲 4. Interaktivita a UX

* [x] **Tlačítko "Surprise Me!" & "Reshuffle"** (Náhodný výběr a promíchání záznamů).
* [x] **Banner "On This Day In History"** (Automatická detekce koncertních výročí pro daný kalendářní den).
* [x] **Třísloupcový Video Player** (Zobrazení videa, Line-upu a strukturovaného setlistu s oddělenými sekcemi `[Encore]`).

### 📊 5. Statistiky a Vizualizace

* [x] **Interaktivní mapa koncertů & statistik** (`stats.html` se zobrazením koncertních mís na mapě a grafy).

### 🌐 6. Nasazení na vlastní doménu & PWA

* [ ] **Propojení zakoupené domény `joejackson.band**`
* Nastavení DNS CNAME/A záznamů u registrátora a propojení s GitHub Pages (soubor `CNAME`).


* [ ] **PWA Funkcionalita (Progressive Web App)**
* Přidat `manifest.json` a Service Worker pro možnost instalace webu jako aplikace na plochu mobilu/PC a rychlé offline načítání.



---

## 🧩 Přehled Komponent a Jejich Funkčnost

* **`index_short.html` (Veřejné Muzeum):** Hlavní rozhraní pro návštěvníky. Obsahuje hlavičku s tlačítkem pro přispění, výroční banner, filtry, vyhledávání, záložky kategorií a mřížku karet.
* **`app.js` (Jádro aplikační logiky):** Zajišťuje načítání CSV přes PapaParse, filtruje a řadí data, generuje karty, spravuje zobrazení skenů v Viewer.js a otvírá 3-sloupcové video okno.
* **`styles.css` (Design systém):** Tmavé téma (Dark Mode), CSS Grid/Flexbox rozvržení, responzivita pro mobilní zařízení a vizuální stavové odznaky.
* **`edit_ticket_new.html` (Správcovský Editor):** Dvousloupcová administrace s živým náhledem obrázků. Umožňuje procházet, upravovat, přidávat, duplikovat i mazat záznamy a ukládat změny přímo do GitHub repozitáře.
* **`ticket_form.html` (Veřejný formulář):** Formulář pro fanoušky. Na pozadí zkomprimuje fotky a odešle data s přílohou na váš e-mail přes FormSubmit.co.
* **`stats.html` (Statistiky a Mapa):** Geografické zobrazení odehraných koncertů a sbírkových předmětů na interaktivní mapě společně s přehlednými grafy.
* **`joe_jackson_tickets_cleaned.csv` (Master Databáze):** Jediný zdroj pravdy (SSOT) se všemi strukturovanými daty o koncertech a sbírkových předmětech.
* **Cloudflare Proxy Worker (`jj-setlist-proxy`):** Bezpečnostní mezikus zprostředkovávající komunikaci se Setlist.fm API bez odhalení API klíče.

---

## 💡 Nové Nápady pro Další Vývoj

**1. Contributor Hall of Fame (Síň slávy dárců)**

* Vytvořit samostatnou záložku nebo modal s přehledem všech fanoušků, kteří do muzea přispěli (vygenerováno automaticky z pole `CONTRIBUTOR`).

**2. Generator Spotify Playlistu (One-Click Playlist)**

* U koncertů s vyplněným setlistem přidat tlačítko, které vygeneruje přímý odkaz na otevření odpovídajícího playlistu ve Spotify.

**3. "Missing Items" Wishlist (Seznam hledaných lístků)**

* Sekce pro sběratele zobrazující známé koncerty podle Tour listů, u kterých v muzeu zatím **chybí jakýkoliv sken**. Motivuje fanoušky k prohledání domácích archívů.

**4. Export koncertní karty jako Obrázek / PDF**

* Možnost vygenerovat líbivou souhrnnou kartu koncertu (Datum + Město + Sken + Setlist + Lineup) do jednoho PNG obrázku pro snadné sdílení na sociálních sítích nebo ve fanklubu.

---

Až budete chtít doménu **`joejackson.band`** na GitHub Pages nasměrovat, stačí říct — nastavíme soubor `CNAME` a správné IP adresy pro DNS!
