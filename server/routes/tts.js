/**
 * ElevenLabs narration proxy.
 *
 * WHY THIS LIVES ON THE SERVER
 * ----------------------------
 * The obvious shortcut is to call ElevenLabs straight from the browser with the
 * key in a VITE_ env var. That would publish the key: everything Vite inlines
 * ends up in the shipped bundle, readable by anyone who opens devtools, and an
 * ElevenLabs key is billable. So the key stays here, the browser only ever asks
 * this route for audio, and the bundle contains no credential at all.
 *
 * WHY THERE IS A CACHE
 * --------------------
 * IRIS narrates the same few dozen lines over and over — "Pop the balloons!",
 * every story sentence, every encouragement phrase. Re-synthesising them would
 * be slow (a round trip before a child hears anything) and billed every time.
 * Responses are cached on disk under a hash of (text + voice + model), so each
 * distinct line costs one synthesis for the life of the install and replays are
 * served from disk in a millisecond.
 *
 * FAILURE BEHAVIOUR
 * -----------------
 * This route never 500s into a silent app. If the key is missing or ElevenLabs
 * is unreachable it returns a small JSON body with `fallback: true`, and the
 * client falls back to the browser's own speech synthesis. A failed network at
 * demo time therefore degrades to the old voice rather than to silence.
 */
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/** Overridable so the route can be pointed at a corporate proxy, a self-hosted
 *  gateway, or a mock during testing. Defaults to ElevenLabs itself. */
const API_ROOT = process.env.ELEVENLABS_API_ROOT || 'https://api.elevenlabs.io/v1';
/**
 * The cache lives next to the server normally, but serverless filesystems
 * (Vercel) are read-only outside /tmp — fall back to the OS temp dir there.
 * ensureCache() is called wherever we are about to write; if even temp is
 * read-only, narration still works, it just skips caching.
 */
let CACHE_DIR = process.env.TTS_CACHE_DIR || path.join(__dirname, '..', '.tts-cache');
const ensureCache = () => {
  try {
    ensureCache();
    return true;
  } catch {
    CACHE_DIR = path.join(require('os').tmpdir(), 'iris-tts-cache');
    try { fs.mkdirSync(CACHE_DIR, { recursive: true }); return true; } catch { return false; }
  }
};
ensureCache();

/**
 * Multilingual v2 handles both Egyptian Arabic and English from one voice
 * model, so the same configuration shape works for either language.
 */
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

/** Longest line we will synthesise. Guards against a runaway bill if some
 *  caller ever passes an article body instead of a sentence. */
const MAX_CHARS = 600;

const voiceFor = (lang) =>
  lang === 'ar'
    ? process.env.ELEVENLABS_VOICE_AR || ''
    : process.env.ELEVENLABS_VOICE_EN || '';

const apiKey = () => process.env.ELEVENLABS_API_KEY || '';

ensureCache();

/**
 * The last upstream problem, so /api/tts/status can say WHY narration is
 * falling back instead of leaving it to be guessed. Never contains the key:
 * only the status code and ElevenLabs' own message are kept.
 */
let lastError = null;
const noteError = (reason, detail = '') => {
  lastError = { reason, detail: String(detail).slice(0, 300), at: new Date().toISOString() };
};

/** Read a numeric env override, falling back to the tuned default. */
const num = (name, fallback) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) ? v : fallback;
};

/**
 * ── DELIVERY TUNING (Phase 8) ─────────────────────────────────────────────
 *
 * The VOICE is unchanged: same account, same two voice IDs, same model. Only
 * how those voices are delivered is tuned here.
 *
 * WHAT EACH DIAL DOES, AND WHY IT IS WHERE IT IS
 *
 *  stability   Higher = a more even, consistent read; lower = more expressive
 *              and more prone to swings. Raised from 0.50 because a child
 *              hears these lines dozens of times and pitch variation that
 *              sounds lively once becomes theatrical on the tenth repeat.
 *              NOT pushed near 1.0: that flattens the read into exactly the
 *              monotone the brief calls robotic. 0.60–0.68 is the calm band.
 *
 *  similarity  How closely the render tracks the original voice. Raised
 *              slightly because the voice itself is the part being kept —
 *              staying nearer the source is what protects its warmth.
 *
 *  style       Style exaggeration. Held at 0. This is the theatrical dial and
 *              the brief rules it out explicitly.
 *
 *  speaker     Speaker boost. Left on: it aids clarity of articulation, which
 *              matters most for Arabic consonants.
 *
 *  speed       Below 1.0 slows delivery. ElevenLabs documents the accepted
 *              range as 0.7–1.2. These sit just under 1.0 — audibly unhurried
 *              without the dragging quality that makes slowed speech sound
 *              impaired rather than calm.
 *
 * ARABIC IS TUNED SEPARATELY, AND MORE CONSERVATIVELY.
 * Egyptian Arabic carries meaning in consonant length and short vowels that a
 * fast or unstable read smears. Arabic therefore gets a slightly slower speed
 * and slightly higher stability than English. This is a DELIVERY difference
 * between two languages, not a difference between two children.
 *
 * Every value is env-overridable so the delivery can be adjusted on a demo
 * machine without a code change or a redeploy.
 */
