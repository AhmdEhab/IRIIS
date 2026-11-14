/**
 * IRIS — Phase 5 Arabic item bank (literacy + numeracy).
 *
 * ── VALIDATION STATUS — READ BEFORE QUOTING ANYTHING FROM THIS FILE ───────
 * Every item is validation_status = RESEARCH_INFORMED_PROTOTYPE and
 * specialist_review_status = NOT_REVIEWED. Designed against
 * ASSESSMENT_RESEARCH_MATRIX.md; NOT clinically or educationally validated;
 * NOT reviewed by any specialist; NOT normed on Egyptian children — no Arabic
 * norming sample exists for any of this (matrix B8). `reviewed_by` is null and
 * must not be filled with an invented name.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Items are GENERATED from the letter and word tables in arabicLetters.js
 * rather than hand-written one by one. That is deliberate: it means a letter's
 * positional forms, dot siblings and dialect tag come from a single source, so
 * an item cannot ship with a wrong form or a missing dialect tag.
 *
 * ── DIFFICULTY IS STRUCTURAL, NOT COSMETIC (brief §12) ────────────────────
 * A tier changes the number of options and the closeness of the distractors:
 *   FOUNDATION   2 options, distant distractor
 *   PRACTICE     3 options
 *   CHALLENGE    4 options, near distractors (dot siblings, rhyme neighbours)
 * It never changes only the colour or the wording.
 *
 * ── DIALECT TAGGING ───────────────────────────────────────────────────────
 * Every phonological item carries `dialect_distance`, inherited from the
 * letter. See DIALECT_DISTANCE in ladders/literacy.js for what that tag is and
 * — importantly — what it is not.
 */
import { REVIEW_STATUS, VALIDATION, SPECIALIST_REVIEW } from '../spec.js';
import {
  ARABIC_LETTERS, LETTER_BY_CHAR, TARGET_WORDS, RHYME_PAIRS, FUNCTIONAL_WORDS,
  ARABIC_NUMERALS, toArabicNumeral, formOf, dotSiblings, EGP_DENOMINATIONS,
} from './arabicLetters.js';
import { dialectDistanceFor } from '../ladders/literacy.js';
import { SUBITIZING_MAX } from '../ladders/numeracy.js';

export const TIERS = ['FOUNDATION', 'GUIDED', 'PRACTICE', 'INDEPENDENT', 'CHALLENGE'];

/** Options presented per tier. A real difficulty difference, not a label. */
export const OPTIONS_PER_TIER = {
  FOUNDATION: 2, GUIDED: 2, PRACTICE: 3, INDEPENDENT: 3, CHALLENGE: 4,
};

const proto = {
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  reviewed_by: null,
  reviewed_at: null,
  specialist_notes: null,
  review_status: REVIEW_STATUS.APPROVED, // internal draft-approval so the demo can serve it
  dialect_distance: 'UNKNOWN',
};

const mk = (o) => ({ ...proto, ...o });

/** Deterministic pick of n distractors from a pool, excluding `not`. */
function distractors(pool, not, n, salt = 0) {
  const usable = pool.filter((x) => x !== not);
  const out = [];
  for (let i = 0; i < n && usable.length; i++) {
    out.push(usable[(i * 7 + salt * 3 + 1) % usable.length]);
  }
  return [...new Set(out)].slice(0, n);
}

/** Place the answer at a deterministic index so it is not always first. */
function withOptions(correct, distractorList, salt) {
  const opts = [correct, ...distractorList];
  const idx = salt % opts.length;
  const arranged = [...opts];
  arranged[0] = opts[idx];
  arranged[idx] = opts[0];
  return { options: arranged, correct_index: idx };
}

const items = [];
let n = 0;
const nextId = (p) => `${p}-${String(++n).padStart(3, '0')}`;

// ── LIT.READINESS — match identical pictures ────────────────────────────────
const READINESS_PICS = ['🐈', '🚗', '⚽', '🍎', '🌳', '🏠', '🐦', '👟'];
READINESS_PICS.forEach((pic, i) => {
  const tier = i < 3 ? 'FOUNDATION' : 'PRACTICE';
  const d = distractors(READINESS_PICS, pic, OPTIONS_PER_TIER[tier] - 1, i);
  const { options, correct_index } = withOptions(pic, d, i);
  items.push(mk({
    item_id: nextId('AR-RDY'), strand: 'LIT.READINESS', rung: 0, tier,
    template_id: 'TPL-AR_MATCH_IDENTICAL',
    stimulus: pic,
    prompt: { ar: 'اختار الصورة زي دي', en: 'Pick the picture that matches' },
    options, correct_index,
    hint: { ar: 'بصّ كويس على الشكل', en: 'Look carefully at the shape' },
  }));
});

