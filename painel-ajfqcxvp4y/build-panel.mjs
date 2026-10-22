// build-panel.mjs — gera o index.html (self-contained) a partir de:
//   index.src.html  (HTML + CSS, com <script src="crm-data.enc.js"> e <script src="app.js">)
//   crm-data.enc.js (dados cifrados)
//   app.js          (lógica do painel)
// Uso: node painel-ajfqcxvp4y/build-panel.mjs
// Assim você edita SÓ o app.js e o index.src.html; o index.html é gerado (nunca editado à mão).
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
const read = (f) => readFileSync(new URL(f, here), 'utf8');

let html = read('index.src.html');
const enc = read('crm-data.enc.js');
const app = read('app.js');
const boards = read('boards.js');
const undo = read('undo.js');
const config = read('config.js');
const sync = read('sync.js');

const inline = (content) => () => '  <script>\n' + content + '\n</script>';   // função → sem interpretação de $ na substituição

// O cliente Supabase continua vindo do CDN (externo). O resto é embutido.
html = html.replace('  <script src="config.js?v=1"></script>', inline(config));
html = html.replace('  <script src="sync.js?v=1"></script>', inline(sync));
html = html.replace('  <script src="crm-data.enc.js?v=7"></script>', inline(enc));
html = html.replace('  <script src="app.js?v=7"></script>', inline(app));
html = html.replace('  <script src="boards.js?v=1"></script>', inline(boards));
html = html.replace('  <script src="undo.js?v=1"></script>', inline(undo));

writeFileSync(new URL('index.html', here), html);
console.log('index.html gerado (' + html.length + ' bytes).');

// _preview.html — mesmo HTML/CSS, mas com dados FALSOS (_sample-data.js) e app.js/boards.js externos.
// Serve só pra conferir o visual localmente (gitignore + vercelignore); nunca vai pro deploy.
const src = read('index.src.html');
const preview = src.replace('  <script src="crm-data.enc.js?v=7"></script>', '  <script src="_sample-data.js?v=12"></script>');
writeFileSync(new URL('_preview.html', here), preview);
console.log('_preview.html gerado (' + preview.length + ' bytes).');
