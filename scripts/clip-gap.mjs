#!/usr/bin/env node
/* P70: what narratable Arabic strings exist vs what has a shipped clip? */
import { PHASE5_BANK } from '../src/iris/content/phase5Bank.js';
import { readFileSync } from 'fs';

const clips = readFileSync('src/App/audio/fileClips.ts', 'utf-8');
const clipKeys = new Set([...clips.matchAll(/^\s*"((?:[^"\\]|\\.)*)":/gm)].map((m) => m[1]));

// 1) bank audio_ar + prompts
const bankAr = new Set();
for (const it of PHASE5_BANK) {
  for (const k of ['audio_ar', 'prompt_ar', 'ar']) {
    const v = it?.stimulus?.[k] ?? it?.[k] ?? it?.ui?.[k];
    if (typeof v === 'string' && v.trim()) bankAr.add(v.trim());
  }
  if (it?.prompt?.ar) bankAr.add(it.prompt.ar.trim());
  if (it?.audio?.ar) bankAr.add(it.audio.ar.trim());
}
const norm = (s) => s.replace(/[؟؟\s]+$/g, '').replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ').trim();
const clipNorm = new Set([...clipKeys].map(norm));

const bankMissing = [...bankAr].filter((s) => !clipNorm.has(norm(s)) && /[؀-ۿ]/.test(s));
console.log('total clip keys:', clipKeys.size);
console.log('bank Arabic narratable strings:', bankAr.size, '— missing clips:', bankMissing.length);
console.log(bankMissing.slice(0, 12).map((s) => '  · ' + s.slice(0, 70)).join('\n'));

// 2) phrases.ts strings
const ph = readFileSync('src/App/audio/phrases.ts', 'utf-8');
const phAr = [...ph.matchAll(/['"`]([^'"`\n]*[؀-ۿ][^'"`\n]*)['"`]/g)].map((m) => m[1].trim());
const phMissing = [...new Set(phAr)].filter((s) => !clipNorm.has(norm(s)) && s.length > 2);
console.log('\nphrases.ts Arabic strings:', new Set(phAr).size, '— missing clips:', phMissing.length);
console.log(phMissing.slice(0, 18).map((s) => '  · ' + s.slice(0, 70)).join('\n'));

// 3) caregiver cv2 questions
const cv2 = readFileSync('src/iris/caregiver/bankV2.js', 'utf-8');
const cv2Ar = [...cv2.matchAll(/qAr:\s*'([^']*)'|textAr:\s*'([^']*)'/g)].map((m) => m[1] || m[2]);
const cv2Missing = [...new Set(cv2Ar)].filter((s) => s && !clipNorm.has(norm(s)));
console.log('\ncv2 Arabic question strings:', new Set(cv2Ar).size, '— missing clips:', cv2Missing.length);
console.log(cv2Missing.slice(0, 30).map((s) => '  · ' + s.slice(0, 90)).join('\n'));
