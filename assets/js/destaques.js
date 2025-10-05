(async function () {
    const rail = document.getElementById('hlRail');
    const toBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const PICKS = [
        { id: '1' },
        { id: '2' },
        { id: '3' },
        { id: '4' },
        { id: '5' }
    ];

    const FALLBACK_LIMIT = 8;

    const slug = s => (s || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let albums = [];
    try {
        const res = await fetch('assets/data/albums.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Falha ao carregar albums.json');
        albums = await res.json();
    } catch (e) {
        console.error(e);
        return;
    }

    albums = albums.map(a => ({ ...a, id: a.id || slug(`${a.artist}-${a.title}`) }));

    const byId = Object.fromEntries(albums.map(a => [a.id, a]));

    let destaque = [];
    if (Array.isArray(PICKS) && PICKS.length) {
        destaque = PICKS.map(p => {
            const base = byId[p.id];
            return { ...base, ...(p.override || {}) };
        }).filter(Boolean);
    } else {
        destaque = [...albums]
            .sort((a, b) => (b.weight || 0) - (a.weight || 0))
            .slice(0, FALLBACK_LIMIT);
    }

    const frag = document.createDocumentFragment();
    destaque.forEach(a => {
        const article = document.createElement('article');
        article.className = 'album-card';
        const safeAlt = `${a.artist || ''} – ${(a.title || '')}`.replace(/"/g, '&quot;');

        article.innerHTML = `
      <div class="cover">
        <img src="${a.image || ''}" alt="${safeAlt}">
      </div>
      <h3 class="album">${a.title || ''}</h3>
      <p class="artist">${a.artist || ''}</p>
    `;
        frag.appendChild(article);
    });

    rail.replaceChildren(frag);
})();

