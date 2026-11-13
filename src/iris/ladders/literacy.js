/**
 * IRIS — Arabic literacy ladder (Phase 5).
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  THIS IS AN ARABIC LADDER, NOT A TRANSLATED ENGLISH ONE.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * The differences are structural, not lexical. Four of them:
 *
 *  1. POSITIONAL FORMS. An Arabic letter has up to four written shapes
 *     depending on where it sits in the word. Knowing ب in isolation is not
 *     the same skill as recognising ـبـ inside one. The Egypt national EGRA
 *     (matrix B10) deliberately mixed all four forms in its letter-sound task;
 *     this ladder does the same, and makes cross-form matching its own item
 *     type at L1.
 *
 *  2. DOT CONTRASTS. Whole sets of Arabic letters share one skeleton and are
 *     distinguished only by dots (ب ت ث). Ghandour et al. (B2) showed this is
 *     a specific, trainable bottleneck. Dot confusions therefore get their own
 *     item category and their own error code — never a generic "wrong letter".
 *
 *  3. DIGLOSSIA. Children here speak Egyptian Arabic and must learn to read
 *     Modern Standard Arabic. Saiegh-Haddad (B5) showed phonemes that exist
 *     ONLY in MSA are significantly harder to isolate (F = 17.76, p < .001),
 *     before any reading instruction. Every phonological item therefore
 *     carries a dialect-distance tag, and a failure on an MSA-only phoneme is
 *     reported as dialect distance — never as phonological weakness.
 *     ⚠ See DIALECT_DISTANCE below for what is and is not evidenced here.
 *
 *  4. LANGUAGE SPLIT. Egyptian Arabic for instructions and encouragement;
 *     vowelised MSA for the literacy targets themselves (B10). Dialect
 *     spelling of literacy targets would teach the wrong orthography.
 *
 * ── PARALLEL STRANDS ──────────────────────────────────────────────────────
 * Strands sharing a `rung` are parallel and neither gates the other:
 *   rung 2  letter NAMES  ‖  letter SOUNDS (two directions)
 *           Roberts et al. (A4): no main effect of instructional order, and
 *           teaching names first "may actually have interfered with" sounds.
 *   Listening comprehension runs on its OWN TRACK at every rung, because its
 *           share of reading-comprehension variance rises from 9% to 36%
 *           between grades 2 and 8 (A7). Putting it at the top of the ladder
 *           would hide it in exactly the children who have it.
 */
import { VALIDATION, SPECIALIST_REVIEW } from '../spec.js';

/**
 * The four positional forms. Item ids and error codes reference these.
 * Research: B1, B3, B10.
 */
export const LETTER_FORMS = ['ISOLATED', 'INITIAL', 'MEDIAL', 'FINAL'];

/**
 * Dot-contrast confusion sets — letters sharing a skeleton, separated only by
 * the number or position of dots. Research: B2 (preprint, flagged), B9.
 *
 * These are orthographic facts about the Arabic script, not findings about
 * children, so they are RESEARCH_SUPPORTED as a description of the writing
 * system. Which pairs are hardest for Egyptian children is NOT known.
 */
export const DOT_CONTRAST_SETS = [
  { id: 'DOT-BTTH', letters: ['ب', 'ت', 'ث'], skeleton: 'ٮ' },
  { id: 'DOT-JHKH', letters: ['ج', 'ح', 'خ'], skeleton: 'ح' },
  { id: 'DOT-DDH', letters: ['د', 'ذ'], skeleton: 'د' },
  { id: 'DOT-RZ', letters: ['ر', 'ز'], skeleton: 'ر' },
  { id: 'DOT-SSH', letters: ['س', 'ش'], skeleton: 'س' },
  { id: 'DOT-SD', letters: ['ص', 'ض'], skeleton: 'ص' },
  { id: 'DOT-TZ', letters: ['ط', 'ظ'], skeleton: 'ط' },
  { id: 'DOT-AGH', letters: ['ع', 'غ'], skeleton: 'ع' },
  { id: 'DOT-FQ', letters: ['ف', 'ق'], skeleton: 'ڡ' },
];

