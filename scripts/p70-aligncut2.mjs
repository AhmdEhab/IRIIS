#!/usr/bin/env node
/* P70 ALIGNCUT v2 — whisper's segments can span several short phrases.
   So: flatten the batch transcript into a character-tracked token stream,
   align expected phrases SEQUENTIALLY (digits consume the next spoken word,
   4-char stem fuzz tolerates whisper spelling), compute each phrase's time
   by character-proportional placement inside its segments, then SNAP the
   edges to the nearest real silence midpoint (silencedetect d=0.22). */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'fs';

const final = JSON.parse(readFileSync('/tmp/speech-final.json', 'utf-8'));
const idx = (a, b) => Array.from({ length: b - a }, (_, k) => a + k);
const VPREF = final.findIndex((o) => o.spoken.startsWith('سؤال أخير'));
const PAREN1 = final.findIndex((o) => o.spoken.includes('علّمي'));
const PAREN2 = final.findIndex((o) => o.spoken.includes('اختاروا'));
const LAYOUT = [
  ['batch01', idx(0, 25)], ['batch03', idx(50, 75)], ['batch04', idx(75, 100)],
  ['batch05', idx(100, 125)], ['batch06', idx(125, 150)], ['batch07', idx(150, 175)],
  ['batch08', idx(175, 200)], ['batch09', idx(200, 225)], ['batch10', idx(225, 250)],
  ['batch11', idx(250, 275)],
  ['batch12', idx(275, 299).filter((i) => i !== PAREN1 && i !== PAREN2 && i !== VPREF)],
  ['batch13', [PAREN1, PAREN2]],
  ['batch14', idx(25, 37)], ['batch15', idx(37, 50)],
];

const norm = (s) => String(s)
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ').trim();
const isDigit = (t) => /^[0-9]$/.test(t);
const fuzz = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4));

const OUT = 'public/audio/tts';
const map = {};
for (const f of readdirSync(OUT)) {
  const m = f.match(/^src(\d+)\.mp3$/);
  if (m && +m[1] >= 43) rmSync(`${OUT}/${f}`, { force: true });
  if (/_transcription_/.test(f)) rmSync(`${OUT}/${f}`, { force: true });
}
let nextSrc = 43;
const problems = [];

