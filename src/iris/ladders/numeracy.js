/**
 * IRIS — Numeracy ladder (Phase 5).
 *
 * ── THE ONE THING THAT MATTERS MOST HERE ──────────────────────────────────
 * CARDINALITY IS NOT GATED BEHIND COUNTING.
 *
 * The obvious ladder — count first, then understand quantity — is wrong, and
 * two independent lines of evidence say so:
 *
 *   - The 2023 cardinal-principle study (matrix C1) found that children who
 *     became cardinal-principle knowers early could typically enumerate only
 *     "up to about three or four" items, with "diminishing returns for
 *     enumeration of larger collections". A long count sequence is not what
 *     unlocks cardinality.
 *
 *   - Nye, Fluck & Buckley (matrix D10) compared children with Down syndrome
 *     to matched typically developing children. Median highest count: 3 vs 11
 *     — a large group difference. Cardinality understanding: NO SIGNIFICANT
 *     DIFFERENCE. About a third of each group had it.
 *
 * A counting-gated ladder would have hidden cardinality in roughly a third of
 * the children who actually had it, in exactly the population IRIS serves.
 * So NUM.CARDINALITY shares a rung with NUM.COUNTING and is probed
 * independently of it.
 *
 * ── TWO LADDERS, NOT ONE ──────────────────────────────────────────────────
 * Literacy position must never be used to infer numeracy position. Brigstocke
 * et al. (D11) report arithmetic lagging reading by about two years in Down
 * syndrome, with wide individual variation. They dissociate.
 *
 * ── LANGUAGE-LIGHT BY DESIGN, FOR EVERY CHILD ─────────────────────────────
 * Mervis & Klein-Tasman (E8) found relational and quantitative vocabulary —
 * "more", "fewer", "before", "altogether" — is a clear weakness in Williams
 * syndrome while concrete vocabulary is not. That is precisely the vocabulary
 * maths instructions are written in, so a maths item that fails may be failing
 * on its wording rather than on the maths.
 *
 * The response is NOT a syndrome-conditioned branch. It is to keep relational
 * language out of numeracy items for EVERY child, and to tag the items where
 * it is unavoidable so a failure can be attributed correctly.
 */
import { VALIDATION, SPECIALIST_REVIEW } from '../spec.js';

/**
 * Subitizing range. Clements (matrix C8), citing Potter & Levy (1968) that
 * 2–4-year-olds show no accuracy difference across arrangements of "four or
 * fewer", and Dawson (1953) that first-graders manage "about four or five"
 * for scrambled arrangements.
 *
 * Above this, the task is counting and must be SCORED as counting — otherwise
 * IRIS would credit a counting strategy as instant recognition.
 */
export const SUBITIZING_MAX = 4;
export const SUBITIZING_SOURCE = 'matrix C8 — second-hand through Clements 1999; the 1953/1968 primaries were not retrieved';

/**
 * Relational-language terms that make a numeracy item language-dependent.
 * Items using these are tagged so a failure is not automatically read as a
 * numeracy failure. Research: E8.
 */
export const RELATIONAL_TERMS_AR = ['أكتر', 'أقل', 'أكثر', 'زي بعض', 'متساوي', 'قبل', 'بعد', 'كلهم', 'الباقي'];
export const RELATIONAL_TERMS_EN = ['more', 'fewer', 'less', 'equal', 'same', 'before', 'after', 'altogether', 'left over'];

const strand = (o) => ({
  ladder: 'NUMERACY',
  track: 'MAIN',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  language_light: true,
  ...o,
});

