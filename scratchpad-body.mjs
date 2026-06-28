async function dump(u){
  const r=await fetch(u,{redirect:'manual'});
  console.log('\n=== ', u);
  console.log('status', r.status);
  console.log('content-type', r.headers.get('content-type'));
  console.log('x-vercel-cache', r.headers.get('x-vercel-cache'));
  console.log('set-cookie?', !!r.headers.get('set-cookie'));
  console.log('location', r.headers.get('location'));
  const t=await r.text();
  console.log('len', t.length);
  console.log('body[0:300]:', JSON.stringify(t.slice(0,300)));
}
await dump('https://fova-psi.vercel.app/');
await dump('https://fova-psi.vercel.app/?cb=987654');
await dump('https://fova-psi.vercel.app/fova-white.svg');
await dump('https://fova-psi.vercel.app/index.html');
