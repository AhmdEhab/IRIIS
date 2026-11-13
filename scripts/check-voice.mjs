/**
 * IRIS narration diagnostic.
 *
 *   node scripts/check-voice.mjs
 *
 * Walks the whole path in order and stops at the first thing that is actually
 * broken, so the answer is never "it doesn't work" but "step 3 returned 401".
 *
 *   1. server/.env loads, and the three values are present
 *   2. ElevenLabs is reachable and the KEY ITSELF is valid  (direct call)
 *   3. both configured voice IDs exist on that account       (direct call)
 *   4. Arabic + English synthesis really returns playable MP3 (direct call)
 *   5. the same two lines through the IRIS backend           (if it is running)
 *
 * Steps 1-4 do not involve IRIS at all. If they pass and step 5 fails, the
 * problem is in our server. If step 2 fails, no amount of IRIS code will help.
 *
 * The API key is never printed. Only its length and whether it has stray
 * whitespace are reported — enough to spot a bad paste, not enough to leak.
 *
 * Two MP3s are written to scripts/voice-check-output/. PLAY THEM. An HTTP 200
 * only proves bytes arrived; listening is the only way to confirm the Arabic
 * voice actually speaks Arabic.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'voice-check-output');

const require_ = createRequire(path.join(ROOT, 'server/'));
const { loadEnv } = require_('./loadEnv.js');

const AR_TEXT = 'أهلاً يا بطل. يلا نتعلم ونلعب سوا.';
const EN_TEXT = "Great job. Let's learn and play together.";

/**
 * Delivery settings, kept in step with server/routes/tts.js (Phase 8).
 * Arabic is slower and steadier than English on purpose — Egyptian Arabic
 * carries meaning in consonant length and short vowels that a quick or
 * unstable read smears.
 */
const SETTINGS = {
  ar: { stability: 0.68, similarity_boost: 0.8, style: 0, use_speaker_boost: true, speed: 0.90 },
  en: { stability: 0.62, similarity_boost: 0.8, style: 0, use_speaker_boost: true, speed: 0.94 },
};

