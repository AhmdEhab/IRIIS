#!/usr/bin/env node
/* P70 COLLECTOR v2 — exact strings that will reach speak() without a clip.
   Matches what each screen actually speaks:
   - Ladder card speaker + word autoplay: item.audio_ar (string, any depth)
   - Activities: item.prompt.ar and item.hint.ar
   - UI narration: literal Arabic strings in phrases.ts
   - Caregiver Family File: spoken(text) = q + (' — مثال: ' + ex if ex)
     AFTER the sayItem patch removes the other-language echo and the
     prefix/suffix flips for the EXAMPLE are resolved in lang order.
   Excludes anything already keyed in fileClips.ts.
   Emits /tmp/speech-strings.json = [{id, text, src}] in stable order. */
import { readFileSync, writeFileSync } from 'fs';
import { PHASE5_BANK } from '../src/iris/content/phase5Bank.js';

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const AR = /[\u0600-\u06FF]/;
const clips = readFileSync('src/App/audio/fileClips.ts', 'utf-8');
const have = new Set([...clips.matchAll(/^\s*"((?:[^"\\]|\\.)*)":/gm)].map((m) => norm(m[1])));
const seen = new Set();
const list = [];
const add = (src, raw) => {
  const t = norm(raw);
  if (!t || !AR.test(t) || t.length > 240) return;
  if (seen.has(t) || have.has(t)) return;
  seen.add(t);
  list.push({ id: 'g' + String(list.length + 1).padStart(3, '0'), text: t, src });
};

/* 1+2) bank: audio_ar, prompt.ar, hint.ar — walk generically so nested
   shapes ({prompt:{ar}}, {hint:{ar}} or {hint_ar}) are all caught. */
const walk = (node) => {
  if (!node || typeof node !== 'object') return;
  if (typeof node.audio_ar === 'string') add('bank-audio', node.audio_ar);
  if (typeof node.hint_ar === 'string') add('bank-hint', node.hint_ar);
  if (node.prompt && typeof node.prompt === 'object' && typeof node.prompt.ar === 'string') add('bank-prompt', node.prompt.ar);
  if (node.hint && typeof node.hint === 'object' && typeof node.hint.ar === 'string') add('bank-hint', node.hint.ar);
  for (const k of Object.keys(node)) if (k !== 'item_id') walk(node[k]);
};
for (const it of PHASE5_BANK) walk(it);

/* 3) phrases.ts UI narration literals (skip template holes) */
const ph = readFileSync('src/App/audio/phrases.ts', 'utf-8');
for (const m of ph.matchAll(/['"`]([^'"`\n]{2,}?)['"`]/g)) {
  const v = m[1];
  if (AR.test(v) && !v.includes('${') && !/^[a-z_0-9]+$/.test(v)) add('phrases', v);
}

/* 4) caregiver cv2 — exact spoken text after the sayItem patch:
   ar mode: [q, ex ? 'مثال: ' + ex : ''].filter(Boolean).join(' — ')
   en mode: [qEn, exEn ? 'For example: ' + exEn : ''].filter(Boolean).join('. ') */
const cv2 = readFileSync('src/iris/caregiver/bankV2.js', 'utf-8');
// pull the item builder call sites: arQ:'...' / ex:'...' pairs live in the
// ITEMS array; simplest robust path — import it.
try {
  const mod = await import('../src/iris/caregiver/bankV2.js');
  const blocks = mod.getCaregiverBlocksV2();
  const visit = (node) => {
    const ar = node.ar || {};
    if (ar.q) add('caregiver', [ar.q, ar.ex ? `مثال: ${ar.ex}` : ''].filter(Boolean).join(' — '));
    for (const f of node.followUps || []) visit(f);
  };
  // English caregiver lines keep the browser voice (out of scope for the
  // Egyptian-girl unification; a female EN voice would sound different).
  for (const b of blocks) {
    for (const node of b.items || []) visit(node);
  }
} catch (e) { console.log('caregiver import failed:', e.message); }

/* caregiver spoken() must strip the example WRAPPER — store the FINAL
   concatenated form separately for exact-key safety. */
writeFileSync('/tmp/speech-strings.json', JSON.stringify(list, null, 1));
const bySrc = {};
for (const o of list) bySrc[o.src] = (bySrc[o.src] || 0) + 1;
console.log('FINAL strings needing clips:', list.length, bySrc);
console.log(list.slice(0, 8).map((o) => o.id + ' [' + o.src + '] ' + o.text.slice(0, 60)).join('\n'));
