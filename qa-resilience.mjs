import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
const results=[];
const pass=(n,ok,x='')=>{results.push({n,ok:!!ok,x});console.log(`  ${ok?'PASS':'FAIL'}  ${n}${x?' — '+x:''}`)};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// ── performance ──
console.log('\n[1] Performance');
{
  const p = await (await b.newContext({viewport:{width:1440,height:950}})).newPage();
  const t0=Date.now();
  await p.goto('http://localhost:5175/',{waitUntil:'domcontentloaded'});
  await p.waitForSelector('button', {timeout:15000});
  const firstPaint = Date.now()-t0;
  pass('landing is interactive quickly', firstPaint < 6000, `${firstPaint}ms to first control`);

  const nav = await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return n?Math.round(n.domContentLoadedEventEnd):0;});
  pass('DOMContentLoaded is reasonable', nav < 5000, `${nav}ms`);

  await p.waitForTimeout(1500);
  const t1=Date.now();
  await p.getByRole('button',{name:/Child Mode|وضع الطفل/}).first().click();
  await p.waitForTimeout(100);
  await p.waitForSelector('input, button', {timeout:10000});
  pass('screen transition is fast', Date.now()-t1 < 3000, `${Date.now()-t1}ms into Child Mode`);
  await p.close();
}

// ── backend down: the DemoDay nightmare ──
console.log('\n[2] Resilience — backend not running');
{
  try { execSync('fuser -k 5000/tcp', {stdio:'ignore'}); } catch {}
  await new Promise(r=>setTimeout(r,1500));

  const p = await (await b.newContext({viewport:{width:1440,height:950}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:5175/',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1800);
  pass('landing still renders with the backend down', (await p.locator('body').innerText()).length>40);

  await p.getByRole('button',{name:/وضع الطفل|Child Mode/}).first().click();
  await p.waitForTimeout(1600);
  const inp=p.locator('input').first();
  if(await inp.count()){await inp.fill('سلمى');await p.getByRole('button',{name:/ابدأ|Start/}).first().click().catch(()=>{});await p.waitForTimeout(1700);}
  const body = await p.locator('body').innerText();
  pass('CHILD MODE works with the backend down', /سلمى|Salma/.test(body), body.replace(/\n+/g,' ').slice(0,80));

  // Stories are local content — must survive too.
  const st = p.getByRole('button',{name:/القصص|Stories/}).first();
  if (await st.count()) {
    await st.click(); await p.waitForTimeout(1200);
    await p.getByRole('button',{name:/بندق|Bandaq/}).first().click().catch(()=>{});
    await p.waitForTimeout(1200);
    pass('STORIES work with the backend down', await p.locator('svg[role="presentation"]').count()>0);
  } else pass('STORIES work with the backend down', false, 'stories entry missing');

  pass('no uncaught exceptions while the backend is down', errs.length===0, errs.slice(0,2).join(' | '));
  await p.close();
}

// restart backend
execSync('cd /home/claude/iris_build/server && nohup npm start > /tmp/backend2.log 2>&1 & disown',{shell:'/bin/bash',stdio:'ignore'});
let up=false;
for(let i=0;i<40&&!up;i++){await new Promise(r=>setTimeout(r,500));try{up=(await fetch('http://localhost:5000/api/tts/status')).ok}catch{}}
console.log(`\n  (backend restarted: ${up})`);

await b.close();
const f=results.filter(r=>!r.ok);
console.log(`\n=== ${results.length-f.length}/${results.length} checks passed ===`);
if(f.length){console.log('FAILED:');f.forEach(x=>console.log('  - '+x.n+(x.x?' — '+x.x:'')))}
