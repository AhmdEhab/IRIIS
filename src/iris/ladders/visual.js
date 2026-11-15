/**
 * IRIS — Visual recognition & matching ladder (av2, directive domain E).
 *
 * ── WHAT THIS LADDER IS FOR ───────────────────────────────────────────────
 * Non-symbolic visual discrimination: matching identical pictures, finding
 * the different one, sorting by a basic property, extending a visual pattern.
 * These are the sample demands underneath a lot of early literacy and
 * numeracy items — which is exactly WHY they get their own ladder:
 *
 *   - LIT.READINESS `reuses_sub_measure: 'VSP.MATCHING'` and NUM.PATTERN
 *     `reuses_sub_measure: 'VSP.PATTERN'`. When a readiness or pattern item
 *     is failed, IRIS currently cannot tell whether the child struggled with
 *     the visual demand or the letter/quantity demand. Measuring the visual
 *     demand directly, on its own track, makes that attribution possible —
 *     the same reasoning that split letter→sound from sound→letter (A4).
 *   - Presence of this ladder NEVER unlocks, gates, or explains a LIT/NUM
 *     position, in either direction. Track independence (`independent_of`
 *     doctrine, see ladders/index.js): a child can top this ladder and floor
 *     letter names, or the reverse, and both readings are honest.
 *
 * ── DIAGNOSIS-BLINDNESS ───────────────────────────────────────────────────
 * No function here, and no strand field, accepts or reads `condition`. The
 * rung order is identical for every child.
 *
 * ── RUNG PLACEMENT HONESTY ────────────────────────────────────────────────
 * match → difference → sort → pattern is the conventional perceptual
 * difficulty order (discriminate identical, then odd-one-out, then hold two
 * properties in mind, then extrapolate a repeat). No retrieved source supplies
 * the developmental sequence FOR THIS POPULATION, so the positions carry
 * ENGINEERING_ASSUMPTION and the ladder ships as a research-informed
 * prototype, not a validated scale.
 */
import { VALIDATION, SPECIALIST_REVIEW } from '../spec.js';

const strand = (o) => ({
  ladder: 'VSP',
  track: 'MAIN',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  language_light: true,
  independent_of: ['LIT.READINESS', 'NUM.PATTERN'],
  _why_independent: 'av2 §2: VSP presence never unlocks or gates LIT/NUM probing — and the reverse.',
  ...o,
});

export const VSP_STRANDS = [
  strand({
    id: 'VSP.MATCH',
    code: 'V0',
    rung: 0,
    nameAr: 'مطابقة الصور المتطابقة',
    nameEn: 'Matching identical pictures',
    descAr: 'مقارنة صورة بصورة مماثلة لها بالظبط من غير أسماء ولا حروف',
    descEn: 'Comparing a picture to its exact match — no names, no letters',
    templates: ['TPL-AR_VSP_MATCH', 'TPL-AR_VSP_MATCH_LISTEN'],
    research: ['A1'],
    reuses_sub_measure: 'VSP.MATCHING',
    _position_validation: VALIDATION.ENGINEERING_ASSUMPTION,
  }),
  strand({
    id: 'VSP.DIFFERENCE',
    code: 'V1',
    rung: 1,
    nameAr: 'لقيه الحاجة المختلفة',
    nameEn: 'Finding the different one',
    descAr: 'اختيار العنصر اللي مش زي الباقي في مجموعة',
    descEn: 'Choosing the element that does not belong in a small set',
    templates: ['TPL-AR_VSP_DIFFERENCE', 'TPL-AR_VSP_DIFFERENCE_LISTEN'],
    research: ['A1'],
    _position_validation: VALIDATION.ENGINEERING_ASSUMPTION,
  }),
  strand({
    id: 'VSP.SORT',
    code: 'V2',
    rung: 2,
    nameAr: 'التجميع بالاسم أو اللون',
    nameEn: 'Sorting by kind or colour',
    descAr: 'ضم الحاجة لغيرها حسب نوعها أو لونها',
    descEn: 'Grouping an item with its kind or colour',
    templates: ['TPL-AR_VSP_SORT', 'TPL-AR_VSP_SORT_COLOR'],
    research: ['C7'],
    _position_validation: VALIDATION.ENGINEERING_ASSUMPTION,
  }),
  strand({
    id: 'VSP.PATTERN',
    code: 'V3',
    rung: 3,
    nameAr: 'كمّل الشكل اللي بيتكرر',
    nameEn: 'Extending a visual pattern',
    descAr: 'إكمال نمط بصري متكرر — من غير أرقام ولا عدّ',
    descEn: 'Completing a repeating visual pattern — no numerals, no counting',
    templates: ['TPL-AR_VSP_PATTERN', 'TPL-AR_PATTERN'],
    research: ['C6'],
    reuses_sub_measure: 'VSP.PATTERN',
    /**
     * C6 reported patterning adding unique variance to numeracy AFTER
     * controlling for visual-spatial skill — the two are related but distinct.
     * This strand is the pure visual-spatial side; NUM.PATTERN keeps the
     * numeric-adjacent side. Neither one stands in for the other.
     */
    _why: 'C6 — patterning relates to but is not identical with numeracy; measured separately on purpose.',
  }),
];

export const VSP_META = {
  id: 'VSP',
  nameAr: 'الإدراك البصري',
  nameEn: 'Visual recognition and matching',
  language_policy: 'LANGUAGE_LIGHT_BY_DEFAULT',
  independent_of_ladders: ['LITERACY', 'NUMERACY'],
  _note_en:
    'Domain E of the av2 directive. Non-symbolic visual tasks. Never used to infer or gate a literacy or numeracy position.',
  _note_ar:
    'مجال E في خطة av2. مهام بصرية من غير رموز — ميستخدموش أبدًا للحكم على القراءة أو الحساب ولا للعكس.',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
};
