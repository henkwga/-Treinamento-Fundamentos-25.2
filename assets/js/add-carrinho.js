
  function addToCart(id, qty=1){
    const LS_KEY = 'cart';
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch {}
    const item = cart.find(i => i.id === id);
    if (item) item.qty += qty; else cart.push({ id, qty });
    localStorage.setItem(LS_KEY, JSON.stringify(cart));
    alert('Adicionado ao carrinho!');
  }
