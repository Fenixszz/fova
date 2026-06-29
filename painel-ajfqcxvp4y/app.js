/* ============================================================
   FOVA · CRM ADM — app logic
   ============================================================ */
(function () {
  'use strict';

  /* ---------- SVG icons (stroke, 24 grid) ---------- */
  const P = {
    painel: '<path d="M3 13h8V3H3zM13 21h8V3h-8zM3 21h8v-6H3z"/>',
    leads: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    decisores: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 8.2a3 3 0 0 1 0 5.6M18 20a5 5 0 0 0-3-4.6"/>',
    cadencia: '<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="8.5"/>',
    comousar: '<path d="M4 5.5A2 2 0 0 1 6 4h6v15H6a2 2 0 0 0-2 1.2z"/><path d="M20 5.5A2 2 0 0 0 18 4h-6v15h6a2 2 0 0 1 2 1.2z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z"/>',
    calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 3v3M16 3v3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="M7 10v7M7 7.2v.01M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7"/>',
    whatsapp: '<path d="M3 21l1.6-5.1A8.5 8.5 0 1 1 8.1 19.4z"/><path d="M9 8.6c-.3 0-.6.1-.8.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.5 3.9 2.2.8 2.7.6 3.2.5.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.3-.2-.6-.3"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 2.5 14.7 0 17M12 3.5c-2.5 2.3-2.5 14.7 0 17"/>',
    phone: '<path d="M6 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.7 2 2 0 0 1 6 3.5z"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    quote: '<path d="M7 7H4v5h3v5H4M17 7h3v5h-3v5h3"/>',
    source: '<path d="M10 13a4 4 0 0 0 5.7 0l2.5-2.5a4 4 0 0 0-5.7-5.7L11 6"/><path d="M14 11a4 4 0 0 0-5.7 0L5.8 13.5a4 4 0 0 0 5.7 5.7L13 18"/>',
    filter: '<path d="M3 5h18l-7 8v5l-4 2v-7z"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4"/>',
  };
  function icon(name, w) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (w ? ' width="' + w + '" height="' + w + '"' : '') + '>' + (P[name] || '') + '</svg>'; }

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const NF = new Intl.NumberFormat('pt-BR');
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const isReal = (v) => v && !/^(não encontrado|nao encontrado|não pesquisado|—|-)/i.test(v.trim());

  function waLink(num) { let d = digits(num); if (!d) return null; if (d.length <= 11) d = '55' + d; return 'https://wa.me/' + d; }
  function igLink(h) { if (!h) return null; const m = String(h).match(/@?([A-Za-z0-9._]+)/); return m ? 'https://instagram.com/' + m[1] : null; }
  function liLink(s) { if (!s) return null; const m = String(s).match(/linkedin\.com\/[A-Za-z0-9/_-]+/i); return m ? 'https://' + m[0] : null; }
  function siteLink(s) { if (!s || !/\./.test(s)) return null; return /^https?:/.test(s) ? s : 'https://' + s; }

  /* ---------- effective status (localStorage) ---------- */
  const LS_KEY = 'fova_crm_status_v1';
  let overrides = {};
  try { overrides = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { overrides = {}; }
  function saveOverrides() { try { localStorage.setItem(LS_KEY, JSON.stringify(overrides)); } catch (e) {} }
  const STATUSES = ['A contatar', 'Contatado', 'Em conversa', 'Reunião marcada', 'Ganho', 'Perdido', 'Não contatar'];
  function statusOf(lead) { return overrides[lead.empresa] || lead.etapa || 'A contatar'; }
  const ACTION = {
    'A contatar': { key: 'send', label: 'Enviar 1º contato', cls: 'b-send' },
    'Contatado': { key: 'wait', label: 'Aguardando retorno', cls: 'b-wait' },
    'Em conversa': { key: 'talk', label: 'Em conversa', cls: 'b-talk' },
    'Reunião marcada': { key: 'meet', label: 'Reunião marcada', cls: 'b-meet' },
    'Ganho': { key: 'done', label: 'Ganho', cls: 'b-done' },
    'Perdido': { key: 'done', label: 'Perdido', cls: 'b-done' },
    'Não contatar': { key: 'done', label: 'Não contatar', cls: 'b-done' },
  };
  function actionOf(lead) { return ACTION[statusOf(lead)] || ACTION['A contatar']; }

  /* ---------- segment / region normalization ---------- */
  function segCat(s) {
    s = (s || '').toLowerCase();
    if (/odonto|dent|sorriso|invisalign/.test(s)) return 'Odontologia';
    if (/veterin|pet|hospital vet|vet /.test(s)) return 'Veterinária';
    if (/estétic|estetic|harmoniza|depila|spa|emagrec|olhar|pilates/.test(s)) return 'Estética';
    if (/advoc|jurídic|juridic/.test(s)) return 'Advocacia';
    if (/climatiza|ar-cond|ar cond/.test(s)) return 'Climatização';
    if (/autoescola|cnh/.test(s)) return 'Autoescola';
    if (/idioma|ingl/.test(s)) return 'Idiomas';
    if (/contabil/.test(s)) return 'Contabilidade';
    if (/imobil/.test(s)) return 'Imobiliária';
    if (/restaurante|hamburg|izakaya|fast food|aliment/.test(s)) return 'Restaurante';
    if (/salão|salao|beleza|cabelei/.test(s)) return 'Salão de beleza';
    if (/barbearia/.test(s)) return 'Barbearia';
    if (/clinica med|policlinic|centro medico|saude da mulher|clínica med|médic/.test(s)) return 'Clínica médica';
    if (/diagnost|imagem/.test(s)) return 'Diagnóstico';
    return 'Outros';
  }
  function region(c) {
    c = c || '';
    if (/Rio Preto/i.test(c)) return 'S. J. Rio Preto';
    if (/Santo Andr/i.test(c)) return 'Santo André';
    if (/Guarulhos/i.test(c)) return 'Guarulhos';
    if (/^SP\/|S.o Paulo/i.test(c)) return 'São Paulo';
    return 'Outras';
  }
  function bairro(c) { const m = (c || '').split('/'); return m.length > 1 ? m.slice(1).join('/').trim() : (c || ''); }

  /* ---------- colors ---------- */
  const COL = {
    gold: '#CBA96E', goldB: '#EDD5A8', goldD: '#9A7F52',
    ok: '#6FBF8B', warn: '#E0B05A', bad: '#D88A6E', info: '#6FA8D0',
    tierA: '#EDD5A8', tierB: '#CBA96E', tierC: '#7E7359',
  };
  const CATPAL = ['#CBA96E', '#6FB8A6', '#D98C8C', '#9B8FC9', '#6FA8D0', '#8FB87A', '#E0B05A', '#C98F6A', '#B98BA8', '#8893A8', '#7FB0A0', '#D0A06E', '#9aa0b8', '#cf9f8a', '#a8c08c'];

  /* ============================================================
     UNLOCK / GATE
     ============================================================ */
  let DATA = null;
  const lock = $('#lock'), app = $('#app');

  async function tryUnlock(pw) {
    // Encrypted mode
    if (window.CRM_ENC) {
      try { DATA = await decryptData(window.CRM_ENC, pw); return true; } catch (e) { return false; }
    }
    // Plaintext mode (data already loaded) — gate by passphrase
    if (window.CRM) {
      if (pw === (window.CRM_PASS || 'fova2026')) { DATA = window.CRM; return true; }
      return false;
    }
    return false;
  }

  async function decryptData(enc, pw) {
    const dec = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const salt = dec(enc.salt), iv = dec(enc.iv), ct = dec(enc.ct);
    const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: enc.iter || 150000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // show/hide password toggle
  (function () {
    const eye = $('#lockEye'), inp = $('#lockInput');
    if (eye && inp) eye.addEventListener('click', () => {
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      eye.classList.toggle('is-on', show);
      eye.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      inp.focus();
    });
  })();

  $('#lockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#lockInput'), err = $('#lockErr');
    const btn = e.target.querySelector('.lock__btn');
    btn.disabled = true; err.textContent = '';
    const ok = await tryUnlock(input.value.trim());
    if (ok) {
      try { sessionStorage.setItem('fova_adm_ok', '1'); } catch (e) {}
      lock.hidden = true; app.hidden = false;
      boot();
    } else {
      err.textContent = 'Senha incorreta. Tente de novo.';
      input.select(); btn.disabled = false;
    }
  });

  // auto-unlock within the session (plaintext mode only; encrypted always asks)
  let _sessOk = false;
  try { _sessOk = sessionStorage.getItem('fova_adm_ok') === '1'; } catch (e) { _sessOk = false; }
  if (_sessOk && !window.CRM_ENC && window.CRM) {
    DATA = window.CRM; lock.hidden = true; app.hidden = false; document.addEventListener('DOMContentLoaded', boot);
    if (document.readyState !== 'loading') boot();
  } else {
    setTimeout(() => { try { $('#lockInput').focus(); } catch (e) {} }, 100);
  }

  // signal that the script parsed and wired up successfully
  window.__admReady = true;

  /* ============================================================
     NAV / ROUTING
     ============================================================ */
  const VIEWS = [
    { id: 'painel', label: 'Painel', ico: 'painel' },
    { id: 'leads', label: 'Leads', ico: 'leads', badge: true },
    { id: 'decisores', label: 'Decisores', ico: 'decisores' },
    { id: 'cadencia', label: 'Cadência', ico: 'cadencia' },
    { id: 'comousar', label: 'Como usar', ico: 'comousar' },
  ];
  let booted = false;
  function boot() {
    if (booted) return; booted = true;
    buildNav(); renderPainel(); renderLeads(); renderDecisores(); renderCadencia(); renderComoUsar();
    const initial = (location.hash || '').replace('#', '');
    go(VIEWS.some((v) => v.id === initial) ? initial : 'painel');
  }

  function buildNav() {
    [['#nav', false], ['#navMobile', true]].forEach(([sel, mobile]) => {
      const nav = $(sel); nav.innerHTML = '';
      VIEWS.forEach((v) => {
        const b = el('button', 'nav__item');
        b.type = 'button'; b.dataset.go = v.id;
        b.innerHTML = icon(v.ico) + '<span class="lbl">' + v.label + '</span>' + (v.badge ? '<span class="nav__badge" data-badge="leads"></span>' : '');
        b.addEventListener('click', () => go(v.id));
        nav.appendChild(b);
      });
    });
  }
  function go(id) {
    document.querySelectorAll('.view').forEach((s) => s.classList.toggle('is-active', s.dataset.view === id));
    document.querySelectorAll('.nav__item').forEach((n) => n.classList.toggle('is-active', n.dataset.go === id));
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    $('#main').scrollTo ? window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }) : window.scrollTo(0, 0);
  }

  /* ============================================================
     PAINEL
     ============================================================ */
  let charts = {};
  function counts(arr, fn) { const m = new Map(); arr.forEach((x) => { const k = fn(x); m.set(k, (m.get(k) || 0) + 1); }); return m; }

  function metrics() {
    const L = DATA.leads;
    const send = L.filter((l) => actionOf(l).key === 'send').length;
    const contatados = L.filter((l) => statusOf(l) !== 'A contatar' && statusOf(l) !== 'Não contatar').length;
    const respostas = L.filter((l) => ['Em conversa', 'Reunião marcada', 'Ganho'].includes(statusOf(l))).length;
    const reunioes = L.filter((l) => ['Reunião marcada', 'Ganho'].includes(statusOf(l))).length;
    const alta = L.filter((l) => l.confianca === 'Alta').length;
    const taxa = contatados ? Math.round((respostas / contatados) * 100) : 0;
    return { total: L.length, send, contatados, respostas, reunioes, alta, taxa };
  }

  function renderPainel() {
    const m = metrics();
    // HOJE hero
    $('#hojeMount').innerHTML =
      '<div class="hoje">' +
        '<div class="hoje__big tnum">' + NF.format(m.send) + '</div>' +
        '<div class="hoje__txt">' +
          '<div class="hoje__live"><span class="live-dot"></span> Fila de hoje</div>' +
          '<div class="hoje__line">' + (m.send ? 'leads <em>prontos pra enviar</em> agora' : 'tudo em dia por aqui') + '</div>' +
          '<div class="hoje__hint">' + (m.send ? 'Verde = aja. Abra a fila, mande as mensagens e marque o que enviou.' : 'Nenhum lead na cor verde no momento.') + '</div>' +
          '<button class="hoje__cta" id="hojeCta">Ver a fila ' + icon('arrow', 16) + '</button>' +
        '</div>' +
      '</div>';
    $('#hojeCta').addEventListener('click', () => { leadFilters.acao = true; syncToolbar(); go('leads'); });

    // KPIs
    const kpis = [
      { label: 'Total de leads', val: m.total, ico: 'leads', sub: 'na base' },
      { label: 'Donos acessíveis', val: m.alta, ico: 'target', sub: 'confiança alta', accent: true },
      { label: 'Contatados', val: m.contatados, ico: 'chat', sub: 'já abordados' },
      { label: 'Respostas', val: m.respostas, ico: 'inbox', sub: 'responderam' },
      { label: 'Reuniões', val: m.reunioes, ico: 'calendar', sub: 'marcadas' },
      { label: 'Taxa de resposta', val: m.taxa + '%', ico: 'bolt', sub: 'resp/contatados' },
    ];
    $('#kpis').innerHTML = kpis.map((k) =>
      '<div class="kpi' + (k.accent ? ' kpi--accent' : '') + '">' +
        '<div class="kpi__label">' + icon(k.ico) + esc(k.label) + '</div>' +
        '<div class="kpi__val tnum">' + (typeof k.val === 'number' ? NF.format(k.val) : k.val) + '</div>' +
        '<div class="kpi__sub">' + esc(k.sub) + '</div>' +
      '</div>'
    ).join('');

    // chart cards
    $('#charts').innerHTML =
      card('funil', 'Funil por etapa', 'Quantos leads em cada fase. Vai ganhar forma conforme você move a fila.', 'span-2', 'tall') +
      card('score', 'Distribuição de score', 'Quão quentes são os leads (0–100).', '', '') +
      card('tier', 'Leads por tier', 'A = prioridade máxima.', '', 'short') +
      card('conf', 'Confiança nos decisores', 'Tenho certeza de quem decide?', '', 'short') +
      card('canal', 'Por canal de abordagem', 'Por onde falar com cada dono.', '', 'short') +
      card('seg', 'Por segmento', 'Onde sua base está concentrada.', 'span-2', 'tall') +
      card('regiao', 'Por região', 'Distribuição geográfica.', '', 'tall');

    drawCharts();
    updateBadges();
  }
  function card(id, title, sub, span, h) {
    return '<div class="card ' + (span || '') + '">' +
      '<div class="card__head"><span class="card__title">' + esc(title) + '</span></div>' +
      '<div class="card__sub">' + esc(sub) + '</div>' +
      '<div class="chart-wrap ' + (h || '') + '"><canvas id="ch-' + id + '" aria-label="' + esc(title) + '"></canvas></div>' +
      '<div class="mini-legend" id="lg-' + id + '"></div>' +
    '</div>';
  }

  function chartBase() {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#14142A', borderColor: '#2A2A48', borderWidth: 1, padding: 10,
          titleColor: '#F0EDE6', bodyColor: '#A89880', cornerRadius: 8, displayColors: true, boxPadding: 4,
        },
      },
    };
  }
  const gridX = { grid: { color: 'rgba(255,255,255,.05)', drawBorder: false }, ticks: { color: '#6E6A78', font: { family: 'Inter', size: 11 } } };
  const gridY = { grid: { display: false, drawBorder: false }, ticks: { color: '#A89880', font: { family: 'Inter', size: 11.5 } } };

  function legend(id, items) {
    $('#lg-' + id).innerHTML = items.map((it) =>
      '<span class="mini-legend__item"><span class="mini-legend__dot" style="background:' + it.c + '"></span>' + esc(it.l) + ' <b>' + it.v + '</b></span>'
    ).join('');
  }

  function drawCharts() {
    Object.values(charts).forEach((c) => c && c.destroy()); charts = {};
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = 'Inter'; Chart.defaults.color = '#A89880';
    const L = DATA.leads;

    // FUNIL
    const stages = ['A contatar', 'Contatado', 'Em conversa', 'Reunião marcada', 'Ganho'];
    const stageColors = ['#CBA96E', '#6FA8D0', '#6FB8A6', '#9B8FC9', '#6FBF8B'];
    const funMap = counts(L, statusOf);
    charts.funil = new Chart($('#ch-funil'), {
      type: 'bar',
      data: { labels: stages, datasets: [{ data: stages.map((s) => funMap.get(s) || 0), backgroundColor: stageColors, borderRadius: 7, barThickness: 30 }] },
      options: Object.assign(chartBase(), { indexAxis: 'y', scales: { x: Object.assign({ beginAtZero: true }, gridX), y: gridY } }),
    });

    // SCORE histogram
    const buckets = [[0, 49, '< 50'], [50, 59, '50–59'], [60, 69, '60–69'], [70, 79, '70–79'], [80, 89, '80–89'], [90, 100, '90+']];
    const scoreData = buckets.map((b) => L.filter((l) => l.score != null && l.score >= b[0] && l.score <= b[1]).length);
    charts.score = new Chart($('#ch-score'), {
      type: 'bar',
      data: { labels: buckets.map((b) => b[2]), datasets: [{ data: scoreData, backgroundColor: buckets.map((_, i) => mix('#7E7359', '#EDD5A8', i / 5)), borderRadius: 6, barThickness: 26 }] },
      options: Object.assign(chartBase(), { scales: { x: gridY, y: Object.assign({ beginAtZero: true, ticks: { precision: 0 } }, gridX) } }),
    });

    // TIER doughnut
    doughnut('tier', ['A', 'B', 'C'], [cnt(L, (l) => l.tier === 'A'), cnt(L, (l) => l.tier === 'B'), cnt(L, (l) => l.tier === 'C')], [COL.tierA, COL.tierB, COL.tierC], (l) => 'Tier ' + l);

    // CONFIANÇA doughnut
    doughnut('conf', ['Alta', 'Média', 'Baixa'], [cnt(L, (l) => l.confianca === 'Alta'), cnt(L, (l) => l.confianca === 'Média'), cnt(L, (l) => l.confianca === 'Baixa')], [COL.ok, COL.warn, COL.bad]);

    // CANAL doughnut
    const canais = ['Instagram DM', 'WhatsApp', 'LinkedIn'];
    doughnut('canal', canais, canais.map((c) => cnt(L, (l) => l.canal === c)), ['#D98C8C', '#6FBF8B', '#6FA8D0']);

    // SEGMENTO horizontal bar
    const segM = [...counts(L, (l) => segCat(l.segmento)).entries()].sort((a, b) => b[1] - a[1]);
    charts.seg = new Chart($('#ch-seg'), {
      type: 'bar',
      data: { labels: segM.map((x) => x[0]), datasets: [{ data: segM.map((x) => x[1]), backgroundColor: segM.map((_, i) => CATPAL[i % CATPAL.length]), borderRadius: 6, barThickness: 15 }] },
      options: Object.assign(chartBase(), { indexAxis: 'y', scales: { x: Object.assign({ beginAtZero: true, ticks: { precision: 0 } }, gridX), y: gridY } }),
    });
    $('#lg-seg').innerHTML = '';

    // REGIÃO horizontal bar
    const regM = [...counts(L, (l) => region(l.cidade)).entries()].sort((a, b) => b[1] - a[1]);
    charts.regiao = new Chart($('#ch-regiao'), {
      type: 'bar',
      data: { labels: regM.map((x) => x[0]), datasets: [{ data: regM.map((x) => x[1]), backgroundColor: '#CBA96E', borderRadius: 6, barThickness: 22 }] },
      options: Object.assign(chartBase(), { indexAxis: 'y', scales: { x: Object.assign({ beginAtZero: true, ticks: { precision: 0 } }, gridX), y: gridY } }),
    });
    $('#lg-regiao').innerHTML = '';
  }
  function cnt(arr, fn) { return arr.filter(fn).length; }
  function doughnut(id, labels, data, colors, labelFn) {
    charts[id] = new Chart($('#ch-' + id), {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#0D0D1C', borderWidth: 3, hoverOffset: 6 }] },
      options: Object.assign(chartBase(), { cutout: '62%' }),
    });
    const total = data.reduce((a, b) => a + b, 0);
    legend(id, labels.map((l, i) => ({ l: (labelFn ? labelFn(l) : l) + ' · ' + (total ? Math.round(data[i] / total * 100) : 0) + '%', v: data[i], c: colors[i] })));
  }
  function mix(a, b, t) {
    const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    const c = pa.map((x, i) => Math.round(x + (pb[i] - x) * t));
    return 'rgb(' + c.join(',') + ')';
  }

  /* ============================================================
     LEADS
     ============================================================ */
  const leadFilters = { q: '', tier: '', conf: '', seg: '', reg: '', canal: '', acao: false };
  let leadSort = { key: 'score', dir: -1 };

  function renderLeads() {
    const segs = [...new Set(DATA.leads.map((l) => segCat(l.segmento)))].sort();
    const tb = $('#leadsToolbar');
    tb.innerHTML =
      '<div class="search">' + icon('search') + '<input id="leadSearch" type="search" placeholder="Buscar empresa, dono, @, segmento…" aria-label="Buscar leads" /></div>' +
      sel('fTier', 'Tier', [['', 'Todos os tiers'], ['A', 'Tier A'], ['B', 'Tier B'], ['C', 'Tier C']]) +
      sel('fConf', 'Confiança', [['', 'Toda confiança'], ['Alta', 'Alta'], ['Média', 'Média'], ['Baixa', 'Baixa']]) +
      sel('fCanal', 'Canal', [['', 'Todos os canais'], ['Instagram DM', 'Instagram'], ['WhatsApp', 'WhatsApp'], ['LinkedIn', 'LinkedIn']]) +
      sel('fSeg', 'Segmento', [['', 'Todos os segmentos']].concat(segs.map((s) => [s, s]))) +
      '<button class="chip" id="chipAcao" type="button" aria-pressed="false">' + icon('bolt') + 'Só ação de hoje</button>' +
      '<button class="btn-ghost" id="btnReset" type="button">Limpar</button>';

    $('#leadSearch').addEventListener('input', (e) => { leadFilters.q = e.target.value.toLowerCase(); paintLeads(); });
    $('#fTier').addEventListener('change', (e) => { leadFilters.tier = e.target.value; paintLeads(); });
    $('#fConf').addEventListener('change', (e) => { leadFilters.conf = e.target.value; paintLeads(); });
    $('#fCanal').addEventListener('change', (e) => { leadFilters.canal = e.target.value; paintLeads(); });
    $('#fSeg').addEventListener('change', (e) => { leadFilters.seg = e.target.value; paintLeads(); });
    $('#chipAcao').addEventListener('click', () => { leadFilters.acao = !leadFilters.acao; syncToolbar(); paintLeads(); });
    $('#btnReset').addEventListener('click', () => { Object.assign(leadFilters, { q: '', tier: '', conf: '', seg: '', reg: '', canal: '', acao: false }); syncToolbar(); paintLeads(); });

    const cols = [
      ['empresa', 'Empresa'], ['acao', 'Ação hoje'], ['tier', 'Tier'], ['score', 'Score'],
      ['decisor', 'Decisor'], ['canal', 'Canal'], ['confianca', 'Confiança'], ['cidade', 'Cidade'],
    ];
    $('#leadsHead').innerHTML = '<tr>' + cols.map((c) =>
      '<th class="sortable" data-sort="' + c[0] + '">' + esc(c[1]) + ' <span class="arr"></span></th>'
    ).join('') + '</tr>';
    $('#leadsHead').querySelectorAll('th').forEach((th) => th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (leadSort.key === k) leadSort.dir *= -1; else { leadSort.key = k; leadSort.dir = (k === 'score') ? -1 : 1; }
      paintLeads();
    }));
    paintLeads();
  }
  function sel(id, label, opts) {
    return '<select class="select" id="' + id + '" aria-label="' + esc(label) + '">' + opts.map((o) => '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>').join('') + '</select>';
  }
  function syncToolbar() {
    const c = $('#chipAcao'); if (c) { c.classList.toggle('is-on', leadFilters.acao); c.setAttribute('aria-pressed', String(leadFilters.acao)); }
    if ($('#leadSearch')) $('#leadSearch').value = leadFilters.q;
    if ($('#fTier')) $('#fTier').value = leadFilters.tier;
    if ($('#fConf')) $('#fConf').value = leadFilters.conf;
    if ($('#fCanal')) $('#fCanal').value = leadFilters.canal;
    if ($('#fSeg')) $('#fSeg').value = leadFilters.seg;
  }

  function filteredLeads() {
    const f = leadFilters;
    let rows = DATA.leads.filter((l) => {
      if (f.tier && l.tier !== f.tier) return false;
      if (f.conf && l.confianca !== f.conf) return false;
      if (f.canal && l.canal !== f.canal) return false;
      if (f.seg && segCat(l.segmento) !== f.seg) return false;
      if (f.acao && actionOf(l).key !== 'send') return false;
      if (f.q) {
        const hay = (l.empresa + ' ' + l.decisor + ' ' + l.contato + ' ' + l.segmento + ' ' + l.cidade + ' ' + l.instagram + ' ' + l.gancho).toLowerCase();
        if (!hay.includes(f.q)) return false;
      }
      return true;
    });
    const k = leadSort.key, d = leadSort.dir;
    rows.sort((a, b) => {
      let va, vb;
      if (k === 'acao') { va = actionOf(a).key; vb = actionOf(b).key; }
      else if (k === 'score') { va = a.score || 0; vb = b.score || 0; }
      else { va = (a[k] || '').toString().toLowerCase(); vb = (b[k] || '').toString().toLowerCase(); }
      return va < vb ? -1 * d : va > vb ? 1 * d : 0;
    });
    return rows;
  }

  const openRows = new Set();
  function paintLeads() {
    const rows = filteredLeads();
    $('#leadsCount').innerHTML = '<b>' + rows.length + '</b> ' + (rows.length === 1 ? 'lead' : 'leads') +
      (leadFilters.acao ? ' na fila de hoje' : '') + (rows.length !== DATA.leads.length ? ' · de ' + DATA.leads.length : '');
    // sort indicators
    $('#leadsHead').querySelectorAll('th').forEach((th) => {
      if (th.dataset.sort === leadSort.key) { th.setAttribute('aria-sort', leadSort.dir === 1 ? 'ascending' : 'descending'); th.querySelector('.arr').textContent = leadSort.dir === 1 ? '▲' : '▼'; }
      else { th.removeAttribute('aria-sort'); th.querySelector('.arr').textContent = ''; }
    });
    const body = $('#leadsBody'); body.innerHTML = '';
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="8"><div class="empty">' + icon('search', 40) + '<div>Nenhum lead com esses filtros.</div></div></td></tr>';
      return;
    }
    rows.forEach((l) => {
      const a = actionOf(l), conf = l.confianca || '—';
      const tr = el('tr', 'row-toggle');
      tr.innerHTML =
        '<td><div class="cell-emp">' + esc(l.empresa) + '<span class="seg">' + esc(l.segmento) + '</span></div></td>' +
        '<td><span class="badge ' + a.cls + '"><span class="dot" style="background:currentColor;opacity:.9"></span>' + esc(a.label) + '</span></td>' +
        '<td><span class="tier tier-' + l.tier + '">' + l.tier + '</span></td>' +
        '<td><span class="score-pill" style="color:' + scoreColor(l.score) + '">' + (l.score != null ? l.score : '—') + '</span></td>' +
        '<td class="cell-decisor' + (isReal(l.decisor) ? '' : ' muted') + '">' + esc(isReal(l.decisor) ? l.decisor : 'a confirmar') + '</td>' +
        '<td><span class="channel-tag">' + channelIcon(l.canal) + esc(shortCanal(l.canal)) + '</span></td>' +
        '<td><span class="conf conf-' + conf + '"><span class="dot"></span>' + esc(conf) + '</span></td>' +
        '<td>' + esc(bairro(l.cidade) || '—') + '</td>';
      tr.addEventListener('click', () => toggleRow(l, tr));
      body.appendChild(tr);
      if (openRows.has(l.empresa)) body.appendChild(detailRow(l));
    });
  }
  function shortCanal(c) { return c === 'Instagram DM' ? 'Instagram' : c; }
  function channelIcon(c) { return c === 'Instagram DM' ? icon('instagram') : c === 'WhatsApp' ? icon('whatsapp') : c === 'LinkedIn' ? icon('linkedin') : icon('chat'); }
  function scoreColor(s) { if (s == null) return '#6E6A78'; if (s >= 80) return '#EDD5A8'; if (s >= 65) return '#CBA96E'; if (s >= 50) return '#A89880'; return '#7E7359'; }

  function toggleRow(l, tr) {
    if (openRows.has(l.empresa)) { openRows.delete(l.empresa); }
    else { openRows.add(l.empresa); }
    paintLeads();
  }
  function detailRow(l) {
    const tr = el('tr', 'detail');
    const td = el('td'); td.colSpan = 8;
    const links = contactButtons(l);
    const statusSel = '<select class="status-select" data-emp="' + esc(l.empresa) + '">' +
      STATUSES.map((s) => '<option value="' + esc(s) + '"' + (statusOf(l) === s ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select>';
    td.innerHTML =
      '<div class="detail__inner">' +
        '<div class="detail__block">' +
          '<h4>Gancho de personalização</h4>' +
          '<p class="detail__gancho">' + esc(l.gancho || '—') + '</p>' +
        '</div>' +
        '<div class="detail__block">' +
          '<h4>Contatos</h4>' +
          '<div class="detail__facts">' +
            fact('decisores', isReal(l.decisor) ? l.decisor : 'Dono a confirmar') +
            (l.contato ? fact('target', l.contato) : '') +
            (l.whatsapp ? fact('phone', l.whatsapp) : '') +
            (l.instagram ? fact('instagram', l.instagram) : '') +
            (l.site ? fact('globe', l.site, siteLink(l.site)) : '') +
            (l.email ? fact('source', l.email, 'mailto:' + l.email) : '') +
            fact('pin', l.cidade || '—') +
          '</div>' +
        '</div>' +
        '<div class="detail__actions">' +
          links +
          '<span style="flex:1"></span>' +
          '<span style="display:inline-flex;align-items:center;gap:8px;color:var(--text-3);font-size:12.5px">Status' + statusSel + '</span>' +
        '</div>' +
      '</div>';
    setTimeout(() => {
      const s = td.querySelector('.status-select');
      if (s) s.addEventListener('change', (e) => { e.stopPropagation(); setStatus(l.empresa, e.target.value); });
      td.querySelectorAll('.detail__actions a, .status-select, .fact a').forEach((n) => n.addEventListener('click', (e) => e.stopPropagation()));
    }, 0);
    tr.appendChild(td);
    return tr;
  }
  function fact(ico, text, href) {
    const inner = href ? '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(text) + '</a>' : esc(text);
    return '<div class="fact">' + icon(ico) + '<span>' + inner + '</span></div>';
  }
  function contactButtons(l) {
    const out = [];
    const ig = igLink(l.instagram) || (l.canal === 'Instagram DM' ? igLink(l.contato) : null);
    const wa = waLink(l.whatsapp) || (l.canal === 'WhatsApp' ? waLink(l.contato) : null);
    const li = liLink(l.contato);
    const site = siteLink(l.site);
    if (wa) out.push(btn(wa, 'whatsapp', 'WhatsApp'));
    if (ig) out.push(btn(ig, 'instagram', 'Instagram'));
    if (li) out.push(btn(li, 'linkedin', 'LinkedIn'));
    if (site) out.push(btn(site, 'globe', 'Site'));
    return out.join('') || '<span style="color:var(--text-3);font-size:12.5px">Sem link direto — use o canal da empresa.</span>';
  }
  function btn(href, ico, label) { return '<a class="act-btn" href="' + esc(href) + '" target="_blank" rel="noopener">' + icon(ico) + esc(label) + '</a>'; }
  function setStatus(emp, st) {
    if (st === 'A contatar') delete overrides[emp]; else overrides[emp] = st;
    saveOverrides();
    renderPainel(); paintLeads(); updateBadges();
  }
  function updateBadges() {
    const send = DATA.leads.filter((l) => actionOf(l).key === 'send').length;
    document.querySelectorAll('[data-badge="leads"]').forEach((b) => b.textContent = send);
  }

  /* ============================================================
     DECISORES
     ============================================================ */
  const decFilters = { q: '', tier: '', conf: '' };
  function renderDecisores() {
    $('#decToolbar').innerHTML =
      '<div class="search">' + icon('search') + '<input id="decSearch" type="search" placeholder="Buscar empresa ou dono…" aria-label="Buscar decisores" /></div>' +
      sel('dTier', 'Tier', [['', 'Todos os tiers'], ['A', 'Tier A'], ['B', 'Tier B'], ['C', 'Tier C']]) +
      sel('dConf', 'Confiança', [['', 'Toda confiança'], ['Alta', 'Alta'], ['Média', 'Média'], ['Baixa', 'Baixa']]);
    $('#decSearch').addEventListener('input', (e) => { decFilters.q = e.target.value.toLowerCase(); paintDec(); });
    $('#dTier').addEventListener('change', (e) => { decFilters.tier = e.target.value; paintDec(); });
    $('#dConf').addEventListener('change', (e) => { decFilters.conf = e.target.value; paintDec(); });
    paintDec();
  }
  function paintDec() {
    const f = decFilters;
    const rows = DATA.decisores.filter((d) => {
      if (f.tier && d.tier !== f.tier) return false;
      if (f.conf && d.confianca !== f.conf) return false;
      if (f.q) { const hay = (d.empresa + ' ' + d.decisor + ' ' + d.cargo).toLowerCase(); if (!hay.includes(f.q)) return false; }
      return true;
    });
    $('#decCount').innerHTML = '<b>' + rows.length + '</b> ' + (rows.length === 1 ? 'decisor' : 'decisores') + (rows.length !== DATA.decisores.length ? ' · de ' + DATA.decisores.length : '');
    const grid = $('#decGrid');
    if (!rows.length) { grid.innerHTML = '<div class="empty">' + icon('users', 40) + '<div>Nenhum decisor com esses filtros.</div></div>'; return; }
    grid.innerHTML = rows.map((d) => {
      const named = isReal(d.decisor);
      const ig = igLink(d.instagram) || igLink(d.contato);
      const li = liLink(d.linkedin) || liLink(d.contato);
      const wa = waLink(extractPhone(d.telWhatsapp)) || waLink(extractPhone(d.contato)) || waLink(extractPhone(d.canalReserva));
      const btns = [];
      if (ig) btns.push(decBtn(ig, 'instagram', 'Instagram'));
      if (li) btns.push(decBtn(li, 'linkedin', 'LinkedIn'));
      if (wa) btns.push(decBtn(wa, 'whatsapp', 'WhatsApp'));
      return '<article class="dec c' + (d.confianca || 'Baixa') + '">' +
        '<div class="dec__top">' +
          '<div><div class="dec__emp">' + esc(d.empresa) + '</div>' +
          '<div class="dec__name' + (named ? '' : ' muted') + '">' + esc(named ? d.decisor : 'Dono a confirmar') + '</div></div>' +
          '<span class="tier tier-' + d.tier + '" title="Tier ' + d.tier + '">' + d.tier + '</span>' +
        '</div>' +
        (d.cargo ? '<div class="dec__role">' + esc(d.cargo) + '</div>' : '') +
        '<div class="dec__meta"><span class="conf conf-' + (d.confianca || 'Baixa') + '"><span class="dot"></span>Confiança ' + esc(d.confianca || '—') + '</span>' +
          '<span class="channel-tag">' + channelIcon(d.canal) + esc(shortCanal(d.canal)) + '</span></div>' +
        (btns.length ? '<div class="dec__chan">' + btns.join('') + '</div>' : '') +
        (d.porque ? '<div class="dec__why">' + esc(d.porque) + '</div>' : '') +
      '</article>';
    }).join('');
  }
  function decBtn(href, ico, label) { return '<a class="dec__btn" href="' + esc(href) + '" target="_blank" rel="noopener">' + icon(ico) + esc(label) + '</a>'; }
  function extractPhone(s) { const m = String(s || '').match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/); return m ? m[0] : ''; }

  /* ============================================================
     CADÊNCIA
     ============================================================ */
  function renderCadencia() {
    const steps = DATA.config.filter((c) => /contatar|contato feito|follow-up \d feito/i.test(c.etapa));
    const flow = [
      { n: 'Início', name: 'A contatar', gap: 'hoje' },
      { n: 'Toque 1', name: '1º contato', gap: '+3 dias' },
      { n: 'Toque 2', name: 'Follow-up 1', gap: '+4 dias' },
      { n: 'Toque 3', name: 'Follow-up 2', gap: '+7 dias' },
      { n: 'Toque 4', name: 'Follow-up 3', gap: 'encerra' },
    ];
    $('#cadFlow').innerHTML = flow.map((s) =>
      '<div class="cad-step"><div class="cad-node">' +
        '<div class="cad-num">' + esc(s.n) + '</div>' +
        '<div class="cad-name">' + esc(s.name) + '</div>' +
        '<span class="cad-gap">' + esc(s.gap) + '</span>' +
      '</div></div>'
    ).join('');
    $('#cadBody').innerHTML = DATA.config.map((c) =>
      '<tr><td style="font-weight:600;white-space:nowrap">' + esc(c.etapa) + '</td>' +
      '<td class="tnum" style="white-space:nowrap">' + esc(c.dias) + '</td>' +
      '<td style="color:var(--text-2)">' + esc(c.oQueFazer) + '</td></tr>'
    ).join('');
  }

  /* ============================================================
     COMO USAR (authored clean, faithful to the sheet)
     ============================================================ */
  function renderComoUsar() {
    const cards = [
      { feature: true, ico: 'bolt', title: 'A coluna “Ação hoje” é o cérebro', body: ['Ela lê a etapa de cada lead e te diz o que fazer agora — sem você decidir nada na mão.', 'Verde = aja (manda hoje). Amarelo = aguarde. Azul = em conversa. Cinza = encerrado. Comece sempre pelos verdes.'], legend: [['Enviar', 'var(--ok)'], ['Aguardar', 'var(--warn)'], ['Em conversa', 'var(--info)'], ['Encerrado', 'var(--text-3)']] },
      { ico: 'painel', title: 'As cinco telas, em ordem', body: ['Painel = visão geral com gráficos. Leads = onde você trabalha todo dia. Decisores = o dossiê de quem decide. Cadência = o ritmo dos toques. E esta, Como usar.'] },
      { ico: 'leads', title: 'Seu ciclo diário (5 minutos)', body: ['Na aba Leads, ligue “Só ação de hoje”. Mande as mensagens. A cada envio, abra a linha e mude o status para “Contatado”. Só isso.'] },
      { ico: 'decisores', title: 'Quem abordar e por onde', body: ['Decisor = o nome do dono. Canal = o melhor caminho até ele. O botão abre direto o @, o LinkedIn ou o WhatsApp.', 'Confiança alta: pode ir direto. Média: confira o perfil antes. Baixa: vá pelo canal da empresa.'] },
      { ico: 'chat', title: 'Quando mandar (e quando não)', body: ['Mande quando estiver verde. Não insista no amarelo — apertar antes da hora queima o lead.', 'Respondeu? Mude o status para “Em conversa”. Pediu pra parar? “Não contatar”.'] },
      { ico: 'cadencia', title: 'A cadência', body: ['1º contato → 3 dias → follow-up 1 → 4 dias → follow-up 2 → 7 dias → follow-up 3 → encerra.', 'Cada toque traz algo novo (um print, um dado), nunca um “só passando pra ver”. Troque de canal entre um toque e outro.'] },
    ];
    $('#guide').innerHTML = cards.map((c) =>
      '<div class="guide-card' + (c.feature ? ' feature' : '') + '">' +
        '<div class="guide-ico">' + icon(c.ico) + '</div>' +
        '<h3>' + esc(c.title) + '</h3>' +
        c.body.map((p) => '<p>' + esc(p) + '</p>').join('') +
        (c.legend ? '<div class="guide-legend">' + c.legend.map((g) => '<span><span class="dot" style="background:' + g[1] + '"></span>' + esc(g[0]) + '</span>').join('') + '</div>' : '') +
      '</div>'
    ).join('');
  }

})();
