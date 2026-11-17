#!/usr/bin/env node
/* P70 SOLO INGEST — replace the 27 unreliable clips with one-phrase
   regenerations (no cutting at all: each wav IS the clip), re-key the map,
   then ASR-verify the new files in place. */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'fs';

const map = JSON.parse(readFileSync('/tmp/p70-map.json', 'utf-8'));
const solo = JSON.parse(readFileSync('/tmp/p70-solo.json', 'utf-8')); // id -> spoken
const norm = (s) => String(s)
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ').trim();
const isDigit = (t) => /^[0-9]$/.test(t);
const fuzz = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4));

let done = 0;
const bad = [];
for (const [id, spoken] of Object.entries(solo)) {
  const g = id.slice(1); // gNNN -> NNN
  const wav = `/tmp/p70/solo_g${g}.wav`;
  if (!existsSync(wav)) { bad.push(`${id} wav missing`); continue; }
  const file = map[id].file;
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
    '-af', 'silenceremove=start_periods=1:start_duration=0:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-45dB,areverse',
    '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `public/audio/tts/${file}`]);
  map[id] = { file, spoken, solo: true };
  done++;
}
writeFileSync('/tmp/p70-map.json', JSON.stringify(map, null, 1));
// wipe their sidecars so verify re-transcribes
for (const id of Object.keys(solo)) {
  const base = map[id].file.replace('.mp3', '');
  for (const f of readdirSync('public/audio/tts')) if (f.startsWith(base + '_transcription_')) rmSync(`public/audio/tts/${f}`);
}
// ASR check inline
for (const [id, spoken] of Object.entries(solo)) {
  const file = map[id].file;
  spawnSync('manus-speech-to-text', [`public/audio/tts/${file}`], { encoding: 'utf-8', maxBuffer: 1 << 24 });
  const side = readdirSync('public/audio/tts').find((f) => f.startsWith(file.replace('.mp3', '') + '_transcription_') && f.endsWith('.txt'));
  const txt = side ? readFileSync(`public/audio/tts/${side}`, 'utf-8') : '';
  const act = norm(txt.replace(/^\s*\[[\d:.]+\s*-\s*[\d:.]+\]\s*/gm, ' ')).split(' ');
  const exp = norm(spoken).split(' ');
  let hit = 0;
  for (const t of exp) {
    if (isDigit(t)) { hit++; continue; }
    if (act.includes(t)) { hit++; continue; }
    if (t.length >= 4 && act.some((a) => a.length >= 4 && a.slice(0, 4) === t.slice(0, 4))) hit++;
  }
  const ratio = exp.length ? hit / exp.length : 0;
  if (ratio < 0.6) bad.push(`${id} r=${ratio.toFixed(2)} "${spoken.slice(0, 40)}" heard "${act.join(' ').slice(0, 50)}"`);
  rmSync(`public/audio/tts/${side}`, { force: true });
}
console.log(`ingested ${done}/${Object.keys(solo).length}`);
if (bad.length) { console.log('STILL BAD:'); for (const b of bad) console.log(' ', b); }
else console.log('ALL SOLO CLIPS VERIFIED');
