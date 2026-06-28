const PROD='https://fova-psi.vercel.app/?cb='+Math.floor(Math.random()*1e9);
const r=await fetch(PROD,{cache:'no-store'});
console.log('status', r.status, 'age', r.headers.get('age'), 'x-vercel-cache', r.headers.get('x-vercel-cache'));
const t=await r.text();
console.log('len', t.length);
console.log('has "width: 88vw":', t.includes('width: 88vw'));
console.log('has "footer-wordmark-img":', t.includes('footer-wordmark-img'));
console.log('has crop svg src:', t.includes('fova-display-gold-crop.svg'));
const i=t.indexOf('.footer-wordmark-img');
console.log('--- around .footer-wordmark-img (first) ---');
console.log(t.slice(i, i+120));
// find the mobile one
const i2=t.indexOf('footer-wordmark-img', i+10);
const i3=t.indexOf('footer-wordmark-img', i2+10);
console.log('--- occurrences indices:', i, i2, i3);
