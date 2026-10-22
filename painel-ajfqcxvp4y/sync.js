/* ============================================================
   FOVA · CRM — Colaboração em tempo real + login por sócio
   ------------------------------------------------------------
   Camada ADITIVA e opcional. Enquanto window.FOVA_CFG não tiver
   URL + chave do Supabase, este arquivo não faz nada e o CRM roda
   igual a antes (senha compartilhada + dados só neste aparelho).

   Quando configurado, ele:
     · troca a senha única por login individual dos dois sócios;
     · mantém a sessão por 30+ dias (refresh automático);
     · sincroniza TODA alteração entre computadores em < 1s;
     · mostra presença (quem está online e em qual quadro);
     · mostra bordas coloridas de quem edita/arrasta um cartão;
     · reconcilia edições simultâneas sem perder dados;
     · reconecta sozinho e mostra "Sincronizado/Reconectando/Offline";
     · registra histórico de quem fez o quê e quando.

   Integração com o app existente (sem reescrever app.js/boards.js):
     · detecta mudanças locais interceptando localStorage.setItem;
     · aplica mudanças remotas escrevendo no localStorage e chamando
       os recarregadores que já existem: FOVA.reload() e Boards.reload().
     · pega gancho de login/decifragem via window.FOVA_GATE.
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.FOVA_CFG || {};
  var ENABLED = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  var log = function () { if (CFG.debug) try { console.log.apply(console, ['[fova-sync]'].concat([].slice.call(arguments))); } catch (e) {} };

  // Chaves do localStorage que o app já usa (fonte da verdade local).
  var LS = {
    overrides: 'fova_crm_status_v1',
    touch: 'fova_crm_touch_v1',
    deleted: 'fova_crm_deleted_v1',
    archived: 'fova_crm_archived_v1',
    renamed: 'fova_crm_renamed_v1',
    imports: 'fova_crm_import_v1',
    boards: 'fova_boards_v2',
  };
  var CRM_KEYS = ['overrides', 'touch', 'deleted', 'renamed', 'archived'];

  if (!ENABLED) {
    window.FOVASync = { enabled: false };
    log('desligado (sem Supabase configurado) — modo local.');
    return;
  }

  /* ---------- cliente Supabase (sessão persistente 30+ dias) ---------- */
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: {
      persistSession: true,       // guarda a sessão entre aberturas do navegador
      autoRefreshToken: true,     // renova o token sozinho (não cai a cada acesso)
      detectSessionInUrl: true,   // captura o link de recuperação de senha
      storageKey: 'fova_sb_auth',
      flowType: 'pkce',
    },
    realtime: { params: { eventsPerSecond: 20 } },
  });

  /* ---------- estado interno ---------- */
  var me = null;          // perfil do sócio logado { id, nome, cor, iniciais, email }
  var members = [];       // os dois sócios
  var channel = null;     // canal realtime
  var booted = false;     // app já abriu?
  var applying = false;   // aplicando mudança remota (não re-propagar)
  var connState = 'off';  // 'ok' | 'recon' | 'off'
  var presence = {};      // { id: meta } de quem está online
  var liveMarks = {};     // { cardId: {by, kind, nome, cor, ts} } edição/arraste alheio
  var lastCRM = {};       // último snapshot enviado (pra mandar só o que mudou)
  var lastBoards = null;  // último snapshot de quadros enviado (baseline p/ conflito)
  var pendingBoards = false;
  var deferReload = false;

  /* ============================================================
     Utilidades DOM / estilo
     ============================================================ */
  function h(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]; }); }
  function toast(m, kind) { try { if (window.FOVA && window.FOVA.toast) return window.FOVA.toast(m, kind); } catch (e) {} log('toast:', m); }
  function initialsOf(n) { return String(n || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }

  // Paleta de cores de usuário (mesma identidade dos Quadros).
  var USER_COLORS = ['#CBA96E', '#6FA8D0', '#6FB8A6', '#9B8FC9', '#6FBF8B', '#D88A6E', '#E0B05A', '#8A8498'];

  function injectStyle() {
    if (document.getElementById('fova-sync-style')) return;
    var css = [
      '#fovaAuth{position:fixed;inset:0;z-index:400;display:grid;place-items:center;padding:24px;',
      'background:radial-gradient(820px 520px at 50% -5%,rgba(203,169,110,.12),transparent 60%),var(--bg-base,#07070F);font-family:var(--font,Inter,system-ui,sans-serif)}',
      '#fovaAuth[hidden]{display:none}',
      '.fa-card{width:min(440px,100%);background:linear-gradient(180deg,var(--bg-2,#14142A),var(--bg-1,#0D0D1A));border:1px solid var(--line,#2A2A48);border-radius:22px;padding:40px 34px;box-shadow:var(--shadow-2,0 12px 30px -20px rgba(0,0,0,.85));color:var(--text,#F0EDE6)}',
      '.fa-card--wide{width:min(620px,100%)}',
      '.fa-logo{height:30px;margin:0 auto 20px;display:block;opacity:.96}',
      '.fa-eyebrow{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--brand,#CBA96E);font-weight:600;text-align:center}',
      '.fa-title{font-family:var(--serif,Georgia,serif);font-style:italic;font-size:2rem;line-height:1.1;margin:10px 0 6px;text-align:center}',
      '.fa-sub{color:var(--text-2,#A89880);font-size:13.5px;margin-bottom:22px;text-align:center;line-height:1.5}',
      '.fa-form{display:flex;flex-direction:column;gap:12px}',
      '.fa-field{display:flex;flex-direction:column;gap:6px}',
      '.fa-label{font-size:12.5px;color:var(--text-2,#A89880);font-weight:500}',
      '.fa-input{width:100%;height:48px;padding:0 44px 0 14px;font-size:16px;font-family:inherit;background:var(--bg-base,#07070F);border:1px solid var(--line,#2A2A48);border-radius:12px;color:var(--text,#F0EDE6);outline:none;transition:border-color .15s,box-shadow .15s}',
      '.fa-input:focus-visible{border-color:var(--brand,#CBA96E);box-shadow:0 0 0 3px rgba(203,169,110,.18)}',
      '.fa-inputwrap{position:relative}',
      '.fa-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:36px;height:36px;display:grid;place-items:center;background:none;border:none;cursor:pointer;color:var(--text-3,#6E6A78);border-radius:9px}',
      '.fa-eye:hover{color:var(--text-2,#A89880)}.fa-eye svg{width:18px;height:18px}',
      '.fa-btn{height:48px;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-weight:600;font-size:15px;background:linear-gradient(180deg,var(--brand-bright,#EDD5A8),var(--brand,#CBA96E));color:#2a2113;transition:transform .12s ease,filter .15s;letter-spacing:-.01em}',
      '.fa-btn:hover{filter:brightness(1.05)}.fa-btn:active{transform:scale(.985)}',
      '.fa-btn[disabled]{opacity:.55;cursor:not-allowed}',
      '.fa-btn--ghost{background:transparent;border:1px solid var(--line,#2A2A48);color:var(--text,#F0EDE6)}',
      '.fa-link{background:none;border:none;color:var(--brand,#CBA96E);cursor:pointer;font-size:13px;font-family:inherit;padding:4px;text-decoration:underline;text-underline-offset:3px}',
      '.fa-link:hover{color:var(--brand-bright,#EDD5A8)}',
      '.fa-err{color:var(--bad,#D88A6E);font-size:13px;min-height:18px;text-align:center}',
      '.fa-ok{color:var(--ok,#6FBF8B);font-size:13px;text-align:center}',
      '.fa-hint{color:var(--text-3,#6E6A78);font-size:12px;margin-top:16px;line-height:1.55;text-align:center}',
      '.fa-row{display:flex;gap:12px}.fa-row>*{flex:1}',
      '.fa-check{display:flex;align-items:center;gap:9px;color:var(--text-2,#A89880);font-size:13.5px;cursor:pointer;user-select:none}',
      '.fa-check input{width:18px;height:18px;accent-color:var(--brand,#CBA96E)}',
      '.fa-dots{display:flex;justify-content:center;gap:10px;margin-bottom:18px}',
      '.fa-dot{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;color:#2a2113;background:var(--line,#2A2A48)}',
      '.fa-dot.on{background:var(--brand,#CBA96E)}',
      '.fa-swatches{display:flex;gap:8px;flex-wrap:wrap}',
      '.fa-sw{width:30px;height:30px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:transform .12s}',
      '.fa-sw:hover{transform:scale(1.1)}.fa-sw.on{border-color:var(--text,#F0EDE6);box-shadow:0 0 0 2px var(--bg-1,#0D0D1A)}',
      '.fa-spin{width:34px;height:34px;border:3px solid var(--line,#2A2A48);border-top-color:var(--brand,#CBA96E);border-radius:50%;margin:8px auto;animation:faSpin .8s linear infinite}',
      '@keyframes faSpin{to{transform:rotate(360deg)}}',
      // presença + status (barra no topo)
      '#fovaPresence{position:fixed;bottom:18px;right:18px;z-index:140;display:flex;align-items:center;gap:10px;background:rgba(13,13,26,.9);backdrop-filter:blur(8px);border:1px solid var(--line,#2A2A48);border-radius:999px;padding:5px 8px 5px 12px;box-shadow:var(--shadow-2,0 12px 30px -16px rgba(0,0,0,.85))}',
      '#fovaPresence[hidden]{display:none}',
      '.fp-status{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-2,#A89880);font-weight:500}',
      '.fp-dot{width:8px;height:8px;border-radius:50%;background:var(--ok,#6FBF8B);box-shadow:0 0 0 0 rgba(111,191,139,.5)}',
      '.fp-dot.recon{background:var(--warn,#E0B05A);animation:faPulse 1s infinite}',
      '.fp-dot.off{background:var(--bad,#D88A6E)}',
      '@keyframes faPulse{0%{box-shadow:0 0 0 0 rgba(224,176,90,.5)}70%{box-shadow:0 0 0 6px rgba(224,176,90,0)}100%{box-shadow:0 0 0 0 rgba(224,176,90,0)}}',
      '.fp-sep{width:1px;height:20px;background:var(--line,#2A2A48)}',
      '.fp-avs{display:flex}',
      '.fp-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;color:#1a1a2a;border:2px solid var(--bg-1,#0D0D1A);margin-left:-8px;cursor:pointer;transition:transform .12s;position:relative}',
      '.fp-av:first-child{margin-left:0}',
      '.fp-av:hover{transform:translateY(-1px)}',
      '.fp-av.me{box-shadow:0 0 0 2px var(--brand,#CBA96E)}',
      '.fp-av .fp-on{position:absolute;right:-1px;bottom:-1px;width:9px;height:9px;border-radius:50%;background:var(--ok,#6FBF8B);border:2px solid var(--bg-1,#0D0D1A)}',
      '.fp-av.away{opacity:.4;filter:grayscale(.6)}',
      '.fp-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:none;border:none;color:var(--text-2,#A89880);cursor:pointer}',
      '.fp-icon:hover{color:var(--text,#F0EDE6);background:var(--bg-3,#1B1B36)}.fp-icon svg{width:17px;height:17px}',
      // bordas "alguém está mexendo aqui"
      '.fova-live{position:relative;overflow:visible;outline:2px solid var(--lc,#6FA8D0);outline-offset:2px;border-radius:12px;transition:outline-color .2s}',
      '.fova-live::after{content:attr(data-live-who);position:absolute;top:-11px;left:10px;font-size:10.5px;font-weight:700;line-height:1.5;color:#1a1a2a;background:var(--lc,#6FA8D0);padding:2px 9px;border-radius:999px;white-space:nowrap;letter-spacing:.01em;box-shadow:0 2px 6px -2px rgba(0,0,0,.6);z-index:8;pointer-events:none}',
      // gaveta de histórico
      '#fovaHist{position:fixed;top:0;right:0;bottom:0;width:min(380px,92vw);z-index:300;background:linear-gradient(180deg,var(--bg-1,#0D0D1A),var(--bg-base,#07070F));border-left:1px solid var(--line,#2A2A48);box-shadow:-20px 0 40px -30px #000;transform:translateX(100%);transition:transform .22s ease;display:flex;flex-direction:column;color:var(--text,#F0EDE6)}',
      '#fovaHist.open{transform:translateX(0)}',
      '.fh-head{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px;border-bottom:1px solid var(--line-soft,#1E1E38)}',
      '.fh-head h3{font-family:var(--serif,Georgia,serif);font-style:italic;font-size:1.4rem;margin:0}',
      '.fh-list{flex:1;overflow:auto;padding:10px 14px}',
      '.fh-item{display:flex;gap:10px;padding:9px 6px;border-bottom:1px solid var(--line-soft,#1E1E38)}',
      '.fh-av{width:26px;height:26px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:10px;font-weight:700;color:#1a1a2a}',
      '.fh-txt{font-size:13px;line-height:1.4;color:var(--text,#F0EDE6)}',
      '.fh-when{font-size:11px;color:var(--text-3,#6E6A78);margin-top:2px}',
      '.fh-empty{color:var(--text-3,#6E6A78);font-size:13px;text-align:center;padding:30px 10px}',
      '#fovaHistBack{position:fixed;inset:0;z-index:299;background:rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .2s}',
      '#fovaHistBack.open{opacity:1;pointer-events:auto}',
      '@media (max-width:640px){#fovaPresence{top:auto;bottom:12px;right:10px;left:auto;padding:4px 7px 4px 10px}}',
      '@media (prefers-reduced-motion:reduce){.fa-spin{animation-duration:0s}#fovaHist{transition:none}.fp-dot.recon{animation:none}}',
    ].join('\n');
    document.head.appendChild(h('style', { id: 'fova-sync-style' }, css));
  }

  var SVG = {
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    hist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4"/><path d="M12 8v4l3 2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };

  /* ============================================================
     Camada de autenticação (telas)
     ============================================================ */
  var authEl = null;
  function authHost() {
    if (!authEl) { authEl = h('div', { id: 'fovaAuth' }); document.body.appendChild(authEl); }
    authEl.hidden = false;
    return authEl;
  }
  function hideAuth() { if (authEl) authEl.hidden = true; }

  function card(innerHTML, wide) {
    var host = authHost();
    host.innerHTML = '<div class="fa-card' + (wide ? ' fa-card--wide' : '') + '">' +
      '<img class="fa-logo" src="/public/fova-white-crop.svg" alt="FOVA"/>' + innerHTML + '</div>';
    return host.querySelector('.fa-card');
  }

  function screenLoading(msg) {
    card('<div class="fa-spin"></div><p class="fa-sub" style="margin:10px 0 0">' + esc(msg || 'Carregando…') + '</p>');
  }

  // Tela de ABERTURA: decide entre configuração inicial (0 contas) e login.
  function screenBoot() {
    screenLoading('Conectando…');
    sb.rpc('profiles_count').then(function (r) {
      var n = (r && typeof r.data === 'number') ? r.data : 0;
      if (r && r.error) { log('profiles_count erro', r.error); }
      if (n <= 0) screenSetup(); else screenLogin();
    }).catch(function (e) { log('profiles_count falhou', e); screenLogin(); });
  }

  function wireEye(cardEl) {
    cardEl.querySelectorAll('.fa-eye').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inp = btn.parentNode.querySelector('.fa-input');
        var show = inp.type === 'password';
        inp.type = show ? 'text' : 'password'; inp.focus();
      });
    });
  }

  // ---------- LOGIN ----------
  var LOCK_KEY = 'fova_login_lock';
  function loginLock() { try { return JSON.parse(localStorage.getItem(LOCK_KEY) || '{}'); } catch (e) { return {}; } }
  function setLoginLock(o) { try { localStorage.setItem(LOCK_KEY, JSON.stringify(o)); } catch (e) {} }

  function screenLogin(prefillEmail, note) {
    var c = card(
      '<div class="fa-eyebrow">Área administrativa</div>' +
      '<h1 class="fa-title">CRM da Fova</h1>' +
      '<p class="fa-sub">Entre com sua conta de sócio.</p>' +
      (note ? '<p class="fa-ok" style="margin:-10px 0 14px">' + esc(note) + '</p>' : '') +
      '<form class="fa-form" id="faLoginForm" autocomplete="on">' +
      '<div class="fa-field"><label class="fa-label" for="faEmail">E-mail</label>' +
      '<input class="fa-input" id="faEmail" type="email" autocomplete="username" required value="' + esc(prefillEmail || '') + '" placeholder="voce@fova.com.br"></div>' +
      '<div class="fa-field"><label class="fa-label" for="faPass">Senha</label>' +
      '<div class="fa-inputwrap"><input class="fa-input" id="faPass" type="password" autocomplete="current-password" required placeholder="Sua senha">' +
      '<button class="fa-eye" type="button" aria-label="Mostrar senha">' + SVG.eye + '</button></div></div>' +
      '<label class="fa-check"><input type="checkbox" id="faKeep" checked> Manter conectado neste aparelho (30 dias)</label>' +
      '<button class="fa-btn" type="submit">Entrar</button>' +
      '<div class="fa-err" id="faErr" role="alert" aria-live="polite"></div>' +
      '</form>' +
      '<div style="text-align:center;margin-top:6px"><button class="fa-link" id="faForgot" type="button">Esqueci minha senha</button></div>' +
      '<p class="fa-hint">A sessão fica protegida e os dados só abrem depois do login.</p>'
    );
    wireEye(c);
    var form = c.querySelector('#faLoginForm'), err = c.querySelector('#faErr');
    c.querySelector('#faForgot').addEventListener('click', function () { screenForgot(form.querySelector('#faEmail').value); });

    function paintLock() {
      var l = loginLock();
      if (l.until && l.until > Date.now()) {
        var secs = Math.ceil((l.until - Date.now()) / 1000);
        err.textContent = 'Muitas tentativas. Tente de novo em ' + secs + 's.';
        form.querySelector('.fa-btn').disabled = true;
        setTimeout(paintLock, 1000);
      } else { form.querySelector('.fa-btn').disabled = false; }
    }
    paintLock();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var l = loginLock(); if (l.until && l.until > Date.now()) return;
      var email = form.querySelector('#faEmail').value.trim();
      var pass = form.querySelector('#faPass').value;
      var keep = form.querySelector('#faKeep').checked;
      var btn = form.querySelector('.fa-btn'); btn.disabled = true; err.textContent = '';
      try { sessionStorage.setItem('fova_keep', keep ? '1' : '0'); } catch (x) {}
      sb.auth.signInWithPassword({ email: email, password: pass }).then(function (r) {
        if (r.error) {
          var l2 = loginLock(); l2.fails = (l2.fails || 0) + 1;
          if (l2.fails >= 5) { l2.until = Date.now() + 60000; l2.fails = 0; }
          setLoginLock(l2);
          err.textContent = 'E-mail ou senha incorretos.';
          btn.disabled = false; form.querySelector('#faPass').select();
          return;
        }
        setLoginLock({});   // zera o contador de tentativas
        // o onAuthStateChange cuida do resto (perfil, decifragem, boot).
      }).catch(function (x) { err.textContent = 'Falha de conexão. Tente de novo.'; btn.disabled = false; });
    });
    setTimeout(function () { try { c.querySelector(prefillEmail ? '#faPass' : '#faEmail').focus(); } catch (e) {} }, 60);
  }

  // ---------- ESQUECI A SENHA ----------
  function screenForgot(email) {
    var c = card(
      '<div class="fa-eyebrow">Recuperar acesso</div>' +
      '<h1 class="fa-title">Esqueceu a senha?</h1>' +
      '<p class="fa-sub">Enviamos um link de redefinição pro seu e-mail.</p>' +
      '<form class="fa-form" id="faForgotForm">' +
      '<div class="fa-field"><label class="fa-label" for="faFEmail">E-mail</label>' +
      '<input class="fa-input" id="faFEmail" type="email" required value="' + esc(email || '') + '" placeholder="voce@fova.com.br"></div>' +
      '<button class="fa-btn" type="submit">Enviar link</button>' +
      '<div class="fa-err" id="faFErr" role="alert" aria-live="polite"></div>' +
      '</form>' +
      '<div style="text-align:center;margin-top:8px"><button class="fa-link" id="faBack" type="button">Voltar ao login</button></div>'
    );
    c.querySelector('#faBack').addEventListener('click', function () { screenLogin(email); });
    var form = c.querySelector('#faForgotForm'), err = c.querySelector('#faFErr');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = form.querySelector('#faFEmail').value.trim();
      var btn = form.querySelector('.fa-btn'); btn.disabled = true;
      sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname }).then(function (r) {
        if (r.error) { err.textContent = 'Não consegui enviar. Confira o e-mail.'; btn.disabled = false; return; }
        card('<div class="fa-eyebrow">Recuperar acesso</div><h1 class="fa-title">Confira seu e-mail</h1>' +
          '<p class="fa-sub">Se existir uma conta com esse e-mail, o link de redefinição chegou. Ele expira em 1 hora.</p>' +
          '<button class="fa-btn" id="faBack2" type="button">Voltar ao login</button>');
        authEl.querySelector('#faBack2').addEventListener('click', function () { screenLogin(em); });
      });
    });
  }

  // ---------- NOVA SENHA (chega pelo link de recuperação) ----------
  function screenReset() {
    var c = card(
      '<div class="fa-eyebrow">Recuperar acesso</div>' +
      '<h1 class="fa-title">Defina uma nova senha</h1>' +
      '<p class="fa-sub">Escolha uma senha com pelo menos 8 caracteres.</p>' +
      '<form class="fa-form" id="faResetForm">' +
      '<div class="fa-field"><label class="fa-label" for="faNew">Nova senha</label>' +
      '<div class="fa-inputwrap"><input class="fa-input" id="faNew" type="password" minlength="8" required autocomplete="new-password">' +
      '<button class="fa-eye" type="button" aria-label="Mostrar senha">' + SVG.eye + '</button></div></div>' +
      '<button class="fa-btn" type="submit">Salvar nova senha</button>' +
      '<div class="fa-err" id="faRErr" role="alert" aria-live="polite"></div></form>'
    );
    wireEye(c);
    var form = c.querySelector('#faResetForm'), err = c.querySelector('#faRErr');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = form.querySelector('#faNew').value;
      if (pw.length < 8) { err.textContent = 'Use pelo menos 8 caracteres.'; return; }
      var btn = form.querySelector('.fa-btn'); btn.disabled = true;
      sb.auth.updateUser({ password: pw }).then(function (r) {
        if (r.error) { err.textContent = 'Não deu pra salvar: ' + r.error.message; btn.disabled = false; return; }
        toast('Senha atualizada.', 'ok');
        afterAuthenticated();
      });
    });
  }

  // ---------- CONFIGURAÇÃO INICIAL (cadastrar os dois sócios) ----------
  function screenSetup() {
    var step = 0;              // 0 = sócio 1, 1 = sócio 2, 2 = senha dos dados
    var data = [{ cor: USER_COLORS[0] }, { cor: USER_COLORS[1] }];
    draw();

    function dots() {
      return '<div class="fa-dots">' +
        '<span class="fa-dot' + (step >= 0 ? ' on' : '') + '">1</span>' +
        '<span class="fa-dot' + (step >= 1 ? ' on' : '') + '">2</span>' +
        '<span class="fa-dot' + (step >= 2 ? ' on' : '') + '">3</span></div>';
    }
    function swatches(sel) {
      return '<div class="fa-swatches">' + USER_COLORS.map(function (col) {
        return '<button type="button" class="fa-sw' + (col === sel ? ' on' : '') + '" data-col="' + col + '" style="background:' + col + '" aria-label="Cor ' + col + '"></button>';
      }).join('') + '</div>';
    }
    function partnerStep(i) {
      var d = data[i];
      var c = card(dots() +
        '<div class="fa-eyebrow">Configuração inicial</div>' +
        '<h1 class="fa-title">Sócio ' + (i + 1) + '</h1>' +
        '<p class="fa-sub">Crie a conta ' + (i === 0 ? 'do primeiro' : 'do segundo') + ' sócio. Os dois são administradores.</p>' +
        '<form class="fa-form" id="faSForm">' +
        '<div class="fa-field"><label class="fa-label" for="sNome">Nome</label><input class="fa-input" id="sNome" required value="' + esc(d.nome || '') + '" placeholder="Nome e sobrenome"></div>' +
        '<div class="fa-field"><label class="fa-label" for="sEmail">E-mail</label><input class="fa-input" id="sEmail" type="email" required value="' + esc(d.email || '') + '" placeholder="socio@fova.com.br"></div>' +
        '<div class="fa-field"><label class="fa-label" for="sPass">Senha</label><div class="fa-inputwrap"><input class="fa-input" id="sPass" type="password" minlength="8" required autocomplete="new-password" value="' + esc(d.pass || '') + '" placeholder="Mínimo 8 caracteres"><button class="fa-eye" type="button" aria-label="Mostrar senha">' + SVG.eye + '</button></div></div>' +
        '<div class="fa-field"><label class="fa-label">Cor de identificação</label>' + swatches(d.cor) + '</div>' +
        '<button class="fa-btn" type="submit">' + (i === 0 ? 'Próximo sócio' : 'Próximo') + '</button>' +
        (i === 1 ? '<button class="fa-btn fa-btn--ghost" type="button" id="sBack">Voltar</button>' : '') +
        '<div class="fa-err" id="sErr"></div></form>', true);
      wireEye(c);
      c.querySelectorAll('.fa-sw').forEach(function (b) { b.addEventListener('click', function () { d.cor = b.dataset.col; c.querySelectorAll('.fa-sw').forEach(function (x) { x.classList.toggle('on', x === b); }); }); });
      var back = c.querySelector('#sBack'); if (back) back.addEventListener('click', function () { step = 0; draw(); });
      c.querySelector('#faSForm').addEventListener('submit', function (e) {
        e.preventDefault();
        d.nome = c.querySelector('#sNome').value.trim();
        d.email = c.querySelector('#sEmail').value.trim().toLowerCase();
        d.pass = c.querySelector('#sPass').value;
        var err = c.querySelector('#sErr');
        if (d.pass.length < 8) { err.textContent = 'A senha precisa de pelo menos 8 caracteres.'; return; }
        if (i === 1 && data[0].email === d.email) { err.textContent = 'Os dois sócios precisam de e-mails diferentes.'; return; }
        step = i + 1; draw();
      });
    }
    function dataKeyStep() {
      var needPw = !!(window.FOVA_GATE && window.FOVA_GATE.needsPassword && window.FOVA_GATE.needsPassword());
      var c = card(dots() +
        '<div class="fa-eyebrow">Configuração inicial</div>' +
        '<h1 class="fa-title">' + (needPw ? 'Senha dos dados' : 'Tudo pronto') + '</h1>' +
        '<p class="fa-sub">' + (needPw
          ? 'Sua base de leads está criptografada. Informe a senha atual uma única vez — ela fica guardada com segurança no seu banco e os dois sócios passam a abrir o CRM direto, sem digitar de novo.'
          : 'Vou criar as duas contas e já deixar tudo conectado.') + '</p>' +
        '<form class="fa-form" id="faKForm">' +
        (needPw ? '<div class="fa-field"><label class="fa-label" for="sKey">Senha atual dos dados</label><div class="fa-inputwrap"><input class="fa-input" id="sKey" type="password" required autocomplete="off"><button class="fa-eye" type="button" aria-label="Mostrar senha">' + SVG.eye + '</button></div></div>' : '') +
        '<button class="fa-btn" type="submit">Criar contas e começar</button>' +
        '<button class="fa-btn fa-btn--ghost" type="button" id="kBack">Voltar</button>' +
        '<div class="fa-err" id="kErr"></div></form>');
      wireEye(c);
      c.querySelector('#kBack').addEventListener('click', function () { step = 1; draw(); });
      c.querySelector('#faKForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var err = c.querySelector('#kErr');
        var key = needPw ? c.querySelector('#sKey').value : '';
        (needPw ? Promise.resolve(window.FOVA_GATE.unlock(key)) : Promise.resolve(true)).then(function (ok) {
          if (!ok) { err.textContent = 'Senha dos dados incorreta. Confira e tente de novo.'; return; }
          runSetup(data, key);
        });
      });
    }
    function draw() { if (step === 0) partnerStep(0); else if (step === 1) partnerStep(1); else dataKeyStep(); }
  }

  // Cria as duas contas + perfis + guarda a senha dos dados; depois manda logar.
  function runSetup(data, dataKey) {
    screenLoading('Criando as contas…');
    var createdKey = false;
    function makePartner(i) {
      var d = data[i];
      return sb.auth.signUp({ email: d.email, password: d.pass }).then(function (r) {
        if (r.error) throw new Error(r.error.message);
        var uid = r.data && r.data.user && r.data.user.id;
        if (!r.data.session) {
          // Confirmação de e-mail ligada: não dá sessão imediata.
          throw new Error('NO_SESSION');
        }
        return sb.from('profiles').upsert({
          id: uid, nome: d.nome, email: d.email, cor: d.cor, iniciais: initialsOf(d.nome), role: 'admin', updated_at: new Date().toISOString(),
        }).then(function (pr) {
          if (pr.error) throw new Error(pr.error.message);
          if (i === 0 && dataKey != null) {
            return sb.from('app_state').upsert({ key: 'datakey', data: { k: dataKey }, updated_at: new Date().toISOString(), updated_by: uid }).then(function (kr) {
              if (!kr.error) createdKey = true;
            });
          }
        });
      });
    }
    makePartner(0).then(function () { return makePartner(1); }).then(function () {
      return sb.auth.signOut();
    }).then(function () {
      screenLogin(data[0].email, 'Contas criadas! Faça login para começar.');
    }).catch(function (e) {
      if (String(e.message) === 'NO_SESSION') {
        card('<div class="fa-eyebrow">Configuração inicial</div><h1 class="fa-title">Confirmação de e-mail ativa</h1>' +
          '<p class="fa-sub">O Supabase está exigindo confirmação de e-mail. Para a configuração dos dois sócios funcionar de uma vez, desligue <b>Confirm email</b> em Authentication → Providers → Email no painel do Supabase e tente de novo.</p>' +
          '<button class="fa-btn" id="kRetry" type="button">Tentar de novo</button>');
        authEl.querySelector('#kRetry').addEventListener('click', screenBoot);
      } else {
        card('<div class="fa-eyebrow">Configuração inicial</div><h1 class="fa-title">Deu um problema</h1>' +
          '<p class="fa-sub">' + esc(e.message || 'Erro ao criar as contas.') + '</p>' +
          '<button class="fa-btn" id="kRetry" type="button">Voltar</button>');
        authEl.querySelector('#kRetry').addEventListener('click', screenBoot);
      }
    });
  }

  /* ============================================================
     Pós-login: garantir perfil, decifrar dados, abrir o app
     ============================================================ */
  function ensureProfile(user) {
    return sb.from('profiles').select('*').eq('id', user.id).maybeSingle().then(function (r) {
      if (r.data) return r.data;
      // Primeiro acesso: cria o perfil com um nome provisório (editável em "Meu perfil").
      var nome = (user.user_metadata && user.user_metadata.nome) || (user.email || '').split('@')[0];
      var cor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      var row = { id: user.id, nome: nome, email: user.email, cor: cor, iniciais: initialsOf(nome), role: 'admin', updated_at: new Date().toISOString() };
      return sb.from('profiles').upsert(row).then(function () { return row; });
    });
  }

  function loadMembers() {
    return sb.from('profiles').select('*').then(function (r) { members = (r.data || []).slice(); return members; });
  }

  // Lê a senha dos dados guardada no banco e decifra; se não existir, pede uma vez.
  function unlockData() {
    if (!(window.FOVA_GATE && window.FOVA_GATE.needsPassword && window.FOVA_GATE.needsPassword())) {
      // Base em texto puro (window.CRM): destrava com a senha-padrão só pra montar o BASELINE.
      try { return Promise.resolve(window.FOVA_GATE.unlock(window.CRM_PASS || 'fova2026')).then(function () { return true; }); } catch (e) { return Promise.resolve(true); }
    }
    return sb.from('app_state').select('data').eq('key', 'datakey').maybeSingle().then(function (r) {
      var key = r.data && r.data.data && r.data.data.k;
      if (key != null) return Promise.resolve(window.FOVA_GATE.unlock(key));
      return askDataKey();
    });
  }
  function askDataKey() {
    return new Promise(function (resolve) {
      var c = card('<div class="fa-eyebrow">Quase lá</div><h1 class="fa-title">Senha dos dados</h1>' +
        '<p class="fa-sub">Informe a senha atual da base (uma única vez). Ela fica guardada com segurança no seu banco.</p>' +
        '<form class="fa-form" id="faDK"><div class="fa-field"><label class="fa-label" for="dkIn">Senha dos dados</label>' +
        '<div class="fa-inputwrap"><input class="fa-input" id="dkIn" type="password" required><button class="fa-eye" type="button" aria-label="Mostrar senha">' + SVG.eye + '</button></div></div>' +
        '<button class="fa-btn" type="submit">Abrir CRM</button><div class="fa-err" id="dkErr"></div></form>');
      wireEye(c);
      c.querySelector('#faDK').addEventListener('submit', function (e) {
        e.preventDefault();
        var key = c.querySelector('#dkIn').value;
        Promise.resolve(window.FOVA_GATE.unlock(key)).then(function (ok) {
          if (!ok) { c.querySelector('#dkErr').textContent = 'Senha incorreta.'; return; }
          sb.from('app_state').upsert({ key: 'datakey', data: { k: key }, updated_at: new Date().toISOString(), updated_by: me && me.id }).then(function () { resolve(true); });
        });
      });
    });
  }

  var authBusy = false;
  function afterAuthenticated() {
    if (authBusy || booted) return; authBusy = true;
    screenLoading('Carregando seu CRM…');
    sb.auth.getUser().then(function (u) {
      var user = u.data && u.data.user;
      if (!user) { authBusy = false; screenLogin(); return; }
      ensureProfile(user).then(function (p) {
        me = p;
        return loadMembers();
      }).then(function () {
        return unlockData();
      }).then(function (ok) {
        if (ok === false) { authBusy = false; screenLogin(); return; }
        return hydrateFromServer();
      }).then(function () {
        openApp();
      }).catch(function (e) {
        authBusy = false;
        log('afterAuthenticated erro', e);
        card('<h1 class="fa-title">Não consegui abrir</h1><p class="fa-sub">' + esc(e && e.message || 'Erro inesperado.') + '</p><button class="fa-btn" id="rb" type="button">Tentar de novo</button>');
        authEl.querySelector('#rb').addEventListener('click', afterAuthenticated);
      });
    });
  }

  // Puxa o estado compartilhado do servidor ANTES de abrir (first paint já sincronizado).
  function hydrateFromServer() {
    applying = true;
    var jobs = [
      sb.from('crm_cards').select('*'),
      sb.from('app_state').select('*'),
    ];
    return Promise.all(jobs).then(function (res) {
      var cards = res[0].data || [];
      var state = res[1].data || [];
      // CRM: reconstrói os 5 mapas a partir das linhas por empresa.
      var maps = { overrides: {}, touch: {}, deleted: {}, archived: {}, renamed: {} };
      cards.forEach(function (row) {
        var k = row.company_key;
        if (row.ov != null) maps.overrides[k] = row.ov;
        if (row.touch != null) maps.touch[k] = row.touch;
        if (row.deleted) maps.deleted[k] = 1;
        if (row.archived != null) maps.archived[k] = row.archived;
        if (row.renamed) maps.renamed[k] = 1;
      });
      // Mescla com o que já existe local (migração: nada do que foi digitado some).
      CRM_KEYS.forEach(function (which) {
        var local = readLS(LS[which]) || {};
        var merged = Object.assign({}, local, maps[which]);
        writeLS(LS[which], merged);
      });
      // tombstones primeiro (local + servidor), pra o merge dos quadros já respeitar
      dead = loadDead();
      state.forEach(function (s) { if (s.key === 'boards_dead' && s.data) Object.assign(dead, s.data); });
      saveDead(dead);
      state.forEach(function (s) {
        if (s.key === 'import' && s.data) writeLS(LS.imports, mergeImports(readLS(LS.imports), s.data));
        if (s.key === 'boards' && s.data) {
          var localB = readLS(LS.boards);
          writeLS(LS.boards, applyDead(localB ? mergeBoards(localB, s.data) : s.data, dead));
        }
      });
      // Primeira vez com Supabase: sobe o que só existe local pro servidor.
      snapshotCRMBaseline();
      return pushLocalToServerInitial();
    }).then(function () { applying = false; }).catch(function (e) { applying = false; log('hydrate erro', e); });
  }

  // Sobe pro servidor o que existe só no aparelho (migração inicial, sem perder nada).
  function pushLocalToServerInitial() {
    var rows = buildChangedCRMRows(true);
    var jobs = [];
    if (rows.length) jobs.push(sb.from('crm_cards').upsert(rows));
    var imp = readLS(LS.imports); if (imp) jobs.push(sb.from('app_state').upsert({ key: 'import', data: imp, updated_at: new Date().toISOString(), updated_by: me.id }));
    var bo = readLS(LS.boards); if (bo) jobs.push(sb.from('app_state').upsert({ key: 'boards', data: bo, version: Date.now(), updated_at: new Date().toISOString(), updated_by: me.id }));
    if (dead && Object.keys(dead).length) jobs.push(sb.from('app_state').upsert({ key: 'boards_dead', data: dead, version: Date.now(), updated_at: new Date().toISOString(), updated_by: me.id }));
    lastBoards = bo;
    return jobs.length ? Promise.all(jobs) : Promise.resolve();
  }

  function openApp() {
    // injeta a identidade real nos Quadros (membros + "eu")
    injectBoardIdentity();
    hideAuth();
    // esconde a antiga tela de senha e abre o app pelo gancho do app.js
    try {
      var lock = document.getElementById('lock'); if (lock) lock.hidden = true;
      if (window.FOVA_GATE && window.FOVA_GATE.open) window.FOVA_GATE.open();
    } catch (e) { log('openApp gate erro', e); }
    booted = true;
    startRealtime();
    mountPresenceBar();
  }

  // Garante que os dois sócios sejam os "membros" dos Quadros e que "eu" seja eu.
  function injectBoardIdentity() {
    try {
      var S = readLS(LS.boards);
      if (!S) return;
      S.members = S.members || [];
      members.forEach(function (p) {
        var ex = S.members.find(function (m) { return m.id === p.id; });
        if (ex) { ex.name = p.nome; ex.color = p.cor; ex.role = 'admin'; }
        else S.members.push({ id: p.id, name: p.nome, color: p.cor, role: 'admin' });
      });
      S.prefs = S.prefs || {};
      S.prefs.currentUserId = me.id;
      applying = true; writeLS(LS.boards, S); applying = false;
    } catch (e) { log('injectBoardIdentity', e); }
  }

  /* ============================================================
     localStorage: leitura/escrita + interceptação de mudanças
     ============================================================ */
  function readLS(k) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function writeLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // Intercepta setItem pra detectar mudanças locais SEM editar app.js/boards.js.
  var rawSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, val) {
    rawSetItem(key, val);
    if (applying || !booted) return;        // não re-propaga o que veio de fora
    try {
      if (key === LS.imports) scheduleImportPush();
      else if (key === LS.boards) scheduleBoardsPush();
      else { for (var w in LS) { if (LS[w] === key && CRM_KEYS.indexOf(w) >= 0) { scheduleCRMPush(); break; } } }
    } catch (e) { log('setItem hook', e); }
  };

  /* ---------- CRM: envia só as empresas que mudaram ---------- */
  function snapshotCRMBaseline() {
    lastCRM = {}; CRM_KEYS.forEach(function (w) { lastCRM[w] = readLS(LS[w]) || {}; });
  }
  function buildChangedCRMRows(all) {
    var cur = {}; CRM_KEYS.forEach(function (w) { cur[w] = readLS(LS[w]) || {}; });
    var keys = {};
    CRM_KEYS.forEach(function (w) {
      Object.keys(cur[w]).forEach(function (k) { keys[k] = 1; });
      Object.keys(lastCRM[w] || {}).forEach(function (k) { keys[k] = 1; });
    });
    var rows = [];
    Object.keys(keys).forEach(function (k) {
      var changed = all;
      CRM_KEYS.forEach(function (w) { if (JSON.stringify(cur[w][k]) !== JSON.stringify((lastCRM[w] || {})[k])) changed = true; });
      if (!changed) return;
      rows.push({
        company_key: k,
        ov: cur.overrides[k] != null ? cur.overrides[k] : null,
        touch: cur.touch[k] != null ? cur.touch[k] : null,
        deleted: !!cur.deleted[k],
        archived: cur.archived[k] != null ? cur.archived[k] : null,
        renamed: !!cur.renamed[k],
        updated_at: new Date().toISOString(),
        updated_by: me && me.id,
      });
    });
    lastCRM = cur;
    return rows;
  }
  var crmT = null;
  function scheduleCRMPush() { clearTimeout(crmT); crmT = setTimeout(pushCRM, 180); }
  function pushCRM() {
    var rows = buildChangedCRMRows(false);
    if (!rows.length) return;
    sb.from('crm_cards').upsert(rows).then(function (r) {
      if (r.error) { log('pushCRM erro', r.error); markConn('recon'); return; }
      markConn('ok');
      rows.forEach(function (row) { logActivity(crmVerb(row), prettyKey(row.company_key), 'crm'); });
    });
  }
  function crmVerb(row) { if (row.deleted) return 'apagou o contato'; if (row.archived) return 'arquivou o lead'; if (row.renamed) return 'renomeou'; return 'atualizou'; }
  function prettyKey(k) { try { var ov = (readLS(LS.overrides) || {})[k]; return (ov && ov.empresa) || k; } catch (e) { return k; } }

  /* ---------- Imports ---------- */
  var impT = null;
  function scheduleImportPush() { clearTimeout(impT); impT = setTimeout(function () {
    var imp = readLS(LS.imports); if (!imp) return;
    sb.from('app_state').upsert({ key: 'import', data: imp, updated_at: new Date().toISOString(), updated_by: me.id }).then(function (r) { markConn(r.error ? 'recon' : 'ok'); });
  }, 300); }
  function mergeImports(a, b) {
    if (!a) return b; if (!b) return a;
    var out = { leads: [], decisores: [] };
    ['leads', 'decisores'].forEach(function (f) {
      var m = new Map(); (a[f] || []).concat(b[f] || []).forEach(function (x) { m.set((x.empresa || '').toLowerCase().trim(), x); });
      out[f] = Array.from(m.values());
    });
    return out;
  }

  /* ---------- Quadros: snapshot + merge estrutural + tombstones ---------- */
  // Exclusões viajam como "tombstones" (marcas de id apagado). Como os ids de
  // quadro/coluna/cartão nunca são reaproveitados, um id morto fica morto para
  // sempre — então apagar em um computador apaga no outro, de verdade.
  var LS_DEAD = 'fova_boards_dead';
  var dead = {};
  function loadDead() { try { return JSON.parse(localStorage.getItem(LS_DEAD) || '{}'); } catch (e) { return {}; } }
  function saveDead(d) { try { rawSetItem(LS_DEAD, JSON.stringify(d)); } catch (e) {} }
  function collectIds(S) {
    var ids = {};
    (S && S.boards || []).forEach(function (b) { ids[b.id] = 1; (b.columns || []).forEach(function (c) { ids[c.id] = 1; }); (b.cards || []).forEach(function (c) { ids[c.id] = 1; }); });
    return ids;
  }
  function applyDead(S, d) {
    if (!S || !d) return S;
    S.boards = (S.boards || []).filter(function (b) { return !d[b.id]; });
    S.boards.forEach(function (b) {
      b.columns = (b.columns || []).filter(function (c) { return !d[c.id]; });
      b.cards = (b.cards || []).filter(function (c) { return !d[c.id]; });
    });
    return S;
  }

  var boardsT = null;
  function scheduleBoardsPush() { pendingBoards = true; clearTimeout(boardsT); boardsT = setTimeout(pushBoards, 500); }
  function pushBoards() {
    if (!pendingBoards) return; pendingBoards = false;
    var S = readLS(LS.boards); if (!S) return;
    // detecta o que foi apagado desde o último envio e vira tombstone
    try {
      var prevIds = collectIds(lastBoards), curIds = collectIds(S), t = Date.now(), changed = false;
      Object.keys(prevIds).forEach(function (id) { if (!curIds[id] && !dead[id]) { dead[id] = t; changed = true; } });
      if (changed) {
        saveDead(dead);
        sb.from('app_state').upsert({ key: 'boards_dead', data: dead, version: Date.now(), updated_at: new Date().toISOString(), updated_by: me.id }).then(function (r) { markConn(r.error ? 'recon' : 'ok'); });
      }
    } catch (e) { log('tombstone', e); }
    // histórico: cartões que mudaram desde o último envio
    try { diffBoardsForActivity(lastBoards, S); } catch (e) {}
    lastBoards = S;
    sb.from('app_state').upsert({ key: 'boards', data: S, version: Date.now(), updated_at: new Date().toISOString(), updated_by: me.id }).then(function (r) {
      markConn(r.error ? 'recon' : 'ok');
    });
  }
  function applyRemoteDead(d) {
    if (!d) return;
    var changed = false;
    Object.keys(d).forEach(function (id) { if (!dead[id]) { dead[id] = d[id]; changed = true; } });
    if (!changed) return;
    saveDead(dead);
    var S = readLS(LS.boards);
    if (S) { applyDead(S, dead); applying = true; writeLS(LS.boards, S); applying = false; lastBoards = S; safeReloadBoards(); }
  }
  function diffBoardsForActivity(prev, cur) {
    if (!prev) return;
    function idx(S) {
      var b = {}, co = {}, ca = {};
      (S.boards || []).forEach(function (bd) {
        b[bd.id] = bd;
        (bd.columns || []).forEach(function (c) { co[c.id] = { c: c, b: bd }; });
        (bd.cards || []).forEach(function (c) { ca[c.id] = { c: c, b: bd }; });
      });
      return { b: b, co: co, ca: ca };
    }
    var P = idx(prev), C = idx(cur);
    // quadros
    Object.keys(C.b).forEach(function (id) {
      var p = P.b[id], c = C.b[id];
      if (!p) { logActivity('criou o quadro', c.name, 'board'); return; }
      if (p.name !== c.name) logActivity('renomeou o quadro para', c.name, 'board');
      if (!p.archived && c.archived) logActivity('arquivou o quadro', c.name, 'board');
      else if (p.archived && !c.archived) logActivity('restaurou o quadro', c.name, 'board');
    });
    Object.keys(P.b).forEach(function (id) { if (!C.b[id]) logActivity('excluiu o quadro', P.b[id].name, 'board'); });
    // colunas
    Object.keys(C.co).forEach(function (id) {
      var p = P.co[id], c = C.co[id];
      if (!p) { logActivity('criou a coluna', c.c.name, 'board'); return; }
      if (p.c.name !== c.c.name) logActivity('renomeou a coluna para', c.c.name, 'board');
      if (!p.c.archived && c.c.archived) logActivity('arquivou a coluna', c.c.name, 'board');
    });
    Object.keys(P.co).forEach(function (id) { if (!C.co[id]) logActivity('excluiu a coluna', P.co[id].c.name, 'board'); });
    // cartões
    Object.keys(C.ca).forEach(function (id) {
      var p = P.ca[id], c = C.ca[id];
      if (!p) { logActivity('criou o cartão', c.c.title, 'board'); return; }
      if (!p.c.archived && c.c.archived) { logActivity('arquivou o cartão', c.c.title, 'board'); return; }
      if (p.c.archived && !c.c.archived) { logActivity('restaurou o cartão', c.c.title, 'board'); return; }
      if (p.c.columnId !== c.c.columnId) {
        var col = (c.b.columns || []).find(function (x) { return x.id === c.c.columnId; });
        logActivity('moveu o cartão', c.c.title + (col ? ' → ' + col.name : ''), 'board');
      } else if ((c.c.updatedAt || 0) > (p.c.updatedAt || 0)) logActivity('editou o cartão', c.c.title, 'board');
    });
    Object.keys(P.ca).forEach(function (id) { if (!C.ca[id]) logActivity('excluiu o cartão', P.ca[id].c.title, 'board'); });
  }

  // Mescla dois estados de Quadros preservando edições de cartões diferentes.
  function mergeBoards(localS, remoteS) {
    try {
      if (!localS) return remoteS; if (!remoteS) return localS;
      var out = JSON.parse(JSON.stringify(localS));
      var lb = {}; out.boards.forEach(function (b) { lb[b.id] = b; });
      (remoteS.boards || []).forEach(function (rb) {
        var local = lb[rb.id];
        if (!local) { out.boards.push(JSON.parse(JSON.stringify(rb))); return; }
        var remoteNewer = (rb.updatedAt || 0) >= (local.updatedAt || 0);
        // meta + estrutura de colunas: lado com updatedAt maior
        if (remoteNewer) { local.name = rb.name; local.color = rb.color; local.archived = rb.archived; local.columns = rb.columns; local.labels = rb.labels || local.labels; local.automations = rb.automations || local.automations; local.updatedAt = rb.updatedAt; }
        // cartões: união por id, cada um vence por updatedAt
        var byId = {}; (local.cards || []).forEach(function (c) { byId[c.id] = c; });
        (rb.cards || []).forEach(function (rc) {
          var lc = byId[rc.id];
          if (!lc) { // existe só no remoto
            // só ressuscita se foi criado/editado depois do nosso board
            if ((rc.updatedAt || 0) >= (local.updatedAt || 0) || remoteNewer) { local.cards.push(rc); byId[rc.id] = rc; }
          } else if ((rc.updatedAt || 0) > (lc.updatedAt || 0)) {
            if (conflictBetween(lc, rc)) toast('Alguém editou "' + (rc.title || 'um cartão') + '" ao mesmo tempo — mantive a versão mais recente.', 'warn');
            Object.assign(lc, rc);
          }
        });
        // remoções: cartão sumiu do lado mais novo
        if (remoteNewer) {
          var rids = {}; (rb.cards || []).forEach(function (c) { rids[c.id] = 1; });
          local.cards = local.cards.filter(function (c) { return rids[c.id] || (c.updatedAt || 0) > (rb.updatedAt || 0); });
        }
      });
      // prefs: mantém as minhas (quadro aberto, densidade…)
      applyDead(out, dead);   // tira o que foi apagado (em qualquer um dos lados)
      return out;
    } catch (e) { log('mergeBoards erro', e); return remoteS || localS; }
  }
  function conflictBetween(a, b) {
    // "conflito real" = os dois mexeram no mesmo campo-texto com valores diferentes
    return (a.title !== b.title && a.title && b.title) || (a.desc !== b.desc && a.desc && b.desc);
  }

  /* ============================================================
     Realtime: postgres_changes + presença + broadcast
     ============================================================ */
  function startRealtime() {
    if (channel) { try { sb.removeChannel(channel); } catch (e) {} channel = null; }
    channel = sb.channel('fova-crm', { config: { presence: { key: me.id }, broadcast: { self: false } } });

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'crm_cards' }, function (p) {
      if (p.new && p.new.updated_by === me.id) return;  // minha própria escrita
      applyRemoteCRM(p.new || p.old);
    });
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, function (p) {
      var row = p.new || p.old; if (!row) return;
      if (row.updated_by === me.id) return;
      if (row.key === 'boards') applyRemoteBoards(row.data);
      if (row.key === 'boards_dead') applyRemoteDead(row.data);
      if (row.key === 'import') { applying = true; writeLS(LS.imports, mergeImports(readLS(LS.imports), row.data)); applying = false; safeReloadCRM(); }
    });
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity' }, function (p) { if (p.new && p.new.escopo !== 'auth') renderHistItem(p.new, true); });
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, function () { loadMembers().then(renderPresence); });

    channel.on('broadcast', { event: 'live' }, function (m) { handleLive(m.payload); });

    channel.on('presence', { event: 'sync' }, function () { presence = channel.presenceState(); renderPresence(); });
    channel.on('presence', { event: 'join' }, function () { presence = channel.presenceState(); renderPresence(); });
    channel.on('presence', { event: 'leave' }, function () { presence = channel.presenceState(); renderPresence(); });

    channel.subscribe(function (status) {
      log('realtime', status);
      if (status === 'SUBSCRIBED') { markConn('ok'); trackPresence(); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') markConn('recon');
      else if (status === 'CLOSED') markConn('off');
    });
    watchConnectivity();
  }

  function applyRemoteCRM(row) {
    if (!row) return;
    var k = row.company_key;
    applying = true;
    try {
      setMapEntry(LS.overrides, k, row.ov != null ? row.ov : undefined);
      setMapEntry(LS.touch, k, row.touch != null ? row.touch : undefined);
      setMapEntry(LS.deleted, k, row.deleted ? 1 : undefined);
      setMapEntry(LS.archived, k, row.archived != null ? row.archived : undefined);
      setMapEntry(LS.renamed, k, row.renamed ? 1 : undefined);
    } finally { applying = false; }
    snapshotCRMBaseline();
    safeReloadCRM();
  }
  function setMapEntry(lsKey, k, val) {
    var m = readLS(lsKey) || {};
    if (val === undefined) delete m[k]; else m[k] = val;
    writeLS(lsKey, m);
  }
  function applyRemoteBoards(remoteData) {
    if (!remoteData) return;
    var merged = mergeBoards(readLS(LS.boards), remoteData);
    applying = true; writeLS(LS.boards, merged); applying = false;
    lastBoards = merged;
    safeReloadBoards();
  }

  // Não puxa o tapete: se o usuário está arrastando/digitando, adia o re-render.
  var reloadCRMt = null, reloadBoardsT = null;
  function busyEditing() {
    var a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return true;
    if (document.querySelector('.dragging, .qb-dragging, [data-dragging="1"]')) return true;
    return false;
  }
  function safeReloadCRM() {
    clearTimeout(reloadCRMt);
    reloadCRMt = setTimeout(function () {
      if (busyEditing()) { reloadCRMt = setTimeout(arguments.callee, 500); return; }
      try { if (window.FOVA && window.FOVA.reload) window.FOVA.reload(); } catch (e) { log('reload CRM', e); }
    }, 120);
  }
  function safeReloadBoards() {
    clearTimeout(reloadBoardsT);
    var attempt = function () {
      if (busyEditing()) { reloadBoardsT = setTimeout(attempt, 500); return; }
      try { if (window.Boards && window.Boards.reload) window.Boards.reload(); applyLiveMarks(); } catch (e) { log('reload boards', e); }
    };
    reloadBoardsT = setTimeout(attempt, 150);
  }

  /* ---------- presença: quem está online / em qual quadro ---------- */
  function currentBoardId() { try { var S = readLS(LS.boards); return S && S.prefs && S.prefs.lastBoardId; } catch (e) { return null; } }
  function trackPresence() {
    if (!channel) return;
    channel.track({ id: me.id, nome: me.nome, cor: me.cor, iniciais: me.iniciais || initialsOf(me.nome), board: currentBoardId(), at: Date.now() });
  }
  // re-publica presença quando muda de quadro
  setInterval(function () { if (channel && booted) { var b = currentBoardId(); if (b !== presence._lastBoard) { presence._lastBoard = b; trackPresence(); } } }, 1200);

  function onlineList() {
    var out = []; var seen = {};
    for (var k in presence) { if (k[0] === '_') continue; var arr = presence[k]; if (arr && arr[0]) { seen[arr[0].id] = arr[0]; } }
    members.forEach(function (m) { out.push(Object.assign({}, m, { online: !!seen[m.id], board: seen[m.id] && seen[m.id].board })); });
    return out;
  }

  /* ---------- indicadores ao vivo (arrastar/editar cartão) ---------- */
  function broadcastLive(kind, cardId, boardId) {
    if (!channel) return;
    channel.send({ type: 'broadcast', event: 'live', payload: { by: me.id, nome: me.nome, cor: me.cor, kind: kind, cardId: cardId, boardId: boardId, ts: Date.now() } });
  }
  function handleLive(p) {
    if (!p || p.by === me.id) return;
    if (p.kind === 'drop' || p.kind === 'blur') { delete liveMarks[p.cardId]; }
    else { liveMarks[p.cardId] = p; }
    applyLiveMarks();
  }
  function applyLiveMarks() {
    document.querySelectorAll('.fova-live').forEach(function (el) { el.classList.remove('fova-live'); el.removeAttribute('data-live-who'); el.style.removeProperty('--lc'); });
    var nowTs = Date.now();
    Object.keys(liveMarks).forEach(function (cid) {
      var m = liveMarks[cid]; if (nowTs - m.ts > 15000) { delete liveMarks[cid]; return; }
      var el = document.querySelector('[data-card-id="' + cid + '"], [data-card="' + cid + '"], #card-' + cid);
      if (el) { el.classList.add('fova-live'); el.style.setProperty('--lc', m.cor || '#6FA8D0'); el.setAttribute('data-live-who', (m.kind === 'drag' ? 'movendo · ' : 'editando · ') + (m.nome || '')); }
    });
  }
  setInterval(applyLiveMarks, 4000);

  /* ============================================================
     Conexão / reconexão
     ============================================================ */
  function markConn(s) { if (connState === s) return; connState = s; renderPresence(); }
  function watchConnectivity() {
    window.addEventListener('online', function () { markConn('recon'); try { sb.realtime.connect(); } catch (e) {} setTimeout(function () { if (me) { hydrateFromServer().then(function () { safeReloadCRM(); safeReloadBoards(); markConn('ok'); }); } }, 400); });
    window.addEventListener('offline', function () { markConn('off'); });
  }

  /* ============================================================
     Barra de presença + status + histórico (UI dentro do app)
     ============================================================ */
  function mountPresenceBar() {
    if (document.getElementById('fovaPresence')) { renderPresence(); return; }
    var bar = h('div', { id: 'fovaPresence' });
    document.body.appendChild(bar);
    renderPresence();
  }
  function connLabel() { return connState === 'ok' ? 'Sincronizado' : connState === 'recon' ? 'Reconectando…' : 'Offline'; }
  function renderPresence() {
    var bar = document.getElementById('fovaPresence'); if (!bar) return;
    var list = onlineList();
    var avs = list.map(function (m) {
      var cur = currentBoardId();
      var here = m.online && m.board && m.board === cur;
      return '<button class="fp-av' + (m.id === me.id ? ' me' : '') + (m.online ? '' : ' away') + '" style="background:' + (m.cor || '#CBA96E') + '" ' +
        'title="' + esc(m.nome || m.name) + (m.online ? (m.board ? ' · num quadro' : ' · online') : ' · offline') + (here ? ' (neste quadro)' : '') + '" data-pid="' + m.id + '">' +
        esc(m.iniciais || initialsOf(m.nome || m.name)) + (m.online ? '<span class="fp-on"></span>' : '') + '</button>';
    }).join('');
    bar.innerHTML =
      '<span class="fp-status"><span class="fp-dot ' + (connState === 'ok' ? '' : connState) + '"></span>' + connLabel() + '</span>' +
      '<span class="fp-sep"></span><div class="fp-avs">' + avs + '</div>' +
      '<button class="fp-icon" id="fpHist" title="Histórico de atividades" aria-label="Histórico de atividades">' + SVG.hist + '</button>';
    bar.querySelector('#fpHist').addEventListener('click', openHist);
    bar.querySelectorAll('.fp-av').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.pid === me.id) openProfile(); }); });
  }

  /* ---------- Meu perfil ---------- */
  function openProfile() {
    var c = card('<div class="fa-eyebrow">Minha conta</div><h1 class="fa-title">Meu perfil</h1>' +
      '<form class="fa-form" id="faProf">' +
      '<div class="fa-field"><label class="fa-label" for="pNome">Nome</label><input class="fa-input" id="pNome" value="' + esc(me.nome) + '"></div>' +
      '<div class="fa-field"><label class="fa-label">Cor</label><div class="fa-swatches" id="pSw">' + USER_COLORS.map(function (col) { return '<button type="button" class="fa-sw' + (col === me.cor ? ' on' : '') + '" data-col="' + col + '" style="background:' + col + '"></button>'; }).join('') + '</div></div>' +
      '<div class="fa-field"><label class="fa-label" for="pPass">Nova senha (opcional)</label><div class="fa-inputwrap"><input class="fa-input" id="pPass" type="password" minlength="8" autocomplete="new-password" placeholder="deixe em branco pra manter"><button class="fa-eye" type="button" aria-label="Mostrar senha">' + SVG.eye + '</button></div></div>' +
      '<button class="fa-btn" type="submit">Salvar</button>' +
      '<button class="fa-btn fa-btn--ghost" type="button" id="pClose">Fechar</button>' +
      '<div class="fa-err" id="pErr"></div></form>' +
      '<div style="display:flex;gap:10px;margin-top:14px;justify-content:center">' +
      '<button class="fa-link" id="pOut" type="button">Sair</button>' +
      '<button class="fa-link" id="pOutAll" type="button">Sair de todos os aparelhos</button></div>');
    wireEye(c);
    var cor = me.cor;
    c.querySelectorAll('#pSw .fa-sw').forEach(function (b) { b.addEventListener('click', function () { cor = b.dataset.col; c.querySelectorAll('#pSw .fa-sw').forEach(function (x) { x.classList.toggle('on', x === b); }); }); });
    c.querySelector('#pClose').addEventListener('click', hideAuth);
    c.querySelector('#pOut').addEventListener('click', function () { doSignOut('local'); });
    c.querySelector('#pOutAll').addEventListener('click', function () { doSignOut('global'); });
    c.querySelector('#faProf').addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = c.querySelector('#pNome').value.trim() || me.nome;
      var pw = c.querySelector('#pPass').value;
      var jobs = [sb.from('profiles').update({ nome: nome, cor: cor, iniciais: initialsOf(nome), updated_at: new Date().toISOString() }).eq('id', me.id)];
      if (pw) { if (pw.length < 8) { c.querySelector('#pErr').textContent = 'A senha precisa de 8+ caracteres.'; return; } jobs.push(sb.auth.updateUser({ password: pw })); }
      Promise.all(jobs).then(function () {
        me.nome = nome; me.cor = cor; me.iniciais = initialsOf(nome);
        injectBoardIdentity(); safeReloadBoards(); hideAuth(); renderPresence(); trackPresence();
        toast('Perfil atualizado.', 'ok');
      }).catch(function (x) { c.querySelector('#pErr').textContent = 'Não deu pra salvar: ' + (x.message || x); });
    });
  }
  function doSignOut(scope) {
    sb.auth.signOut(scope === 'global' ? { scope: 'global' } : {}).then(function () { location.reload(); });
  }

  /* ---------- Histórico ---------- */
  var histItems = [];
  function logActivity(acao, alvo, escopo, meta) {
    if (!me) return;
    var row = { actor: me.id, actor_nome: me.nome, actor_cor: me.cor, acao: acao, alvo: alvo || null, escopo: escopo || null, meta: meta || null, ts: new Date().toISOString() };
    sb.from('activity').insert(row).then(function (r) { if (r.error) log('activity erro', r.error); });
  }
  function openHist() {
    if (!document.getElementById('fovaHist')) {
      var back = h('div', { id: 'fovaHistBack' }); document.body.appendChild(back);
      var draw = h('div', { id: 'fovaHist' },
        '<div class="fh-head"><h3>Histórico</h3><button class="fp-icon" id="fhClose" aria-label="Fechar">' + SVG.close + '</button></div>' +
        '<div class="fh-list" id="fhList"><div class="fh-empty">Carregando…</div></div>');
      document.body.appendChild(draw);
      back.addEventListener('click', closeHist);
      draw.querySelector('#fhClose').addEventListener('click', closeHist);
    }
    document.getElementById('fovaHist').classList.add('open');
    document.getElementById('fovaHistBack').classList.add('open');
    sb.from('activity').select('*').neq('escopo', 'auth').order('ts', { ascending: false }).limit(120).then(function (r) {
      histItems = r.data || [];
      var list = document.getElementById('fhList');
      list.innerHTML = histItems.length ? '' : '<div class="fh-empty">Nada por aqui ainda.</div>';
      histItems.forEach(function (it) { renderHistItem(it, false); });
    });
  }
  function closeHist() { var d = document.getElementById('fovaHist'); if (d) d.classList.remove('open'); var b = document.getElementById('fovaHistBack'); if (b) b.classList.remove('open'); }
  function renderHistItem(it, prepend) {
    var list = document.getElementById('fhList'); if (!list) return;
    var empty = list.querySelector('.fh-empty'); if (empty) empty.remove();
    var when = fmtAgo(new Date(it.ts).getTime());
    var txt = '<b>' + esc(it.actor_nome || 'Alguém') + '</b> ' + esc(it.acao) + (it.alvo ? ' <b>' + esc(it.alvo) + '</b>' : '');
    var node = h('div', { class: 'fh-item' },
      '<div class="fh-av" style="background:' + (it.actor_cor || '#CBA96E') + '">' + esc(initialsOf(it.actor_nome)) + '</div>' +
      '<div><div class="fh-txt">' + txt + '</div><div class="fh-when">' + when + '</div></div>');
    if (prepend && list.firstChild) list.insertBefore(node, list.firstChild); else list.appendChild(node);
  }
  function fmtAgo(ms) {
    var s = Math.floor((Date.now() - ms) / 1000); if (s < 60) return 'agora';
    var m = Math.floor(s / 60); if (m < 60) return m + ' min';
    var hh = Math.floor(m / 60); if (hh < 24) return hh + 'h';
    var d = new Date(ms); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);
  }

  /* ============================================================
     API pública (ganchos opcionais para app.js/boards.js)
     ============================================================ */
  window.FOVASync = {
    enabled: true,
    me: function () { return me; },
    members: function () { return members; },
    // chamados pelos Quadros (opcional) pra mostrar bordas ao vivo:
    liveDrag: function (cardId, boardId) { broadcastLive('drag', cardId, boardId); },
    liveDrop: function (cardId, boardId) { broadcastLive('drop', cardId, boardId); },
    liveEdit: function (cardId, boardId) { broadcastLive('edit', cardId, boardId); },
    liveBlur: function (cardId, boardId) { broadcastLive('blur', cardId, boardId); },
    log: logActivity,
  };

  /* ============================================================
     Arranque
     ============================================================ */
  function start() {
    injectStyle();
    var isRecovery = /type=recovery/.test(location.hash || '') || /type=recovery/.test(location.search || '');
    sb.auth.onAuthStateChange(function (event, session) {
      log('auth event', event);
      if (event === 'PASSWORD_RECOVERY') { screenReset(); return; }
      if (event === 'SIGNED_OUT') { booted = false; me = null; location.reload(); return; }
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !booted && !isRecovery) { afterAuthenticated(); return; }
    });
    screenLoading('Conectando…');
    // Sessão persistente: se já estou logado (até 30 dias), abre direto.
    sb.auth.getSession().then(function (r) {
      var sess = r && r.data && r.data.session;
      if (isRecovery) { screenReset(); return; }
      if (sess && !booted) afterAuthenticated(); else screenBoot();
    }).catch(function () { screenBoot(); });
    // "Manter conectado" desmarcado: encerra a sessão ao fechar o navegador.
    window.addEventListener('beforeunload', function () {
      try { if (sessionStorage.getItem('fova_keep') === '0') sb.auth.signOut(); } catch (e) {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