// ── LIT.LETTER_AWARE — letter vs non-letter, and matching letters ───────────
const NON_LETTERS = ['🔴', '⭐', '🔷', '🟩', '🔶', '➕']; // emoji shapes: unmistakably NOT letters
const AMBIGUOUS_LETTERS = ['أ', 'إ', 'آ', 'ا', 'ل']; // bare vertical strokes read as a cursor, not a letter
ARABIC_LETTERS.filter((L) => !AMBIGUOUS_LETTERS.includes(L.letter)).slice(0, 8).forEach((L, i) => {
  const tier = i < 3 ? 'FOUNDATION' : 'PRACTICE';
  const d = distractors(NON_LETTERS, null, OPTIONS_PER_TIER[tier] - 1, i);
  const { options, correct_index } = withOptions(L.letter, d, i);
  items.push(mk({
    item_id: nextId('AR-LAW'), strand: 'LIT.LETTER_AWARE', rung: 1, tier,
    template_id: 'TPL-AR_LETTER_MATCH',
    prompt: { ar: 'أنهي واحد ده حرف؟', en: 'Which one is a letter?' },
    options, correct_index,
    hint: { ar: 'الحروف بنكتب بيها الكلام', en: 'Letters are what we write words with' },
    letter: L.letter, dialect_distance: L.dialect,
  }));
});
ARABIC_LETTERS.slice(8, 14).forEach((L, i) => {
  const tier = 'PRACTICE';
  const pool = ARABIC_LETTERS.map((x) => x.letter);
  const d = distractors(pool, L.letter, OPTIONS_PER_TIER[tier] - 1, i + 3);
  const { options, correct_index } = withOptions(L.letter, d, i);
  items.push(mk({
    item_id: nextId('AR-LAW'), strand: 'LIT.LETTER_AWARE', rung: 1, tier,
    template_id: 'TPL-AR_LETTER_MATCH',
    stimulus: L.letter,
    prompt: { ar: 'اختار الحرف زي ده', en: 'Pick the letter that matches' },
    options, correct_index,
    hint: { ar: 'قارن الشكل والنقط', en: 'Compare the shape and the dots' },
    letter: L.letter, dialect_distance: L.dialect,
  }));
});

// ── LIT.LETTER_FORMS — the same letter in a different position ──────────────
// Arabic-specific. Non-connecting letters are skipped here because their
// initial and medial forms are identical to the isolated one, so the item
// would test nothing (matrix B1, B3).
ARABIC_LETTERS.filter((L) => !L.non_connecting).slice(0, 8).forEach((L, i) => {
  const target = i % 2 === 0 ? 'INITIAL' : 'MEDIAL';
  const tier = i < 3 ? 'FOUNDATION' : i < 6 ? 'PRACTICE' : 'CHALLENGE';
  const correct = formOf(L.letter, target);
  const pool = ARABIC_LETTERS.filter((x) => !x.non_connecting).map((x) => formOf(x.letter, target));
  const d = distractors(pool, correct, OPTIONS_PER_TIER[tier] - 1, i);
  const { options, correct_index } = withOptions(correct, d, i);
  items.push(mk({
    item_id: nextId('AR-FRM'), strand: 'LIT.LETTER_FORMS', rung: 1, tier,
    template_id: 'TPL-AR_FORM_MATCH',
    stimulus: L.letter, letter_form: target,
    prompt: {
      ar: `الحرف ${L.letter} — فين شكله في ${target === 'INITIAL' ? 'أول' : 'وسط'} الكلمة؟`,
      en: `The letter ${L.letter} — which is its ${target.toLowerCase()} form?`,
    },
    options, correct_index,
    hint: { ar: 'الحرف بيتغيّر شكله حسب مكانه في الكلمة', en: 'A letter changes shape depending on where it sits' },
    letter: L.letter, dialect_distance: L.dialect,
    error_codes: ['WRONG_FORM', 'WRONG_LETTER'],
    arabic_specific: true,
  }));
});

// ── LIT.DOT_CONTRAST — one item per confusion set ───────────────────────────
// The distractors here are deliberately the letter's own dot siblings, which
// is the whole point: a generic distractor would not test the bottleneck
// Ghandour et al. (B2) identified.
ARABIC_LETTERS.filter((L) => L.dot_set).forEach((L, i) => {
  const sibs = dotSiblings(L.letter);
  if (!sibs.length) return;
  const tier = sibs.length >= 2 ? 'CHALLENGE' : 'PRACTICE';
  const { options, correct_index } = withOptions(L.letter, sibs.slice(0, OPTIONS_PER_TIER[tier] - 1), i);
  items.push(mk({
    item_id: nextId('AR-DOT'), strand: 'LIT.DOT_CONTRAST', rung: 1, tier,
    template_id: 'TPL-AR_DOT_CONTRAST',
    prompt: { ar: `فين حرف «${L.name_ar}»؟`, en: `Which one is ${L.name_ar}?` },
    options, correct_index,
    hint: { ar: 'عُدّ النقط وشوف هي فوق ولا تحت', en: 'Count the dots and see if they are above or below' },
    letter: L.letter, dot_set: L.dot_set, dialect_distance: L.dialect,
    error_codes: ['DOT_CONFUSION'],
    arabic_specific: true,
  }));
});

