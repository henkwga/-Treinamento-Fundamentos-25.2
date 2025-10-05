
(async function () {
    const grid = document.getElementById('gridCatalogo');
    const chipsWrap = document.getElementById('chipsCats');
    const qInput = document.getElementById('q');
    const sortSel = document.getElementById('sort');
    const pageSizeSel = document.getElementById('pageSize');
    const loadMoreBtn = document.getElementById('loadMore');
    const countInfo = document.getElementById('countInfo');

    const toBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    let all = [], view = [];
    let rendered = 0;

    const params = new URLSearchParams(location.search);
    const setParam = (k, v) => { v ? params.set(k, v) : params.delete(k); history.replaceState(null, '', `${location.pathname}?${params}`) };

    try {
        const res = await fetch('assets/data/albums.json', { cache: 'no-cache' });
        all = await res.json();
    } catch (e) {
        console.error(e);
        return;
    }


    //gerador de slug (IA)
    const slug = s => (s || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    all = all.map(a => ({ ...a, id: a.id || slug(`${a.artist}-${a.title}`) }));


    const categories = [...new Set(all.map(a => (a.category || 'outros')))].sort();
    chipsWrap.append(
        ...['todas', ...categories].map(cat => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip';
            chip.dataset.cat = cat;
            chip.textContent = cat === 'todas' ? 'Todas' : cat[0].toUpperCase() + cat.slice(1);
            chip.addEventListener('click', () => {
                [...chipsWrap.querySelectorAll('.chip')].forEach(c => c.classList.toggle('active', c === chip));
                setParam('cat', cat === 'todas' ? '' : cat);
                apply();
            });
            return chip;
        })
    );

    const startCat = params.get('cat') || 'todas';
    const startQ = params.get('q') || '';
    const startSort = params.get('sort') || 'weight-desc';
    const startPageSize = parseInt(params.get('n') || '12', 10);

    qInput.value = startQ;
    sortSel.value = startSort;
    pageSizeSel.value = String(startPageSize);

    const initialChip = [...chipsWrap.querySelectorAll('.chip')].find(c => c.dataset.cat === startCat) || chipsWrap.querySelector('[data-cat="todas"]');
    if (initialChip) initialChip.classList.add('active');

    qInput.addEventListener('input', debounce(() => { setParam('q', qInput.value.trim()); apply(true); }, 250));
    sortSel.addEventListener('change', () => { setParam('sort', sortSel.value); apply(true); });
    pageSizeSel.addEventListener('change', () => { setParam('n', pageSizeSel.value); apply(true); });
    loadMoreBtn.addEventListener('click', () => renderNext());

    function debounce(fn, t = 250) { let id; return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), t); }; }

    function apply(resetPage = false) {
        const cat = params.get('cat') || 'todas';
        const q = (params.get('q') || '').toLowerCase();
        const sort = params.get('sort') || 'weight-desc';

        view = all.filter(a => {
            const inCat = (cat === 'todas') || ((a.category || 'outros') === cat);
            const text = `${a.title || ''} ${a.artist || ''}`.toLowerCase();
            const inQ = !q || text.includes(q);
            return inCat && inQ;
        });

        const sorters = {
            'weight-desc': (a, b) => (b.weight || 0) - (a.weight || 0),
            'price-asc': (a, b) => (a.price || 0) - (b.price || 0),
            'price-desc': (a, b) => (b.price || 0) - (a.price || 0),
            'title-asc': (a, b) => (a.title || '').localeCompare(b.title || ''),
            'artist-asc': (a, b) => (a.artist || '').localeCompare(b.artist || '')
        };
        view.sort(sorters[sort] || sorters['weight-desc']);

        if (resetPage) rendered = 0;

        renderInitial();
    }

    function renderInitial() {
        grid.innerHTML = '';
        const size = parseInt(pageSizeSel.value, 10) || 12;
        rendered = 0;

        const skeletons = Array.from({ length: Math.min(size, view.length || size) }, () => {
            const shell = document.createElement('div');
            shell.className = 'skeleton';
            return shell;
        });
        grid.append(...skeletons);

        setTimeout(() => {
            grid.innerHTML = '';
            renderNext();
        }, 120);

        updateFooter();
    }

    function renderNext() {
        const size = parseInt(pageSizeSel.value, 10) || 12;
        const slice = view.slice(rendered, rendered + size);

        const frag = document.createDocumentFragment();
        slice.forEach(a => {
            const card = document.createElement('article');
            card.className = 'album-card';
            const safeAlt = `${a.artist || ''} – ${a.title || ''}`.replace(/"/g, '&quot;');

            card.innerHTML = `
      <div class="cover">
        <img src="${a.image || ''}" alt="${safeAlt}">
        <span class="price">${toBRL(a.price)}</span>
        ${a.badge ? `<span class="badge">${a.badge}</span>` : ``}
      </div>
      <h3 class="album">${a.title || ''}</h3>
      <p class="artist">${a.artist || ''}</p>
      <button class="btn add-to-cart" data-id="${a.id}" aria-label="Adicionar ${a.title || ''} ao carrinho">
        Adicionar
      </button>
    `;
            frag.appendChild(card);
        });

        grid.appendChild(frag);
        rendered += slice.length;
        updateFooter();
    }


    function updateFooter() {
        countInfo.textContent = view.length
            ? `Mostrando ${Math.min(rendered, view.length)} de ${view.length} itens`
            : `Nenhum item encontrado`;
        loadMoreBtn.style.display = (rendered < view.length) ? 'inline-block' : 'none';
    }

    apply(true);

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart');
        if (!btn) return;
        const id = btn.dataset.id;
        addToCart(id, 1);
        toast('adicionado ao carrinho!');
    });


    
})();

