#!/usr/bin/env node
/* P71 SOLOS v2 — ingest /tmp/p70/solo1.wav..soloN.wav (one phrase each, order
   matches /tmp/p71-solos.json) into p71s-###.mp3, replace map entries, then
   ASR-verify each with the classifier and print the verdicts. */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const texts = JSON.parse(readFileSync('/tmp/p71-solos.json', 'utf-8'));
const map = JSON.parse(readFileSync('/tmp/p71-map.json', 'utf-8'));
const OUT = 'public/audio/tts';
const norm = (s) => String(s)
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ').trim();
let n = 0;
const rows = [];
for (let i = 0; i < texts.length; i++) {
  const t = texts[i];
  const wav = `/tmp/p70/solo${i + 1}.wav`;
  if (!existsSync(wav)) { console.log('MISSING', wav, t); continue; }
  if (!(t in map)) { console.log('NOT IN MAP', t); continue; }
  const file = `p71s-${String(n + 1).padStart(3, '0')}.mp3`;
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
    '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`]);
  const old = map[t].file;
  map[t] = { file, solo: true };
  execFileSync('rm', ['-f', `${OUT}/${old}`]);
  n++;
  // verify
  spawnSync('manus-speech-to-text', [`${OUT}/${file}`], { encoding: 'utf-8', maxBuffer: 1 << 24 });
  const side = spawnSync('bash', ['-c', `cat ${OUT}/${file.replace('.mp3', '')}_transcription_*.txt 2>/dev/null`], { encoding: 'utf-8' }).stdout || '';
  const heard = norm(side.replace(/^\s*\[[\d:.]+\s*-\s*[\d:.]+\]\s*/gm, ''));
  const exp = norm(t).split(' ').filter((x) => x.length > 1 || /^\d$/.test(x));
  const act = heard.split(' ').filter(Boolean);
  let hit = 0;
  for (const x of exp) {
    if (/^[0-9]$/.test(x)) { hit++; continue; }
    if (act.includes(x)) { hit++; continue; }
    if (x.length >= 4 && act.some((a) => a.length >= 4 && (a.startsWith(x.slice(0, 4)) || x.startsWith(a.slice(0, 4))))) hit++;
  }
  const ratio = exp.length ? hit / exp.length : 1;
  rows.push({ file, t: t.slice(0, 40), ratio: +ratio.toFixed(2), dur: spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${OUT}/${file}`], { encoding: 'utf-8' }).stdout.trim() });
}
writeFileSync('/tmp/p71-map.json', JSON.stringify(map, null, 1));
for (const r of rows) console.log(r.ratio < 0.8 ? 'SOLOFAIL' : 'solo-ok', r.file, r.dur, `[${r.ratio}]`, r.t);
console.log('INGESTED', n, 'fails', rows.filter((r) => r.ratio < 0.8).length);
