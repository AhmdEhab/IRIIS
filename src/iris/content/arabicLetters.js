/**
 * IRIS — Arabic letter reference data (Phase 5).
 *
 * Content is DATA. No pedagogy and no branching lives in this file.
 *
 * ── WHY THIS FILE EXISTS SEPARATELY ───────────────────────────────────────
 * An Arabic letter is not one glyph. It has up to four written forms, it may
 * share its skeleton with two other letters and differ only in dots, and its
 * MSA sound may not be the sound the child says at home. Those three facts
 * are properties of the LETTER, not of any one item, so they live here and
 * every item that uses the letter inherits them. That way a new item cannot
 * accidentally ship without its dialect tag or its form set.
 *
 * ── PROVENANCE OF EACH FIELD ──────────────────────────────────────────────
 *  `forms`          — orthographic fact about the Arabic script.
 *  `dot_set`        — orthographic fact (which letters share a skeleton).
 *  `name_ar`        — the letter's conventional name.
 *  `sound_hint_ar`  — a child-facing pronunciation cue in Egyptian Arabic.
 *  `dialect`        — ⚠ PROVISIONAL. See DIALECT_DISTANCE in ladders/literacy.js.
 *                     Descriptive Cairene phonology, NOT validated developmental
 *                     data. Annotation only; never alters a score.
 */
import { dialectDistanceFor } from '../ladders/literacy.js';

/**
 * The 28 letters.
 *
 * `forms` is [isolated, initial, medial, final]. Six letters (ا د ذ ر ز و)
 * do not connect to the following letter, so their initial and medial forms
 * are the same shape as the isolated and final ones — that is a real property
 * of the script, not missing data, and it is marked with `non_connecting`.
 */
