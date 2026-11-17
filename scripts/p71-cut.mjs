#!/usr/bin/env node
/* P71 CUT — generic token-stream aligner over the plan file.
   /tmp/p71-plan.json: { batch: { wav, texts[] } } where texts are the EXACT
   spoken strings of that audio (cleanSpeechText output). Each batch needs its
   whisper sidecar at <dir-of-wav>/<batch>_transcription_*.json (produced by
   `manus-speech-to-text <wav>`).
   Cuts one mp3 per phrase into public/audio/tts/p71-###.mp3 and writes
   /tmp/p71-map.json keyed by the spoken text itself.
   Alignment logic is the P70 v2 algorithm (proportional placement inside
   segments + silence snapping + proportional fallback). */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import path from 'path';

const plan = JSON.parse(readFileSync('/tmp/p71-plan.json', 'utf-8'));
const norm = (s) => String(s)
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ').trim();
const isDigit = (t) => /^[0-9]$/.test(t);
const fuzz = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4));

const OUT = 'public/audio/tts';
mkdirSync(OUT, { recursive: true });
// wipe any previous p71 attempts
for (const f of readdirSync(OUT)) if (f.startsWith('p71-')) { /* keep none */ try { writeFileSync(`/dev/null`, ''); } catch {} }
const map = {};
let next = 1;
const problems = [];
// clip files that a later merge must keep: keyed by spoken text.
const existing = {};
for (const f of readdirSync(OUT)) {
  const m = f.match(/^p71-(\d+)\.mp3$/);
  if (m) existing[+m[1]] = f;
}

for (const [name, { wav, texts }] of Object.entries(plan)) {
  const dir = path.dirname(wav);
  const jf = readdirSync(dir).find((f) => f.startsWith(name + '_transcription_') && f.endsWith('.json'));
  if (!jf) { console.log(name, 'NO SIDECAR'); texts.forEach((t) => problems.push(t)); continue; }
  const { segments } = JSON.parse(readFileSync(path.join(dir, jf), 'utf-8'));
  const T = [];
  for (let si = 0; si < segments.length; si++) {
    const sg = segments[si];
    const dur = sg.end - sg.start;
    const raw = sg.text.trim();
    let charCursor = 0;
    for (const w of raw.split(/\s+/)) {
      const at = raw.indexOf(w, charCursor);
      charCursor = at + w.length;
      T.push({ tok: norm(w), raw: w, seg: si, pos: at, segStart: sg.start, segDur: dur, segLen: Math.max(1, raw.length) });
    }
  }
  const timeOf = (tk, endOf = false) => tk.segStart + tk.segDur * ((tk.pos + (endOf ? tk.raw.length : 0)) / tk.segLen);
  const errv = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-40dB:d=0.22', '-f', 'null', '/dev/null'], { maxBuffer: 1 << 26, encoding: 'utf-8' }).stderr || '';
  const ss = [...errv.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => +m[1]);
  const se = [...errv.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => +m[1]);
  const mids = ss.map((a, i) => (a + (se[i] ?? a + 0.3)) / 2);
  const snap = (t) => { let best = t, bd = 0.45; for (const mid of mids) { const d = Math.abs(mid - t); if (d < bd) { bd = d; best = mid; } } return best; };

  let P = 0;
  const estMiss = [];
  for (let k = 0; k < texts.length; k++) {
    const spoken = texts[k];
    const exp = norm(spoken).split(' ').filter(Boolean);
    if (!exp.length) { problems.push(spoken); continue; }
    let scan = P, startTk = null;
    if (isDigit(exp[0])) {
      startTk = T[scan] || null;
      if (startTk && exp[1] && fuzz(startTk.tok, exp[1])) { /* digit dropped; startTk is word 2 */ }
      else scan += 1;
    } else {
      for (let w = 0; w <= 12 && scan + w < T.length; w++) { if (fuzz(T[scan + w].tok, exp[0])) { startTk = T[scan + w]; scan += w; break; } }
      if (!startTk) {
        for (let w = 0; w <= 12 && scan + w + 1 < T.length; w++) {
          if (exp[1] && !isDigit(exp[1]) && fuzz(T[scan + w + 1].tok, exp[1])) { startTk = T[scan + w]; scan += w; break; }
        }
      }
    }
    if (!startTk) { problems.push(spoken); estMiss.push({ k, spoken }); console.log(`  ${name}[${k}] NOHEAD "${spoken.slice(0, 42)}"`); continue; }
    let lastTk = startTk;
    let q = scan + 1;
    for (let i = 1; i < exp.length; i++) {
      if (isDigit(exp[i])) { lastTk = T[Math.min(q, T.length - 1)]; q += 1; continue; }
      let found = false;
      for (let w = 0; w <= 6 && q + w < T.length; w++) { if (fuzz(T[q + w].tok, exp[i])) { lastTk = T[q + w]; q += w + 1; found = true; break; } }
      if (!found) q = Math.min(q + 1, T.length);
    }
    const t0 = Math.max(0, snap(timeOf(startTk, false)) - 0.10);
    const t1 = Math.min((segments[segments.length - 1].end + 0.2), snap(timeOf(lastTk, true)) + 0.16);
    if (t1 - t0 < 0.25) { problems.push(spoken); console.log(`  ${name}[${k}] TINY ${(t1 - t0).toFixed(2)}s "${spoken.slice(0, 34)}"`); continue; }
    const file = `p71-${String(next).padStart(3, '0')}.mp3`;
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
      '-ss', t0.toFixed(3), '-to', t1.toFixed(3), '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
    map[spoken] = { file, a: t0.toFixed(2), b: t1.toFixed(2) };
    next++;
    P = q;
  }
  if (estMiss.length) {
    const clips = texts.map((t) => map[t]).filter(Boolean);
    const tFirst = Math.max(0, (clips[0] ? parseFloat(clips[0].a) : 0) - 2.5);
    const tLast = clips.length ? parseFloat(clips[clips.length - 1].b) + 2.5 : 0;
    const wsum = estMiss.reduce((x, m) => x + m.spoken.length, 0) || 1;
    let cur = tFirst;
    for (const m of estMiss) {
      const wgt = m.spoken.length / wsum;
      const a = cur, b2 = Math.min(tLast, cur + (tLast - tFirst) * wgt);
      cur = b2;
      if (b2 - a < 0.4) continue;
      const file = `p71-${String(next).padStart(3, '0')}.mp3`;
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
        '-ss', a.toFixed(3), '-to', b2.toFixed(3), '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
      map[m.spoken] = { file, a: a.toFixed(2), b: b2.toFixed(2), est: true };
      next++;
      const ix = problems.indexOf(m.spoken); if (ix >= 0) problems.splice(ix, 1);
    }
  }
  console.log(name, 'done:', Object.keys(map).length, 'total clips so far');
}
writeFileSync('/tmp/p71-map.json', JSON.stringify(map, null, 1));
writeFileSync('/tmp/p71-problems.json', JSON.stringify(problems, null, 1));
console.log('CLIPS:', Object.keys(map).length, '| problems:', problems.length);
