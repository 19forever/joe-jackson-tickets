let allTickets = [];
let filteredTickets = [];
let currentLayout = 'grid';
let currentPage = 1;
let pageSize = 50;
let currentCategory = 'Tickets';

let activeViewerInstance = null;
let quickViewerInstance = null;

// Dynamické přimíchání CSS pro efektní rozostření pozadí a dvousloupcový video modal se setlistem
(function injectViewerCustomStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .viewer-backdrop {
      background-color: rgba(5, 8, 16, 0.88) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
    }
    .viewer-title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-size: 1rem !important;
      color: #facc15 !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px !important;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8) !important;
    }
    /* Styly pro video modal se setlistem napravo */
    #videoModal .modal-content, 
    #videoModal .video-modal-content {
      display: flex !important;
      flex-direction: row !important;
      gap: 20px !important;
      max-width: 950px !important;
      width: 92% !important;
      background-color: #111827 !important;
      border: 1px solid #1f2937 !important;
      border-radius: 12px !important;
      padding: 20px !important;
      align-items: flex-start !important;
    }
    .video-frame-container {
      flex: 1 1 60% !important;
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
    }
    .video-frame-container iframe {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      border: none;
    }
    .video-setlist-box {
      flex: 1 1 40% !important;
      background: #151c2b;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 15px;
      max-height: 420px;
      overflow-y: auto;
    }
    @media (max-width: 768px) {
      #videoModal .modal-content, 
      #videoModal .video-modal-content {
        flex-direction: column !important;
      }
      .video-setlist-box {
        width: 100%;
        max-height: 250px;
      }
    }
  `;
  document.head.appendChild(style);
})();

// Funkce pro náhodné zamíchání pole (Fisher-Yates Shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Funkce pro ruční přemíchání databáze (Tlačítko Reshuffle)
function reshuffleAndRender() {
  shuffleArray(allTickets);
  const sortSelect = document.getElementById('sortFilter');
  if (sortSelect) sortSelect.value = 'random';
  filterData();
}

function isValidValue(val) {
  if (!val) return false;
  const clean = String(val).trim().toLowerCase();
  return clean !== '' && clean !== 'není k dispozici' && clean !== 'n/a' && clean !== 'undefined' && clean !== 'null';
}

function formatDisplayDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (isNaN(day) || monthIdx < 0 || monthIdx > 11) return dateStr;

  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";

  return `${day}${suffix} ${months[monthIdx]} ${year}`;
}

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
}

// OTEVŘENÍ VIDEO MODALU SE SETLISTEM NAPRAVO
function openVideoModal(ticketIndex) {
  let t = (typeof ticketIndex === 'number') ? filteredTickets[ticketIndex] : null;
  let rawUrl = t ? t.YOUTUBE_URL : ticketIndex;

  const embedUrl = getYouTubeEmbedUrl(rawUrl);
  if (!embedUrl) {
    if (rawUrl) window.open(rawUrl, '_blank');
    return;
  }

  const iframe = document.getElementById('youtubeIframe');
  if (iframe) iframe.src = embedUrl;

  // Dynamická příprava kontejneru pro setlist vedle videa
  let setlistContainer = document.getElementById('videoSetlistContainer');
  if (!setlistContainer && iframe) {
    const parentContent = iframe.closest('.modal-content') || iframe.parentElement;

    // Obalíme iframe do levého flex kontejneru
    if (!iframe.parentElement.classList.contains('video-frame-container')) {
      const frameWrapper = document.createElement('div');
      frameWrapper.className = 'video-frame-container';
      iframe.parentNode.insertBefore(frameWrapper, iframe);
      frameWrapper.appendChild(iframe);
    }

    setlistContainer = document.createElement('div');
    setlistContainer.id = 'videoSetlistContainer';
    setlistContainer.className = 'video-setlist-box';
    parentContent.appendChild(setlistContainer);
  }

  if (setlistContainer) {
    if (t && isValidValue(t.SETLIST)) {
      const songs = t.SETLIST.split(',').map(s => s.trim()).filter(Boolean);
      setlistContainer.innerHTML = `
        <h4 style="color: #facc15; margin-bottom: 10px; font-size: 0.95rem;">🎵 Setlist (${songs.length} songs)</h4>
        <ol style="padding-left: 18px; color: #f3f4f6; font-size: 0.85rem; line-height: 1.6;">
          ${songs.map(s => `<li>${s}</li>`).join('')}
        </ol>
      `;
      setlistContainer.style.display = 'block';
    } else {
      setlistContainer.innerHTML = `<p style="color: #9ca3af; font-size: 0.85rem;">No setlist details available for this video show.</p>`;
      setlistContainer.style.display = 'block';
    }
  }

  const modal = document.getElementById('videoModal');
  if (modal) modal.classList.add('active');
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('youtubeIframe');
  if (iframe) iframe.src = '';
  if (modal) modal.classList.remove('active');
}

function closeVideoModalOnOverlay(e) {
  if (e.target.id === 'videoModal') closeVideoModal();
}

function getTicketCategory(t) {
  if (t.KATEGORIE && t.KATEGORIE.trim()) {
    const cat = t.KATEGORIE.trim().toLowerCase();
    if (cat.includes('pass')) return 'Passes';
    if (cat.includes('program')) return 'Programs';
    if (cat.includes('poster')) return 'Posters';
    if (cat.includes('shirt') || cat.includes('t-shirt') || cat.includes('tričko')) return 'T-shirts';
    if (cat.includes('memo')) return 'Memorabilia';
    if (cat.includes('ticket')) return 'Tickets';
  }
  return 'Tickets';
}

function formatLocationText(t) {
  let locationParts = [];
  if (isValidValue(t.MESTO)) locationParts.push(t.MESTO);
  if (isValidValue(t.STAT)) locationParts.push(t.STAT);
  
  let locStr = locationParts.join(', ');
  if (isValidValue(t.VENUE)) {
    locStr += locStr ? ` - ${t.VENUE}` : t.VENUE;
  }
  return locStr;
}

function handleSearchInput() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  const val = input.value;
  
  sessionStorage.setItem('jj_museum_search', val);
  
  if (clearBtn) {
    clearBtn.style.display = val.trim().length > 0 ? 'block' : 'none';
  }
  filterData();
}

function clearSearchInput() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  input.value = '';
  sessionStorage.removeItem('jj_museum_search');
  if (clearBtn) clearBtn.style.display = 'none';
  filterData();
}

function openSurpriseTicket() {
  if (!filteredTickets || filteredTickets.length === 0) {
    alert("No items available to pick from!");
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredTickets.length);
  openDirectImagePreview(randomIndex);
}

function getRelatedItems(currentRecord) {
  if (!isValidValue(currentRecord.SHOW_ID)) return [];

  return allTickets.filter(item => {
    if (item.ID_MEMORABILIA === currentRecord.ID_MEMORABILIA) return false;
    return item.SHOW_ID === currentRecord.SHOW_ID;
  });
}

function checkOnThisDayAnniversary() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();

  const anniversaries = allTickets.filter(t => {
    if (!isValidValue(t.DATUM)) return false;
    const parts = t.DATUM.split('-');
    if (parts.length !== 3) return false;
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return d === currentDay && m === currentMonth;
  });

  if (anniversaries.length > 0) {
    const selected = anniversaries[0];
    const concertYear = parseInt(selected.DATUM.split('-')[0], 10);
    const yearsAgo = today.getFullYear() - concertYear;

    const banner = document.getElementById('otdBanner');
    const titleEl = document.getElementById('otdTitle');
    const btn = document.getElementById('otdBtn');

    if (!banner || !titleEl || !btn) return;

    let locationText = formatLocationText(selected);
    let text = `<strong>${yearsAgo} years ago</strong> (${formatDisplayDate(selected.DATUM)}): Joe Jackson played in ${locationText}`;
    if (anniversaries.length > 1) {
      text += ` <em>(+${anniversaries.length - 1} more show today)</em>`;
    }

    titleEl.innerHTML = text;
    banner.classList.add('active');

    btn.onclick = () => {
      const targetIndex = filteredTickets.indexOf(selected);
      if (targetIndex !== -1) {
        openDirectImagePreview(targetIndex);
      } else {
        document.getElementById('searchInput').value = '';
        sessionStorage.removeItem('jj_museum_search');
        if (document.getElementById('searchClearBtn')) {
          document.getElementById('searchClearBtn').style.display = 'none';
        }
        document.getElementById('yearFilter').value = '';
        document.getElementById('cityFilter').value = '';
        currentCategory = 'ALL';
        filterData();
        setTimeout(() => {
          openDirectImagePreview(filteredTickets.indexOf(selected));
        }, 100);
      }
    };
  }
}

// OTEVŘENÍ LIGHTBOXU S ZTMAVENÝM A ROZOSTŘENÝM POZADÍM
function openDirectImagePreview(ticketIndex) {
  const t = filteredTickets[ticketIndex];
  if (!t || !t.SOUBOR_SKEN) return;

  const skenFiles = t.SOUBOR_SKEN.split(',').map(s => s.trim()).filter(Boolean);
  if (skenFiles.length === 0) return;

  if (activeViewerInstance) {
    activeViewerInstance.destroy();
    activeViewerInstance = null;
  }

  const container = document.createElement('div');
  container.style.display = 'none';

  skenFiles.forEach((file) => {
    const img = document.createElement('img');
    img.src = `./scans/${file}`;
    img.alt = `${formatDisplayDate(t.DATUM)} - ${formatLocationText(t)}`;
    container.appendChild(img);
  });

  document.body.appendChild(container);

  activeViewerInstance = new Viewer(container, {
    backdrop: 'static',
    hidden: function() {
      activeViewerInstance.destroy();
      activeViewerInstance = null;
      document.body.removeChild(container);
    },
    title: function() {
      return `${formatDisplayDate(t.DATUM)} | ${formatLocationText(t)} (${t.KATEGORIE || 'Ticket'})`;
    },
    toolbar: {
      zoomIn: 1,
      zoomOut: 1,
      oneToOne: 1,
      reset: 1,
      prev: skenFiles.length > 1 ? 1 : 0,
      next: skenFiles.length > 1 ? 1 : 0,
      rotateLeft: 1,
      rotateRight: 1,
    }
  });

  activeViewerInstance.show();
}

function openQuickImageModal(scanFileName) {
  if (!scanFileName) return;

  const firstFile = scanFileName.split(',')[0].trim();
  const quickImg = document.createElement('img');
  quickImg.src = `./scans/${firstFile}`;

  if (quickViewerInstance) {
    quickViewerInstance.destroy();
    quickViewerInstance = null;
  }

  quickViewerInstance = new Viewer(quickImg, {
    backdrop: 'static',
    hidden: function() {
      quickViewerInstance.destroy();
      quickViewerInstance = null;
    }
  });

  quickViewerInstance.show();
}

// Inicializace po načtení DOMu
window.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') clearSearchInput();
    });
    searchInput.addEventListener('input', handleSearchInput);
  }

  Papa.parse('joe_jackson_tickets_cleaned.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (!results.data || results.data.length === 0) {
        console.error("CSV file is empty or could not be loaded.");
        return;
      }
      
      allTickets = shuffleArray(results.data);

      updateYearBadge();
      populateFilters();

      const savedSearch = sessionStorage.getItem('jj_museum_search');
      if (savedSearch && searchInput) {
        searchInput.value = savedSearch;
        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) clearBtn.style.display = 'block';
      }

      filterData();
      checkOnThisDayAnniversary();
    },
    error: function(err) {
      console.error("Error loading CSV file:", err);
    }
  });
});

function updateYearBadge() {
  const years = allTickets
    .map(t => (t.DATUM && t.DATUM.length >= 4) ? parseInt(t.DATUM.substring(0, 4), 10) : 0)
    .filter(y => y > 1900);
  if (years.length > 0) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const badge = document.getElementById('yearBadge');
    if (badge) badge.textContent = `${minYear} – ${maxYear}`;
  }
}

function populateFilters() {
  const yearSelect = document.getElementById('yearFilter');
  if (!yearSelect) return;
  const yearsSet = new Set();

  allTickets.forEach(t => {
    if (t.DATUM && t.DATUM.length >= 4) {
      const y = parseInt(t.DATUM.substring(0, 4), 10);
      if (y > 1900) yearsSet.add(y);
    }
  });

  const sortedYears = [...yearsSet].sort((a, b) => b - a);
  sortedYears.forEach(year => {
    const opt = document.createElement('option');
    opt.value = year;
    opt.textContent = year;
    yearSelect.appendChild(opt);
  });

  const citySelect = document.getElementById('cityFilter');
  if (!citySelect) return;
  const citySet = new Set();

  allTickets.forEach(t => {
    if (isValidValue(t.MESTO)) citySet.add(t.MESTO.trim());
  });

  const uniqueCities = [...citySet].sort((a, b) => a.localeCompare(b));
  
  uniqueCities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city; 
    opt.textContent = city;
    citySelect.appendChild(opt);
  });
}

function renderCategoryTabs(matchesBeforeCategoryFilter) {
  const tabsContainer = document.getElementById('categoryTabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  const counts = { 
    'Tickets': 0, 'Passes': 0, 'Programs': 0, 'Posters': 0, 
    'T-shirts': 0, 'Memorabilia': 0, 'Videos': 0, 'ALL': matchesBeforeCategoryFilter.length 
  };

  matchesBeforeCategoryFilter.forEach(t => {
    const cat = getTicketCategory(t);
    if (counts[cat] !== undefined) counts[cat]++;
    if (isValidValue(t.YOUTUBE_URL)) counts['Videos']++;
  });

  const categoryOrder = ['Tickets', 'Passes', 'Programs', 'Posters', 'T-shirts', 'Memorabilia', 'Videos', 'ALL'];
  const categoryLabels = { 
    'Tickets': '🎫 Tickets', 'Passes': '🪪 Passes', 'Programs': '📖 Programs', 
    'Posters': '🖼️ Posters', 'T-shirts': '🎽 T-shirts', 'Memorabilia': '⭐ Memorabilia', 
    'Videos': '🎬 Videos', 'ALL': '✨ All Records' 
  };

  categoryOrder.forEach(catKey => {
    const count = counts[catKey];
    if (count > 0 || catKey === 'ALL' || catKey === 'Tickets') {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${currentCategory === catKey ? 'active' : ''}`;
      btn.innerHTML = `${categoryLabels[catKey]} <span style="opacity: 0.75; font-size: 0.8em;">(${count})</span>`;
      btn.onclick = () => { currentCategory = catKey; filterData(); };
      tabsContainer.appendChild(btn);
    }
  });
}

