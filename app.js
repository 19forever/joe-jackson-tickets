let allTickets = [];
let filteredTickets = [];
let currentLayout = 'grid';
let currentPage = 1;
let pageSize = 50;
let currentCategory = 'Tickets';
let currentModalIndex = -1;

let imageViewerInstance = null;
let quickViewerInstance = null;

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

function openVideoModal(youtubeUrl) {
  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);
  if (!embedUrl) {
    window.open(youtubeUrl, '_blank');
    return;
  }

  const iframe = document.getElementById('youtubeIframe');
  iframe.src = embedUrl;
  document.getElementById('videoModal').classList.add('active');
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('youtubeIframe');
  iframe.src = ''; // Zastaví přehrávání zvuku po zavření
  modal.classList.remove('active');
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
  clearBtn.style.display = input.value.trim().length > 0 ? 'block' : 'none';
  filterData();
}

function clearSearchInput() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  input.value = '';
  clearBtn.style.display = 'none';
  filterData();
}

function openSurpriseTicket() {
  if (!filteredTickets || filteredTickets.length === 0) {
    alert("No tickets available to pick from!");
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredTickets.length);
  openModal(randomIndex);
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
        openModal(targetIndex);
      } else {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchClearBtn').style.display = 'none';
        document.getElementById('yearFilter').value = '';
        document.getElementById('cityFilter').value = '';
        currentCategory = 'ALL';
        filterData();
        setTimeout(() => {
          openModal(filteredTickets.indexOf(selected));
        }, 100);
      }
    };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  Papa.parse('joe_jackson_tickets_cleaned.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (!results.data || results.data.length === 0) {
        console.error("CSV file is empty or could not be loaded.");
        return;
      }
      allTickets = results.data;
      updateYearBadge();
      populateFilters();
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
    document.getElementById('yearBadge').textContent = `${minYear} – ${maxYear}`;
  }
}

function populateFilters() {
  const yearSelect = document.getElementById('yearFilter');
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
  tabsContainer.innerHTML = '';

  const counts = { 'Tickets': 0, 'Passes': 0, 'Programs': 0, 'Posters': 0, 'T-shirts': 0, 'Memorabilia': 0, 'ALL': matchesBeforeCategoryFilter.length };

  matchesBeforeCategoryFilter.forEach(t => {
    const cat = getTicketCategory(t);
    if (counts[cat] !== undefined) counts[cat]++;
  });

  const categoryOrder = ['Tickets', 'Passes', 'Programs', 'Posters', 'T-shirts', 'Memorabilia', 'ALL'];
  const categoryLabels = { 'Tickets': '🎫 Tickets', 'Passes': '🪪 Passes', 'Programs': '📖 Programs', 'Posters': '🖼️ Posters', 'T-shirts': '🎽 T-shirts', 'Memorabilia': '⭐ Memorabilia', 'ALL': '✨ All Records' };

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
  const query = document.getElementById('searchInput').value.toLowerCase();
  const selectedYear = document.getElementById('yearFilter').value;
  const selectedCity = document.getElementById('cityFilter').value;
  const sort = document.getElementById('sortFilter').value;

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
    return getTicketCategory(t).toLowerCase() === currentCategory.toLowerCase();
  });

  filteredTickets.sort((a, b) => {
    const dateStrA = a.DATUM || '';
    const dateStrB = b.DATUM || '';
    return sort === 'newest' ? dateStrB.localeCompare(dateStrA) : dateStrA.localeCompare(dateStrB);
  });

  currentPage = 1;
  renderPaginated();
}

function renderPaginated() {
  let pageData = pageSize === 'ALL' ? filteredTickets : filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  renderTickets(pageData);
  renderPaginationControls();
}

