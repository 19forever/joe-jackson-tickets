function openDirectImagePreview(ticketIndex) {
  const t = filteredTickets[ticketIndex];
  if (!t) return;

  const rawSken = (t.SOUBOR_SKEN && isValidValue(t.SOUBOR_SKEN)) ? t.SOUBOR_SKEN : '';
  const skenFiles = rawSken.split(',').map(s => s.trim()).filter(Boolean);

  // Pokud CHYBÍ SKEN, přesměrujeme uživatele přímo na formulář s předvyplněnými údaji o koncertu!
  if (skenFiles.length === 0) {
    const params = new URLSearchParams({
      date: t.DATUM || '',
      city: t.MESTO || '',
      venue: t.VENUE || '',
      category: t.KATEGORIE || 'Tickets'
    });
    window.location.href = `ticket_form.html?${params.toString()}`;
    return;
  }

  // Pokud sken existuje, otevřeme prohlížeč obrázků (Viewer.js)
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
    img.onerror = function() { this.src = MISSING_TICKET_SVG; };
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
