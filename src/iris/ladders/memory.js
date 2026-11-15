/**
 * IRIS — Memory & attention ladder (av2, directive domain F).
 *
 * ── WHAT THIS LADDER IS FOR ───────────────────────────────────────────────
 * Short, observable working-memory tasks: what disappeared from a small set,
 * repeating a two-step order, and which of two items came first. These sit
 * underneath many school-style tasks without being scored by them — which is
 * exactly the attribution problem the directive names: a failed counting item
 * may be a memory item in disguise.
 *
 * ── ATTENTION IS OBSERVED, NEVER SCORED ───────────────────────────────────
 * There is deliberately NO ATT strand here. Directive domain F pairs memory
 * with attention, but the av2 spec (§2) mandates that attention is captured
 * as `attention_observations` — engagement metrics (completed %, off-task
 * pauses) carried as DATA QUALITY ONLY, never an ATT score, never an ability
 * claim, never a clinical statement. Matrix F6 found no usable
 * fatigue/attention evidence for this population; inventing an attention rung
 * would be exactly the unsupported domain the directive forbids. The
 * ATTENTION_POLICY export below is the machine-readable statement of that.
 *
 * ── NO CLINICAL CLAIM ─────────────────────────────────────────────────────
 * These are performance-within-a-task records, not a memory assessment. "Do
 * not claim to measure a clinical memory or attention condition" (directive
 * §2.F). Each estimate says what the child did in these items, today.
 *
 * ── DIAGNOSIS-BLINDNESS ───────────────────────────────────────────────────
 * No function here, and no strand field, accepts or reads `condition`.
 *
 * ── RUNG PLACEMENT HONESTY ────────────────────────────────────────────────
 * disappearing-display (immediate perceptual comparison) → two-step order
 * recall → temporal order judgement is an engineering ordering of increasing
 * manipulation load. E8 found relational/working-memory demands a specific
 * weakness in Williams syndrome — which is why these tasks exist on their own
 * track and why a LIT/NUM failure may be attributed to them; it is NOT a
 * licence to route by diagnosis. The same tasks run for every child.
 */
import { VALIDATION, SPECIALIST_REVIEW } from '../spec.js';

/**
 * The attention rule, as data. `scored: false` is load-bearing — a consumer
 * that finds an `ATT.*` strand id anywhere has built something the spec
 * forbids.
 */
export const ATTENTION_POLICY = {
  scored: false,
  recorded_as: 'attention_observations',
  metrics: ['completed_percent', 'off_task_pauses'],
  feeds: ['data_quality', 'visit_validity'],
  never_feeds: ['indicator', 'skill_estimate', 'learning_priority', 'difficulty'],
  _source: 'av2 spec §2 domain F; matrix F6 (no usable fatigue/attention evidence)',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
};

const strand = (o) => ({
  ladder: 'MEM',
  track: 'MAIN',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  language_light: true,
  independent_of: ['LITERACY', 'NUMERACY', 'VSP'],
  _why_independent: 'av2 §2: MEM presence never unlocks or gates LIT/NUM/VSP probing — and the reverse.',
  ...o,
});

export const MEM_STRANDS = [
  strand({
    id: 'MEM.VISUAL_STM',
    code: 'W0',
    rung: 0,
    nameAr: 'إيه اللي اختفت؟',
    nameEn: 'What disappeared?',
    descAr: 'مقارنة ثلاث صور بترتين واختيار اللي مش موجودة في التانية',
    descEn: 'Comparing three pictures across two displays and naming the one that went',
    templates: ['TPL-AR_MEM_DISAPPEARED', 'TPL-AR_MEM_DISAPPEARED_LISTEN'],
    research: ['C8'],
    reuses_sub_measure: 'MEM.VISUAL_STM',
    set_size: 3,
    _position_validation: VALIDATION.ENGINEERING_ASSUMPTION,
  }),
  strand({
    id: 'MEM.SEQUENCE',
    code: 'W1',
    rung: 1,
    nameAr: 'اعمل بالترتيب',
    nameEn: 'Repeat the order',
    descAr: 'تنفيذ ترتيب من حاجتين — اتعرض وشايفه ومسموع',
    descEn: 'Carrying out a two-step order that was shown AND spoken',
    templates: ['TPL-AR_MEM_SEQUENCE', 'TPL-AR_MEM_SEQUENCE_LISTEN'],
    research: ['C6', 'E8'],
    wm_load: 'WORKING_MEMORY',
    _paired_modality: 'shown + spoken by default (paired modality), per av2 §2 domain F.',
    _note_vs_listening:
      'LIT.LISTEN_INSTRUCTION measures the language route to the same behaviour; this measures holding an order in mind after it is no longer needed as a sentence. Different construct, separate track — neither scores the other.',
  }),
  strand({
    id: 'MEM.MEDIAL',
    code: 'W2',
    rung: 2,
    nameAr: 'إيه اللي جه الأول؟',
    nameEn: 'Which came first?',
    descAr: 'افتكر ترتيب حاجتين اتعرضوا واحد ورا التاني',
    descEn: 'Recalling which of two items was shown first in a short sequence',
    templates: ['TPL-AR_MEM_MEDIAL_FIRST', 'TPL-AR_MEM_MEDIAL_LAST'],
    research: ['E8'],
    _position_validation: VALIDATION.ENGINEERING_ASSUMPTION,
  }),
];

export const MEM_META = {
  id: 'MEM',
  nameAr: 'الذاكرة والانتباه',
  nameEn: 'Memory and attention',
  attention: ATTENTION_POLICY,
  clinical_claim: 'NONE',
  _note_en:
    'Domain F of the av2 directive. Performance-within-task records only. No clinical memory or attention condition is measured or implied, and attention is never scored.',
  _note_ar:
    'مجال F في خطة av2. بنسجّل الأداء جوه المهمة نفسها بس — مفيش ادعاء بقياس حالة ذاكرة أو انتباه، والانتباه ما ياخدش درجة.',
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
};
