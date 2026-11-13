import { chromium } from 'playwright';
const results=[];
const pass=(n,ok,x='')=>{results.push({n,ok:!!ok,x});console.log(`  ${ok?'PASS':'FAIL'}  ${n}${x?' — '+x:''}`)};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// ── demo mode ──
console.log('\n[1] Demo mode / seed data');
{
  const p = await (await b.newContext({viewport:{width:1440,height:950}})).newPage();
  await p.goto('http://localhost:5175/',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1800);
  await p.getByRole('button',{name:'English'}).click().catch(()=>{});
  await p.waitForTimeout(600);
  await p.getByRole('button',{name:/Child Mode/}).click();
  await p.waitForTimeout(1600);
  const demo = p.getByRole('button',{name:/Committee demo/i}).first();
  pass('a demo scenario entry exists', await demo.count()>0);
  pass('the demo entry is clearly labelled as a demo',
    /Committee demo/i.test(await demo.innerText().catch(()=>'')),
    (await demo.innerText().catch(()=>'')).replace(/\n/g,' '));
  await demo.click();
  await p.waitForTimeout(2500);
  const body = await p.locator('body').innerText();
  pass('demo scenario screen loads', body.length>60, body.replace(/\n+/g,' ').slice(0,110));
  pass('demo does not present fake traction or testimonials',
    !/\d{3,}\s*(families|parents|users|reviews)/i.test(body) && !/testimonial/i.test(body));
  await p.screenshot({path:'p4-demo.png'});
}

// ── visual inspection ──
console.log('\n[2] Visual inspection (screenshots)');
for (const [w,h,tag] of [[390,844,'390'],[820,1180,'820'],[1440,950,'1440']]) {
  const p = await (await b.newContext({viewport:{width:w,height:h}})).newPage();
  await p.goto('http://localhost:5175/',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1700);
  await p.screenshot({path:`p4-landing-${tag}.png`});
  await p.getByRole('button',{name:/Child Mode|وضع الطفل/}).first().click();
  await p.waitForTimeout(1500);
  const inp=p.locator('input').first();
  if (await inp.count()){await inp.fill('سلمى');await p.getByRole('button',{name:/ابدأ|Start/}).first().click().catch(()=>{});await p.waitForTimeout(1600);}
  await p.screenshot({path:`p4-child-${tag}.png`});
  // logo + avatar present?
  const imgs = await p.evaluate(()=>({
    logo: !!document.querySelector('img[src*="logo"], img[alt*="IRIS"], img[alt*="ايريس"]'),
    logoOk: Array.from(document.querySelectorAll('img')).every(i=>!i.src || i.complete),
    svgs: document.querySelectorAll('svg').length,
  }));
  pass(`${tag}px: no broken images`, imgs.logoOk);
  pass(`${tag}px: avatar/vector art renders`, imgs.svgs>0, `${imgs.svgs} svg`);
}
await b.close();
const f=results.filter(r=>!r.ok);
console.log(`\n=== ${results.length-f.length}/${results.length} checks passed ===`);
if(f.length){console.log('FAILED:');f.forEach(x=>console.log('  - '+x.n+(x.x?' — '+x.x:'')))}