function openQuickImageModal(scanFileName) {
  if (!scanFileName) return;

  const firstFile = scanFileName.split(',')[0].trim();
  const quickImg = document.getElementById('quickViewerImg');
  quickImg.src = `./scans/${firstFile}`;

  if (quickViewerInstance) {
    quickViewerInstance.destroy();
  }

  quickViewerInstance = new Viewer(quickImg, {
    hidden: function() {
      quickViewerInstance.destroy();
      quickViewerInstance = null;
    }
  });

  quickViewerInstance.show();
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
      openModal(globalIndex);
    };

    const skenFiles = (t.SOUBOR_SKEN || '').split(',').map(s => s.trim()).filter(Boolean);
    const firstImgFile = skenFiles[0] || '';
    const imgSrc = firstImgFile ? `./scans/${firstImgFile}` : '';
    const locationText = formatLocationText(t);

    // 1. Příprava tlačítek ikon
    let iconsHTML = '';

    // YouTube ikona
    if (isValidValue(t.YOUTUBE_URL)) {
      iconsHTML += `
        <button class="icon-btn" title="YouTube video" onclick="event.stopPropagation(); openVideoModal('${t.YOUTUBE_URL}');">
          🎬
        </button>`;
    }

    // Setlist ikona s počtem skladeb
    const songCount = parseInt(t.POCET_SKLADEB, 10) || 0;
    const hasSetlist = isValidValue(t.SETLIST) && songCount > 0;
    if (hasSetlist) {
      iconsHTML += `
        <button class="icon-btn badge-setlist" title="Setlist (${songCount} songs)" onclick="event.stopPropagation(); toggleCollapsible('setlist-${globalIndex}');">
          🎵 ${songCount}
        </button>`;
    }

    // Line-up ikona
    const hasLineup = isValidValue(t.LINEUP);
    if (hasLineup) {
      iconsHTML += `
        <button class="icon-btn" title="Band Line-up" onclick="event.stopPropagation(); toggleCollapsible('lineup-${globalIndex}');">
          👥
        </button>`;
    }

    // Související předměty (Postery, Passy, Lístky)
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

    // 2. Skryté rozbalovací seznamy (Setlist / Line-up)
    let collapsibleHTML = '';
    if (hasSetlist) {
      const songs = t.SETLIST.split(',').map(s => s.trim());
      collapsibleHTML += `<div class="collapsible-content" id="setlist-${globalIndex}"><ol>${songs.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
    }
    if (hasLineup) {
      const members = t.LINEUP.split(';').map(m => m.trim());
      collapsibleHTML += `<div class="collapsible-content" id="lineup-${globalIndex}"><ul>${members.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
    }

    // 3. Sestavení výsledného HTML karty
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

function openModal(index) {
  if (index < 0 || index >= filteredTickets.length) return;
  currentModalIndex = index;
  const t = filteredTickets[currentModalIndex];

  if (imageViewerInstance) { imageViewerInstance.destroy(); imageViewerInstance = null; }

  const skenFiles = (t.SOUBOR_SKEN || '').split(',').map(s => s.trim()).filter(Boolean);
  const modalImg = document.getElementById('modalImg');
  const thumbContainer = document.getElementById('modalThumbnails');
  thumbContainer.innerHTML = '';

  if (skenFiles.length > 0) {
    modalImg.src = `./scans/${skenFiles[0]}`;
    if (skenFiles.length > 1) {
      skenFiles.forEach((file, idx) => {
        const thumb = document.createElement('img');
        thumb.className = `modal-thumb ${idx === 0 ? 'active' : ''}`;
        thumb.src = `./scans/${file}`;
        thumb.onclick = () => {
          modalImg.src = `./scans/${file}`;
          document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        };
        thumbContainer.appendChild(thumb);
      });
    }
  } else { modalImg.src = ''; }

  setTimeout(() => {
    imageViewerInstance = new Viewer(modalImg, { toolbar: true, navbar: false, title: false });
  }, 100);

  document.getElementById('modalDate').textContent = formatDisplayDate(t.DATUM) || '';
  document.getElementById('modalInfo').textContent = formatLocationText(t);

  const editLink = document.getElementById('modalEditLink');
  if (editLink) {
    editLink.href = `edit_ticket_new.html?id=${encodeURIComponent(t.ID_MEMORABILIA || '')}`;
  }

  const modalGrid = document.getElementById('modalGrid');
  const supportGroup = document.getElementById('modalSupportGroup');
  const seatGroup = document.getElementById('modalSeatGroup');
  
  let hasGridItems = false;

  if (isValidValue(t.SUPPORTING_ACT)) {
    document.getElementById('modalSupport').textContent = t.SUPPORTING_ACT.trim();
    supportGroup.style.display = 'block';
    hasGridItems = true;
  } else { supportGroup.style.display = 'none'; }

  seatGroup.style.display = 'none';

  modalGrid.style.display = hasGridItems ? 'grid' : 'none';

  const modalColsSec = document.getElementById('modalColumnsSection');
  let colsHTML = '';

  const lineupStr = t.LINEUP || '';
  const setlistStr = t.SETLIST || '';
  const songCount = parseInt(t.POCET_SKLADEB, 10) || 0;

  const hasLineup = isValidValue(lineupStr);
  const hasSetlist = setlistStr && isValidValue(setlistStr) && songCount > 0;

  if (hasLineup) {
    const members = lineupStr.split(';').map(m => m.trim());
    const memberItems = members.map(m => `<li>${m}</li>`).join('');
    colsHTML += `
      <div class="flashcard-col-box">
        <h4 style="color: var(--accent-blue);">👥 Band Line-up</h4>
        <ul style="padding-left: 20px; color: var(--text-main); font-size: 0.85rem; line-height: 1.6;">${memberItems}</ul>
      </div>`;
  }

  if (hasSetlist) {
    const songs = setlistStr.split(',').map(s => s.trim());
    const listItems = songs.map(s => `<li>${s}</li>`).join('');
    colsHTML += `
      <div class="flashcard-col-box">
        <h4 style="color: var(--accent-yellow);">🎵 Full Setlist (${songCount} songs)</h4>
        <ol style="padding-left: 20px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.6;">${listItems}</ol>
      </div>`;
  }

  modalColsSec.innerHTML = colsHTML;

  const mediaContainer = document.getElementById('modalMediaContainer');
  let mediaHTML = '';

  if (isValidValue(t.YOUTUBE_URL)) {
    mediaHTML += `
      <div class="media-embed-box">
        <h4>🎬 Concert Video / Bootleg</h4>
        <div style="margin-bottom: 8px;">
          <button class="media-link-btn" onclick="openVideoModal('${t.YOUTUBE_URL}')">▶ Play Video</button>
        </div>
      </div>`;
  }

  if (isValidValue(t.REVIEW_URL)) {
    mediaHTML += `
      <div class="media-embed-box">
        <h4>📰 Press & Archive Review</h4>
        <iframe src="${t.REVIEW_URL}" width="100%" height="250" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen style="border-radius:6px; background:#000;"></iframe>
      </div>`;
  }

  if (isValidValue(t.SETLIST_URL)) {
    mediaHTML += `
      <div class="media-links-bar">
        <a href="${t.SETLIST_URL}" target="_blank" class="media-link-btn">📊 View Show Details on Setlist.fm ↗</a>
      </div>`;
  }

  mediaContainer.innerHTML = mediaHTML;

  document.getElementById('modalCounter').textContent = `${currentModalIndex + 1} / ${filteredTickets.length}`;
  document.getElementById('modalPrevBtn').disabled = currentModalIndex === 0;
  document.getElementById('modalNextBtn').disabled = currentModalIndex === filteredTickets.length - 1;

  document.getElementById('detailModal').classList.add('active');
}

function navigateModal(direction) {
  const newIndex = currentModalIndex + direction;
  if (newIndex >= 0 && newIndex < filteredTickets.length) openModal(newIndex);
}

function closeModal() {
  document.getElementById('detailModal').classList.remove('active');
  if (imageViewerInstance) { imageViewerInstance.destroy(); imageViewerInstance = null; }
  currentModalIndex = -1;
}

function closeModalOnOverlay(e) {
  if (e.target.id === 'detailModal') closeModal();
}
// Odchytávání klávesy Esc pro vymazání vyhledávání
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSearchInput();
      }
    });
  }
});

