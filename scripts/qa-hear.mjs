import { chromium } from 'playwright';
const email = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { window.__audios = []; });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 90)));
await p.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
await p.fill('input[type=email]', email);
await p.fill('input[type=password]', 'Passw0rd!2');
await p.locator('button').filter({ hasText: /دخول/ }).first().click();
await p.waitForTimeout(4500);
console.log('post-login body:', (await p.evaluate(() => (document.body.innerText||'').slice(0,120))).replace(/\n/g,' | '));
const startBtn = p.locator('button').filter({ hasText: /يلا نبدأ/ }).first();
await startBtn.click({ timeout: 15000 });
await p.waitForTimeout(1300);
let shotLetter = false, shotListen = false;
for (let i = 0; i < 45 && !(shotLetter && shotListen); i++) {
  const t = await p.evaluate(() => document.body.innerText || '');
  if (!shotLetter && t.includes('أنهي واحد ده حرف')) {
    const opts = await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.closest('[data-response],[data-item-id]')).map(x => x.innerText.trim()).filter(Boolean));
    console.log('letter item options:', JSON.stringify(opts));
    await p.screenshot({ path: '/home/ubuntu/iris-delivery/parent/fix-letter-item.png' });
    shotLetter = true;
  }
  if (!shotListen && t.includes('اسمع واختار الصورة')) {
    await p.waitForTimeout(1300);
    const audios = await p.evaluate(() => { const el = document.querySelector('[data-iris-narration]'); return el ? [{ src: el.src.split('/').pop(), t: Math.round(el.currentTime * 100) / 100, paused: el.paused, ended: el.ended, state: el.readyState }] : []; });
    const chip = await p.evaluate(() => document.body.innerText.includes('اسمع كويس'));
    console.log('LISTEN audio elements:', JSON.stringify(audios), '| chip:', chip);
    await p.screenshot({ path: '/home/ubuntu/iris-delivery/parent/fix-listen-item.png' });
    shotListen = true;
  }
  await p.evaluate(() => {
    const v = [...document.querySelectorAll('button')].filter(x => x.offsetParent && !x.disabled && x.closest('[data-response],[data-item-id]'));
    const c = v.find(x => /خلصت|تأكيد/.test(x.innerText));
    if (c) { c.click(); return; }
    if (v.length) v[v.length - 1].click();
  });
  await p.waitForTimeout(900);
}
console.log('letter shot:', shotLetter, '| listen shot:', shotListen);
console.log('errs:', errs.length ? errs.slice(0, 4) : 'none');
await b.close();