export const DOT_CONTRAST_LETTERS = new Set(DOT_CONTRAST_SETS.flatMap((s) => s.letters));

/**
 * ⚠⚠ DIALECT DISTANCE — READ THIS BEFORE TRUSTING THE TAG ⚠⚠
 *
 * WHAT IS EVIDENCED:
 *   Saiegh-Haddad (matrix B5) demonstrated, in Palestinian-dialect children,
 *   that phonemes present in Standard Arabic but absent from the child's
 *   spoken dialect are significantly harder to isolate — before formal reading
 *   instruction — and that this predicts early decoding difficulty. The
 *   PHENOMENON is real and is why this tag exists.
 *
 * WHAT IS NOT EVIDENCED:
 *   The list below. Bergstrand Othman (B6) warns explicitly that MSA-dialect
 *   distance varies by region and that one dialect's parameters must not be
 *   imported into another. NO EGYPTIAN CHILD DEVELOPMENTAL DATA WAS FOUND.
 *
 *   The entries below are standard descriptive facts about Cairene Arabic
 *   phonology — that ق is commonly realised as a glottal stop, ث/ذ/ظ commonly
 *   merge toward stops or sibilants, and ج is realised as /g/. Those are
 *   linguistic facts. Whether they produce Saiegh-Haddad's effect in Egyptian
 *   children at these ages HAS NOT BEEN TESTED, by anyone, as far as this
 *   project's literature search could establish.
 *
 * THEREFORE:
 *   - status is SPECIALIST_REVIEW_REQUIRED, not RESEARCH_SUPPORTED.
 *   - The tag is ANNOTATION-ONLY. It never lowers an indicator and never
 *     raises one. It attaches a caveat to a number so a parent and a
 *     specialist can see WHY a phonological score may understate the child.
 *   - An Egyptian speech-language specialist must review this list before any
 *     claim is made from it. It must not be extended by guesswork.
 */
export const DIALECT_DISTANCE = {
  _validation: VALIDATION.SPECIALIST_REVIEW_REQUIRED,
  _specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  _source: 'matrix B5 (phenomenon) + B6 (warning against importing parameters)',
  _note_en:
    'Provisional. Descriptive Cairene phonology, NOT validated developmental data for Egyptian children. Annotation only — never alters a score.',
  _note_ar:
    'قائمة أوّلية. مبنية على وصف لهجي للعامية المصرية، وليست بيانات تطوّرية مُتحقَّق منها. تُستخدم للتنويه فقط ولا تغيّر أي درجة.',

  /** Letters whose MSA phoneme commonly differs from the Egyptian realisation. */
  MSA_ONLY: ['ث', 'ذ', 'ظ', 'ق'],

  /** Letters realised differently but with a phoneme the child already has. */
  SHIFTED: ['ج'],
};

/**
 * Classify a phonological item by dialect distance.
 * Returns 'MSA_ONLY' | 'SHIFTED' | 'SHARED' | 'UNKNOWN'.
 *
 * 'UNKNOWN' is returned when no letter is supplied — the honest answer when
 * there is nothing to classify. It suppresses the caveat rather than guessing.
 */
export function dialectDistanceFor(letter) {
  if (!letter) return 'UNKNOWN';
  if (DIALECT_DISTANCE.MSA_ONLY.includes(letter)) return 'MSA_ONLY';
  if (DIALECT_DISTANCE.SHIFTED.includes(letter)) return 'SHIFTED';
  return 'SHARED';
}

/** True when the item's result should carry a dialect-distance caveat. */
export const carriesDialectCaveat = (tag) => tag === 'MSA_ONLY';

const strand = (o) => ({
  ladder: 'LITERACY',
  track: 'MAIN',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  ...o,
});

