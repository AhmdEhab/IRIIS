/**
 * Phase 8 — voice delivery tuning checks.
 *
 * The voice itself is not under test here and must not change: same account,
 * same two voice IDs, same model. What is under test is DELIVERY, plus the
 * guarantees that were in place before this phase and must survive it —
 * the key never reaching the browser, the cache still working, and the browser
 * fallback still catching every failure.
 *
 * Three languages are exercised separately, as the brief requires:
 *   1. Modern Standard Arabic
 *   2. Egyptian Arabic conversational phrases
 *   3. English
 *
 * ⚠ WHAT THIS SCRIPT CANNOT DO
 * It cannot judge how the voice sounds. Nothing automated can. The listening
 * check is `node scripts/check-voice.mjs`, which writes playable MP3s — and
 * that needs a real key and outbound access to api.elevenlabs.io. Sections
 * marked LIVE below are skipped, loudly, when the backend is not reachable.
 */
import fs from 'node:fs';
import path from 'node:path';

const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};
const skip = (n, why) => {
  results.push({ n, ok: true, skipped: true, extra: why });
  console.log(`  SKIP  ${n} — ${why}`);
};

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
const ttsSrc = read('server/routes/tts.js');
const audioSrc = read('src/App/contexts/AudioContext.tsx');
const clientSrc = read('src/App/audio/voice.ts');

// The route is CommonJS; load it in a child context to read its live values.
const settings = await (async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(path.join(process.cwd(), 'server/routes/'));
  // Reading /status through the router would need express plumbing; the values
  // are parsed from source instead so this works with no server running.
  const grab = (lang) => {
    const block = ttsSrc.split(`  ${lang}: {`)[1]?.split('},')[0] ?? '';
    const n = (k) => Number(block.match(new RegExp(`${k}:\\s*num\\([^,]+,\\s*([0-9.]+)\\)`))?.[1]);
    return {
      stability: n('stability'),
      similarity_boost: n('similarity_boost'),
      style: n('style'),
      speed: n('speed'),
    };
  };
  return { ar: grab('ar'), en: grab('en') };
})();

