/* ==========================================================================
   Joe Jackson Memorabilia Museum - Core Application Logic
   ========================================================================== */

// Konfigurace a globální stav
const CSV_FILE = 'joe_jackson_tickets_cleaned.csv';
const PLACEHOLDER_IMG = 'scans/missing_ticket.svg';

let allData = [];
let filteredData = [];
let currentLayout = 'grid'; // 'grid' nebo 'list'
let currentPage = 1;
let pageSize = 50; // defaultní velikost stránky

let modalViewer = null; // Instance Viewer.js pro zoomování
let currentModalIndex = -1;

/* --------------------------------------------------------------------------
   Pomocné funkce pro prázdné nebo chybějící obrázky
   -------------------------------------------------------------------------- */
function getTileImageUrl(fileName) {
  if (!fileName || fileName.trim() === '' || fileName.trim().toLowerCase() === 'missing') {
    return PLACEHOLDER_IMG;
  }
  return `scans/${fileName.trim()}`;
}

/* --------------------------------------------------------------------------
   Inicializace po načtení DOM
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadCSVData();
});

// Načtení a zpracování CSV souboru přes PapaParse
function loadCSVData() {
  Papa.parse(CSV_FILE, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      // Očištění dat od prázdných řádků
      allData = results.data.filter(row => row.CONCERT_DATE && row.CONCERT_DATE.trim() !== '');
      
      // Výchozí promíchání při načtení
      shuffleArray(allData);
      filteredData = [...allData];

      // Inicializace filtrů a UI prvků
      populateFilters();
      setupCategories();
      checkOnThisDayBanner();
      
      // Vykreslení dat
      renderData();
    },
    error: function (err) {
      console.error("Chyba při načítání CSV:", err);
      const container = document.getElementById('ticketsContainer');
      if (container) {
        container.innerHTML = `<div style="color: #ef4444; padding: 40px; text-align: center;">❌ Failed to load archive data (${err}).</div>`;
      }
    }
  });
}

/* --------------------------------------------------------------------------
   Algoritmus pro náhodné promíchání (Fisher-Yates Shuffle)
   -------------------------------------------------------------------------- */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function reshuffleAndRender() {
  document.getElementById('sortFilter').value = 'random';
  shuffleArray(filteredData);
  currentPage = 1;
  renderData();
}

/* --------------------------------------------------------------------------
   Populace filtrů (Roky, Města, Kategorie)
   -------------------------------------------------------------------------- */