const VOICE_SETTINGS_BY_LANG = {
  ar: {
    stability: num('ELEVENLABS_STABILITY_AR', 0.68),
    similarity_boost: num('ELEVENLABS_SIMILARITY_AR', 0.8),
    style: num('ELEVENLABS_STYLE_AR', 0),
    use_speaker_boost: process.env.ELEVENLABS_SPEAKER_BOOST !== 'false',
    speed: num('ELEVENLABS_SPEED_AR', 0.9),
  },
  en: {
    stability: num('ELEVENLABS_STABILITY_EN', 0.62),
    similarity_boost: num('ELEVENLABS_SIMILARITY_EN', 0.8),
    style: num('ELEVENLABS_STYLE_EN', 0),
    use_speaker_boost: process.env.ELEVENLABS_SPEAKER_BOOST !== 'false',
    speed: num('ELEVENLABS_SPEED_EN', 0.94),
  },
};

/**
 * `speed` is a comparatively recent addition to voice_settings and this code
 * cannot prove the deployed model accepts it without calling the live API.
 * If an account or model rejects it, ElevenLabs answers 422 — and a 422 would
 * otherwise silently drop every line to the browser voice, which is exactly
 * the working narration this phase must not break.
 *
 * So: send it, and if the upstream rejects the request as unprocessable, retry
 * once without `speed` and remember that for the rest of the process. The
 * voice keeps working either way, and /status reports which happened rather
 * than leaving it to be guessed.
 */
let speedSupported = true;

const settingsFor = (lang) => {
  const base = VOICE_SETTINGS_BY_LANG[lang] || VOICE_SETTINGS_BY_LANG.en;
  if (speedSupported) return { ...base };
  const { speed, ...withoutSpeed } = base;
  return withoutSpeed;
};

/**
 * Typographic pacing. Adjusts punctuation only — it never rewrites a word.
 *
 * Two changes, both aimed at delivery:
 *  - Runs of exclamation marks collapse to one. "برافو!!!" is read with the
 *    exaggerated excitement the brief rules out; "برافو!" is not.
 *  - A line ending in a letter gains a full stop, so the voice completes its
 *    cadence and settles instead of clipping off mid-breath.
 *
 * Applied BEFORE the cache key is computed, so the cache stores the audio for
 * what was actually synthesised.
 */
function paceText(input) {
  return String(input)
    .replace(/!{2,}/g, '!')
    .replace(/؟{2,}/g, '؟')
    .replace(/\?{2,}/g, '?')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/([\p{L}\p{N}])$/u, '$1.');
}

/** GET /api/tts/voices — list the account's voices so the two IDs can be
 *  chosen without hunting through the ElevenLabs dashboard. */
router.get('/voices', async (req, res) => {
  if (!apiKey()) {
    return res.status(503).json({ error: 'NO_API_KEY', detail: 'ELEVENLABS_API_KEY is not set.' });
  }
  try {
    const r = await fetch(`${API_ROOT}/voices`, { headers: { 'xi-api-key': apiKey() } });
    if (!r.ok) return res.status(r.status).json({ error: 'UPSTREAM', detail: await r.text() });
    const data = await r.json();
    res.json(
      (data.voices || []).map((v) => ({
        voice_id: v.voice_id,
        name: v.name,
        labels: v.labels || {},
        preview_url: v.preview_url,
      }))
    );
  } catch (err) {
    res.status(502).json({ error: 'UNREACHABLE', detail: String(err.message || err) });
  }
});

/** GET /api/tts/status — whether narration is configured, for diagnostics. */
router.get('/status', (req, res) => {
  res.json({
    configured: !!apiKey() && !!voiceFor('ar') && !!voiceFor('en'),
    hasKey: !!apiKey(),
    hasArabicVoice: !!voiceFor('ar'),
    hasEnglishVoice: !!voiceFor('en'),
    model: MODEL_ID,
    /**
     * Which upstream is actually being called. Not a secret — a URL — and
     * worth surfacing: a machine left pointed at a mock or a stale gateway
     * otherwise reports itself as perfectly healthy while producing audio
     * that is not from ElevenLabs at all.
     */
    apiRoot: API_ROOT,
    usingRealElevenLabs: /(^|\/\/)api\.elevenlabs\.io/.test(API_ROOT),
    cachedClips: fs.existsSync(CACHE_DIR) ? fs.readdirSync(CACHE_DIR).length : 0,
    /**
     * The delivery tuning actually in force, so what a demo machine is doing
     * can be read rather than inferred. These are dials, not credentials —
     * nothing here is sensitive.
     */
    delivery: {
      ar: settingsFor('ar'),
      en: settingsFor('en'),
      speedSupported,
      speedNote: speedSupported
        ? 'voice_settings.speed is being sent'
        : 'upstream rejected voice_settings.speed; delivery is tuned by stability/similarity only',
    },
    // Shape hints only — never the key itself. Enough to spot an empty value,
    // a pasted quote, or a stray newline without revealing the secret.
    keyLength: apiKey().length,
    keyLooksTrimmed: apiKey() === apiKey().trim(),
    lastError,
  });
});

