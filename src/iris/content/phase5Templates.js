/**
 * IRIS — Phase 5 activity templates (strand-keyed).
 *
 * These extend the existing template registry rather than forming a second
 * one: templates.js concatenates them into TEMPLATES and TEMPLATE_BY_ID, so
 * there is still exactly one template lookup in the product.
 *
 * Shape is identical to the legacy templates plus a `strands` array. `goals`
 * is present and empty because these templates serve ladder strands, not the
 * six MVP goals — templatesForGoalLevel() therefore never returns them, which
 * is correct.
 *
 * ── MODALITY PAIRS MUST BE SYMMETRIC ──────────────────────────────────────
 * An existing test asserts that if A declares B as its partner, B declares A.
 * That is what makes R-PATH-006's modality shift reversible. Pairs here obey
 * it; unpaired templates declare `modality_pair_id: null` explicitly so the
 * absence is a decision rather than an omission.
 *
 * ── MULTI-MODAL VALIDATION (brief §10) ────────────────────────────────────
 * The pairs are not decoration. Matrix E3 (Laing et al.) found children with
 * Williams syndrome reaching similar reading scores by a different underlying
 * route — so the same score can mean different things. Probing one skill two
 * ways is how IRIS distinguishes "does not know it" from "cannot get at it
 * this way", without making any clinical claim about why.
 */

const t = (o) => ({
  goals: {},           // ladder templates serve strands, not the MVP goals
  wm_load: 'LOW',
  verbal_load: 'LOW',
  min_options: 2,
  max_options: 4,
  response_type: 'SINGLE_SELECT',
  modality_pair_id: null,
  phase: 5,
  ...o,
});

