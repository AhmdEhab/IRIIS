/**
 * P70 — one speech-text normalizer for the whole app.
 *
 * AudioContext.cleanForSpeech used to DELETE emoji. Two activity prompts
 * ("دوس 🐶 الأول وبعدين 🌙" and "دوس 🦆 الأول وبعدين ⚽") then collapsed to
 * the same cleaned string, so a pre-recorded clip manifest keyed on the
 * cleaned text could not tell them apart — and the browser voice read the
 * line with a hole where the picture name should be.
 *
 * Now: known emoji are READ as their word. The same function decides both
 * what is spoken and what clip key is looked up, and scripts/collect-
 * speech-strings.mjs imports it, so manifest and runtime can never drift.
 */

/** Emoji → spoken word, per app language. Child-facing picture names. */
const EMOJI_WORDS = {
  '🐶': ['الكلب', 'dog'],
  '🌙': ['القمر', 'moon'],
  '🦆': ['البطة', 'duck'],
  '⚽': ['الكورة', 'ball'],
  '🍌': ['الموزة', 'banana'],
  '🚿': ['الدش', 'shower'],
  '🎩': ['القبعة', 'hat'],
  '🦋': ['الفراشة', 'butterfly'],
  '🐢': ['السلحفاة', 'turtle'],
  '👟': ['الكندرة', 'shoe'],
  '🎒': ['الشنطة', 'bag'],
  '🌸': ['الزهرة', 'flower'],
  '🐘': ['الفيل', 'elephant'],
  '🚗': ['العربية', 'car'],
  '🧸': ['الدبدوب', 'teddy'],
};

/**
 * Replace emoji with spoken words, then apply the exact normalizations the
 * old cleanForSpeech applied (emoji-without-name removal, arrow/symbol
 * removal, variant selectors, whitespace collapse). Deterministic + pure.
 */
export function cleanSpeechText(text, language = 'ar') {
  if (!text) return '';
  const li = language === 'en' ? 1 : 0;
  let out = String(text);
  // known emoji → words (do this BEFORE the generic emoji strip)
  for (const [emoji, names] of Object.entries(EMOJI_WORDS)) {
    out = out.split(emoji).join(names[li]);
  }
  out = out
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2190}-\u{2BFF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out;
}

/** Every emoji the map knows — used by the collector/validator scripts. */
export const SPEAKABLE_EMOJI = Object.keys(EMOJI_WORDS);
