import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/* P71 — every narrated string in the app must resolve to a clip in the
 * unified ar-eg-tutor-11 voice set, and the AudioContext must expose the
 * chain player that composes such lines from individually-clipped parts. */

const gen = readFileSync(new URL('../src/App/audio/fileClips.generated.ts', import.meta.url), 'utf-8');
const ctx = readFileSync(new URL('../src/App/contexts/AudioContext.tsx', import.meta.url), 'utf-8');

const keys = new Set();
for (const m of gen.matchAll(/^\s{2}"((?:[^"\\]|\\.)*)":/gm)) {
  keys.add(m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n'));
}

test('P71: manifest carries the unified-voice batches', () => {
  assert.ok(keys.size >= 600, `expected >=600 unified clips, got ${keys.size}`);
});

test('P71: representative legacy-UI lines are clipped', () => {
  for (const s of [
    'أحسنتم! لقد تعلمت مهارة جديدة.',
    'غسل اليدين',
    'افتح الصنبور وبلل يديك بالماء.',
    'بندق أرنب صغير بيحب الجنينة.',
    'اسمع! هذا هو أسد',
    'لنغني مع قطة!',
    'لنرَ الخطوات معاً',
  ]) assert.ok(keys.has(s), `missing clip: ${s}`);
});

test('P71: AudioContext exposes speakParts for composed chains', () => {
  assert.match(ctx, /speakParts: \(parts: string\[\], language\?: Lang\) => void;/);
  assert.match(ctx, /const speakParts = useCallback/);
});

test('P71: LifeSkillsScreen chains parts instead of composing unclipped sentences', () => {
  const ls = readFileSync(new URL('../src/App/components/LifeSkillsScreen.tsx', import.meta.url), 'utf-8');
  assert.match(ls, /speakParts\(/);
  assert.doesNotMatch(ls, /stepsText/);
});