export const PHASE5_TEMPLATES = [
  // ── literacy: readiness and letters ─────────────────────────────────────
  t({
    id: 'TPL-AR_MATCH_IDENTICAL', strands: ['LIT.READINESS'],
    interaction: 'See a picture → choose the identical one',
    modality: 'VISUAL', labelAr: 'اختار الصورة زي دي', labelEn: 'Pick the matching picture',
  }),
  t({
    id: 'TPL-AR_LETTER_MATCH', strands: ['LIT.LETTER_AWARE'],
    interaction: 'See a letter → choose the identical letter',
    modality: 'VISUAL', labelAr: 'اختار الحرف زي ده', labelEn: 'Pick the matching letter',
  }),
  t({
    id: 'TPL-AR_FORM_MATCH', strands: ['LIT.LETTER_FORMS'],
    interaction: 'See a letter in isolation → find the same letter inside a word',
    modality: 'VISUAL', wm_load: 'MEDIUM',
    labelAr: 'فين نفس الحرف جوّه الكلمة؟', labelEn: 'Find the same letter inside the word',
    arabic_specific: true,
  }),
  t({
    id: 'TPL-AR_DOT_CONTRAST', strands: ['LIT.DOT_CONTRAST'],
    interaction: 'Choose between letters sharing a skeleton, differing only in dots',
    modality: 'VISUAL', labelAr: 'خلّي بالك من النقط', labelEn: 'Watch the dots',
    arabic_specific: true,
  }),
  t({
    id: 'TPL-AR_LETTER_NAME', strands: ['LIT.LETTER_NAME'],
    interaction: 'Hear a letter name → choose the letter',
    modality: 'AUDITORY_VISUAL', verbal_load: 'MEDIUM',
    labelAr: 'فين الحرف ده؟', labelEn: 'Which letter is this?',
  }),

  // ── the two letter-sound directions — a symmetric pair ──────────────────
  t({
    id: 'TPL-AR_SOUND_TO_LETTER', strands: ['LIT.SOUND_TO_LETTER'],
    interaction: 'Hear a sound → choose the letter that makes it',
    modality: 'AUDITORY_VISUAL', verbal_load: 'MEDIUM',
    modality_pair_id: 'TPL-AR_LETTER_TO_SOUND',
    labelAr: 'الصوت ده لأنهي حرف؟', labelEn: 'Which letter makes this sound?',
  }),
  t({
    id: 'TPL-AR_LETTER_TO_SOUND', strands: ['LIT.LETTER_TO_SOUND'],
    interaction: 'See a letter → choose the picture whose name starts with its sound',
    modality: 'VISUAL_LED', verbal_load: 'MEDIUM',
    modality_pair_id: 'TPL-AR_SOUND_TO_LETTER',
    labelAr: 'الحرف ده بيقول إيه؟', labelEn: 'What sound does this letter make?',
  }),

  // ── phonological awareness ──────────────────────────────────────────────
  // A3: PA instruction is more effective taught WITH letters than without, so
  // every one of these shows the letter alongside the sound.
  t({
    id: 'TPL-AR_SYLLABLE', strands: ['LIT.PHON_SYLLABLE'],
    interaction: 'Hear a word → choose how many syllables (with picture support)',
    modality: 'AUDITORY_VISUAL', verbal_load: 'MEDIUM', wm_load: 'MEDIUM',
    labelAr: 'كام مقطع؟', labelEn: 'How many chunks?',
    shows_letters: true, picture_supported: true,
  }),
  t({
    id: 'TPL-AR_RHYME', strands: ['LIT.PHON_RHYME'],
    interaction: 'Hear a word → choose the word that rhymes with it',
    modality: 'AUDITORY_VISUAL', verbal_load: 'HIGH', wm_load: 'MEDIUM',
    labelAr: 'أنهي كلمة بتخلص زيها؟', labelEn: 'Which word ends the same?',
    shows_letters: true, picture_supported: true,
  }),
  t({
    id: 'TPL-AR_BLEND', strands: ['LIT.PHON_BLEND'],
    interaction: 'Hear separate sounds → choose the picture of the blended word',
    modality: 'AUDITORY_VISUAL', verbal_load: 'HIGH', wm_load: 'HIGH',
    modality_pair_id: 'TPL-AR_BLEND_PICTURE_LED',
    labelAr: 'الأصوات دي بتعمل أنهي كلمة؟', labelEn: 'What word do these sounds make?',
    shows_letters: true, picture_supported: true,
  }),
  t({
    id: 'TPL-AR_BLEND_PICTURE_LED', strands: ['LIT.PHON_BLEND'],
    interaction: 'Picture-led variant of blending — the declared partner',
    modality: 'VISUAL_LED', verbal_load: 'MEDIUM', wm_load: 'MEDIUM',
    modality_pair_id: 'TPL-AR_BLEND',
    labelAr: 'الصورة دي أصواتها إيه؟', labelEn: 'What sounds make this picture?',
    shows_letters: true, picture_supported: true,
  }),
  t({
    id: 'TPL-AR_SEGMENT', strands: ['LIT.PHON_SEGMENT'],
    interaction: 'Hear a word → choose its sounds in order',
    modality: 'AUDITORY_VISUAL', verbal_load: 'HIGH', wm_load: 'HIGH',
    response_type: 'ORDERED_SELECT',
    labelAr: 'قسّم الكلمة لأصواتها', labelEn: 'Break the word into its sounds',
    shows_letters: true,
  }),

  // ── decoding and reading ────────────────────────────────────────────────
  t({
    id: 'TPL-AR_DECODE', strands: ['LIT.DECODING'],
    interaction: 'See a short vowelised word → choose its picture',
    modality: 'VISUAL', verbal_load: 'MEDIUM',
    labelAr: 'اقرا الكلمة واختار صورتها', labelEn: 'Read the word and pick its picture',
    vowelised: true,
  }),
  t({
    id: 'TPL-AR_WORD_READ', strands: ['LIT.WORD_READING'],
    interaction: 'See a picture → choose the written word',
    modality: 'VISUAL', verbal_load: 'MEDIUM',
    labelAr: 'اختار الكلمة الصح', labelEn: 'Pick the right word',
    vowelised: true,
  }),
  t({
    id: 'TPL-AR_READ_COMP', strands: ['LIT.READ_COMP'],
    interaction: 'Read a short sentence → answer a literal question',
    modality: 'VISUAL', verbal_load: 'HIGH', wm_load: 'MEDIUM',
    labelAr: 'اقرا وجاوب', labelEn: 'Read and answer',
    vowelised: true,
  }),
  t({
    id: 'TPL-AR_FUNCTIONAL_READ', strands: ['LIT.FUNCTIONAL'],
    interaction: 'See an everyday sign or label → choose what it means',
    modality: 'VISUAL', verbal_load: 'MEDIUM',
    labelAr: 'اللافتة دي معناها إيه؟', labelEn: 'What does this sign mean?',
    vowelised: true,
  }),

  // ── listening comprehension — its own track ─────────────────────────────
  t({
    id: 'TPL-AR_LISTEN_WORD', strands: ['LIT.LISTEN_WORD'],
    interaction: 'Hear a word → choose its picture',
    modality: 'AUDITORY_VISUAL', verbal_load: 'MEDIUM',
    labelAr: 'اسمع واختار الصورة', labelEn: 'Listen and pick the picture',
  }),
  t({
    id: 'TPL-AR_LISTEN_SENTENCE', strands: ['LIT.LISTEN_SENTENCE'],
    interaction: 'Hear a short sentence → choose the matching picture',
    modality: 'AUDITORY_VISUAL', verbal_load: 'HIGH', wm_load: 'MEDIUM',
    labelAr: 'اسمع الجملة واختار الصورة', labelEn: 'Listen to the sentence and pick the picture',
  }),
  t({
    id: 'TPL-AR_LISTEN_INSTRUCTION', strands: ['LIT.LISTEN_INSTRUCTION'],
    interaction: 'Hear a two-step instruction → tap the items in order',
    modality: 'AUDITORY_VISUAL', verbal_load: 'HIGH', wm_load: 'HIGH',
    response_type: 'ORDERED_SELECT',
    labelAr: 'اعمل اللي هسمعك عليه بالترتيب', labelEn: 'Do what you hear, in order',
  }),
  t({
    id: 'TPL-AR_LISTEN_STORY', strands: ['LIT.LISTEN_STORY'],
    interaction: 'Hear a short story → answer a literal question',
    modality: 'AUDITORY_VISUAL', verbal_load: 'HIGH', wm_load: 'HIGH',
    labelAr: 'اسمع الحدوتة وجاوب', labelEn: 'Listen to the story and answer',
  }),

  // ── numeracy — language-light by default (matrix E8) ────────────────────
  t({
    id: 'TPL-AR_SUBITIZE', strands: ['NUM.QUANTITY'],
    interaction: 'See a small set briefly → choose how many, without counting',
    modality: 'VISUAL',
    labelAr: 'كام واحدة؟', labelEn: 'How many?',
    language_light: true,
  }),
  t({
    id: 'TPL-AR_COUNT', strands: ['NUM.COUNTING'],
    interaction: 'Tap each item once to count a set',
    modality: 'VISUAL', response_type: 'TAP_EACH',
    modality_pair_id: 'TPL-AR_COUNT_SELECT',
    labelAr: 'عُدّ واحدة واحدة', labelEn: 'Count them one by one',
    language_light: true,
  }),
  t({
    id: 'TPL-AR_COUNT_SELECT', strands: ['NUM.COUNTING'],
    interaction: 'Selection variant of counting — the declared partner',
    modality: 'VISUAL',
    modality_pair_id: 'TPL-AR_COUNT',
    labelAr: 'اختار المجموعة اللي فيها العدد ده', labelEn: 'Pick the set with this many',
    language_light: true,
  }),
  t({
    id: 'TPL-AR_GIVE_N', strands: ['NUM.CARDINALITY'],
    interaction: 'Hear a number → give exactly that many',
    modality: 'AUDITORY_VISUAL', response_type: 'TAP_EACH',
    labelAr: 'هاتلي العدد ده', labelEn: 'Give me this many',
    language_light: true,
  }),
  t({
    id: 'TPL-AR_NUMERAL', strands: ['NUM.NUMERAL'],
    interaction: 'Hear a number → choose the written numeral',
    modality: 'AUDITORY_VISUAL',
    modality_pair_id: 'TPL-AR_NUMERAL_TO_QTY',
    labelAr: 'فين الرقم ده؟', labelEn: 'Which one is this number?',
    language_light: true,
  }),
  t({
    id: 'TPL-AR_NUMERAL_TO_QTY', strands: ['NUM.NUMERAL'],
    interaction: 'See a numeral → choose the matching quantity',
    modality: 'VISUAL',
    modality_pair_id: 'TPL-AR_NUMERAL',
    labelAr: 'الرقم ده يساوي كام حاجة؟', labelEn: 'How many does this numeral mean?',
    language_light: true,
  }),
  t({
    id: 'TPL-AR_COMPARE', strands: ['NUM.COMPARISON'],
    interaction: 'Choose the larger, smaller or equal set',
    modality: 'VISUAL', verbal_load: 'MEDIUM',
    labelAr: 'أنهي مجموعة أكتر؟', labelEn: 'Which group has more?',
    /** Cannot avoid relational language — flagged so a failure is attributable. */
    language_light: false, uses_relational_language: true,
  }),
  t({
    id: 'TPL-AR_SEQUENCE', strands: ['NUM.SEQUENCE'],
    interaction: 'Find the missing number in a sequence',
    modality: 'VISUAL', wm_load: 'MEDIUM',
    labelAr: 'إيه الرقم الناقص؟', labelEn: 'Which number is missing?',
    language_light: true,
  }),
  t({
    id: 'TPL-AR_ADD_SMALL', strands: ['NUM.OPERATIONS'],
    interaction: 'Combine or take away small quantities',
    modality: 'VISUAL', verbal_load: 'MEDIUM', wm_load: 'MEDIUM',
    labelAr: 'يبقى كام كلهم؟', labelEn: 'How many altogether?',
    language_light: false, uses_relational_language: true,
  }),
  t({
    id: 'TPL-AR_PATTERN', strands: ['NUM.PATTERN'],
    interaction: 'Complete a repeating pattern',
    modality: 'VISUAL', wm_load: 'MEDIUM',
    labelAr: 'كمّل النمط', labelEn: 'Complete the pattern',
    language_light: true,
  }),
  t({
    id: 'TPL-AR_MONEY', strands: ['NUM.FUNCTIONAL'],
    interaction: 'Recognise and combine coins and notes',
    modality: 'VISUAL', verbal_load: 'MEDIUM',
    labelAr: 'الفلوس دي كام؟', labelEn: 'How much money is this?',
    language_light: false,
  }),
  t({
    id: 'TPL-AR_TIME', strands: ['NUM.FUNCTIONAL'],
    interaction: 'Read a clock or order events in a day',
    modality: 'VISUAL', verbal_load: 'MEDIUM',
    labelAr: 'الساعة كام؟', labelEn: 'What time is it?',
    language_light: false,
  }),
];

export const TEMPLATES_BY_STRAND = (() => {
  const map = {};
  for (const tpl of PHASE5_TEMPLATES) {
    for (const s of tpl.strands ?? []) (map[s] ??= []).push(tpl.id);
  }
  return map;
})();

/** Templates that can serve a strand. The first is the default. */
export const templatesForStrand = (strandId) => TEMPLATES_BY_STRAND[strandId] ?? [];
