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
  /**
   * av2 §2 anti-rule, applied as a DEFAULT so a vocal-required item cannot be
   * written by accident: no IRIS ladder template requires spoken output.
   * Individual items may additionally declare `accepts_any_output`.
   */
  vocal_required: false,
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
    /* P63: its picture-led twin was RETIRED (identical data, fictional
       picture) — the pairing link is removed so no retry can resurrect it. */
    labelAr: 'الأصوات دي بتعمل أنهي كلمة؟', labelEn: 'What word do these sounds make?',
    shows_letters: true, picture_supported: true,
  }),
  t({ /* P63 RETIRED: no items are generated against this template any more
        and it is absent from its strand's served list — kept registered only
        so historical item records can still resolve their template_id. */
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
    /**
     * `VSP.PATTERN` is declared here as well as on TPL-AR_VSP_PATTERN because
     * av2 §2 re-hosts the pattern format under the visual ladder: the same
     * "what comes next" demand, scored against the visual-spatial track
     * instead of the numeric one. Two strands sharing one format is a
     * presentation fact, not a shared score — each keeps its own indicator,
     * its own rung, and its own target_skill id.
     */
    id: 'TPL-AR_PATTERN', strands: ['NUM.PATTERN', 'VSP.PATTERN'],
    interaction: 'Complete a repeating pattern',
    modality: 'VISUAL', wm_load: 'MEDIUM',
    modality_pair_id: 'TPL-AR_VSP_PATTERN',
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

  // ══ av2 §2 — VSP (domain E), MEM (domain F), COMM (domain A) ═════════════
  //
  // The `_LISTEN` twins below are PAIRED-MODALITY variants, not new skills:
  // the sample demand is identical and only the route to the child changes —
  // the instruction arrives spoken instead of as printed Arabic. That is what
  // av2 §4's `paired_modality` retry re-offers when an item comes back
  // `insufficient`, and the engine cannot re-ask a second way unless that way
  // exists as a template. Same target_skill, different route (matrix E3).
  //
  // None of these requires speech. `t()` defaults `vocal_required: false` for
  // every ladder template; the COMM items say it again at item level because
  // the anti-rule in spec §2 is about the child's experience, not the schema.

  // ── VSP.MATCH ──────────────────────────────────────────────────────────
  t({
    id: 'TPL-AR_VSP_MATCH', strands: ['VSP.MATCH'],
    interaction: 'See a picture → tap the tile that is exactly the same (no names, no letters)',
    modality: 'VISUAL', language_light: true,
    modality_pair_id: 'TPL-AR_VSP_MATCH_LISTEN',
    labelAr: 'اختار اللي زيها بالظبط', labelEn: 'Pick the one that is exactly the same',
  }),
  t({
    id: 'TPL-AR_VSP_MATCH_LISTEN', strands: ['VSP.MATCH'],
    interaction: 'The same visual match with the instruction spoken — the declared twin',
    modality: 'AUDITORY_VISUAL', language_light: true,
    modality_pair_id: 'TPL-AR_VSP_MATCH',
    labelAr: 'اسمع وقارن — اختار اللي زيها', labelEn: 'Listen and compare — pick the identical one',
    paired_modality: true,
  }),

  // ── VSP.DIFFERENCE ─────────────────────────────────────────────────────
  t({
    id: 'TPL-AR_VSP_DIFFERENCE', strands: ['VSP.DIFFERENCE'],
    interaction: 'See a row of tiles → tap the one that is not like the others',
    modality: 'VISUAL', language_light: true,
    modality_pair_id: 'TPL-AR_VSP_DIFFERENCE_LISTEN',
    labelAr: 'أنهي واحدة مش زي التانية؟', labelEn: 'Which one is not like the others?',
    /** Odd-one-out is undefined below three tiles, so the format says so. */
    min_options: 3,
  }),
  t({
    id: 'TPL-AR_VSP_DIFFERENCE_LISTEN', strands: ['VSP.DIFFERENCE'],
    interaction: 'The same odd-one-out with the question spoken — the declared twin',
    modality: 'AUDITORY_VISUAL', language_light: true,
    modality_pair_id: 'TPL-AR_VSP_DIFFERENCE',
    labelAr: 'اسمع السؤال وقارن الصور', labelEn: 'Hear the question and compare the pictures',
    paired_modality: true, min_options: 3,
  }),

  // ── VSP.SORT — two sorting rules, not two wordings of one rule ─────────
  t({
    id: 'TPL-AR_VSP_SORT', strands: ['VSP.SORT'],
    interaction: 'See one tile → tap the group of the same KIND',
    modality: 'VISUAL', language_light: true, wm_load: 'MEDIUM',
    labelAr: 'دي بتتجمع مع أنهي مجموعة؟', labelEn: 'Which group does this one belong to?',
    sort_rule: 'KIND',
  }),
  t({
    id: 'TPL-AR_VSP_SORT_COLOR', strands: ['VSP.SORT'],
    interaction: 'See one tile → tap the group of the same COLOUR',
    modality: 'VISUAL', language_light: true,
    labelAr: 'اختار المجموعة اللي بنفس اللون', labelEn: 'Pick the group with the same colour',
    sort_rule: 'COLOUR',
    // Deliberately NOT a modality pair with TPL-AR_VSP_SORT: kind and colour
    // are two different rules. Declaring them as partners would let the engine
    // believe it had re-asked the same question when it had asked another one.
  }),

  // ── VSP.PATTERN — the visual side of the pattern format ────────────────
  t({
    id: 'TPL-AR_VSP_PATTERN', strands: ['VSP.PATTERN'],
    interaction: 'See a repeating visual pattern → tap what comes next (no numerals)',
    modality: 'VISUAL', wm_load: 'MEDIUM', language_light: true,
    modality_pair_id: 'TPL-AR_PATTERN',
    labelAr: 'كمّل الشكل اللي بيتكرر', labelEn: 'Continue the repeating pattern',
    pattern_domain: 'VISUAL_ONLY',
  }),

  // ── MEM.VISUAL_STM — the disappearing display ──────────────────────────
  t({
    id: 'TPL-AR_MEM_DISAPPEARED', strands: ['MEM.VISUAL_STM'],
    interaction: 'Three tiles shown, one goes while you watch → tap the one that disappeared',
    modality: 'VISUAL', wm_load: 'MEDIUM', language_light: true,
    modality_pair_id: 'TPL-AR_MEM_DISAPPEARED_LISTEN',
    labelAr: 'إيه اللي اختفت؟', labelEn: 'What disappeared?',
    set_size: 3,
  }),
  t({
    id: 'TPL-AR_MEM_DISAPPEARED_LISTEN', strands: ['MEM.VISUAL_STM'],
    interaction: 'The same disappearing display with the question spoken — the declared twin',
    modality: 'AUDITORY_VISUAL', wm_load: 'MEDIUM', language_light: true,
    modality_pair_id: 'TPL-AR_MEM_DISAPPEARED',
    labelAr: 'السؤال بصوت: إيه اللي اختفت؟', labelEn: 'The question spoken: what disappeared?',
    set_size: 3, paired_modality: true,
  }),

  // ── MEM.SEQUENCE — two steps, shown AND spoken ─────────────────────────
  t({
    id: 'TPL-AR_MEM_SEQUENCE', strands: ['MEM.SEQUENCE'],
    interaction: 'Two steps shown and spoken → tap them in that order',
    modality: 'AUDITORY_VISUAL', response_type: 'ORDERED_SELECT',
    wm_load: 'HIGH', verbal_load: 'MEDIUM', language_light: true,
    modality_pair_id: 'TPL-AR_MEM_SEQUENCE_LISTEN',
    labelAr: 'اعمل زي ما شفت وسمعت، بالترتيب', labelEn: 'Do it in the order you saw and heard',
    steps: 2, paired_modality: true,
  }),
  t({
    id: 'TPL-AR_MEM_SEQUENCE_LISTEN', strands: ['MEM.SEQUENCE'],
    interaction: 'The two steps arrive by audio first, then stay on screen — the declared twin',
    modality: 'AUDITORY_VISUAL', response_type: 'ORDERED_SELECT',
    wm_load: 'HIGH', verbal_load: 'MEDIUM', language_light: true,
    modality_pair_id: 'TPL-AR_MEM_SEQUENCE',
    labelAr: 'اسمع الخطوتين وكررهم بالترتيب', labelEn: 'Hear the two steps and repeat the order',
    steps: 2,
    // NOT the same construct as LIT.LISTEN_INSTRUCTION: that strand scores the
    // language route to following an instruction; this one scores holding the
    // order once the sentence is no longer needed. Separate tracks, separate
    // indicators, neither reads the other (ladders/memory.js).
  }),

  // ── MEM.MEDIAL — temporal order of what was shown ──────────────────────
  t({
    id: 'TPL-AR_MEM_MEDIAL_FIRST', strands: ['MEM.MEDIAL'],
    interaction: 'Two tiles shown one after the other → tap the one that came FIRST',
    modality: 'VISUAL', wm_load: 'MEDIUM', language_light: true,
    labelAr: 'إيه اللي جه الأول؟', labelEn: 'Which one came first?',
    temporal_term: 'FIRST',
  }),
  t({
    id: 'TPL-AR_MEM_MEDIAL_LAST', strands: ['MEM.MEDIAL'],
    interaction: 'Two tiles shown one after the other → tap the one that came LAST',
    modality: 'VISUAL', wm_load: 'MEDIUM', language_light: true,
    labelAr: 'إيه اللي جه الآخر؟', labelEn: 'Which one came last?',
    temporal_term: 'LAST',
    // FIRST and LAST are not paired either. "Before/after" wording is itself
    // the relational difficulty matrix E8 names, so the two directions are two
    // items to compare, not two routes to one item.
  }),

  // ── COMM — the expressive channel. NEVER vocal-required. ───────────────
  t({
    id: 'TPL-AR_COMM_CHOICE', strands: ['COMM.EXPRESS_CHOICE'],
    interaction: 'Two liked things are offered → make a choice any way you can; the adult taps it',
    modality: 'VISUAL', language_light: true,
    modality_pair_id: 'TPL-AR_COMM_CHOICE_LISTEN',
    labelAr: 'اختار اللي عاجبك — بالإيد أو بالصوت', labelEn: 'Pick what you like — by hand or by sound',
    vocal_required: false, accepts_any_output: true, helper_confirm: true,
    response_modes: ['tap', 'point', 'any_vocal_helper_confirmed', 'aac_press'],
    // There is no correct tile: the child's OWN preference is the response.
    answer_key: 'ANY_CONFIRMED_CHOICE',
  }),
  t({
    id: 'TPL-AR_COMM_CHOICE_LISTEN', strands: ['COMM.EXPRESS_CHOICE'],
    interaction: 'The same choice board with the offer spoken — the declared twin',
    modality: 'AUDITORY_VISUAL', language_light: true,
    modality_pair_id: 'TPL-AR_COMM_CHOICE',
    labelAr: 'اسمع الاختارين واختار اللي تحبه', labelEn: 'Hear the two choices and pick the one you like',
    vocal_required: false, accepts_any_output: true, helper_confirm: true,
    response_modes: ['tap', 'point', 'any_vocal_helper_confirmed', 'aac_press'],
    paired_modality: true, answer_key: 'ANY_CONFIRMED_CHOICE',
  }),
  t({
    id: 'TPL-AR_COMM_LABEL', strands: ['COMM.LABEL'],
    interaction: 'See a familiar picture → name it with ANY output; a tap on its picture is the equal fallback',
    modality: 'VISUAL', language_light: true,
    labelAr: 'دي إيه؟ قولها أو اختار صورتها', labelEn: 'What is this? Say it or pick its picture',
    vocal_required: false, accepts_any_output: true, helper_confirm: true,
    response_modes: ['any_vocal_helper_confirmed', 'sign', 'aac_press', 'tap', 'point'],
    // The picture options are the TAP FALLBACK for a child who does not speak,
    // never a vocabulary test and never a prerequisite for a score.
    never_vocal_required: true,
  }),
  t({
    id: 'TPL-AR_COMM_LABEL_POINT', strands: ['COMM.LABEL'],
    interaction: 'A name is spoken → point to or tap the picture it names (labelling by pointing)',
    modality: 'AUDITORY_VISUAL', language_light: true,
    labelAr: 'وريني الصورة اللي اسمها كده', labelEn: 'Point to the picture with that name',
    vocal_required: false, accepts_any_output: true, helper_confirm: true,
    response_modes: ['point', 'tap', 'gaze_adjacent_point', 'any_vocal_helper_confirmed'],
    never_vocal_required: true,
  }),
];

/**
 * av2 §1 — every template declares the ONE skill its items target, as a
 * stable id.
 *
 * ── WHY A MAP OF TEMPLATES RATHER THAN A FIELD ON EACH ITEM ───────────────
 * The id has to survive an item being rewritten, re-tiered or regenerated.
 * Written on the item it drifts; derived from the template it is a property of
 * the task format, which is the thing that was actually reviewed against the
 * research matrix. The bank still stamps it onto every item at generation time
 * (`it.target_skill ??= TARGET_SKILL_BY_TEMPLATE[it.template_id]`) so an
 * observation carries the id without any lookup, and an item that ever needs
 * its own id can set one and win.
 *
 * ── WHAT IT IS FOR ────────────────────────────────────────────────────────
 * Rolling item-level observations up to a SKILL view (spec §8 compares the
 * caregiver's "does it independently" against ladder evidence per skill
 * family). It is a label on a row: never a score, never a diagnosis, and never
 * averaged across skills by anything in this file.
 *
 * Paired modalities share one id ON PURPOSE (matrix E3 — same skill, two
 * routes, and whether a child answers by the visual or the audio route IS the
 * information). Two genuinely different demands — kind-sort vs colour-sort,
 * FIRST vs LAST — get two ids so they can never be silently blended.
 *
 * Completeness is enforced by tests/iris.av2.test.js: a format cannot be added
 * to this registry without a skill id.
 */
export const TARGET_SKILL_BY_TEMPLATE = Object.freeze({
  // ── literacy: readiness, letters, sounds ────────────────────────────────
  'TPL-AR_MATCH_IDENTICAL': 'picture-identical-match',
  'TPL-AR_LETTER_MATCH': 'letter-shape-match',
  'TPL-AR_FORM_MATCH': 'letter-positional-form',
  'TPL-AR_DOT_CONTRAST': 'letter-dot-contrast',
  'TPL-AR_LETTER_NAME': 'letter-name-recognition',
  'TPL-AR_SOUND_TO_LETTER': 'sound-to-letter',
  'TPL-AR_LETTER_TO_SOUND': 'letter-to-sound',
  'TPL-AR_SYLLABLE': 'phonological-syllable-count',
  'TPL-AR_RHYME': 'phonological-rhyme',
  'TPL-AR_BLEND': 'phonological-blending',
  'TPL-AR_BLEND_PICTURE_LED': 'phonological-blending',
  'TPL-AR_SEGMENT': 'phonological-segmenting',

  // ── literacy: decoding and reading ──────────────────────────────────────
  'TPL-AR_DECODE': 'word-reading-decoding',
  'TPL-AR_WORD_READ': 'word-reading-sight',
  'TPL-AR_READ_COMP': 'reading-comprehension-literal',
  'TPL-AR_FUNCTIONAL_READ': 'functional-sign-reading',

  // ── listening (receptive language) ──────────────────────────────────────
  'TPL-AR_LISTEN_WORD': 'listening-word',
  'TPL-AR_LISTEN_SENTENCE': 'listening-sentence',
  'TPL-AR_LISTEN_INSTRUCTION': 'listening-two-step-instruction',
  'TPL-AR_LISTEN_STORY': 'listening-story-recall',

  // ── numeracy ────────────────────────────────────────────────────────────
  'TPL-AR_SUBITIZE': 'quantity-subitizing',
  'TPL-AR_COUNT': 'counting-one-to-one',
  'TPL-AR_COUNT_SELECT': 'counting-one-to-one',
  'TPL-AR_GIVE_N': 'cardinality-give-n',
  'TPL-AR_NUMERAL': 'numeral-recognition',
  'TPL-AR_NUMERAL_TO_QTY': 'numeral-to-quantity',
  'TPL-AR_COMPARE': 'quantity-comparison',
  'TPL-AR_SEQUENCE': 'number-sequence-missing',
  'TPL-AR_ADD_SMALL': 'operations-small-add-take',
  'TPL-AR_PATTERN': 'pattern-extend-numeric',
  'TPL-AR_MONEY': 'functional-money',
  'TPL-AR_TIME': 'functional-time',

  // ── av2 VSP — visual recognition & matching (domain E) ──────────────────
  'TPL-AR_VSP_MATCH': 'vsp-picture-match',
  'TPL-AR_VSP_MATCH_LISTEN': 'vsp-picture-match',
  'TPL-AR_VSP_DIFFERENCE': 'vsp-find-difference',
  'TPL-AR_VSP_DIFFERENCE_LISTEN': 'vsp-find-difference',
  'TPL-AR_VSP_SORT': 'vsp-sort-by-kind',
  'TPL-AR_VSP_SORT_COLOR': 'vsp-sort-by-colour',
  // VSP.PATTERN's own id; items generated on the re-hosted TPL-AR_PATTERN
  // carry this id too, which is why the bank stamps VSP pattern items from
  // the STRAND rather than from the numeric template entry above.
  'TPL-AR_VSP_PATTERN': 'vsp-pattern-extend',

  // ── av2 MEM — memory & attention tasks (domain F) ───────────────────────
  'TPL-AR_MEM_DISAPPEARED': 'mem-visual-what-gone',
  'TPL-AR_MEM_DISAPPEARED_LISTEN': 'mem-visual-what-gone',
  'TPL-AR_MEM_SEQUENCE': 'mem-sequence-two-steps',
  'TPL-AR_MEM_SEQUENCE_LISTEN': 'mem-sequence-two-steps',
  'TPL-AR_MEM_MEDIAL_FIRST': 'mem-which-came-first',
  'TPL-AR_MEM_MEDIAL_LAST': 'mem-which-came-last',

  // ── av2 COMM — expressive channel (domain A) ────────────────────────────
  'TPL-AR_COMM_CHOICE': 'comm-express-choice',
  'TPL-AR_COMM_CHOICE_LISTEN': 'comm-express-choice',
  'TPL-AR_COMM_LABEL': 'comm-express-label',
  'TPL-AR_COMM_LABEL_POINT': 'comm-label-by-pointing',
});

/**
 * The skill a template targets. Items on a re-hosted template (TPL-AR_PATTERN
 * serving VSP.PATTERN) override it at item level, so the lookup here stays a
 * default and never a verdict.
 */
export const targetSkillFor = (templateId) => TARGET_SKILL_BY_TEMPLATE[templateId] ?? null;

export const TEMPLATES_BY_STRAND = (() => {
  const map = {};
  for (const tpl of PHASE5_TEMPLATES) {
    for (const s of tpl.strands ?? []) (map[s] ??= []).push(tpl.id);
  }
  return map;
})();

/** Templates that can serve a strand. The first is the default. */
export const templatesForStrand = (strandId) => TEMPLATES_BY_STRAND[strandId] ?? [];