/**
 * The ladder.
 *
 * `rung` is a DIFFICULTY INDEX, not a grade and not an age. Two strands with
 * the same rung are parallel. Gaps in the numbering are legal.
 */
export const LITERACY_STRANDS = [
  // ── L0 ───────────────────────────────────────────────────────────────────
  strand({
    id: 'LIT.READINESS',
    code: 'L0',
    rung: 0,
    nameAr: 'الاستعداد للقراءة',
    nameEn: 'Pre-literacy readiness',
    descAr: 'الانتباه البصري، مطابقة الصور والرموز المتطابقة، تنفيذ تعليمة بسيطة',
    descEn: 'Visual attention, matching identical pictures and symbols, following a one-step instruction',
    templates: ['TPL-AR_MATCH_IDENTICAL'],
    research: ['A1'],
    reuses_sub_measure: 'VSP.MATCHING',
  }),

  // ── L1 ───────────────────────────────────────────────────────────────────
  strand({
    id: 'LIT.LETTER_AWARE',
    code: 'L1',
    rung: 1,
    nameAr: 'الوعي بالحروف',
    nameEn: 'Letter awareness',
    descAr: 'التمييز بين الحرف وغير الحرف، ومطابقة الحروف المتطابقة',
    descEn: 'Telling a letter from a non-letter, and matching identical letters',
    templates: ['TPL-AR_LETTER_MATCH'],
    research: ['A1', 'B1', 'B3'],
  }),
  strand({
    id: 'LIT.LETTER_FORMS',
    code: 'L1f',
    rung: 1, // parallel with LETTER_AWARE — Arabic-specific, see header note 1
    nameAr: 'أشكال الحرف حسب موضعه',
    nameEn: 'Positional letter forms',
    descAr: 'التعرّف على الحرف نفسه في أول الكلمة ووسطها وآخرها',
    descEn: 'Recognising the same letter in initial, medial and final position',
    templates: ['TPL-AR_FORM_MATCH'],
    research: ['B1', 'B3', 'B10'],
    arabic_specific: true,
  }),
  strand({
    id: 'LIT.DOT_CONTRAST',
    code: 'L1d',
    rung: 1, // parallel — the dot bottleneck (B2)
    nameAr: 'التمييز بالنقاط',
    nameEn: 'Dot-contrast discrimination',
    descAr: 'التفريق بين الحروف المتشابهة في الرسم والمختلفة في النقط',
    descEn: 'Telling apart letters that share a shape and differ only in dots',
    templates: ['TPL-AR_DOT_CONTRAST'],
    research: ['B2', 'B9'],
    arabic_specific: true,
  }),

  // ── L2 / L3 — PARALLEL. See header note on A4. ───────────────────────────
  strand({
    id: 'LIT.LETTER_NAME',
    code: 'L2',
    rung: 2,
    nameAr: 'أسماء الحروف',
    nameEn: 'Letter names',
    descAr: 'التعرّف على الحرف من اسمه',
    descEn: 'Identifying a letter from its name',
    templates: ['TPL-AR_LETTER_NAME'],
    research: ['A4', 'A5'],
  }),
  strand({
    id: 'LIT.SOUND_TO_LETTER',
    code: 'L3s',
    rung: 2, // PARALLEL with LETTER_NAME, not after it — A4
    nameAr: 'من الصوت إلى الحرف',
    nameEn: 'Sound → letter',
    descAr: 'سماع صوت واختيار الحرف الذي يمثّله',
    descEn: 'Hearing a sound and choosing the letter for it',
    templates: ['TPL-AR_SOUND_TO_LETTER'],
    research: ['A3', 'A4', 'A9'],
    modality_pair: 'LIT.LETTER_TO_SOUND',
  }),
  strand({
    id: 'LIT.LETTER_TO_SOUND',
    code: 'L3l',
    rung: 2, // the other direction, measured separately — see below
    nameAr: 'من الحرف إلى الصوت',
    nameEn: 'Letter → sound',
    descAr: 'رؤية حرف واختيار صوته',
    descEn: 'Seeing a letter and choosing its sound',
    templates: ['TPL-AR_LETTER_TO_SOUND'],
    research: ['A3', 'A4', 'A9'],
    modality_pair: 'LIT.SOUND_TO_LETTER',
    /**
     * The two directions are separate strands rather than one "letter-sound"
     * score because they dissociate in practice, and the difference is
     * instructionally useful: a child who can do sound → letter but not
     * letter → sound should be taught starting from the direction that works.
     * Collapsing them would throw that away.
     */
  }),

  // ── L4 ───────────────────────────────────────────────────────────────────
  strand({
    id: 'LIT.PHON_SYLLABLE',
    code: 'L4a',
    rung: 3,
    nameAr: 'الوعي بالمقاطع',
    nameEn: 'Syllable awareness',
    descAr: 'تقطيع الكلمة إلى مقاطع وعدّها',
    descEn: 'Breaking a word into syllables and counting them',
    templates: ['TPL-AR_SYLLABLE'],
    research: ['A2', 'A9', 'B4'],
    phonological: true,
  }),
  strand({
    id: 'LIT.PHON_RHYME',
    code: 'L4b',
    rung: 4,
    nameAr: 'القافية والصوت الأول',
    nameEn: 'Rhyme and onset',
    descAr: 'التعرّف على الكلمات المتشابهة في آخرها أو أولها',
    descEn: 'Recognising words that share an ending or a beginning sound',
    templates: ['TPL-AR_RHYME'],
    research: ['A2', 'B4'],
    phonological: true,
  }),
  strand({
    id: 'LIT.PHON_BLEND',
    code: 'L4c',
    rung: 5,
    nameAr: 'دمج الأصوات',
    nameEn: 'Phoneme blending',
    descAr: 'دمج أصوات منفصلة لتكوين كلمة',
    descEn: 'Blending separate sounds into a word',
    templates: ['TPL-AR_BLEND'],
    research: ['A2', 'A3'],
    phonological: true,
  }),
  strand({
    id: 'LIT.PHON_SEGMENT',
    code: 'L4d',
    rung: 6, // ABOVE blending — NRP meta-analysis, segmentation d=0.87 vs 0.61
    nameAr: 'تقطيع الأصوات',
    nameEn: 'Phoneme segmentation',
    descAr: 'تقطيع كلمة بسيطة إلى أصواتها بالترتيب',
    descEn: 'Breaking a simple word into its sounds in order',
    templates: ['TPL-AR_SEGMENT'],
    research: ['A2', 'A3'],
    phonological: true,
  }),

  // ── L5–L8 ────────────────────────────────────────────────────────────────
  strand({
    id: 'LIT.DECODING',
    code: 'L5',
    rung: 7,
    nameAr: 'فك الترميز المبكر',
    nameEn: 'Early decoding',
    descAr: 'قراءة كلمات بسيطة مشكولة عن طريق دمج أصواتها',
    descEn: 'Reading simple vowelised words by blending their sounds',
    templates: ['TPL-AR_DECODE'],
    research: ['A6', 'A9'],
    /**
     * Unlocks on PARTIAL letter-sound knowledge, not on mastery of the whole
     * alphabet. WWC (A9): decoding begins once "students know a few consonants
     * and vowels". The routing layer enforces this via `unlock_hint`, which is
     * a hint for item selection — never a hard gate.
     */
    unlock_hint: { strand: 'LIT.SOUND_TO_LETTER', min_observations: 1 },
  }),
  strand({
    id: 'LIT.WORD_READING',
    code: 'L6',
    rung: 8,
    nameAr: 'قراءة الكلمات',
    nameEn: 'Word reading',
    descAr: 'قراءة كلمات مألوفة ومطابقتها بالصور',
    descEn: 'Reading familiar words and matching them to pictures',
    templates: ['TPL-AR_WORD_READ'],
    research: ['A6', 'A8'],
  }),
  strand({
    id: 'LIT.READ_COMP',
    code: 'L7',
    rung: 9,
    nameAr: 'فهم المقروء',
    nameEn: 'Reading comprehension',
    descAr: 'فهم جملة قصيرة والإجابة عن سؤال مباشر عنها',
    descEn: 'Understanding a short sentence and answering a literal question',
    templates: ['TPL-AR_READ_COMP'],
    research: ['A7', 'A8'],
  }),
  strand({
    id: 'LIT.FUNCTIONAL',
    code: 'L8',
    rung: 10,
    nameAr: 'القراءة الوظيفية',
    nameEn: 'Functional reading',
    descAr: 'قراءة اللافتات والكلمات اليومية والتعليمات البسيطة',
    descEn: 'Reading signs, everyday words and simple instructions',
    templates: ['TPL-AR_FUNCTIONAL_READ'],
    research: ['F8'],
  }),

  // ── LISTENING COMPREHENSION — its own track, parallel at every rung ──────
  strand({
    id: 'LIT.LISTEN_WORD',
    code: 'LC0',
    rung: 0,
    track: 'LISTENING',
    nameAr: 'فهم كلمة مسموعة',
    nameEn: 'Understanding a spoken word',
    descAr: 'اختيار الصورة التي تطابق كلمة مسموعة',
    descEn: 'Choosing the picture that matches a spoken word',
    templates: ['TPL-AR_LISTEN_WORD'],
    research: ['A7'],
  }),
  strand({
    id: 'LIT.LISTEN_SENTENCE',
    code: 'LC1',
    rung: 1,
    track: 'LISTENING',
    nameAr: 'فهم جملة مسموعة',
    nameEn: 'Understanding a spoken sentence',
    descAr: 'اختيار الصورة التي تطابق جملة قصيرة مسموعة',
    descEn: 'Choosing the picture that matches a short spoken sentence',
    templates: ['TPL-AR_LISTEN_SENTENCE'],
    research: ['A7', 'A8'],
  }),
  strand({
    id: 'LIT.LISTEN_INSTRUCTION',
    code: 'LC2',
    rung: 2,
    track: 'LISTENING',
    nameAr: 'تنفيذ تعليمة من خطوتين',
    nameEn: 'Following a two-step instruction',
    descAr: 'تنفيذ تعليمة مسموعة من خطوتين بالترتيب',
    descEn: 'Carrying out a two-step spoken instruction in order',
    templates: ['TPL-AR_LISTEN_INSTRUCTION'],
    research: ['A7'],
    reuses_sub_measure: 'LANG.INSTRUCTION',
  }),
  strand({
    id: 'LIT.LISTEN_STORY',
    code: 'LC3',
    rung: 3,
    track: 'LISTENING',
    nameAr: 'فهم قصة قصيرة',
    nameEn: 'Understanding a short story',
    descAr: 'الإجابة عن سؤال مباشر بعد سماع قصة قصيرة',
    descEn: 'Answering a literal question after hearing a short story',
    templates: ['TPL-AR_LISTEN_STORY'],
    research: ['A7', 'A8'],
  }),
];

export const LITERACY_META = {
  id: 'LITERACY',
  nameAr: 'القراءة والكتابة',
  nameEn: 'Literacy',
  language_of_instruction: 'EGYPTIAN_ARABIC',
  language_of_target_content: 'MSA_VOWELISED',
  _language_split_source: 'matrix B10 — the Egypt national EGRA did exactly this',
  diacritics_policy: 'ALL_TARGET_TEXT_VOWELISED',
  _diacritics_source: 'matrix B9, B10. Unvowelised reading is out of scope for Phase 5.',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  deferred: [
    'Morphological awareness (root-and-pattern, dual number) — matrix B8, B12. Deferred to a later phase, not built.',
    'Unvowelised word reading — matrix B7.',
  ],
};
