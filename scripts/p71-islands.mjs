#!/usr/bin/env node
/* P71 ISLANDS — targeted recut for chosen batches using silence islands,
   but ONLY if the recut validates: island count === texts count (trying a
   few gap thresholds, dropping sub-0.28s blips) AND >=85% of islands contain
   the expected head token of their phrase inside the whisper segments that
   overlap that island's time window (digit tokens & <=2-char heads skipped).
   Adopted entries are written as p71i-###.mp3 and replace map entries.
   On reject the aligncut clip stays; solo regen handles leftovers later. */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';

const only = process.argv.slice(2);
const plan = JSON.parse(readFileSync('/tmp/p71-plan.json', 'utf-8'));
const map = JSON.parse(readFileSync('/tmp/p71-map.json', 'utf-8'));
const OUT = 'public/audio/tts';
let next = 1;

const norm = (s) => String(s)
  .replace(/[[\u064B-\u0652\u0670\u0640]]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ').trim();
const fuzz = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4));
const dur = (wav) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], { encoding: 'utf-8' }));

for (const name of only) {
  const { wav, texts } = plan[name];
  if (!wav) { console.log(name, 'NOT IN PLAN'); continue; }
  const total = dur(wav);
  // whisper segments for head validation
  const dirn = path.dirname(wav);
  const jf = readdirSync(dirn).find((f) => f.startsWith(name + '_transcription_') && f.endsWith('.json'));
  const segs = jf ? JSON.parse(readFileSync(path.join(dirn, jf), 'utf-8')).segments : [];
  const headsIn = (a, b) => {
    const toks = [];
    for (const sg of segs) if (sg.end > a - 0.4 && sg.start < b + 0.4) toks.push(...norm(sg.text).split(' ').filter(Boolean));
    return toks;
  };

  let islands = null;
  for (const D of [0.3, 0.34, 0.38, 0.42, 0.26]) {
    const errv = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', `silencedetect=noise=-40dB:d=${D}`, '-f', 'null', '/dev/null'], { maxBuffer: 1 << 26, encoding: 'utf-8' }).stderr || '';
    const ss = [...errv.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => +m[1]);
    const se = [...errv.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => +m[1]);
    let list = []; let prev = 0;
    for (let i = 0; i < ss.length; i++) { list.push([prev, ss[i]]); prev = se[i] ?? ss[i]; }
    list.push([prev, total]);
    list = [];
    prev = 0;
    for (const [a, b] of ((() => { const L = []; let p = 0; for (let i = 0; i < ss.length; i++) { L.push([p, ss[i]]); p = se[i] ?? ss[i]; } L.push([p, total]); return L; })())) {
      if (b - a < 0.12) continue; // leading/trailing pad or blip
      if (!list.length) { list.push([a, b]); continue; }
      const last = list[list.length - 1];
      if (a - last[1] < 0.02) last[1] = b; else list.push([a, b]);
    }
    if (list.length === texts.length) { islands = list; console.log(name, `islands=${list.length} @d=${D}`); break; }
    console.log(name, `d=${D} → ${list.length} (want ${texts.length})`);
  }
  if (!islands) { console.log(name, 'REJECT: no exact island count'); continue; }

  let ok = 0;
  const checks = islands.map(([a, b], k) => {
    const exp = norm(texts[k]).split(' ').filter(Boolean);
    const head = exp.find((t) => t.length >= 3);
    if (!head) return true;
    return headsIn(a, b).some((t) => fuzz(t, head));
  });
  ok = checks.filter(Boolean).length;
  const rate = ok / texts.length;
  if (rate < 0.85) { console.log(name, `REJECT: head validation ${(rate * 100).toFixed(0)}%`); continue; }

  for (let k = 0; k < texts.length; k++) {
    const t = texts[k];
    if (!(t in map)) continue;
    const [a, b] = islands[k];
    const file = `p71i-${String(next).padStart(3, '0')}.mp3`;
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
      '-ss', Math.max(0, a - 0.06).toFixed(3), '-to', Math.min(total, b + 0.14).toFixed(3),
      '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
    const old = map[t].file;
    map[t] = { file, islands: name };
    if (old !== file) execFileSync('rm', ['-f', `${OUT}/${old}`]);
    next++;
  }
  console.log(name, 'ADOPTED', texts.length, `(heads ${(rate * 100).toFixed(0)}%)`);
}
writeFileSync('/tmp/p71-map.json', JSON.stringify(map, null, 1));
console.log('done');