for (const [name, idxList] of LAYOUT) {
  const jf = readdirSync('/tmp/p70').find((f) => f.startsWith(name + '_transcription_') && f.endsWith('.json'));
  if (!jf) { console.log(name, 'NO SIDECAR'); continue; }
  const { segments } = JSON.parse(readFileSync(`/tmp/p70/${jf}`, 'utf-8'));
  // token stream with absolute time by char-proportional placement
  const T = []; // {tok, seg, pos (char idx in seg text), segStart, segDur, segLen}
  for (let si = 0; si < segments.length; si++) {
    const sg = segments[si];
    const dur = sg.end - sg.start;
    const raw = sg.text.trim();
    let charCursor = 0;
    const words = raw.split(/\s+/);
    for (const w of words) {
      const at = raw.indexOf(w, charCursor);
      charCursor = at + w.length;
      T.push({ tok: norm(w), raw: w, seg: si, pos: at, segStart: sg.start, segDur: dur, segLen: Math.max(1, raw.length) });
    }
  }
  const timeOf = (tk, endOf = false) => tk.segStart + tk.segDur * ((tk.pos + (endOf ? tk.raw.length : 0)) / tk.segLen);
  // silence midpoints for snapping
  const errv = spawnSync('ffmpeg', ['-hide_banner', '-i', `/tmp/p70/${name}.wav`, '-af', 'silencedetect=noise=-40dB:d=0.22', '-f', 'null', '/dev/null'], { maxBuffer: 1 << 26, encoding: 'utf-8' }).stderr || '';
  const ss = [...errv.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => +m[1]);
  const se = [...errv.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => +m[1]);
  const mids = ss.map((a, i) => (a + (se[i] ?? a + 0.3)) / 2);
  const snap = (t) => {
    let best = t, bd = 0.45;
    for (const mid of mids) { const d = Math.abs(mid - t); if (d < bd) { bd = d; best = mid; } }
    return best;
  };

  let P = 0; // pointer into T
  const estMiss = [];
  for (let k = 0; k < idxList.length; k++) {
    const fi = idxList[k];
    const exp = norm(final[fi].spoken).split(' ').filter(Boolean);
    if (!exp.length) { problems.push(fi); continue; }
    // match exp[0] (a leading DIGIT is spoken as a word — take positionally;
    // if the immediate token already matches exp[1], the digit word is right here)
    let scan = P, startTk = null;
    if (isDigit(exp[0])) {
      startTk = T[scan] || null;
      if (startTk && exp[1] && fuzz(startTk.tok, exp[1])) { /* digit was dropped by whisper; startTk is actually word 2 */ }
      else scan += 1;
    } else {
      for (let w = 0; w <= 12 && scan + w < T.length; w++) { if (fuzz(T[scan + w].tok, exp[0])) { startTk = T[scan + w]; scan += w; break; } }
      if (!startTk) {
        // whisper may have misspelled the head badly: accept a match on the
        // SECOND expected word and rewind one token as the digit/word start
        for (let w = 0; w <= 12 && scan + w + 1 < T.length; w++) {
          if (exp[1] && !isDigit(exp[1]) && fuzz(T[scan + w + 1].tok, exp[1])) { startTk = T[scan + w]; scan += w; break; }
        }
      }
    }
    if (!startTk) { problems.push(fi); estMiss.push({ k, fi }); console.log(`  ${name}[${k}] g${fi + 1} NOHEAD "${final[fi].spoken.slice(0, 42)}"`); continue; }
    let lastTk = startTk;
    let q = scan + 1;
    for (let i = 1; i < exp.length; i++) {
      if (isDigit(exp[i])) { lastTk = T[Math.min(q, T.length - 1)]; q += 1; continue; }
      let found = false;
      for (let w = 0; w <= 6 && q + w < T.length; w++) { if (fuzz(T[q + w].tok, exp[i])) { lastTk = T[q + w]; q += w + 1; found = true; break; } }
      if (!found) { /* tolerate whisper-garbled word: advance one */ q = Math.min(q + 1, T.length); }
    }
    const t0 = Math.max(0, snap(timeOf(startTk, false)) - 0.10);
    const t1 = Math.min((segments[segments.length - 1].end + 0.2), snap(timeOf(lastTk, true)) + 0.16);
    if (t1 - t0 < 0.25) { problems.push(fi); console.log(`  ${name}[${k}] g${fi + 1} TINY ${(t1 - t0).toFixed(2)}s`); continue; }
    const file = `src${String(nextSrc).padStart(3, '0')}.mp3`;
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', `/tmp/p70/${name}.wav`,
      '-ss', t0.toFixed(3), '-to', t1.toFixed(3), '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
    map[final[fi].id] = { file, spoken: final[fi].spoken, a: t0.toFixed(2), b: t1.toFixed(2) };
    nextSrc++;
    P = q;
  }
  /* proportional fallback for unaligned phrases: stretch the gap between the
     first and last matched cut in this batch across their char weights */
  if (estMiss.length) {
    const clips = idxList.map((fi2) => map[final[fi2].id]).filter(Boolean);
    const tFirst = Math.max(0, (clips[0] ? parseFloat(clips[0].a) : 0) - 2.5);
    const tLast = clips.length ? parseFloat(clips[clips.length - 1].b) + 2.5 : 0;
    const wsum = estMiss.reduce((x2, m) => x2 + final[m.fi].spoken.length, 0) || 1;
    let cur = tFirst;
    for (const m of estMiss) {
      const wgt = final[m.fi].spoken.length / wsum;
      const a = cur, b2 = Math.min(tLast, cur + (tLast - tFirst) * wgt);
      cur = b2;
      if (b2 - a < 0.4) { continue; }
      const file = `src${String(nextSrc).padStart(3, '0')}.mp3`;
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', `/tmp/p70/${name}.wav`,
        '-ss', a.toFixed(3), '-to', b2.toFixed(3), '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
      map[final[m.fi].id] = { file, spoken: final[m.fi].spoken, est: true };
      nextSrc++;
      const ix = problems.indexOf(m.fi); if (ix >= 0) problems.splice(ix, 1);
    }
  }
}
writeFileSync('/tmp/p70-map.json', JSON.stringify(map, null, 1));
writeFileSync('/tmp/p70-problems.json', JSON.stringify(problems));
console.log('CLIPS:', Object.keys(map).length, '/', final.length - 1, '| problems:', problems.length, problems.map((i) => 'g' + (i + 1)).join(' '));