function setLayout(layout) {
  currentLayout = layout;
  document.getElementById('btnGrid').className = `toggle-btn ${layout === 'grid' ? 'active' : ''}`;
  document.getElementById('btnList').className = `toggle-btn ${layout === 'list' ? 'active' : ''}`;
  document.getElementById('ticketsContainer').className = `tickets-container ${layout}-view`;
  renderPaginated();
}

function changePageSize() {
  const val = document.getElementById('pageSizeFilter').value;
  pageSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
  currentPage = 1;
  renderPaginated();
}

function filterData() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const selectedYear = document.getElementById('yearFilter')?.value || '';
  const selectedCity = document.getElementById('cityFilter')?.value || '';
  const sort = document.getElementById('sortFilter')?.value || 'random';

  const matchesBase = allTickets.filter(t => {
    const locationText = formatLocationText(t).toLowerCase();
    const itemYear = (t.DATUM && t.DATUM.length >= 4) ? t.DATUM.substring(0, 4) : '';
    const rawDate = (t.DATUM || '').toLowerCase();
    const formattedDate = formatDisplayDate(t.DATUM).toLowerCase();

    const qMatch = !query || 
      locationText.includes(query) ||
      rawDate.includes(query) ||
      formattedDate.includes(query) ||
      (t.SUPPORTING_ACT || '').toLowerCase().includes(query) ||
      (t.LINEUP || '').toLowerCase().includes(query) ||
      (t.SETLIST || '').toLowerCase().includes(query);
      
    const yMatch = !selectedYear || String(itemYear) === String(selectedYear);
    const cMatch = !selectedCity || (t.MESTO || '').toLowerCase() === selectedCity.toLowerCase();
    return qMatch && yMatch && cMatch;
  });

  renderCategoryTabs(matchesBase);

  filteredTickets = matchesBase.filter(t => {
    if (currentCategory === 'ALL') return true;
    if (currentCategory === 'Videos') return isValidValue(t.YOUTUBE_URL);
    return getTicketCategory(t).toLowerCase() === currentCategory.toLowerCase();
  });

  if (sort === 'oldest') {
    filteredTickets.sort((a, b) => (a.DATUM || '').localeCompare(b.DATUM || ''));
  } else if (sort === 'newest') {
    filteredTickets.sort((a, b) => (b.DATUM || '').localeCompare(a.DATUM || ''));
  }

  currentPage = 1;
  renderPaginated();
}

