/**
 * Narration client QA — the browser half of the ElevenLabs integration.
 *
 * The /api/tts route is intercepted here rather than run for real, so these
 * checks are about the CLIENT contract: does the app ask for the right voice
 * language, does narration play from the returned audio instead of the browser
 * voice, can it overlap itself, does mute/navigation stop it, and does the
 * documented fallback actually engage when the route declines.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:5175/';
const MP3 = fs.readFileSync('public/sounds/correct/cheer-yay.mp3');

const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

/**
 * @param mode 'serve'  — answer with audio, like a configured ElevenLabs
 *             'decline' — answer {fallback:true}, like a missing key
 */
async function makeCtx(mode = 'serve') {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const calls = [];
  await ctx.route('**/api/tts', async (route) => {
    const body = route.request().postDataJSON() || {};
    calls.push(body);
    if (mode === 'decline') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ fallback: true, reason: 'NO_API_KEY' }) });
    }
    return route.fulfill({ status: 200, contentType: 'audio/mpeg', body: MP3 });
  });
  const page = await ctx.newPage();
  // Record every speechSynthesis utterance so we can tell which voice spoke.
  await page.addInitScript(() => {
    window.__spoken = [];
    const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (u) => { window.__spoken.push(u.text); return orig(u); };
    // Narration plays through `new Audio()`, which is never attached to the
    // DOM — a querySelector('audio') check would silently find nothing and
    // pass vacuously. Track the real instances instead.
    window.__audios = [];
    window.__everPlayed = 0;
    const origPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function () {
      if (!window.__audios.includes(this)) window.__audios.push(this);
      if (String(this.src).startsWith('blob:')) window.__everPlayed += 1;
      return origPlay.call(this);
    };
  });
  return { ctx, page, calls };
}

/** Walk into Child Mode, which is where narration starts. */
async function enterChild(page, lang) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  if (lang === 'en') {
    await page.getByRole('button', { name: 'English' }).click();
    await page.waitForTimeout(400);
  }
  await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).click();
  await page.waitForTimeout(1400);
  const nf = page.locator('input').first();
  if (await nf.count()) {
    await nf.fill(lang === 'en' ? 'Salma' : 'سلمى');
    await page.getByRole('button', { name: /ابدأ|Start|يلا/ }).first().click().catch(() => {});
    await page.waitForTimeout(1400);
  }
}

/** Open a story, which narrates a fresh sentence on every scene — the most
 *  reliable way to get several real narration lines in a row. */
async function openStory(page, lang) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  if (lang === 'en') {
    await page.getByRole('button', { name: 'English' }).click();
    await page.waitForTimeout(400);
  }
  await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).click();
  await page.waitForTimeout(1400);
  const nf = page.locator('input').first();
  if (await nf.count()) {
    await nf.fill(lang === 'en' ? 'Salma' : 'سلمى');
    await page.getByRole('button', { name: /ابدأ|Start|يلا/ }).first().click().catch(() => {});
    await page.waitForTimeout(1300);
  }
  await page.getByRole('button', { name: /Stories|القصص/ }).first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Bandaq|بندق/ }).first().click();
  await page.waitForTimeout(1000);
}

/** How many DISTINCT narration elements have ever played. The implementation
 *  reuses one element on purpose, so anything above 1 means narration could
 *  overlap itself. */
const narrationElements = (page) =>
  page.evaluate(() =>
    (window.__audios || []).filter((a) => String(a.src).startsWith('blob:')).length
  );

/** Narration clips currently playing. Narration is the blob: URLs — recorded
 *  cues play from /sounds/ paths and are a separate system. */
const playingCount = (page) =>
  page.evaluate(() =>
    (window.__audios || []).filter(
      (a) => String(a.src).startsWith('blob:') && !a.paused && !a.ended
    ).length
  );
/** How many narration clips have started at all, so a "0 playing" result can
 *  be distinguished from "narration never ran". */
const everPlayed = (page) => page.evaluate(() => window.__everPlayed || 0);

// ── 1. English narration goes through the new voice ─────────────────────────
console.log('\n[1] English narration uses the ElevenLabs path');
{
  const { ctx, page, calls } = await makeCtx('serve');
  await enterChild(page, 'en');
  await page.waitForTimeout(1200);
  pass('app requested narration from /api/tts', calls.length > 0, `${calls.length} requests`);
  pass('request carried lang=en', calls.some((c) => c.lang === 'en'),
    JSON.stringify(calls[0] || {}).slice(0, 70));
  const spoken = await page.evaluate(() => window.__spoken.length);
  pass('browser speech synthesis was NOT used', spoken === 0, `${spoken} utterances`);
  await ctx.close();
}

// ── 2. Arabic picks the Arabic voice ────────────────────────────────────────
console.log('\n[2] Arabic narration follows the language setting');
{
  const { ctx, page, calls } = await makeCtx('serve');
  await enterChild(page, 'ar');
  await page.waitForTimeout(1200);
  pass('request carried lang=ar', calls.length > 0 && calls.every((c) => c.lang === 'ar'),
    `${calls.length} requests, langs=${[...new Set(calls.map((c) => c.lang))]}`);
  pass('Arabic text was sent, not a translation', calls.some((c) => /[؀-ۿ]/.test(c.text || '')),
    (calls[0]?.text || '').slice(0, 30));
  await ctx.close();
}