export const ARABIC_LETTERS = [
  { letter: 'ا', name_ar: 'ألف', forms: ['ا', 'ا', 'ـا', 'ـا'], non_connecting: true, sound_hint_ar: 'أَ' },
  { letter: 'ب', name_ar: 'باء', forms: ['ب', 'بـ', 'ـبـ', 'ـب'], dot_set: 'DOT-BTTH', sound_hint_ar: 'بـ' },
  { letter: 'ت', name_ar: 'تاء', forms: ['ت', 'تـ', 'ـتـ', 'ـت'], dot_set: 'DOT-BTTH', sound_hint_ar: 'تـ' },
  { letter: 'ث', name_ar: 'ثاء', forms: ['ث', 'ثـ', 'ـثـ', 'ـث'], dot_set: 'DOT-BTTH', sound_hint_ar: 'ثـ' },
  { letter: 'ج', name_ar: 'جيم', forms: ['ج', 'جـ', 'ـجـ', 'ـج'], dot_set: 'DOT-JHKH', sound_hint_ar: 'جـ' },
  { letter: 'ح', name_ar: 'حاء', forms: ['ح', 'حـ', 'ـحـ', 'ـح'], dot_set: 'DOT-JHKH', sound_hint_ar: 'حـ' },
  { letter: 'خ', name_ar: 'خاء', forms: ['خ', 'خـ', 'ـخـ', 'ـخ'], dot_set: 'DOT-JHKH', sound_hint_ar: 'خـ' },
  { letter: 'د', name_ar: 'دال', forms: ['د', 'د', 'ـد', 'ـد'], non_connecting: true, dot_set: 'DOT-DDH', sound_hint_ar: 'دَ' },
  { letter: 'ذ', name_ar: 'ذال', forms: ['ذ', 'ذ', 'ـذ', 'ـذ'], non_connecting: true, dot_set: 'DOT-DDH', sound_hint_ar: 'ذَ' },
  { letter: 'ر', name_ar: 'راء', forms: ['ر', 'ر', 'ـر', 'ـر'], non_connecting: true, dot_set: 'DOT-RZ', sound_hint_ar: 'رَ' },
  { letter: 'ز', name_ar: 'زاي', forms: ['ز', 'ز', 'ـز', 'ـز'], non_connecting: true, dot_set: 'DOT-RZ', sound_hint_ar: 'زَ' },
  { letter: 'س', name_ar: 'سين', forms: ['س', 'سـ', 'ـسـ', 'ـس'], dot_set: 'DOT-SSH', sound_hint_ar: 'سـ' },
  { letter: 'ش', name_ar: 'شين', forms: ['ش', 'شـ', 'ـشـ', 'ـش'], dot_set: 'DOT-SSH', sound_hint_ar: 'شـ' },
  { letter: 'ص', name_ar: 'صاد', forms: ['ص', 'صـ', 'ـصـ', 'ـص'], dot_set: 'DOT-SD', sound_hint_ar: 'صـ' },
  { letter: 'ض', name_ar: 'ضاد', forms: ['ض', 'ضـ', 'ـضـ', 'ـض'], dot_set: 'DOT-SD', sound_hint_ar: 'ضـ' },
  { letter: 'ط', name_ar: 'طاء', forms: ['ط', 'طـ', 'ـطـ', 'ـط'], dot_set: 'DOT-TZ', sound_hint_ar: 'طـ' },
  { letter: 'ظ', name_ar: 'ظاء', forms: ['ظ', 'ظـ', 'ـظـ', 'ـظ'], dot_set: 'DOT-TZ', sound_hint_ar: 'ظـ' },
  { letter: 'ع', name_ar: 'عين', forms: ['ع', 'عـ', 'ـعـ', 'ـع'], dot_set: 'DOT-AGH', sound_hint_ar: 'عـ' },
  { letter: 'غ', name_ar: 'غين', forms: ['غ', 'غـ', 'ـغـ', 'ـغ'], dot_set: 'DOT-AGH', sound_hint_ar: 'غـ' },
  { letter: 'ف', name_ar: 'فاء', forms: ['ف', 'فـ', 'ـفـ', 'ـف'], dot_set: 'DOT-FQ', sound_hint_ar: 'فـ' },
  { letter: 'ق', name_ar: 'قاف', forms: ['ق', 'قـ', 'ـقـ', 'ـق'], dot_set: 'DOT-FQ', sound_hint_ar: 'قـ' },
  { letter: 'ك', name_ar: 'كاف', forms: ['ك', 'كـ', 'ـكـ', 'ـك'], sound_hint_ar: 'كـ' },
  { letter: 'ل', name_ar: 'لام', forms: ['ل', 'لـ', 'ـلـ', 'ـل'], sound_hint_ar: 'لـ' },
  { letter: 'م', name_ar: 'ميم', forms: ['م', 'مـ', 'ـمـ', 'ـم'], sound_hint_ar: 'مـ' },
  { letter: 'ن', name_ar: 'نون', forms: ['ن', 'نـ', 'ـنـ', 'ـن'], sound_hint_ar: 'نـ' },
  { letter: 'ه', name_ar: 'هاء', forms: ['ه', 'هـ', 'ـهـ', 'ـه'], sound_hint_ar: 'هـ' },
  { letter: 'و', name_ar: 'واو', forms: ['و', 'و', 'ـو', 'ـو'], non_connecting: true, sound_hint_ar: 'وَ' },
  { letter: 'ي', name_ar: 'ياء', forms: ['ي', 'يـ', 'ـيـ', 'ـي'], sound_hint_ar: 'يـ' },
].map((l) => ({ ...l, dialect: dialectDistanceFor(l.letter) }));

export const LETTER_BY_CHAR = Object.fromEntries(ARABIC_LETTERS.map((l) => [l.letter, l]));

export const FORM_INDEX = { ISOLATED: 0, INITIAL: 1, MEDIAL: 2, FINAL: 3 };

export const formOf = (letter, form) => LETTER_BY_CHAR[letter]?.forms[FORM_INDEX[form]] ?? letter;

/** Letters that share a skeleton with the given one (the dot-confusion set). */
export function dotSiblings(letter) {
  const set = LETTER_BY_CHAR[letter]?.dot_set;
  if (!set) return [];
  return ARABIC_LETTERS.filter((l) => l.dot_set === set && l.letter !== letter).map((l) => l.letter);
}

/**
 * Eastern Arabic numerals, as used in Egyptian schooling.
 * Western digits are given only so item ids and counts stay readable in code.
 */
export const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const toArabicNumeral = (n) => String(n).split('').map((d) => ARABIC_NUMERALS[Number(d)] ?? d).join('');

