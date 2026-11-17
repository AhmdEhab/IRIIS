#!/usr/bin/env node
/* P71 REFIX — repair word/song list batches whose token-aligner drift
   produced oversized/truncated cuts.

   Per batch, prefer the most reliable boundary source:
     A) whisper sidecar with segments.length === texts.length → use segment
        start/end directly (1:1 phrase order, ASR already proved the words).
     B) silencedetect islands === texts.length (allowing one tiny leading
        island) → use island boundaries.
     C) otherwise leave the existing aligncut clip untouched; a later anomaly
        sweep regenerates only the suspects as solo clips.

   Re-cut clips are written to NEW files p71r-###.mp3 and /tmp/p71-map.json is
   updated in place (the old clip files are then unreferenced and removed). */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';

const plan = JSON.parse(readFileSync('/tmp/p71-plan.json', 'utf-8'));
const map = JSON.parse(readFileSync('/tmp/p71-map.json', 'utf-8'));
const OUT = 'public/audio/tts';
let next = 1;
const replaced = [];

const cut = (wav, a, b, file) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
  '-ss', a.toFixed(3), '-to', b.toFixed(3), '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf-8' }));

for (const [name, { wav, texts }] of Object.entries(plan)) {
  const dir = path.dirname(wav);
  const total = dur(wav);
  // A) whisper 1:1
  let bounds = null;
  const jf = readdirSync(dir).find((f) => f.startsWith(name + '_transcription_') && f.endsWith('.json'));
  if (jf) {
    const { segments } = JSON.parse(readFileSync(path.join(dir, jf), 'utf-8'));
    if (segments.length === texts.length) {
      bounds = segments.map((s) => [Math.max(0, s.start - 0.06), Math.min(total, s.end + 0.12)]);
      console.log(name, 'mode=ASR1:1');
    }
  }
  // B) islands
  if (!bounds) {
    const errv = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-40dB:d=0.32', '-f', 'null', '/dev/null'], { maxBuffer: 1 << 26, encoding: 'utf-8' }).stderr || '';
    const ss = [...errv.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => +m[1]);
    const se = [...errv.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => +m[1]);
    let islands = [];
    let prev = 0;
    for (let i = 0; i < ss.length; i++) { if (ss[i] - prev > 0.05) islands.push([prev, ss[i]]); prev = se[i] ?? ss[i]; }
    if (total - prev > 0.05) islands.push([prev, total]);
    // try merging tiny-gap islands toward the target count
    const gapOf = (i) => islands[i + 1][0] - islands[i][1];
    while (islands.length > texts.length) {
      let gi = -1, gd = 1e9;
      for (let i = 0; i + 1 < islands.length; i++) { const g = gapOf(i); if (g < gd) { gd = g; gi = i; } }
      if (gi < 0) break;
      islands.splice(gi, 2, [islands[gi][0], islands[gi + 1][1]]);
    }
    if (islands.length === texts.length) {
      bounds = islands.map(([a, b]) => [Math.max(0, a - 0.05), Math.min(total, b + 0.12)]);
      console.log(name, 'mode=ISLANDS');
    } else console.log(name, 'mode=KEEP (islands', islands.length, 'vs', texts.length, ')');
  }
  if (!bounds) continue;
  for (let k = 0; k < texts.length; k++) {
    const t = texts[k];
    if (!map[t]) continue; // junk/dup not in map
    const [a, b] = bounds[k];
    if (b - a < 0.25) { console.log('  SKIP TINY', name, k, t.slice(0, 24)); continue; }
    const file = `p71r-${String(next).padStart(3, '0')}.mp3`;
    cut(wav, a, b, file);
    const old = map[t].file;
    if (old !== file) {
      map[t] = { file, a: a.toFixed(2), b: b.toFixed(2), refix: name };
      replaced.push(old);
      next++;
    }
  }
}
// remove orphaned superseded clips (only p71-* names, keep p70 src* clips)
for (const f of new Set(replaced)) {
  if (/^p71-/.test(f)) { try { execFileSync('rm', ['-f', `${OUT}/${f}`]); } catch {} }
}
writeFileSync('/tmp/p71-map.json', JSON.stringify(map, null, 1));
console.log('REFIXED:', replaced.length);