// ── 3. no overlap, and replay is cached ─────────────────────────
console.log('\n[3] Overlap and replay');
{
  const { ctx, page, calls } = await makeCtx('serve');
  await openStory(page, 'en');

  // Advance through scenes; each one narrates a new sentence.
  let peak = 0;
  for (let i = 0; i < 5; i++) {
    peak = Math.max(peak, await playingCount(page));
    const next = page.getByRole('button', { name: /Next scene|Story question/ });
    if (!(await next.count())) break;
    await next.first().click();
    await page.waitForTimeout(250);
    peak = Math.max(peak, await playingCount(page));
    await page.waitForTimeout(400);
  }

  const started = await everPlayed(page);
  pass('several narration lines actually played', started >= 3, `${started} clips started`);
  pass('never more than one narration clip plays at once', peak <= 1, `peak ${peak} concurrent`);
  pass('narration reuses a single audio element (cannot overlap by construction)',
    (await narrationElements(page)) === 1, `${await narrationElements(page)} elements`);

  // The client cache means a given text+lang is fetched at most once.
  const seenKeys = calls.map((c) => `${c.lang}|${c.text}`);
  const dupes = seenKeys.filter((k, i) => seenKeys.indexOf(k) !== i);
  pass('the same line is never requested twice', dupes.length === 0,
    dupes.length ? dupes[0].slice(0, 50) : `${seenKeys.length} unique requests`);
  await ctx.close();
}

// ── 4. mute and navigation stop narration ───────────────────────────────────
console.log('\n[4] Mute and navigation');
{
  const { ctx, page } = await makeCtx('serve');
  await openStory(page, 'en');

  // Wait until narration is genuinely audible, so "stopped" means something.
  let wasPlaying = 0;
  for (let i = 0; i < 20 && !wasPlaying; i++) {
    wasPlaying = await playingCount(page);
    if (!wasPlaying) await page.waitForTimeout(150);
  }
  pass('narration was playing before the mute test', wasPlaying > 0, `${wasPlaying} playing`);

  const mute = page.getByRole('button', { name: /Sound is on|Mute|كتم/ }).first();
  pass('a mute control exists', (await mute.count()) > 0);
  if (await mute.count()) {
    await mute.click();
    await page.waitForTimeout(500);
    pass('mute stops narration immediately', (await playingCount(page)) === 0,
      `${await playingCount(page)} still playing`);
  } else {
    pass('mute stops narration immediately', false, 'no mute control');
  }
  await ctx.close();
}

// ── 4b. leaving the screen stops narration ──────────────────────────────────
console.log('\n[4b] Navigation');
{
  const { ctx, page } = await makeCtx('serve');
  await openStory(page, 'en');
  let wasPlaying = 0;
  for (let i = 0; i < 20 && !wasPlaying; i++) {
    wasPlaying = await playingCount(page);
    if (!wasPlaying) await page.waitForTimeout(150);
  }
  pass('narration was playing before navigating', wasPlaying > 0, `${wasPlaying} playing`);

  const back = page.getByRole('button', { name: /Back|Close|رجوع|العودة|إغلاق/ }).first();
  if (await back.count()) {
    await back.click();
    await page.waitForTimeout(800);
    pass('navigating away leaves no narration playing', (await playingCount(page)) === 0,
      `${await playingCount(page)} still playing`);
  } else {
    pass('navigating away leaves no narration playing', false, 'no back control found');
  }
  await ctx.close();
}

// ── 5. fallback when the route declines ─────────────────────────────────────
console.log('\n[5] Fallback to the browser voice');
{
  const { ctx, page, calls } = await makeCtx('decline');
  await enterChild(page, 'en');
  await page.waitForTimeout(1500);
  pass('route was asked at least once', calls.length > 0, `${calls.length}`);
  const spoken = await page.evaluate(() => window.__spoken);
  pass('browser speech synthesis took over', spoken.length > 0, `${spoken.length} utterances`);
  pass('the app is not silent when narration is unconfigured', spoken.length > 0);
  // Once told NO_API_KEY the client must stop asking.
  const after = calls.length;
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button'))[0];
    b && b.click();
  });
  await page.waitForTimeout(800);
  pass('client stops re-requesting after NO_API_KEY', calls.length === after,
    `${calls.length - after} further requests`);
  await ctx.close();
}

// ── 6. captions still work (accessibility contract unchanged) ───────────────
console.log('\n[6] Caption contract preserved');
{
  const { ctx, page } = await makeCtx('serve');
  await enterChild(page, 'en');
  await page.waitForTimeout(1200);
  const hasText = await page.evaluate(() => document.body.innerText.trim().length > 20);
  pass('screen still carries on-screen text alongside narration', hasText);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
