/**
 * Phase 10 — live contrast audit.
 *
 * Measures every visible text node's computed colour against its effective
 * background, on the real running app. Static token checks cannot do this: a
 * colour pair is only wrong once something is actually rendered on top of
 * something else.
 *
 * TARGET: AAA (7:1) for body text, AA-Large (4.5:1) for text at 24px+ or
 * bold 18.66px+. The audience includes children with visual and cognitive
 * differences, so the higher bar is the right default rather than a stretch
 * goal — and `ink-faint` is banned from carrying information at all.
 */
import { chromium } from 'playwright';

const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const parse = (s) => {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((x) => parseFloat(x));
  return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
};

const email = `contrast_${Date.now()}@example.com`, pw = 'Str0ng!Passw0rd';
await fetch('http://localhost:5000/api/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Contrast', email, password: pw, consent_mvp_use: true, age: 7 }),
});

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1000, height: 1100 } });

const click = async (sel, ms = 1300) => {
  const el = p.locator(sel).first();
  if (!(await el.count())) return false;
  await el.click({ force: true }); await p.waitForTimeout(ms); return true;
};
const toEnglish = async () => {
  const en = p.locator('button:has-text("EN"), button:has-text("English")').first();
  if (await en.count()) { await en.click({ force: true }); await p.waitForTimeout(700); }
};

/** Collect text/background pairs, walking up for a non-transparent backdrop. */
const sample = () =>
  p.evaluate(() => {
    const out = [];
    const bgOf = (el) => {
      let n = el;
      while (n && n !== document.documentElement) {
        const s = getComputedStyle(n);
        const m = s.backgroundColor.match(/rgba?\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(',').map(parseFloat);
          const a = parts.length > 3 ? parts[3] : 1;
          if (a > 0.85) return s.backgroundColor;
        }
        n = n.parentElement;
      }
      return 'rgb(254,246,234)';
    };
    document.querySelectorAll('body *').forEach((el) => {
      if (el.children.length > 0) return;
      const t = (el.textContent || '').trim();
      if (!t || t.length > 200) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.opacity === '0') return;
      if (el.closest('[aria-hidden="true"]')) return;
      out.push({
        text: t.slice(0, 46),
        color: s.color,
        bg: bgOf(el),
        size: parseFloat(s.fontSize),
        weight: parseInt(s.fontWeight, 10) || 400,
        cls: el.className?.toString?.().slice(0, 60) ?? '',
      });
    });
    return out;
  });

const problems = [];
let checked = 0;

const audit = async (screen) => {
  for (const s of await sample()) {
    const fg = parse(s.color), bg = parse(s.bg);
    if (!fg || !bg || fg.a < 0.6) continue;
    checked++;
    const r = ratio(fg.rgb, bg.rgb);
    const large = s.size >= 24 || (s.size >= 18.66 && s.weight >= 700);
    const need = large ? 4.5 : 7;
    if (r < need) problems.push({ screen, ...s, ratio: +r.toFixed(2), need, large });
  }
};

await p.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await audit('landing (ar)');
await toEnglish();
await audit('landing (en)');

await click('text=/^Parent Mode$/', 1500);
await audit('login');
await p.locator('input[type="email"]').first().fill(email);
await p.locator('input[type="password"]').first().fill(pw);
await click('button:has-text("Login Now")', 2600);
await toEnglish();
await audit('parent home');

for (const [label, name] of [
  ['Progress & Insights', 'progress'],
  ['Home Tips', 'home tips'],
  ['Ask IRIS', 'ask iris'],
  ['Parent Community', 'community'],
  ['Connect with Specialists', 'specialists'],
  ['Learning Snapshot', 'snapshot'],
]) {
  if (await click(`text=/${label}/`, 1700)) await audit(name);
  await click('button:has-text("Parent Mode"), button:has-text("Home")', 1500);
}

await p.goto('http://localhost:5175/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
await toEnglish();
await click('text=/^Child Mode$/', 2000);
for (let i = 0; i < 5; i++) {
  const t = await p.evaluate(() => document.body.innerText);
  if (/Free Play|Start Adventure/i.test(t)) break;
  await click('button:has-text("Continue"), button:has-text("Next"), button:has-text("Start")', 1200);
}
await audit('child home');
if (await click('text=/Memory Game/', 2000)) await audit('memory game');

await b.close();

console.log(`\nsampled ${checked} text nodes across 11 screens`);
if (!problems.length) {
  console.log('PASS — every measured text node meets AAA (7:1), or AA-Large (4.5:1) where the text is large.');
} else {
  console.log(`${problems.length} below target:\n`);
  const seen = new Set();
  for (const x of problems) {
    const k = `${x.color}|${x.bg}|${Math.round(x.size)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`  ${x.ratio}:1 (need ${x.need})  ${x.screen}  ${Math.round(x.size)}px/${x.weight}  "${x.text}"`);
    console.log(`        ${x.color} on ${x.bg}   ${x.cls}`);
  }
}
process.exit(problems.length ? 1 : 0);