// ── LIT.LETTER_NAME ─────────────────────────────────────────────────────────
ARABIC_LETTERS.slice(0, 12).forEach((L, i) => {
  const tier = i < 4 ? 'FOUNDATION' : i < 8 ? 'PRACTICE' : 'CHALLENGE';
  /**
   * At CHALLENGE the distractors are the letter's own dot siblings — a
   * genuinely harder choice than an arbitrary letter.
   *
   * Most dot sets have only one sibling (د/ذ, ر/ز, س/ش), so siblings alone
   * would give a two-option item — which would make CHALLENGE *easier* than
   * PRACTICE and turn the tier into a label. The pool is therefore siblings
   * FIRST, topped up with other letters to reach the tier's option count.
   */
  const need = OPTIONS_PER_TIER[tier] - 1;
  const sibs = tier === 'CHALLENGE' ? dotSiblings(L.letter) : [];
  const d = [
    ...sibs.slice(0, need),
    ...distractors(
      ARABIC_LETTERS.map((x) => x.letter).filter((x) => !sibs.includes(x)),
      L.letter, Math.max(0, need - sibs.length), i
    ),
  ].slice(0, need);
  const { options, correct_index } = withOptions(L.letter, d, i);
  items.push(mk({
    item_id: nextId('AR-LNM'), strand: 'LIT.LETTER_NAME', rung: 2, tier,
    template_id: 'TPL-AR_LETTER_NAME',
    audio_ar: L.name_ar,
    prompt: { ar: `فين حرف «${L.name_ar}»؟`, en: `Which letter is ${L.name_ar}?` },
    options, correct_index,
    hint: { ar: `${L.name_ar} بتتكتب كده: ${L.letter}`, en: `${L.name_ar} is written ${L.letter}` },
    letter: L.letter, dialect_distance: L.dialect,
  }));
});

// ── LIT.SOUND_TO_LETTER / LIT.LETTER_TO_SOUND — the two directions ──────────
// Measured separately because they dissociate, and because the direction that
// works is where teaching should start.
ARABIC_LETTERS.slice(0, 12).forEach((L, i) => {
  const tier = i < 4 ? 'FOUNDATION' : i < 8 ? 'PRACTICE' : 'CHALLENGE';
  const pool = ARABIC_LETTERS.map((x) => x.letter);
  const d = distractors(pool, L.letter, OPTIONS_PER_TIER[tier] - 1, i + 1);
  const { options, correct_index } = withOptions(L.letter, d, i);
  items.push(mk({
    item_id: nextId('AR-S2L'), strand: 'LIT.SOUND_TO_LETTER', rung: 2, tier,
    template_id: 'TPL-AR_SOUND_TO_LETTER',
    audio_sound: L.sound_hint_ar,
    prompt: { ar: `الصوت «${L.sound_hint_ar}» — فين حرفه؟`, en: `The sound ${L.sound_hint_ar} — which letter?` },
    options, correct_index,
    hint: { ar: `الصوت ده بيطلع من حرف ${L.name_ar}`, en: `That sound comes from ${L.name_ar}` },
    letter: L.letter, dialect_distance: L.dialect,
    shows_letter: true, // matrix A3 — PA works better taught with letters
  }));

});

// The letter → sound direction needs a word beginning with that letter, so it
// iterates the letters that actually start a target word rather than the first
// twelve of the alphabet — otherwise the strand ships with a handful of items
// and the two directions cannot be fairly compared.
ARABIC_LETTERS
  .map((L) => ({ L, words: TARGET_WORDS.filter((w) => w.sounds[0] === L.letter) }))
  .filter((x) => x.words.length > 0)
  .forEach(({ L, words }, i) => {
    words.slice(0, 2).forEach((w, j) => {
      const tier = j === 0 ? (i < 4 ? 'FOUNDATION' : 'PRACTICE') : 'CHALLENGE';
      const dw = distractors(TARGET_WORDS.map((x) => x.emoji), w.emoji, OPTIONS_PER_TIER[tier] - 1, i + j);
      const { options: o2, correct_index: c2 } = withOptions(w.emoji, dw, i + j);
      items.push(mk({
        item_id: nextId('AR-L2S'), strand: 'LIT.LETTER_TO_SOUND', rung: 2, tier,
        template_id: 'TPL-AR_LETTER_TO_SOUND',
        stimulus: L.letter,
        prompt: { ar: `حرف ${L.letter} — أنهي كلمة بتبدأ بصوته؟`, en: `The letter ${L.letter} — which word starts with its sound?` },
        options: o2, correct_index: c2,
        hint: { ar: `${L.name_ar} بتقول «${L.sound_hint_ar}»`, en: `${L.name_ar} says ${L.sound_hint_ar}` },
        letter: L.letter, dialect_distance: L.dialect, shows_letter: true,
      }));
    });
  });

// ── LIT.PHON_SYLLABLE ───────────────────────────────────────────────────────
TARGET_WORDS.slice(0, 8).forEach((w, i) => {
  const tier = i < 3 ? 'FOUNDATION' : 'PRACTICE';
  const counts = [1, 2, 3].map(toArabicNumeral);
  const correct = toArabicNumeral(w.syllables);
  const { options, correct_index } = withOptions(correct, counts.filter((c) => c !== correct).slice(0, OPTIONS_PER_TIER[tier] - 1), i);
  items.push(mk({
    item_id: nextId('AR-SYL'), strand: 'LIT.PHON_SYLLABLE', rung: 3, tier,
    template_id: 'TPL-AR_SYLLABLE',
    stimulus: w.word, emoji: w.emoji, audio_ar: w.word,
    prompt: { ar: `«${w.word}» — كام مقطع؟`, en: `${w.word} — how many chunks?` },
    options, correct_index,
    hint: { ar: 'صفّق مع كل مقطع', en: 'Clap once for each chunk' },
    dialect_distance: dialectDistanceFor(w.sounds[0]),
    picture_supported: true, shows_letter: true,
  }));
});

