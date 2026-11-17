#!/usr/bin/env node
/* P70 CUTTER v2 — batches were recorded as:
     [beep] phrase1 [beep] phrase2 ... [beep] phraseN [beep]
   The 1 kHz sine beep is a frequency-localized marker: bandpass 850–1150 Hz
   + loudness scan finds each burst; phrase k is the window between the end
   of beep k and the start of beep k+1, energy-trimmed inside that window.
   Zero-length or missing windows are reported per index for individual
   regeneration (a single generate_speech call per failed phrase). */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const final = JSON.parse(readFileSync('/tmp/speech-final.json', 'utf-8'));
const LAYOUT = [
  ['batch01', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]],
  ['batch02', [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49]],
  ['batch03', [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74]],
  ['batch04', [75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99]],
  ['batch05', [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124]],
  ['batch06', [125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149]],
  ['batch07', [150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174]],
  ['batch08', [175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199]],
  ['batch09', [200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224]],
  ['batch10', [225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249]],
  ['batch11', [250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274]],
  ['batch12', [275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 294, 295, 296, 297, 298]],
  ['batch13', [293, 297]],
];
// batch12 note: two parenthetical strings (indices 292/295 by match below)
// were regenerated in batch13 — resolve precisely:
const PAREN1 = final.findIndex((o) => o.spoken.includes('علّمي'));
const PAREN2 = final.findIndex((o) => o.spoken.includes('اختاروا'));
for (const L of LAYOUT) {
  if (L[0] === 'batch12') L[1] = L[1].filter((i) => i !== PAREN1 && i !== PAREN2 && !final[i].spoken.startsWith('سؤال أخير'));
  if (L[0] === 'batch13') L[1] = [PAREN1, PAREN2];
}

const OUT = 'public/audio/tts';
const map = {};

const scanDb = (wav, af) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', af, '-progress', 'pipe:1', '-f', 'null', '/dev/null'],
    { maxBuffer: 1 << 26, encoding: 'utf-8' });
  return String(r.stdout || '') + String(r.stderr || '');
};

let nextSrc = 43;
const failures = [];
for (const [name, idxList] of LAYOUT) {
  const wav = `/tmp/p70/${name}.wav`;
  if (!existsSync(wav)) { console.log(name, 'MISSING'); continue; }
  // 1) locate beeps: bandpass isolates the 1 kHz tone; astats reports per window.
  //    cheaper: silencedetect INVERTED not possible — use highpass+lowpass volume timeline.
  const out = scanDb(wav, 'highpass=f=800,lowpass=f=1200,astats=metadata=1:reset=1:length=0.05,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-');
  const lines = out.split('\n');
  const win = [];
  let t = null, v = null;
  for (const ln of lines) {
    let m = ln.match(/^frame:[\s\S]*?pts_time:([\d.]+)/) || ln.match(/pts_time:([\d.]+)/);
    if (m) t = +m[1];
    m = ln.match(/lavfi\.astats\.Overall\.RMS_level=(-?[\d.]+|inf|-inf)/);
    if (m && t !== null) { v = m[1] === 'inf' || m[1] === '-inf' ? -Infinity : +m[1]; win.push([t, v]); t = null; }
  }
  // beep windows: >=2 adjacent windows louder than -32 dB within 1.4 kHz band
  const TH = -32;
  const beeps = [];
  let cur = null;
  for (const [tt, vv] of win) {
    if (vv > TH) { if (!cur) cur = [tt, tt + 0.05]; else cur[1] = tt + 0.05; }
    else if (cur) { if (cur[1] - cur[0] >= 0.06 && cur[1] - cur[0] < 1.0) beeps.push(cur); cur = null; }
  }
  if (cur) beeps.push(cur);
  const expect = idxList.length + 1;
  console.log(`${name}: beeps=${beeps.length} expected=${expect}`);
  if (beeps.length !== expect) {
    for (const i of idxList) failures.push({ index: i, reason: `${name} beep-count ${beeps.length}!=${expect}` });
    continue;
  }
  for (let k = 0; k < idxList.length; k++) {
    const a0 = beeps[k][1], b0 = beeps[k + 1][0];
    if (b0 - a0 < 0.2) { failures.push({ index: idxList[k], reason: `${name} window ${k} too small` }); continue; }
    // energy-trim inside the window
    const out2 = scanDb(wav, `atrim=${a0}:${b0},asetpts=PTS-STARTPTS,highpass=f=120,lowpass=f=6000,astats=metadata=1:reset=1:length=0.04,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-`);
    const w2 = [];
    let t2 = null;
    for (const ln of out2.split('\n')) {
      const m1 = ln.match(/pts_time:([\d.]+)/);
      if (m1) t2 = +m1[1];
      const m2 = ln.match(/RMS_level=(-?[\d.]+|inf|-inf)/);
      if (m2 && t2 !== null) { w2.push([t2, m2[1] === 'inf' || m2[1] === '-inf' ? -Infinity : +m2[1]]); t2 = null; }
    }
    const TH2 = -55;
    let st = null, en = null;
    for (const [tt, vv] of w2) {
      if (vv > TH2) { if (st === null) st = tt; en = tt + 0.04; }
    }
    if (st === null || en - st < 0.18) { failures.push({ index: idxList[k], reason: `${name} phrase ${k} no speech` }); continue; }
    const ss = Math.max(0, a0 + st - 0.02), to = Math.min(b0, a0 + en + 0.05);
    const file = `src${String(nextSrc).padStart(3, '0')}.mp3`;
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-ss', ss.toFixed(3), '-to', to.toFixed(3),
      '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
    map[final[idxList[k]].id] = { file, spoken: final[idxList[k]].spoken };
    nextSrc++;
  }
}
writeFileSync('/tmp/p70-map.json', JSON.stringify(map, null, 1));
writeFileSync('/tmp/p70-failures.json', JSON.stringify(failures, null, 1));
console.log('clips written:', Object.keys(map).length, '/', final.length);
console.log('failures:', failures.length, failures.slice(0, 8).map((f) => final[f.index].id + ':' + f.reason).join(' | '));