/**
 * Vowelised (mushakkal) target words.
 *
 * All literacy target content is fully vowelised — matrix B9 (48% of Egyptian
 * reading errors in the retrieved study were short-vowel/diacritic errors) and
 * B10 (the Egypt national EGRA diacritised all stimulus text). Unvowelised
 * reading is out of scope for this phase.
 *
 * `syllables` is the count used by the syllable-awareness task.
 * `sounds` is the phoneme sequence used by blending and segmentation.
 */
export const TARGET_WORDS = [
  { word: 'بَاب', gloss_en: 'door', emoji: '🚪', syllables: 1, sounds: ['ب', 'ا', 'ب'], theme: 'home' },
  { word: 'بَيْت', gloss_en: 'house', emoji: '🏠', syllables: 1, sounds: ['ب', 'ي', 'ت'], theme: 'home' },
  { word: 'قَلَم', gloss_en: 'pen', emoji: '✏️', syllables: 2, sounds: ['ق', 'ل', 'م'], theme: 'school' },
  { word: 'كِتَاب', gloss_en: 'book', emoji: '📕', syllables: 2, sounds: ['ك', 'ت', 'ا', 'ب'], theme: 'school' },
  { word: 'شَمْس', gloss_en: 'sun', emoji: '☀️', syllables: 1, sounds: ['ش', 'م', 'س'], theme: 'nature' },
  { word: 'قَمَر', gloss_en: 'moon', emoji: '🌙', syllables: 2, sounds: ['ق', 'م', 'ر'], theme: 'nature' },
  { word: 'سَمَك', gloss_en: 'fish', emoji: '🐟', syllables: 2, sounds: ['س', 'م', 'ك'], theme: 'animals' },
  { word: 'قِطَّة', gloss_en: 'cat', emoji: '🐈', syllables: 2, sounds: ['ق', 'ط', 'ة'], theme: 'animals' },
  { word: 'وَلَد', gloss_en: 'boy', emoji: '👦', syllables: 2, sounds: ['و', 'ل', 'د'], theme: 'people' },
  { word: 'بِنْت', gloss_en: 'girl', emoji: '👧', syllables: 1, sounds: ['ب', 'ن', 'ت'], theme: 'people' },
  { word: 'مَوْز', gloss_en: 'banana', emoji: '🍌', syllables: 1, sounds: ['م', 'و', 'ز'], theme: 'food' },
  { word: 'تُفَّاح', gloss_en: 'apple', emoji: '🍎', syllables: 2, sounds: ['ت', 'ف', 'ا', 'ح'], theme: 'food' },
  { word: 'مَدْرَسَة', gloss_en: 'school', emoji: '🏫', syllables: 3, sounds: ['م', 'د', 'ر', 'س', 'ة'], theme: 'school' },
  { word: 'زَهْرَة', gloss_en: 'flower', emoji: '🌸', syllables: 2, sounds: ['ز', 'ه', 'ر', 'ة'], theme: 'nature' },
];

export const WORD_BY_TEXT = Object.fromEntries(TARGET_WORDS.map((w) => [w.word, w]));

/** Rhyming pairs — vowelised, sharing a final rime. */
export const RHYME_PAIRS = [
  { a: 'قَلَم', b: 'عَلَم', distractor: 'بَاب', gloss_en: 'pen / flag' },
  { a: 'بَيْت', b: 'زَيْت', distractor: 'شَمْس', gloss_en: 'house / oil' },
  { a: 'نَار', b: 'دَار', distractor: 'قَمَر', gloss_en: 'fire / house' },
  { a: 'سَمَك', b: 'مَلَك', distractor: 'كِتَاب', gloss_en: 'fish / angel' },
];

/** Everyday signs and labels for the functional-reading strand. */
export const FUNCTIONAL_WORDS = [
  { word: 'خُرُوج', gloss_en: 'exit', emoji: '🚪' },
  { word: 'قِف', gloss_en: 'stop', emoji: '🛑' },
  { word: 'مَاء', gloss_en: 'water', emoji: '💧' },
  { word: 'خَطَر', gloss_en: 'danger', emoji: '⚠️' },
  { word: 'مُسْتَشْفَى', gloss_en: 'hospital', emoji: '🏥' },
];

/** Egyptian coin/note denominations, for the functional-maths strand. */
export const EGP_DENOMINATIONS = [1, 5, 10, 20];
