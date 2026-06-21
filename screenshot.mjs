// macOS-compatible screenshot helper using puppeteer-core + system Chrome.
// Usage: node screenshot.mjs [url] [label] [width]
//   node screenshot.mjs http://localhost:3000 home 1440
//   node screenshot.mjs http://localhost:3000 home-mobile 390
import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const URL = process.argv[2] || 'http://localhost:3000';
const LABEL = process.argv[3] || '';
const WIDTH = parseInt(process.argv[4] || '1440', 10);
const HEIGHT = parseInt(process.argv[5] || '900', 10);

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
];
const execPath = CHROME_CANDIDATES.find(p => existsSync(p));
if (!execPath) { console.error('Nenhum Chrome encontrado.'); process.exit(1); }

const DIR = 'temporary screenshots';
await mkdir(DIR, { recursive: true });
const existing = (await readdir(DIR)).filter(f => /^screenshot-\d+/.test(f));
const next = existing.reduce((m,f) => Math.max(m, parseInt(f.match(/^screenshot-(\d+)/)[1],10)), 0) + 1;
const name = `screenshot-${next}${LABEL ? '-'+LABEL : ''}.png`;
const out = `${DIR}/${name}`;

const browser = await puppeteer.launch({ executablePath: execPath, headless: 'new', args: ['--no-sandbox','--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
try { await page.evaluate(() => document.fonts.ready); } catch {}

// Trigger scroll-reveals / IntersectionObservers, then return to top.
await page.evaluate(async () => {
  await new Promise(res => {
    let y = 0; const step = window.innerHeight * 0.6;
    const t = setInterval(() => { window.scrollTo(0, y); y += step; if (y > document.body.scrollHeight) { clearInterval(t); res(); } }, 80);
  });
});
await new Promise(r => setTimeout(r, 700));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 900));

await page.screenshot({ path: out, fullPage: true });
console.log('Saved:', out);
await browser.close();
