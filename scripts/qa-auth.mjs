// qa-auth.mjs — screenshots + overflow checks for /login and /register at key viewports, both languages.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const EXEC = '/usr/bin/chromium';
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const out = '/home/ubuntu/iris-delivery/auth';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
try {
  for (const width of [375, 1440]) {
    for (const lang of ['ar', 'en']) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, ignoreHTTPSErrors: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
      if (lang === 'en') {
        await page.locator('button.lp-lang-round[data-language="en"]').click({ force: true, timeout: 15000 });
        await page.waitForFunction(() => document.documentElement.lang === 'en');
      }
      for (const route of ['/login', '/register']) {
        await page.goto(origin + route, { waitUntil: 'networkidle' });
        await page.waitForSelector('input');
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(900); // entrance animation
        const m = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          inputs: document.querySelectorAll('input,select').length,
          buttons: document.querySelectorAll('button').length,
        }));
        console.log(`${lang} ${width}px ${route}: overflow=${m.overflow} inputs=${m.inputs} buttons=${m.buttons} errors=${errors.length}`);
        if (errors.length) console.log('  pageerrors:', errors.join(' | '));
        await page.screenshot({ path: `${out}/${lang}-${width}${route.replace('/', '-')}.png`, fullPage: true });
      }
      // register: walk to step 2 to style-check the wizard
      await page.goto(`${origin}/register`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input');
      try {
        const filled = await page.evaluate(() => {
          const set = (el, v) => {
            const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          };
          const ins = [...document.querySelectorAll('input')];
          const email = ins.find(i => i.type === 'email'); if (email) set(email, 'qa-parent@example.com');
          const pw = ins.find(i => i.type === 'password'); if (pw) set(pw, 'Passw0rd!x2');
          const name = ins.find(i => (i.name + i.id).toLowerCase().includes('name')); if (name) set(name, 'QA');
          const age = ins.find(i => (i.name + i.id).toLowerCase().includes('age')); if (age) set(age, '5');
          const date = ins.find(i => i.type === 'date'); if (date) set(date, '2020-01-01');
          for (const radio of ins.filter(i => i.type === 'radio')) { radio.click(); break; }
          const sel = document.querySelector('select'); if (sel) set(sel, [...sel.options].slice(1).find(o => o.value)?.value ?? '');
          return { email: !!email, pw: !!pw, name: !!name, age: !!age };
        });
        const next = page.locator('button').filter({ hasText: /\u0627\u0644\u062a\u0627\u0644\u064a|Next/i }).first();
        if (await next.count()) {
          await next.click({ timeout: 5000 });
          await page.waitForTimeout(1000);
          const m2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          console.log(`${lang} ${width}px /register step2: overflow=${m2}`);
          await page.screenshot({ path: `${out}/${lang}-${width}-register-step2.png`, fullPage: true });
        }
      } catch (walkErr) {
        console.log(`${lang} ${width}px /register step2 walk skipped: ${String(walkErr).split('\n')[0]} (filled hints above)`);
      }
      await context.close();
    }
  }
} finally { await browser.close(); }
console.log('AUTH QA DONE ->', out);
