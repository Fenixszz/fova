// Per-section viewport screenshots (handles pinned ScrollTrigger sections).
// Usage: node shot-sections.mjs [width] [height]
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const URL = 'http://localhost:3000';
const WIDTH = parseInt(process.argv[2] || '1440', 10);
const HEIGHT = parseInt(process.argv[3] || '900', 10);
const TAG = process.argv[4] || 'd';

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
].find(p => existsSync(p));

const DIR = 'temporary screenshots';
await mkdir(DIR, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
try { await page.evaluate(() => document.fonts.ready); } catch {}
// let images settle + the page-load scribble finish (~5.2s)
await new Promise(r => setTimeout(r, 6500));

async function scrollTo(y) {
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true });
    window.scrollTo(0, yy);
  }, y);
  await new Promise(r => setTimeout(r, 650));
}
async function shot(label) {
  const out = `${DIR}/sec-${TAG}-${label}.png`;
  await page.screenshot({ path: out });
  console.log('Saved:', out);
}

// total scroll height
const docH = await page.evaluate(() => document.body.scrollHeight);
const vh = HEIGHT;

// 1) hero (top)
await scrollTo(0); await shot('1-hero');
// 2) horizontal words — partway into its pin so words sit centered
await scrollTo(Math.round(vh * 1.6)); await shot('2-words');
// 3) motion cards
await page.evaluate(() => { const e = document.getElementById('motion-card-section'); if (e) { const y = e.getBoundingClientRect().top + window.scrollY - 40; if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); window.scrollTo(0, y); } });
await new Promise(r => setTimeout(r, 700)); await shot('3-motion');
// 4) showreel
await page.evaluate(() => { const e = document.getElementById('showreel-section'); if (e) { const y = e.getBoundingClientRect().top + window.scrollY; if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); window.scrollTo(0, y); } });
await new Promise(r => setTimeout(r, 700)); await shot('4-showreel');
// 5) service cards
await page.evaluate(() => { const e = document.querySelector('.service-cards-wrapper'); if (e) { const y = e.getBoundingClientRect().top + window.scrollY - 20; if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); window.scrollTo(0, y); } });
await new Promise(r => setTimeout(r, 800)); await shot('5-services');
// 6) marquee
await page.evaluate(() => { const e = document.querySelector('.Double-marquee'); if (e) { const y = e.getBoundingClientRect().top + window.scrollY; if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); window.scrollTo(0, y); } });
await new Promise(r => setTimeout(r, 800)); await shot('6-marquee');
// 7) footer
await page.evaluate(() => { const y = document.body.scrollHeight; if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); window.scrollTo(0, y); });
await new Promise(r => setTimeout(r, 900)); await shot('7-footer');

await browser.close();