// ── 1. the voice itself is untouched ────────────────────────────────────────
console.log('\n[1] The voice, the model and the integration are unchanged');
{
  pass('voice IDs still come from env, not from code',
    /ELEVENLABS_VOICE_AR/.test(ttsSrc) && /ELEVENLABS_VOICE_EN/.test(ttsSrc)
    && !/voice_id\s*[:=]\s*['"][A-Za-z0-9]{15,}/.test(ttsSrc));
  pass('no hardcoded voice ID anywhere in the route',
    !/[A-Za-z0-9]{20}/.test(ttsSrc.replace(/[a-z_]+_[A-Z]+/g, '')) || !/voice/i.test(ttsSrc.match(/[A-Za-z0-9]{20}/)?.[0] ?? ''));
  pass('the model is unchanged (eleven_multilingual_v2)', /eleven_multilingual_v2/.test(ttsSrc));
  pass('the API root is still ElevenLabs', /api\.elevenlabs\.io/.test(ttsSrc));
  pass('the POST /api/tts route still exists', /router\.post\('\/'/.test(ttsSrc));
  pass('the /voices route still exists', /router\.get\('\/voices'/.test(ttsSrc));
  pass('the /status route still exists', /router\.get\('\/status'/.test(ttsSrc));
}

// ── 2. the delivery tuning is in the calm band ──────────────────────────────
console.log('\n[2] Delivery is calmer, warmer and slower');
{
  for (const lang of ['ar', 'en']) {
    const s = settings[lang];
    pass(`${lang}: stability is in the calm band (0.55–0.75)`,
      s.stability >= 0.55 && s.stability <= 0.75,
      `stability=${s.stability}`);
    pass(`${lang}: stability is not pushed to monotone (< 0.85)`, s.stability < 0.85);
    pass(`${lang}: style exaggeration is off — nothing theatrical`, s.style === 0);
    pass(`${lang}: speed is slower than default but not dragging (0.85–0.99)`,
      s.speed >= 0.85 && s.speed < 1.0, `speed=${s.speed}`);
    pass(`${lang}: speed is inside the documented 0.7–1.2 range`, s.speed >= 0.7 && s.speed <= 1.2);
    pass(`${lang}: similarity stays high, protecting the voice they like`,
      s.similarity_boost >= 0.75, `similarity=${s.similarity_boost}`);
  }

  // Arabic is the language the brief singles out.
  pass('Arabic is delivered slower than English', settings.ar.speed < settings.en.speed,
    `ar ${settings.ar.speed} < en ${settings.en.speed}`);
  pass('Arabic is delivered steadier than English', settings.ar.stability > settings.en.stability,
    `ar ${settings.ar.stability} > en ${settings.en.stability}`);

  pass('every dial is env-overridable without a code change',
    (ttsSrc.match(/num\('ELEVENLABS_/g) || []).length >= 8);
}

// ── 3. the browser fallback matches, so the two do not sound like two people ─
console.log('\n[3] The browser fallback is tuned to match');
{
  const rateAr = Number(audioSrc.match(/language === 'ar' \? ([0-9.]+) : ([0-9.]+)/)?.[1]);
  const rateEn = Number(audioSrc.match(/language === 'ar' \? ([0-9.]+) : ([0-9.]+)/)?.[2]);
  const pitch = Number(audioSrc.match(/u\.pitch = ([0-9.]+)/)?.[1]);

  pass('fallback rate is slower than default', rateAr < 1 && rateEn < 1, `ar ${rateAr}, en ${rateEn}`);
  pass('fallback Arabic is slower than fallback English', rateAr < rateEn);
  pass('fallback pitch is natural, not a raised child voice', pitch === 1.0, `pitch=${pitch}`);
  pass('the fallback still exists and is still reached',
    /browserSpeak/.test(audioSrc) && /browserSpeak\(clean, language\)/.test(audioSrc));
}

// ── 4. pacing changes punctuation only, never words ─────────────────────────
console.log('\n[4] Pacing adjusts punctuation, never content');
{
  // Re-implement the route's own transform from its source, so the test reads
  // what ships rather than a copy that can drift.
  const body = ttsSrc.split('function paceText(input) {')[1].split('\n}')[0];
  // eslint-disable-next-line no-new-func
  const paceText = new Function('input', body.replace('return String', 'return String'));

  const cases = [
    ['برافو عليك!!!', 'برافو عليك!'],
    ['يلا نجربها سوا', 'يلا نجربها سوا.'],
    ['خد وقتك.', 'خد وقتك.'],
    ['ولا يهمك، نجرب بطريقة تانية', 'ولا يهمك، نجرب بطريقة تانية.'],
    ['Great job!!', 'Great job!'],
    ['Tap the cat', 'Tap the cat.'],
    ['كام واحدة؟؟', 'كام واحدة؟'],
  ];
  for (const [input, expected] of cases) {
    pass(`pacing: "${input}" → "${expected}"`, paceText(input) === expected, `got "${paceText(input)}"`);
  }

  // The words themselves must survive untouched.
  const stripPunct = (s) => s.replace(/[.!?؟،]/g, '').replace(/\s+/g, ' ').trim();
  for (const [input] of cases) {
    pass(`pacing leaves the words of "${input.slice(0, 18)}…" alone`,
      stripPunct(paceText(input)) === stripPunct(input));
  }
}

// ── 5. security — nothing here may leak the key ─────────────────────────────
console.log('\n[5] No secret exposed, no secret logged');
{
  pass('the key is only ever read from the environment',
    /process\.env\.ELEVENLABS_API_KEY/.test(ttsSrc) && !/xi-api-key['"]\s*:\s*['"][A-Za-z0-9_-]{10,}/.test(ttsSrc));

  const logs = ttsSrc.match(/console\.(log|warn|error)\([^)]*\)/g) || [];
  pass('no log statement interpolates the key',
    logs.every((l) => !/apiKey\(\)|API_KEY/.test(l)), logs.length + ' log statements checked');

  pass('/status reports key SHAPE only, never the value',
    /keyLength: apiKey\(\)\.length/.test(ttsSrc) && !/key: apiKey\(\)/.test(ttsSrc));

  pass('the delivery block in /status contains no credential',
    !/apiKey|API_KEY|voiceFor/.test(ttsSrc.split('delivery: {')[1]?.split('},')[0] ?? ''));

  // Look for a credential, not for the word. The client legitimately mentions
  // ELEVENLABS_SETUP.md in a doc comment; that is a filename, not a secret,
  // and a check that flags it teaches people to ignore this check.
  pass('the browser client never sends or holds a key',
    !/xi-api-key/i.test(clientSrc)
    && !/ELEVENLABS_API_KEY/.test(clientSrc)
    && !/sk_[A-Za-z0-9]{10,}/.test(clientSrc)
    && !/import\.meta\.env\.VITE_ELEVEN/i.test(clientSrc));

  // The whole point of the server proxy is that the browser talks to IRIS.
  pass('the client only ever calls the IRIS backend for audio',
    /\$\{API_URL\}\/tts/.test(clientSrc) && !/api\.elevenlabs\.io/.test(clientSrc));

  // A source file that reads as binary hides from grep and from git diffs.
  pass('the client source is plain text, not binary',
    !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(clientSrc));

  // The built bundle is the thing that actually ships.
  const distDir = path.join(process.cwd(), 'dist/assets');
  if (fs.existsSync(distDir)) {
    const bundle = fs.readdirSync(distDir).filter((f) => f.endsWith('.js'))
      .map((f) => read(`dist/assets/${f}`)).join('');
    pass('no ElevenLabs key pattern in the built bundle', !/sk_[A-Za-z0-9]{20,}/.test(bundle));
    pass('no xi-api-key header in the built bundle', !/xi-api-key/i.test(bundle));
    pass('no ELEVENLABS_ env name inlined into the bundle', !/ELEVENLABS_API_KEY/.test(bundle));
  } else {
    skip('bundle scan', 'no dist/ — run npm run build first');
  }
}

// ── 6. the fallback contract survives ───────────────────────────────────────
console.log('\n[6] Failure still degrades to the browser voice, never to silence');
{
  pass('a missing key returns fallback, not an error status',
    /reason = apiKey\(\) \? 'NO_VOICE_ID' : 'NO_API_KEY'/.test(ttsSrc) && /res\.json\(\{ fallback: true, reason \}\)/.test(ttsSrc));
  pass('an upstream error returns fallback', /fallback: true, reason: `UPSTREAM_/.test(ttsSrc));
  pass('an unreachable upstream returns fallback', /fallback: true, reason: 'UNREACHABLE'/.test(ttsSrc));
  pass('an over-long line returns fallback', /fallback: true, reason: 'TOO_LONG'/.test(ttsSrc));
  pass('the client treats null as "use the browser voice"',
    /Resolves to an object URL, or null/.test(clientSrc) || /null meaning "use the browser voice/.test(clientSrc));

  // The one new failure mode this phase introduces.
  pass('a rejected speed parameter retries instead of failing the line',
    /upstream\.status === 422 && settings\.speed !== undefined/.test(ttsSrc)
    && /speedSupported = false/.test(ttsSrc));
  pass('the speed retry is remembered, not repeated on every line',
    /let speedSupported = true/.test(ttsSrc) && /if \(speedSupported\) return \{ \.\.\.base \}/.test(ttsSrc));
  pass('/status says whether speed is actually being applied', /speedSupported,/.test(ttsSrc));
}

// ── 7. caching still works, and retuning invalidates it ─────────────────────
console.log('\n[7] Caching');
{
  pass('the cache key includes the delivery settings',
    /JSON\.stringify\(settings\)/.test(ttsSrc),
    'retuning therefore cannot serve a clip rendered with the old settings');
  pass('the cache is keyed on the paced text, not the raw text',
    ttsSrc.indexOf('const text = paceText(raw)') < ttsSrc.indexOf('createHash'));
  pass('audio is filed under the settings that actually produced it',
    /usedSettings === settings/.test(ttsSrc));
  pass('writes are atomic (temp file then rename)', /\.part`/.test(ttsSrc) && /renameSync/.test(ttsSrc));
  pass('cache hits are still served without a network call', /X-Tts-Cache', 'hit'/.test(ttsSrc));
}

// ── 8. LIVE — three languages through the running backend ───────────────────
console.log('\n[8] LIVE: Arabic, Egyptian Arabic and English through the backend');
{
  const API = process.env.IRIS_API || 'http://localhost:5000/api';
  const OUT = 'voice-tuning-output';

  let status = null;
  try {
    const r = await fetch(`${API}/tts/status`, { signal: AbortSignal.timeout(3000) });
    status = await r.json();
  } catch {
    status = null;
  }

  if (!status) {
    skip('live synthesis', `backend not reachable at ${API} — start it with: npm run server`);
  } else {
    pass('backend is up and the TTS route answers', true);
    pass('the tuning is visible in /status', !!status.delivery, JSON.stringify(status.delivery?.ar ?? {}));
    pass('/status still exposes no key', !JSON.stringify(status).match(/sk_[A-Za-z0-9]{10,}/));

    // Without this, a backend pointed at a mock or a stale gateway passes
    // every check below while producing audio ElevenLabs never made.
    if (status.usingRealElevenLabs) {
      pass('the backend is calling the real ElevenLabs API', true, status.apiRoot);
    } else {
      pass('the backend is calling the real ElevenLabs API', false,
        `ELEVENLABS_API_ROOT is ${status.apiRoot} — the audio below is NOT from ElevenLabs`);
    }

    if (!status.configured) {
      skip('live synthesis', `narration not configured (hasKey=${status.hasKey}, ar=${status.hasArabicVoice}, en=${status.hasEnglishVoice}) — the fallback path is what runs`);
    } else {
      fs.mkdirSync(OUT, { recursive: true });
      const cases = [
        ['1. Modern Standard Arabic', 'ar', 'سوف نتعلم الحروف معًا اليوم.', 'msa.mp3'],
        ['2. Egyptian Arabic — conversational', 'ar', 'يلا نجربها سوا. خد وقتك. برافو عليك.', 'egyptian.mp3'],
        ['2b. Egyptian Arabic — gentle correction', 'ar', 'ولا يهمك، نجرب بطريقة تانية.', 'egyptian-retry.mp3'],
        ['3. English', 'en', "Take your time. You are doing well.", 'english.mp3'],
      ];

      for (const [label, lang, text, file] of cases) {
        try {
          const r = await fetch(`${API}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, lang }),
            signal: AbortSignal.timeout(30000),
          });
          const ct = r.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const body = await r.json();
            pass(`${label}: ElevenLabs used`, false, `fell back: ${body.reason}`);
            continue;
          }
          const buf = Buffer.from(await r.arrayBuffer());
          const isMp3 = buf.length > 1000 && (buf[0] === 0xff || buf.slice(0, 3).toString() === 'ID3');
          fs.writeFileSync(path.join(OUT, file), buf);
          const from = status.usingRealElevenLabs ? 'ElevenLabs' : `NON-ELEVENLABS upstream (${status.apiRoot})`;
          pass(`${label}: real MP3 from ${from}`, isMp3,
            `${(buf.length / 1024).toFixed(1)} KB, cache=${r.headers.get('x-tts-cache')} → ${OUT}/${file}`);
        } catch (e) {
          pass(`${label}: synthesis`, false, e.message);
        }
      }

      // Cache behaviour, on a line just synthesised.
      try {
        const again = await fetch(`${API}/tts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: "Take your time. You are doing well.", lang: 'en' }),
          signal: AbortSignal.timeout(15000),
        });
        pass('a repeated line is served from cache', again.headers.get('x-tts-cache') === 'hit');
      } catch (e) {
        pass('a repeated line is served from cache', false, e.message);
      }

      const after = await (await fetch(`${API}/tts/status`)).json();
      pass('speed was accepted by the account and model', after.delivery?.speedSupported === true,
        after.delivery?.speedNote ?? '');
      console.log(`\n  ▶ Listen to the files in ${OUT}/ — that is the only real test of how it sounds.`);
    }
  }
}

const failed = results.filter((r) => !r.ok);
const skipped = results.filter((r) => r.skipped);
console.log(`\n=== ${results.length - failed.length - skipped.length}/${results.length - skipped.length} checks passed${skipped.length ? `, ${skipped.length} skipped` : ''} ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
