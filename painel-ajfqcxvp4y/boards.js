/* ============================================================
   FOVA · CRM — Quadros (módulo de quadros visuais: Kanban + Trello)
   Múltiplos quadros · colunas personalizáveis · cartões ricos
   (checklists, etiquetas, responsáveis, campos personalizados,
   anexos, comentários, histórico, vínculo com o CRM) ·
   visões Kanban/Lista/Tabela/Calendário/Linha do tempo ·
   automações · permissões · notificações.
   Tudo salvo em localStorage (autosave) — 100% em pt-BR.
   Reaproveita a identidade do painel via a ponte window.FOVA.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- ponte com o app.js (mesma identidade/ajudantes) ---------- */
  const F = window.FOVA || {};
  const el = F.el || ((t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; });
  const esc = F.esc || ((s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])));
  const toast = F.toast || ((m) => { try { console.log(m); } catch (e) {} });
  const toastUndo = F.toastUndo || ((m, fn) => toast(m));
  const isReal = F.isReal || ((v) => v != null && String(v).trim() !== '');
  const getData = F.getData || (() => null);

  /* ---------- ícones (mesmo traço do painel: grade 24, stroke 1.8) ---------- */
  const IP = {
    board: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16M15 4v16"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    kanban: '<rect x="3" y="4" width="5" height="16" rx="1.4"/><rect x="10" y="4" width="5" height="10" rx="1.4"/><rect x="17" y="4" width="4" height="13" rx="1.4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
    calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 3v3M16 3v3"/>',
    timeline: '<path d="M4 6h12M4 12h16M4 18h9"/><circle cx="18" cy="6" r="1.6"/><circle cx="22" cy="12" r="1.6"/><circle cx="15" cy="18" r="1.6"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    dots: '<circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/>',
    dotsV: '<circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    edit: '<path d="M4 20h3.6L18 9.6 14.4 6 4 16.4z"/><path d="M13 7l4 4"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6"/>',
    tag: '<path d="M3 11.5V5a2 2 0 0 1 2-2h6.5L21 12.5 12.5 21z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    user: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 8.2a3 3 0 0 1 0 5.6M18 20a5 5 0 0 0-3-4.6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 3 2 3H5"/>',
    money: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M9.5 9.2a2.2 2.2 0 0 1 2.5-1.2c1.3.2 2 .9 2 1.8 0 2.2-4.5 1.2-4.5 3.4 0 1 .9 1.7 2.2 1.8a2.2 2.2 0 0 0 2.3-1.2"/>',
    checklist: '<path d="M4 6l1.5 1.5L8 5M4 13l1.5 1.5L8 11M4 19.5 5.5 21 8 18M11 6h9M11 13h9M11 19.5h9"/>',
    paperclip: '<path d="M20 11.5 11.5 20a4.5 4.5 0 0 1-6.4-6.4l8.5-8.5a3 3 0 0 1 4.3 4.3l-8.5 8.5a1.5 1.5 0 0 1-2.1-2.1l7.8-7.8"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4"/><path d="M12 8v4l3 2"/>',
    link: '<path d="M10 13a4 4 0 0 0 5.7 0l2.5-2.5a4 4 0 0 0-5.7-5.7L11 6"/><path d="M14 11a4 4 0 0 0-5.7 0L5.8 13.5a4 4 0 0 0 5.7 5.7L13 18"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>',
    chevL: '<path d="M15 6l-6 6 6 6"/>',
    chevD: '<path d="M6 9l6 6 6-6"/>',
    drag: '<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5" opacity=".5"/>',
    sort: '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>',
    text: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    hash: '<path d="M9 4 7 20M17 4l-2 16M5 9h15M4 15h15"/>',
    star: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/>',
    building: '<path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 2-2.5 3.5M12 16.5v.01"/>',
    download: '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
    play: '<path d="M7 5l12 7-12 7z"/>',
  };
  function ic(name, w) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (w ? ' width="' + w + '" height="' + w + '"' : '') + '>' + (IP[name] || '') + '</svg>'; }

  /* ---------- utilidades ---------- */
  const DAY = 86400000;
  const now = () => Date.now();
  let _seq = 0;
  function uid(p) { _seq++; return (p || 'id') + '_' + Date.now().toString(36) + _seq.toString(36) + Math.random().toString(36).slice(2, 6); }
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const NUM = new Intl.NumberFormat('pt-BR');
  function fmtMoney(n) { const v = Number(n) || 0; return BRL.format(v); }
  function parseMoney(s) {
    if (typeof s === 'number') return s;
    let t = String(s || '').replace(/[^\d,.-]/g, '').trim(); if (!t) return 0;
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(t); return isNaN(n) ? 0 : n;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dmy(ms) { const d = new Date(ms); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function dm(ms) { const d = new Date(ms); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }
  function toInputDate(ms) { if (!ms) return ''; const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromInputDate(s) { if (!s) return 0; const p = s.split('-'); const d = new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0); return d.getTime(); }
  function startOfDay(ms) { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function daysUntil(ms) { return Math.round((startOfDay(ms) - startOfDay(now())) / DAY); }
  function relDue(ms) {
    if (!ms) return null;
    const d = daysUntil(ms);
    if (d < 0) return { text: Math.abs(d) + (d === -1 ? ' dia atrás' : ' dias atrás'), cls: 'bd-due--late' };
    if (d === 0) return { text: 'Hoje', cls: 'bd-due--soon' };
    if (d === 1) return { text: 'Amanhã', cls: 'bd-due--soon' };
    if (d <= 3) return { text: 'em ' + d + ' dias', cls: 'bd-due--soon' };
    return { text: dm(ms), cls: '' };
  }
  function fmtAgo(ms) {
    const s = Math.floor((now() - ms) / 1000);
    if (s < 60) return 'agora';
    const m = Math.floor(s / 60); if (m < 60) return m + ' min';
    const h = Math.floor(m / 60); if (h < 24) return h + 'h';
    const d = Math.floor(h / 24); if (d < 30) return d + (d === 1 ? ' dia' : ' dias');
    return dmy(ms);
  }

  /* ---------- paleta (apenas cores que já existem na identidade) ---------- */
  const PALETTE = [
    { id: 'gold', hex: '#CBA96E', name: 'Dourado' },
    { id: 'blue', hex: '#6FA8D0', name: 'Azul' },
    { id: 'amber', hex: '#E0B05A', name: 'Âmbar' },
    { id: 'teal', hex: '#6FB8A6', name: 'Verde-água' },
    { id: 'purple', hex: '#9B8FC9', name: 'Lilás' },
    { id: 'green', hex: '#6FBF8B', name: 'Verde' },
    { id: 'red', hex: '#D88A6E', name: 'Terracota' },
    { id: 'gray', hex: '#8A8498', name: 'Cinza' },
  ];
  function hexOf(id) { const p = PALETTE.find((x) => x.id === id); return p ? p.hex : id || '#8A8498'; }

  /* ============================================================
     PERSISTÊNCIA (autosave) + migração/seed
     ============================================================ */
  const LS = 'fova_boards_v2';
  let S = null;

  function freshState() {
    const dono = (getData() && getData().config && getData().config.dono) || 'Você';
    const meId = uid('m');
    return {
      v: 2,
      boards: [],
      members: [{ id: meId, name: dono, color: '#CBA96E', role: 'admin' }],
      prefs: { currentUserId: meId, density: 'confortavel', coloredCards: true, lastBoardId: null, viewByBoard: {}, emailNotif: false },
      notifications: [],
    };
  }
  function load() {
    try { const raw = localStorage.getItem(LS); if (raw) { S = JSON.parse(raw); } } catch (e) { S = null; }
    if (!S || !S.boards) { S = freshState(); seedTemplatesOnFirstRun(); save(); }
    if (!S.members || !S.members.length) S.members = freshState().members;
    if (!S.prefs) S.prefs = freshState().prefs;
    if (!S.prefs.currentUserId || !S.members.some((m) => m.id === S.prefs.currentUserId)) S.prefs.currentUserId = S.members[0].id;
    if (!S.notifications) S.notifications = [];
    if (!S.prefs.viewByBoard) S.prefs.viewByBoard = {};
  }
  let _saveT = null;
  function save() { try { clearTimeout(_saveT); _saveT = setTimeout(() => { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }, 60); } catch (e) {} }
  function saveNow() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }

  /* ---------- quem sou eu / permissões ---------- */
  function me() { return S.members.find((m) => m.id === S.prefs.currentUserId) || S.members[0]; }
  function myRole() { return me().role; }
  function canEdit() { const r = myRole(); return r === 'admin' || r === 'editor'; }
  function canAdmin() { return myRole() === 'admin'; }
  function guard(fn, admin) {
    return function () {
      const ok = admin ? canAdmin() : canEdit();
      if (!ok) { toast('Seu perfil é ' + roleName(myRole()) + ' — sem permissão para esta ação.', 'bad'); return; }
      return fn.apply(this, arguments);
    };
  }
  function roleName(r) { return r === 'admin' ? 'Administrador' : r === 'editor' ? 'Editor' : 'Visualizador'; }

  /* ============================================================
     MODELOS DE QUADRO (todos editáveis depois)
     ============================================================ */
  function defaultPriorities() {
    return [
      { id: uid('p'), name: 'Baixa', color: '#6FA8D0' },
      { id: uid('p'), name: 'Média', color: '#E0B05A' },
      { id: uid('p'), name: 'Alta', color: '#D88A6E' },
      { id: uid('p'), name: 'Urgente', color: '#C0674A' },
    ];
  }
  function mkCol(name, colorId) { return { id: uid('c'), name: name, color: hexOf(colorId), archived: false, wipLimit: 0 }; }
  function mkLabel(name, colorId) { return { id: uid('l'), name: name, color: hexOf(colorId) }; }

  const TEMPLATES = {
    funil: {
      name: 'Funil de vendas', color: '#CBA96E',
      cols: [['Lead', 'gold'], ['Contato', 'blue'], ['Proposta enviada', 'amber'], ['Negociação', 'purple'], ['Fechado ganho', 'green'], ['Perdido', 'red']],
      labels: [['Quente', 'red'], ['Morno', 'amber'], ['Frio', 'blue'], ['Indicação', 'green']],
      fields: [{ name: 'Origem', type: 'select', options: ['Instagram', 'WhatsApp', 'Indicação', 'Google', 'Outro'] }],
      seedFromCRM: true,
    },
    atendimento: {
      name: 'Atendimento ao cliente', color: '#6FA8D0',
      cols: [['Novo', 'blue'], ['Em análise', 'amber'], ['Aguardando cliente', 'purple'], ['Resolvido', 'green']],
      labels: [['Dúvida', 'blue'], ['Problema', 'red'], ['Financeiro', 'amber'], ['Urgente', 'red']],
      fields: [{ name: 'Canal', type: 'select', options: ['WhatsApp', 'E-mail', 'Telefone', 'Instagram'] }],
    },
    projetos: {
      name: 'Projetos', color: '#9B8FC9',
      cols: [['Backlog', 'gray'], ['A fazer', 'blue'], ['Fazendo', 'amber'], ['Revisão', 'purple'], ['Concluído', 'green']],
      labels: [['Site', 'blue'], ['Design', 'purple'], ['Conteúdo', 'amber'], ['Bug', 'red']],
      fields: [{ name: 'Link', type: 'link' }],
    },
    equipe: {
      name: 'Tarefas da equipe', color: '#6FB8A6',
      cols: [['A fazer', 'blue'], ['Fazendo', 'amber'], ['Concluído', 'green']],
      labels: [['Hoje', 'red'], ['Esta semana', 'amber'], ['Recorrente', 'teal']],
      fields: [],
    },
    branco: {
      name: 'Quadro em branco', color: '#8A8498',
      cols: [['A fazer', 'blue'], ['Fazendo', 'amber'], ['Pronto', 'green']],
      labels: [], fields: [],
    },
  };

  function buildBoard(tplKey, customName) {
    const t = TEMPLATES[tplKey] || TEMPLATES.branco;
    const b = {
      id: uid('b'), name: customName || t.name, color: t.color, archived: false,
      createdAt: now(), updatedAt: now(),
      columns: t.cols.map((c) => mkCol(c[0], c[1])),
      cards: [],
      labels: (t.labels || []).map((l) => mkLabel(l[0], l[1])),
      priorities: defaultPriorities(),
      fields: (t.fields || []).map((f) => ({ id: uid('f'), name: f.name, type: f.type, options: f.options || [] })),
      automations: [],
      filters: [],
      ui: { view: 'kanban', filter: emptyFilter(), group: 'none', sort: 'manual' },
    };
    if (t.seedFromCRM) seedFunnelFromCRM(b);
    return b;
  }
  function emptyFilter() { return { q: '', labels: [], members: [], priority: '', due: '' }; }

  // vínculo nativo: cria cartões a partir dos leads já existentes no CRM, por etapa
  const STATUS_TO_COL = { 'A contatar': 'Lead', 'Contatado': 'Contato', 'Reunião marcada': 'Proposta enviada', 'Em conversa': 'Negociação', 'Ganho': 'Fechado ganho', 'Perdido': 'Perdido', 'Não contatar': 'Lead' };
  function seedFunnelFromCRM(b) {
    const data = getData(); if (!data || !data.leads) return;
    const colByName = {}; b.columns.forEach((c) => { colByName[c.name] = c; });
    const statusOf = F.statusOf || (() => 'A contatar');
    const decisorFor = F.decisorFor || (() => null);
    const segCat = F.segCat || ((s) => s || '');
    const hotLabel = b.labels.find((l) => l.name === 'Quente');
    data.leads.slice(0, 120).forEach((l, i) => {
      const colName = STATUS_TO_COL[statusOf(l)] || 'Lead';
      const col = colByName[colName] || b.columns[0];
      const dec = decisorFor(l.empresa);
      const members = [];
      const ord = b.cards.filter((c) => c.columnId === col.id).length;
      b.cards.push(blankCard({
        columnId: col.id, order: ord, title: l.empresa,
        desc: isReal(l.gancho) ? l.gancho : '',
        labels: hotLabel && (statusOf(l) === 'Em conversa' || statusOf(l) === 'Reunião marcada') ? [hotLabel.id] : [],
        crm: { empresa: l.empresa, decisor: (dec && dec.decisor) || l.decisor || '' },
        fields: {},
        meta: [segCat(l.segmento)].filter(Boolean).join(''),
        members: members,
      }, b));
    });
  }

  function blankCard(over, board) {
    const c = {
      id: uid('card'), columnId: null, order: 0, title: 'Novo cartão', desc: '',
      cover: '', coverKind: 'color', labels: [], members: [], due: 0, reminderDays: 0,
      priority: '', value: 0, checklists: [], attachments: [], comments: [], activity: [],
      fields: {}, crm: null, archived: false, createdAt: now(), updatedAt: now(), movedAt: now(),
    };
    Object.assign(c, over || {});
    c.activity = c.activity && c.activity.length ? c.activity : [{ id: uid('a'), text: 'criou este cartão', ts: now(), by: me().id }];
    return c;
  }

  function seedTemplatesOnFirstRun() {
    // começa com um Funil já populado pelo CRM (vínculo nativo) + um quadro de Projetos vazio
    const funil = buildBoard('funil');
    S.boards.push(funil);
    S.prefs.lastBoardId = funil.id;
  }

  /* ============================================================
     ESTADO DE NAVEGAÇÃO DO MÓDULO
     ============================================================ */
  let screen = 'home';        // 'home' | 'board'
  let curBoardId = null;
  let showArchivedBoards = false;

  function curBoard() { return S.boards.find((b) => b.id === curBoardId) || null; }
  function boardUI(b) { if (!b.ui) b.ui = { view: 'kanban', filter: emptyFilter(), group: 'none', sort: 'manual' }; if (!b.ui.filter) b.ui.filter = emptyFilter(); return b.ui; }

  /* ============================================================
     RENDER — router
     ============================================================ */
  let root = null;
  function render() {
    if (!root) root = document.getElementById('qbRoot');
    if (!root) return;
    if (screen === 'board' && curBoard()) renderBoard();
    else { screen = 'home'; renderHome(); }
    updateNavBadge();
  }

  /* ------------------------------------------------------------
     TELA INICIAL — lista de quadros
     ------------------------------------------------------------ */
  function boardProgress(b) {
    const cards = b.cards.filter((c) => !c.archived);
    const doneCol = b.columns[b.columns.length - 1];
    const done = doneCol ? cards.filter((c) => c.columnId === doneCol.id).length : 0;
    return { total: cards.length, done: done, pct: cards.length ? Math.round(done / cards.length * 100) : 0 };
  }
  function renderHome() {
    const boards = S.boards.filter((b) => showArchivedBoards ? b.archived : !b.archived);
    const archivedN = S.boards.filter((b) => b.archived).length;
    root.className = 'qb qb--home';
    root.innerHTML =
      '<div class="page-head">' +
        '<div class="page-eyebrow">Quadros</div>' +
        '<h1 class="page-title">Seus <em>quadros</em></h1>' +
        '<p class="page-sub">Organize vendas, atendimento, projetos e tarefas em quadros visuais. <b>Arraste</b> cartões entre as colunas — tudo salva sozinho neste aparelho.</p>' +
      '</div>' +
      '<div class="qb-home-bar">' +
        '<div class="qb-home-bar__left">' + userSwitcherHTML() + notifBellHTML() + '</div>' +
        '<div class="qb-home-bar__right">' +
          (archivedN ? '<button class="btn-ghost" id="qbToggleArch" type="button">' + ic('archive', 15) + (showArchivedBoards ? 'Ver ativos' : 'Arquivados (' + archivedN + ')') + '</button>' : '') +
          (canEdit() ? '<button class="btn-import" id="qbNewBoard" type="button">' + ic('plus') + 'Novo quadro</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="qb-board-grid" id="qbBoardGrid"></div>';

    const grid = root.querySelector('#qbBoardGrid');
    if (!boards.length) {
      grid.outerHTML = '<div class="empty">' + ic('board', 42) + '<b>' + (showArchivedBoards ? 'Nenhum quadro arquivado.' : 'Nenhum quadro ainda.') + '</b>' +
        '<div>' + (showArchivedBoards ? 'Os quadros arquivados aparecem aqui.' : 'Crie o primeiro a partir de um modelo pronto.') + '</div></div>';
    } else {
      grid.innerHTML = boards.map(boardCardHTML).join('') + (!showArchivedBoards && canEdit() ? newBoardTileHTML() : '');
    }
    wireHome();
  }
  function boardCardHTML(b) {
    const pr = boardProgress(b);
    const cols = b.columns.filter((c) => !c.archived).length;
    return '<article class="qb-bcard" data-board="' + b.id + '" tabindex="0" role="button" style="--bc:' + b.color + '">' +
      '<div class="qb-bcard__bar"></div>' +
      '<div class="qb-bcard__body">' +
        '<div class="qb-bcard__top">' +
          '<h3 class="qb-bcard__name">' + esc(b.name) + '</h3>' +
          '<button class="qb-bcard__menu" type="button" data-bmenu="' + b.id + '" aria-label="Opções do quadro" title="Opções">' + ic('dotsV', 16) + '</button>' +
        '</div>' +
        '<div class="qb-bcard__meta">' + NUM.format(pr.total) + (pr.total === 1 ? ' cartão' : ' cartões') + ' · ' + cols + (cols === 1 ? ' coluna' : ' colunas') + '</div>' +
        '<div class="qb-bcard__prog"><div class="qb-bcard__track"><div class="qb-bcard__fill" style="width:' + pr.pct + '%"></div></div><span class="qb-bcard__pct tnum">' + pr.pct + '%</span></div>' +
      '</div>' +
    '</article>';
  }
  function newBoardTileHTML() {
    return '<button class="qb-newtile" id="qbNewTile" type="button">' + ic('plus', 26) + '<span>Criar quadro</span></button>';
  }
  function wireHome() {
    const nb = root.querySelector('#qbNewBoard'); if (nb) nb.addEventListener('click', openNewBoard);
    const nt = root.querySelector('#qbNewTile'); if (nt) nt.addEventListener('click', openNewBoard);
    const tg = root.querySelector('#qbToggleArch'); if (tg) tg.addEventListener('click', () => { showArchivedBoards = !showArchivedBoards; render(); });
    root.querySelectorAll('.qb-bcard').forEach((c) => {
      const id = c.dataset.board;
      c.addEventListener('click', (e) => { if (e.target.closest('[data-bmenu]')) return; openBoard(id); });
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBoard(id); } });
      const mb = c.querySelector('[data-bmenu]');
      if (mb) mb.addEventListener('click', (e) => { e.stopPropagation(); openBoardMenu(mb, id); });
    });
    wireUserSwitcher(); wireNotifBell();
  }

  function openBoard(id) {
    curBoardId = id; S.prefs.lastBoardId = id; screen = 'board'; save();
    const b = curBoard(); if (b && S.prefs.viewByBoard[id]) boardUI(b).view = S.prefs.viewByBoard[id];
    render();
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  function backHome() { screen = 'home'; render(); try { window.scrollTo(0, 0); } catch (e) {} }

  /* ------------------------------------------------------------
     TROCA DE PERFIL (demonstra permissões) + sino de notificações
     ------------------------------------------------------------ */
  function userSwitcherHTML() {
    const m = me();
    return '<div class="qb-user menu-wrap">' +
      '<button class="qb-user__btn" id="qbUserBtn" type="button" aria-haspopup="true" aria-expanded="false" title="Trocar de perfil">' +
        '<span class="qb-avatar" style="background:' + m.color + '">' + initials(m.name) + '</span>' +
        '<span class="qb-user__info"><b>' + esc(m.name) + '</b><small>' + roleName(m.role) + '</small></span>' + ic('chevD', 15) +
      '</button>' +
      '<div class="menu" id="qbUserMenu" role="menu" hidden>' +
        S.members.map((x) => '<button class="menu__item" type="button" data-user="' + x.id + '"><span class="qb-avatar qb-avatar--sm" style="background:' + x.color + '">' + initials(x.name) + '</span><span>' + esc(x.name) + '</span><span class="menu__badge">' + roleName(x.role) + '</span></button>').join('') +
        (canAdmin() ? '<div class="menu__sep"></div><button class="menu__item" type="button" data-user-manage="1">' + ic('users') + '<span>Gerenciar equipe</span></button>' : '') +
      '</div>' +
    '</div>';
  }
  function wireUserSwitcher() {
    const btn = root.querySelector('#qbUserBtn'); const menu = root.querySelector('#qbUserMenu');
    if (!btn || !menu) return;
    simpleMenu(btn, menu);
    menu.querySelectorAll('[data-user]').forEach((b) => b.addEventListener('click', () => {
      S.prefs.currentUserId = b.dataset.user; save(); closeMenu(menu, btn); render();
      toast('Agora você está como ' + esc(me().name) + ' (' + roleName(myRole()) + ').', 'ok');
    }));
    const mg = menu.querySelector('[data-user-manage]'); if (mg) mg.addEventListener('click', () => { closeMenu(menu, btn); openTeamModal(); });
  }
  function initials(n) { return String(n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase(); }

  function notifBellHTML() {
    const unread = S.notifications.filter((n) => !n.read).length;
    return '<div class="qb-bell menu-wrap">' +
      '<button class="qb-bell__btn" id="qbBellBtn" type="button" aria-haspopup="true" aria-expanded="false" title="Notificações">' + ic('bell', 19) +
        (unread ? '<span class="qb-bell__dot">' + (unread > 9 ? '9+' : unread) + '</span>' : '') + '</button>' +
      '<div class="menu qb-notif" id="qbBellMenu" role="menu" hidden></div>' +
    '</div>';
  }
  function wireNotifBell() {
    const btn = root.querySelector('#qbBellBtn'); const menu = root.querySelector('#qbBellMenu');
    if (!btn || !menu) return;
    renderNotifMenu(menu);
    simpleMenu(btn, menu, () => renderNotifMenu(menu));
  }
  function renderNotifMenu(menu) {
    const list = S.notifications.slice().sort((a, b) => b.ts - a.ts).slice(0, 20);
    menu.innerHTML =
      '<div class="qb-notif__head"><b>Notificações</b>' + (list.length ? '<button class="qb-notif__clear" type="button" data-notif-read>marcar lidas</button>' : '') + '</div>' +
      (list.length ? list.map((n) =>
        '<button class="qb-notif__item' + (n.read ? '' : ' is-unread') + '" type="button" data-notif="' + n.id + '">' +
          '<span class="qb-notif__ico">' + ic(n.icon || 'bell', 15) + '</span>' +
          '<span class="qb-notif__txt">' + esc(n.text) + '<small>' + fmtAgo(n.ts) + '</small></span>' +
        '</button>').join('')
        : '<div class="qb-notif__empty">' + ic('bell', 26) + '<span>Sem notificações por aqui.</span></div>') +
      '<div class="qb-notif__foot"><label class="qb-switch"><input type="checkbox" id="qbEmailNotif"' + (S.prefs.emailNotif ? ' checked' : '') + ' disabled><span></span>Avisar por e-mail</label><small>Requer servidor de e-mail (indisponível neste painel local).</small></div>';
    menu.querySelectorAll('[data-notif]').forEach((b) => b.addEventListener('click', () => {
      const n = S.notifications.find((x) => x.id === b.dataset.notif); if (!n) return;
      n.read = true; save();
      if (n.boardId && n.cardId) { closeAllMenus(); openBoard(n.boardId); setTimeout(() => openCard(n.cardId), 60); }
      else render();
    }));
    const cr = menu.querySelector('[data-notif-read]'); if (cr) cr.addEventListener('click', (e) => { e.stopPropagation(); S.notifications.forEach((n) => n.read = true); save(); renderNotifMenu(menu); updateNavBadge(); });
  }
  function notify(opts) {
    S.notifications.push(Object.assign({ id: uid('n'), ts: now(), read: false, icon: 'bell' }, opts));
    if (S.notifications.length > 200) S.notifications = S.notifications.slice(-200);
    save(); updateNavBadge();
  }

  /* ============================================================
     TELA DO QUADRO
     ============================================================ */
  function renderBoard() {
    const b = curBoard(); if (!b) { backHome(); return; }
    const ui = boardUI(b);
    root.className = 'qb qb--board';
    root.innerHTML =
      boardHeaderHTML(b, ui) +
      '<div class="qb-stage" id="qbStage"></div>';
    wireBoardHeader(b, ui);
    renderStage(b, ui);
  }

  const VIEWS = [
    { id: 'kanban', label: 'Kanban', ico: 'kanban' },
    { id: 'lista', label: 'Lista', ico: 'list' },
    { id: 'tabela', label: 'Tabela', ico: 'table' },
    { id: 'calendario', label: 'Calendário', ico: 'calendar' },
    { id: 'linha', label: 'Linha do tempo', ico: 'timeline' },
  ];

  function boardHeaderHTML(b, ui) {
    const f = ui.filter;
    const activeFilters = (f.labels.length ? 1 : 0) + (f.members.length ? 1 : 0) + (f.priority ? 1 : 0) + (f.due ? 1 : 0);
    return '<div class="qb-bhead">' +
      '<div class="qb-bhead__row1">' +
        '<button class="qb-back" id="qbBack" type="button" title="Voltar aos quadros">' + ic('back', 18) + '</button>' +
        '<span class="qb-bdot" style="background:' + b.color + '"></span>' +
        '<h1 class="qb-btitle" id="qbTitle" tabindex="0" title="' + (canEdit() ? 'Clique para renomear' : '') + '">' + esc(b.name) + '</h1>' +
        '<div class="qb-bhead__spacer"></div>' +
        userSwitcherHTML() + notifBellHTML() +
        (canAdmin() ? '<button class="qb-ibtn" id="qbSettings" type="button" title="Configurar quadro (etiquetas, campos, equipe)">' + ic('gear', 18) + '</button>' : '') +
        (canAdmin() ? '<button class="qb-ibtn" id="qbAutos" type="button" title="Automações">' + ic('bolt', 18) + '<span class="qb-ibtn__n">' + (b.automations.filter((a) => a.enabled).length || '') + '</span></button>' : '') +
        '<button class="qb-ibtn" id="qbHelp" type="button" title="Atalhos de teclado">' + ic('help', 18) + '</button>' +
      '</div>' +
      '<div class="qb-bhead__row2">' +
        '<div class="qb-views" role="tablist" aria-label="Trocar visão">' +
          VIEWS.map((v) => '<button class="qb-view' + (ui.view === v.id ? ' is-on' : '') + '" type="button" role="tab" aria-selected="' + (ui.view === v.id) + '" data-view="' + v.id + '">' + ic(v.ico, 15) + v.label + '</button>').join('') +
        '</div>' +
        '<div class="qb-bhead__tools">' +
          '<div class="search qb-search">' + ic('search') + '<input id="qbSearch" type="search" placeholder="Buscar cartão…" aria-label="Buscar cartão" value="' + esc(f.q) + '"></div>' +
          '<div class="menu-wrap"><button class="chip' + (activeFilters ? ' is-on' : '') + '" id="qbFilterBtn" type="button" aria-haspopup="true" aria-expanded="false">' + ic('filter', 16) + 'Filtros' + (activeFilters ? ' · ' + activeFilters : '') + '</button><div class="menu qb-filtermenu" id="qbFilterMenu" hidden></div></div>' +
          '<div class="menu-wrap"><button class="chip" id="qbGroupBtn" type="button" aria-haspopup="true" aria-expanded="false">' + ic('layers', 16) + 'Agrupar</button><div class="menu" id="qbGroupMenu" hidden></div></div>' +
          '<div class="menu-wrap"><button class="chip" id="qbSortBtn" type="button" aria-haspopup="true" aria-expanded="false">' + ic('sort', 16) + 'Ordenar</button><div class="menu" id="qbSortMenu" hidden></div></div>' +
          '<div class="menu-wrap"><button class="chip" id="qbPrefBtn" type="button" aria-haspopup="true" aria-expanded="false" title="Preferências de exibição">' + ic('eye', 16) + 'Exibir</button><div class="menu" id="qbPrefMenu" hidden></div></div>' +
        '</div>' +
      '</div>' +
      (activeFilters || f.q ? '<div class="qb-activefilters" id="qbActiveFilters"></div>' : '') +
    '</div>';
  }

  function wireBoardHeader(b, ui) {
    root.querySelector('#qbBack').addEventListener('click', backHome);
    const title = root.querySelector('#qbTitle');
    if (canEdit()) title.addEventListener('click', () => inlineRenameBoard(b, title));
    wireUserSwitcher(); wireNotifBell();
    const set = root.querySelector('#qbSettings'); if (set) set.addEventListener('click', () => openSettings(b));
    const au = root.querySelector('#qbAutos'); if (au) au.addEventListener('click', () => openAutomations(b));
    root.querySelector('#qbHelp').addEventListener('click', openShortcuts);
    root.querySelectorAll('[data-view]').forEach((v) => v.addEventListener('click', () => {
      ui.view = v.dataset.view; S.prefs.viewByBoard[b.id] = ui.view; save(); renderBoard();
    }));
    const srch = root.querySelector('#qbSearch');
    srch.addEventListener('input', (e) => { ui.filter.q = e.target.value; save(); renderStage(b, ui); renderActiveFilters(b, ui); });

    buildFilterMenu(b, ui); buildGroupMenu(b, ui); buildSortMenu(b, ui); buildPrefMenu(b, ui);
    renderActiveFilters(b, ui);
  }

  function inlineRenameBoard(b, titleEl) {
    const inp = el('input', 'qb-btitle-input'); inp.value = b.name;
    titleEl.replaceWith(inp); inp.focus(); inp.select();
    const commit = () => { const v = inp.value.trim(); if (v && v !== b.name) { b.name = v; b.updatedAt = now(); save(); } renderBoard(); };
    inp.addEventListener('blur', commit);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } if (e.key === 'Escape') { inp.value = b.name; inp.blur(); } });
  }

  /* ---------- menus do cabeçalho ---------- */
  function buildFilterMenu(b, ui) {
    const btn = root.querySelector('#qbFilterBtn'), menu = root.querySelector('#qbFilterMenu');
    const f = ui.filter;
    const cb = (checked, label, swatch) => '<span class="qb-opt"><span class="qb-check' + (checked ? ' is-on' : '') + '">' + (checked ? ic('check', 13) : '') + '</span>' + (swatch ? '<span class="qb-sw" style="background:' + swatch + '"></span>' : '') + esc(label) + '</span>';
    menu.innerHTML =
      '<div class="qb-fm">' +
        (b.labels.length ? '<div class="qb-fm__sec"><div class="qb-fm__h">Etiquetas</div>' + b.labels.map((l) => '<button class="qb-fm__opt" type="button" data-flabel="' + l.id + '">' + cb(f.labels.includes(l.id), l.name || 'Sem nome', l.color) + '</button>').join('') + '</div>' : '') +
        '<div class="qb-fm__sec"><div class="qb-fm__h">Responsáveis</div>' + S.members.map((m) => '<button class="qb-fm__opt" type="button" data-fmember="' + m.id + '">' + cb(f.members.includes(m.id), m.name, m.color) + '</button>').join('') + '</div>' +
        '<div class="qb-fm__sec"><div class="qb-fm__h">Prioridade</div>' + b.priorities.map((p) => '<button class="qb-fm__opt" type="button" data-fprio="' + p.id + '">' + cb(f.priority === p.id, p.name, p.color) + '</button>').join('') + '</div>' +
        '<div class="qb-fm__sec"><div class="qb-fm__h">Prazo</div>' +
          [['', 'Qualquer'], ['overdue', 'Atrasado'], ['today', 'Hoje'], ['week', 'Próximos 7 dias'], ['none', 'Sem prazo']].map((o) => '<button class="qb-fm__opt" type="button" data-fdue="' + o[0] + '">' + cb(f.due === o[0], o[1]) + '</button>').join('') + '</div>' +
        '<div class="qb-fm__foot"><button class="btn-ghost" type="button" data-fclear>Limpar</button>' + (canEdit() ? '<button class="mbtn mbtn--ghost qb-mini" type="button" data-fsave>Salvar filtro</button>' : '') + '</div>' +
        (b.filters.length ? '<div class="qb-fm__sec"><div class="qb-fm__h">Filtros salvos</div>' + b.filters.map((sf) => '<div class="qb-fm__saved"><button class="qb-fm__opt" type="button" data-fapply="' + sf.id + '">' + ic('filter', 13) + esc(sf.name) + '</button><button class="qb-x" type="button" data-fdel="' + sf.id + '" aria-label="Apagar filtro">' + ic('close', 13) + '</button></div>').join('') + '</div>' : '') +
      '</div>';
    simpleMenu(btn, menu);
    const re = () => { save(); renderStage(b, ui); renderActiveFilters(b, ui); buildFilterMenu(b, ui); root.querySelector('#qbFilterMenu').hidden = false; };
    menu.querySelectorAll('[data-flabel]').forEach((x) => x.addEventListener('click', () => { toggleArr(f.labels, x.dataset.flabel); re(); }));
    menu.querySelectorAll('[data-fmember]').forEach((x) => x.addEventListener('click', () => { toggleArr(f.members, x.dataset.fmember); re(); }));
    menu.querySelectorAll('[data-fprio]').forEach((x) => x.addEventListener('click', () => { f.priority = f.priority === x.dataset.fprio ? '' : x.dataset.fprio; re(); }));
    menu.querySelectorAll('[data-fdue]').forEach((x) => x.addEventListener('click', () => { f.due = x.dataset.fdue; re(); }));
    const fc = menu.querySelector('[data-fclear]'); if (fc) fc.addEventListener('click', () => { ui.filter = emptyFilter(); re(); });
    const fs = menu.querySelector('[data-fsave]'); if (fs) fs.addEventListener('click', () => { const name = prompt('Nome do filtro salvo:'); if (name && name.trim()) { b.filters.push({ id: uid('sf'), name: name.trim(), state: JSON.parse(JSON.stringify(f)) }); re(); } });
    menu.querySelectorAll('[data-fapply]').forEach((x) => x.addEventListener('click', () => { const sf = b.filters.find((s) => s.id === x.dataset.fapply); if (sf) { ui.filter = JSON.parse(JSON.stringify(sf.state)); re(); } }));
    menu.querySelectorAll('[data-fdel]').forEach((x) => x.addEventListener('click', (e) => { e.stopPropagation(); b.filters = b.filters.filter((s) => s.id !== x.dataset.fdel); re(); }));
  }
  function buildGroupMenu(b, ui) {
    const btn = root.querySelector('#qbGroupBtn'), menu = root.querySelector('#qbGroupMenu');
    const opts = [['none', 'Coluna (padrão)'], ['priority', 'Prioridade'], ['member', 'Responsável'], ['label', 'Etiqueta'], ['due', 'Prazo']];
    menu.innerHTML = opts.map((o) => '<button class="menu__item" type="button" data-group="' + o[0] + '">' + ic(ui.group === o[0] ? 'check' : 'layers', 16) + '<span>' + o[1] + '</span></button>').join('');
    simpleMenu(btn, menu);
    menu.querySelectorAll('[data-group]').forEach((x) => x.addEventListener('click', () => { ui.group = x.dataset.group; save(); closeMenu(menu, btn); renderStage(b, ui); }));
  }
  function buildSortMenu(b, ui) {
    const btn = root.querySelector('#qbSortBtn'), menu = root.querySelector('#qbSortMenu');
    const opts = [['manual', 'Manual (arrastar)'], ['due', 'Prazo'], ['priority', 'Prioridade'], ['value', 'Valor'], ['title', 'Título A→Z'], ['created', 'Mais recentes']];
    menu.innerHTML = opts.map((o) => '<button class="menu__item" type="button" data-sort="' + o[0] + '">' + ic(ui.sort === o[0] ? 'check' : 'sort', 16) + '<span>' + o[1] + '</span></button>').join('');
    simpleMenu(btn, menu);
    menu.querySelectorAll('[data-sort]').forEach((x) => x.addEventListener('click', () => { ui.sort = x.dataset.sort; save(); closeMenu(menu, btn); renderStage(b, ui); }));
  }
  function buildPrefMenu(b, ui) {
    const btn = root.querySelector('#qbPrefBtn'), menu = root.querySelector('#qbPrefMenu');
    menu.innerHTML =
      '<button class="menu__item" type="button" data-density="confortavel">' + ic(S.prefs.density === 'confortavel' ? 'check' : 'grid', 16) + '<span>Modo confortável</span></button>' +
      '<button class="menu__item" type="button" data-density="compacto">' + ic(S.prefs.density === 'compacto' ? 'check' : 'list', 16) + '<span>Modo compacto</span></button>' +
      '<div class="menu__sep"></div>' +
      '<button class="menu__item" type="button" data-colored>' + ic(S.prefs.coloredCards ? 'check' : 'tag', 16) + '<span>Cartões coloridos</span></button>';
    simpleMenu(btn, menu);
    menu.querySelectorAll('[data-density]').forEach((x) => x.addEventListener('click', () => { S.prefs.density = x.dataset.density; save(); closeMenu(menu, btn); renderBoard(); }));
    const cc = menu.querySelector('[data-colored]'); if (cc) cc.addEventListener('click', () => { S.prefs.coloredCards = !S.prefs.coloredCards; save(); closeMenu(menu, btn); renderBoard(); });
  }
  function renderActiveFilters(b, ui) {
    const host = root.querySelector('#qbActiveFilters'); if (!host) { if ((ui.filter.labels.length || ui.filter.members.length || ui.filter.priority || ui.filter.due || ui.filter.q)) renderBoard(); return; }
    const f = ui.filter; const chips = [];
    if (f.q) chips.push(['q', 'Busca: “' + f.q + '”']);
    f.labels.forEach((id) => { const l = b.labels.find((x) => x.id === id); if (l) chips.push(['label:' + id, 'Etiqueta: ' + (l.name || '—'), l.color]); });
    f.members.forEach((id) => { const m = S.members.find((x) => x.id === id); if (m) chips.push(['member:' + id, 'Resp.: ' + m.name, m.color]); });
    if (f.priority) { const p = b.priorities.find((x) => x.id === f.priority); if (p) chips.push(['priority', 'Prioridade: ' + p.name, p.color]); }
    if (f.due) chips.push(['due', 'Prazo: ' + ({ overdue: 'atrasado', today: 'hoje', week: '7 dias', none: 'sem prazo' }[f.due] || f.due)]);
    if (!chips.length) { host.innerHTML = ''; return; }
    host.innerHTML = chips.map((c) => '<button class="qb-fchip" type="button" data-rm="' + c[0] + '">' + (c[2] ? '<span class="qb-sw" style="background:' + c[2] + '"></span>' : '') + esc(c[1]) + ic('close', 12) + '</button>').join('') +
      '<button class="qb-fchip qb-fchip--clear" type="button" data-rm="all">Limpar tudo</button>';
    host.querySelectorAll('[data-rm]').forEach((x) => x.addEventListener('click', () => {
      const k = x.dataset.rm;
      if (k === 'all') ui.filter = emptyFilter();
      else if (k === 'q') ui.filter.q = '';
      else if (k === 'priority') ui.filter.priority = '';
      else if (k === 'due') ui.filter.due = '';
      else if (k.indexOf('label:') === 0) toggleArr(ui.filter.labels, k.slice(6));
      else if (k.indexOf('member:') === 0) toggleArr(ui.filter.members, k.slice(7));
      save(); renderBoard();
    }));
  }

  /* ---------- filtro/ordenação aplicados aos cartões ---------- */
  function visibleCards(b, colId) {
    const ui = boardUI(b); const f = ui.filter;
    let cards = b.cards.filter((c) => !c.archived && (colId == null || c.columnId === colId));
    if (f.q) { const q = f.q.toLowerCase(); cards = cards.filter((c) => (c.title || '').toLowerCase().indexOf(q) >= 0 || (c.desc || '').toLowerCase().indexOf(q) >= 0 || (c.crm && (c.crm.empresa || '').toLowerCase().indexOf(q) >= 0)); }
    if (f.labels.length) cards = cards.filter((c) => f.labels.every((id) => c.labels.includes(id)));
    if (f.members.length) cards = cards.filter((c) => f.members.some((id) => c.members.includes(id)));
    if (f.priority) cards = cards.filter((c) => c.priority === f.priority);
    if (f.due) cards = cards.filter((c) => dueMatch(c, f.due));
    return sortCards(cards, ui.sort, b);
  }
  function dueMatch(c, mode) {
    if (mode === 'none') return !c.due;
    if (!c.due) return false;
    const d = daysUntil(c.due);
    if (mode === 'overdue') return d < 0;
    if (mode === 'today') return d === 0;
    if (mode === 'week') return d >= 0 && d <= 7;
    return true;
  }
  function prioRank(b, id) { const i = b.priorities.findIndex((p) => p.id === id); return i < 0 ? 99 : b.priorities.length - i; }
  function sortCards(cards, mode, b) {
    const a = cards.slice();
    if (mode === 'manual') a.sort((x, y) => (x.order - y.order));
    else if (mode === 'due') a.sort((x, y) => (x.due || 9e15) - (y.due || 9e15));
    else if (mode === 'priority') a.sort((x, y) => prioRank(b, y.priority) - prioRank(b, x.priority));
    else if (mode === 'value') a.sort((x, y) => (y.value || 0) - (x.value || 0));
    else if (mode === 'title') a.sort((x, y) => (x.title || '').localeCompare(y.title || '', 'pt-BR'));
    else if (mode === 'created') a.sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
    return a;
  }

  /* ============================================================
     STAGE — despacha para a visão ativa
     ============================================================ */
  function renderStage(b, ui) {
    const stage = root.querySelector('#qbStage'); if (!stage) return;
    stage.className = 'qb-stage dens-' + S.prefs.density + (S.prefs.coloredCards ? ' colored' : '');
    if (ui.view === 'kanban') renderKanban(b, ui, stage);
    else if (ui.view === 'lista') renderList(b, ui, stage);
    else if (ui.view === 'tabela') renderTable(b, ui, stage);
    else if (ui.view === 'calendario') renderCalendar(b, ui, stage);
    else if (ui.view === 'linha') renderTimeline(b, ui, stage);
  }

  /* ------------------------------------------------------------
     VISÃO KANBAN
     ------------------------------------------------------------ */
  function renderKanban(b, ui, stage) {
    if (ui.group !== 'none') return renderGroupedKanban(b, ui, stage);
    const cols = b.columns.filter((c) => !c.archived);
    stage.innerHTML = '<div class="kanban-wrap"><div class="qb-kanban" id="qbKanban">' +
      cols.map((col) => kcolHTML(b, col)).join('') +
      (canAdmin() ? '<div class="qb-addcol" id="qbAddCol"><button class="qb-addcol__btn" type="button">' + ic('plus', 16) + 'Adicionar coluna</button></div>' : '') +
    '</div></div>';
    wireKanban(b, ui, stage);
  }
  function kcolHTML(b, col) {
    const cards = visibleCards(b, col.id);
    const sum = cards.reduce((s, c) => s + (Number(c.value) || 0), 0);
    const overLimit = col.wipLimit > 0 && cards.length > col.wipLimit;
    return '<section class="qb-col" data-col="' + col.id + '" style="--col:' + col.color + '">' +
      '<header class="qb-col__head" draggable="' + (canAdmin() ? 'true' : 'false') + '" data-colhead="' + col.id + '">' +
        '<span class="qb-col__dot" style="background:' + col.color + '"></span>' +
        '<span class="qb-col__name" data-colname="' + col.id + '">' + esc(col.name) + '</span>' +
        '<span class="qb-col__count' + (overLimit ? ' is-over' : '') + ' tnum">' + cards.length + (col.wipLimit > 0 ? '/' + col.wipLimit : '') + '</span>' +
        (canEdit() ? '<button class="qb-col__menu" type="button" data-colmenu="' + col.id + '" aria-label="Opções da coluna">' + ic('dots', 15) + '</button>' : '') +
      '</header>' +
      (sum > 0 ? '<div class="qb-col__sum">' + ic('money', 13) + fmtMoney(sum) + '</div>' : '') +
      '<div class="qb-col__body" data-drop="' + col.id + '">' +
        cards.map((c) => kcardHTML(b, c)).join('') +
        '<div class="qb-col__empty' + (cards.length ? ' hidden' : '') + '">Nada aqui ainda</div>' +
      '</div>' +
      (canEdit() ? '<button class="qb-col__add" type="button" data-quickadd="' + col.id + '">' + ic('plus', 15) + 'Adicionar cartão</button>' : '') +
    '</section>';
  }
  function kcardHTML(b, c) {
    const labels = c.labels.map((id) => b.labels.find((l) => l.id === id)).filter(Boolean);
    const prio = b.priorities.find((p) => p.id === c.priority);
    const members = c.members.map((id) => S.members.find((m) => m.id === id)).filter(Boolean);
    const due = relDue(c.due);
    const checks = checklistStats(c);
    const coverColor = c.coverKind === 'color' && c.cover ? c.cover : '';
    const colored = S.prefs.coloredCards && (coverColor || (prio && prio.color));
    const accent = coverColor || (prio ? prio.color : '');
    return '<article class="qb-card' + (colored ? ' is-colored' : '') + '" draggable="' + (canEdit() ? 'true' : 'false') + '" data-card="' + c.id + '" tabindex="0"' + (accent ? ' style="--cc:' + accent + '"' : '') + '>' +
      (coverColor ? '<div class="qb-card__cover" style="background:' + coverColor + '"></div>' : '') +
      (labels.length ? '<div class="qb-card__labels">' + labels.map((l) => '<span class="qb-lab" style="background:' + l.color + '" title="' + esc(l.name) + '">' + esc(l.name) + '</span>').join('') + '</div>' : '') +
      '<div class="qb-card__title">' + esc(c.title) + '</div>' +
      (c.crm ? '<div class="qb-card__crm">' + ic('building', 12) + esc(c.crm.empresa) + '</div>' : '') +
      '<div class="qb-card__badges">' +
        (prio ? '<span class="qb-cb" style="color:' + prio.color + ';border-color:' + prio.color + '55"><span class="qb-cb__dot" style="background:' + prio.color + '"></span>' + esc(prio.name) + '</span>' : '') +
        (due ? '<span class="qb-cb qb-due ' + due.cls + '">' + ic('clock', 12) + due.text + '</span>' : '') +
        (checks.total ? '<span class="qb-cb' + (checks.done === checks.total ? ' qb-cb--done' : '') + '">' + ic('checklist', 12) + checks.done + '/' + checks.total + '</span>' : '') +
        (c.comments.length ? '<span class="qb-cb">' + ic('chat', 12) + c.comments.length + '</span>' : '') +
        (c.attachments.length ? '<span class="qb-cb">' + ic('paperclip', 12) + c.attachments.length + '</span>' : '') +
        (Number(c.value) ? '<span class="qb-cb qb-cb--val">' + fmtMoney(c.value) + '</span>' : '') +
      '</div>' +
      (members.length ? '<div class="qb-card__members">' + members.map((m) => '<span class="qb-avatar qb-avatar--sm" style="background:' + m.color + '" title="' + esc(m.name) + '">' + initials(m.name) + '</span>').join('') + '</div>' : '') +
    '</article>';
  }
  function checklistStats(c) { let t = 0, d = 0; (c.checklists || []).forEach((cl) => cl.items.forEach((it) => { t++; if (it.done) d++; })); return { total: t, done: d }; }

  function wireKanban(b, ui, stage) {
    const addcol = stage.querySelector('#qbAddCol'); if (addcol) addcol.querySelector('button').addEventListener('click', () => addColumn(b));
    stage.querySelectorAll('.qb-card').forEach((card) => wireCardEl(card, b, ui));
    stage.querySelectorAll('[data-quickadd]').forEach((btn) => btn.addEventListener('click', () => quickAdd(b, btn.dataset.quickadd, btn)));
    stage.querySelectorAll('[data-colmenu]').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); openColMenu(b, btn, btn.dataset.colmenu); }));
    stage.querySelectorAll('[data-colname]').forEach((n) => { if (canEdit()) n.addEventListener('click', () => inlineRenameColumn(b, n, n.dataset.colname)); });
    if (canEdit()) wireCardDnD(b, ui, stage);
    if (canAdmin()) wireColumnDnD(b, ui, stage);
  }
  function wireCardEl(card, b, ui) {
    const id = card.dataset.card;
    card.addEventListener('click', (e) => { if (e.target.closest('button')) return; openCard(id); });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); openCard(id); }
      else if (canEdit() && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); moveCardCol(b, id, e.key === 'ArrowRight' ? 1 : -1); }
    });
  }

  /* ---------- drag & drop de cartões ---------- */
  let dragCardId = null;
  function wireCardDnD(b, ui, stage) {
    stage.querySelectorAll('.qb-card').forEach((card) => {
      card.addEventListener('dragstart', (e) => { dragCardId = card.dataset.card; card.classList.add('qb-dragging'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', card.dataset.card); } catch (_) {} });
      card.addEventListener('dragend', () => { card.classList.remove('qb-dragging'); dragCardId = null; stage.querySelectorAll('.qb-col').forEach((c) => c.classList.remove('qb-drop')); stage.querySelectorAll('.qb-ph').forEach((p) => p.remove()); });
    });
    stage.querySelectorAll('[data-drop]').forEach((body) => {
      body.addEventListener('dragover', (e) => {
        if (!dragCardId) return; e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
        body.closest('.qb-col').classList.add('qb-drop');
        const after = dragAfter(body, e.clientY);
        let ph = body.querySelector('.qb-ph'); if (!ph) { ph = el('div', 'qb-ph'); }
        if (after == null) body.appendChild(ph); else body.insertBefore(ph, after);
      });
      body.addEventListener('dragleave', (e) => { const col = body.closest('.qb-col'); if (!col.contains(e.relatedTarget)) { col.classList.remove('qb-drop'); const ph = body.querySelector('.qb-ph'); if (ph) ph.remove(); } });
      body.addEventListener('drop', (e) => {
        e.preventDefault(); if (!dragCardId) return;
        const colId = body.dataset.drop; const ph = body.querySelector('.qb-ph');
        const siblings = [...body.querySelectorAll('.qb-card')];
        let index = siblings.length;
        if (ph) { const n = [...body.children].filter((x) => x.classList.contains('qb-card') || x.classList.contains('qb-ph')); index = n.indexOf(ph); }
        dropCard(b, ui, dragCardId, colId, index);
      });
    });
  }
  function dragAfter(container, y) {
    const els = [...container.querySelectorAll('.qb-card:not(.qb-dragging)')];
    let closest = null, closestOff = -Infinity;
    els.forEach((child) => { const box = child.getBoundingClientRect(); const off = y - box.top - box.height / 2; if (off < 0 && off > closestOff) { closestOff = off; closest = child; } });
    return closest;
  }
  function dropCard(b, ui, cardId, colId, index) {
    const card = b.cards.find((c) => c.id === cardId); if (!card) return;
    const fromCol = card.columnId;
    const dest = b.cards.filter((c) => c.columnId === colId && !c.archived && c.id !== cardId).sort((a, z) => a.order - z.order);
    dest.splice(index, 0, card);
    dest.forEach((c, i) => { c.order = i; });
    const moved = fromCol !== colId;
    card.columnId = colId; card.updatedAt = now();
    if (moved) { card.movedAt = now(); logActivity(card, 'moveu para “' + colName(b, colId) + '”'); runAutomations(b, card, 'move', { fromCol: fromCol, toCol: colId }); }
    save(); renderStage(b, ui);
  }
  function moveCardCol(b, id, dir) {
    const card = b.cards.find((c) => c.id === id); if (!card) return;
    const cols = b.columns.filter((c) => !c.archived);
    let i = cols.findIndex((c) => c.id === card.columnId); if (i < 0) i = 0;
    const ni = i + dir; if (ni < 0 || ni >= cols.length) return;
    dropCard(b, boardUI(b), id, cols[ni].id, 1e9);
    setTimeout(() => { const n = root.querySelector('[data-card="' + id + '"]'); if (n) n.focus(); }, 30);
  }
  function colName(b, id) { const c = b.columns.find((x) => x.id === id); return c ? c.name : ''; }

  /* ---------- drag de colunas ---------- */
  let dragColId = null;
  function wireColumnDnD(b, ui, stage) {
    stage.querySelectorAll('[data-colhead]').forEach((head) => {
      head.addEventListener('dragstart', (e) => { if (e.target.closest('button') || e.target.closest('input')) { e.preventDefault(); return; } dragColId = head.dataset.colhead; head.closest('.qb-col').classList.add('qb-col--drag'); try { e.dataTransfer.effectAllowed = 'move'; } catch (_) {} });
      head.addEventListener('dragend', () => { dragColId = null; stage.querySelectorAll('.qb-col').forEach((c) => c.classList.remove('qb-col--drag', 'qb-col--over')); });
    });
    stage.querySelectorAll('.qb-col').forEach((col) => {
      col.addEventListener('dragover', (e) => { if (!dragColId || dragColId === col.dataset.col) return; e.preventDefault(); col.classList.add('qb-col--over'); });
      col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('qb-col--over'); });
      col.addEventListener('drop', (e) => { if (!dragColId || dragColId === col.dataset.col) return; e.preventDefault(); reorderColumns(b, ui, dragColId, col.dataset.col); });
    });
  }
  function reorderColumns(b, ui, fromId, toId) {
    const from = b.columns.findIndex((c) => c.id === fromId), to = b.columns.findIndex((c) => c.id === toId);
    if (from < 0 || to < 0) return;
    const [m] = b.columns.splice(from, 1); b.columns.splice(to, 0, m);
    b.updatedAt = now(); save(); renderStage(b, ui);
  }

  /* ---------- criação rápida / colunas ---------- */
  function quickAdd(b, colId, btn) {
    if (!canEdit()) return;
    const body = btn.previousElementSibling; // .qb-col__body
    const existing = btn.parentNode.querySelector('.qb-quick'); if (existing) { existing.querySelector('textarea').focus(); return; }
    const box = el('div', 'qb-quick');
    box.innerHTML = '<textarea class="qb-quick__input" rows="2" placeholder="Título do cartão — Enter para adicionar"></textarea>' +
      '<div class="qb-quick__row"><button class="mbtn mbtn--primary qb-mini" type="button" data-add>Adicionar</button><button class="qb-x" type="button" data-cancel aria-label="Cancelar">' + ic('close', 15) + '</button></div>';
    btn.parentNode.insertBefore(box, btn);
    const ta = box.querySelector('textarea'); ta.focus();
    const commit = (keepOpen) => {
      const v = ta.value.trim(); if (!v) { if (!keepOpen) box.remove(); return; }
      const ord = b.cards.filter((c) => c.columnId === colId && !c.archived).length;
      const card = blankCard({ columnId: colId, order: ord, title: v }, b);
      b.cards.push(card); save();
      runAutomations(b, card, 'create', {});
      renderStage(b, boardUI(b));
      if (keepOpen) setTimeout(() => quickAdd(b, colId, root.querySelector('[data-quickadd="' + colId + '"]')), 20);
    };
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(true); } if (e.key === 'Escape') box.remove(); });
    box.querySelector('[data-add]').addEventListener('click', () => commit(false));
    box.querySelector('[data-cancel]').addEventListener('click', () => box.remove());
  }
  function addColumn(b) {
    if (!canAdmin()) return;
    const col = mkCol('Nova coluna', PALETTE[b.columns.length % PALETTE.length].id);
    b.columns.push(col); b.updatedAt = now(); save(); renderStage(b, boardUI(b));
    setTimeout(() => { const n = root.querySelector('[data-colname="' + col.id + '"]'); if (n) inlineRenameColumn(b, n, col.id); }, 30);
  }
  function inlineRenameColumn(b, nameEl, colId) {
    const col = b.columns.find((c) => c.id === colId); if (!col) return;
    const inp = el('input', 'qb-col__name-input'); inp.value = col.name;
    nameEl.replaceWith(inp); inp.focus(); inp.select();
    const commit = () => { const v = inp.value.trim(); if (v) { col.name = v; b.updatedAt = now(); save(); } renderStage(b, boardUI(b)); };
    inp.addEventListener('blur', commit);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { renderStage(b, boardUI(b)); } });
  }
  function openColMenu(b, btn, colId) {
    const col = b.columns.find((c) => c.id === colId); if (!col) return;
    const items = [];
    items.push(['rename', 'edit', 'Renomear']);
    items.push(['color', 'tag', 'Mudar cor']);
    items.push(['wip', 'flag', 'Limite de cartões' + (col.wipLimit ? ' (' + col.wipLimit + ')' : '')]);
    items.push(['addcard', 'plus', 'Adicionar cartão']);
    if (canAdmin()) { items.push(['sep']); items.push(['archive', 'archive', 'Arquivar coluna']); items.push(['delete', 'trash', 'Excluir coluna', true]); }
    const menu = popMenu(btn, items);
    menu.on('rename', () => { const n = root.querySelector('[data-colname="' + colId + '"]'); if (n) inlineRenameColumn(b, n, colId); });
    menu.on('color', () => openColorPicker(btn, col.color, (hex) => { col.color = hex; save(); renderStage(b, boardUI(b)); }));
    menu.on('wip', () => { const v = prompt('Limite de cartões nesta coluna (0 = sem limite):', String(col.wipLimit || 0)); if (v != null) { col.wipLimit = Math.max(0, parseInt(v, 10) || 0); save(); renderStage(b, boardUI(b)); } });
    menu.on('addcard', () => { const qb = root.querySelector('[data-quickadd="' + colId + '"]'); if (qb) quickAdd(b, colId, qb); });
    menu.on('archive', () => { col.archived = true; save(); renderStage(b, boardUI(b)); toast('Coluna arquivada.', 'ok'); });
    menu.on('delete', () => {
      const n = b.cards.filter((c) => c.columnId === colId && !c.archived).length;
      if (!confirm('Excluir a coluna “' + col.name + '”' + (n ? ' e seus ' + n + ' cartões' : '') + '? Isso não pode ser desfeito.')) return;
      b.cards = b.cards.filter((c) => c.columnId !== colId);
      b.columns = b.columns.filter((c) => c.id !== colId);
      save(); renderStage(b, boardUI(b)); toast('Coluna excluída.', 'ok');
    });
  }

  /* ------------------------------------------------------------
     KANBAN AGRUPADO (por prioridade/responsável/etiqueta/prazo)
     ------------------------------------------------------------ */
  function renderGroupedKanban(b, ui, stage) {
    const groups = buildGroups(b, ui);
    stage.innerHTML = '<div class="kanban-wrap"><div class="qb-kanban">' +
      groups.map((g) =>
        '<section class="qb-col" style="--col:' + (g.color || '#8A8498') + '">' +
          '<header class="qb-col__head"><span class="qb-col__dot" style="background:' + (g.color || '#8A8498') + '"></span><span class="qb-col__name">' + esc(g.label) + '</span><span class="qb-col__count tnum">' + g.cards.length + '</span></header>' +
          '<div class="qb-col__body">' + (g.cards.length ? g.cards.map((c) => kcardHTML(b, c)).join('') : '<div class="qb-col__empty">Nada aqui</div>') + '</div>' +
        '</section>').join('') +
    '</div></div>';
    stage.querySelectorAll('.qb-card').forEach((card) => wireCardEl(card, b, ui));
  }
  function buildGroups(b, ui) {
    const cards = visibleCards(b, null);
    const out = [];
    if (ui.group === 'priority') {
      b.priorities.forEach((p) => out.push({ key: p.id, label: p.name, color: p.color, cards: cards.filter((c) => c.priority === p.id) }));
      out.push({ key: '', label: 'Sem prioridade', color: '#8A8498', cards: cards.filter((c) => !c.priority) });
    } else if (ui.group === 'member') {
      S.members.forEach((m) => out.push({ key: m.id, label: m.name, color: m.color, cards: cards.filter((c) => c.members.includes(m.id)) }));
      out.push({ key: '', label: 'Sem responsável', color: '#8A8498', cards: cards.filter((c) => !c.members.length) });
    } else if (ui.group === 'label') {
      b.labels.forEach((l) => out.push({ key: l.id, label: l.name || 'Etiqueta', color: l.color, cards: cards.filter((c) => c.labels.includes(l.id)) }));
      out.push({ key: '', label: 'Sem etiqueta', color: '#8A8498', cards: cards.filter((c) => !c.labels.length) });
    } else if (ui.group === 'due') {
      const buckets = [['overdue', 'Atrasado', '#D88A6E'], ['today', 'Hoje', '#E0B05A'], ['week', 'Próximos 7 dias', '#6FA8D0'], ['later', 'Depois', '#6FB8A6'], ['none', 'Sem prazo', '#8A8498']];
      buckets.forEach((bk) => out.push({ key: bk[0], label: bk[1], color: bk[2], cards: cards.filter((c) => dueBucket(c) === bk[0]) }));
    }
    return out.filter((g) => g.cards.length || ui.group === 'priority' || ui.group === 'due');
  }
  function dueBucket(c) { if (!c.due) return 'none'; const d = daysUntil(c.due); if (d < 0) return 'overdue'; if (d === 0) return 'today'; if (d <= 7) return 'week'; return 'later'; }

  /* ------------------------------------------------------------
     VISÃO LISTA
     ------------------------------------------------------------ */
  function renderList(b, ui, stage) {
    const cols = b.columns.filter((c) => !c.archived);
    stage.innerHTML = '<div class="qb-list">' + cols.map((col) => {
      const cards = visibleCards(b, col.id);
      return '<section class="qb-lgroup"><div class="qb-lgroup__head"><span class="qb-col__dot" style="background:' + col.color + '"></span>' + esc(col.name) + '<span class="qb-col__count tnum">' + cards.length + '</span></div>' +
        (cards.length ? '<div class="qb-lrows">' + cards.map((c) => lrowHTML(b, c)).join('') + '</div>' : '<div class="qb-col__empty">Nenhum cartão</div>') +
        (canEdit() ? '<button class="qb-col__add qb-col__add--list" type="button" data-quickadd="' + col.id + '">' + ic('plus', 15) + 'Adicionar cartão</button>' : '') +
      '</section>';
    }).join('') + '</div>';
    stage.querySelectorAll('[data-card]').forEach((r) => wireCardEl(r, b, ui));
    stage.querySelectorAll('[data-quickadd]').forEach((btn) => btn.addEventListener('click', () => quickAdd(b, btn.dataset.quickadd, btn)));
  }
  function lrowHTML(b, c) {
    const labels = c.labels.map((id) => b.labels.find((l) => l.id === id)).filter(Boolean);
    const prio = b.priorities.find((p) => p.id === c.priority);
    const members = c.members.map((id) => S.members.find((m) => m.id === id)).filter(Boolean);
    const due = relDue(c.due); const checks = checklistStats(c);
    return '<article class="qb-lrow" data-card="' + c.id + '" tabindex="0">' +
      '<span class="qb-lrow__title">' + esc(c.title) + (c.crm ? ' <span class="qb-lrow__crm">' + ic('building', 11) + esc(c.crm.empresa) + '</span>' : '') + '</span>' +
      '<span class="qb-lrow__tags">' +
        labels.map((l) => '<span class="qb-lab qb-lab--sm" style="background:' + l.color + '">' + esc(l.name) + '</span>').join('') +
        (prio ? '<span class="qb-cb" style="color:' + prio.color + ';border-color:' + prio.color + '55"><span class="qb-cb__dot" style="background:' + prio.color + '"></span>' + esc(prio.name) + '</span>' : '') +
        (checks.total ? '<span class="qb-cb">' + ic('checklist', 12) + checks.done + '/' + checks.total + '</span>' : '') +
        (Number(c.value) ? '<span class="qb-cb qb-cb--val">' + fmtMoney(c.value) + '</span>' : '') +
      '</span>' +
      (due ? '<span class="qb-cb qb-due ' + due.cls + '">' + ic('clock', 12) + due.text + '</span>' : '<span></span>') +
      '<span class="qb-lrow__members">' + members.map((m) => '<span class="qb-avatar qb-avatar--sm" style="background:' + m.color + '" title="' + esc(m.name) + '">' + initials(m.name) + '</span>').join('') + '</span>' +
    '</article>';
  }

  /* ------------------------------------------------------------
     VISÃO TABELA
     ------------------------------------------------------------ */
  function renderTable(b, ui, stage) {
    const cards = visibleCards(b, null);
    const rows = cards.slice().sort((a, z) => {
      const ca = b.columns.findIndex((c) => c.id === a.columnId), cz = b.columns.findIndex((c) => c.id === z.columnId);
      return ca - cz || a.order - z.order;
    });
    const fieldCols = b.fields.slice(0, 3);
    stage.innerHTML = '<div class="qb-tablewrap"><table class="qb-table"><thead><tr>' +
      '<th>Cartão</th><th>Coluna</th><th>Responsáveis</th><th>Prioridade</th><th>Prazo</th><th>Valor</th><th>Progresso</th>' +
      fieldCols.map((f) => '<th>' + esc(f.name) + '</th>').join('') +
    '</tr></thead><tbody>' +
      (rows.length ? rows.map((c) => {
        const col = b.columns.find((x) => x.id === c.columnId);
        const prio = b.priorities.find((p) => p.id === c.priority);
        const members = c.members.map((id) => S.members.find((m) => m.id === id)).filter(Boolean);
        const due = relDue(c.due); const checks = checklistStats(c);
        return '<tr data-card="' + c.id + '" tabindex="0">' +
          '<td class="qb-td-title">' + (c.labels.length ? '<span class="qb-td-labs">' + c.labels.map((id) => { const l = b.labels.find((x) => x.id === id); return l ? '<span class="qb-sw" style="background:' + l.color + '"></span>' : ''; }).join('') + '</span>' : '') + esc(c.title) + '</td>' +
          '<td>' + (col ? '<span class="qb-sw" style="background:' + col.color + '"></span>' + esc(col.name) : '—') + '</td>' +
          '<td>' + (members.length ? members.map((m) => '<span class="qb-avatar qb-avatar--sm" style="background:' + m.color + '" title="' + esc(m.name) + '">' + initials(m.name) + '</span>').join('') : '<span class="qb-muted">—</span>') + '</td>' +
          '<td>' + (prio ? '<span class="qb-cb" style="color:' + prio.color + ';border-color:' + prio.color + '55">' + esc(prio.name) + '</span>' : '<span class="qb-muted">—</span>') + '</td>' +
          '<td>' + (due ? '<span class="qb-due ' + due.cls + '">' + due.text + '</span>' : '<span class="qb-muted">—</span>') + '</td>' +
          '<td>' + (Number(c.value) ? fmtMoney(c.value) : '<span class="qb-muted">—</span>') + '</td>' +
          '<td>' + (checks.total ? checks.done + '/' + checks.total : '<span class="qb-muted">—</span>') + '</td>' +
          fieldCols.map((f) => '<td>' + esc(fieldDisplay(c, f) || '—') + '</td>').join('') +
        '</tr>';
      }).join('') : '<tr><td colspan="' + (7 + fieldCols.length) + '" class="qb-table-empty">Nenhum cartão com esses filtros.</td></tr>') +
    '</tbody></table></div>';
    stage.querySelectorAll('[data-card]').forEach((r) => wireCardEl(r, b, ui));
  }
  function fieldDisplay(c, f) {
    const v = c.fields ? c.fields[f.id] : '';
    if (v == null || v === '') return '';
    if (f.type === 'currency') return fmtMoney(parseMoney(v));
    if (f.type === 'date') return v ? dmy(fromInputDate(v)) : '';
    return String(v);
  }

  /* ------------------------------------------------------------
     VISÃO CALENDÁRIO
     ------------------------------------------------------------ */
  let calRef = null;
  function renderCalendar(b, ui, stage) {
    if (!calRef) calRef = startOfDay(now());
    const ref = new Date(calRef);
    const year = ref.getFullYear(), month = ref.getMonth();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // segunda = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cards = visibleCards(b, null).filter((c) => c.due);
    const byDay = {}; cards.forEach((c) => { const k = toInputDate(c.due); (byDay[k] = byDay[k] || []).push(c); });
    const monthName = ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const dows = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const todayKey = toInputDate(now());
    stage.innerHTML = '<div class="qb-cal">' +
      '<div class="qb-cal__bar"><button class="qb-ibtn" type="button" data-cal="-1" aria-label="Mês anterior">' + ic('chevL', 18) + '</button>' +
        '<b class="qb-cal__title">' + esc(monthName.charAt(0).toUpperCase() + monthName.slice(1)) + '</b>' +
        '<button class="qb-ibtn" type="button" data-cal="1" aria-label="Próximo mês">' + ic('chevR', 18) + '</button>' +
        '<button class="btn-ghost qb-mini" type="button" data-cal="0">Hoje</button></div>' +
      '<div class="qb-cal__grid qb-cal__dows">' + dows.map((d) => '<div class="qb-cal__dow">' + d + '</div>').join('') + '</div>' +
      '<div class="qb-cal__grid">' + cells.map((dt) => {
        if (!dt) return '<div class="qb-cal__cell qb-cal__cell--empty"></div>';
        const k = toInputDate(dt.getTime());
        const list = byDay[k] || [];
        return '<div class="qb-cal__cell' + (k === todayKey ? ' is-today' : '') + '">' +
          '<div class="qb-cal__date">' + dt.getDate() + '</div>' +
          list.slice(0, 4).map((c) => { const col = b.columns.find((x) => x.id === c.columnId); return '<button class="qb-cal__ev" type="button" data-card="' + c.id + '" style="--cc:' + (col ? col.color : '#8A8498') + '" title="' + esc(c.title) + '"><span class="qb-sw" style="background:' + (col ? col.color : '#8A8498') + '"></span>' + esc(c.title) + '</button>'; }).join('') +
          (list.length > 4 ? '<div class="qb-cal__more">+' + (list.length - 4) + ' mais</div>' : '') +
        '</div>';
      }).join('') + '</div>' +
    '</div>';
    stage.querySelectorAll('[data-cal]').forEach((btn) => btn.addEventListener('click', () => {
      const v = +btn.dataset.cal;
      if (v === 0) calRef = startOfDay(now());
      else { const r = new Date(calRef); r.setMonth(r.getMonth() + v); calRef = r.getTime(); }
      renderCalendar(b, ui, stage);
    }));
    stage.querySelectorAll('[data-card]').forEach((r) => wireCardEl(r, b, ui));
  }

  /* ------------------------------------------------------------
     VISÃO LINHA DO TEMPO (barras por prazo)
     ------------------------------------------------------------ */
  function renderTimeline(b, ui, stage) {
    const cards = visibleCards(b, null).filter((c) => c.due).sort((a, z) => a.due - z.due);
    if (!cards.length) { stage.innerHTML = '<div class="empty">' + ic('timeline', 42) + '<b>Sem datas para mostrar.</b><div>Defina um prazo nos cartões para vê-los aqui.</div></div>'; return; }
    const min = startOfDay(Math.min(cards[0].due, now()));
    const max = startOfDay(Math.max(cards[cards.length - 1].due, now()));
    const span = Math.max(1, Math.round((max - min) / DAY)) + 1;
    const todayPct = ((startOfDay(now()) - min) / DAY) / span * 100;
    const months = [];
    { let d = new Date(min); d.setDate(1); while (d.getTime() <= max) { const off = ((startOfDay(d.getTime()) - min) / DAY) / span * 100; months.push([off, d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')]); d.setMonth(d.getMonth() + 1); } }
    stage.innerHTML = '<div class="qb-tl">' +
      '<div class="qb-tl__axis">' + months.map((m) => '<span class="qb-tl__month" style="left:' + m[0] + '%">' + esc(m[1]) + '</span>').join('') +
        (todayPct >= 0 && todayPct <= 100 ? '<span class="qb-tl__today" style="left:' + todayPct + '%" title="Hoje"></span>' : '') + '</div>' +
      '<div class="qb-tl__rows">' + cards.map((c) => {
        const col = b.columns.find((x) => x.id === c.columnId);
        const off = ((startOfDay(c.due) - min) / DAY) / span * 100;
        const due = relDue(c.due);
        return '<div class="qb-tl__row" data-card="' + c.id + '" tabindex="0">' +
          '<div class="qb-tl__label">' + esc(c.title) + '</div>' +
          '<div class="qb-tl__track">' + (todayPct >= 0 && todayPct <= 100 ? '<span class="qb-tl__nowline" style="left:' + todayPct + '%"></span>' : '') +
            '<span class="qb-tl__bar" style="left:' + Math.max(0, Math.min(98, off)) + '%;background:' + (col ? col.color : '#8A8498') + '"><span class="qb-tl__bardate">' + dm(c.due) + '</span></span></div>' +
          '<div class="qb-tl__due' + (due ? ' ' + due.cls : '') + '">' + (due ? due.text : '') + '</div>' +
        '</div>';
      }).join('') + '</div>' +
    '</div>';
    stage.querySelectorAll('[data-card]').forEach((r) => wireCardEl(r, b, ui));
  }

  /* ============================================================
     MODAL DO CARTÃO (editor completo estilo Trello)
     ============================================================ */
  let modalEl = null, curCardId = null, _lastFocus = null;
  function ensureModal() {
    if (modalEl) return modalEl;
    const m = el('div', 'modal qb-modal'); m.id = 'qbModal'; m.hidden = true;
    m.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__card qb-modal__card" role="dialog" aria-modal="true" aria-label="Cartão"></div>';
    document.body.appendChild(m);
    m.querySelector('[data-close]').addEventListener('click', closeCard);
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); closeCard(); } });
    modalEl = m; return m;
  }
  function findCard(id) { const b = curBoard(); if (!b) return null; return b.cards.find((c) => c.id === id) || null; }
  function openCard(id) {
    const b = curBoard(); const c = findCard(id); if (!b || !c) return;
    curCardId = id; _lastFocus = document.activeElement;
    const m = ensureModal(); m.hidden = false; try { document.body.style.overflow = 'hidden'; } catch (e) {}
    renderCard();
    setTimeout(() => { const t = m.querySelector('.qb-cm__title'); if (t) t.focus(); }, 30);
  }
  function closeCard() {
    if (!modalEl || modalEl.hidden) return;
    modalEl.hidden = true; curCardId = null;
    try { document.body.style.overflow = ''; } catch (e) {}
    try { if (_lastFocus && _lastFocus.focus) _lastFocus.focus(); } catch (e) {}
    renderStage(curBoard(), boardUI(curBoard()));
  }
  function renderCard() {
    const b = curBoard(), c = findCard(curCardId); if (!b || !c) { closeCard(); return; }
    const card = modalEl.querySelector('.qb-modal__card');
    const col = b.columns.find((x) => x.id === c.columnId);
    const labels = c.labels.map((id) => b.labels.find((l) => l.id === id)).filter(Boolean);
    const prio = b.priorities.find((p) => p.id === c.priority);
    const members = c.members.map((id) => S.members.find((m) => m.id === id)).filter(Boolean);
    const due = relDue(c.due);
    const ed = canEdit();
    const cover = c.coverKind === 'color' && c.cover ? c.cover : '';
    card.innerHTML =
      (cover ? '<div class="qb-cm__cover" style="background:' + cover + '"></div>' : '') +
      '<button class="modal__x qb-cm__x" type="button" data-close aria-label="Fechar">' + ic('close', 18) + '</button>' +
      '<div class="qb-cm">' +
        '<div class="qb-cm__main">' +
          '<div class="qb-cm__colrow">' + ic('kanban', 14) + 'em <button class="qb-cm__collink" type="button" data-movehere>' + esc(col ? col.name : '—') + '</button></div>' +
          (ed ? '<textarea class="qb-cm__title" rows="1" aria-label="Título">' + esc(c.title) + '</textarea>' : '<h2 class="qb-cm__title qb-cm__title--ro">' + esc(c.title) + '</h2>') +
          (labels.length || members.length || prio || due || Number(c.value) ? '<div class="qb-cm__chips">' +
            labels.map((l) => '<span class="qb-lab" style="background:' + l.color + '">' + esc(l.name) + '</span>').join('') +
            (prio ? '<span class="qb-cb" style="color:' + prio.color + ';border-color:' + prio.color + '55"><span class="qb-cb__dot" style="background:' + prio.color + '"></span>' + esc(prio.name) + '</span>' : '') +
            (due ? '<span class="qb-cb qb-due ' + due.cls + '">' + ic('clock', 12) + 'Prazo ' + dmy(c.due) + ' · ' + due.text + '</span>' : '') +
            (Number(c.value) ? '<span class="qb-cb qb-cb--val">' + fmtMoney(c.value) + '</span>' : '') +
            members.map((mm) => '<span class="qb-avatar qb-avatar--sm" style="background:' + mm.color + '" title="' + esc(mm.name) + '">' + initials(mm.name) + '</span>').join('') +
          '</div>' : '') +
          (c.crm ? '<div class="qb-cm__crm">' + ic('building', 14) + '<span>Vinculado a <b>' + esc(c.crm.empresa) + '</b>' + (c.crm.decisor ? ' · ' + esc(c.crm.decisor) : '') + '</span><button class="qb-cm__crmopen" type="button" data-crmopen>abrir no CRM ' + ic('arrowR', 13) + '</button></div>' : '') +
          '<section class="qb-cm__sec"><div class="qb-cm__h">' + ic('text', 15) + 'Descrição</div>' +
            (ed ? '<textarea class="qb-cm__desc" rows="3" placeholder="Adicione mais detalhes…">' + esc(c.desc) + '</textarea>' : '<div class="qb-cm__desc-ro">' + (isReal(c.desc) ? esc(c.desc).replace(/\n/g, '<br>') : '<span class="qb-muted">Sem descrição.</span>') + '</div>') +
          '</section>' +
          checklistsHTML(c, ed) +
          commentsHTML(b, c, ed) +
        '</div>' +
        '<aside class="qb-cm__side">' +
          (ed ? sideAddHTML(b, c) : '<div class="qb-cm__ro">Perfil Visualizador: somente leitura.</div>') +
          (ed ? sideActionsHTML() : '') +
          activityHTML(c) +
        '</aside>' +
      '</div>';
    wireCard(b, c, ed);
  }

  function sideAddHTML(b, c) {
    return '<div class="qb-cm__h">Adicionar ao cartão</div>' +
      '<div class="qb-cm__addgrid">' +
        '<button class="qb-addbtn" type="button" data-add="labels">' + ic('tag', 15) + 'Etiquetas</button>' +
        '<button class="qb-addbtn" type="button" data-add="members">' + ic('users', 15) + 'Responsáveis</button>' +
        '<button class="qb-addbtn" type="button" data-add="due">' + ic('clock', 15) + 'Prazo</button>' +
        '<button class="qb-addbtn" type="button" data-add="priority">' + ic('flag', 15) + 'Prioridade</button>' +
        '<button class="qb-addbtn" type="button" data-add="checklist">' + ic('checklist', 15) + 'Checklist</button>' +
        '<button class="qb-addbtn" type="button" data-add="value">' + ic('money', 15) + 'Valor</button>' +
        '<button class="qb-addbtn" type="button" data-add="cover">' + ic('tag', 15) + 'Capa</button>' +
        '<button class="qb-addbtn" type="button" data-add="attach">' + ic('paperclip', 15) + 'Anexo</button>' +
        '<button class="qb-addbtn" type="button" data-add="crm">' + ic('building', 15) + 'Vincular CRM</button>' +
      '</div>' +
      (b.fields.length ? '<div class="qb-cm__h qb-cm__h--mt">Campos personalizados</div><div class="qb-cm__fields" id="qbCmFields"></div>' : '');
  }
  function sideActionsHTML() {
    return '<div class="qb-cm__h qb-cm__h--mt">Ações</div>' +
      '<div class="qb-cm__acts">' +
        '<button class="qb-addbtn" type="button" data-act="move">' + ic('arrowR', 15) + 'Mover</button>' +
        '<button class="qb-addbtn" type="button" data-act="copy">' + ic('copy', 15) + 'Duplicar</button>' +
        '<button class="qb-addbtn" type="button" data-act="archive">' + ic('archive', 15) + 'Arquivar</button>' +
        '<button class="qb-addbtn qb-addbtn--danger" type="button" data-act="delete">' + ic('trash', 15) + 'Excluir</button>' +
      '</div>';
  }
  function checklistsHTML(c, ed) {
    if (!c.checklists.length && !ed) return '';
    return '<section class="qb-cm__sec">' + c.checklists.map((cl) => {
      const t = cl.items.length, d = cl.items.filter((i) => i.done).length, pct = t ? Math.round(d / t * 100) : 0;
      return '<div class="qb-chk" data-chk="' + cl.id + '">' +
        '<div class="qb-chk__head">' + ic('checklist', 15) + '<span class="qb-chk__title">' + esc(cl.title) + '</span><span class="qb-chk__pct tnum">' + pct + '%</span>' + (ed ? '<button class="qb-x" type="button" data-chkdel="' + cl.id + '" aria-label="Remover checklist">' + ic('trash', 14) + '</button>' : '') + '</div>' +
        '<div class="qb-chk__track"><div class="qb-chk__fill" style="width:' + pct + '%"></div></div>' +
        '<div class="qb-chk__items">' + cl.items.map((it) => '<div class="qb-chk__item' + (it.done ? ' is-done' : '') + '"><button class="qb-chk__box" type="button" data-chktoggle="' + cl.id + ':' + it.id + '"' + (ed ? '' : ' disabled') + '>' + (it.done ? ic('check', 13) : '') + '</button><span class="qb-chk__text">' + esc(it.text) + '</span>' + (ed ? '<button class="qb-x" type="button" data-chkitemdel="' + cl.id + ':' + it.id + '" aria-label="Remover item">' + ic('close', 13) + '</button>' : '') + '</div>').join('') + '</div>' +
        (ed ? '<div class="qb-chk__add"><input type="text" placeholder="Adicionar item…" data-chkadd="' + cl.id + '"></div>' : '') +
      '</div>';
    }).join('') + '</section>';
  }
  function commentsHTML(b, c, ed) {
    const comments = c.comments.slice().sort((a, z) => z.ts - a.ts);
    return '<section class="qb-cm__sec"><div class="qb-cm__h">' + ic('chat', 15) + 'Comentários</div>' +
      (ed ? '<div class="qb-cmt__new"><span class="qb-avatar qb-avatar--sm" style="background:' + me().color + '">' + initials(me().name) + '</span><div class="qb-cmt__field"><textarea class="qb-cmt__input" rows="1" placeholder="Escreva um comentário… use @ para mencionar"></textarea><button class="mbtn mbtn--primary qb-mini" type="button" data-cmtsend>Comentar</button></div></div>' : '') +
      '<div class="qb-cmt__list">' + (comments.length ? comments.map((cm) => { const au = S.members.find((m) => m.id === cm.by); return '<div class="qb-cmt"><span class="qb-avatar qb-avatar--sm" style="background:' + (au ? au.color : '#8A8498') + '">' + initials(au ? au.name : '?') + '</span><div class="qb-cmt__body"><div class="qb-cmt__meta"><b>' + esc(au ? au.name : 'Alguém') + '</b> · ' + fmtAgo(cm.ts) + '</div><div class="qb-cmt__text">' + renderMentions(cm.text) + '</div></div></div>'; }).join('') : '<p class="qb-muted">Nenhum comentário ainda.</p>') + '</div>' +
    '</section>';
  }
  function renderMentions(text) { return esc(text).replace(/@([\wÀ-ú]+)/g, '<span class="qb-mention">@$1</span>').replace(/\n/g, '<br>'); }
  function activityHTML(c) {
    const acts = (c.activity || []).slice().sort((a, z) => z.ts - a.ts).slice(0, 12);
    return '<div class="qb-cm__h qb-cm__h--mt">' + ic('history', 15) + 'Histórico</div>' +
      '<div class="qb-act">' + acts.map((a) => { const au = S.members.find((m) => m.id === a.by); return '<div class="qb-act__row"><span class="qb-act__dot"></span><div><b>' + esc(au ? au.name : 'Alguém') + '</b> ' + esc(a.text) + '<small>' + fmtAgo(a.ts) + '</small></div></div>'; }).join('') + '</div>';
  }

  function wireCard(b, c, ed) {
    modalEl.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', closeCard));
    const crmOpen = modalEl.querySelector('[data-crmopen]'); if (crmOpen && c.crm && F.openLead) crmOpen.addEventListener('click', () => { closeCard(); F.go && F.go('leads'); F.openLead(c.crm.empresa); });
    const moveHere = modalEl.querySelector('[data-movehere]'); if (moveHere && ed) moveHere.addEventListener('click', (e) => openMovePop(b, c, e.currentTarget));
    if (!ed) return;

    const title = modalEl.querySelector('.qb-cm__title');
    if (title) { autoGrow(title); title.addEventListener('blur', () => { const v = title.value.trim() || 'Sem título'; if (v !== c.title) { c.title = v; touchCard(c); save(); } }); title.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); title.blur(); } }); }
    const desc = modalEl.querySelector('.qb-cm__desc');
    if (desc) { autoGrow(desc); desc.addEventListener('blur', () => { if (desc.value !== c.desc) { c.desc = desc.value; touchCard(c); save(); } }); }

    // checklists
    modalEl.querySelectorAll('[data-chktoggle]').forEach((x) => x.addEventListener('click', () => {
      const [clId, itId] = x.dataset.chktoggle.split(':'); const cl = c.checklists.find((l) => l.id === clId); const it = cl && cl.items.find((i) => i.id === itId);
      if (it) { it.done = !it.done; touchCard(c); save(); renderCard(); }
    }));
    modalEl.querySelectorAll('[data-chkadd]').forEach((inp) => inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return; const v = inp.value.trim(); if (!v) return;
      const cl = c.checklists.find((l) => l.id === inp.dataset.chkadd); if (cl) { cl.items.push({ id: uid('ci'), text: v, done: false }); touchCard(c); save(); renderCard(); setTimeout(() => { const n = modalEl.querySelector('[data-chkadd="' + cl.id + '"]'); if (n) n.focus(); }, 20); }
    }));
    modalEl.querySelectorAll('[data-chkitemdel]').forEach((x) => x.addEventListener('click', () => { const [clId, itId] = x.dataset.chkitemdel.split(':'); const cl = c.checklists.find((l) => l.id === clId); if (cl) { cl.items = cl.items.filter((i) => i.id !== itId); touchCard(c); save(); renderCard(); } }));
    modalEl.querySelectorAll('[data-chkdel]').forEach((x) => x.addEventListener('click', () => { c.checklists = c.checklists.filter((l) => l.id !== x.dataset.chkdel); touchCard(c); save(); renderCard(); }));

    // comentários
    const cmt = modalEl.querySelector('.qb-cmt__input');
    if (cmt) { autoGrow(cmt);
      const send = () => { const v = cmt.value.trim(); if (!v) return; c.comments.push({ id: uid('cm'), by: me().id, text: v, ts: now() }); logActivity(c, 'comentou'); handleMentions(b, c, v); touchCard(c); save(); renderCard(); };
      modalEl.querySelector('[data-cmtsend]').addEventListener('click', send);
      cmt.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } });
    }

    // campos personalizados
    const fieldsHost = modalEl.querySelector('#qbCmFields'); if (fieldsHost) renderCardFields(b, c, fieldsHost);

    // adicionar ao cartão
    modalEl.querySelectorAll('[data-add]').forEach((btn) => btn.addEventListener('click', (e) => openAddPop(b, c, btn.dataset.add, e.currentTarget)));
    // ações
    modalEl.querySelectorAll('[data-act]').forEach((btn) => btn.addEventListener('click', (e) => cardAction(b, c, btn.dataset.act, e.currentTarget)));
  }
  function autoGrow(ta) { const g = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }; ta.addEventListener('input', g); setTimeout(g, 0); }
  function touchCard(c) { c.updatedAt = now(); }
  function logActivity(c, text) { c.activity = c.activity || []; c.activity.push({ id: uid('a'), text: text, ts: now(), by: me().id }); if (c.activity.length > 60) c.activity = c.activity.slice(-60); }

  function renderCardFields(b, c, host) {
    host.innerHTML = b.fields.map((f) => {
      const v = (c.fields && c.fields[f.id] != null) ? c.fields[f.id] : '';
      let ctrl;
      if (f.type === 'select' || f.type === 'multi') {
        ctrl = '<select class="qb-field__ctrl" data-field="' + f.id + '"><option value="">—</option>' + (f.options || []).map((o) => '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
      } else if (f.type === 'date') {
        ctrl = '<input type="date" class="qb-field__ctrl" data-field="' + f.id + '" value="' + esc(v) + '">';
      } else if (f.type === 'number' || f.type === 'currency') {
        ctrl = '<input type="text" inputmode="decimal" class="qb-field__ctrl" data-field="' + f.id + '" value="' + esc(v) + '" placeholder="' + (f.type === 'currency' ? 'R$ 0,00' : '0') + '">';
      } else {
        ctrl = '<input type="text" class="qb-field__ctrl" data-field="' + f.id + '" value="' + esc(v) + '" placeholder="' + (f.type === 'link' ? 'https://…' : '') + '">';
      }
      return '<label class="qb-field"><span class="qb-field__lbl">' + esc(f.name) + '</span>' + ctrl + '</label>';
    }).join('');
    host.querySelectorAll('[data-field]').forEach((ctrl) => {
      const ev = ctrl.tagName === 'SELECT' ? 'change' : 'change';
      ctrl.addEventListener(ev, () => { c.fields = c.fields || {}; c.fields[ctrl.dataset.field] = ctrl.value; touchCard(c); save(); });
    });
  }

  function handleMentions(b, c, text) {
    const matches = text.match(/@([\wÀ-ú]+)/g) || [];
    matches.forEach((mt) => {
      const name = mt.slice(1).toLowerCase();
      const m = S.members.find((x) => x.name.toLowerCase().replace(/\s/g, '').indexOf(name) === 0 || x.name.toLowerCase().split(/\s/)[0] === name);
      if (m && m.id !== me().id) notify({ text: me().name + ' mencionou você em “' + c.title + '”', icon: 'chat', boardId: b.id, cardId: c.id });
    });
  }

  /* ---------- popovers "adicionar ao cartão" ---------- */
  function openAddPop(b, c, kind, anchor) {
    if (kind === 'labels') pop(anchor, labelsPopHTML(b, c), (p) => {
      p.querySelectorAll('[data-togglelabel]').forEach((x) => x.addEventListener('click', () => { toggleArr(c.labels, x.dataset.togglelabel); touchCard(c); save(); p.refresh(labelsPopHTML(b, c)); renderCard(); }));
      const nl = p.querySelector('[data-newlabel]'); if (nl) nl.addEventListener('click', () => { const l = mkLabel('', 'blue'); b.labels.push(l); save(); openSettings(b, 'labels'); closeCard(); });
    });
    else if (kind === 'members') pop(anchor, membersPopHTML(c), (p) => {
      p.querySelectorAll('[data-togglemember]').forEach((x) => x.addEventListener('click', () => {
        const id = x.dataset.togglemember; const had = c.members.includes(id); toggleArr(c.members, id);
        if (!had && id !== me().id) { logActivity(c, 'atribuiu ' + (S.members.find((m) => m.id === id) || {}).name); notify({ text: me().name + ' atribuiu “' + c.title + '” a você', icon: 'user', boardId: b.id, cardId: c.id }); }
        touchCard(c); save(); p.refresh(membersPopHTML(c)); renderCard();
      }));
    });
    else if (kind === 'priority') pop(anchor, priorityPopHTML(b, c), (p) => {
      p.querySelectorAll('[data-setprio]').forEach((x) => x.addEventListener('click', () => { c.priority = c.priority === x.dataset.setprio ? '' : x.dataset.setprio; touchCard(c); save(); p.close(); renderCard(); }));
    });
    else if (kind === 'due') pop(anchor, duePopHTML(c), (p) => {
      const inp = p.querySelector('#qbDueInput'); const rem = p.querySelector('#qbRemInput');
      p.querySelector('[data-savedue]').addEventListener('click', () => { c.due = fromInputDate(inp.value); c.reminderDays = parseInt(rem.value, 10) || 0; touchCard(c); logActivity(c, c.due ? 'definiu prazo ' + dmy(c.due) : 'removeu o prazo'); save(); p.close(); renderCard(); });
      const rd = p.querySelector('[data-cleardue]'); if (rd) rd.addEventListener('click', () => { c.due = 0; c.reminderDays = 0; touchCard(c); save(); p.close(); renderCard(); });
    });
    else if (kind === 'value') pop(anchor, valuePopHTML(c), (p) => {
      const inp = p.querySelector('#qbValInput'); inp.focus();
      p.querySelector('[data-saveval]').addEventListener('click', () => { c.value = parseMoney(inp.value); touchCard(c); save(); p.close(); renderCard(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') p.querySelector('[data-saveval]').click(); });
    });
    else if (kind === 'checklist') pop(anchor, checklistPopHTML(), (p) => {
      const inp = p.querySelector('#qbChkTitle'); inp.focus();
      p.querySelector('[data-addchk]').addEventListener('click', () => { const t = inp.value.trim() || 'Checklist'; c.checklists.push({ id: uid('cl'), title: t, items: [] }); touchCard(c); save(); p.close(); renderCard(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') p.querySelector('[data-addchk]').click(); });
    });
    else if (kind === 'cover') pop(anchor, coverPopHTML(c), (p) => {
      p.querySelectorAll('[data-cover]').forEach((x) => x.addEventListener('click', () => { c.coverKind = 'color'; c.cover = x.dataset.cover; touchCard(c); save(); p.close(); renderCard(); }));
      const rc = p.querySelector('[data-coverclear]'); if (rc) rc.addEventListener('click', () => { c.cover = ''; touchCard(c); save(); p.close(); renderCard(); });
    });
    else if (kind === 'attach') pop(anchor, attachPopHTML(), (p) => {
      const nm = p.querySelector('#qbAttName'), url = p.querySelector('#qbAttUrl'); url.focus();
      p.querySelector('[data-addatt]').addEventListener('click', () => { const u = url.value.trim(); if (!u) return; c.attachments.push({ id: uid('at'), name: nm.value.trim() || u, url: u }); touchCard(c); logActivity(c, 'anexou um link'); save(); p.close(); renderCard(); });
    });
    else if (kind === 'crm') pop(anchor, crmPopHTML(c), (p) => {
      const inp = p.querySelector('#qbCrmSearch'), listEl = p.querySelector('#qbCrmList');
      const data = getData(); const leads = (data && data.leads) || [];
      const paint = (q) => { const ql = (q || '').toLowerCase(); listEl.innerHTML = leads.filter((l) => !ql || l.empresa.toLowerCase().indexOf(ql) >= 0).slice(0, 30).map((l) => '<button class="qb-crm__opt" type="button" data-crmpick="' + esc(l.empresa) + '">' + ic('building', 14) + esc(l.empresa) + '</button>').join('') || '<div class="qb-muted" style="padding:8px">Nenhuma empresa no CRM.</div>'; listEl.querySelectorAll('[data-crmpick]').forEach((x) => x.addEventListener('click', () => { const emp = x.dataset.crmpick; const dec = F.decisorFor ? F.decisorFor(emp) : null; c.crm = { empresa: emp, decisor: (dec && dec.decisor) || '' }; touchCard(c); logActivity(c, 'vinculou ao cliente ' + emp); save(); p.close(); renderCard(); })); };
      if (inp) { inp.focus(); inp.addEventListener('input', () => paint(inp.value)); } paint('');
      const unl = p.querySelector('[data-crmunlink]'); if (unl) unl.addEventListener('click', () => { c.crm = null; touchCard(c); save(); p.close(); renderCard(); });
    });
  }
  function labelsPopHTML(b, c) { return '<div class="qb-pop__h">Etiquetas</div>' + (b.labels.length ? b.labels.map((l) => '<button class="qb-pop__opt" type="button" data-togglelabel="' + l.id + '"><span class="qb-sw qb-sw--lg" style="background:' + l.color + '"></span><span class="qb-pop__labname">' + esc(l.name || 'Sem nome') + '</span>' + (c.labels.includes(l.id) ? ic('check', 15) : '') + '</button>').join('') : '<p class="qb-muted" style="padding:4px 2px">Nenhuma etiqueta.</p>') + (canAdmin() ? '<button class="qb-pop__add" type="button" data-newlabel>' + ic('plus', 14) + 'Criar etiqueta</button>' : ''); }
  function membersPopHTML(c) { return '<div class="qb-pop__h">Responsáveis</div>' + S.members.map((m) => '<button class="qb-pop__opt" type="button" data-togglemember="' + m.id + '"><span class="qb-avatar qb-avatar--sm" style="background:' + m.color + '">' + initials(m.name) + '</span><span class="qb-pop__labname">' + esc(m.name) + '</span>' + (c.members.includes(m.id) ? ic('check', 15) : '') + '</button>').join(''); }
  function priorityPopHTML(b, c) { return '<div class="qb-pop__h">Prioridade</div>' + b.priorities.map((p) => '<button class="qb-pop__opt" type="button" data-setprio="' + p.id + '"><span class="qb-sw qb-sw--lg" style="background:' + p.color + '"></span><span class="qb-pop__labname">' + esc(p.name) + '</span>' + (c.priority === p.id ? ic('check', 15) : '') + '</button>').join(''); }
  function duePopHTML(c) { return '<div class="qb-pop__h">Prazo</div><label class="qb-pop__field"><span>Data</span><input type="date" id="qbDueInput" value="' + toInputDate(c.due) + '"></label><label class="qb-pop__field"><span>Lembrete (dias antes)</span><input type="number" id="qbRemInput" min="0" max="30" value="' + (c.reminderDays || 0) + '"></label><div class="qb-pop__row"><button class="mbtn mbtn--primary qb-mini" type="button" data-savedue>Salvar</button>' + (c.due ? '<button class="btn-ghost qb-mini" type="button" data-cleardue>Remover</button>' : '') + '</div>'; }
  function valuePopHTML(c) { return '<div class="qb-pop__h">Valor monetário</div><label class="qb-pop__field"><span>Valor (R$)</span><input type="text" inputmode="decimal" id="qbValInput" value="' + (c.value ? String(c.value).replace('.', ',') : '') + '" placeholder="R$ 0,00"></label><div class="qb-pop__row"><button class="mbtn mbtn--primary qb-mini" type="button" data-saveval>Salvar</button></div>'; }
  function checklistPopHTML() { return '<div class="qb-pop__h">Nova checklist</div><label class="qb-pop__field"><span>Título</span><input type="text" id="qbChkTitle" placeholder="ex.: Checklist" value="Checklist"></label><div class="qb-pop__row"><button class="mbtn mbtn--primary qb-mini" type="button" data-addchk>Adicionar</button></div>'; }
  function coverPopHTML(c) { return '<div class="qb-pop__h">Capa</div><div class="qb-pop__colors">' + PALETTE.map((p) => '<button class="qb-pop__color' + (c.cover === p.hex ? ' is-on' : '') + '" type="button" data-cover="' + p.hex + '" style="background:' + p.hex + '" title="' + p.name + '"></button>').join('') + '</div>' + (c.cover ? '<button class="btn-ghost qb-mini" type="button" data-coverclear>Remover capa</button>' : ''); }
  function attachPopHTML() { return '<div class="qb-pop__h">Anexar link</div><label class="qb-pop__field"><span>Endereço (URL)</span><input type="url" id="qbAttUrl" placeholder="https://…"></label><label class="qb-pop__field"><span>Nome (opcional)</span><input type="text" id="qbAttName" placeholder="ex.: Proposta.pdf"></label><div class="qb-pop__row"><button class="mbtn mbtn--primary qb-mini" type="button" data-addatt>Anexar</button></div><small class="qb-muted">Anexe por link (Drive, Dropbox, site). Upload de arquivo requer servidor.</small>'; }
  function crmPopHTML(c) { return '<div class="qb-pop__h">Vincular ao CRM</div>' + (c.crm ? '<div class="qb-pop__linked">' + ic('building', 14) + '<b>' + esc(c.crm.empresa) + '</b><button class="btn-ghost qb-mini" type="button" data-crmunlink>Desvincular</button></div>' : '') + '<label class="qb-pop__field"><span>Buscar empresa</span><input type="search" id="qbCrmSearch" placeholder="Nome da empresa…"></label><div class="qb-crm__list" id="qbCrmList"></div>'; }

  function openMovePop(b, c, anchor) {
    const html = '<div class="qb-pop__h">Mover para a coluna</div>' + b.columns.filter((x) => !x.archived).map((col) => '<button class="qb-pop__opt" type="button" data-movecol="' + col.id + '"><span class="qb-sw qb-sw--lg" style="background:' + col.color + '"></span><span class="qb-pop__labname">' + esc(col.name) + '</span>' + (c.columnId === col.id ? ic('check', 15) : '') + '</button>').join('');
    pop(anchor, html, (p) => p.querySelectorAll('[data-movecol]').forEach((x) => x.addEventListener('click', () => { if (x.dataset.movecol !== c.columnId) dropCard(b, boardUI(b), c.id, x.dataset.movecol, 1e9); p.close(); renderCard(); })));
  }
  function cardAction(b, c, act, anchor) {
    if (act === 'move') return openMovePop(b, c, anchor);
    if (act === 'copy') {
      const copy = JSON.parse(JSON.stringify(c)); copy.id = uid('card'); copy.title = c.title + ' (cópia)'; copy.order = b.cards.filter((x) => x.columnId === c.columnId).length; copy.activity = [{ id: uid('a'), text: 'duplicou o cartão', ts: now(), by: me().id }]; copy.comments = [];
      b.cards.push(copy); save(); toast('Cartão duplicado.', 'ok'); renderStage(b, boardUI(b));
    }
    if (act === 'archive') { c.archived = true; touchCard(c); save(); closeCard(); toastUndo('Cartão arquivado.', () => { c.archived = false; save(); renderStage(b, boardUI(b)); }); renderStage(b, boardUI(b)); }
    if (act === 'delete') { if (!confirm('Excluir o cartão “' + c.title + '” de vez?')) return; b.cards = b.cards.filter((x) => x.id !== c.id); save(); closeCard(); toast('Cartão excluído.', 'ok'); }
  }

  /* ============================================================
     POPOVER genérico (ancorado)
     ============================================================ */
  let _pop = null;
  function pop(anchor, html, wire) {
    closePop();
    const p = el('div', 'qb-pop'); p.innerHTML = html; document.body.appendChild(p);
    const r = anchor.getBoundingClientRect();
    const w = Math.min(300, window.innerWidth - 20);
    p.style.width = w + 'px';
    let left = r.left; if (left + w > window.innerWidth - 10) left = window.innerWidth - w - 10;
    let top = r.bottom + 6; p.style.left = Math.max(10, left) + 'px';
    if (top + p.offsetHeight > window.innerHeight - 10) top = Math.max(10, r.top - p.offsetHeight - 6);
    p.style.top = top + 'px';
    p.close = closePop;
    p.refresh = (h) => { p.innerHTML = h; if (wire) wire(p); };
    _pop = p;
    const onDoc = (e) => { if (!p.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) closePop(); };
    const onKey = (e) => { if (e.key === 'Escape') closePop(); };
    p._onDoc = onDoc; p._onKey = onKey;
    setTimeout(() => { document.addEventListener('mousedown', onDoc, true); document.addEventListener('keydown', onKey, true); }, 0);
    if (wire) wire(p);
    return p;
  }
  function closePop() { if (_pop) { try { document.removeEventListener('mousedown', _pop._onDoc, true); document.removeEventListener('keydown', _pop._onKey, true); } catch (e) {} _pop.remove(); _pop = null; } }

  function openColorPicker(anchor, cur, cb) {
    pop(anchor, '<div class="qb-pop__h">Cor</div><div class="qb-pop__colors">' + PALETTE.map((p) => '<button class="qb-pop__color' + (cur === p.hex ? ' is-on' : '') + '" type="button" data-pick="' + p.hex + '" style="background:' + p.hex + '" title="' + p.name + '"></button>').join('') + '</div>', (p) => p.querySelectorAll('[data-pick]').forEach((x) => x.addEventListener('click', () => { cb(x.dataset.pick); p.close(); })));
  }

  /* ============================================================
     MENUS (simples, ancorados) — usados em vários lugares
     ============================================================ */
  function simpleMenu(btn, menu, onOpen) {
    let onDoc = null, onKey = null;
    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (onDoc) document.removeEventListener('mousedown', onDoc, true); if (onKey) document.removeEventListener('keydown', onKey, true); onDoc = onKey = null; };
    const open = () => {
      closeAllMenus(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); if (onOpen) onOpen();
      onDoc = (e) => { if (!menu.contains(e.target) && !btn.contains(e.target)) close(); };
      onKey = (e) => { if (e.key === 'Escape') { close(); btn.focus(); } };
      setTimeout(() => { document.addEventListener('mousedown', onDoc, true); document.addEventListener('keydown', onKey, true); }, 0);
    };
    menu._close = close;
    btn.addEventListener('click', (e) => { e.stopPropagation(); if (menu.hidden) open(); else close(); });
  }
  function closeMenu(menu, btn) { if (menu._close) menu._close(); else { menu.hidden = true; if (btn) btn.setAttribute('aria-expanded', 'false'); } }
  function closeAllMenus() { document.querySelectorAll('.menu:not([hidden])').forEach((m) => { if (m._close) m._close(); else m.hidden = true; }); closePop(); }

  // menu "flutuante" criado na hora (usado por colunas e quadros)
  function popMenu(anchor, items) {
    closePop();
    const m = el('div', 'qb-pop qb-pop--menu');
    m.innerHTML = items.map((it) => it[0] === 'sep' ? '<div class="menu__sep"></div>' : '<button class="menu__item' + (it[3] ? ' menu__item--danger' : '') + '" type="button" data-mi="' + it[0] + '">' + ic(it[1], 16) + '<span>' + esc(it[2]) + '</span></button>').join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    const w = 220; let left = r.right - w; if (left < 10) left = 10;
    m.style.width = w + 'px'; m.style.left = left + 'px';
    let top = r.bottom + 6; if (top + m.offsetHeight > window.innerHeight - 10) top = Math.max(10, r.top - m.offsetHeight - 6);
    m.style.top = top + 'px';
    _pop = m;
    const onDoc = (e) => { if (!m.contains(e.target) && !anchor.contains(e.target)) closePop(); };
    const onKey = (e) => { if (e.key === 'Escape') closePop(); };
    m._onDoc = onDoc; m._onKey = onKey;
    setTimeout(() => { document.addEventListener('mousedown', onDoc, true); document.addEventListener('keydown', onKey, true); }, 0);
    const handlers = {};
    m.querySelectorAll('[data-mi]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.mi; closePop(); if (handlers[k]) handlers[k](); }));
    return { on: (k, fn) => { handlers[k] = fn; } };
  }

  /* ---------- menu do quadro (na tela inicial) ---------- */
  function openBoardMenu(btn, id) {
    const b = S.boards.find((x) => x.id === id); if (!b) return;
    const items = [['open', 'eye', 'Abrir']];
    if (canEdit()) items.push(['rename', 'edit', 'Renomear']);
    if (canAdmin()) { items.push(['color', 'tag', 'Mudar cor']); items.push(['dup', 'copy', 'Duplicar']); items.push(['export', 'download', 'Exportar (JSON)']); items.push(['sep']); items.push([b.archived ? 'unarchive' : 'archive', 'archive', b.archived ? 'Desarquivar' : 'Arquivar']); items.push(['delete', 'trash', 'Excluir', true]); }
    const menu = popMenu(btn, items);
    menu.on('open', () => openBoard(id));
    menu.on('rename', () => { const v = prompt('Novo nome do quadro:', b.name); if (v && v.trim()) { b.name = v.trim(); b.updatedAt = now(); save(); render(); } });
    menu.on('color', () => openColorPicker(btn, b.color, (hex) => { b.color = hex; save(); render(); }));
    menu.on('dup', () => { const copy = JSON.parse(JSON.stringify(b)); copy.id = uid('b'); copy.name = b.name + ' (cópia)'; copy.createdAt = copy.updatedAt = now(); remapIds(copy); S.boards.push(copy); save(); render(); toast('Quadro duplicado.', 'ok'); });
    menu.on('export', () => exportBoard(b));
    menu.on('archive', () => { b.archived = true; save(); render(); toast('Quadro arquivado.', 'ok'); });
    menu.on('unarchive', () => { b.archived = false; save(); render(); toast('Quadro restaurado.', 'ok'); });
    menu.on('delete', () => { if (!confirm('Excluir o quadro “' + b.name + '” e todos os seus cartões? Isso não pode ser desfeito.')) return; S.boards = S.boards.filter((x) => x.id !== id); save(); render(); toast('Quadro excluído.', 'ok'); });
  }
  function remapIds(b) {
    const colMap = {}; b.columns.forEach((c) => { const n = uid('c'); colMap[c.id] = n; c.id = n; });
    const labMap = {}; b.labels.forEach((l) => { const n = uid('l'); labMap[l.id] = n; l.id = n; });
    const prMap = {}; b.priorities.forEach((p) => { const n = uid('p'); prMap[p.id] = n; p.id = n; });
    const fMap = {}; b.fields.forEach((f) => { const n = uid('f'); fMap[f.id] = n; f.id = n; });
    b.cards.forEach((c) => { c.id = uid('card'); c.columnId = colMap[c.columnId] || c.columnId; c.labels = (c.labels || []).map((x) => labMap[x] || x); c.priority = prMap[c.priority] || ''; const nf = {}; Object.keys(c.fields || {}).forEach((k) => { nf[fMap[k] || k] = c.fields[k]; }); c.fields = nf; });
    (b.automations || []).forEach((a) => { a.id = uid('au'); });
    b.filters = [];
  }
  function exportBoard(b) {
    try {
      const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = el('a'); a.href = url; a.download = 'quadro-' + b.name.replace(/[^\w]+/g, '-').toLowerCase() + '.json';
      document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 600);
      toast('Quadro exportado.', 'ok');
    } catch (e) { toast('Não consegui exportar.', 'bad'); }
  }

  /* ============================================================
     NOVO QUADRO (modelos)
     ============================================================ */
  function openNewBoard() {
    if (!canEdit()) { toast('Seu perfil não cria quadros.', 'bad'); return; }
    const m = genericModal();
    const tpl = [
      ['funil', 'kanban', 'Funil de vendas', 'Lead → Contato → Proposta → Negociação → Ganho/Perdido. Já traz seus leads do CRM.'],
      ['atendimento', 'chat', 'Atendimento ao cliente', 'Novo → Em análise → Aguardando → Resolvido.'],
      ['projetos', 'layers', 'Projetos', 'Backlog → A fazer → Fazendo → Revisão → Concluído.'],
      ['equipe', 'users', 'Tarefas da equipe', 'A fazer → Fazendo → Concluído.'],
      ['branco', 'board', 'Quadro em branco', 'Comece do zero e monte as colunas do seu jeito.'],
    ];
    m.body.innerHTML =
      '<div class="modal__eyebrow">Novo quadro</div><h2 class="modal__title serif">Escolha um <em>modelo</em></h2>' +
      '<p class="qb-muted" style="margin:6px 0 16px">Todos são totalmente editáveis depois — colunas, cores, etiquetas e campos.</p>' +
      '<label class="qb-field qb-field--full" style="margin-bottom:16px"><span class="qb-field__lbl">Nome do quadro (opcional)</span><input type="text" id="qbNewName" placeholder="ex.: Vendas 2026"></label>' +
      '<div class="qb-tpl-grid">' + tpl.map((t) => '<button class="qb-tpl" type="button" data-tpl="' + t[0] + '"><span class="qb-tpl__ico">' + ic(t[1], 20) + '</span><b>' + t[2] + '</b><small>' + t[3] + '</small></button>').join('') + '</div>';
    m.show();
    m.body.querySelectorAll('[data-tpl]').forEach((btn) => btn.addEventListener('click', () => {
      const name = (m.body.querySelector('#qbNewName').value || '').trim();
      const board = buildBoard(btn.dataset.tpl, name);
      S.boards.push(board); save(); m.close(); openBoard(board.id);
      toast('Quadro “' + board.name + '” criado.', 'ok');
    }));
  }

  /* ============================================================
     CONFIGURAÇÕES DO QUADRO (etiquetas, prioridades, campos, equipe)
     ============================================================ */
  function openSettings(b, tab) {
    if (!canAdmin()) return;
    const m = genericModal('qb-modal--settings');
    let active = tab || 'labels';
    const tabs = [['labels', 'tag', 'Etiquetas'], ['priorities', 'flag', 'Prioridades'], ['fields', 'hash', 'Campos'], ['team', 'users', 'Equipe']];
    const paint = () => {
      m.body.innerHTML =
        '<div class="modal__eyebrow">Configurar</div><h2 class="modal__title serif">' + esc(b.name) + '</h2>' +
        '<div class="qb-settabs">' + tabs.map((t) => '<button class="qb-settab' + (active === t[0] ? ' is-on' : '') + '" type="button" data-tab="' + t[0] + '">' + ic(t[1], 15) + t[2] + '</button>').join('') + '</div>' +
        '<div class="qb-setbody" id="qbSetBody"></div>';
      const host = m.body.querySelector('#qbSetBody');
      if (active === 'labels') setLabels(b, host);
      else if (active === 'priorities') setPriorities(b, host);
      else if (active === 'fields') setFields(b, host);
      else if (active === 'team') setTeam(host);
      m.body.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => { active = t.dataset.tab; paint(); }));
    };
    m.onClose = () => { save(); renderBoard(); };
    paint(); m.show();
  }
  function setLabels(b, host) {
    host.innerHTML = '<div class="qb-setlist">' + b.labels.map((l) => rowEdit(l.id, l.color, l.name, 'label')).join('') + '</div>' +
      '<button class="qb-pop__add" type="button" data-newlabel>' + ic('plus', 14) + 'Nova etiqueta</button>';
    host.querySelector('[data-newlabel]').addEventListener('click', () => { b.labels.push(mkLabel('', PALETTE[b.labels.length % PALETTE.length].id)); save(); setLabels(b, host); });
    wireRowEdit(host, b.labels, () => { save(); setLabels(b, host); });
  }
  function setPriorities(b, host) {
    host.innerHTML = '<div class="qb-setlist">' + b.priorities.map((p) => rowEdit(p.id, p.color, p.name, 'prio')).join('') + '</div>' +
      '<button class="qb-pop__add" type="button" data-newprio>' + ic('plus', 14) + 'Nova prioridade</button>';
    host.querySelector('[data-newprio]').addEventListener('click', () => { b.priorities.push({ id: uid('p'), name: 'Nova', color: PALETTE[b.priorities.length % PALETTE.length].hex }); save(); setPriorities(b, host); });
    wireRowEdit(host, b.priorities, () => { save(); setPriorities(b, host); });
  }
  function rowEdit(id, color, name, kind) {
    return '<div class="qb-setrow" data-row="' + id + '"><button class="qb-setrow__sw" type="button" data-rowcolor="' + id + '" style="background:' + color + '" aria-label="Cor"></button>' +
      '<input type="text" class="qb-setrow__name" data-rowname="' + id + '" value="' + esc(name) + '" placeholder="Nome"><button class="qb-x" type="button" data-rowdel="' + id + '" aria-label="Remover">' + ic('trash', 15) + '</button></div>';
  }
  function wireRowEdit(host, arr, refresh) {
    host.querySelectorAll('[data-rowname]').forEach((inp) => inp.addEventListener('change', () => { const o = arr.find((x) => x.id === inp.dataset.rowname); if (o) { o.name = inp.value; save(); } }));
    host.querySelectorAll('[data-rowcolor]').forEach((btn) => btn.addEventListener('click', () => { const o = arr.find((x) => x.id === btn.dataset.rowcolor); openColorPicker(btn, o.color, (hex) => { o.color = hex; refresh(); }); }));
    host.querySelectorAll('[data-rowdel]').forEach((btn) => btn.addEventListener('click', () => { const i = arr.findIndex((x) => x.id === btn.dataset.rowdel); if (i >= 0) { arr.splice(i, 1); refresh(); } }));
  }
  function setFields(b, host) {
    const types = [['text', 'Texto'], ['number', 'Número'], ['currency', 'Moeda'], ['date', 'Data'], ['select', 'Lista'], ['multi', 'Múltipla escolha'], ['link', 'Link'], ['file', 'Arquivo (link)']];
    host.innerHTML = '<div class="qb-setlist">' + b.fields.map((f) =>
      '<div class="qb-fieldrow" data-row="' + f.id + '"><input type="text" class="qb-setrow__name" data-fname="' + f.id + '" value="' + esc(f.name) + '" placeholder="Nome do campo">' +
      '<select class="select qb-mini-sel" data-ftype="' + f.id + '">' + types.map((t) => '<option value="' + t[0] + '"' + (f.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>').join('') + '</select>' +
      '<button class="qb-x" type="button" data-fdel="' + f.id + '" aria-label="Remover">' + ic('trash', 15) + '</button>' +
      ((f.type === 'select' || f.type === 'multi') ? '<input type="text" class="qb-setrow__name qb-field-opts" data-fopts="' + f.id + '" value="' + esc((f.options || []).join(', ')) + '" placeholder="Opções separadas por vírgula">' : '') +
      '</div>').join('') + '</div>' +
      '<button class="qb-pop__add" type="button" data-newfield>' + ic('plus', 14) + 'Novo campo</button>';
    host.querySelector('[data-newfield]').addEventListener('click', () => { b.fields.push({ id: uid('f'), name: 'Campo', type: 'text', options: [] }); save(); setFields(b, host); });
    host.querySelectorAll('[data-fname]').forEach((inp) => inp.addEventListener('change', () => { const f = b.fields.find((x) => x.id === inp.dataset.fname); if (f) { f.name = inp.value; save(); } }));
    host.querySelectorAll('[data-ftype]').forEach((sel) => sel.addEventListener('change', () => { const f = b.fields.find((x) => x.id === sel.dataset.ftype); if (f) { f.type = sel.value; save(); setFields(b, host); } }));
    host.querySelectorAll('[data-fopts]').forEach((inp) => inp.addEventListener('change', () => { const f = b.fields.find((x) => x.id === inp.dataset.fopts); if (f) { f.options = inp.value.split(',').map((s) => s.trim()).filter(Boolean); save(); } }));
    host.querySelectorAll('[data-fdel]').forEach((btn) => btn.addEventListener('click', () => { b.fields = b.fields.filter((x) => x.id !== btn.dataset.fdel); save(); setFields(b, host); }));
  }
  function setTeam(host) {
    const roles = [['admin', 'Administrador'], ['editor', 'Editor'], ['viewer', 'Visualizador']];
    host.innerHTML = '<p class="qb-muted" style="margin-bottom:12px">A equipe é compartilhada entre todos os quadros. O perfil define o que cada pessoa pode fazer.</p>' +
      '<div class="qb-setlist">' + S.members.map((m) =>
        '<div class="qb-teamrow" data-row="' + m.id + '"><button class="qb-avatar" style="background:' + m.color + '" data-mcolor="' + m.id + '" title="Cor">' + initials(m.name) + '</button>' +
        '<input type="text" class="qb-setrow__name" data-mname="' + m.id + '" value="' + esc(m.name) + '">' +
        '<select class="select qb-mini-sel" data-mrole="' + m.id + '">' + roles.map((r) => '<option value="' + r[0] + '"' + (m.role === r[0] ? ' selected' : '') + '>' + r[1] + '</option>').join('') + '</select>' +
        (S.members.length > 1 ? '<button class="qb-x" type="button" data-mdel="' + m.id + '" aria-label="Remover">' + ic('trash', 15) + '</button>' : '') +
        '</div>').join('') + '</div>' +
      '<button class="qb-pop__add" type="button" data-newmember>' + ic('plus', 14) + 'Adicionar pessoa</button>';
    host.querySelector('[data-newmember]').addEventListener('click', () => { S.members.push({ id: uid('m'), name: 'Nova pessoa', color: PALETTE[S.members.length % PALETTE.length].hex, role: 'editor' }); save(); setTeam(host); });
    host.querySelectorAll('[data-mname]').forEach((inp) => inp.addEventListener('change', () => { const m = S.members.find((x) => x.id === inp.dataset.mname); if (m) { m.name = inp.value || m.name; save(); } }));
    host.querySelectorAll('[data-mrole]').forEach((sel) => sel.addEventListener('change', () => { const m = S.members.find((x) => x.id === sel.dataset.mrole); if (m) { m.role = sel.value; save(); } }));
    host.querySelectorAll('[data-mcolor]').forEach((btn) => btn.addEventListener('click', () => { const m = S.members.find((x) => x.id === btn.dataset.mcolor); openColorPicker(btn, m.color, (hex) => { m.color = hex; save(); setTeam(host); }); }));
    host.querySelectorAll('[data-mdel]').forEach((btn) => btn.addEventListener('click', () => { const id = btn.dataset.mdel; if (id === S.prefs.currentUserId) { toast('Você não pode remover o próprio perfil ativo.', 'bad'); return; } S.members = S.members.filter((x) => x.id !== id); save(); setTeam(host); }));
  }
  function openTeamModal() { const b = curBoard(); if (b) openSettings(b, 'team'); else { const m = genericModal('qb-modal--settings'); m.body.innerHTML = '<div class="modal__eyebrow">Equipe</div><h2 class="modal__title serif">Gerenciar <em>equipe</em></h2><div id="qbTeamHost" style="margin-top:16px"></div>'; m.onClose = () => { save(); render(); }; setTeam(m.body.querySelector('#qbTeamHost')); m.show(); } }

  /* ============================================================
     AUTOMAÇÕES ("quando… então…")
     ============================================================ */
  function openAutomations(b) {
    if (!canAdmin()) return;
    const m = genericModal('qb-modal--auto');
    const paint = () => {
      m.body.innerHTML = '<div class="modal__eyebrow">Automações</div><h2 class="modal__title serif">Regras <em>quando… então…</em></h2>' +
        '<p class="qb-muted" style="margin:6px 0 16px">As regras rodam neste aparelho quando você move cartões ou abre o quadro.</p>' +
        '<div class="qb-autolist">' + (b.automations.length ? b.automations.map((a) => autoRowHTML(b, a)).join('') : '<p class="qb-muted">Nenhuma regra ainda.</p>') + '</div>' +
        '<button class="qb-pop__add" type="button" data-newauto>' + ic('plus', 14) + 'Nova regra</button>';
      m.body.querySelector('[data-newauto]').addEventListener('click', () => { b.automations.push(newAutomation(b)); save(); paint(); });
      m.body.querySelectorAll('[data-autotoggle]').forEach((x) => x.addEventListener('click', () => { const a = b.automations.find((z) => z.id === x.dataset.autotoggle); a.enabled = !a.enabled; save(); paint(); }));
      m.body.querySelectorAll('[data-autodel]').forEach((x) => x.addEventListener('click', () => { b.automations = b.automations.filter((z) => z.id !== x.dataset.autodel); save(); paint(); }));
      m.body.querySelectorAll('[data-autofield]').forEach((sel) => sel.addEventListener('change', () => { const a = b.automations.find((z) => z.id === sel.dataset.auto); const path = sel.dataset.autofield; setAutoField(a, path, sel.value); save(); paint(); }));
    };
    m.onClose = () => { save(); renderBoard(); };
    paint(); m.show();
  }
  function newAutomation(b) { return { id: uid('au'), enabled: true, trigger: { type: 'moveTo', colId: (b.columns[b.columns.length - 1] || {}).id }, action: { type: 'notify', memberId: S.prefs.currentUserId } }; }
  function setAutoField(a, path, val) {
    if (path === 'trigger.type') { a.trigger = { type: val }; if (val === 'moveTo') a.trigger.colId = (curBoard().columns[0] || {}).id; if (val === 'stale') a.trigger.days = 3; }
    else if (path === 'trigger.colId') a.trigger.colId = val;
    else if (path === 'trigger.days') a.trigger.days = parseInt(val, 10) || 3;
    else if (path === 'action.type') { a.action = { type: val }; if (val === 'notify') a.action.memberId = S.prefs.currentUserId; if (val === 'assign') a.action.memberId = S.prefs.currentUserId; if (val === 'priority') a.action.priorityId = (curBoard().priorities[0] || {}).id; if (val === 'checklist') a.action.text = 'Dar retorno ao cliente'; if (val === 'crmStatus') a.action.status = 'Em conversa'; }
    else if (path === 'action.memberId') a.action.memberId = val;
    else if (path === 'action.priorityId') a.action.priorityId = val;
    else if (path === 'action.text') a.action.text = val;
    else if (path === 'action.status') a.action.status = val;
  }
  function autoRowHTML(b, a) {
    const cols = b.columns.filter((c) => !c.archived);
    const memberOpts = (sel) => S.members.map((m) => '<option value="' + m.id + '"' + (sel === m.id ? ' selected' : '') + '>' + esc(m.name) + '</option>').join('');
    const colOpts = (sel) => cols.map((c) => '<option value="' + c.id + '"' + (sel === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('');
    const prioOpts = (sel) => b.priorities.map((p) => '<option value="' + p.id + '"' + (sel === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('');
    const S4 = (path, val, opts) => '<select class="select qb-mini-sel" data-auto="' + a.id + '" data-autofield="' + path + '">' + opts + '</select>';
    const statuses = (F.STATUSES || ['A contatar', 'Contatado', 'Em conversa', 'Reunião marcada', 'Ganho', 'Perdido']);
    let trg = S4('trigger.type', a.trigger.type, '<option value="moveTo"' + (a.trigger.type === 'moveTo' ? ' selected' : '') + '>mover para a coluna</option><option value="stale"' + (a.trigger.type === 'stale' ? ' selected' : '') + '>parar por X dias</option>');
    if (a.trigger.type === 'moveTo') trg += ' ' + S4('trigger.colId', a.trigger.colId, colOpts(a.trigger.colId));
    else trg += ' <input type="number" class="qb-auto-days" min="1" max="60" value="' + (a.trigger.days || 3) + '" data-auto="' + a.id + '" data-autofield="trigger.days"> dias';
    let act = S4('action.type', a.action.type,
      '<option value="notify"' + (a.action.type === 'notify' ? ' selected' : '') + '>notificar alguém</option>' +
      '<option value="assign"' + (a.action.type === 'assign' ? ' selected' : '') + '>atribuir responsável</option>' +
      '<option value="priority"' + (a.action.type === 'priority' ? ' selected' : '') + '>definir prioridade</option>' +
      '<option value="checklist"' + (a.action.type === 'checklist' ? ' selected' : '') + '>criar tarefa (checklist)</option>' +
      '<option value="crmStatus"' + (a.action.type === 'crmStatus' ? ' selected' : '') + '>atualizar etapa no CRM</option>');
    if (a.action.type === 'notify' || a.action.type === 'assign') act += ' ' + S4('action.memberId', a.action.memberId, memberOpts(a.action.memberId));
    else if (a.action.type === 'priority') act += ' ' + S4('action.priorityId', a.action.priorityId, prioOpts(a.action.priorityId));
    else if (a.action.type === 'checklist') act += ' <input type="text" class="qb-auto-text" value="' + esc(a.action.text || '') + '" data-auto="' + a.id + '" data-autofield="action.text" placeholder="texto da tarefa">';
    else if (a.action.type === 'crmStatus') act += ' ' + S4('action.status', a.action.status, statuses.map((s) => '<option value="' + esc(s) + '"' + (a.action.status === s ? ' selected' : '') + '>' + esc(s) + '</option>').join(''));
    return '<div class="qb-auto' + (a.enabled ? '' : ' is-off') + '">' +
      '<button class="qb-auto__sw' + (a.enabled ? ' is-on' : '') + '" type="button" data-autotoggle="' + a.id + '" aria-label="Ativar/desativar">' + ic(a.enabled ? 'check' : 'close', 13) + '</button>' +
      '<div class="qb-auto__body"><span class="qb-auto__kw">Quando</span> ' + trg + ' <span class="qb-auto__kw">então</span> ' + act + '</div>' +
      '<button class="qb-x" type="button" data-autodel="' + a.id + '" aria-label="Remover regra">' + ic('trash', 15) + '</button>' +
    '</div>';
  }
  // motor das automações
  function runAutomations(b, card, event, ctx) {
    (b.automations || []).forEach((a) => {
      if (!a.enabled) return;
      let fire = false;
      if (a.trigger.type === 'moveTo' && event === 'move' && ctx.toCol === a.trigger.colId) fire = true;
      if (!fire) return;
      applyAction(b, card, a);
    });
  }
  function runStaleAutomations(b) {
    let changed = false;
    (b.automations || []).forEach((a) => {
      if (!a.enabled || a.trigger.type !== 'stale') return;
      const limit = (a.trigger.days || 3) * DAY;
      b.cards.filter((c) => !c.archived).forEach((c) => {
        if (now() - (c.movedAt || c.createdAt) >= limit) {
          const mark = 'stale:' + a.id;
          c._fired = c._fired || {};
          const lastMove = c.movedAt || c.createdAt;
          if (c._fired[mark] === lastMove) return;
          c._fired[mark] = lastMove; applyAction(b, c, a); changed = true;
        }
      });
    });
    if (changed) save();
  }
  function applyAction(b, card, a) {
    const act = a.action;
    if (act.type === 'notify') { const m = S.members.find((x) => x.id === act.memberId); notify({ text: 'Automação: “' + card.title + '” — avisar ' + (m ? m.name : 'alguém'), icon: 'bolt', boardId: b.id, cardId: card.id }); }
    else if (act.type === 'assign') { if (act.memberId && !card.members.includes(act.memberId)) { card.members.push(act.memberId); logActivity(card, 'automação atribuiu responsável'); notify({ text: 'Automação atribuiu “' + card.title + '”', icon: 'user', boardId: b.id, cardId: card.id }); } }
    else if (act.type === 'priority') { card.priority = act.priorityId; logActivity(card, 'automação definiu prioridade'); }
    else if (act.type === 'checklist') { let cl = card.checklists.find((x) => x.title === 'Automação'); if (!cl) { cl = { id: uid('cl'), title: 'Automação', items: [] }; card.checklists.push(cl); } cl.items.push({ id: uid('ci'), text: act.text || 'Tarefa', done: false }); logActivity(card, 'automação criou uma tarefa'); }
    else if (act.type === 'crmStatus') { if (card.crm && F.setStatus) { try { F.setStatus(card.crm.empresa, act.status); } catch (e) {} logActivity(card, 'automação atualizou o CRM: ' + act.status); } }
    touchCard(card); save();
  }

  /* ============================================================
     MODAL genérico (reaproveita estilos .modal do painel)
     ============================================================ */
  function genericModal(extraClass) {
    const m = el('div', 'modal qb-modal ' + (extraClass || '')); m.hidden = true;
    m.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__card qb-gen__card" role="dialog" aria-modal="true"><button class="modal__x qb-gen__x" type="button" data-close aria-label="Fechar">' + ic('close', 18) + '</button><div class="modal__body qb-gen__body"></div></div>';
    document.body.appendChild(m);
    const api = {
      body: m.querySelector('.qb-gen__body'), el: m, onClose: null,
      show() { m.hidden = false; try { document.body.style.overflow = 'hidden'; } catch (e) {} _lastFocus = document.activeElement; setTimeout(() => { const f = m.querySelector('input,select,button:not([data-close]),textarea'); if (f) f.focus(); }, 30); },
      close() { if (api.onClose) api.onClose(); m.hidden = true; try { document.body.style.overflow = ''; } catch (e) {} m.remove(); try { if (_lastFocus && _lastFocus.focus) _lastFocus.focus(); } catch (e) {} },
    };
    m.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', api.close));
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); api.close(); } });
    return api;
  }

  /* ============================================================
     ATALHOS DE TECLADO
     ============================================================ */
  function openShortcuts() {
    const m = genericModal();
    const rows = [['N', 'Novo cartão na primeira coluna'], ['B', 'Voltar aos quadros'], ['F ou /', 'Focar na busca'], ['1–5', 'Trocar de visão'], ['← →', 'Mover o cartão em foco entre colunas'], ['Esc', 'Fechar cartão, menu ou janela'], ['Enter', 'Abrir o cartão em foco'], ['⌘/Ctrl + Enter', 'Enviar comentário']];
    m.body.innerHTML = '<div class="modal__eyebrow">Ajuda</div><h2 class="modal__title serif">Atalhos de <em>teclado</em></h2><div class="qb-keys">' + rows.map((r) => '<div class="qb-keys__row"><kbd>' + r[0] + '</kbd><span>' + r[1] + '</span></div>').join('') + '</div>';
    m.show();
  }
  function onKeydown(e) {
    const active = document.querySelector('#view-quadros.is-active'); if (!active) return;
    if (modalEl && !modalEl.hidden) return;
    if (document.querySelector('.qb-modal:not([hidden])')) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const b = curBoard();
    if (e.key === 'b' || e.key === 'B') { if (screen === 'board') { e.preventDefault(); backHome(); } }
    else if ((e.key === 'f' || e.key === 'F' || e.key === '/') && screen === 'board') { e.preventDefault(); const s = root.querySelector('#qbSearch'); if (s) s.focus(); }
    else if ((e.key === 'n' || e.key === 'N') && screen === 'board' && b && canEdit()) { e.preventDefault(); const firstCol = b.columns.find((c) => !c.archived); if (firstCol) { const qb = root.querySelector('[data-quickadd="' + firstCol.id + '"]'); if (qb) quickAdd(b, firstCol.id, qb); } }
    else if (screen === 'board' && b && e.key >= '1' && e.key <= '5') { const v = VIEWS[+e.key - 1]; if (v) { e.preventDefault(); boardUI(b).view = v.id; S.prefs.viewByBoard[b.id] = v.id; save(); renderBoard(); } }
    else if ((e.key === 'n' || e.key === 'N') && screen === 'home' && canEdit()) { e.preventDefault(); openNewBoard(); }
  }

  /* ============================================================
     NOTIFICAÇÕES DE PRAZO + badge do menu
     ============================================================ */
  function scanDueSoon() {
    const meId = S.prefs.currentUserId;
    S.boards.filter((b) => !b.archived).forEach((b) => {
      b.cards.filter((c) => !c.archived && c.due && c.members.includes(meId)).forEach((c) => {
        const d = daysUntil(c.due);
        const rem = c.reminderDays || 1;
        if (d <= rem && d >= -30) {
          const key = 'due:' + c.id + ':' + toInputDate(c.due);
          if (!S.notifications.some((n) => n.key === key)) {
            notify({ key: key, text: (d < 0 ? 'Prazo vencido: ' : d === 0 ? 'Vence hoje: ' : 'Prazo chegando: ') + '“' + c.title + '”', icon: 'clock', boardId: b.id, cardId: c.id });
          }
        }
      });
    });
  }
  function updateNavBadge() {
    const unread = S.notifications.filter((n) => !n.read).length;
    document.querySelectorAll('[data-badge="quadros"]').forEach((b) => { b.textContent = unread; b.setAttribute('data-zero', unread ? '0' : '1'); });
  }

  /* ============================================================
     INIT
     ============================================================ */
  let inited = false;
  function init() {
    if (inited) { render(); return; }
    inited = true;
    load();
    S.boards.forEach((b) => { try { runStaleAutomations(b); } catch (e) {} });
    try { scanDueSoon(); } catch (e) {}
    // retoma último quadro aberto, se houver
    if (S.prefs.lastBoardId && S.boards.some((b) => b.id === S.prefs.lastBoardId && !b.archived)) { curBoardId = S.prefs.lastBoardId; screen = 'board'; }
    else screen = 'home';
    render();
    document.addEventListener('keydown', onKeydown, true);
  }

  window.Boards = { init: init, render: render };
  // caso o app já tenha dado boot antes deste script carregar (sessão restaurada)
  try { if (F.isBooted && F.isBooted()) init(); } catch (e) {}
})();
