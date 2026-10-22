/* ============================================================
   FOVA · CRM — app logic (Hoje · Quadro · Leads · Decisores)
   Campos = só o que a planilha do Lead Hunter entrega.
   (sem score/tier/confiança — o "acesso ao dono" é deduzido)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- SVG icons (stroke, 24 grid) ---------- */
  const P = {
    hoje: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9.5h14V10"/><path d="M9.5 19.5V14h5v5.5"/>',
    quadro: '<rect x="3" y="4" width="5" height="16" rx="1.4"/><rect x="10" y="4" width="5" height="10" rx="1.4"/><rect x="17" y="4" width="4" height="13" rx="1.4"/>',
    leads: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    decisores: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 8.2a3 3 0 0 1 0 5.6M18 20a5 5 0 0 0-3-4.6"/>',
    quadros: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16M15 4v16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    star: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z"/>',
    calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 3v3M16 3v3"/>',
    trophy: '<path d="M7 4h10v3a5 5 0 0 1-10 0z"/><path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3M9 14h6M10 14v3h4v-3M8 20h8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="M7 10v7M7 7.2v.01M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7"/>',
    whatsapp: '<path d="M3 21l1.6-5.1A8.5 8.5 0 1 1 8.1 19.4z"/><path d="M9 8.6c-.3 0-.6.1-.8.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.5 3.9 2.2.8 2.7.6 3.2.5.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.3-.2-.6-.3"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 2.5 14.7 0 17M12 3.5c-2.5 2.3-2.5 14.7 0 17"/>',
    phone: '<path d="M6 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.7 2 2 0 0 1 6 3.5z"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>',
    upload: '<path d="M12 15V4M8 8l4-4 4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>',
    chevL: '<path d="M15 6l-6 6 6 6"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6"/>',
    download: '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
    crown: '<path d="M4 18h16M5 18l-1.5-9 4.5 3.5L12 5l4 7.5L20.5 9 19 18"/>',
    building: '<path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2"/>',
    source: '<path d="M10 13a4 4 0 0 0 5.7 0l2.5-2.5a4 4 0 0 0-5.7-5.7L11 6"/><path d="M14 11a4 4 0 0 0-5.7 0L5.8 13.5a4 4 0 0 0 5.7 5.7L13 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h3.6L18 9.6 14.4 6 4 16.4z"/><path d="M13 7l4 4"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  function icon(name, w) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (w ? ' width="' + w + '" height="' + w + '"' : '') + '>' + (P[name] || '') + '</svg>'; }
  const DOTS_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>';

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const NF = new Intl.NumberFormat('pt-BR');
  const digits = (s) => String(s || '').replace(/\D/g, '');
  // "N", "-", "x", "não encontrado" etc. = placeholder vazio (não é dado de verdade)
  const isReal = (v) => {
    if (v == null) return false;
    const s = String(v).trim();
    if (!s) return false;
    return !/^(n|na|nd|n\/a|n\/d|x|0|-|—|–|\.|\?|sem|s\/|nao|não|nenhum|nenhuma|nao tem|não tem|nao encontrado|não encontrado|nao pesquisado|não pesquisado|nao informado|não informado|a confirmar)$/i.test(s);
  };

  function waLink(num) { if (!isReal(num)) return null; let d = digits(num); if (!d || d.length < 8) return null; if (d.length <= 11) d = '55' + d; return 'https://wa.me/' + d; }
  function igLink(h) { if (!isReal(h)) return null; let s = String(h).trim(); const u = s.match(/instagram\.com\/([^/?#\s]+)/i); if (u) s = u[1]; s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/^@/, '').split(/[/?#\s]/)[0]; const m = s.match(/^[A-Za-z0-9._]+/); if (!m) return null; const user = m[0].replace(/\.+$/, ''); if (!user || !isReal(user)) return null; return 'https://instagram.com/' + user; }
  function liLink(s) { if (!isReal(s)) return null; const m = String(s).match(/linkedin\.com\/[A-Za-z0-9/_-]+/i); return m ? 'https://' + m[0] : null; }
  function liIsPersonal(s) { return /linkedin\.com\/in\//i.test(String(s || '')); }   // /in/ = perfil da pessoa; /company/ = página da empresa
  function liIsCompany(s) { return /linkedin\.com\/(company|school|showcase)\//i.test(String(s || '')); }
  function siteLink(s) { if (!isReal(s) || !/\./.test(s)) return null; return /^https?:/.test(s) ? s : 'https://' + s; }
  function prettyDomain(s) { try { const u = String(s || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0]; return u || String(s || ''); } catch (e) { return String(s || ''); } }
  function extractPhone(s) { const m = String(s || '').match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/); return m ? m[0] : (digits(s).length >= 10 ? digits(s) : ''); }
  // busca por texto (empresa/dono/@/LinkedIn/e-mail) OU por telefone (só dígitos, tolerante a (), -, espaço)
  function matchQuery(q, textParts, phoneParts) {
    q = (q || '').toString().trim().toLowerCase();
    if (!q) return true;
    const text = textParts.filter(Boolean).join(' ').toLowerCase();
    if (text.indexOf(q) >= 0) return true;
    const qd = digits(q);
    if (qd.length >= 4) {
      const phones = (phoneParts || []).filter(Boolean).map((p) => digits(p)).filter((p) => p.length >= 4);
      if (phones.some((p) => p.indexOf(qd) >= 0)) return true;
    }
    return false;
  }

  /* ---------- status efetivo (etapa do funil — workflow do João, não vem da planilha) ---------- */
  const LS_KEY = 'fova_crm_status_v1';
  const LS_TOUCH = 'fova_crm_touch_v1';
  const LS_DELETED = 'fova_crm_deleted_v1';
  const LS_ARCHIVED = 'fova_crm_archived_v1';
  const LS_RENAMED = 'fova_crm_renamed_v1';            // nomes antigos (da base) escondidos por renomeação — não contam como "apagados"
  const FOLLOWUP_DAYS = 3;                              // depois de abordar, cobra em 3 dias
  const FOLLOWUP_MS = FOLLOWUP_DAYS * 86400000;
  let overrides = {}, touch = {}, deleted = {}, archived = {}, renamed = {};
  try { overrides = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { overrides = {}; }
  try { touch = JSON.parse(localStorage.getItem(LS_TOUCH) || '{}'); } catch (e) { touch = {}; }
  try { deleted = JSON.parse(localStorage.getItem(LS_DELETED) || '{}'); } catch (e) { deleted = {}; }
  try { archived = JSON.parse(localStorage.getItem(LS_ARCHIVED) || '{}'); } catch (e) { archived = {}; }
  try { renamed = JSON.parse(localStorage.getItem(LS_RENAMED) || '{}'); } catch (e) { renamed = {}; }
  function saveOverrides() { try { localStorage.setItem(LS_KEY, JSON.stringify(overrides)); } catch (e) {} }
  function saveTouch() { try { localStorage.setItem(LS_TOUCH, JSON.stringify(touch)); } catch (e) {} }
  function saveDeleted() { try { localStorage.setItem(LS_DELETED, JSON.stringify(deleted)); } catch (e) {} }
  function saveArchived() { try { localStorage.setItem(LS_ARCHIVED, JSON.stringify(archived)); } catch (e) {} }
  function saveRenamed() { try { localStorage.setItem(LS_RENAMED, JSON.stringify(renamed)); } catch (e) {} }
  const STATUSES = ['A contatar', 'Contatado', 'Em conversa', 'Reunião marcada', 'Ganho', 'Perdido', 'Não contatar'];
  function statusOf(lead) { return overrides[lead.empresa] || lead.etapa || 'A contatar'; }
  function waitingDays(lead) { const t = touch[lead.empresa]; if (!t) return null; return Math.floor((Date.now() - t) / 86400000); }
  function fmtDate(ms) { try { const d = new Date(ms); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); } catch (e) { return ''; } }
  // "Abordado" há FOLLOWUP_DAYS dias sem resposta → vira follow-up sozinho
  function isOverdue(lead) {
    if (statusOf(lead) !== 'Contatado') return false;
    const t = touch[lead.empresa];
    if (!t) return false;                              // sem data ainda → não está atrasado (o relógio começa quando vira Contatado)
    return (Date.now() - t) >= FOLLOWUP_MS;
  }
  const ACTION = {
    'A contatar': { key: 'send', label: 'Contatar agora', cls: 'b-send' },
    'Contatado': { key: 'wait', label: 'Aguardando retorno', cls: 'b-wait' },
    'Em conversa': { key: 'talk', label: 'Em conversa', cls: 'b-talk' },
    'Reunião marcada': { key: 'meet', label: 'Reunião marcada', cls: 'b-meet' },
    'Ganho': { key: 'done', label: 'Ganho', cls: 'b-done' },
    'Perdido': { key: 'done', label: 'Perdido', cls: 'b-done' },
    'Não contatar': { key: 'done', label: 'Não contatar', cls: 'b-done' },
  };
  const ACT_FOLLOWUP = { key: 'followup', label: 'Fazer follow-up', cls: 'b-followup' };
  function actionOf(lead) { return isOverdue(lead) ? ACT_FOLLOWUP : (ACTION[statusOf(lead)] || ACTION['A contatar']); }
  function isTodo(lead) { const k = actionOf(lead).key; return k === 'send' || k === 'followup'; }

  /* ---------- segmento / bairro ---------- */
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
    return s ? (s.charAt(0).toUpperCase() + s.slice(1)) : 'Outros';
  }
  function bairro(c) { const m = (c || '').split('/'); return m.length > 1 ? m.slice(1).join('/').trim() : (c || ''); }

  /* ============================================================
     UNLOCK / GATE   (preservado — não mexer sem necessidade)
     ============================================================ */
  let BASELINE = null;
  let DATA = null;
  let _decIndex = null;
  const lock = $('#lock'), app = $('#app');

  async function tryUnlock(pw) {
    if (window.CRM_ENC) {
      try { BASELINE = await decryptData(window.CRM_ENC, pw); rebuildData(); return true; } catch (e) { return false; }
    }
    if (window.CRM) {
      if (pw === (window.CRM_PASS || 'fova2026')) { BASELINE = window.CRM; rebuildData(); return true; }
      return false;
    }
    return false;
  }

  const LS_IMPORT = 'fova_crm_import_v1';
  function loadImports() { try { return JSON.parse(localStorage.getItem(LS_IMPORT) || 'null'); } catch (e) { return null; } }
  function saveImports(o) { try { localStorage.setItem(LS_IMPORT, JSON.stringify(o)); } catch (e) {} }
  function normKey(s) { return (s || '').toString().toLowerCase().trim(); }
  function upsertBy(base, extra, key) {
    const m = new Map(base.map((x) => [normKey(x[key]), x]));
    extra.forEach((x) => { const k = normKey(x[key]); m.set(k, Object.assign({}, m.get(k) || {}, x)); });
    return Array.from(m.values());
  }
  function rebuildData() {
    if (!BASELINE) { DATA = null; return; }
    const imp = loadImports() || {};
    let leads = (imp.leads && imp.leads.length) ? upsertBy(BASELINE.leads, imp.leads, 'empresa') : BASELINE.leads.slice();
    let decs = (imp.decisores && imp.decisores.length) ? upsertBy(BASELINE.decisores, imp.decisores, 'empresa') : BASELINE.decisores.slice();
    const hidden = (k) => deleted[k] || archived[k] || renamed[k];   // apagados, arquivados E renomeados somem da lista e do quadro
    leads = leads.filter((l) => !hidden(normKey(l.empresa)));
    decs = decs.filter((d) => !hidden(normKey(d.empresa)));
    DATA = { leads: leads, decisores: decs, config: BASELINE.config, comoUsar: BASELINE.comoUsar, painel: BASELINE.painel };
    backfillTouch();
    _decIndex = null;
  }
  function deletedCount() { return Object.keys(deleted).length; }
  function rerenderAll() { renderHoje(); renderQuadro(); renderLeads(); renderDecisores(); updateBadges(); }
  function deleteLead(emp) {
    deleted[normKey(emp)] = 1; saveDeleted(); rebuildData(); rerenderAll();
    toastUndo('Contato apagado.', function () { delete deleted[normKey(emp)]; saveDeleted(); rebuildData(); rerenderAll(); });
  }
  function restoreDeleted() {
    if (!window.confirm('Trazer de volta todos os contatos apagados?')) return;
    deleted = {}; saveDeleted(); rebuildData(); rerenderAll();
    toast('Contatos apagados restaurados.', 'ok');
  }
  /* ---------- arquivo (leads velhos: saem da lista mas ficam guardados pra exportar) ---------- */
  function archivedCount() { return Object.keys(archived).length; }
  function archiveLeads(emps, opts) {
    opts = opts || {};
    const keys = [];
    (emps || []).forEach((emp) => {
      const lead = DATA.leads.find((l) => l.empresa === emp); if (!lead) return;
      const dec = decisorFor(emp);
      const k = normKey(emp);
      archived[k] = { lead: Object.assign({}, lead, { etapa: statusOf(lead) }), dec: dec ? Object.assign({}, dec) : null };
      keys.push(k);
    });
    if (!keys.length) return 0;
    saveArchived(); rebuildData(); rerenderAll();
    if (!opts.silent) {
      const n = keys.length;
      toastUndo(n + (n === 1 ? ' lead arquivado.' : ' leads arquivados.'), function () {
        keys.forEach((k) => delete archived[k]); saveArchived(); rebuildData(); rerenderAll();
      });
    }
    return keys.length;
  }
  function archiveAll() {
    if (!DATA || !DATA.leads.length) { toast('Não há leads pra arquivar.', 'bad'); return; }
    const n = DATA.leads.length;
    if (!window.confirm('Arquivar todos os ' + n + ' leads?\n\nEles saem da sua lista e do quadro, mas ficam guardados no arquivo — dá pra exportar em CSV quando quiser. Nada é apagado de verdade.')) return;
    archiveLeads(DATA.leads.map((l) => l.empresa), { silent: true });
    toast(n + ' leads arquivados. Use "arquivados" na barra pra exportar.', 'ok');
  }
  function restoreArchived() {
    if (!archivedCount()) return;
    if (!window.confirm('Trazer todos os leads arquivados de volta pra sua lista?')) return;
    archived = {}; saveArchived(); rebuildData(); rerenderAll();
    toast('Leads arquivados restaurados.', 'ok');
  }
  // "Contatado" sem data conhecida (veio "Contatado" da planilha, ou o navegador perdeu o registro):
  // não dá pra saber QUANDO foi contatado, então já entra como follow-up devido — em vez de reiniciar
  // a contagem de 3 dias a cada carregamento (o que fazia o lead nunca chegar na coluna Follow-up).
  function backfillTouch() {
    if (!DATA) return;
    let changed = false;
    DATA.leads.forEach((l) => { if (statusOf(l) === 'Contatado' && !touch[l.empresa]) { touch[l.empresa] = Date.now() - FOLLOWUP_MS; changed = true; } });
    if (changed) saveTouch();
  }
  function decisorFor(empresa) {
    if (!_decIndex) { _decIndex = {}; (DATA.decisores || []).forEach((d) => { _decIndex[normKey(d.empresa)] = d; }); }
    return _decIndex[normKey(empresa)] || null;
  }

  async function decryptData(enc, pw) {
    const dec = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const salt = dec(enc.salt), iv = dec(enc.iv), ct = dec(enc.ct);
    const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: enc.iter || 150000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(plain));
  }

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

  /* ---------- gancho de login/colaboração (sync.js) ----------
     Quando o Supabase está configurado (config.js), o login por sócio
     assume o controle: a senha única fica desligada e o boot acontece
     pela chamada FOVA_GATE.open() depois da autenticação. Sem Supabase,
     tudo abaixo funciona exatamente como antes. */
  window.FOVA_GATE = {
    enabled: function () { return !!(window.FOVA_CFG && window.FOVA_CFG.supabaseUrl && window.FOVA_CFG.supabaseAnonKey); },
    needsPassword: function () { return !!window.CRM_ENC; },
    unlock: function (pw) { return tryUnlock(pw); },
    open: function () { try { lock.hidden = true; app.hidden = false; } catch (e) {} boot(); },
  };

  $('#lockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (window.FOVA_GATE.enabled()) return;   // login por sócio cuida disso
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

  let _sessOk = false;
  try { _sessOk = sessionStorage.getItem('fova_adm_ok') === '1'; } catch (e) { _sessOk = false; }
  if (window.FOVA_GATE.enabled()) {
    // Supabase ligado: o sync.js mostra o login por sócio e chama FOVA_GATE.open().
    try { lock.hidden = true; } catch (e) {}
  } else if (_sessOk && !window.CRM_ENC && window.CRM) {
    BASELINE = window.CRM; rebuildData(); lock.hidden = true; app.hidden = false; document.addEventListener('DOMContentLoaded', boot);
    if (document.readyState !== 'loading') boot();
  } else {
    setTimeout(() => { try { $('#lockInput').focus(); } catch (e) {} }, 100);
  }

  window.__admReady = true;

  /* ============================================================
     ACESSO AO DONO (deduzido — substitui a antiga "confiança")
     ============================================================ */
  // a própria planilha às vezes marca "(a confirmar)", "provável", "possível"… = dono NÃO confirmado
  function uncertainName(s) {
    return /\(?\s*(a\s*confirmar|a\s*verificar|prov[aá]ve(l|is)|poss[ií]ve(l|is)|talvez|pode ser|presum[ií]ve(l|is)|suposto|estimad[oa]|n[aã]o\s*confirmad)/i.test(String(s || ''));
  }
  function donoStatus(l, dec) {
    dec = dec || decisorFor(l.empresa);
    const name = (dec && isReal(dec.decisor)) ? dec.decisor : (isReal(l.decisor) ? l.decisor : '');
    if (!name) return { level: 'nao', name: '', txt: 'Dono não confirmado — fale pelo canal da empresa.', cls: 'conf-Baixa', color: '#D88A6E', short: 'Dono não confirmado' };
    if (uncertainName(name)) return { level: 'id', name: name, txt: 'Dono ainda NÃO confirmado (a planilha marcou como provável). Confirme o perfil antes de mandar.', cls: 'conf-Média', color: '#E0B05A', short: 'Não confirmado' };
    const owner = splitContacts(l, dec).owner;
    const hasLiOrMail = owner.some((c) => c.ico === 'linkedin' || c.ico === 'mail');
    const hasOwnerIG = owner.some((c) => c.ico === 'instagram');
    const companyHasIG = isReal(l.instagram);   // se existe @ da empresa separado, o @ do dono é mesmo dele
    // verde só com canal claramente pessoal: LinkedIn/e-mail do dono, OU Instagram do dono COM @ da empresa à parte
    if (hasLiOrMail || (hasOwnerIG && companyHasIG)) return { level: 'direto', name: name, txt: 'Pode falar direto com o dono.', cls: 'conf-Alta', color: '#6FBF8B', short: 'Dono acessível' };
    if (hasOwnerIG) return { level: 'id', name: name, txt: 'O contato é um Instagram — confirme se é o perfil PESSOAL do dono, não o da loja.', cls: 'conf-Média', color: '#E0B05A', short: 'Confere o Instagram' };
    if (owner.length) return { level: 'id', name: name, txt: 'É um telefone marcado como do dono — confirme, às vezes é o número da empresa.', cls: 'conf-Média', color: '#E0B05A', short: 'Confere o número' };
    return { level: 'id', name: name, txt: 'Achei o nome do dono, mas só tenho o contato da empresa — pode cair na recepção.', cls: 'conf-Média', color: '#E0B05A', short: 'Só contato da empresa' };
  }
  function priorityRank(l) {
    const s = donoStatus(l);
    const base = s.level === 'direto' ? 3 : s.level === 'id' ? 2 : 1;
    return base * 2 + (isReal(l.gancho) ? 1 : 0);
  }

  /* ============================================================
     CANAIS / CONTATOS  (dono × empresa, sempre rotulados)
     ============================================================ */
  function ownerContacts(dec) {
    // só confio em "contato do dono" se o NOME do dono foi encontrado de verdade.
    // se a planilha tem o contato mas não achou o decisor, não trato como dele.
    if (!dec || !isReal(dec.decisor)) return [];
    const seen = new Set(), out = [];
    const add = (ico, label, href) => { if (href && !seen.has(href)) { seen.add(href); out.push({ ico, label, href }); } };
    add('whatsapp', 'WhatsApp do dono', waLink(extractPhone(dec.telWhatsapp)));
    add('instagram', 'Instagram do dono', igLink(dec.instagram));
    if (liIsPersonal(dec.linkedin)) add('linkedin', 'LinkedIn do dono', liLink(dec.linkedin));   // só perfil /in/ é da pessoa
    if (isReal(dec.emailPessoal)) add('mail', 'E-mail do dono', 'mailto:' + dec.emailPessoal.trim());
    return out;
  }
  function companyContacts(l, dec) {
    const seen = new Set(), out = [];
    const add = (ico, label, href) => { if (href && !seen.has(href)) { seen.add(href); out.push({ ico, label, href }); } };
    add('whatsapp', 'WhatsApp da empresa', waLink(l.whatsapp));
    add('instagram', 'Instagram da empresa', igLink(l.instagram));
    add('linkedin', 'LinkedIn da empresa', liLink(l.linkedinEmpresa));
    // "LinkedIn do dono" que na verdade é página /company/ → é da empresa, não some
    if (dec && liIsCompany(dec.linkedin)) add('linkedin', 'LinkedIn da empresa', liLink(dec.linkedin));
    add('globe', 'Site', siteLink(l.site));
    if (isReal(l.email)) add('mail', 'E-mail da empresa', 'mailto:' + l.email.trim());
    return out;
  }
  // separa contatos: "owner" = só os do dono que NÃO são os mesmos da empresa
  function splitContacts(l, dec) {
    const company = companyContacts(l, dec);
    const set = new Set(company.map((c) => c.href));
    const owner = ownerContacts(dec).filter((c) => !set.has(c.href));
    return { owner, company };
  }
  const CH_BASE = { whatsapp: 'Falar no WhatsApp', instagram: 'Mandar DM no Instagram', linkedin: 'Abrir o LinkedIn', mail: 'Mandar e-mail', globe: 'Abrir o site' };
  function chLabel(ico, isOwner) { const base = CH_BASE[ico] || 'Falar'; return ico === 'globe' ? base : base + (isOwner ? ' do dono' : ' da empresa'); }
  function bestChannel(l, dec) {
    dec = dec || decisorFor(l.empresa);
    const canal = (l.canal || '').toLowerCase();
    let pref = null;
    if (/insta/.test(canal)) pref = 'instagram';
    else if (/whats/.test(canal)) pref = 'whatsapp';
    else if (/linkedin/.test(canal)) pref = 'linkedin';
    else if (/mail/.test(canal)) pref = 'mail';
    const { owner, company } = splitContacts(l, dec);
    const ownerStrong = owner.filter((c) => c.ico !== 'whatsapp');   // canais claramente pessoais
    const ownerPhone = owner.filter((c) => c.ico === 'whatsapp');
    const mk = (c, isOwner) => ({ ico: c.ico, href: c.href, isOwner: isOwner, label: chLabel(c.ico, isOwner) });
    // 1) canal pessoal do dono (no canal preferido, senão qualquer pessoal); 2) telefone do dono; 3) empresa
    if (pref && pref !== 'whatsapp') { const h = ownerStrong.find((c) => c.ico === pref); if (h) return mk(h, true); }
    if (ownerStrong[0]) return mk(ownerStrong[0], true);
    if (ownerPhone[0]) return mk(ownerPhone[0], true);
    if (pref) { const h = company.find((c) => c.ico === pref); if (h) return mk(h, false); }
    if (company[0]) return mk(company[0], false);
    return null;
  }
  function channelIcon(c) { c = (c || '').toLowerCase(); return /insta/.test(c) ? icon('instagram') : /whats/.test(c) ? icon('whatsapp') : /linkedin/.test(c) ? icon('linkedin') : /mail/.test(c) ? icon('mail') : icon('chat'); }
  function canalNome(c) { c = (c || '').toLowerCase(); if (/insta/.test(c)) return 'Instagram'; if (/whats/.test(c)) return 'WhatsApp'; if (/linkedin/.test(c)) return 'LinkedIn'; if (/mail/.test(c)) return 'E-mail'; return c ? (c.charAt(0).toUpperCase() + c.slice(1)) : '—'; }

  /* ============================================================
     NAV / ROUTING
     ============================================================ */
  const VIEWS = [
    { id: 'hoje', label: 'Hoje', ico: 'hoje' },
    { id: 'quadro', label: 'Funil', ico: 'quadro' },
    { id: 'leads', label: 'Leads', ico: 'leads', badge: true },
    { id: 'decisores', label: 'Decisores', ico: 'decisores' },
    { id: 'quadros', label: 'Quadros', ico: 'quadros', badge: 'quadros' },
  ];
  let booted = false;
  function boot() {
    if (booted) return; booted = true;
    buildNav(); initSidebarToggle(); renderHoje(); renderQuadro(); renderLeads(); renderDecisores();
    try { if (window.Boards && window.Boards.init) window.Boards.init(); } catch (e) {}
    const initial = (location.hash || '').replace('#', '');
    go(VIEWS.some((v) => v.id === initial) ? initial : 'hoje');
  }
  function buildNav() {
    [['#nav'], ['#navMobile']].forEach(([sel]) => {
      const nav = $(sel); nav.innerHTML = '';
      VIEWS.forEach((v) => {
        const b = el('button', 'nav__item');
        b.type = 'button'; b.dataset.go = v.id; b.title = v.label;   // title → tooltip quando a barra está fechada (só ícones)
        b.innerHTML = icon(v.ico) + '<span class="lbl">' + v.label + '</span>' + (v.badge ? '<span class="nav__badge" data-badge="' + (v.badge === true ? 'leads' : v.badge) + '"></span>' : '');
        b.addEventListener('click', () => go(v.id));
        nav.appendChild(b);
      });
    });
  }
  /* ---------- fechar / abrir a barra lateral (lembra a escolha neste aparelho) ---------- */
  function initSidebarToggle() {
    const app = $('#app'), btn = $('#sbToggle');
    if (!app || !btn) return;
    const KEY = 'fova_sb_collapsed';
    const apply = (on) => {
      app.classList.toggle('sb-collapsed', on);
      btn.setAttribute('aria-expanded', on ? 'false' : 'true');
      btn.setAttribute('aria-label', on ? 'Abrir barra lateral' : 'Fechar barra lateral');
      btn.setAttribute('title', on ? 'Abrir barra lateral' : 'Fechar barra lateral');
    };
    let saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (saved) {   // aplica o estado salvo sem animar na abertura da página
      app.style.transition = 'none'; apply(true);
      requestAnimationFrame(() => requestAnimationFrame(() => { app.style.transition = ''; }));
    } else { apply(false); }
    btn.addEventListener('click', () => {
      const on = !app.classList.contains('sb-collapsed');
      apply(on);
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    });
  }

  function go(id) {
    document.querySelectorAll('.view').forEach((s) => s.classList.toggle('is-active', s.dataset.view === id));
    document.querySelectorAll('.nav__item').forEach((n) => n.classList.toggle('is-active', n.dataset.go === id));
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    window.scrollTo(0, 0);
  }

  function metrics() {
    const L = DATA.leads;
    const primeiros = L.filter((l) => actionOf(l).key === 'send').length;
    const followups = L.filter((l) => actionOf(l).key === 'followup').length;
    const donos = L.filter((l) => donoStatus(l).level !== 'nao').length;
    const emConversa = L.filter((l) => statusOf(l) === 'Em conversa').length;
    const reunioes = L.filter((l) => ['Reunião marcada', 'Ganho'].includes(statusOf(l))).length;
    return { total: L.length, primeiros, followups, fazerHoje: primeiros + followups, donos, emConversa, reunioes };
  }
  function counts(arr, fn) { const m = new Map(); arr.forEach((x) => { const k = fn(x); m.set(k, (m.get(k) || 0) + 1); }); return m; }

  /* ============================================================
     HOJE
     ============================================================ */
  function renderHoje() {
    const m = metrics();

    const hojeN = m.fazerHoje;
    const partes = [];
    if (m.primeiros) partes.push(m.primeiros + (m.primeiros === 1 ? ' primeiro contato' : ' primeiros contatos'));
    if (m.followups) partes.push(m.followups + ' follow-up' + (m.followups === 1 ? '' : 's'));
    $('#heroMount').innerHTML =
      '<div class="hero">' +
        '<div class="hero__big tnum">' + NF.format(hojeN) + '</div>' +
        '<div class="hero__txt">' +
          '<div class="hero__live"><span class="live-dot"></span> Pra fazer hoje</div>' +
          '<div class="hero__line">' + (hojeN ? (hojeN === 1 ? 'tarefa <em>esperando</em> por você' : 'tarefas <em>esperando</em> por você') : 'tudo <em>em dia</em> por aqui') + '</div>' +
          '<div class="hero__hint">' + (hojeN ? (partes.join(' · ') + '. Abra a fila e resolva.') : 'Nenhum primeiro contato ou follow-up pendente.') + '</div>' +
          (hojeN ? '<button class="hero__cta" id="heroCta">Abrir a fila ' + icon('arrow') + '</button>' : '') +
        '</div>' +
      '</div>';
    const hc = $('#heroCta');
    if (hc) hc.addEventListener('click', () => { leadFilters.acao = true; syncToolbar(); paintLeads(); go('leads'); });

    const tiles = [
      { label: 'Total de leads', val: m.total, ico: 'leads' },
      { label: 'Donos identificados', val: m.donos, ico: 'crown', accent: true },
      { label: 'Em conversa', val: m.emConversa, ico: 'chat' },
      { label: 'Reuniões + ganhos', val: m.reunioes, ico: 'trophy' },
    ];
    $('#statsMount').innerHTML = tiles.map((t) =>
      '<div class="stat' + (t.accent ? ' stat--accent' : '') + '">' +
        '<div class="stat__label">' + icon(t.ico) + esc(t.label) + '</div>' +
        '<div class="stat__val tnum">' + NF.format(t.val) + '</div>' +
      '</div>'
    ).join('');

    const stages = [
      ['contatar', 'Contatar agora', '#CBA96E'], ['abordado', 'Abordado', '#6FA8D0'], ['followup', 'Follow-up', '#E0B05A'],
      ['conversa', 'Em conversa', '#6FB8A6'], ['reuniao', 'Reunião marcada', '#9B8FC9'], ['ganho', 'Ganho', '#6FBF8B'],
    ];
    const fmap = counts(DATA.leads, boardStage);
    const fmax = Math.max(1, ...stages.map((s) => fmap.get(s[0]) || 0));
    $('#funnelMount').innerHTML =
      '<div class="funnel">' +
        '<div class="sec-title" style="margin-bottom:14px">' + icon('bolt') + 'Funil — onde estão seus leads</div>' +
        '<div class="funnel__rows">' +
          stages.map((s) => {
            const n = fmap.get(s[0]) || 0;
            return '<div class="frow"><div class="frow__lbl">' + esc(s[1]) + '</div>' +
              '<div class="frow__track"><div class="frow__fill" style="width:' + Math.round(n / fmax * 100) + '%;background:' + s[2] + '"></div></div>' +
              '<div class="frow__n tnum">' + NF.format(n) + '</div></div>';
          }).join('') +
        '</div>' +
      '</div>';

    const best = DATA.leads.slice().sort((a, b) => (priorityRank(b) - priorityRank(a)) || a.empresa.localeCompare(b.empresa, 'pt-BR')).slice(0, 6);
    $('#bestTitle').innerHTML = icon('star') + 'Melhores clientes';
    $('#bestSub').textContent = 'O dono já está identificado — comece por eles.';
    $('#bestLink').addEventListener('click', () => { Object.assign(leadFilters, { q: '', seg: '', acao: false }); leadSort = 'prioridade'; syncToolbar(); paintLeads(); go('leads'); });

    $('#bestGrid').innerHTML = best.map((l, i) => {
      const dec = decisorFor(l.empresa);
      const s = donoStatus(l, dec);
      const primary = bestChannel(l, dec);
      return '<article class="best">' +
        '<div class="best__rank serif">' + (i + 1) + '</div>' +
        '<div class="best__seg">' + esc(segCat(l.segmento)) + '</div>' +
        '<div class="best__emp">' + esc(l.empresa) + '</div>' +
        '<div class="best__meta"><span class="conf ' + s.cls + '"><span class="dot"></span>' + esc(s.short) + '</span>' +
          '<span class="channel-tag">' + channelIcon(l.canal) + esc(canalNome(l.canal)) + '</span></div>' +
        '<div class="best__who">' + (s.name ? 'Decisor: <b>' + esc(s.name) + '</b>' : '<span style="color:var(--text-3)">Dono a confirmar</span>') + '</div>' +
        '<div class="best__gancho">' + (isReal(l.gancho) ? esc(l.gancho) : '<span style="color:var(--text-3)">Sem gancho registrado.</span>') + '</div>' +
        (primary
          ? '<a class="best__cta" href="' + esc(primary.href) + '" target="_blank" rel="noopener">' + icon(primary.ico) + esc(primary.label) + '</a>'
          : '<button class="best__cta best__cta--ghost" data-open="' + esc(l.empresa) + '">Ver detalhes</button>') +
      '</article>';
    }).join('');
    $('#bestGrid').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openLead(b.dataset.open)));

    updateBadges();
  }

  /* ============================================================
     QUADRO (Kanban)
     ============================================================ */
  const BCOLS = [
    { id: 'contatar', label: 'Contatar agora', color: '#CBA96E' },
    { id: 'abordado', label: 'Abordado', color: '#6FA8D0' },
    { id: 'followup', label: 'Follow-up', color: '#E0B05A' },
    { id: 'conversa', label: 'Em conversa', color: '#6FB8A6' },
    { id: 'reuniao', label: 'Reunião marcada', color: '#9B8FC9' },
    { id: 'ganho', label: 'Ganho', color: '#6FBF8B' },
    { id: 'perdido', label: 'Perdido', color: '#D88A6E' },
    { id: 'naocontatar', label: 'Não contatar', color: '#6E6A78' },
  ];
  const STAGE_STATUS = { contatar: 'A contatar', abordado: 'Contatado', followup: 'Contatado', conversa: 'Em conversa', reuniao: 'Reunião marcada', ganho: 'Ganho', perdido: 'Perdido', naocontatar: 'Não contatar' };
  const STATUS_STAGE = { 'A contatar': 'contatar', 'Em conversa': 'conversa', 'Reunião marcada': 'reuniao', 'Ganho': 'ganho', 'Perdido': 'perdido', 'Não contatar': 'naocontatar' };
  let _dragEmp = null;

  // a coluna do card: "Contatado" há muito tempo cai sozinho em Follow-up
  function boardStage(l) {
    const st = statusOf(l);
    if (st === 'Contatado') return isOverdue(l) ? 'followup' : 'abordado';
    return STATUS_STAGE[st] || 'contatar';
  }
  // mover pra uma coluna = setar a etapa (e cuidar do cronômetro do follow-up)
  function setStage(emp, stageId) {
    const st = STAGE_STATUS[stageId]; if (!st) return;
    if (st === 'A contatar') delete overrides[emp]; else overrides[emp] = st;
    if (st === 'Contatado') touch[emp] = (stageId === 'followup') ? (Date.now() - FOLLOWUP_MS - 86400000) : Date.now();
    else delete touch[emp];
    saveOverrides(); saveTouch();
    renderHoje(); renderQuadro(); paintLeads(); updateBadges();
  }

  function renderQuadro() {
    const mount = $('#kanbanMount'); if (!mount || !DATA) return;
    const groups = {}; BCOLS.forEach((c) => { groups[c.id] = []; });
    DATA.leads.forEach((l) => { const g2 = boardStage(l); (groups[g2] || (groups[g2] = [])).push(l); });
    Object.values(groups).forEach((arr) => arr.sort((a, b) => priorityRank(b) - priorityRank(a)));
    mount.innerHTML = '<div class="kanban-wrap"><div class="kanban">' +
      BCOLS.map((c) => {
        const arr = groups[c.id] || [];
        const isFu = c.id === 'followup';
        return '<section class="kcol' + (isFu ? ' kcol--fu' : '') + '" data-stage="' + c.id + '">' +
          '<div class="kcol__head"><span class="kcol__title"><span class="kcol__dot" style="background:' + c.color + '"></span>' + esc(c.label) + '</span><span class="kcol__count tnum">' + arr.length + '</span></div>' +
          '<div class="kcol__body" data-drop="' + c.id + '">' +
            (arr.length ? arr.map((l) => kcard(l, c)).join('') : '<div class="kempty">' + (isFu ? 'Nenhum follow-up pendente' : 'Arraste um cliente pra cá') + '</div>') +
          '</div></section>';
      }).join('') +
    '</div></div>';
    wireKanban(mount);
  }

  function kcard(l, col) {
    const idx = BCOLS.findIndex((c) => c.id === col.id);
    const dec = decisorFor(l.empresa);
    const s = donoStatus(l, dec);
    const primary = bestChannel(l, dec);
    const meta = [segCat(l.segmento), bairro(l.cidade)].filter(Boolean).join(' · ');
    const t = touch[l.empresa];
    const due = t ? t + FOLLOWUP_MS : 0;
    let wait = '';
    if (col.id === 'followup' && t) {
      const od = Math.max(0, Math.floor((Date.now() - due) / 86400000));
      wait = '<div class="kcard__wait"><span class="kwait kwait--due">' + icon('bolt') + 'follow-up desde ' + fmtDate(due) + (od > 0 ? ' · ' + od + (od === 1 ? ' dia atrasado' : ' dias atrasado') : '') + '</span></div>';
    } else if (col.id === 'abordado' && t) {
      wait = '<div class="kcard__wait"><span class="kwait">' + icon('calendar') + 'abordado ' + fmtDate(t) + ' · follow-up ' + fmtDate(due) + '</span></div>';
    }
    return '<article class="kcard" draggable="true" data-emp="' + esc(l.empresa) + '" style="border-left-color:' + col.color + '">' +
      '<div class="kcard__emp">' + esc(l.empresa) + '</div>' +
      (meta ? '<div class="kcard__meta">' + esc(meta) + '</div>' : '') +
      '<div class="kdono"><span class="dono-dot" style="background:' + s.color + '"></span>' + (s.name ? esc(s.name) : '<span style="color:var(--text-3)">Dono a confirmar</span>') + '</div>' +
      wait +
      (isReal(l.gancho) ? '<div class="kcard__gancho">' + esc(l.gancho) + '</div>' : '') +
      '<div class="kcard__foot">' +
        (primary ? '<a class="kcard__falar" href="' + esc(primary.href) + '" target="_blank" rel="noopener" data-stop="1">' + icon(primary.ico) + (primary.isOwner ? 'Falar c/ dono' : 'Falar c/ empresa') + '</a>' : '<span class="kcard__falar" style="color:var(--text-3);cursor:default">sem canal</span>') +
        '<span class="kmove">' +
          '<button type="button" data-move="prev" ' + (idx <= 0 ? 'disabled' : '') + ' aria-label="Etapa anterior" title="Etapa anterior">' + icon('chevL') + '</button>' +
          '<button type="button" data-move="next" ' + (idx >= BCOLS.length - 1 ? 'disabled' : '') + ' aria-label="Próxima etapa" title="Próxima etapa">' + icon('chevR') + '</button>' +
        '</span>' +
      '</div>' +
    '</article>';
  }

  function wireKanban(mount) {
    mount.querySelectorAll('.kcard').forEach((card) => {
      const emp = card.dataset.emp;
      card.addEventListener('dragstart', (e) => { _dragEmp = emp; card.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', emp); e.dataTransfer.effectAllowed = 'move'; } catch (_) {} });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); _dragEmp = null; mount.querySelectorAll('.kcol').forEach((c) => c.classList.remove('drop-on')); });
      card.addEventListener('click', (e) => { if (e.target.closest('[data-stop]') || e.target.closest('[data-move]')) return; openLead(emp); });
      card.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); moveCard(emp, b.dataset.move); }));
      card.querySelectorAll('[data-stop]').forEach((a) => a.addEventListener('click', (e) => e.stopPropagation()));
    });
    mount.querySelectorAll('.kcol').forEach((col) => {
      const stage = col.dataset.stage;
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drop-on'); try { e.dataTransfer.dropEffect = 'move'; } catch (_) {} });
      col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('drop-on'); });
      col.addEventListener('drop', (e) => { e.preventDefault(); col.classList.remove('drop-on'); const emp = _dragEmp || (e.dataTransfer && e.dataTransfer.getData('text/plain')); if (emp) setStage(emp, stage); });
    });
  }
  function moveCard(emp, dir) {
    const lead = DATA.leads.find((l) => l.empresa === emp); if (!lead) return;
    let idx = BCOLS.findIndex((c) => c.id === boardStage(lead)); if (idx < 0) idx = 0;
    const ni = dir === 'next' ? idx + 1 : idx - 1;
    if (ni < 0 || ni >= BCOLS.length) return;
    setStage(emp, BCOLS[ni].id);
  }

  /* ============================================================
     LEADS
     ============================================================ */
  const leadFilters = { q: '', seg: '', acao: false };
  let leadSort = 'prioridade';
  const openRows = new Set();
  let selectMode = false;
  const selected = new Set();

  function renderLeads() {
    const segs = [...new Set(DATA.leads.map((l) => segCat(l.segmento)))].sort();
    const tb = $('#leadsToolbar');
    const arch = archivedCount(), del = deletedCount(), hasImp = !!loadImports();
    const mItem = (act, ico, label, badge, danger) =>
      '<button class="menu__item' + (danger ? ' menu__item--danger' : '') + '" type="button" role="menuitem" data-act="' + act + '">' +
        icon(ico) + '<span>' + esc(label) + '</span>' + (badge ? '<span class="menu__badge tnum">' + badge + '</span>' : '') + '</button>';
    tb.innerHTML =
      '<div class="toolbar__filters">' +
        '<div class="search">' + icon('search') + '<input id="leadSearch" type="search" placeholder="Buscar empresa, dono, telefone, @…" aria-label="Buscar leads" /></div>' +
        sel('fSeg', 'Segmento', [['', 'Todos os segmentos']].concat(segs.map((s) => [s, s]))) +
        '<select class="select" id="fOrd" aria-label="Ordenar por">' +
          '<option value="prioridade">Ordenar: prioridade</option>' +
          '<option value="acao">Ordenar: ação de hoje</option>' +
          '<option value="empresa">Ordenar: A→Z</option>' +
        '</select>' +
        '<button class="chip" id="chipAcao" type="button" aria-pressed="false" title="Mostrar só quem precisa de contato ou follow-up hoje">' + icon('bolt') + 'Fila de hoje</button>' +
      '</div>' +
      '<div class="toolbar__actions">' +
        '<button class="chip' + (selectMode ? ' is-on' : '') + '" id="chipSelect" type="button" aria-pressed="' + selectMode + '" title="Selecionar vários leads de uma vez">' + icon('check') + (selectMode ? 'Sair da seleção' : 'Selecionar') + '</button>' +
        '<span class="toolbar__sep"></span>' +
        '<button class="btn-import" id="btnAddLead" type="button" title="Cadastrar uma empresa na mão">' + icon('plus') + 'Adicionar empresa</button>' +
        '<div class="menu-wrap">' +
          '<button class="btn-export menu-btn" id="btnMore" type="button" aria-haspopup="true" aria-expanded="false" title="Importar, exportar e arquivar">' + DOTS_SVG + 'Mais ações</button>' +
          '<div class="menu" id="leadsMenu" role="menu" aria-label="Mais ações" hidden>' +
            mItem('import', 'upload', 'Importar planilha') +
            mItem('export', 'download', 'Exportar planilha') +
            '<div class="menu__sep"></div>' +
            mItem('archiveAll', 'archive', 'Arquivar todos') +
            (arch ? mItem('exportArch', 'archive', 'Exportar arquivados', arch) : '') +
            (arch ? mItem('restoreArch', 'download', 'Restaurar arquivados') : '') +
            (hasImp ? mItem('restoreOrig', 'source', 'Restaurar dados originais') : '') +
            (del ? '<div class="menu__sep"></div>' + mItem('restoreDel', 'trash', 'Restaurar apagados', del, true) : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<input type="file" id="csvInput" accept=".csv,text/csv,text/plain" hidden />';

    $('#leadSearch').addEventListener('input', (e) => { leadFilters.q = e.target.value.toLowerCase(); paintLeads(); });
    $('#chipAcao').addEventListener('click', () => { leadFilters.acao = !leadFilters.acao; syncToolbar(); paintLeads(); });
    $('#fSeg').addEventListener('change', (e) => { leadFilters.seg = e.target.value; paintLeads(); });
    $('#fOrd').addEventListener('change', (e) => { leadSort = e.target.value; paintLeads(); });
    $('#chipSelect').addEventListener('click', toggleSelectMode);
    $('#btnAddLead').addEventListener('click', () => openLeadForm(null));
    $('#csvInput').addEventListener('change', handleCSVFile);
    wireMenu('#btnMore', '#leadsMenu', {
      import: () => $('#csvInput').click(), export: exportCSV, archiveAll: archiveAll,
      exportArch: exportArchivedCSV, restoreArch: restoreArchived, restoreOrig: restoreOriginal, restoreDel: restoreDeleted,
    });

    ensureSelectBar();
    syncToolbar();
    paintLeads();
  }
  /* ---------- seleção em massa ---------- */
  function toggleSelectMode() { selectMode = !selectMode; if (!selectMode) selected.clear(); renderLeads(); }
  function ensureSelectBar() {
    let bar = $('#leadsSelectBar');
    if (!bar) {
      const list = $('#leadList');
      bar = el('div', 'selbar'); bar.id = 'leadsSelectBar';
      list.parentNode.insertBefore(bar, list);
    }
    renderSelectBar();
  }
  function renderSelectBar() {
    const bar = $('#leadsSelectBar'); if (!bar) return;
    if (!selectMode) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML =
      '<label class="selbar__all"><input type="checkbox" id="selAll" /><span>Selecionar tudo</span></label>' +
      '<span class="selbar__count" id="selCount"></span>' +
      '<div class="selbar__actions">' +
        '<button class="btn-ghost" id="selExport" type="button">' + icon('download', 15) + 'Exportar' + '</button>' +
        '<select class="select selbar__stage" id="selStage" aria-label="Mudar etapa dos selecionados">' +
          '<option value="">Mudar etapa…</option>' +
          STATUSES.map((x) => '<option value="' + esc(x) + '">' + esc(x) + '</option>').join('') +
        '</select>' +
        '<button class="btn-ghost selbar__del" id="selDelete" type="button">' + icon('trash', 15) + 'Excluir' + '</button>' +
      '</div>';
    $('#selAll').addEventListener('change', selectAllVisible);
    $('#selExport').addEventListener('click', () => exportLeadsList([...selected]));
    $('#selDelete').addEventListener('click', deleteSelected);
    $('#selStage').addEventListener('change', (e) => { const v = e.target.value; e.target.value = ''; if (v) restageSelected(v); });
    refreshSelectBar();
  }
  function refreshSelectBar() {
    if (!selectMode) return;
    const n = selected.size;
    const cnt = $('#selCount'); if (cnt) cnt.textContent = n ? (n + (n === 1 ? ' selecionado' : ' selecionados')) : 'nenhum selecionado';
    ['selExport', 'selDelete', 'selStage'].forEach((id) => { const e = $('#' + id); if (e) e.disabled = (n === 0); });
    const all = $('#selAll');
    if (all) {
      const rows = filteredLeads();
      const allSel = rows.length > 0 && rows.every((l) => selected.has(l.empresa));
      all.checked = allSel;
      all.indeterminate = !allSel && rows.some((l) => selected.has(l.empresa));
    }
  }
  function selectAllVisible() {
    const rows = filteredLeads();
    const allSel = rows.length > 0 && rows.every((l) => selected.has(l.empresa));
    if (allSel) rows.forEach((l) => selected.delete(l.empresa));
    else rows.forEach((l) => selected.add(l.empresa));
    paintLeads();
  }
  function toggleSelected(emp) { if (selected.has(emp)) selected.delete(emp); else selected.add(emp); paintLeads(); }
  function restageSelected(st) {
    if (!selected.size) return;
    const n = selected.size;
    selected.forEach((emp) => {
      if (st === 'A contatar') delete overrides[emp]; else overrides[emp] = st;
      if (st === 'Contatado') touch[emp] = Date.now(); else delete touch[emp];
    });
    saveOverrides(); saveTouch(); rerenderAll();
    toast(n + (n === 1 ? ' lead movido' : ' leads movidos') + ' para "' + st + '".', 'ok');
  }
  function deleteSelected() {
    const emps = [...selected]; if (!emps.length) return;
    const n = emps.length;
    emps.forEach((emp) => { deleted[normKey(emp)] = 1; });
    saveDeleted(); selected.clear(); rebuildData(); rerenderAll();
    toastUndo(n + (n === 1 ? ' lead apagado.' : ' leads apagados.'), function () {
      emps.forEach((emp) => delete deleted[normKey(emp)]); saveDeleted(); rebuildData(); rerenderAll();
    });
  }
  function sel(id, label, opts) {
    return '<select class="select" id="' + id + '" aria-label="' + esc(label) + '">' + opts.map((o) => '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>').join('') + '</select>';
  }
  // menu suspenso: abre no clique, fecha ao escolher item, clicar fora ou apertar Esc
  function wireMenu(btnSel, menuSel, acts) {
    const btn = $(btnSel), menu = $(menuSel);
    if (!btn || !menu) return;
    let onDoc = null, onKey = null;
    function close() {
      menu.hidden = true; btn.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
      if (onDoc) document.removeEventListener('click', onDoc, true);
      if (onKey) document.removeEventListener('keydown', onKey, true);
      onDoc = onKey = null;
    }
    function open() {
      menu.hidden = false; btn.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      onDoc = (e) => { if (!menu.contains(e.target) && !btn.contains(e.target)) close(); };
      onKey = (e) => { if (e.key === 'Escape') { close(); btn.focus(); } };
      setTimeout(() => { document.addEventListener('click', onDoc, true); document.addEventListener('keydown', onKey, true); const fi = menu.querySelector('.menu__item'); if (fi) fi.focus(); }, 0);
    }
    btn.addEventListener('click', (e) => { e.stopPropagation(); if (menu.hidden) open(); else close(); });
    menu.querySelectorAll('[data-act]').forEach((it) => it.addEventListener('click', () => { close(); const fn = acts[it.dataset.act]; if (fn) fn(); }));
  }
  function syncToolbar() {
    const c = $('#chipAcao'); if (c) { c.classList.toggle('is-on', leadFilters.acao); c.setAttribute('aria-pressed', String(leadFilters.acao)); }
    if ($('#leadSearch')) $('#leadSearch').value = leadFilters.q;
    if ($('#fSeg')) $('#fSeg').value = leadFilters.seg;
    if ($('#fOrd')) $('#fOrd').value = leadSort;
  }
  function filteredLeads() {
    const f = leadFilters;
    let rows = DATA.leads.filter((l) => {
      if (f.seg && segCat(l.segmento) !== f.seg) return false;
      if (f.acao && !isTodo(l)) return false;
      if (f.q) {
        const dec = decisorFor(l.empresa);
        const ok = matchQuery(f.q,
          [l.empresa, l.decisor, dec && dec.decisor, dec && dec.cargo, l.segmento, l.cidade, l.gancho, l.fonte,
            l.instagram, dec && dec.instagram, l.linkedinEmpresa, dec && dec.linkedin, l.email, dec && dec.emailPessoal, l.site],
          [l.whatsapp, l.contato, l.canalReserva, dec && dec.telWhatsapp, dec && dec.canalReserva]);
        if (!ok) return false;
      }
      return true;
    });
    const ord = { send: 0, wait: 1, talk: 2, meet: 3, done: 4 };
    if (leadSort === 'empresa') rows.sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR'));
    else if (leadSort === 'acao') rows.sort((a, b) => (ord[actionOf(a).key] - ord[actionOf(b).key]) || (priorityRank(b) - priorityRank(a)));
    else rows.sort((a, b) => (priorityRank(b) - priorityRank(a)) || a.empresa.localeCompare(b.empresa, 'pt-BR'));
    return rows;
  }
  function paintLeads() {
    const rows = filteredLeads();
    $('#leadsCount').innerHTML = '<b>' + rows.length + '</b> ' + (rows.length === 1 ? 'lead' : 'leads') +
      (leadFilters.acao ? ' na fila de hoje' : '') + (rows.length !== DATA.leads.length ? ' · de ' + DATA.leads.length : '');
    refreshSelectBar();
    const list = $('#leadList'); list.innerHTML = '';
    if (!rows.length) {
      list.innerHTML = '<div class="empty">' + icon('search', 42) + '<b>Nenhum lead com esses filtros.</b><div>Limpe a busca ou troque o segmento.</div></div>';
      return;
    }
    rows.forEach((l) => list.appendChild(leadCard(l)));
  }
  function leadCard(l) {
    const a = actionOf(l), s = donoStatus(l);
    const meta = [segCat(l.segmento), bairro(l.cidade)].filter(Boolean).join(' · ');
    const open = !selectMode && openRows.has(l.empresa);
    const checked = selectMode && selected.has(l.empresa);
    const wrap = el('div', 'lead' + (open ? ' is-open' : '') + (selectMode ? ' lead--select' : '') + (checked ? ' is-checked' : ''));
    const row = el('button', 'lead__row'); row.type = 'button';
    const head = selectMode
      ? '<span class="lead__check">' + icon('check') + '</span>'
      : '<span class="lead__chev">' + icon('chevR') + '</span>';
    row.innerHTML =
      head +
      '<div class="lead__mid">' +
        '<div class="lead__emp">' + esc(l.empresa) + '</div>' +
        '<div class="lead__meta">' + esc(meta) +
          ' · <span class="dono-dot" style="background:' + s.color + '"></span><span class="lead__dec">' + esc(s.name || 'dono a confirmar') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="lead__right"><span class="badge ' + a.cls + '"><span class="dot"></span>' + esc(a.label) + '</span></div>';
    if (selectMode) {
      row.setAttribute('role', 'checkbox'); row.setAttribute('aria-checked', String(checked));
      row.addEventListener('click', () => toggleSelected(l.empresa));
    } else {
      row.addEventListener('click', () => { if (openRows.has(l.empresa)) openRows.delete(l.empresa); else openRows.add(l.empresa); paintLeads(); });
    }
    wrap.appendChild(row);
    if (open) wrap.appendChild(leadDetail(l));
    return wrap;
  }
  function leadDetail(l) {
    const box = el('div', 'lead__detail');
    const dec = decisorFor(l.empresa);
    const s = donoStatus(l, dec);
    const cargo = (dec && dec.cargo) || '';
    const primary = bestChannel(l, dec);
    const sc = splitContacts(l, dec);
    const owner = sc.owner, company = sc.company;
    const cbtn = (c) => '<a class="act-btn" href="' + esc(c.href) + '" target="_blank" rel="noopener">' + icon(c.ico) + esc(c.label) + '</a>';
    const reserva = isReal(l.canalReserva) ? l.canalReserva : ((dec && isReal(dec.canalReserva)) ? dec.canalReserva : '');
    const st = statusOf(l), tch = touch[l.empresa];
    const statusSel = '<select class="status-select">' +
      STATUSES.map((x) => '<option value="' + esc(x) + '"' + (statusOf(l) === x ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>';
    box.innerHTML =
      '<div class="ld-main">' +
        '<div>' +
          '<div class="ld-k">Quem decide</div>' +
          '<div class="ld-name' + (s.name ? '' : ' muted') + '">' + esc(s.name || 'Dono ainda não confirmado') + '</div>' +
          (cargo ? '<div class="ld-role">' + esc(cargo) + '</div>' : '') +
        '</div>' +
        '<div class="ld-cta-wrap">' +
          (primary
            ? '<a class="ld-primary" href="' + esc(primary.href) + '" target="_blank" rel="noopener">' + icon(primary.ico) + '<span>' + esc(primary.label) + '</span>' + icon('arrow') + '</a>'
            : '<span class="ld-nochan">Sem link direto — fale pelo canal da empresa abaixo.</span>') +
          '<div class="ld-guide ' + s.cls + '"><span class="dot"></span>' + esc(s.txt) + '</div>' +
        '</div>' +
        '<div class="ld-say"><div class="ld-k">O que dizer (gancho)</div><p>' + (isReal(l.gancho) ? esc(l.gancho) : '—') + '</p></div>' +
      '</div>' +
      '<div class="ld-side">' +
        (owner.length
          ? '<div class="ld-contacts"><div class="ld-k ld-k--owner">' + icon('crown') + (s.level === 'direto' ? 'Contatos do dono' : 'Contato — confirme se é do dono') + '</div><div class="ld-btns">' + owner.map(cbtn).join('') + '</div></div>'
          : '') +
        '<div class="ld-contacts"><div class="ld-k ld-k--firm">' + icon('building') + 'Contatos da empresa</div>' +
          (company.length ? '<div class="ld-btns">' + company.map(cbtn).join('') + '</div>' : '<p style="font-size:12.5px;color:var(--text-3)">Sem contato público da empresa.</p>') +
        '</div>' +
        '<div class="detail__facts">' +
          (st === 'Contatado' && tch ? fact('calendar', (isOverdue(l) ? 'Follow-up venceu em ' + fmtDate(tch + FOLLOWUP_MS) + ' — cobre hoje' : 'Abordado em ' + fmtDate(tch) + ' · follow-up em ' + fmtDate(tch + FOLLOWUP_MS))) : '') +
          fact('pin', l.cidade || '—') +
          (siteLink(l.site) ? '<div class="fact">' + icon('globe') + '<a href="' + esc(siteLink(l.site)) + '" target="_blank" rel="noopener">' + esc(prettyDomain(l.site)) + '</a></div>' : '') +
          (reserva ? fact('chat', 'Canal reserva: ' + reserva) : '') +
          (isReal(l.fonte) ? fact('source', 'Visto em: ' + l.fonte) : '') +
        '</div>' +
      '</div>' +
      '<div class="ld-foot">' +
        '<div class="ld-foot-left">' +
          '<a class="ld-link" href="#" data-edit="1">' + icon('edit') + 'Editar empresa e dono</a>' +
          '<a class="ld-link" href="#" data-dossie="1">' + icon('decisores') + 'Ver dossiê completo do dono</a>' +
          '<button class="ld-del" type="button" data-del="1" title="Remover este contato da sua lista">' + icon('trash') + 'Apagar contato</button>' +
        '</div>' +
        '<span class="ld-status">Já falei? ' + statusSel + '</span>' +
      '</div>';
    setTimeout(() => {
      const sl = box.querySelector('.status-select');
      if (sl) sl.addEventListener('change', (e) => { e.stopPropagation(); setStatus(l.empresa, e.target.value); });
      const dl = box.querySelector('[data-dossie]');
      if (dl) dl.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openDossie(l.empresa); });
      const ed = box.querySelector('[data-edit]');
      if (ed) ed.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openLeadForm(l.empresa); });
      const del = box.querySelector('[data-del]');
      if (del) del.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); deleteLead(l.empresa); });
      box.querySelectorAll('a, button, select').forEach((n) => n.addEventListener('click', (e) => e.stopPropagation()));
    }, 0);
    return box;
  }
  function fact(ico, text) { return '<div class="fact">' + icon(ico) + '<span>' + esc(text) + '</span></div>'; }

  function openLead(empresa) {
    Object.assign(leadFilters, { q: '', seg: '', acao: false });
    openRows.clear(); openRows.add(empresa);
    syncToolbar(); paintLeads(); go('leads');
    setTimeout(() => {
      const list = $('#leadList'); if (!list) return;
      const c = list.querySelector('.lead.is-open');
      if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 60);
  }
  function openDossie(empresa) {
    decFilters.q = empresa.toLowerCase(); decFilters.acesso = '';
    if ($('#decSearch')) $('#decSearch').value = empresa;
    if ($('#dAcesso')) $('#dAcesso').value = '';
    paintDec(); go('decisores');
  }
  function setStatus(emp, st) {
    if (st === 'A contatar') delete overrides[emp]; else overrides[emp] = st;
    if (st === 'Contatado') touch[emp] = Date.now(); else delete touch[emp];
    saveOverrides(); saveTouch();
    renderHoje(); renderQuadro(); paintLeads(); updateBadges();
  }
  function updateBadges() {
    const send = DATA.leads.filter((l) => actionOf(l).key === 'send').length;
    document.querySelectorAll('[data-badge="leads"]').forEach((b) => { b.textContent = send; b.setAttribute('data-zero', send ? '0' : '1'); });
  }

  /* ============================================================
     IMPORTAR CSV — formato novo do Lead Hunter (planilha única)
     Cada linha vira uma empresa + (se tiver) o dono. Separa
     "da empresa" × "pessoal" pelos nomes das colunas.
     ============================================================ */
  function handleCSVFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const res = importCSVText(String(reader.result || ''));
        toast(res.error || res.msg, res.error ? 'bad' : 'ok');
      } catch (err) { toast('Não consegui ler esse arquivo. Confira se é um CSV exportado do Google Sheets.', 'bad'); }
    };
    reader.onerror = function () { toast('Falha ao abrir o arquivo.', 'bad'); };
    reader.readAsText(file, 'utf-8');
  }
  function fixMoji(s) {
    try { var b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff; return new TextDecoder('utf-8').decode(b); } catch (e) { return s; }
  }
  function normH(s) {
    return (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function parseCSVrows(text) {
    const rows = []; let row = [], field = '', i = 0, inQ = false;
    const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    while (i < s.length) {
      const c = s[i];
      if (inQ) { if (c === '"') { if (s[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; } field += c; i++; continue; }
      if (c === '"') { inQ = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }
  const g = (r, i) => (i >= 0 && r[i] != null) ? String(r[i]).trim() : '';
  function normCanal(c) { var s = (c || '').toLowerCase(); if (s.indexOf('insta') >= 0) return 'Instagram DM'; if (s.indexOf('whats') >= 0) return 'WhatsApp'; if (s.indexOf('linkedin') >= 0) return 'LinkedIn'; if (s.indexOf('mail') >= 0) return 'E-mail'; if (s.indexOf('liga') >= 0 || s.indexOf('tel') >= 0) return 'Ligação'; return c || ''; }
  function normStatus(s) { s = (s || '').toString().trim(); if (!s) return 'A contatar'; const low = s.toLowerCase(); return STATUSES.find((x) => x.toLowerCase() === low) || STATUSES.find((x) => low.indexOf(x.toLowerCase()) >= 0) || 'A contatar'; }

  function importCSVText(raw) {
    let text = raw;
    if ((text.match(/[ÂÃ][-¿]/g) || []).length >= 3) text = fixMoji(text);
    const rows = parseCSVrows(text).map((r) => r.map((c) => (c || '').trim()));
    let h = -1;
    for (let r = 0; r < rows.length && r < 15; r++) {
      const hs = rows[r].map(normH);
      const hasEmp = hs.some((x) => x === 'empresa' || x.indexOf('nome da empresa') >= 0 || x.indexOf('empresa') >= 0);
      const hasMore = hs.some((x) => ['decisor', 'dono', 'gancho', 'segmento', 'cargo', 'canal', 'instagram', 'whatsapp', 'site'].some((k) => x.indexOf(k) >= 0));
      if (hasEmp && hasMore) { h = r; break; }
    }
    if (h < 0) return { error: 'Não achei o cabeçalho. No Google Sheets faça Arquivo → Fazer download → CSV e tente de novo.' };
    const H = rows[h].map(normH);
    const find = (pred) => { for (let i = 0; i < H.length; i++) if (pred(H[i])) return i; return -1; };
    const any = (...kw) => (hh) => kw.some((k) => hh.indexOf(k) >= 0);
    const both = (a, b) => (hh) => a(hh) && b(hh);
    const isFirm = any('empresa', 'negocio', 'clinic', 'loja', 'institucional', 'comercial');
    const isOwner = any('pessoal', 'dono', 'decisor', 'socio', 'direto');

    const ix = {
      empresa: find((h2) => h2 === 'empresa' || h2 === 'nome da empresa' || (h2.indexOf('empresa') >= 0 && !/instagram|linkedin|whats|tel|mail|site/.test(h2))),
      segmento: find(any('segmento', 'nicho', 'ramo', 'tipo de neg')),
      cidade: find(any('cidade', 'bairro', 'regiao', 'localiza')),
      site: find((h2) => h2 === 'site' || h2.indexOf('site') >= 0 || h2.indexOf('website') >= 0),
      igEmp: find(both(any('instagram'), isFirm)),
      igPes: find(both(any('instagram'), isOwner)),
      waEmp: find(both(any('whatsapp', 'telefone', 'fone', 'celular', 'tel '), isFirm)),
      waPes: find(both(any('whatsapp', 'telefone', 'fone', 'celular', 'tel '), isOwner)),
      liEmp: find(both(any('linkedin'), isFirm)),
      liPes: find(both(any('linkedin'), isOwner)),
      mailEmp: find(both(any('mail'), isFirm)),
      mailPes: find(both(any('mail'), isOwner)),
      decisor: find(any('nome do decisor', 'decisor', 'dono', 'responsavel', 'socio')),
      cargo: find(any('cargo', 'papel', 'funcao')),
      canalP: find(both(any('canal'), any('principal'))),
      canalR: find((h2) => h2.indexOf('reserva') >= 0 || (h2.indexOf('canal') >= 0 && h2.indexOf('secund') >= 0)),
      gancho: find(any('gancho', 'personaliza', 'hook')),
      fonte: find(any('fonte', 'origem')),
      etapa: find(any('etapa', 'status', 'fase')),
    };
    // colunas únicas (planilha sem distinção empresa/pessoal) → tratar como empresa
    const oneIf = (a, b, anyFn) => { if (ix[a] < 0 && ix[b] < 0) ix[a] = find(anyFn); };
    oneIf('igEmp', 'igPes', any('instagram'));
    oneIf('waEmp', 'waPes', any('whatsapp', 'telefone', 'fone', 'celular', 'tel '));
    oneIf('liEmp', 'liPes', any('linkedin'));
    oneIf('mailEmp', 'mailPes', any('mail'));
    if (ix.canalP < 0) ix.canalP = find(both(any('canal'), (hh) => hh.indexOf('reserva') < 0 && hh.indexOf('secund') < 0));

    const dataRows = rows.slice(h + 1);
    const leads = [], decs = [];
    dataRows.forEach((r) => {
      const emp = g(r, ix.empresa); if (!emp) return;
      const decNome = g(r, ix.decisor);
      leads.push({
        empresa: emp, etapa: normStatus(g(r, ix.etapa)),
        segmento: g(r, ix.segmento), cidade: g(r, ix.cidade), site: g(r, ix.site),
        instagram: g(r, ix.igEmp), whatsapp: g(r, ix.waEmp), email: g(r, ix.mailEmp), linkedinEmpresa: g(r, ix.liEmp),
        canal: normCanal(g(r, ix.canalP)), canalReserva: g(r, ix.canalR),
        gancho: g(r, ix.gancho), fonte: g(r, ix.fonte), decisor: decNome,
      });
      if (decNome || g(r, ix.cargo) || g(r, ix.igPes) || g(r, ix.waPes) || g(r, ix.liPes)) {
        decs.push({
          empresa: emp, decisor: decNome, cargo: g(r, ix.cargo),
          instagram: g(r, ix.igPes), linkedin: g(r, ix.liPes), telWhatsapp: g(r, ix.waPes), emailPessoal: g(r, ix.mailPes),
          canalReserva: g(r, ix.canalR), fonte: g(r, ix.fonte),
        });
      }
    });
    if (!leads.length) return { error: 'Li o arquivo, mas não achei nenhuma empresa (a coluna "Nome da empresa" está vazia?).' };
    const baseSet = new Set((BASELINE.leads || []).concat((loadImports() || {}).leads || []).map((x) => normKey(x.empresa)));
    let novos = 0; leads.forEach((r) => { if (!baseSet.has(normKey(r.empresa))) novos++; });
    const imp = loadImports() || {};
    imp.leads = upsertBy(imp.leads || [], leads, 'empresa');
    if (decs.length) imp.decisores = upsertBy(imp.decisores || [], decs, 'empresa');
    saveImports(imp);
    leads.forEach((r) => { if (deleted[normKey(r.empresa)]) delete deleted[normKey(r.empresa)]; }); saveDeleted();
    rebuildData();
    renderLeads(); renderDecisores(); renderHoje(); renderQuadro();
    const comDono = decs.filter((d) => isReal(d.decisor)).length;
    return { msg: leads.length + ' empresas importadas — ' + novos + ' novas, ' + (leads.length - novos) + ' atualizadas' + (comDono ? (' · ' + comDono + ' com dono identificado') : '') + '.' };
  }
  function restoreOriginal() {
    if (!window.confirm('Isto remove tudo que você importou e volta aos dados originais. Continuar?')) return;
    try { localStorage.removeItem(LS_IMPORT); } catch (e) {}
    renamed = {}; saveRenamed();   // volta os nomes antigos que tinham sido renomeados
    rebuildData(); renderLeads(); renderDecisores(); renderHoje(); renderQuadro();
    toast('Pronto — voltei aos dados originais.', 'ok');
  }

  /* ============================================================
     EXPORTAR CSV — baixa os leads no mesmo formato do Lead Hunter
     ============================================================ */
  function csvCell(v) { const s = (v == null ? '' : String(v)); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function fileDate() { try { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); } catch (e) { return 'export'; } }
  const CSV_R = (v) => isReal(v) ? String(v).trim() : '';
  const CSV_COLS = [
    ['Nome da empresa', (l) => l.empresa],
    ['Segmento', (l) => l.segmento],
    ['Cidade / Bairro', (l) => l.cidade],
    ['Site', (l) => CSV_R(l.site)],
    ['Instagram da empresa', (l) => CSV_R(l.instagram)],
    ['LinkedIn da empresa', (l) => CSV_R(l.linkedinEmpresa)],
    ['WhatsApp / Tel da empresa', (l) => CSV_R(l.whatsapp)],
    ['E-mail da empresa', (l) => CSV_R(l.email)],
    ['Nome do decisor', (l, d) => (d && isReal(d.decisor)) ? d.decisor.trim() : (isReal(l.decisor) ? l.decisor.trim() : '')],
    ['Cargo', (l, d) => CSV_R(d && d.cargo)],
    ['Instagram pessoal', (l, d) => CSV_R(d && d.instagram)],
    ['LinkedIn pessoal', (l, d) => CSV_R(d && d.linkedin)],
    ['WhatsApp / Tel pessoal', (l, d) => CSV_R(d && d.telWhatsapp)],
    ['E-mail pessoal', (l, d) => CSV_R(d && d.emailPessoal)],
    ['Canal principal', (l) => CSV_R(l.canal)],
    ['Canal reserva', (l, d) => CSV_R(l.canalReserva) || CSV_R(d && d.canalReserva)],
    ['Gancho de personalização', (l) => CSV_R(l.gancho)],
    ['Fonte', (l, d) => CSV_R(l.fonte) || CSV_R(d && d.fonte)],
    ['Etapa (CRM)', (l) => statusOf(l)],
  ];
  function leadsToCSV(rows, decOf) {
    const lines = [CSV_COLS.map((c) => csvCell(c[0])).join(',')];
    rows.forEach((l) => { const d = decOf(l); lines.push(CSV_COLS.map((c) => csvCell(c[1](l, d))).join(',')); });
    return '﻿' + lines.join('\r\n') + '\r\n';   // BOM p/ acentos abrirem certo no Excel/Sheets
  }
  function downloadCSV(csv, tag, n) {
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = el('a'); a.href = url; a.download = 'fova-' + tag + '-' + fileDate() + '.csv';
      document.body.appendChild(a); a.click();
      setTimeout(() => { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {} }, 800);
      toast(n + (n === 1 ? ' lead exportado' : ' leads exportados') + ' — veja em Downloads.', 'ok');
    } catch (e) { toast('Não consegui gerar o arquivo neste navegador.', 'bad'); }
  }
  function exportCSV() {
    if (!DATA || !DATA.leads.length) { toast('Não há leads para exportar.', 'bad'); return; }
    const rows = DATA.leads.slice().sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR'));
    downloadCSV(leadsToCSV(rows, decisorFor), 'leads', rows.length);
  }
  function exportArchivedCSV() {
    const rows = Object.values(archived).map((a) => a.lead);
    if (!rows.length) { toast('Não há leads arquivados.', 'bad'); return; }
    rows.sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR'));
    downloadCSV(leadsToCSV(rows, (l) => { const a = archived[normKey(l.empresa)]; return a ? a.dec : null; }), 'arquivados', rows.length);
  }
  function exportLeadsList(emps) {
    const set = new Set(emps);
    const rows = DATA.leads.filter((l) => set.has(l.empresa)).sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR'));
    if (!rows.length) { toast('Selecione ao menos um lead.', 'bad'); return; }
    downloadCSV(leadsToCSV(rows, decisorFor), 'selecionados', rows.length);
  }
  function toast(msg, kind) {
    let t = $('#toast');
    if (!t) { t = el('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.className = 'toast show ' + (kind === 'bad' ? 'toast--bad' : 'toast--ok');
    t.innerHTML = icon(kind === 'bad' ? 'info' : 'check') + '<span>' + esc(msg) + '</span>';
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = 'toast'; }, 4500);
  }
  function toastUndo(msg, undoFn) {
    let t = $('#toast');
    if (!t) { t = el('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.className = 'toast show toast--ok';
    t.innerHTML = icon('check') + '<span>' + esc(msg) + '</span><button class="toast__undo" type="button">Desfazer</button>';
    const hide = function () { t.className = 'toast'; };
    t.querySelector('.toast__undo').addEventListener('click', function () { undoFn(); hide(); });
    clearTimeout(toast._t); toast._t = setTimeout(hide, 6500);
  }

  /* ============================================================
     DECISORES (a "pasta" dos donos)
     ============================================================ */
  const decFilters = { q: '', acesso: '' };
  function renderDecisores() {
    $('#decToolbar').innerHTML =
      '<div class="toolbar__filters">' +
        '<div class="search">' + icon('search') + '<input id="decSearch" type="search" placeholder="Buscar dono, empresa, telefone ou LinkedIn…" aria-label="Buscar decisores" /></div>' +
        sel('dAcesso', 'Acesso ao dono', [['', 'Todos os donos'], ['direto', 'Com contato direto'], ['id', 'Identificado (confira)'], ['nao', 'A confirmar']]) +
      '</div>' +
      '<div class="toolbar__actions">' +
        '<button class="btn-import" id="btnAddDec" type="button" title="Cadastrar um decisor na mão">' + icon('plus') + 'Adicionar decisor</button>' +
      '</div>';
    $('#decSearch').addEventListener('input', (e) => { decFilters.q = e.target.value.toLowerCase(); paintDec(); });
    $('#dAcesso').addEventListener('change', (e) => { decFilters.acesso = e.target.value; paintDec(); });
    $('#btnAddDec').addEventListener('click', () => openDecForm(null));
    if ($('#decSearch')) $('#decSearch').value = decFilters.q;
    if ($('#dAcesso')) $('#dAcesso').value = decFilters.acesso;
    paintDec();
  }
  function paintDec() {
    const f = decFilters;
    // index de leads por empresa pra puxar segmento/contexto
    const leadBy = {}; DATA.leads.forEach((l) => { leadBy[normKey(l.empresa)] = l; });
    const rows = DATA.decisores.filter((d) => {
      const l = leadBy[normKey(d.empresa)] || { empresa: d.empresa };
      const s = donoStatus(l, d);
      if (f.acesso && s.level !== f.acesso) return false;
      if (f.q) {
        const ok = matchQuery(f.q,
          [d.empresa, d.decisor, d.cargo, d.instagram, d.linkedin, d.emailPessoal, d.fonte, l.segmento, l.cidade],
          [d.telWhatsapp, d.canalReserva, l.whatsapp]);
        if (!ok) return false;
      }
      return true;
    });
    $('#decCount').innerHTML = '<b>' + rows.length + '</b> ' + (rows.length === 1 ? 'dono' : 'donos') + (rows.length !== DATA.decisores.length ? ' · de ' + DATA.decisores.length : '');
    const grid = $('#decGrid');
    if (!rows.length) { grid.innerHTML = '<div class="empty">' + icon('users', 42) + '<b>Nenhum dono com esse filtro.</b><div>Limpe a busca.</div></div>'; return; }
    grid.innerHTML = rows.map((d) => {
      const l = leadBy[normKey(d.empresa)] || { empresa: d.empresa };
      const s = donoStatus(l, d);
      const owner = ownerContacts(d);
      const segm = l.segmento ? segCat(l.segmento) : '';
      return '<article class="dec ' + ({ direto: 'cAlta', id: 'cMédia', nao: 'cBaixa' }[s.level]) + '">' +
        '<div class="dec__top">' +
          '<div><div class="dec__emp">' + esc(d.empresa) + (segm ? ' · ' + esc(segm) : '') + '</div>' +
          '<div class="dec__name' + (s.name ? '' : ' muted') + '">' + esc(s.name || 'Dono a confirmar') + '</div></div>' +
          '<button class="dec__edit" type="button" data-edit="' + esc(d.empresa) + '" aria-label="Editar decisor" title="Editar decisor">' + icon('edit') + '</button>' +
        '</div>' +
        (d.cargo ? '<div class="dec__role">' + esc(d.cargo) + '</div>' : '') +
        '<div class="dec__guide ld-guide ' + s.cls + '"><span class="dot"></span>' + esc(s.txt) + '</div>' +
        (owner.length ? '<div class="dec__chan">' + owner.map((c) => '<a class="dec__btn" href="' + esc(c.href) + '" target="_blank" rel="noopener">' + icon(c.ico) + esc(c.label.replace(' do dono', '')) + '</a>').join('') + '</div>' : '') +
        (isReal(d.fonte) ? '<div class="dec__why">Visto em: ' + esc(d.fonte) + '</div>' : '') +
      '</article>';
    }).join('');
    grid.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openDecForm(b.dataset.edit)));
  }

  /* ============================================================
     EDITAR / ADICIONAR  (empresa + dono) — salvo como "import"
     no localStorage, que já se mescla com a base por "empresa".
     Guardar o objeto completo deixa limpar um campo funcionar
     (string vazia sobrescreve o valor que vinha da base).
     ============================================================ */
  function removeImport(kind, empresa) {
    const imp = loadImports() || {};
    if (!imp[kind]) return;
    imp[kind] = imp[kind].filter((x) => normKey(x.empresa) !== normKey(empresa));
    saveImports(imp);
  }
  function putImport(kind, obj) {
    const imp = loadImports() || {};
    const key = normKey(obj.empresa);
    const arr = (imp[kind] || []).filter((x) => normKey(x.empresa) !== key);
    arr.push(obj);
    imp[kind] = arr;
    saveImports(imp);
  }
  function existsEmpresa(empresa, exceptKey) {
    const k = normKey(empresa);
    if (exceptKey && k === normKey(exceptKey)) return false;
    return DATA.leads.some((l) => normKey(l.empresa) === k) || DATA.decisores.some((d) => normKey(d.empresa) === k);
  }

  // specs dos campos (name = chave no objeto; ns = empresa|dono)
  const F_EMPRESA = [
    { name: 'empresa', ns: 'lead', label: 'Nome da empresa', full: true, required: true, placeholder: 'ex.: Clínica Sorriso' },
    { name: 'segmento', ns: 'lead', label: 'Segmento', placeholder: 'ex.: Odontologia' },
    { name: 'cidade', ns: 'lead', label: 'Cidade / bairro', placeholder: 'ex.: Curitiba / Batel' },
    { name: 'site', ns: 'lead', label: 'Site', full: true, placeholder: 'ex.: clinicasorriso.com.br', hint: 'Aparece no detalhe da empresa.' },
    { name: 'instagram', ns: 'lead', label: 'Instagram da empresa', placeholder: '@ ou link' },
    { name: 'whatsapp', ns: 'lead', label: 'WhatsApp / telefone da empresa', placeholder: '(41) 99999-9999' },
    { name: 'email', ns: 'lead', label: 'E-mail da empresa', placeholder: 'contato@empresa.com' },
    { name: 'linkedinEmpresa', ns: 'lead', label: 'LinkedIn da empresa', placeholder: 'link /company/…' },
    { name: 'canal', ns: 'lead', label: 'Canal principal', type: 'select', options: ['', 'WhatsApp', 'Instagram DM', 'LinkedIn', 'E-mail', 'Ligação'] },
    { name: 'canalReserva', ns: 'lead', label: 'Canal reserva', placeholder: 'ex.: Instagram' },
    { name: 'gancho', ns: 'lead', label: 'Gancho — o que dizer na abordagem', type: 'textarea', full: true, placeholder: 'ex.: Vi que vocês abriram uma unidade nova…' },
    { name: 'fonte', ns: 'lead', label: 'Fonte (onde você viu)', full: true, placeholder: 'ex.: Google Maps' },
  ];
  const F_EMPRESA_LINK = { name: 'empresa', ns: 'lead', label: 'Empresa a que este dono pertence', full: true, required: true, placeholder: 'ex.: Clínica Sorriso' };
  const F_DONO = [
    { name: 'decisor', ns: 'dono', label: 'Nome do dono / decisor', full: true, placeholder: 'ex.: Maria Silva' },
    { name: 'cargo', ns: 'dono', label: 'Cargo', placeholder: 'ex.: Sócia-fundadora' },
    { name: 'telWhatsapp', ns: 'dono', label: 'WhatsApp / telefone pessoal', placeholder: '(41) 99999-9999' },
    { name: 'instagram', ns: 'dono', label: 'Instagram pessoal', placeholder: '@ ou link' },
    { name: 'linkedin', ns: 'dono', label: 'LinkedIn pessoal', placeholder: 'link /in/…' },
    { name: 'emailPessoal', ns: 'dono', label: 'E-mail pessoal', placeholder: 'nome@email.com' },
  ];

  let _modal = null, _formCtx = null, _lastFocus = null;
  function ensureModal() {
    if (_modal) return _modal;
    const m = el('div', 'modal'); m.id = 'editModal'; m.hidden = true;
    m.innerHTML =
      '<div class="modal__backdrop" data-close="1"></div>' +
      '<div class="modal__card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
        '<header class="modal__head">' +
          '<div><div class="modal__eyebrow" id="modalEyebrow"></div><h2 class="modal__title serif" id="modalTitle"></h2></div>' +
          '<button class="modal__x" type="button" data-close="1" aria-label="Fechar">' + icon('close') + '</button>' +
        '</header>' +
        '<form class="modal__form" id="editForm" autocomplete="off">' +
          '<div class="modal__body" id="modalBody"></div>' +
          '<footer class="modal__foot">' +
            '<button class="mbtn mbtn--ghost" type="button" data-close="1">Cancelar</button>' +
            '<button class="mbtn mbtn--primary" type="submit" id="modalSave">Salvar</button>' +
          '</footer>' +
        '</form>' +
      '</div>';
    document.body.appendChild(m);
    m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
    m.querySelector('#editForm').addEventListener('submit', onFormSubmit);
    m.addEventListener('keydown', trapKey);
    _modal = m;
    return m;
  }
  function fieldHTML(spec, val) {
    const id = 'ff_' + spec.ns + '_' + spec.name;
    const common = 'id="' + id + '" data-ns="' + spec.ns + '" data-field="' + spec.name + '"' + (spec.ph === false ? '' : ' placeholder="' + esc(spec.placeholder || '') + '"');
    let control;
    if (spec.type === 'textarea') {
      control = '<textarea ' + common + ' rows="3">' + esc(val || '') + '</textarea>';
    } else if (spec.type === 'select') {
      const v = val || '';
      control = '<select ' + common + '>' + spec.options.map((o) => '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o || '— nenhum —') + '</option>').join('') + '</select>';
    } else {
      control = '<input type="text" ' + common + ' value="' + esc(val || '') + '"' + (spec.locked ? ' readonly' : '') + ' />';
    }
    return '<div class="field' + (spec.full ? ' field--full' : '') + '">' +
      '<label for="' + id + '">' + esc(spec.label) + (spec.required ? ' *' : '') + '</label>' +
      control +
      (spec.hint ? '<span class="field__hint">' + esc(spec.hint) + '</span>' : '') +
      '<span class="field__err" data-err-for="' + spec.ns + '.' + spec.name + '"></span>' +
    '</div>';
  }
  function group(head, ico, specs, vals) {
    return '<section class="fgroup"><div class="fgroup__head">' + icon(ico) + esc(head) + '</div>' +
      '<div class="fgrid">' + specs.map((s) => fieldHTML(s, vals[s.ns === 'dono' ? ('dono:' + s.name) : s.name])).join('') + '</div></section>';
  }

  function openLeadForm(empresa) {
    const isEdit = !!empresa;
    const lead = isEdit ? (DATA.leads.find((l) => l.empresa === empresa) || { empresa: empresa }) : {};
    const dec = isEdit ? (decisorFor(empresa) || {}) : {};
    const vals = {};
    F_EMPRESA.forEach((s) => { vals[s.name] = lead[s.name] != null ? lead[s.name] : ''; });
    F_DONO.forEach((s) => { vals['dono:' + s.name] = dec[s.name] != null ? dec[s.name] : ''; });
    _formCtx = { mode: 'empresa', isEdit, original: empresa || '' };
    const m = ensureModal();
    $('#modalEyebrow', m).textContent = isEdit ? 'Editar empresa' : 'Nova empresa';
    $('#modalTitle', m).innerHTML = isEdit ? esc(empresa) : 'Adicionar <em>empresa</em>';
    $('#modalBody', m).innerHTML =
      group('Dados da empresa', 'building', F_EMPRESA, vals) +
      group('Quem decide (dono)', 'crown', F_DONO, vals);
    showModal();
  }
  function openDecForm(empresa) {
    const isEdit = !!empresa;
    const lead = isEdit ? (DATA.leads.find((l) => l.empresa === empresa) || { empresa: empresa }) : {};
    const dec = isEdit ? (decisorFor(empresa) || {}) : {};
    const vals = { empresa: isEdit ? (dec.empresa || lead.empresa || empresa) : '' };
    F_DONO.forEach((s) => { vals['dono:' + s.name] = dec[s.name] != null ? dec[s.name] : ''; });
    _formCtx = { mode: 'decisor', isEdit, original: empresa || '' };
    const m = ensureModal();
    const empSpec = Object.assign({}, F_EMPRESA_LINK, { locked: isEdit, hint: isEdit ? 'Para renomear a empresa, edite-a na aba Leads.' : 'Se a empresa ainda não existe, ela é criada junto.' });
    $('#modalEyebrow', m).textContent = isEdit ? 'Editar decisor' : 'Novo decisor';
    $('#modalTitle', m).innerHTML = isEdit ? esc(dec.decisor || empresa) : 'Adicionar <em>decisor</em>';
    $('#modalBody', m).innerHTML =
      '<section class="fgroup"><div class="fgrid">' + fieldHTML(empSpec, vals.empresa) + '</div></section>' +
      group('Quem decide (dono)', 'crown', F_DONO, vals);
    showModal();
  }

  function showModal() {
    const m = ensureModal();
    _lastFocus = document.activeElement;
    m.hidden = false;
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    clearErrors();
    setTimeout(() => { const f = m.querySelector('input:not([readonly]), textarea, select'); if (f) f.focus(); }, 30);
  }
  function closeModal() {
    if (!_modal || _modal.hidden) return;
    _modal.hidden = true; _formCtx = null;
    try { document.body.style.overflow = ''; } catch (e) {}
    try { if (_lastFocus && _lastFocus.focus) _lastFocus.focus(); } catch (e) {}
  }
  function trapKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    const nodes = _modal.querySelectorAll('button, input, textarea, select, a[href]');
    const list = Array.prototype.filter.call(nodes, (x) => !x.disabled && !x.readOnly && x.offsetParent !== null);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function readForm() {
    const out = { lead: {}, dono: {} };
    _modal.querySelectorAll('[data-field]').forEach((inp) => {
      out[inp.dataset.ns][inp.dataset.field] = (inp.value || '').trim();
    });
    return out;
  }
  function clearErrors() {
    if (!_modal) return;
    _modal.querySelectorAll('.field__err').forEach((e) => { e.textContent = ''; });
    _modal.querySelectorAll('[data-field]').forEach((i) => i.removeAttribute('aria-invalid'));
  }
  function showError(ns, field, msg) {
    const e = _modal.querySelector('[data-err-for="' + ns + '.' + field + '"]');
    const i = _modal.querySelector('[data-ns="' + ns + '"][data-field="' + field + '"]');
    if (e) e.textContent = msg;
    if (i) { i.setAttribute('aria-invalid', 'true'); i.focus(); }
  }

  function onFormSubmit(e) {
    e.preventDefault();
    if (!_formCtx) return;
    clearErrors();
    const f = readForm();
    const ctx = _formCtx;
    const newEmp = (f.lead.empresa || '').trim();
    if (!newEmp) { showError('lead', 'empresa', 'Dê um nome pra empresa.'); return; }

    const isRename = ctx.isEdit && ctx.original && normKey(ctx.original) !== normKey(newEmp);
    // bloqueia criar/renomear por cima de outra empresa já existente
    if (ctx.mode === 'empresa' && (!ctx.isEdit || isRename) && existsEmpresa(newEmp, ctx.isEdit ? ctx.original : null)) {
      showError('lead', 'empresa', 'Já existe uma empresa com esse nome. Edite a que já está na lista.');
      return;
    }

    // renomear: esconde o registro antigo e migra a etapa (status/cronômetro) p/ o novo nome
    if (isRename) {
      if (overrides[ctx.original] != null) { overrides[newEmp] = overrides[ctx.original]; delete overrides[ctx.original]; saveOverrides(); }
      if (touch[ctx.original] != null) { touch[newEmp] = touch[ctx.original]; delete touch[ctx.original]; saveTouch(); }
      removeImport('leads', ctx.original); removeImport('decisores', ctx.original);
      if ((BASELINE.leads || []).some((x) => normKey(x.empresa) === normKey(ctx.original)) ||
          (BASELINE.decisores || []).some((x) => normKey(x.empresa) === normKey(ctx.original))) {
        renamed[normKey(ctx.original)] = 1; saveRenamed();   // esconde o nome antigo da base, sem contar como "apagado"
      }
      openRows.delete(ctx.original); selected.delete(ctx.original);
    }

    const donoName = (f.dono.decisor || '').trim();
    // de onde ler o registro atual: ao editar, do nome antigo; ao adicionar, do nome digitado
    // (assim vincular um decisor a uma empresa que já existe não apaga os dados dela)
    const lookupKey = ctx.isEdit ? ctx.original : newEmp;
    // objeto da empresa: parte do que já existe (preserva campos não editáveis, ex.: contato) e aplica o que foi digitado
    const curLead = DATA.leads.find((l) => normKey(l.empresa) === normKey(lookupKey)) || {};
    const leadObj = Object.assign({}, curLead);
    if (ctx.mode === 'empresa') { F_EMPRESA.forEach((s) => { leadObj[s.name] = f.lead[s.name] || ''; }); }
    leadObj.empresa = newEmp;
    leadObj.decisor = donoName;

    // objeto do dono
    const curDec = (decisorFor(lookupKey) || {});
    const decObj = Object.assign({}, curDec);
    F_DONO.forEach((s) => { decObj[s.name] = f.dono[s.name] || ''; });
    decObj.empresa = newEmp;

    const anyOwner = F_DONO.some((s) => isReal(f.dono[s.name]));
    const hadDec = isReal(curDec.decisor) || F_DONO.some((s) => isReal(curDec[s.name]));

    // se apagaram a empresa inteira: evita salvar vazio
    putImport('leads', leadObj);
    if (anyOwner || hadDec) putImport('decisores', decObj);
    else removeImport('decisores', newEmp);

    // tira dos apagados/renomeados, se o nome novo estava escondido
    if (deleted[normKey(newEmp)]) { delete deleted[normKey(newEmp)]; saveDeleted(); }
    if (renamed[normKey(newEmp)]) { delete renamed[normKey(newEmp)]; saveRenamed(); }

    rebuildData();
    rerenderAll();
    closeModal();

    if (ctx.mode === 'decisor') {
      toast(ctx.isEdit ? 'Decisor atualizado.' : 'Decisor adicionado.', 'ok');
      openDossie(newEmp);
    } else {
      toast(ctx.isEdit ? 'Empresa atualizada.' : 'Empresa adicionada.', 'ok');
      if (!ctx.isEdit) openLead(newEmp);
    }
  }

  /* ============================================================
     PONTE PARA O MÓDULO DE QUADROS (boards.js)
     Expõe só o necessário, mantendo a mesma identidade/ajudantes.
     ============================================================ */
  window.FOVA = {
    icon: icon, el: el, esc: esc, qs: $, toast: toast, toastUndo: toastUndo,
    go: go, getData: function () { return DATA; }, decisorFor: decisorFor,
    normKey: normKey, isReal: isReal, statusOf: statusOf, setStatus: setStatus,
    segCat: segCat, bairro: bairro, STATUSES: STATUSES, fmtDate: fmtDate,
    openLead: openLead, isBooted: function () { return booted; },
    // Relê o estado do CRM do localStorage e redesenha — usado pelo desfazer/refazer (undo.js).
    reload: function () {
      try { overrides = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { overrides = {}; }
      try { touch = JSON.parse(localStorage.getItem(LS_TOUCH) || '{}'); } catch (e) { touch = {}; }
      try { deleted = JSON.parse(localStorage.getItem(LS_DELETED) || '{}'); } catch (e) { deleted = {}; }
      try { archived = JSON.parse(localStorage.getItem(LS_ARCHIVED) || '{}'); } catch (e) { archived = {}; }
      try { renamed = JSON.parse(localStorage.getItem(LS_RENAMED) || '{}'); } catch (e) { renamed = {}; }
      if (booted) { rebuildData(); rerenderAll(); }
    },
  };

})();
