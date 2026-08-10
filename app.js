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

// Relace přes nově vygenerovaný SHOW_ID
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
    const d = new Date(t.DATUM);
    return !isNaN(d.getTime()) && d.getDate() === currentDay && d.getMonth() === currentMonth;
  });

  if (anniversaries.length > 0) {
    const selected = anniversaries[0];
    const concertDate = new Date(selected.DATUM);
    const yearsAgo = today.getFullYear() - concertDate.getFullYear();

    const banner = document.getElementById('otdBanner');
    const titleEl = document.getElementById('otdTitle');
    const btn = document.getElementById('otdBtn');

    let locationText = formatLocationText(selected);
    let text = `<strong>${yearsAgo} years ago</strong> (${concertDate.getFullYear()}): Joe Jackson played in ${locationText}`;
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
      allTickets = results.data;
      updateYearBadge();
      populateFilters();
      filterData();
      checkOnThisDayAnniversary();
    }
  });
});

function updateYearBadge() {
  const years = allTickets
    .map(t => t.DATUM ? new Date(t.DATUM).getFullYear() : 0)
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
    if (t.DATUM) {
      const y = new Date(t.DATUM).getFullYear();
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
  pageSize = val === 'ALL' ? 'ALL' : parseInt(val);
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
    const itemYear = t.DATUM ? new Date(t.DATUM).getFullYear() : '';

    const qMatch = !query || 
      locationText.includes(query) ||
      (t.DATUM || '').toLowerCase().includes(query) ||
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
    const dateA = t => t.DATUM ? new Date(t.DATUM).getTime() : 0;
    return sort === 'newest' ? dateA(b) - dateA(a) : dateA(a) - dateA(b);
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
      if (e.target.closest('.setlist-toggle-btn') || e.target.closest('.lineup-toggle-btn') || e.target.closest('.external-link-icon-btn') || e.target.closest('.related-btn')) return;
      openModal(globalIndex);
    };

    const skenFiles = (t.SOUBOR_SKEN || '').split(',').map(s => s.trim()).filter(Boolean);
    const firstImgFile = skenFiles[0] || '';
    const imgSrc = firstImgFile ? `./scans/${firstImgFile}` : '';

    const locationText = formatLocationText(t);

    const relatedItems = getRelatedItems(t);
    let relatedHTML = '';

    if (relatedItems.length > 0) {
      relatedHTML += '<div class="related-items-bar">';
      relatedItems.forEach(rel => {
        const relCat = getTicketCategory(rel);
        let icon = '🖼️';
        let label = 'Poster';

        if (relCat === 'Tickets') { icon = '🎫'; label = 'Ticket'; }
        else if (relCat === 'Passes') { icon = '🪪'; label = 'Pass'; }
        else if (relCat === 'Programs') { icon = '📖'; label = 'Program'; }

        const relFile = (rel.SOUBOR_SKEN || '').split(',')[0].trim();

        relatedHTML += `
          <button class="related-btn" title="Click to view image" onclick="event.stopPropagation(); openQuickImageModal('${relFile}')">
            ${icon} View ${label}
          </button>
        `;
      });
      relatedHTML += '</div>';
    }

    let collapsibleGroupHTML = '';
    const setlistStr = t.SETLIST || '';
    const songCount = parseInt(t.POCET_SKLADEB) || 0;
    const setlistUrl = t.SETLIST_URL || '';
    const lineupStr = t.LINEUP || '';

    const hasSetlist = setlistStr && isValidValue(setlistStr) && songCount > 0;
    const hasLineup = lineupStr && isValidValue(lineupStr);

    if (hasSetlist || hasLineup || setlistUrl) {
      collapsibleGroupHTML += '<div class="collapsible-group">';
      
      if (setlistUrl && isValidValue(setlistUrl)) {
        collapsibleGroupHTML += `
          <a href="${setlistUrl}" target="_blank" class="external-link-icon-btn" title="Open directly on Setlist.fm ↗" onclick="event.stopPropagation();">🔗</a>
        `;
      }

      if (hasSetlist) {
        collapsibleGroupHTML += `
          <button class="setlist-toggle-btn has-setlist" onclick="event.stopPropagation(); toggleCollapsible('setlist-${globalIndex}')">🎵 Setlist (${songCount})</button>
        `;
      }

      if (hasLineup) {
        collapsibleGroupHTML += `
          <button class="lineup-toggle-btn has-lineup" onclick="event.stopPropagation(); toggleCollapsible('lineup-${globalIndex}')">👥 Line-up</button>
        `;
      }

      collapsibleGroupHTML += '</div>';

      if (hasSetlist) {
        const songs = setlistStr.split(',').map(s => s.trim());
        const listItems = songs.map(s => `<li>${s}</li>`).join('');
        collapsibleGroupHTML += `<div class="collapsible-content" id="setlist-${globalIndex}"><ol>${listItems}</ol></div>`;
      }

      if (hasLineup) {
        const members = lineupStr.split(';').map(m => m.trim());
        const memberItems = members.map(m => `<li>${m}</li>`).join('');
        collapsibleGroupHTML += `<div class="collapsible-content" id="lineup-${globalIndex}"><ul>${memberItems}</ul></div>`;
      }
    }

    card.innerHTML = `
      <div class="card-img-wrapper">
        ${imgSrc ? `<img src="${imgSrc}" alt="Ticket Scan" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwMDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iIzMzMyIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='">` : ''}
      </div>
      <div class="card-content">
        ${t.DATUM ? `<div class="card-date">${t.DATUM}</div>` : ''}
        <div class="info-text">${locationText}</div>
        ${relatedHTML}
        ${collapsibleGroupHTML}
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

  document.getElementById('modalDate').textContent = t.DATUM || '';
  document.getElementById('modalInfo').textContent = formatLocationText(t);

  const editLink = document.getElementById('modalEditLink');
  if (editLink) {
    editLink.href = `edit_ticket.html?id=${encodeURIComponent(t.ID_MEMORABILIA || '')}`;
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
  const songCount = parseInt(t.POCET_SKLADEB) || 0;

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
          <a href="${t.YOUTUBE_URL}" target="_blank" class="media-link-btn">▶ Watch Video on YouTube ↗</a>
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
