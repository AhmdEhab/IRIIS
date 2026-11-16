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
import { TARGET_SKILL_BY_TEMPLATE } from './phase5Templates.js';

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
    /* P63 (user-approved): the name→grapheme ask got its own honest wording.
       The old «فين حرف «X»؟» collided WORD-FOR-WORD with the dot-contrast
       strand even though the two measure different skills (this one: recall
       of the letter's name against unrelated letters; DOT: fine visual
       discrimination among dot siblings). Skill, options and correct_index
       are untouched. The hint also used to PRINT the answer letter — which
       turned the hint into a solution — so it now only restates the name. */
    prompt: { ar: `اختار الحرف اللي اسمه «${L.name_ar}»`, en: `Choose the letter named "${L.name_ar}"` },
    options, correct_index,
    hint: { ar: `اسمه «${L.name_ar}» — دور عليه على طول`, en: `It is called "${L.name_ar}" — look straight for it` },
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
  void nextId('AR-BLDP'); // retired — number CONSUMED in place (P63 id stability)
  /* P63 (user-approved option أ): the PICTURE_LED twin retired — it carried
     the identical stimulus, options and answer as the BLD item above while
     asking about a picture that was never on screen. The blending strand is
     served solely by the honest TPL-AR_BLEND items now. Old family records
     that captured those item_ids are untouched — records freeze what ran. */
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
/* P63: [2,3,4,5,3,4] produced AR-CRD-192/193 as EXACT copies of 189/190
   (same n, same seeded distractor rotation) — retired; the set is 2..5 now. */
