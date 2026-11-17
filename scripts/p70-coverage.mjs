import { readFileSync } from 'fs';
import { cleanSpeechText } from '../src/App/audio/speechText.js';
import { PHASE5_BANK } from '../src/iris/content/phase5Bank.js';
import { getCaregiverBlocksV2 } from '../src/iris/caregiver/bankV2.js';
const src = readFileSync('src/App/audio/fileClips.generated.ts', 'utf-8');
const keys = [...src.matchAll(/^  "(.*?)": '\/audio\/tts/gms)].map((m) => m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
const K = new Set(keys);
let miss = 0, tot = 0;
for (const it of PHASE5_BANK) {
  for (const f of ['prompt', 'hint']) {
    const v = it.audio?.[f] || it[f];
    if (typeof v === 'string' && /[\u0600-\u06FF]/.test(v)) {
      tot++;
      const c = cleanSpeechText(v, 'ar');
      if (!K.has(c)) { miss++; if (miss < 8) console.log('MISS bank', f, ':', c.slice(0, 64)); }
    }
  }
}
for (const b of getCaregiverBlocksV2().flatMap((x) => x.items)) {
  const q = b.ar?.q;
  if (q) {
    tot++;
    const composed = [q, b.ar?.ex ? `مثال: ${b.ar.ex}` : ''].filter(Boolean).join(' — ');
    const c = cleanSpeechText(composed, 'ar');
    const c2 = cleanSpeechText(q, 'ar');
    if (!K.has(c) && !K.has(c2)) { miss++; if (miss < 20) console.log('MISS cg', b.id, ':', c.slice(0, 72)); }
  }
}
console.log('manifest keys:', K.size, '| probed:', tot, '| misses:', miss);