function populateFilters() {
  const yearFilter = document.getElementById('yearFilter');
  const cityFilter = document.getElementById('cityFilter');
  const yearBadge = document.getElementById('yearBadge');

  const years = new Set();
  const cities = new Set();

  allData.forEach(item => {
    if (item.CONCERT_DATE) {
      const year = item.CONCERT_DATE.substring(0, 4);
      if (year && !isNaN(year)) years.add(year);
    }
    if (item.CITY && item.CITY.trim() !== '') {
      cities.add(item.CITY.trim());
    }
  });

  // Aktualizace odznaku s počtem záznamů v hlavičce
  if (yearBadge) {
    yearBadge.textContent = `${allData.length} items`;
  }

  // Seřazení a vložení let do selectu
  const sortedYears = Array.from(years).sort((a, b) => b - a);
  yearFilter.innerHTML = '<option value="">All Years</option>';
  sortedYears.forEach(y => {
    yearFilter.innerHTML += `<option value="${y}">${y}</option>`;
  });

  // Seřazení a vložení měst do selectu
  const sortedCities = Array.from(cities).sort();
  cityFilter.innerHTML = '<option value="">All Cities</option>';
  sortedCities.forEach(c => {
    cityFilter.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

function setupCategories() {
  const categoryTabs = document.getElementById('categoryTabs');
  if (!categoryTabs) return;

  const categories = ['ALL', 'Tickets', 'Passes', 'Posters', 'Programs', 'T-shirts', 'Memorabilia'];
  
  categoryTabs.innerHTML = categories.map(cat => `
    <button class="category-tab ${cat === 'ALL' ? 'active' : ''}" onclick="filterByCategory('${cat}', this)">
      ${cat}
    </button>
  `).join('');
}

let selectedCategory = 'ALL';

function filterByCategory(category, btnElement) {
  selectedCategory = category;
  document.querySelectorAll('.category-tab').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');
  filterData();
}

/* --------------------------------------------------------------------------
   Filtrování a Řazení dat
   -------------------------------------------------------------------------- */
function filterData() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase().trim();
  const yearVal = document.getElementById('yearFilter').value;
  const cityVal = document.getElementById('cityFilter').value;
  const sortVal = document.getElementById('sortFilter').value;

  filteredData = allData.filter(item => {
    // Kategoriální filtr
    if (selectedCategory !== 'ALL') {
      const itemCat = (item.CATEGORY || 'Tickets').trim();
      if (itemCat.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    }

    // Rok
    if (yearVal && (!item.CONCERT_DATE || !item.CONCERT_DATE.startsWith(yearVal))) {
      return false;
    }

    // Město
    if (cityVal && item.CITY !== cityVal) {
      return false;
    }

    // Vyhledávací pole (hledá ve městech, halách, datu, poznámkách i line-upu)
    if (searchInput !== '') {
      const matchCity = item.CITY && item.CITY.toLowerCase().includes(searchInput);
      const matchVenue = item.VENUE && item.VENUE.toLowerCase().includes(searchInput);
      const matchDate = item.CONCERT_DATE && item.CONCERT_DATE.includes(searchInput);
      const matchNotes = item.NOTES && item.NOTES.toLowerCase().includes(searchInput);
      const matchLineup = item.BAND_LINEUP && item.BAND_LINEUP.toLowerCase().includes(searchInput);
      const matchSupport = item.SUPPORTING_ACT && item.SUPPORTING_ACT.toLowerCase().includes(searchInput);

      if (!matchCity && !matchVenue && !matchDate && !matchNotes && !matchLineup && !matchSupport) {
        return false;
      }
    }

    return true;
  });

  // Řazení
  if (sortVal === 'oldest') {
    filteredData.sort((a, b) => (a.CONCERT_DATE || '').localeCompare(b.CONCERT_DATE || ''));
  } else if (sortVal === 'newest') {
    filteredData.sort((a, b) => (b.CONCERT_DATE || '').localeCompare(a.CONCERT_DATE || ''));
  } else if (sortVal === 'random') {
    // Ponechává náhodné pořadí
  }

  currentPage = 1;
  renderData();
}

function handleSearchInput() {
  const clearBtn = document.getElementById('searchClearBtn');
  const val = document.getElementById('searchInput').value;
  if (clearBtn) {
    clearBtn.style.display = val.length > 0 ? 'block' : 'none';
  }
  filterData();
}

function clearSearchInput() {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClearBtn').style.display = 'none';
  filterData();
}

function changePageSize() {
  const val = document.getElementById('pageSizeFilter').value;
  pageSize = val === 'ALL' ? filteredData.length : parseInt(val, 10);
  currentPage = 1;
  renderData();
}

function setLayout(layout) {
  currentLayout = layout;
  document.getElementById('btnGrid').classList.toggle('active', layout === 'grid');
  document.getElementById('btnList').classList.toggle('active', layout === 'list');
  renderData();
}

/* --------------------------------------------------------------------------
   Vykreslování karet a stránkování
   -------------------------------------------------------------------------- */
function renderData() {
  const container = document.getElementById('ticketsContainer');
  container.className = `tickets-container ${currentLayout}-view`;

  if (filteredData.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 1.5rem; margin-bottom: 10px;">🔍 No memorabilia items found matching your criteria.</p>
        <button class="surprise-btn" onclick="clearAllFilters()">Reset All Filters</button>
      </div>
    `;
    document.getElementById('paginationContainer').innerHTML = '';
    return;
  }

  // Výpočet stránkování
  const effectivePageSize = pageSize === 'ALL' ? filteredData.length : pageSize;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const pageItems = filteredData.slice(startIndex, startIndex + effectivePageSize);

  container.innerHTML = pageItems.map((item, index) => {
    const globalIndex = startIndex + index;
    const imgUrl = getTileImageUrl(item.FILE_NAME);
    const category = item.CATEGORY || 'Ticket';
    const hasMedia = (item.YOUTUBE_URL && item.YOUTUBE_URL.trim() !== '') || (item.SETLIST && item.SETLIST.trim() !== '');

    return `
      <div class="ticket-card" onclick="openModal(${globalIndex})">
        <div class="card-img-wrapper">
          <img src="${imgUrl}" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}';" alt="${category} scan" loading="lazy">
          <span class="card-badge badge-${category.toLowerCase()}">${category}</span>
          ${hasMedia ? '<span class="media-indicator-badge" title="Has media or setlist">🎵 Video/Setlist</span>' : ''}
        </div>
        <div class="card-content">
          <div class="card-date">${item.CONCERT_DATE || 'Unknown Date'}</div>
          <div class="card-title">${item.CITY || 'Unknown City'}, ${item.COUNTRY || ''}</div>
          <div class="card-venue">${item.VENUE || ''}</div>
          ${item.SUPPORTING_ACT ? `<div class="card-support">w/ ${item.SUPPORTING_ACT}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  renderPagination();
}

function clearAllFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('yearFilter').value = '';
  document.getElementById('cityFilter').value = '';
  document.getElementById('sortFilter').value = 'random';
  selectedCategory = 'ALL';
  setupCategories();
  filterData();
}

function renderPagination() {
  const container = document.getElementById('paginationContainer');
  if (!container || pageSize === 'ALL') {
    if (container) container.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(filteredData.length / pageSize);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">◄ Prev</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
    }
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next ►</button>`;
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------------------------------------
   On This Day In History Banner
   -------------------------------------------------------------------------- */
function checkOnThisDayBanner() {
  const banner = document.getElementById('otdBanner');
  const title = document.getElementById('otdTitle');
  const btn = document.getElementById('otdBtn');
  if (!banner || !title || !btn) return;

  const today = new Date();
  const currentMonthDay = today.toISOString().substring(5, 10); // "MM-DD"

  const anniversaryShows = allData.filter(item => {
    return item.CONCERT_DATE && item.CONCERT_DATE.substring(5, 10) === currentMonthDay;
  });

  if (anniversaryShows.length > 0) {
    const show = anniversaryShows[Math.floor(Math.random() * anniversaryShows.length)];
    const year = show.CONCERT_DATE.substring(0, 4);
    
    title.innerHTML = `On this day in <strong>${year}</strong>: Joe Jackson played at <strong>${show.VENUE || show.CITY}</strong> (${show.CITY}).`;
    
    btn.onclick = () => {
      const globalIdx = filteredData.indexOf(show);
      if (globalIdx !== -1) {
        openModal(globalIdx);
      } else {
        clearAllFilters();
        const newIdx = filteredData.indexOf(show);
        if (newIdx !== -1) openModal(newIdx);
      }
    };
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

/* --------------------------------------------------------------------------
   Surprise Me! (Náhodný záznam)
   -------------------------------------------------------------------------- */
function openSurpriseTicket() {
  if (filteredData.length === 0) return;
  const randomIdx = Math.floor(Math.random() * filteredData.length);
  openModal(randomIdx);
}

/* --------------------------------------------------------------------------
   Detail Modal Window (Flashcard + Viewer.js Zoom)
   -------------------------------------------------------------------------- */
function openModal(index) {
  currentModalIndex = index;
  const item = filteredData[index];
  if (!item) return;

  const modal = document.getElementById('detailModal');
  const modalImg = document.getElementById('modalImg');
  const modalDate = document.getElementById('modalDate');
  const modalInfo = document.getElementById('modalInfo');
  const modalCounter = document.getElementById('modalCounter');
  const modalEditLink = document.getElementById('modalEditLink');

  // Počítadlo v modálu
  modalCounter.textContent = `${index + 1} / ${filteredData.length}`;

  // Odkaz na editační rozhraní
  if (modalEditLink) {
    modalEditLink.href = `edit_ticket_new.html?id=${encodeURIComponent(item.SHOW_ID || item.CONCERT_DATE)}`;
  }

  // Základní texty
  modalDate.textContent = item.CONCERT_DATE || 'Unknown Date';
  modalInfo.textContent = `${item.CITY || 'Unknown City'}${item.COUNTRY ? ', ' + item.COUNTRY : ''} — ${item.VENUE || ''}`;

  // Podpora a Seating
  document.getElementById('modalSupport').textContent = item.SUPPORTING_ACT || 'N/A';
  document.getElementById('modalSeat').textContent = item.SEATING || 'N/A';

  // Načtení obrázku
  const imgUrl = getTileImageUrl(item.FILE_NAME);
  modalImg.src = imgUrl;
  modalImg.onerror = function() {
    this.onerror = null;
    this.src = PLACEHOLDER_IMG;
  };

  // Inicializace / Aktualizace Lupy (Viewer.js)
  if (modalViewer) {
    modalViewer.destroy();
  }
  modalViewer = new Viewer(document.getElementById('modalViewerWrapper'), {
    inline: false,
    toolbar: {
      zoomIn: 1,
      zoomOut: 1,
      oneToOne: 1,
      reset: 1,
      rotateLeft: 1,
      rotateRight: 1,
      flipHorizontal: 1,
      flipVertical: 1,
    },
    title: false
  });

  // Náhledové miniatury pro související předměty stejného SHOW_ID
  renderModalThumbnails(item);

  // Vykreslení dvousloupcové sekce (Line-up a Setlist)
  renderFlashcardColumns(item);

  // Vykreslení Média / Video tlačítka
  renderMediaSection(item);

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function renderModalThumbnails(currentItem) {
  const container = document.getElementById('modalThumbnails');
  if (!container) return;

  if (!currentItem.SHOW_ID || currentItem.SHOW_ID.trim() === '') {
    container.style.display = 'none';
    return;
  }

  // Najde všechny položky se stejným SHOW_ID
  const related = allData.filter(i => i.SHOW_ID === currentItem.SHOW_ID);
  
  if (related.length <= 1) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = related.map(rel => {
    const thumbUrl = getTileImageUrl(rel.FILE_NAME);
    const isActive = rel === currentItem;
    return `
      <img src="${thumbUrl}" 
           class="modal-thumb ${isActive ? 'active' : ''}" 
           onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}';" 
           title="${rel.CATEGORY || 'Scan'}"
           onclick="switchModalToItem('${rel.SHOW_ID}', '${rel.FILE_NAME}')">
    `;
  }).join('');
}

function switchModalToItem(showId, fileName) {
  const targetIdx = filteredData.findIndex(i => i.SHOW_ID === showId && i.FILE_NAME === fileName);
  if (targetIdx !== -1) {
    openModal(targetIdx);
  }
}

function navigateModal(direction) {
  let newIdx = currentModalIndex + direction;
  if (newIdx < 0) newIdx = filteredData.length - 1;
  if (newIdx >= filteredData.length) newIdx = 0;
  openModal(newIdx);
}

function closeModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  if (modalViewer) {
    modalViewer.destroy();
    modalViewer = null;
  }
}

function closeModalOnOverlay(e) {
  if (e.target.id === 'detailModal') {
    closeModal();
  }
}

/* --------------------------------------------------------------------------
   Vykreslení dvousloupcové sekce (Line-up a Setlist)
   -------------------------------------------------------------------------- */
function renderFlashcardColumns(item) {
  const container = document.getElementById('modalColumnsSection');
  if (!container) return;

  const hasLineup = item.BAND_LINEUP && item.BAND_LINEUP.trim() !== '';
  const hasSetlist = item.SETLIST && item.SETLIST.trim() !== '';

  if (!hasLineup && !hasSetlist) {
    container.innerHTML = '';
    return;
  }

  let lineupHtml = '';
  if (hasLineup) {
    const lineupFormatted = item.BAND_LINEUP.split(';')
      .map(member => `<li>${member.trim()}</li>`)
      .join('');
    lineupHtml = `
      <div class="flashcard-col">
        <h4>🎷 Band Line-up</h4>
        <ul>${lineupFormatted}</ul>
      </div>
    `;
  }

  let setlistHtml = '';
  if (hasSetlist) {
    const setlistFormatted = item.SETLIST.split('\n')
      .map(song => {
        if (song.trim().toLowerCase().includes('[encore]')) {
          return `<li class="setlist-encore"><strong>${song.trim()}</strong></li>`;
        }
        return `<li>${song.trim()}</li>`;
      })
      .join('');
    setlistHtml = `
      <div class="flashcard-col">
        <h4>🎵 Setlist</h4>
        <ol class="setlist-list">${setlistFormatted}</ol>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="flashcard-grid">
      ${lineupHtml}
      ${setlistHtml}
    </div>
  `;
}

/* --------------------------------------------------------------------------
   Media Container & Video Player Modal
   -------------------------------------------------------------------------- */
function renderMediaSection(item) {
  const container = document.getElementById('modalMediaContainer');
  if (!container) return;

  if (item.YOUTUBE_URL && item.YOUTUBE_URL.trim() !== '') {
    container.innerHTML = `
      <button class="btn-play-video" onclick="openVideoModal('${encodeURIComponent(JSON.stringify(item))}')">
        ▶ Play Video Recording & Setlist
      </button>
    `;
  } else {
    container.innerHTML = '';
  }
}

function openVideoModal(itemJsonString) {
  const item = JSON.parse(decodeURIComponent(itemJsonString));
  const videoModal = document.getElementById('videoModal');
  const iframe = document.getElementById('youtubeIframe');
  const lineupBox = document.getElementById('videoLineupContainer');
  const setlistBox = document.getElementById('videoSetlistContainer');

  // Formátování YouTube Embed URL
  let embedUrl = item.YOUTUBE_URL;
  if (embedUrl.includes('watch?v=')) {
    embedUrl = embedUrl.replace('watch?v=', 'embed/');
  } else if (embedUrl.includes('youtu.be/')) {
    embedUrl = embedUrl.replace('youtu.be/', 'www.youtube.com/embed/');
  }
  iframe.src = embedUrl;

  // Levý sloupec: Lineup
  if (item.BAND_LINEUP && item.BAND_LINEUP.trim() !== '') {
    const lineupItems = item.BAND_LINEUP.split(';')
      .map(m => `<li>${m.trim()}</li>`).join('');
    lineupBox.innerHTML = `<h3>🎷 Band Line-up</h3><ul>${lineupItems}</ul>`;
  } else {
    lineupBox.innerHTML = `<h3>🎷 Band Line-up</h3><p style="color:var(--text-muted)">No lineup info available.</p>`;
  }

  // Pravý sloupec: Setlist
  if (item.SETLIST && item.SETLIST.trim() !== '') {
    const setlistItems = item.SETLIST.split('\n')
      .map(s => {
        if (s.trim().toLowerCase().includes('[encore]')) {
          return `<li style="color:var(--accent-yellow); font-weight:bold; margin-top:8px;">${s.trim()}</li>`;
        }
        return `<li>${s.trim()}</li>`;
      }).join('');
    setlistBox.innerHTML = `<h3>🎵 Setlist</h3><ol>${setlistItems}</ol>`;
  } else {
    setlistBox.innerHTML = `<h3>🎵 Setlist</h3><p style="color:var(--text-muted)">No setlist available.</p>`;
  }

  videoModal.style.display = 'flex';
}

function closeVideoModal() {
  const videoModal = document.getElementById('videoModal');
  const iframe = document.getElementById('youtubeIframe');
  if (iframe) iframe.src = '';
  if (videoModal) videoModal.style.display = 'none';
}

function closeVideoModalOnOverlay(e) {
  if (e.target.id === 'videoModal') {
    closeVideoModal();
  }
}

/* --------------------------------------------------------------------------
   Klávesové zkratky (Šipky pro navigaci v modálu, ESC pro zavření)
   -------------------------------------------------------------------------- */
document.addEventListener('keydown', (e) => {
  const detailModal = document.getElementById('detailModal');
  const videoModal = document.getElementById('videoModal');

  if (detailModal && detailModal.style.display === 'flex') {
    if (e.key === 'ArrowLeft') navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
    if (e.key === 'Escape') closeModal();
  }

  if (videoModal && videoModal.style.display === 'flex') {
    if (e.key === 'Escape') closeVideoModal();
  }
});