[2, 3, 4, 5].forEach((k, i) => {
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
void nextId('AR-CRD'); void nextId('AR-CRD'); // P63 retired 192/193 — ids consumed, later numbering frozen

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


// ══ av2 §2 — VSP (E), MEM (F), COMM (A) ════════════════════════════════════
//
// These three ladders measure what the literacy and numeracy ladders can only
// imply: the visual demand underneath a matching item, the memory demand
// underneath an instruction, and the child's own expressive channel. They use
// the SAME generation machinery as everything above — `distractors`,
// `withOptions`, `mk`, `proto` — so an av2 item cannot ship with a validation
// badge the rest of the bank does not carry, and difficulty still comes from
// the number and closeness of options rather than from a label (brief §12).
//
// ── STIMULI ARE PICTURES, NOT WORDS ────────────────────────────────────────
// Emoji tiles are deliberate: a picture pool carries no letter, no numeral and
// no vocabulary requirement, which is the whole point of a non-symbolic
// ladder. The pool stays small and familiar (apple / fish / car / ball / teddy
// / elephant / flower / duck) because an unusual picture would test naming
// instead of matching.
//
// ── THE `_LISTEN` ITEMS ARE A ROUTE, NOT A HARDER ITEM ─────────────────────
// Same tiles, same answer key, instruction delivered by audio instead of by
// printed Arabic. The adaptive probe re-offers exactly these on a
// `paired_modality` retry (spec §4), so the second attempt has to differ ONLY
// in how the question arrives — otherwise the engine would be comparing two
// different difficulties and calling the difference a modality.
const AV2_PICS = ['🍎', '🐟', '🚗', '⚽', '🧸', '🐘', '🌸', '🦆'];

/** Egyptian-friendly names for the pool — used by the expressive items only. */
const AV2_NAME_AR = {
  '🍎': 'تفاحة', '🐟': 'سمكة', '🚗': 'عربية', '⚽': 'كورة', '🧸': 'دبدوب',
  '🐘': 'فيل', '🌸': 'زَهرة', '🦆': 'بطة', '🐶': 'كلب', '🌙': 'قمر', '👟': 'جزمة',
  '🪁': 'طيارة ورق', '🍌': 'موزة', '🌷': 'وردة',
};

let av2Seed = 0;   // one deterministic salt counter for the whole av2 block

// ── VSP.MATCH — identical picture, two routes ───────────────────────────────
[
  { tpl: 'TPL-AR_VSP_MATCH', listen: false },
  { tpl: 'TPL-AR_VSP_MATCH_LISTEN', listen: true },
].forEach(({ tpl, listen }, k) => {
  ['FOUNDATION', 'PRACTICE', 'CHALLENGE'].forEach((tier, j) => {
    const pic = AV2_PICS[(k * 3 + j) % AV2_PICS.length];
    const d = distractors(AV2_PICS, pic, OPTIONS_PER_TIER[tier] - 1, k + j);
    const { options, correct_index } = withOptions(pic, d, av2Seed++);
    items.push(mk({
      item_id: nextId('AR-VSPM'), strand: 'VSP.MATCH', rung: 0, tier,
      template_id: tpl,
      stimulus: pic,
      ...(listen ? { audio_ar: 'اختار الصورة اللي زي دي بالظبط' } : {}),
      prompt: { ar: 'اختار اللي زيها بالظبط', en: 'Pick the one that is exactly the same' },
      options, correct_index,
      hint: { ar: 'قارن الشكل واللون — واحدة واحدة', en: 'Compare the shape and the colour, one at a time' },
      language_light: true,
      paired_modality: listen,
    }));
  });
});

// ── VSP.DIFFERENCE — odd-one-out ────────────────────────────────────────────
// The row IS the option list: the child taps one of the tiles shown. Three
// tiles is the smallest display in which "not like the others" means anything,
// so FOUNDATION (2 options) is deliberately unused here — a tier that would
// ask an unanswerable question is not a difficulty level, it is a bug.
// CHALLENGE adds a fourth tile AND a near pair that differs by one attribute.
[
  { tpl: 'TPL-AR_VSP_DIFFERENCE', listen: false, tier: 'PRACTICE', base: '🚗', odd: '🚲', near: false },
  { tpl: 'TPL-AR_VSP_DIFFERENCE', listen: false, tier: 'CHALLENGE', base: '🍎', odd: '🍏', near: true },
  { tpl: 'TPL-AR_VSP_DIFFERENCE_LISTEN', listen: true, tier: 'PRACTICE', base: '⚽', odd: '🏀', near: false },
  { tpl: 'TPL-AR_VSP_DIFFERENCE_LISTEN', listen: true, tier: 'CHALLENGE', base: '🐘', odd: '🦛', near: true },
].forEach((x, i) => {
  const count = OPTIONS_PER_TIER[x.tier];
  // Never the first slot (that reads as "the odd one is whatever is on the
  // left"), and always inside the row the tier actually shows: 1..count-1.
  const oddAt = (i % (count - 1)) + 1;
  const options = Array.from({ length: count }, (_, t) => (t === oddAt ? x.odd : x.base));
  items.push(mk({
    item_id: nextId('AR-VSPD'), strand: 'VSP.DIFFERENCE', rung: 1, tier: x.tier,
    template_id: x.tpl,
    display: 'TILE_ROW',
    ...(x.listen ? { audio_ar: 'في واحدة مش زي الباقي — دوس عليها' } : {}),
    prompt: { ar: 'دوس على اللي مش زي الباقي', en: 'Tap the one that is not like the others' },
    options, correct_index: oddAt,
    hint: { ar: 'شوف اللي زي بعض الأول، وشوف التالتة مختلفة فين', en: 'Find the ones that match, then see how the other differs' },
    language_light: true,
    near_difference: x.near,
    paired_modality: x.listen,
    _tier_note: 'PRACTICE = 3 tiles from clearly different things; CHALLENGE = 4 tiles, and the odd one differs by a single attribute.',
  }));
});

// ── VSP.SORT — group by kind, or by colour ──────────────────────────────────
// Two different RULES, therefore two different target_skill ids: sorting by
// kind needs a category, sorting by colour needs one perceptual property. The
// tier is how many groups compete, which is the actual load difference.
[
  {
    tpl: 'TPL-AR_VSP_SORT', rule: 'KIND', tier: 'PRACTICE', target: '🦆', correct_group: 0,
    groups: [['🐘', '🦆', '🐟'], ['⚽', '🧸', '🪁'], ['🍎', '🍌', '🥕']],
  },
  {
    tpl: 'TPL-AR_VSP_SORT', rule: 'KIND', tier: 'CHALLENGE', target: '🐘', correct_group: 0,
    groups: [['🐘', '🦆', '🐟'], ['⚽', '🧸', '🪁'], ['🍎', '🍌', '🥕'], ['👟', '🧢', '🧤']],
  },
  {
    tpl: 'TPL-AR_VSP_SORT_COLOR', rule: 'COLOUR', tier: 'PRACTICE', target: '💙', correct_group: 1,
    groups: [['🔴', '🍎', '❤️'], ['🔵', '💙', '🟦'], ['🟢', '💚', '🥒']],
  },
  {
    tpl: 'TPL-AR_VSP_SORT_COLOR', rule: 'COLOUR', tier: 'CHALLENGE', target: '🟡', correct_group: 3,
    groups: [['🔴', '🍎', '❤️'], ['🔵', '💙', '🟦'], ['🟢', '💚', '🥒'], ['🟡', '💛', '⭐']],
  },
].forEach((s, i) => {
  // Rotate which group is shown first so the answer is not always in the same
  // slot, while the option count stays exactly the tier's number.
  const n = s.groups.length;
  const shift = i % n;
  const options = s.groups.map((_, idx) => s.groups[(idx + shift) % n].join(' '));
  items.push(mk({
    item_id: nextId('AR-VSPS'), strand: 'VSP.SORT', rung: 2, tier: s.tier,
    template_id: s.tpl,
    stimulus: s.target,
    display: 'TARGET_AND_GROUPS',
    sort_rule: s.rule,
    prompt: s.rule === 'KIND'
      ? { ar: 'دي بتتجمع مع أنهي مجموعة؟', en: 'Which group does this one belong to?' }
      : { ar: 'دي بنفس لون أنهي مجموعة؟', en: 'Which group is the same colour as this one?' },
    options, correct_index: (s.correct_group + shift) % n,
    hint: s.rule === 'KIND'
      ? { ar: 'فكّر دي من نوع إيه', en: 'Think about what kind of thing it is' }
      : { ar: 'بصّ على اللون بس', en: 'Look at the colour only' },
    language_light: true,
    _why: 'C7 — grouping by a property sits underneath early number comparison; measured here with no number in the item at all.',
  }));
});

// ── VSP.PATTERN — extend the repeat, no numerals ────────────────────────────
// Two of these are generated on TPL-AR_PATTERN, the NUM.PATTERN format
// re-hosted under the visual ladder exactly as av2 §2 asks. Every item here
// carries its own `target_skill` so a visual pattern can never be rolled up
// with the numeric one: the FORMAT is shared, the skill view is not.
[
  { tpl: 'TPL-AR_VSP_PATTERN', tier: 'PRACTICE', seq: ['🔴', '🔵', '🔴', '🔵'], next: '🔴', d: ['🟡', '🟢'] },
  { tpl: 'TPL-AR_VSP_PATTERN', tier: 'CHALLENGE', seq: ['🍎', '🍎', '🌸', '🍎', '🍎', '🌸', '🍎'], next: '🍎', d: ['🌸', '🌷', '🍏'] },
  { tpl: 'TPL-AR_PATTERN', rehosted: true, tier: 'PRACTICE', seq: ['🚗', '⚽', '🚗', '⚽', '🚗'], next: '⚽', d: ['🚗', '🧸'] },
  { tpl: 'TPL-AR_PATTERN', rehosted: true, tier: 'CHALLENGE', seq: ['🟩', '🟨', '🟥', '🟩', '🟨', '🟥', '🟩', '🟨'], next: '🟥', d: ['🟨', '🟦', '🟩'] },
].forEach((p, i) => {
  const d = p.d.filter((x) => x !== p.next).slice(0, OPTIONS_PER_TIER[p.tier] - 1);
  const { options, correct_index } = withOptions(p.next, d, av2Seed++);
  items.push(mk({
    item_id: nextId('AR-VSPP'), strand: 'VSP.PATTERN', rung: 3, tier: p.tier,
    template_id: p.tpl,
    target_skill: 'vsp-pattern-extend',   // wins over the numeric id on the re-hosted format
    stimulus: p.seq.join(' '),
    pattern_domain: 'VISUAL_ONLY',
    prompt: { ar: 'إيه اللي جاي بعد كده؟', en: 'What comes next?' },
    options, correct_index,
    hint: { ar: 'شوف الشكل اللي بيتكرر إزاي', en: 'See how the shape repeats' },
    language_light: true,
    ...(p.rehosted
      ? { _why: 'av2 §2 — the NUM.PATTERN format re-hosted under the visual ladder: no numerals, no counting, and its own target_skill, so a score here never moves NUM.PATTERN.' }
      : {}),
  }));
});

// ── MEM.VISUAL_STM — what disappeared? ──────────────────────────────────────
// Three tiles are shown, one is removed in place, and the child picks what is
// gone: from the SAME three at PRACTICE, or from three plus a tile that was
// never there at CHALLENGE. That extra option is the whole tier difference — it
// turns "which one is missing" into "which one is missing AND which one is
// new", which is a real working-memory demand rather than a longer word.
[
  { tpl: 'TPL-AR_MEM_DISAPPEARED', listen: false, tier: 'PRACTICE', tiles: ['🐘', '🦆', '🍎'], gone: '🍎', foil: '🚗' },
  { tpl: 'TPL-AR_MEM_DISAPPEARED', listen: false, tier: 'CHALLENGE', tiles: ['🚗', '⚽', '🌸'], gone: '⚽', foil: '🐟' },
  { tpl: 'TPL-AR_MEM_DISAPPEARED_LISTEN', listen: true, tier: 'PRACTICE', tiles: ['🧸', '🐟', '🦆'], gone: '🧸', foil: '🌸' },
  { tpl: 'TPL-AR_MEM_DISAPPEARED_LISTEN', listen: true, tier: 'CHALLENGE', tiles: ['🍎', '🚗', '🐘'], gone: '🐘', foil: '⚽' },
].forEach((x, i) => {
  const others = x.tiles.filter((t) => t !== x.gone);
  const pool = x.tier === 'CHALLENGE' ? [...others, x.foil] : others;
  const { options, correct_index } = withOptions(x.gone, pool, av2Seed++);
  items.push(mk({
    item_id: nextId('AR-MEMV'), strand: 'MEM.VISUAL_STM', rung: 0, tier: x.tier,
    template_id: x.tpl,
    set_size: x.tiles.length,
    tiles_shown: [...x.tiles],
    display_after: x.tiles.map((t) => (t === x.gone ? '⬜' : t)).join(' '),
    stimulus: x.tiles.join(' '),
    disappeared: x.gone,
    ...(x.listen ? { audio_ar: 'إيه اللي اختفت من الصور؟' } : {}),
    prompt: { ar: 'إيه اللي اختفت؟', en: 'What disappeared?' },
    options, correct_index,
    hint: { ar: 'افتكر الصور كانت إيه في الأول', en: 'Remember what the pictures were at the start' },
    language_light: true,
    paired_modality: x.listen,
    _why: 'C8 — the same short-delay comparison that sits underneath subitizing, with no quantity judgement inside it.',
  }));
});

// ── MEM.SEQUENCE — two steps, shown AND spoken ──────────────────────────────
// The answer is an ORDER (`correct_order`), never a single index. Tier = how
// many other tiles compete for the two taps.
[
  { tpl: 'TPL-AR_MEM_SEQUENCE', audio_led: false, tier: 'PRACTICE', steps: ['🐶', '🌙'], pool: ['🍎', '🚗'] },
  { tpl: 'TPL-AR_MEM_SEQUENCE', audio_led: false, tier: 'CHALLENGE', steps: ['🦆', '⚽'], pool: ['🧸', '👟'] },
  { tpl: 'TPL-AR_MEM_SEQUENCE_LISTEN', audio_led: true, tier: 'PRACTICE', steps: ['🌸', '🐘'], pool: ['🐟', '🍌'] },
  { tpl: 'TPL-AR_MEM_SEQUENCE_LISTEN', audio_led: true, tier: 'CHALLENGE', steps: ['🚗', '🧸'], pool: ['🦆', '🌙'] },
].forEach((x) => {
  const foils = x.tier === 'CHALLENGE' ? x.pool : x.pool.slice(0, 1);
  const options = [...x.steps, ...foils];
  const instruction = `دوس ${x.steps[0]} الأول وبعدين ${x.steps[1]}`;
  items.push(mk({
    item_id: nextId('AR-MEMS'), strand: 'MEM.SEQUENCE', rung: 1, tier: x.tier,
    template_id: x.tpl,
    steps: x.steps.length,
    stimulus: x.steps.join('  →  '),
    audio_ar: instruction,
    audio_led: x.audio_led,
    prompt: { ar: instruction, en: `Tap ${AV2_NAME_AR[x.steps[0]] ?? x.steps[0]} first, then ${AV2_NAME_AR[x.steps[1]] ?? x.steps[1]}` },
    options, correct_order: [...x.steps],
    hint: { ar: 'لو نسيان، هتشوفهم وتسمعهم تاني', en: 'If you forget, you will see and hear them again' },
    language_light: true,
    paired_modality: true,     // shown + spoken is this strand's baseline (av2 §2 domain F)
    _note_vs_listening: 'LIT.LISTEN_INSTRUCTION scores following words; this scores holding the order after the sentence is gone. Separate strands, separate indicators, neither reads the other.',
  }));
});

// ── MEM.MEDIAL — which came first? ──────────────────────────────────────────
// Two tiles appear one AFTER the other (never a static row, which would turn
// the item into a matching item), and the child names the first or the last.
// PRACTICE adds a tile that was never shown at all.
[
  { tpl: 'TPL-AR_MEM_MEDIAL_FIRST', term: 'FIRST', tier: 'FOUNDATION', first: '🧸', second: '🚗', foil: '🐘' },
  { tpl: 'TPL-AR_MEM_MEDIAL_FIRST', term: 'FIRST', tier: 'PRACTICE', first: '🦆', second: '🍎', foil: '⚽' },
  { tpl: 'TPL-AR_MEM_MEDIAL_LAST', term: 'LAST', tier: 'FOUNDATION', first: '🌸', second: '🐟', foil: '🧸' },
  { tpl: 'TPL-AR_MEM_MEDIAL_LAST', term: 'LAST', tier: 'PRACTICE', first: '🐘', second: '👟', foil: '🌙' },
].forEach((x) => {
  const answer = x.term === 'FIRST' ? x.first : x.second;
  const shown = [x.first, x.second];
  const pool = x.tier === 'PRACTICE' ? [...shown, x.foil] : [...shown];
  const { options, correct_index } = withOptions(answer, pool.filter((t) => t !== answer), av2Seed++);
  items.push(mk({
    item_id: nextId('AR-MEMF'), strand: 'MEM.MEDIAL', rung: 2, tier: x.tier,
    template_id: x.tpl,
    sequence_shown: shown,
    stimulus: `${x.first}  وبعدين  ${x.second}`,
    temporal_term: x.term,
    prompt: x.term === 'FIRST'
      ? { ar: 'إيه اللي جه الأول؟', en: 'Which one came first?' }
      : { ar: 'إيه اللي جه الآخر؟', en: 'Which one came last?' },
    options, correct_index,
    hint: x.term === 'FIRST'
      ? { ar: 'أول حاجة ظهرت قدامك', en: 'The first thing that appeared' }
      : { ar: 'آخر حاجة ظهرت قدامك', en: 'The last thing that appeared' },
    language_light: true,
    _render_note: 'The two tiles appear one after the other in sequence_shown order — a static row would make this a matching item, not a memory item.',
    ...(x.term === 'LAST'
      ? { _language_note: 'E8 — "last / before / after" wording is itself the relational difficulty, so FIRST and LAST get separate target_skill ids and are never averaged.' }
      : {}),
  }));
});

// ── COMM.EXPRESS_CHOICE — make a choice known ───────────────────────────────
// There is deliberately NO correct tile on a choice board: whatever the child
// selects, confirmed by the helper, IS the response. The answer key is "one
// confirmed selection" (`expected_taps: 1`). The tier changes only how many
// choices compete — which is the real load for a child who has to find and hold
// a preference while an adult controls the interface.
/** What the board asks, by tier — preference questions, never a demand for speech. */
const COMM_CHOICE_ASK = {
  FOUNDATION: { ar: 'عايز تلعب بإيه؟ دوس عليه', en: 'What do you want to play with? Tap it' },
  PRACTICE: { ar: 'عايز تاكل إيه؟ اختار بالإيد أو بالصوت', en: 'What do you want to eat? Choose by hand or by sound' },
  CHALLENGE: { ar: 'اختار حاجة انت بتحبها — دوس عليها', en: 'Pick something you like — tap it' },
};
const COMM_BOARD_BY_TIER = {
  FOUNDATION: [['🧸', '🍎'], ['⚽', '🦆']],
  PRACTICE: [['🌸', '🐘', '🚗'], ['🐟', '👟', '⚽']],
  CHALLENGE: [['🍎', '🧸', '🌸', '🚗'], ['🦆', '🐘', '🍌', '🧸']],
};
[
  { tpl: 'TPL-AR_COMM_CHOICE', listen: false },
  { tpl: 'TPL-AR_COMM_CHOICE_LISTEN', listen: true },
].forEach(({ tpl, listen }, k) => {
  ['FOUNDATION', 'PRACTICE', 'CHALLENGE'].forEach((tier) => {
    const board = COMM_BOARD_BY_TIER[tier][k];
    items.push(mk({
      item_id: nextId('AR-CMEC'), strand: 'COMM.EXPRESS_CHOICE', rung: 0, tier,
      template_id: tpl,
      display: 'CHOICE_BOARD',
      options: [...board],
      expected_taps: 1,
      accepts_any_output: true,
      // A tap on the board is scored on its own — no adult confirmation step is
      // REQUIRED for the response to count. `helper_confirm: false` says that;
      // the any-vocal channel stays in `response_modes` for a child who does
      // not tap, and when it is used the helper confirms it and it scores the
      // same way (spec §2 domain A: opportunity to respond, not a gate).
      helper_confirm: false,
      any_response_is_success: true,
      vocal_required: false,
      response_modes: ['tap', 'point', 'gaze_adjacent_point', 'any_vocal_helper_confirmed', 'aac_press'],
      ...(listen ? { audio_ar: COMM_CHOICE_ASK[tier].ar } : {}),
      prompt: COMM_CHOICE_ASK[tier],
      hint: { ar: 'خُد وقتك — أي حاجة تختارها تنفع', en: 'Take your time — anything you pick is fine' },
      language_light: true,
      paired_modality: listen,
      _scoring_note: 'av2 §2 anti-rule: no tile is correct. A helper-confirmed choice by point, look, sound or press IS the demonstration, and the engine records the CHANNEL, never the preference.',
      _tier_note: 'Only the number of competing choices changes across tiers — 2, then 3, then 4.',
    }));
  });
});

// ── COMM.LABEL — name it, any way you can ───────────────────────────────────
// `accepts_any_output` + `helper_confirm` are the PRIMARY route: a word, a
// vocal attempt, a sign or an AAC press all count as the same success. The
// picture row is the EQUAL tap fallback for a child who does not speak — not a
// vocabulary test and never a prerequisite for a result — and its length is
// what makes a tier harder.
[
  { tpl: 'TPL-AR_COMM_LABEL', audio_led: false },
  { tpl: 'TPL-AR_COMM_LABEL_POINT', audio_led: true },
].forEach(({ tpl, audio_led }, k) => {
  ['FOUNDATION', 'PRACTICE', 'CHALLENGE'].forEach((tier, j) => {
    const pic = AV2_PICS[(k * 3 + j) % AV2_PICS.length];
    const name = AV2_NAME_AR[pic];
    const d = distractors(AV2_PICS, pic, OPTIONS_PER_TIER[tier] - 1, k + j + 5);
    const { options, correct_index } = withOptions(pic, d, av2Seed++);
    items.push(mk({
      item_id: nextId('AR-CMLB'), strand: 'COMM.LABEL', rung: 1, tier,
      template_id: tpl,
      stimulus: pic,
      expected_word_ar: name,
      accepts_any_output: true,
      helper_confirm: true,
      any_response_is_success: true,
      vocal_required: false,
      never_vocal_required: true,
      response_modes: ['any_vocal_helper_confirmed', 'vocal_attempt', 'sign', 'aac_press', 'point', 'tap'],
      ...(audio_led ? { audio_ar: `دي ${name} — وريني فين ${name}` } : {}),
      prompt: audio_led
        ? { ar: `وريني فين ${name}`, en: `Show me the ${name}` }
        : { ar: 'دي إيه؟ قولها، أو أشر على صورتها', en: 'What is this? Say it, or point to its picture' },
      options, correct_index,
      hint: { ar: 'مفيش غلط — أي صوت أو إشارة أو ضغطة تكفي', en: 'Nothing is wrong — any sound, sign or tap is enough' },
      language_light: true,
      paired_modality: audio_led,
      _scoring_note: 'A helper-confirmed vocal attempt is scored exactly like the matching tap (matrix D9, av2 §2 anti-rule). A child who does not speak gets the same result from the same item.',
    }));
  });
});

// ── av2 §1 — every item carries the stable id of the SKILL it targets ──────
// Derived from the template, so a regenerated or re-tiered item cannot drift
// away from the skill its format was reviewed against; `??=` keeps any id an
// item set for itself (the VSP.PATTERN items re-hosted on TPL-AR_PATTERN do
// exactly that, so a visual pattern is never rolled up with the numeric one).
// It is a label used to group observations, never a score and never a diagnosis.
for (const it of items) it.target_skill ??= TARGET_SKILL_BY_TEMPLATE[it.template_id] ?? null;

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
