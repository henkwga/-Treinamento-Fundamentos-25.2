(function(){
  const LS_USERS = 'users';      
  const LS_SESSION = 'session';  

  async function sha256(text){
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }

  const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function loadUsers(){
    try { return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); }
    catch { return []; }
  }
  function saveUsers(arr){ localStorage.setItem(LS_USERS, JSON.stringify(arr)); }

  function getSession(){
    try { return JSON.parse(localStorage.getItem(LS_SESSION) || 'null'); }
    catch { return null; }
  }
  function setSession(sess){ localStorage.setItem(LS_SESSION, JSON.stringify(sess)); }
  function clearSession(){ localStorage.removeItem(LS_SESSION); }

  async function handleRegister(e){
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass = document.getElementById('regPass').value;
    const pass2 = document.getElementById('regPass2').value;
    const msg = document.getElementById('regMsg');

    msg.textContent = '';

    if (!name || !emailOk(email) || pass.length < 6){
      msg.textContent = 'Verifique os campos (email válido e senha ≥ 6).';
      return;
    }
    if (pass !== pass2){
      msg.textContent = 'As senhas não coincidem.';
      return;
    }

    const users = loadUsers();
    if (users.some(u => u.email === email)){
      msg.textContent = 'Este e-mail já está cadastrado.';
      return;
    }

    const passHash = await sha256(pass);
    users.push({ id: crypto.randomUUID(), name, email, passHash });
    saveUsers(users);
    setSession({ email });

    msg.style.color = 'var(--cor01)';
    msg.textContent = 'Conta criada! Redirecionando…';
    setTimeout(() => location.href = 'catalogo.html', 700);
  }

  async function handleLogin(e){
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;
    const msg = document.getElementById('loginMsg');

    msg.textContent = '';

    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user){
      msg.textContent = 'E-mail não encontrado.';
      return;
    }
    const passHash = await sha256(pass);
    if (user.passHash !== passHash){
      msg.textContent = 'Senha incorreta.';
      return;
    }

    setSession({ email });
    msg.style.color = 'var(--cor01)';
    msg.textContent = 'Bem-vindo! Redirecionando…';
    setTimeout(() => location.href = 'catalogo.html', 500);
  }

  function logout(){
    clearSession();
    location.reload();
  }

  window.renderNavAuth = function(container){
    const sess = getSession();
    if (!container) return;

    if (sess){
      const users = loadUsers();
      const u = users.find(x => x.email === sess.email);
      const name = u?.name?.split(' ')[0] || 'Usuário';

      container.innerHTML = `
        <span class="nav-user" style="color:var(--cor03); margin-right:8px">Olá, ${name}</span>
        <a class="btn" href="carrinho.html">Carrinho</a>
        <button class="btn btn-primary" id="btnLogout">Sair</button>
      `;
      container.querySelector('#btnLogout').addEventListener('click', logout);
    } else {
      container.innerHTML = `
        <a class="btn" href="login.html">Entrar</a>
        <a class="btn btn-primary" href="register.html">Criar conta</a>
      `;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const login = document.getElementById('formLogin');
    const register = document.getElementById('formRegister');
    if (login) login.addEventListener('submit', handleLogin);
    if (register) register.addEventListener('submit', handleRegister);

    const tabs = document.querySelectorAll('.auth .tab');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.toggle('active', x===t));
      const showLogin = t.dataset.tab === 'login';
      document.getElementById('formLogin').classList.toggle('hidden', !showLogin);
      document.getElementById('formRegister').classList.toggle('hidden', showLogin);
    }));

    const navAuth = document.getElementById('navAuth');
    if (navAuth) renderNavAuth(navAuth);
  });

  window.auth = {
    getSession,
    isLogged: () => !!getSession(),
    require: (redirect='auth.html') => { if (!getSession()) location.href = redirect; },
    logout
  };
})();