/**
 * POST /api/tts  { text, lang }  →  audio/mpeg
 *
 * Responds 200 with JSON `{ fallback: true }` rather than an error status when
 * narration is not configured, so the client treats it as "use the browser
 * voice" instead of as a bug worth logging.
 */
router.post('/', async (req, res) => {
  const raw = String(req.body?.text || '').trim();
  const lang = req.body?.lang === 'ar' ? 'ar' : 'en';

  if (!raw) return res.status(400).json({ error: 'NO_TEXT' });
  if (raw.length > MAX_CHARS) {
    return res.json({ fallback: true, reason: 'TOO_LONG' });
  }

  // Pacing is applied before anything else, so the cache holds the audio for
  // the text that was actually spoken.
  const text = paceText(raw);

  const voiceId = voiceFor(lang);
  if (!apiKey() || !voiceId) {
    const reason = apiKey() ? 'NO_VOICE_ID' : 'NO_API_KEY';
    noteError(reason, apiKey() ? `no voice id configured for lang=${lang}` : 'ELEVENLABS_API_KEY is empty or missing');
    return res.json({ fallback: true, reason });
  }

  const settings = settingsFor(lang);

  // The settings are part of the key, so retuning delivery invalidates the
  // cache by construction — no stale clip in the old voice can survive a
  // change and quietly play alongside the new one.
  const key = crypto
    .createHash('sha256')
    .update(`${MODEL_ID}|${voiceId}|${JSON.stringify(settings)}|${text}`)
    .digest('hex');
  const cachePath = path.join(CACHE_DIR, `${key}.mp3`);

  // Cache hit: no network, no cost, no perceptible delay.
  if (fs.existsSync(cachePath)) {
    res.set('Content-Type', 'audio/mpeg');
    res.set('X-Tts-Cache', 'hit');
    return fs.createReadStream(cachePath).pipe(res);
  }

  /** One synthesis attempt. Separated so the no-speed retry is the same call. */
  const synthesise = (voice_settings) =>
    fetch(`${API_ROOT}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey(),
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings }),
    });

  try {
    let usedSettings = settings;
    let upstream = await synthesise(settings);

    // 422 is how ElevenLabs reports a parameter it will not accept. If `speed`
    // is the parameter, dropping it and retrying keeps the narration working
    // instead of failing every line over one dial.
    if (upstream.status === 422 && settings.speed !== undefined) {
      const detail = await upstream.text().catch(() => '');
      console.warn('[tts] upstream rejected voice_settings.speed — retrying without it');
      noteError('SPEED_UNSUPPORTED', detail);
      speedSupported = false;
      const { speed, ...withoutSpeed } = settings;
      usedSettings = withoutSpeed;
      upstream = await synthesise(withoutSpeed);
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.warn(`[tts] upstream ${upstream.status}: ${detail.slice(0, 200)}`);
      noteError(`UPSTREAM_${upstream.status}`, detail);
      return res.json({ fallback: true, reason: `UPSTREAM_${upstream.status}` });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());

    // File the audio under the settings that ACTUALLY produced it. If the
    // speed retry fired, `settings` and `usedSettings` differ, and writing to
    // the original key would store speed-less audio under a key that claims
    // speed was applied — a clip that never matches a later lookup and lingers
    // as dead weight in the cache.
    const writeKey = usedSettings === settings
      ? key
      : crypto.createHash('sha256')
          .update(`${MODEL_ID}|${voiceId}|${JSON.stringify(usedSettings)}|${text}`)
          .digest('hex');
    const writePath = path.join(CACHE_DIR, `${writeKey}.mp3`);

    /**
     * Caching is an optimisation, so a cache failure must not lose audio we
     * already have.
     *
     * This was found the hard way: deleting .tts-cache while the server was
     * running made every subsequent line fail with "UNREACHABLE" — the write
     * threw ENOENT, the throw reached the outer catch, and a perfectly good
     * synthesis was discarded and reported as a network problem. In the field
     * the same thing happens to a tmp reaper, a disk filling up, or a
     * container volume that comes back empty: narration would silently drop to
     * the browser voice while ElevenLabs was answering fine.
     *
     * So the write gets its own guard, recreates the directory if it has gone,
     * and never prevents the response.
     */
    try {
      ensureCache();
      // Temp name then rename, so a killed process cannot leave a truncated
      // mp3 in the cache that would replay as a clipped line forever.
      const tmp = `${writePath}.${process.pid}.part`;
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, writePath);
    } catch (cacheErr) {
      console.warn(`[tts] could not cache clip (serving it anyway): ${cacheErr.message}`);
    }

    lastError = null;
    res.set('Content-Type', 'audio/mpeg');
    res.set('X-Tts-Cache', 'miss');
    res.send(buf);
  } catch (err) {
    console.warn(`[tts] unreachable: ${err.message || err}`);
    noteError('UNREACHABLE', err.message || err);
    res.json({ fallback: true, reason: 'UNREACHABLE' });
  }
});

module.exports = router;