export const NUMERACY_STRANDS = [
  strand({
    id: 'NUM.QUANTITY',
    code: 'N0',
    rung: 0,
    nameAr: 'إدراك الكمية',
    nameEn: 'Quantity awareness',
    descAr: 'التعرّف الفوري على كمية صغيرة (حتى ٤) والمقارنة البصرية',
    descEn: 'Instantly recognising a small quantity (up to 4) and comparing visually',
    templates: ['TPL-AR_SUBITIZE'],
    research: ['C8'],
    max_set_size: SUBITIZING_MAX,
  }),

  // ── rung 1 — COUNTING ‖ CARDINALITY. See the header. ─────────────────────
  strand({
    id: 'NUM.COUNTING',
    code: 'N1',
    rung: 1,
    nameAr: 'العدّ',
    nameEn: 'Counting',
    descAr: 'العدّ بالإشارة إلى كل عنصر مرّة واحدة، بترتيب ثابت',
    descEn: 'Counting each item once, in a stable order',
    templates: ['TPL-AR_COUNT'],
    research: ['C4', 'D10'],
  }),
  strand({
    id: 'NUM.CARDINALITY',
    code: 'N1c',
    rung: 1, // PARALLEL with counting, NOT after it — C1, C2, D10
    nameAr: 'فهم العدد الكلي',
    nameEn: 'Cardinality',
    descAr: 'إعطاء عدد مطلوب من الأشياء ("هاتلي تلاتة")',
    descEn: 'Giving a requested number of objects ("give me three")',
    templates: ['TPL-AR_GIVE_N'],
    research: ['C1', 'C2', 'C3', 'D10'],
    independent_of: ['NUM.COUNTING'],
    _why_parallel: 'C1: CP-knowers enumerate only 3-4 items. D10: DS/TD differed on count length but NOT on cardinality.',
  }),

  strand({
    id: 'NUM.NUMERAL',
    code: 'N2',
    rung: 2,
    nameAr: 'التعرّف على الأرقام',
    nameEn: 'Numeral recognition',
    descAr: 'التعرّف على الرقم المكتوب ومطابقته بكمية',
    descEn: 'Recognising a written numeral and matching it to a quantity',
    templates: ['TPL-AR_NUMERAL', 'TPL-AR_NUMERAL_TO_QTY'],
    research: ['C1', 'C7'],
    /**
     * Deliberately independent of cardinality. A child can know that "three"
     * means three things without recognising the glyph ٣, and vice versa.
     * Scenario I in the Phase 5 brief tests exactly this dissociation.
     */
    independent_of: ['NUM.CARDINALITY'],
    /** Eastern Arabic numerals as used in Egyptian schooling. */
    numeral_set: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
  }),

  strand({
    id: 'NUM.COMPARISON',
    code: 'N3',
    rung: 3,
    nameAr: 'المقارنة بين الكميات',
    nameEn: 'Quantity comparison',
    descAr: 'تحديد أي مجموعة أكبر أو أصغر أو متساوية',
    descEn: 'Deciding which group is larger, smaller, or the same',
    templates: ['TPL-AR_COMPARE'],
    research: ['C5', 'C7'],
    /** Comparison cannot avoid relational language — flagged, not hidden. */
    language_light: false,
    _language_note: 'E8 — relational vocabulary is itself a known difficulty. A failure here may be linguistic.',
  }),

  strand({
    id: 'NUM.SEQUENCE',
    code: 'N4',
    rung: 4,
    nameAr: 'تسلسل الأعداد',
    nameEn: 'Number sequence',
    descAr: 'إكمال تسلسل عددي أو إيجاد العدد الناقص',
    descEn: 'Continuing a number sequence or finding the missing number',
    templates: ['TPL-AR_SEQUENCE'],
    research: ['C4'],
    _why: 'C4 — advanced counting (forward/backward from a given number) predicts later maths better than basic counting.',
  }),

  strand({
    id: 'NUM.OPERATIONS',
    code: 'N5',
    rung: 5,
    nameAr: 'العمليات البسيطة',
    nameEn: 'Early operations',
    descAr: 'جمع وطرح كميات صغيرة',
    descEn: 'Adding and taking away small quantities',
    templates: ['TPL-AR_ADD_SMALL'],
    research: ['C5', 'C7'],
    language_light: false,
  }),

  strand({
    id: 'NUM.PATTERN',
    code: 'N6',
    rung: 6,
    nameAr: 'الأنماط',
    nameEn: 'Patterns',
    descAr: 'إكمال نمط متكرر بصري أو عددي',
    descEn: 'Completing a repeating visual or numeric pattern',
    templates: ['TPL-AR_PATTERN'],
    research: ['C6'],
    reuses_sub_measure: 'VSP.PATTERN',
    _why: 'C6 — patterning added unique variance to numeracy after controlling for reasoning, working memory and spatial skill. Reported against numeracy as well as visuospatial.',
  }),

  strand({
    id: 'NUM.FUNCTIONAL',
    code: 'N7',
    rung: 7,
    nameAr: 'الرياضيات في الحياة اليومية',
    nameEn: 'Functional maths',
    descAr: 'الفلوس والوقت والمقارنات اليومية',
    descEn: 'Money, time and everyday comparison',
    templates: ['TPL-AR_MONEY', 'TPL-AR_TIME'],
    research: ['F8'],
    language_light: false,
    /**
     * F8 found functional money and time skills are central to what is
     * actually taught to this population — 75% of reviewed studies. But NO
     * source was found on WHERE these sit developmentally relative to core
     * number skills, so this rung's POSITION is an engineering assumption.
     */
    _position_validation: VALIDATION.ENGINEERING_ASSUMPTION,
    _position_note: 'matrix C-gaps — no developmental sequencing evidence found for money/time.',
  }),
];

export const NUMERACY_META = {
  id: 'NUMERACY',
  nameAr: 'الحساب',
  nameEn: 'Numeracy',
  numeral_system: 'EASTERN_ARABIC',
  language_policy: 'LANGUAGE_LIGHT_BY_DEFAULT',
  _language_policy_source: 'matrix E8 — applied to every child, never as a syndrome branch',
  independent_of_literacy: true,
  _independence_source: 'matrix D11 — arithmetic and reading dissociate',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
};