// ── LIT.PHON_RHYME ──────────────────────────────────────────────────────────
RHYME_PAIRS.forEach((p, i) => {
  const tier = i < 2 ? 'PRACTICE' : 'CHALLENGE';
  const { options, correct_index } = withOptions(p.b, [p.distractor], i);
  items.push(mk({
    item_id: nextId('AR-RHY'), strand: 'LIT.PHON_RHYME', rung: 4, tier,
    template_id: 'TPL-AR_RHYME',
    stimulus: p.a, audio_ar: p.a,
    prompt: { ar: `«${p.a}» — أنهي كلمة بتخلص زيها؟`, en: `${p.a} — which word ends the same?` },
    options, correct_index,
    hint: { ar: 'ركّز على آخر صوت في الكلمة', en: 'Listen to the last sound in the word' },
    dialect_distance: dialectDistanceFor(p.a[0]),
    picture_supported: true, shows_letter: true,
  }));
});

// ── LIT.PHON_BLEND (+ the picture-led partner) ──────────────────────────────
TARGET_WORDS.slice(0, 8).forEach((w, i) => {
  const tier = i < 3 ? 'FOUNDATION' : i < 6 ? 'PRACTICE' : 'CHALLENGE';
  const d = distractors(TARGET_WORDS.map((x) => x.emoji), w.emoji, OPTIONS_PER_TIER[tier] - 1, i);
  const { options, correct_index } = withOptions(w.emoji, d, i);
  const base = {
    stimulus: w.sounds.join(' · '), emoji: w.emoji,
    options, correct_index,
    hint: { ar: 'قول الأصوات ورا بعض بسرعة', en: 'Say the sounds quickly, one after the other' },
    dialect_distance: dialectDistanceFor(w.sounds[0]),
    sounds: w.sounds, shows_letter: true, picture_supported: true,
  };
  items.push(mk({
    ...base, item_id: nextId('AR-BLD'), strand: 'LIT.PHON_BLEND', rung: 5, tier,
    template_id: 'TPL-AR_BLEND',
    prompt: { ar: `${w.sounds.join(' · ')} — الأصوات دي بتعمل أنهي كلمة؟`, en: `Which word do these sounds make?` },
  }));
  items.push(mk({
    ...base, item_id: nextId('AR-BLDP'), strand: 'LIT.PHON_BLEND', rung: 5, tier,
    template_id: 'TPL-AR_BLEND_PICTURE_LED',
    prompt: { ar: `الصورة دي أصواتها إيه؟`, en: 'What sounds make this picture?' },
  }));
});

// ── LIT.PHON_SEGMENT ────────────────────────────────────────────────────────
TARGET_WORDS.slice(0, 6).forEach((w, i) => {
  items.push(mk({
    item_id: nextId('AR-SEG'), strand: 'LIT.PHON_SEGMENT', rung: 6,
    tier: i < 3 ? 'PRACTICE' : 'CHALLENGE',
    template_id: 'TPL-AR_SEGMENT',
    stimulus: w.word, emoji: w.emoji, audio_ar: w.word,
    prompt: { ar: `قسّم «${w.word}» لأصواتها بالترتيب`, en: `Break ${w.word} into its sounds in order` },
    options: w.sounds, correct_order: w.sounds,
    hint: { ar: 'ابدأ بأول صوت في الكلمة', en: 'Start with the first sound' },
    dialect_distance: dialectDistanceFor(w.sounds[0]),
    shows_letter: true,
  }));
});

// ── LIT.DECODING and LIT.WORD_READING — the two reading directions ──────────
TARGET_WORDS.slice(0, 10).forEach((w, i) => {
  const tier = i < 4 ? 'FOUNDATION' : i < 7 ? 'PRACTICE' : 'CHALLENGE';
  const de = distractors(TARGET_WORDS.map((x) => x.emoji), w.emoji, OPTIONS_PER_TIER[tier] - 1, i);
  const { options, correct_index } = withOptions(w.emoji, de, i);
  items.push(mk({
    item_id: nextId('AR-DEC'), strand: 'LIT.DECODING', rung: 7, tier,
    template_id: 'TPL-AR_DECODE',
    stimulus: w.word,
    prompt: { ar: `اقرا «${w.word}» واختار صورتها`, en: `Read ${w.word} and pick its picture` },
    options, correct_index,
    hint: { ar: 'فك الكلمة صوت صوت', en: 'Sound the word out, one sound at a time' },
    vowelised: true, theme: w.theme,
  }));

  const dw = distractors(TARGET_WORDS.map((x) => x.word), w.word, OPTIONS_PER_TIER[tier] - 1, i + 2);
  const { options: o2, correct_index: c2 } = withOptions(w.word, dw, i);
  items.push(mk({
    item_id: nextId('AR-WRD'), strand: 'LIT.WORD_READING', rung: 8, tier,
    template_id: 'TPL-AR_WORD_READ',
    stimulus: w.emoji,
    prompt: { ar: 'اختار الكلمة الصح', en: 'Pick the right word' },
    options: o2, correct_index: c2,
    hint: { ar: 'بصّ على أول حرف', en: 'Look at the first letter' },
    vowelised: true, theme: w.theme,
  }));
});

