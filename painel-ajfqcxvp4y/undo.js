/* ============================================================
   DESFAZER / REFAZER (undo.js)
   Atalhos globais do painel:
     Ctrl/Cmd + Z          → desfazer
     Ctrl/Cmd + Shift + Z  → refazer   (e Ctrl + Y, estilo Windows)

   Como funciona: guarda uma pilha de "fotos" do estado salvo no
   localStorage (CRM: fova_crm_* ; Quadros: fova_boards_*). Qualquer
   gravação nessas chaves vira um ponto no histórico. Desfazer volta
   para a foto anterior e manda os dois módulos relerem e redesenharem.
   Nada é apagado de verdade — só troca qual foto está ativa.
   ============================================================ */
(function () {
  'use strict';

  var PREFIXOS = ['fova_crm_', 'fova_boards_'];
  function rastreada(k) {
    if (typeof k !== 'string') return false;
    for (var i = 0; i < PREFIXOS.length; i++) { if (k.indexOf(PREFIXOS[i]) === 0) return true; }
    return false;
  }

  // ---- foto do estado salvo (só as chaves que importam) ----
  function foto() {
    var s = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (rastreada(k)) s[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return s;
  }
  function igual(a, b) {
    if (!a || !b) return false;
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) { if (a[ka[i]] !== b[ka[i]]) return false; }
    return true;
  }

  var pilha = [];        // fotos, da mais antiga para a mais nova
  var pos = -1;          // índice da foto ativa dentro da pilha
  var LIMITE = 100;      // quantos passos guardar
  var restaurando = false;
  var timerCommit = null;
  var pronto = false;

  function base() { pilha = [foto()]; pos = 0; pronto = true; }

  function registrar() {
    if (restaurando) return;
    var atual = foto();
    if (pos >= 0 && igual(atual, pilha[pos])) return;      // nada mudou de verdade
    pilha = pilha.slice(0, pos + 1);                        // descarta o "refazer" pendente
    pilha.push(atual);
    if (pilha.length > LIMITE + 1) pilha.shift();           // segura o tamanho
    pos = pilha.length - 1;
  }
  function agendarRegistro() {
    if (restaurando) return;
    clearTimeout(timerCommit);
    timerCommit = setTimeout(registrar, 150);
  }

  // ---- intercepta as gravações do painel para marcar o histórico ----
  try {
    var _set = localStorage.setItem.bind(localStorage);
    var _rem = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = function (k, v) { _set(k, v); if (!restaurando && rastreada(k)) agendarRegistro(); };
    localStorage.removeItem = function (k) { _rem(k); if (!restaurando && rastreada(k)) agendarRegistro(); };
    window.__fovaSet = _set; window.__fovaRem = _rem;   // usados ao restaurar, sem re-registrar
  } catch (e) {}

  function aplicar(s) {
    restaurando = true;
    try {
      var apagar = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (rastreada(k) && !(k in s)) apagar.push(k); }
      apagar.forEach(function (k) { (window.__fovaRem || localStorage.removeItem).call(localStorage, k); });
      Object.keys(s).forEach(function (k) { (window.__fovaSet || localStorage.setItem).call(localStorage, k, s[k]); });
    } catch (e) {}
    try { if (window.FOVA && window.FOVA.reload) window.FOVA.reload(); } catch (e) {}
    try { if (window.Boards && window.Boards.reload) window.Boards.reload(); } catch (e) {}
    restaurando = false;
  }

  function aviso(msg) { try { if (window.FOVA && window.FOVA.toast) window.FOVA.toast(msg, 'ok'); } catch (e) {} }

  function desfazer() {
    if (!pronto) return;
    clearTimeout(timerCommit); registrar();                // garante que a mudança mais recente entrou
    if (pos <= 0) { aviso('Nada para desfazer.'); return; }
    pos--; aplicar(pilha[pos]);
    aviso('Desfeito.');
  }
  function refazer() {
    if (!pronto) return;
    clearTimeout(timerCommit); registrar();                // se mudou algo novo, o "refazer" deixa de valer
    if (pos >= pilha.length - 1) { aviso('Nada para refazer.'); return; }
    pos++; aplicar(pilha[pos]);
    aviso('Refeito.');
  }

  // ---- atalhos de teclado ----
  document.addEventListener('keydown', function (e) {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    var tecla = (e.key || '').toLowerCase();
    if (tecla !== 'z' && tecla !== 'y') return;
    // dentro de um campo de texto, deixa o desfazer nativo da digitação funcionar
    var t = e.target, tag = (t && t.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
    if (tecla === 'z' && !e.shiftKey) { e.preventDefault(); desfazer(); }
    else { e.preventDefault(); refazer(); }               // Shift+Z, ou Ctrl+Y
  }, false);

  // expõe para quem quiser chamar por botão depois
  window.FovaHistorico = { desfazer: desfazer, refazer: refazer };

  // ---- captura a foto inicial assim que o painel terminar de iniciar ----
  function tentarBase() {
    try { return !!(window.FOVA && window.FOVA.isBooted && window.FOVA.isBooted()); } catch (e) { return false; }
  }
  if (tentarBase()) base();
  else {
    var iv = setInterval(function () { if (tentarBase()) { clearInterval(iv); if (!pronto) base(); } }, 300);
    setTimeout(function () { try { clearInterval(iv); } catch (e) {} if (!pronto) base(); }, 10000);
  }
})();
