/* P61 production evidence: foreign-mirror device + brand-new unverified
   account → mirrors purged on mount, verification screen (NOT the hub). */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const O = 'https://iris-kohl-seven.vercel.app';
const { token, childId, email } = JSON.parse(readFileSync('/tmp/p61prod.json', 'utf8'));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(O + '/login', { waitUntil: 'domcontentloaded' });
await page.evaluate(({ t, e, kid }) => {
  localStorage.clear();
  localStorage.setItem('iris_auth_token', t);
  localStorage.setItem('iris_auth_email', e);
  localStorage.setItem('iris_owner_email', 'old.family.devtest@example.com');
  localStorage.setItem('iris_family_profiles_v1', JSON.stringify({ [String(kid)]: { responses: { VQ1: { v: 'words' } }, scored: { domains: {}, confidence: {} }, bankVersion: 'cv2', owner: 'old.family.devtest@example.com' } }));
  localStorage.setItem('iris_stars_v1', '77');
}, { t: token, e: email, kid: childId });
await page.goto(O + '/parent', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200));
const st = await page.evaluate(() => ({ fam: localStorage.getItem('iris_family_profiles_v1'), owner: localStorage.getItem('iris_owner_email') }));
console.log('SCREEN:', txt.slice(0, 140));
console.log('STORAGE:', JSON.stringify(st));
const hub = /اكتشفنا|خطة الأسبوع|ابدأ اللعب/.test(txt);
const notHub = !hub && /تأكيد|تحقق|verify/i.test(txt);
console.log(notHub ? 'PASS: verify screen owns the app entry — hub unreachable pre-verification with foreign mirrors' : 'FAIL');
console.log(st.fam === null && st.owner === email ? 'PASS: foreign mirrors purged, owner restamped' : 'FAIL: storage state wrong');
await page.screenshot({ path: '/home/ubuntu/iris-delivery/prod-repro/p61-prod-crossover.png' });
await browser.close();