// ── LIT.READ_COMP ───────────────────────────────────────────────────────────
const SENTENCES = [
  { text: 'الوَلَد يَشْرَبُ اللَّبَن.', q: 'الوَلَد بيعمل إيه؟', a: '🥛', d: ['🍎', '⚽'] },
  { text: 'القِطَّة فَوْقَ الكُرْسِيّ.', q: 'القطة فين؟', a: '🪑', d: ['🚪', '🌳'] },
  { text: 'البِنْت تَقْرَأُ كِتَابًا.', q: 'البنت بتعمل إيه؟', a: '📕', d: ['🍌', '🐟'] },
  { text: 'الشَّمْس فِي السَّمَاء.', q: 'الشمس فين؟', a: '☀️', d: ['🏠', '🐈'] },
];
SENTENCES.forEach((s, i) => {
  const { options, correct_index } = withOptions(s.a, s.d, i);
  items.push(mk({
    item_id: nextId('AR-RCP'), strand: 'LIT.READ_COMP', rung: 9,
    tier: i < 2 ? 'PRACTICE' : 'CHALLENGE',
    template_id: 'TPL-AR_READ_COMP',
    stimulus: s.text,
    prompt: { ar: s.q, en: 'Read and answer' },
    options, correct_index,
    hint: { ar: 'اقرا الجملة تاني بالراحة', en: 'Read the sentence again slowly' },
    vowelised: true,
  }));
});

// ── LIT.FUNCTIONAL ──────────────────────────────────────────────────────────
FUNCTIONAL_WORDS.forEach((f, i) => {
  const d = distractors(FUNCTIONAL_WORDS.map((x) => x.emoji), f.emoji, 2, i);
  const { options, correct_index } = withOptions(f.emoji, d, i);
  items.push(mk({
    item_id: nextId('AR-FUN'), strand: 'LIT.FUNCTIONAL', rung: 10, tier: 'PRACTICE',
    template_id: 'TPL-AR_FUNCTIONAL_READ',
    stimulus: f.word,
    prompt: { ar: `«${f.word}» — معناها إيه؟`, en: `${f.word} — what does it mean?` },
    options, correct_index,
    hint: { ar: 'الكلمة دي بنشوفها في الشارع كتير', en: 'You see this word around town' },
    vowelised: true,
  }));
});

// ── LISTENING track ─────────────────────────────────────────────────────────
TARGET_WORDS.slice(0, 8).forEach((w, i) => {
  const tier = i < 4 ? 'FOUNDATION' : 'PRACTICE';
  const d = distractors(TARGET_WORDS.map((x) => x.emoji), w.emoji, OPTIONS_PER_TIER[tier] - 1, i + 4);
  const { options, correct_index } = withOptions(w.emoji, d, i);
  items.push(mk({
    item_id: nextId('AR-LSW'), strand: 'LIT.LISTEN_WORD', rung: 0, tier,
    template_id: 'TPL-AR_LISTEN_WORD',
    audio_ar: w.word,
    prompt: { ar: 'اسمع واختار الصورة', en: 'Listen and pick the picture' },
    options, correct_index,
    hint: { ar: 'هسمعك تاني', en: 'I will say it again' },
  }));
});
SENTENCES.forEach((s, i) => {
  const { options, correct_index } = withOptions(s.a, s.d, i + 1);
  items.push(mk({
    item_id: nextId('AR-LSS'), strand: 'LIT.LISTEN_SENTENCE', rung: 1, tier: 'PRACTICE',
    template_id: 'TPL-AR_LISTEN_SENTENCE',
    audio_ar: s.text,
    prompt: { ar: 'اسمع الجملة واختار الصورة', en: 'Listen and pick the picture' },
    options, correct_index,
    hint: { ar: 'ركّز على الحاجة اللي بتحصل', en: 'Listen for what is happening' },
  }));
});
[
  { ar: 'المس الكورة وبعدين الكتاب', seq: ['⚽', '📕'], pool: ['⚽', '📕', '🍎'] },
  { ar: 'المس القطة وبعدين البيت', seq: ['🐈', '🏠'], pool: ['🐈', '🏠', '🌳'] },
  { ar: 'المس الشمس وبعدين السمكة', seq: ['☀️', '🐟'], pool: ['☀️', '🐟', '👟'] },
].forEach((x, i) => {
  items.push(mk({
    item_id: nextId('AR-LSI'), strand: 'LIT.LISTEN_INSTRUCTION', rung: 2, tier: 'PRACTICE',
    template_id: 'TPL-AR_LISTEN_INSTRUCTION',
    audio_ar: x.ar,
    prompt: { ar: x.ar, en: 'Do what you hear, in order' },
    options: x.pool, correct_order: x.seq,
    hint: { ar: 'الأول الحاجة الأولانية', en: 'The first one first' },
  }));
});
[
  { story: 'سَامِي راح المدرسة ونسي كتابه في البيت.', q: 'سامي نسي إيه؟', a: '📕', d: ['⚽', '🍎'] },
  { story: 'مَنَى لعبت في الجنينة وبعدين شربت مية.', q: 'منى شربت إيه؟', a: '💧', d: ['🥛', '🍌'] },
  { story: 'القطة نامت تحت الشجرة عشان الشمس حامية.', q: 'القطة نامت فين؟', a: '🌳', d: ['🏠', '🪑'] },
].forEach((x, i) => {
  const { options, correct_index } = withOptions(x.a, x.d, i);
  items.push(mk({
    item_id: nextId('AR-LST'), strand: 'LIT.LISTEN_STORY', rung: 3, tier: 'CHALLENGE',
    template_id: 'TPL-AR_LISTEN_STORY',
    audio_ar: x.story,
    prompt: { ar: x.q, en: 'Listen and answer' },
    options, correct_index,
    hint: { ar: 'افتكر أول حاجة حصلت', en: 'Think about what happened first' },
  }));
});