// Aktualizovaný render karty v renderTickets()
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
      openModal(globalIndex);
    };

    const skenFiles = (t.SOUBOR_SKEN || '').split(',').map(s => s.trim()).filter(Boolean);
    const firstImgFile = skenFiles[0] || '';
    const imgSrc = firstImgFile ? `./scans/${firstImgFile}` : '';
    const locationText = formatLocationText(t);

    // Příprava ikon do pravého dolního rohu obrázku (vykreslí se jen existující)
    let iconBarHTML = '<div class="card-icon-bar">';

    // 1. YouTube ikona
    if (isValidValue(t.YOUTUBE_URL)) {
      iconBarHTML += `
        <button class="icon-btn" title="YouTube video" onclick="event.stopPropagation(); openVideoModal('${t.YOUTUBE_URL}');">
          🎬
        </button>`;
    }

    // 2. Setlist ikona / Počet skladeb
    const songCount = parseInt(t.POCET_SKLADEB, 10) || 0;
    if (isValidValue(t.SETLIST) && songCount > 0) {
      iconBarHTML += `
        <button class="icon-btn badge-setlist" title="Setlist (${songCount} songs)" onclick="event.stopPropagation(); toggleCollapsible('setlist-${globalIndex}');">
          🎵 ${songCount}
        </button>`;
    }

    // 3. Line-up ikona
    if (isValidValue(t.LINEUP)) {
      iconBarHTML += `
        <button class="icon-btn" title="Band Line-up" onclick="event.stopPropagation(); toggleCollapsible('lineup-${globalIndex}');">
          👥
        </button>`;
    }

    // 4. Propojené plakáty / lístky (Related items)
    const relatedItems = getRelatedItems(t);
    relatedItems.forEach(rel => {
      const relCat = getTicketCategory(rel);
      let icon = '🖼️';
      let title = 'Related Poster';

      if (relCat === 'Tickets') { icon = '🎫'; title = 'Related Ticket'; }
      else if (relCat === 'Passes') { icon = '🪪'; title = 'Related Pass'; }
      else if (relCat === 'Programs') { icon = '📖'; title = 'Related Program'; }

      const relFile = (rel.SOUBOR_SKEN || '').split(',')[0].trim();
      iconBarHTML += `
        <button class="icon-btn" title="${title}" onclick="event.stopPropagation(); openQuickImageModal('${relFile}');">
          ${icon}
        </button>`;
    });

    iconBarHTML += '</div>';

    // Skryté panely pro rozbalení Setlistu / Line-upu
    let collapsibleHTML = '';
    if (isValidValue(t.SETLIST) && songCount > 0) {
      const songs = t.SETLIST.split(',').map(s => s.trim());
      collapsibleHTML += `<div class="collapsible-content" id="setlist-${globalIndex}"><ol>${songs.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
    }
    if (isValidValue(t.LINEUP)) {
      const members = t.LINEUP.split(';').map(m => m.trim());
      collapsibleHTML += `<div class="collapsible-content" id="lineup-${globalIndex}"><ul>${members.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
    }

    card.innerHTML = `
      <div class="card-img-wrapper">
        ${imgSrc ? `<img src="${imgSrc}" alt="Scan" onerror="this.src='data:image/svg+xml;base64,...'">` : ''}
        ${iconBarHTML}
      </div>
      <div class="card-content">
        ${t.DATUM ? `<div class="card-date">${formatDisplayDate(t.DATUM)}</div>` : ''}
        <div class="info-text">${locationText}</div>
        ${collapsibleHTML}
      </div>
    `;
    
    container.appendChild(card);
  });
}