function renderPaginated() {
  let pageData = pageSize === 'ALL' ? filteredTickets : filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  renderTickets(pageData);
  renderPaginationControls();
}

function renderTickets(tickets) {
  const container = document.getElementById('ticketsContainer');
  container.innerHTML = '';

  if (tickets.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 40px;">No items found matching your criteria.</p>';
    return;
  }

  tickets.forEach((t) => {
    const globalIndex = filteredTickets.indexOf(t);
    const card = document.createElement('div');
    card.className = 'ticket-card';
    
    card.onclick = (e) => {
      if (e.target.closest('.icon-btn')) return;
      openDirectImagePreview(globalIndex);
    };

    const skenFiles = (t.SOUBOR_SKEN || '').split(',').map(s => s.trim()).filter(Boolean);
    const firstImgFile = skenFiles[0] || '';
    const imgSrc = firstImgFile ? `./scans/${firstImgFile}` : '';
    const locationText = formatLocationText(t);

    let iconsHTML = '';

    if (isValidValue(t.ID_MEMORABILIA)) {
      iconsHTML += `
        <button class="icon-btn" title="Edit Record" onclick="event.stopPropagation(); window.location.href='edit_ticket_new.html?id=${encodeURIComponent(t.ID_MEMORABILIA)}';">
          ✏️
        </button>`;
    }

    if (isValidValue(t.YOUTUBE_URL)) {
      iconsHTML += `
        <button class="icon-btn" title="YouTube video" onclick="event.stopPropagation(); openVideoModal(${globalIndex});">
          🎬
        </button>`;
    }

    const songCount = parseInt(t.POCET_SKLADEB, 10) || 0;
    const hasSetlist = isValidValue(t.SETLIST) && songCount > 0;
    if (hasSetlist) {
      iconsHTML += `
        <button class="icon-btn badge-setlist" title="Setlist (${songCount} songs)" onclick="event.stopPropagation(); toggleCollapsible('setlist-${globalIndex}');">
          🎵 ${songCount}
        </button>`;
    }

    const hasLineup = isValidValue(t.LINEUP);
    if (hasLineup) {
      iconsHTML += `
        <button class="icon-btn" title="Band Line-up" onclick="event.stopPropagation(); toggleCollapsible('lineup-${globalIndex}');">
          👥
        </button>`;
    }

    const relatedItems = getRelatedItems(t);
    relatedItems.forEach(rel => {
      const relCat = getTicketCategory(rel);
      let icon = '🖼️';
      let title = 'Related Poster';

      if (relCat === 'Tickets') { icon = '🎫'; title = 'Related Ticket'; }
      else if (relCat === 'Passes') { icon = '🪪'; title = 'Related Pass'; }
      else if (relCat === 'Programs') { icon = '📖'; title = 'Related Program'; }

      const relFile = (rel.SOUBOR_SKEN || '').split(',')[0].trim();
      iconsHTML += `
        <button class="icon-btn" title="${title}" onclick="event.stopPropagation(); openQuickImageModal('${relFile}');">
          ${icon}
        </button>`;
    });

    let collapsibleHTML = '';
    if (hasSetlist) {
      const songs = t.SETLIST.split(',').map(s => s.trim());
      collapsibleHTML += `<div class="collapsible-content" id="setlist-${globalIndex}"><ol>${songs.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
    }
    if (hasLineup) {
      const members = t.LINEUP.split(/[;/]/).map(m => m.trim()).filter(Boolean);
      collapsibleHTML += `<div class="collapsible-content" id="lineup-${globalIndex}"><ul>${members.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
    }

    card.innerHTML = `
      <div class="card-img-wrapper">
        ${imgSrc ? `<img src="${imgSrc}" alt="Scan" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IxMDAlIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiMzMzMiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+='">` : ''}
      </div>
      <div class="card-content">
        <div class="card-main-row">
          <div class="card-info-left">
            ${t.DATUM ? `<div class="card-date">${formatDisplayDate(t.DATUM)}</div>` : ''}
            <div class="info-text">${locationText}</div>
          </div>
          ${iconsHTML ? `<div class="card-icon-col">${iconsHTML}</div>` : ''}
        </div>
        ${collapsibleHTML}
      </div>
    `;
    
    container.appendChild(card);
  });
}

function renderPaginationControls() {
  const container = document.getElementById('paginationContainer');
  if (!container) return;
  container.innerHTML = '';
  if (pageSize === 'ALL' || filteredTickets.length <= pageSize) return;

  const totalPages = Math.ceil(filteredTickets.length / pageSize);

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn'; prevBtn.textContent = '◄ Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => { currentPage--; renderPaginated(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 10 && Math.abs(i - currentPage) > 3 && i !== 1 && i !== totalPages) {
      if (i === 2 || i === totalPages - 1) {
        const dots = document.createElement('span'); dots.textContent = '...'; dots.style.color = 'var(--text-muted)';
        container.appendChild(dots);
      }
      continue;
    }
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`; pageBtn.textContent = i;
    pageBtn.onclick = () => { currentPage = i; renderPaginated(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    container.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn'; nextBtn.textContent = 'Next ►';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => { currentPage++; renderPaginated(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  container.appendChild(nextBtn);
}

function toggleCollapsible(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
