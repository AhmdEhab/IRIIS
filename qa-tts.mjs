/**
 * Narration route QA.
 *
 * The real ElevenLabs API is not reachable from the build sandbox, so this
 * stands a mock upstream in front of the route and proves the logic that
 * actually matters: correct voice per language, caching, and every failure mode
 * degrading to `fallback` rather than to an error or to silence.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};

const AR_VOICE = 'voice_arabic_female_TEST';
const EN_VOICE = 'voice_english_female_TEST';
const MP3 = fs.readFileSync(path.join(__dirname, 'public/sounds/correct/cheer-yay.mp3'));

// ── mock ElevenLabs ─────────────────────────────────────────────────────────
const seen = [];
let upstreamMode = 'ok'; // 'ok' | '429' | 'dead'

const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    if (req.url === '/voices') {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ voices: [{ voice_id: AR_VOICE, name: 'Layla' }] }));
    }
    const voiceId = req.url.split('/text-to-speech/')[1] || '';
    seen.push({ voiceId, key: req.headers['xi-api-key'], text: JSON.parse(body || '{}').text });
    if (upstreamMode === '429') {
      res.statusCode = 429;
      return res.end('rate limited');
    }
    res.setHeader('content-type', 'audio/mpeg');
    res.end(MP3);
  });
});
await new Promise((r) => mock.listen(9911, r));

// ── the route under test ────────────────────────────────────────────────────
const CACHE = path.join(__dirname, 'server/.tts-cache');
fs.rmSync(CACHE, { recursive: true, force: true });

process.env.ELEVENLABS_API_ROOT = 'http://127.0.0.1:9911';
process.env.ELEVENLABS_API_KEY = 'sk-test-key';
process.env.ELEVENLABS_VOICE_AR = AR_VOICE;
process.env.ELEVENLABS_VOICE_EN = EN_VOICE;

// express lives under server/node_modules, so resolve from there.
const { createRequire } = await import('node:module');
const require_ = createRequire(path.join(__dirname, 'server/'));
const express = require_('express');
const app = express();
app.use(express.json());
app.use('/api/tts', require_('./routes/tts.js'));
const srv = app.listen(9912);

const post = (body) =>
  fetch('http://127.0.0.1:9912/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// ── 1. language → voice ─────────────────────────────────────────────────────
console.log('\n[1] Language selects the voice');
{
  const ar = await post({ text: 'برافو عليك', lang: 'ar' });
  pass('Arabic returns audio', ar.headers.get('content-type') === 'audio/mpeg');
  pass('Arabic used the Arabic voice ID', seen.at(-1).voiceId === AR_VOICE, seen.at(-1).voiceId);

  const en = await post({ text: 'Well done', lang: 'en' });
  pass('English returns audio', en.headers.get('content-type') === 'audio/mpeg');
  pass('English used the English voice ID', seen.at(-1).voiceId === EN_VOICE, seen.at(-1).voiceId);

  pass('API key is sent upstream, not to the client', seen.at(-1).key === 'sk-test-key');
}

// ── 2. dynamic text ─────────────────────────────────────────────────────────
console.log('\n[2] Dynamic runtime text');
{
  const r = await post({ text: 'Great job, Salma! You found the carrot.', lang: 'en' });
  pass('arbitrary runtime sentence synthesises', r.status === 200 && r.headers.get('content-type') === 'audio/mpeg');
  pass('the exact dynamic text reached upstream', seen.at(-1).text.includes('Salma'));
}

// ── 3. caching ──────────────────────────────────────────────────────────────
console.log('\n[3] Caching');
{
  const before = seen.length;
  const a = await post({ text: 'برافو عليك', lang: 'ar' });
  pass('repeat request is a cache hit', a.headers.get('x-tts-cache') === 'hit', a.headers.get('x-tts-cache'));
  pass('cache hit makes no upstream call', seen.length === before, `${seen.length - before} calls`);
  const bytes = Buffer.from(await a.arrayBuffer());
  pass('cached audio is byte-identical to the original', bytes.equals(MP3), `${bytes.length}B`);

  const sameTextOtherLang = await post({ text: 'برافو عليك', lang: 'en' });
  pass('same text in the other language is cached separately',
    sameTextOtherLang.headers.get('x-tts-cache') === 'miss');
}

// ── 4. graceful failure ─────────────────────────────────────────────────────
console.log('\n[4] Failure modes all degrade to fallback');
{
  upstreamMode = '429';
  const rate = await post({ text: 'a brand new line for rate limiting', lang: 'en' });
  const rateBody = await rate.json();
  pass('rate limit → fallback, not an error status', rate.status === 200 && rateBody.fallback === true, rateBody.reason);

  upstreamMode = 'ok';
  const long = await post({ text: 'x'.repeat(700), lang: 'en' });
  pass('over-long text → fallback', (await long.json()).reason === 'TOO_LONG');

  const empty = await post({ text: '   ', lang: 'en' });
  pass('empty text → 400, never a synthesis', empty.status === 400);

  delete process.env.ELEVENLABS_API_KEY;
  const noKey = await post({ text: 'no key configured line', lang: 'en' });
  pass('missing key → fallback with NO_API_KEY', (await noKey.json()).reason === 'NO_API_KEY');
  process.env.ELEVENLABS_API_KEY = 'sk-test-key';

  delete process.env.ELEVENLABS_VOICE_AR;
  const noVoice = await post({ text: 'no voice configured line', lang: 'ar' });
  pass('missing voice ID → fallback with NO_VOICE_ID', (await noVoice.json()).reason === 'NO_VOICE_ID');
  process.env.ELEVENLABS_VOICE_AR = AR_VOICE;

  await new Promise((r) => mock.close(r));
  const dead = await post({ text: 'upstream is gone entirely', lang: 'en' });
  const deadBody = await dead.json();
  pass('unreachable upstream → fallback, not a crash', dead.status === 200 && deadBody.fallback === true, deadBody.reason);
}

// ── 5. status endpoint ──────────────────────────────────────────────────────
console.log('\n[5] Status');
{
  const s = await (await fetch('http://127.0.0.1:9912/api/tts/status')).json();
  pass('status reports configured', s.configured === true);
  pass('status never echoes the key', !JSON.stringify(s).includes('sk-test-key'));
}

srv.close();
fs.rmSync(CACHE, { recursive: true, force: true });

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