// ══ NUMERACY ════════════════════════════════════════════════════════════════
const dots = (k) => '●'.repeat(k);

// ── NUM.QUANTITY — subitizing, capped at 4 (matrix C8) ──────────────────────
for (let k = 1; k <= SUBITIZING_MAX; k++) {
  for (const tier of ['FOUNDATION', 'PRACTICE']) {
    const correct = toArabicNumeral(k);
    const pool = Array.from({ length: SUBITIZING_MAX }, (_, j) => toArabicNumeral(j + 1));
    const d = distractors(pool, correct, OPTIONS_PER_TIER[tier] - 1, k);
    const { options, correct_index } = withOptions(correct, d, k);
    items.push(mk({
      item_id: nextId('AR-QTY'), strand: 'NUM.QUANTITY', rung: 0, tier,
      template_id: 'TPL-AR_SUBITIZE',
      stimulus: dots(k), set_size: k, flash: true,
      prompt: { ar: 'كام واحدة؟', en: 'How many?' },
      options, correct_index,
      hint: { ar: 'بصّ من غير ما تعُدّ', en: 'Look without counting' },
      language_light: true,
    }));
  }
}

// ── NUM.COUNTING (+ the select partner) ─────────────────────────────────────
[3, 4, 5, 6, 7, 8].forEach((k, i) => {
  const tier = k <= 4 ? 'FOUNDATION' : k <= 6 ? 'PRACTICE' : 'CHALLENGE';
  items.push(mk({
    item_id: nextId('AR-CNT'), strand: 'NUM.COUNTING', rung: 1, tier,
    template_id: 'TPL-AR_COUNT',
    stimulus: dots(k), set_size: k,
    prompt: { ar: 'عُدّ واحدة واحدة', en: 'Count them one by one' },
    expected_taps: k,
    hint: { ar: 'المس كل واحدة مرّة واحدة بس', en: 'Touch each one exactly once' },
    language_light: true,
  }));
  const correct = dots(k);
  const d = distractors([dots(k - 1), dots(k + 1), dots(k + 2)], correct, OPTIONS_PER_TIER[tier] - 1, i);
  const { options, correct_index } = withOptions(correct, d, i);
  items.push(mk({
    item_id: nextId('AR-CNTS'), strand: 'NUM.COUNTING', rung: 1, tier,
    template_id: 'TPL-AR_COUNT_SELECT',
    stimulus: toArabicNumeral(k),
    prompt: { ar: `فين المجموعة اللي فيها ${toArabicNumeral(k)}؟`, en: `Which set has ${k}?` },
    options, correct_index,
    hint: { ar: 'عُدّ كل مجموعة', en: 'Count each group' },
    language_light: true,
  }));
});

// ── NUM.CARDINALITY — "give me n". Probed independently of counting. ────────
[2, 3, 4, 5, 3, 4].forEach((k, i) => {
  items.push(mk({
    item_id: nextId('AR-CRD'), strand: 'NUM.CARDINALITY', rung: 1,
    tier: k <= 3 ? 'FOUNDATION' : 'PRACTICE',
    template_id: 'TPL-AR_GIVE_N',
    audio_ar: `هاتلي ${toArabicNumeral(k)}`,
    prompt: { ar: `هاتلي ${toArabicNumeral(k)}`, en: `Give me ${k}` },
    pool_size: 8, expected_taps: k,
    hint: { ar: 'لما توصل للعدد، قف', en: 'Stop when you reach the number' },
    language_light: true,
    _why: 'matrix C1/D10 — cardinality is not gated behind counting',
  }));
});

