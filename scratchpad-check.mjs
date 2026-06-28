const PREV='https://fova-i3jknxihi-jeguimacaramaschi-6788s-projects.vercel.app';
const PROD='https://fova-psi.vercel.app';
async function head(u){ try{const r=await fetch(u,{redirect:'manual'}); return r.status;}catch(e){return 'ERR '+e.message;} }
async function has88(u){ try{const r=await fetch(u); const t=await r.text(); return t.includes('width: 88vw')? 'YES':'no';}catch(e){return 'ERR';} }
for(const base of [PROD, PREV]){
  console.log('==', base);
  console.log('  88vw:', await has88(base+'/'));
  for(const p of ['/public/fova-white.svg','/fova-white.svg','/public/fova-white.png','/fova-white.png']){
    console.log('  '+p+' ->', await head(base+p));
  }
}