let failed = false;
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => { failed = true; console.log(`  \x1b[31m✗\x1b[0m ${m}`); };
const info = (m) => console.log(`    ${m}`);
const head = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`);

/** Is this buffer a real MP3? Checks for an ID3 tag or an MPEG frame sync. */
function looksLikeMp3(buf) {
  if (buf.length < 512) return { valid: false, why: `only ${buf.length} bytes` };
  if (buf.slice(0, 3).toString('ascii') === 'ID3') return { valid: true, why: 'ID3 tag' };
  for (let i = 0; i < Math.min(buf.length - 1, 4096); i++) {
    // Frame sync: 11 set bits.
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      return { valid: true, why: `MPEG frame sync at byte ${i}` };
    }
  }
  return { valid: false, why: 'no ID3 tag and no MPEG frame sync found' };
}

// ── 1. configuration ────────────────────────────────────────────────────────
head('1. server/.env');
loadEnv();
const KEY = process.env.ELEVENLABS_API_KEY || '';
const AR_ID = process.env.ELEVENLABS_VOICE_AR || '';
const EN_ID = process.env.ELEVENLABS_VOICE_EN || '';
const MODEL = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const ROOT_URL = process.env.ELEVENLABS_API_ROOT || 'https://api.elevenlabs.io/v1';

KEY ? ok(`ELEVENLABS_API_KEY present (${KEY.length} chars)`) : bad('ELEVENLABS_API_KEY is MISSING or empty');
if (KEY && KEY !== KEY.trim()) bad('the key has leading/trailing whitespace — remove it');
if (KEY && /["']/.test(KEY)) bad('the key contains a quote character — remove the quotes');
AR_ID ? ok(`ELEVENLABS_VOICE_AR = ${AR_ID}`) : bad('ELEVENLABS_VOICE_AR is MISSING');
EN_ID ? ok(`ELEVENLABS_VOICE_EN = ${EN_ID}`) : bad('ELEVENLABS_VOICE_EN is MISSING');
info(`model: ${MODEL}`);
if (!KEY || !AR_ID || !EN_ID) {
  console.log('\n\x1b[31mSTOP\x1b[0m — fix server/.env first. See docs/ELEVENLABS_SETUP.md.');
  process.exit(1);
}

// ── 2. is the KEY valid? ────────────────────────────────────────────────────
head('2. ElevenLabs — is the key itself accepted?');
let voices = null;
try {
  const r = await fetch(`${ROOT_URL}/voices`, { headers: { 'xi-api-key': KEY } });
  if (r.status === 401) {
    bad('HTTP 401 — ElevenLabs REJECTED this API key.');
    info('The key is wrong, revoked, or belongs to a different service.');
    info('Create a fresh key: elevenlabs.io → profile icon → API Keys.');
  } else if (r.status === 403) {
    bad('HTTP 403 — the key is recognised but not permitted to do this.');
    info((await r.text()).slice(0, 300));
  } else if (!r.ok) {
    bad(`HTTP ${r.status} from ElevenLabs`);
    info((await r.text()).slice(0, 300));
  } else {
    const data = await r.json();
    voices = data.voices || [];
    ok(`key accepted — the account has ${voices.length} voice(s)`);
  }
} catch (err) {
  bad(`could not reach ElevenLabs: ${err.message}`);
  info('Check internet access, a VPN, or a corporate firewall/proxy.');
}
if (!voices) {
  console.log('\n\x1b[31mSTOP\x1b[0m — IRIS cannot work until this step passes. Nothing in the app is at fault.');
  process.exit(1);
}

// ── 3. do the configured voice IDs exist? ───────────────────────────────────
head('3. Are the two configured voice IDs on this account?');
const byId = new Map(voices.map((v) => [v.voice_id, v]));
for (const [label, id] of [['Arabic', AR_ID], ['English', EN_ID]]) {
  const v = byId.get(id);
  if (v) ok(`${label}: "${v.name}" (${id})`);
  else {
    bad(`${label} voice ID ${id} is NOT on this account`);
    info('Available: ' + voices.map((x) => `${x.name}=${x.voice_id}`).join(', ').slice(0, 400));
  }
}
if (AR_ID === EN_ID) bad('both languages point at the SAME voice ID — Arabic and English will sound identical');

// ── 4. real synthesis, direct ───────────────────────────────────────────────
head('4. Direct synthesis (bypassing the IRIS backend entirely)');
fs.mkdirSync(OUT, { recursive: true });
const written = [];
for (const [label, id, text, file] of [
  ['Arabic', AR_ID, AR_TEXT, 'arabic.mp3'],
  ['English', EN_ID, EN_TEXT, 'english.mp3'],
]) {
  try {
    const r = await fetch(`${ROOT_URL}/text-to-speech/${id}`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        // Mirrors the Phase 8 delivery tuning in server/routes/tts.js. If this
        // drifts from the route, the diagnostic stops telling you what the app
        // actually sounds like — which is the only thing it is for.
        voice_settings: SETTINGS[label === 'Arabic' ? 'ar' : 'en'],
      }),
    });
    if (!r.ok) {
      bad(`${label}: HTTP ${r.status}`);
      info((await r.text()).slice(0, 300));
      if (r.status === 429) info('Rate/concurrency limit — wait a moment and re-run.');
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const v = looksLikeMp3(buf);
    const p = path.join(OUT, file);
    fs.writeFileSync(p, buf);
    written.push(p);
    if (v.valid) ok(`${label}: ${(buf.length / 1024).toFixed(1)} KB of real MP3 (${v.why}) → ${p}`);
    else bad(`${label}: ${buf.length} bytes but NOT valid MP3 — ${v.why}`);
  } catch (err) {
    bad(`${label}: ${err.message}`);
  }
}

// ── 5. through the IRIS backend ─────────────────────────────────────────────
head('5. Through the IRIS backend (http://localhost:5000)');
const API = process.env.IRIS_API || 'http://localhost:5000/api';
let backendUp = false;
try {
  const s = await fetch(`${API}/tts/status`);
  const body = await s.json();
  backendUp = true;
  ok('backend is running');
  for (const k of ['configured', 'hasKey', 'hasArabicVoice', 'hasEnglishVoice']) {
    body[k] ? ok(`status.${k} = true`) : bad(`status.${k} = false`);
  }
  info(`cached clips on disk: ${body.cachedClips}`);
  if (body.lastError) info(`last upstream error: ${body.lastError.reason} — ${body.lastError.detail.slice(0, 160)}`);
} catch {
  bad('backend is not running — start it with:  npm run server');
  info('(Steps 1-4 above already prove whether ElevenLabs itself works.)');
}

if (backendUp) {
  for (const [label, lang, text, file] of [
    ['Arabic', 'ar', AR_TEXT, 'arabic-via-backend.mp3'],
    ['English', 'en', EN_TEXT, 'english-via-backend.mp3'],
  ]) {
    try {
      const r = await fetch(`${API}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });
      const ctype = r.headers.get('content-type') || '';
      if (ctype.includes('application/json')) {
        const b = await r.json();
        bad(`${label}: backend returned the JSON FALLBACK, reason = ${b.reason}`);
        continue;
      }
      const buf = Buffer.from(await r.arrayBuffer());
      const v = looksLikeMp3(buf);
      const p = path.join(OUT, file);
      fs.writeFileSync(p, buf);
      written.push(p);
      if (v.valid) ok(`${label}: audio/mpeg, ${(buf.length / 1024).toFixed(1)} KB, cache=${r.headers.get('x-tts-cache')} → ${p}`);
      else bad(`${label}: not valid MP3 — ${v.why}`);
    } catch (err) {
      bad(`${label}: ${err.message}`);
    }
  }
}

// ── verdict ─────────────────────────────────────────────────────────────────
head(failed ? 'RESULT: problems found' : 'RESULT: the whole path works');
if (written.length) {
  console.log('\n  Now LISTEN to these — a 200 only proves bytes arrived:');
  written.forEach((p) => console.log(`    ${p}`));
  console.log('\n  arabic.mp3 must speak ARABIC in a female voice.');
  console.log('  english.mp3 must speak ENGLISH in a female voice.');
  console.log('  If they are swapped, swap ELEVENLABS_VOICE_AR and ELEVENLABS_VOICE_EN in server/.env.');
}
process.exit(failed ? 1 : 0);