// ── NUM.NUMERAL (+ quantity partner) ────────────────────────────────────────
ARABIC_NUMERALS.slice(1, 8).forEach((num, i) => {
  const tier = i < 3 ? 'FOUNDATION' : i < 5 ? 'PRACTICE' : 'CHALLENGE';
  const d = distractors(ARABIC_NUMERALS.slice(1), num, OPTIONS_PER_TIER[tier] - 1, i);
  const { options, correct_index } = withOptions(num, d, i);
  items.push(mk({
    item_id: nextId('AR-NUM'), strand: 'NUM.NUMERAL', rung: 2, tier,
    template_id: 'TPL-AR_NUMERAL',
    audio_ar: num,
    prompt: { ar: `فين رقم ${num}؟`, en: `Which one is ${i + 1}?` },
    options, correct_index,
    hint: { ar: 'بصّ على شكل الرقم', en: 'Look at the shape of the numeral' },
    language_light: true,
  }));
  const k = i + 1;
  const dq = distractors([dots(k - 1), dots(k + 1), dots(k + 2)], dots(k), OPTIONS_PER_TIER[tier] - 1, i);
  const { options: o2, correct_index: c2 } = withOptions(dots(k), dq, i);
  items.push(mk({
    item_id: nextId('AR-NQT'), strand: 'NUM.NUMERAL', rung: 2, tier,
    template_id: 'TPL-AR_NUMERAL_TO_QTY',
    stimulus: num,
    prompt: { ar: `${num} يساوي كام حاجة؟`, en: `How many does ${num} mean?` },
    options: o2, correct_index: c2,
    hint: { ar: 'عُدّ كل مجموعة وقارن', en: 'Count each group and compare' },
    language_light: true,
  }));
});

// ── NUM.COMPARISON — uses relational language, and says so ──────────────────
[[2, 5], [4, 3], [6, 6], [1, 7], [5, 2], [3, 8]].forEach(([a, b], i) => {
  const tier = Math.abs(a - b) >= 3 ? 'FOUNDATION' : 'CHALLENGE';
  // Two equal sets cannot be offered as two options — they would be
  // indistinguishable and the child could not answer correctly except by luck.
  // The equal case therefore becomes a same/not-same judgement with both sets
  // in the stimulus, which is also the lighter language of the two forms.
  const equal = a === b;
  const opts = equal ? ['زي بعض', 'مش زي بعض'] : [dots(a), dots(b)];
  const answer = equal ? 'زي بعض' : (a > b ? dots(a) : dots(b));
  items.push(mk({
    item_id: nextId('AR-CMP'), strand: 'NUM.COMPARISON', rung: 3, tier,
    template_id: 'TPL-AR_COMPARE',
    stimulus: equal ? `${dots(a)}   |   ${dots(b)}` : null,
    prompt: { ar: equal ? 'المجموعتين زي بعض؟' : 'أنهي مجموعة فيها أكتر؟', en: equal ? 'Are the two groups the same?' : 'Which group has more?' },
    options: opts, correct_index: opts.indexOf(answer),
    hint: { ar: 'قارن الاتنين مع بعض', en: 'Compare the two side by side' },
    uses_relational_language: true, language_light: false,
    _language_note: 'matrix E8 — a failure here may be linguistic rather than numerical',
  }));
});

// ── NUM.SEQUENCE ────────────────────────────────────────────────────────────
[[1, 2, null, 4], [2, 3, 4, null], [5, null, 7, 8], [3, 4, null, 6], [6, 5, null, 3], [8, 7, 6, null]]
  .forEach((seq, i) => {
    const missingIdx = seq.indexOf(null);
    const answer = i < 4 ? (seq[missingIdx - 1] ?? seq[missingIdx + 1] - 1) + 1 : (seq[missingIdx - 1] ?? 0) - 1;
    const correct = toArabicNumeral(answer);
    const d = distractors(ARABIC_NUMERALS.slice(1), correct, 2, i);
    const { options, correct_index } = withOptions(correct, d, i);
    items.push(mk({
      item_id: nextId('AR-SEQ'), strand: 'NUM.SEQUENCE', rung: 4,
      tier: i < 4 ? 'PRACTICE' : 'CHALLENGE',
      template_id: 'TPL-AR_SEQUENCE',
      stimulus: seq.map((x) => (x == null ? '؟' : toArabicNumeral(x))).join(' '),
      prompt: { ar: 'إيه الرقم الناقص؟', en: 'Which number is missing?' },
      options, correct_index,
      hint: { ar: 'عُدّ من الأول', en: 'Count from the start' },
      backward: i >= 4, // C4 — backward counting is the more predictive kind
      language_light: true,
    }));
  });

// ── NUM.OPERATIONS ──────────────────────────────────────────────────────────
[[2, 1, '+'], [3, 2, '+'], [4, 1, '-'], [5, 2, '-'], [3, 3, '+'], [6, 2, '-']].forEach(([a, b, op], i) => {
  const answer = op === '+' ? a + b : a - b;
  const correct = toArabicNumeral(answer);
  const d = distractors(ARABIC_NUMERALS.slice(1), correct, 2, i);
  const { options, correct_index } = withOptions(correct, d, i);
  items.push(mk({
    item_id: nextId('AR-OPS'), strand: 'NUM.OPERATIONS', rung: 5,
    tier: a + b <= 4 ? 'PRACTICE' : 'CHALLENGE',
    template_id: 'TPL-AR_ADD_SMALL',
    stimulus: `${dots(a)}  ${op}  ${dots(b)}`,
    prompt: { ar: op === '+' ? 'يبقى كام كلهم؟' : 'فضل كام؟', en: op === '+' ? 'How many altogether?' : 'How many are left?' },
    options, correct_index,
    hint: { ar: 'عُدّ الكل مع بعض', en: 'Count them all together' },
    uses_relational_language: true, language_light: false,
  }));
});

