
(function () {
    const LS_KEY = 'cart';
    const COUPON_KEY = 'cart_coupon';

    const $ = s => document.querySelector(s);
    const list = $('#cartList');
    const sumSubtotal = $('#sumSubtotal');
    const sumDiscount = $('#sumDiscount');
    const sumTotal = $('#sumTotal');
    const couponInput = $('#coupon');
    const applyCouponBtn = $('#applyCoupon');
    const clearBtn = $('#clearCart');
    const checkoutBtn = $('#checkout');

    const toBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const COUPONS = {
        'VINIL10': { type: 'percent', value: 10, label: '10% OFF' },
    };

    let catalog = [];
    let cart = [];
    let coupon = localStorage.getItem(COUPON_KEY) || '';

    const saveCart = () => localStorage.setItem(LS_KEY, JSON.stringify(cart));
    const loadCart = () => {
        try { cart = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
        catch { cart = []; }
    };

    async function init() {
        const res = await fetch('assets/data/albums.json', { cache: 'no-cache' });
        catalog = await res.json();
        loadCart();
        if (coupon) couponInput.value = coupon;
        render();
        bind();
    }

    function bind() {
        applyCouponBtn.addEventListener('click', applyCoupon);
        clearBtn.addEventListener('click', () => {
            cart = []; saveCart(); render();
        });
        checkoutBtn.addEventListener('click', (e) => {
            if (!auth.isLogged()) {
                e.preventDefault();
                const next = `${location.pathname}${location.search || ''}`;
                sessionStorage.setItem('afterLoginAction', 'checkout');
                location.href = `login.html?next=${encodeURIComponent(next)}`;
                return;
            }

            alert('finalizando compra');
        });

    }

    function getAlbumById(id) { return catalog.find(a => a.id === id); }

    function setQty(id, qty) {
        qty = Math.max(1, Math.min(99, parseInt(qty || 1, 10)));
        const it = cart.find(i => i.id === id);
        if (it) it.qty = qty; else cart.push({ id, qty });
        saveCart(); render();
    }

    function removeItem(id) {
        cart = cart.filter(i => i.id !== id);
        saveCart(); render();
    }

    function applyCoupon() {
        const code = (couponInput.value || '').trim().toUpperCase();
        if (!code) { coupon = ''; localStorage.removeItem(COUPON_KEY); render(); return; }
        if (!COUPONS[code]) { alert('cupom inválido'); return; }
        coupon = code; localStorage.setItem(COUPON_KEY, coupon); render();
    }

    function computeTotals() {
        let subtotal = 0;
        cart.forEach(it => {
            const a = getAlbumById(it.id);
            if (!a) return;
            subtotal += (a.price || 0) * (it.qty || 1);
        });

        let discount = 0;
        if (coupon && COUPONS[coupon]) {
            const c = COUPONS[coupon];
            if (c.type === 'percent') discount = subtotal * (c.value / 100);
        }

        const total = Math.max(0, subtotal - discount);
        return { subtotal, discount, total };
    }

    function render() {
        if (!cart.length) {
            list.innerHTML = `
        <div class="cart-empty">
          Seu carrinho está vazio.<br>
          <a class="btn" style="margin-top:10px; display:inline-block" href="catalogo.html">Ir ao catálogo</a>
        </div>`;
            sumSubtotal.textContent = toBRL(0);
            sumDiscount.textContent = '—';
            sumTotal.textContent = toBRL(0);
            return;
        }

        const frag = document.createDocumentFragment();
        cart.forEach(it => {
            const a = getAlbumById(it.id);
            if (!a) return;

            const row = document.createElement('div');
            row.className = 'cart-row';

            row.innerHTML = `
        <div class="cart-img"><img src="${a.image || ''}" alt="${a.title || ''}"></div>
        <div class="cart-info">
          <p class="cart-album">${a.title || ''}</p>
          <p class="cart-artist">${a.artist || ''}</p>
        </div>
        <div class="cart-price">
          <div>${toBRL(a.price || 0)}</div>
          <div class="cart-sub">Subtotal: ${toBRL((a.price || 0) * (it.qty || 1))}</div>
        </div>
        <div class="qty">
          <button aria-label="Diminuir">−</button>
          <input type="number" min="1" max="99" value="${it.qty || 1}" inputmode="numeric">
          <button aria-label="Aumentar">+</button>
        </div>
        <button class="cart-remove" aria-label="Remover">✕</button>
      `;

            const [btnMinus, input, btnPlus] = row.querySelectorAll('.qty > *');
            btnMinus.addEventListener('click', () => setQty(it.id, (it.qty || 1) - 1));
            btnPlus.addEventListener('click', () => setQty(it.id, (it.qty || 1) + 1));
            input.addEventListener('change', e => setQty(it.id, e.target.value));
            row.querySelector('.cart-remove').addEventListener('click', () => removeItem(it.id));

            frag.appendChild(row);
        });

        list.replaceChildren(frag);

        const { subtotal, discount, total } = computeTotals();
        sumSubtotal.textContent = toBRL(subtotal);
        sumDiscount.textContent = discount ? `− ${toBRL(discount)} (${COUPONS[coupon]?.label || ''})` : '—';
        sumTotal.textContent = toBRL(total);
    }

    init();
})();

