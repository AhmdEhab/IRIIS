/**
 * IRIS — Expressive communication track (av2, directive domain A).
 *
 * Sits INSIDE the LITERACY ladder as its own parallel track `COMM`, next to
 * LISTENING: receptive language is already measured there (LC0–LC3); what was
 * missing was the child's own expressive channel — can he make a choice known,
 * can he name something. Domain A of the directive asks exactly that.
 *
 * ── THE HARD RULE: NOTHING HERE EVER REQUIRES VOCAL OUTPUT ────────────────
 * Every COMM item is answerable by tapping, pointing, or a helper-confirmed
 * response of ANY kind — vocalisation, sign, gaze-adjacent pointing, an AAC
 * press. `vocal_required: false` is set on every template and every item, and
 * the av2 spec (§2 anti-rules) states it plainly: COMM expressive items NEVER
 * require vocal output. A non-vocal child answering by point is recorded
 * `demonstrated_independent`, exactly like a vocal child answering by word.
 * Research basis: Chapman (D9) found the Down syndrome expressive "deficit"
 * largely disappears once a preview and picture support are given — the
 * honest reading is that demanding speech measures the channel, not the
 * skill. Directive §1.A: "Do not assume that spoken language is the only
 * valid way to communicate."
 *
 * ── WHAT A COMM RESULT DOES AND DOES NOT MEAN ─────────────────────────────
 * It is read by the profile as a CHANNEL description (how this child makes
 * themselves known), never as a language-comprehension score — LISTENING owns
 * comprehension — and never as a literacy prerequisite. A child with a strong
 * COMM position and a LITERACY floor has a real, common, and non-contradictory
 * profile (opportunity ≠ ability, directive §2 domain rules).
 *
 * ── DIAGNOSIS-BLINDNESS ───────────────────────────────────────────────────
 * No function here, and no strand field, accepts or reads `condition`.
 *
 * ⚠ The two-rung structure is the minimum validateLadders accepts (a track
 * needs ≥2 rungs to be adaptive). Choice-making sits below labelling because
 * choosing requires holding one preference while an adult controls the
 * interface, and naming requires generating the response unprompted — an
 * engineering ordering, flagged as such below.
 */
import { VALIDATION, SPECIALIST_REVIEW } from '../spec.js';

const strand = (o) => ({
  ladder: 'LITERACY',
  track: 'COMM',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  vocal_required: false,
  response_modes: ['tap', 'point', 'any_vocal_helper_confirmed', 'aac_press'],
  independent_of: ['LIT.READINESS', 'LIT.LISTEN_WORD'],
  _why_independent:
    'COMM is the expressive channel; LITERACY/MAIN is printed symbols; LISTENING is comprehension. av2 §2: none gates another, and COMM never gates or is gated by vocal ability.',
  ...o,
});

export const COMM_STRANDS = [
  strand({
    id: 'COMM.EXPRESS_CHOICE',
    code: 'X0',
    rung: 0,
    nameAr: 'يختار ويوصّل اختياره',
    nameEn: 'Makes a choice known',
    descAr: 'اختار حاجة من اتنين — بإيده أو بعينه أو بصوته — والكبار يدوّسوا له',
    descEn: 'Picks one of two — by hand, point, gaze-adjacent point, or sound — an adult taps for him',
    templates: ['TPL-AR_COMM_CHOICE', 'TPL-AR_COMM_CHOICE_LISTEN'],
    research: ['D9'],
    any_response_is_success: true,
    _position_validation: VALIDATION.ENGINEERING_ASSUMPTION,
    _why: 'D9 — with preview and picture support the expressive difference narrows sharply; a choice board is the lowest-demand expressive channel.',
  }),
  strand({
    id: 'COMM.LABEL',
    code: 'X1',
    rung: 1,
    nameAr: 'يسمّي الصورة',
    nameEn: 'Names the picture',
    descAr: 'تسمية صورة مألوفة — أي رد مقبول: كلمة، محاولة كلام، إشارة، أو ضغطة على البديل',
    descEn: 'Names a familiar picture — ANY output accepted: a word, a vocal attempt, a sign, or a tap on the matching picture',
    templates: ['TPL-AR_COMM_LABEL', 'TPL-AR_COMM_LABEL_POINT'],
    research: ['D9', 'C8'],
    any_response_is_success: true,
    _acceptance_rule:
      'Helper-confirm on ANY vocal attempt; tap-the-picture is the equal fallback. There is no wrong answer on this strand — only the channel that answered.',
    _position_validation: VALIDATION.ENGINEERING_ASSUMPTION,
  }),
];

export const COMM_META = {
  id: 'COMM',
  ladder: 'LITERACY',
  track: 'COMM',
  nameAr: 'التعبير والتوصيل',
  nameEn: 'Expressive communication',
  vocal_required_anywhere: false,
  _note_en:
    'Domain A of the av2 directive, expressive side. Tap/point/helper-confirm ONLY. Never scores speech; never withholds a result from a non-vocal child.',
  _note_ar:
    'مجال A في خطة av2 — ناحية التعبير. الرد بالإيد أو الإشارة أو تأكيد الكبير لأي صوت. مفيش أي سؤال بيطلب كلام، ومفيش طفل بيتحرم من نتيجة لأنه مش بيتكلم.',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
};