// ── NUM.PATTERN ─────────────────────────────────────────────────────────────
[
  { seq: ['🔴', '🔵', '🔴', '🔵'], next: '🔴', d: ['🔵', '🟡'] },
  { seq: ['⭐', '⭐', '🌙', '⭐', '⭐'], next: '🌙', d: ['⭐', '☀️'] },
  { seq: ['🟩', '🟨', '🟩', '🟨'], next: '🟩', d: ['🟨', '🟦'] },
  { seq: ['١', '٢', '١', '٢'], next: '١', d: ['٢', '٣'] },
  { seq: ['🔺', '🔺', '🔵', '🔺', '🔺'], next: '🔵', d: ['🔺', '🟢'] },
  { seq: ['٢', '٤', '٦'], next: '٨', d: ['٧', '٩'] },
].forEach((p, i) => {
  const { options, correct_index } = withOptions(p.next, p.d, i);
  items.push(mk({
    item_id: nextId('AR-PAT'), strand: 'NUM.PATTERN', rung: 6,
    tier: i < 3 ? 'PRACTICE' : 'CHALLENGE',
    template_id: 'TPL-AR_PATTERN',
    stimulus: p.seq.join(' '),
    prompt: { ar: 'إيه اللي جاي؟', en: 'What comes next?' },
    options, correct_index,
    hint: { ar: 'شوف الترتيب بيتكرر إزاي', en: 'See how the order repeats' },
    language_light: true,
  }));
});

// ── NUM.FUNCTIONAL — money and time ─────────────────────────────────────────
EGP_DENOMINATIONS.forEach((v, i) => {
  const correct = toArabicNumeral(v);
  const d = distractors(EGP_DENOMINATIONS.map(toArabicNumeral), correct, 2, i);
  const { options, correct_index } = withOptions(correct, d, i);
  items.push(mk({
    item_id: nextId('AR-MON'), strand: 'NUM.FUNCTIONAL', rung: 7, tier: 'PRACTICE',
    template_id: 'TPL-AR_MONEY',
    stimulus: `💵 ${toArabicNumeral(v)} جنيه`,
    prompt: { ar: 'ده كام جنيه؟', en: 'How many pounds is this?' },
    options, correct_index,
    hint: { ar: 'اقرا الرقم اللي على الورقة', en: 'Read the number on the note' },
  }));
});
[
  { stim: '🕐', ar: 'الساعة كام؟', a: '١', d: ['٢', '٣'] },
  { stim: '🕒', ar: 'الساعة كام؟', a: '٣', d: ['٤', '٢'] },
].forEach((x, i) => {
  const { options, correct_index } = withOptions(x.a, x.d, i);
  items.push(mk({
    item_id: nextId('AR-TIM'), strand: 'NUM.FUNCTIONAL', rung: 7, tier: 'PRACTICE',
    template_id: 'TPL-AR_TIME',
    stimulus: x.stim,
    prompt: { ar: x.ar, en: 'What time is it?' },
    options, correct_index,
    hint: { ar: 'بصّ على العقرب القصير', en: 'Look at the short hand' },
  }));
});

export const PHASE5_BANK = items;
export const PHASE5_ITEM_BY_ID = Object.fromEntries(items.map((i) => [i.item_id, i]));

/** Only APPROVED items may be served to a child (doc 15 §5). */
export function servableStrandItems({ strand, template_id = null, tier = null, rung = null }) {
  return PHASE5_BANK.filter(
    (i) =>
      i.strand === strand &&
      i.review_status === REVIEW_STATUS.APPROVED &&
      (template_id == null || i.template_id === template_id) &&
      (tier == null || i.tier === tier) &&
      (rung == null || i.rung === rung)
  );
}

/** Coverage report — used by qa-ladders.mjs so a strand cannot ship empty. */
export function bankCoverage() {
  const byStrand = {};
  for (const i of PHASE5_BANK) {
    byStrand[i.strand] ??= { items: 0, templates: new Set(), tiers: new Set() };
    byStrand[i.strand].items += 1;
    byStrand[i.strand].templates.add(i.template_id);
    byStrand[i.strand].tiers.add(i.tier);
  }
  return Object.fromEntries(
    Object.entries(byStrand).map(([k, v]) => [k, {
      items: v.items, templates: [...v.templates].sort(), tiers: [...v.tiers].sort(),
    }])
  );
}

export const PHASE5_BANK_META = {
  total_items: PHASE5_BANK.length,
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  language_of_targets: 'MSA_VOWELISED',
  language_of_instructions: 'EGYPTIAN_ARABIC',
  description_en:
    'Research-informed prototype Arabic items. Not validated, not normed, not specialist-reviewed. No Arabic norming sample exists for this content (matrix B8).',
  description_ar:
    'محتوى عربي أوّلي مبني على إطار بحثي. غير مُتحقَّق منه ولا مُعتمد ولا مراجَع من مختص.',
};
