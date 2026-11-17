#!/usr/bin/env node
/* P70 SPLITTER v3 — per batch of N phrases:
   1. silencedetect all pauses (>=0.18 s at -40 dB)
   2. candidate phrase boundaries = pauses longer than 0.35 s, ranked by length
   3. take the TOP N-1 longest as boundaries → exactly N ordered segments;
      if fewer candidates exist, pad with the next-longest short pauses;
      if still short, take N-1 widest gaps anywhere and merge the leftovers.
   4. energy-trim each segment head/tail inside its span (whisper removal).
   Order is preserved because we always pick boundaries in time order.
   A wrong pick means one phrase got merged/split — the per-clip ASR pass
   catches that and the index goes to a regeneration queue. */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const final = JSON.parse(readFileSync('/tmp/speech-final.json', 'utf-8'));
const ranges = [];
for (let i = 0; i < final.length; i += 25) ranges.push([`batch${String(Math.floor(i / 25) + 1).padStart(2, '0')}`, i, Math.min(25, final.length - i)]);
// batches 9-13 mapping to FINAL order:
// first 200 -> batch01..08 ; 200-224 batch09 ; 225-249 batch10 ; 250-274 batch11 ;
// 275-298 batch12 EXCEPT two parenthetical lines (batch13) and VPREF (no clip).
const B12_SKIP_START = 275, B12_END = 298;
const VPREF = final.findIndex((o) => o.spoken.startsWith('سؤال أخير'));
const PAREN1 = final.findIndex((o) => o.spoken.includes('علّمي'));
const PAREN2 = final.findIndex((o) => o.spoken.includes('اختاروا'));
const LAYOUT = [
  ['batch01', [...Array(25).keys()]],
  ['batch14', [...Array(12).keys()].map((x) => x + 25)],
  ['batch15', [...Array(13).keys()].map((x) => x + 37)],
  ['batch03', [...Array(25).keys()].map((x) => x + 50)],
  ['batch04', [...Array(25).keys()].map((x) => x + 75)],
  ['batch05', [...Array(25).keys()].map((x) => x + 100)],
  ['batch06', [...Array(25).keys()].map((x) => x + 125)],
  ['batch07', [...Array(25).keys()].map((x) => x + 150)],
  ['batch08', [...Array(25).keys()].map((x) => x + 175)],
  ['batch09', [...Array(25).keys()].map((x) => x + 200)],
  ['batch10', [...Array(25).keys()].map((x) => x + 225)],
  ['batch11', [...Array(25).keys()].map((x) => x + 250)],
  ['batch12', [...Array(B12_END - B12_SKIP_START).keys()].map((x) => x + B12_SKIP_START).filter((i) => i !== PAREN1 && i !== PAREN2 && i !== VPREF)],
  ['batch13', [PAREN1, PAREN2]],
];

const OUT = 'public/audio/tts';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
let map = {};
try { map = JSON.parse(readFileSync('/tmp/p70-map.json', 'utf-8')); } catch { /* fresh */ }
let nextSrc = 43 + Object.keys(map).length;
const failures = [];

const pausesOf = (wav) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-40dB:d=0.18', '-f', 'null', '/dev/null'],
    { maxBuffer: 1 << 26, encoding: 'utf-8' });
  const err = String(r.stderr || '');
  const starts = [...err.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...err.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => +m[1]);
  const dm = err.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const dur = dm ? +dm[1] * 3600 + +dm[2] * 60 + parseFloat(dm[3]) : (ends[ends.length - 1] || 0) + 0.5;
  const P = [];
  for (let i = 0; i < starts.length; i++) P.push([starts[i], i < ends.length ? ends[i] : dur]);
  return { P, dur };
};

for (const [name, idxList] of LAYOUT) {
  for (const i of idxList) if (map[final[i].id]) { /* already cut */ }
  const wav = `/tmp/p70/${name}.wav`;
  if (!existsSync(wav)) { console.log(name, 'MISSING'); continue; }
  const N = idxList.length;
  const { P, dur } = pausesOf(wav);
  const MINB = 0.35;
  let cand = P.filter(([a, b]) => b - a >= MINB);
  if (cand.length < N - 1) {
    const rest = P.filter(([a, b]) => b - a < MINB).sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]));
    cand = cand.concat(rest.slice(0, N - 1 - cand.length));
  }
  // rank longest first, keep N-1, restore time order
  let chosen = cand.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0])).slice(0, N - 1).sort((x, y) => x[0] - y[0]);
  if (cand.length >= N - 1) chosen = cand.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0])).slice(0, N - 1).sort((x, y) => x[0] - y[0]);
  const segs = [];
  let cursor = 0;
  for (const [a, b] of chosen) {
    if (a - cursor > 0.12) segs.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (dur - cursor > 0.12) segs.push([cursor, dur]);
  // if we overshot N segments (padding added junk), merge the SHORTEST neighbours
  while (segs.length > N) {
    let kMin = 0, vMin = Infinity;
    for (let i = 1; i < segs.length; i++) {
      const gap = segs[i][0] - segs[i - 1][1];
      if (gap < vMin) { vMin = gap; kMin = i; }
    }
    const merged = [segs[kMin - 1][0], segs[kMin][1]];
    segs.splice(kMin - 1, 2, merged);
  }
  if (segs.length !== N) { console.log(`${name}: only ${segs.length} segs for ${N} phrases — all regen`); for (const i of idxList) failures.push({ index: i, reason: name + ' seg-count' }); continue; }
  let okc = 0;
  for (let k = 0; k < N; k++) {
    const fi = idxList[k];
    if (map[final[fi].id]) { okc++; continue; }
    let [a, b] = segs[k];
    if (b - a < 0.2) { failures.push({ index: fi, reason: name + ` seg ${k} tiny ${(b - a).toFixed(2)}s` }); continue; }
    // energy trim within [a,b]
    const tr = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', `atrim=${a}:${b},asetpts=PTS-STARTPTS,astats=metadata=1:reset=1:length=0.03,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-`, '-f', 'null', '/dev/null'],
      { maxBuffer: 1 << 26, encoding: 'utf-8' });
    const out2 = String(tr.stdout || '') + String(tr.stderr || '');
    const w2 = [];
    let t2 = null;
    for (const ln of out2.split('\n')) {
      const m1 = ln.match(/pts_time:([\d.]+)/); if (m1) t2 = +m1[1];
      const m2 = ln.match(/RMS_level=(-?[\d.]+|inf)/);
      if (m2 && t2 !== null) { w2.push([t2, m2[1] === 'inf' ? -Infinity : +m2[1]]); t2 = null; }
    }
    let st = null, en = null;
    for (const [tt, vv] of w2) if (vv > -55) { if (st === null) st = tt; en = tt; }
    if (st !== null && en - st > 0.25) { a += st - 0.02; b = Math.min(b, a + (en - st) + 0.07); }
    const file = `src${String(nextSrc).padStart(3, '0')}.mp3`;
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-ss', a.toFixed(3), '-to', Math.max(a + 0.3, b).toFixed(3),
      '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
    map[final[fi].id] = { file, spoken: final[fi].spoken };
    nextSrc++; okc++;
  }
  console.log(`${name}: cut ${okc}/${N}`);
}
writeFileSync('/tmp/p70-map.json', JSON.stringify(map, null, 1));
writeFileSync('/tmp/p70-failures.json', JSON.stringify(failures, null, 1));
console.log('TOTAL clips:', Object.keys(map).length, '/ needed', final.filter((o) => o.id !== final[VPREF]?.id).length);
console.log('failures:', failures.length);
