#!/usr/bin/env node
/* P71 COVERAGE — for every narratable string harvested by both collectors
   (P70 ladder/caregiver set + P71 legacy-UI set), assert the FINAL manifest
   (src/App/audio/fileClips.generated.ts + hand CLIPS in fileClips.ts) has a
   clip under the exact cleanSpeechText key. Reports misses + the intentional
   browser-voice overs. */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { cleanSpeechText } from '../src/App/audio/speechText.js';

const fc = readFileSync('src/App/audio/fileClips.generated.ts', 'utf-8');
const hand = readFileSync('src/App/audio/fileClips.ts', 'utf-8');
const keys = new Set();
for (const src of [fc, hand]) {
  for (const m of src.matchAll(/^\s{2}"((?:[^"\\]|\\.)*)":/gm)) {
    keys.add(m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n'));
  }
}
console.log('manifest keys:', keys.size);

const miss = [];
let checked = 0;
function check(rawList, label) {
  for (const raw of rawList) {
    const k = cleanSpeechText(raw, 'ar');
    if (!k) continue;
    checked++;
    if (!keys.has(k)) miss.push({ label, k: k.slice(0, 70) });
  }
}

// P71 harvested strings
const p71 = JSON.parse(readFileSync('/tmp/p71-new.json', 'utf-8'));
check(p71.map((x) => x.raw), 'p71');

// P70 harvested strings (same file the P70 chain used)
try {
  const fin = JSON.parse(readFileSync('/tmp/speech-final.json', 'utf-8'));
  check(fin.map((x) => x.spoken), 'p70');
} catch { console.log('(speech-final.json absent — p70 side skipped)'); }

console.log('checked:', checked, '| missing:', miss.length);
for (const m of miss.slice(0, 40)) console.log('MISS', m.label, JSON.stringify(m.k));
