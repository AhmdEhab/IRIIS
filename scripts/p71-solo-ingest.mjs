#!/usr/bin/env node
/* P71 SOLO INGEST — map /tmp/p70/soloN.wav (regenerated anomaly phrases, in
   the order listed in /tmp/p71-anom.txt after its header line) into
   public/audio/tts/p71s-###.mp3 and update /tmp/p71-map.json in place. */
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const lines = readFileSync('/tmp/p71-anom.txt', 'utf-8').trim().split('\n').slice(1);
const map = JSON.parse(readFileSync('/tmp/p71-map.json', 'utf-8'));
const OUT = 'public/audio/tts';
let n = 0;
for (let i = 0; i < lines.length; i++) {
  const parts = lines[i].split(' | ');
  if (parts.length < 2) continue;
  const [, ...rest] = parts;
  const text = rest.slice(0, -1).join(' | '); // file | text | dur  (text may contain ' | '? never)
  const wav = `/tmp/p70/solo${i + 1}.wav`;
  if (!existsSync(wav)) { console.log('NO WAV', wav, 'for', text); continue; }
  if (!(text in map)) { console.log('NOT IN MAP', text); continue; }
  const file = `p71s-${String(n + 1).padStart(3, '0')}.mp3`;
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
    '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`]);
  const old = map[text].file;
  map[text] = { file, solo: true };
  execFileSync('rm', ['-f', `${OUT}/${old}`, `${OUT}/${old.replace('.mp3', '')}_transcription_*`]);
  n++;
  console.log('SOLO', file, '<-', text.slice(0, 40));
}
writeFileSync('/tmp/p71-map.json', JSON.stringify(map, null, 1));
console.log('ingested', n);
