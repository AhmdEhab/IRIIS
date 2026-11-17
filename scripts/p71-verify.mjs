#!/usr/bin/env node
/* P71 VERIFY — same classifier as p70-verify, but the map is keyed by the
   spoken text itself ({ text: {file} }). Catches aligner off-by-one cuts in
   the legacy-UI batches. */
import { readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
const map = JSON.parse(readFileSync('/tmp/p71-map.json', 'utf-8'));
const norm = (s) => String(s)
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ').trim();
const toks = (s) => norm(s).split(' ').filter((t) => t.length > 1 || /^\d$/.test(t));
let pass = 0;
const fails = [];
for (const [spoken, { file }] of Object.entries(map)) {
  let txt = '';
  const readSide = () => spawnSync('bash', ['-c', `cat public/audio/tts/${file.replace('.mp3', '')}_transcription_*.txt 2>/dev/null`], { encoding: 'utf-8' }).stdout || '';
  txt = readSide();
  if (!txt.trim()) {
    spawnSync('manus-speech-to-text', [`public/audio/tts/${file}`], { encoding: 'utf-8', maxBuffer: 1 << 24 });
    txt = readSide();
  }
  const got = norm(txt.replace(/^\s*\[[\d:.]+\s*-\s*[\d:.]+\]\s*/gm, ''));
  const exp = toks(spoken);
  if (!exp.length) { pass++; continue; }
  const act = got.split(' ').filter(Boolean);
  const isDigitTok = (t) => /^[0-9]$/.test(t);
  let hit = 0;
  for (const t of exp) {
    if (isDigitTok(t)) { hit++; continue; }
    if (act.includes(t)) { hit++; continue; }
    if (t.length >= 4 && act.some((a) => a.length >= 4 && (a.startsWith(t.slice(0, 4)) || t.startsWith(a.slice(0, 4))))) hit++;
  }
  const ratio = hit / exp.length;
  const lenOk = act.length <= Math.max(3, exp.length * 2.2);
  if (ratio >= 0.8 && lenOk) pass++;
  else fails.push({ file, spoken, ratio: +ratio.toFixed(2), actWords: act.length, real: ratio < 0.8 || act.length > exp.length * 2.8, got: txt.slice(0, 120) });
}
console.log(`P71PASS ${pass} / FAIL ${fails.length} / TOTAL ${Object.keys(map).length}`);
for (const f of fails) console.log(`FAIL ${f.file} [${f.ratio}] "${f.spoken.slice(0, 60)}" → heard "${f.got.slice(0, 70)}"`);
writeFileSync('/tmp/p71-asr-fail.json', JSON.stringify(fails, null, 1));
