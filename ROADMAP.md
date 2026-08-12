# 🗺️ Joe Jackson Memorabilia Museum – Development Roadmap

Archiv koncertních lístků, plakátů, programů a memorabilií Joe Jacksona na doméně **`joejackson.band`**.

---

## 📌 PLÁNOVANÉ ÚKOLY (TO-DO LIST)

### 🚨 1. Hlavní prioritní úkoly (Next Steps)

* [ ] **Přechod z `index_short.html` na produkční `index.html**`
* Finální refaktoring a vyčištění kódu po dokončení testovací fáze.
* Nastavení `index.html` jako výchozí vstupní stránky projektu.


* [ ] **Řešení přístupových úrovní (Veřejný vs. Administrátorský level)**
* *Veřejná část (`joejackson.band`):* Čtenářský režim, vyhledávání, filtry, přehrávač videí a formulář pro přispění (`ticket_form.html`). Skrytí editačních tlačítek (✏️ Edit) pro běžné návštěvníky.
* *Administrátorská část:* Zabezpečení přístupu k `edit_ticket_new.html`. Možnosti řešení:
1. Přístup pouze přes tajnou/neveřejnou URL s uloženým GitHub PAT tokenem v prohlížeči správce.
2. Integrovaná jednoduchá heslová brána (Auth wall) nebo nasazení přes Netlify/Vercel Password Protection.




* [ ] **Propojení zakoupené domény `joejackson.band**`
* Vytvoření souboru `CNAME` v repozitáři.
* Nastavení DNS záznamů (A / CNAME) u registrátora domény pro nasměrování na GitHub Pages.



### 📸 2. Správa médií

* [ ] **Automatický Watermarking**
* Implementovat skript/funkci, která automaticky vloží diskrétní vodoznak/logo *Joe Jackson Memorabilia Museum* do skenů před publikací.



### 📱 3. PWA (Progressive Web App)

* [ ] **Instalovatelnost a Offline režim**
* Přidat `manifest.json` a Service Worker pro možnost instalace webu jako aplikace na plochu mobilu/PC.



---

## ✅ DOKONČENÉ FUNKCIONALITY (COMPLETED)

* [x] **Veřejná podatelna příspěvků (`ticket_form.html`):** Odesílání skenů přes FormSubmit.co přímo na e-mail správce bez možnosti narušení databáze cizími lidmi.
* [x] **Automatická komprese fotek:** Zmenšování velkých příloh přímo v prohlížeči uživatele na max. 1600 px před odesláním.
* [x] **Propojení přes `SHOW_ID`:** Jednoznačné spárování lístků, plakátů, programů i videí ke stejnému koncertu.
* [x] **Interaktivita & UX:** Tlačítka *Surprise Me!*, *Reshuffle* a automatický banner *On This Day In History*.
* [x] **Třísloupcový Video Player:** Přehrávání videí se zobrazením sestavy kapely a strukturovaného setlistu včetně přídavků `[Encore]`.
* [x] **Statistiky a Mapa (`stats.html`):** Geografické zobrazení odehraných koncertů na interaktivní mapě s grafy.
* [x] **GitHub PAT Editor (`edit_ticket_new.html`):** Dvousloupcová administrace umožňující ukládat změny v master CSV přímo do repozitáře.

---

## 🧩 PŘEHLED KOMPONENT A JEJICH FUNKČNOST

* **`index_short.html` / `index.html` (Veřejné Muzeum):** Hlavní rozhraní pro návštěvníky. Obsahuje hlavičku s tlačítkem pro přispění, výroční banner, filtry, vyhledávání, záložky kategorií a mřížku karet.
* **`app.js` (Jádro aplikační logiky):** Zajišťuje načítání CSV přes PapaParse, filtruje a řadí data, generuje karty, spravuje zobrazení skenů v Viewer.js a otvírá 3-sloupcové video okno.
* **`styles.css` (Design systém):** Tmavé téma (Dark Mode), CSS Grid/Flexbox rozvržení, responzivita pro mobilní zařízení a vizuální stavové odznaky.
* **`edit_ticket_new.html` (Správcovský Editor):** Dvousloupcová administrace s živým náhledem obrázků. Umožňuje procházet, upravovat, přidávat, duplikovat i mazat záznamy a ukládat změny přímo do GitHub repozitáře.
* **`ticket_form.html` (Veřejný formulář):** Formulář pro fanoušky. Na pozadí zkomprimuje fotky a odešle data s přílohou na e-mail přes FormSubmit.co.
* **`stats.html` (Statistiky a Mapa):** Geografické zobrazení odehraných koncertů a sbírkových předmětů na interaktivní mapě společně s přehlednými grafy.
* **`joe_jackson_tickets_cleaned.csv` (Master Databáze):** Jediný zdroj pravdy (SSOT) se všemi strukturovanými daty o koncertech a sbírkových předmětech.
* **Cloudflare Proxy Worker (`jj-setlist-proxy`):** Bezpečnostní mezikus zprostředkovávající komunikaci se Setlist.fm API bez odhalení API klíče.

---

## 💡 NOVÉ NÁPADY PRO DALŠÍ VÝVOJ

1. **Contributor Hall of Fame (Síň slávy dárců):** Samostatná záložka nebo modal s přehledem všech fanoušků, kteří do muzea přispěli (vygenerováno automaticky z pola `CONTRIBUTOR`).
2. **Generator Spotify Playlistu (One-Click Playlist):** U koncertů s vyplněným setlistem přidat tlačítko, které vygeneruje přímý odkaz na otevření odpovídajícího playlistu ve Spotify.
3. **"Missing Items" Wishlist (Seznam hledaných lístků):** Sekce zobrazující známe koncerty, u kterých v muzeu zatím chybí jakýkoliv sken. Motivuje fanoušky k prohledání domácích archívů.
4. **Export koncertní karty jako Obrázek:** Možnost vygenerovat líbivou souhrnnou kartu koncertu (Datum + Město + Sken + Setlist) do jednoho PNG obrázku pro snadné sdílení na sociálních sítích.
