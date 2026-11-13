/**
 * IRIS — Shared specification constants.
 *
 * Every value here traces to a numbered rule in research_deliverables/10–16.
 * Values tagged ENGINEERING_ASSUMPTION are NOT research-derived and are
 * deliberately kept in one place so a specialist can change them without
 * touching engine logic.
 *
 * VALIDATION STATUS VOCABULARY — used across the whole codebase.
 */
export const VALIDATION = {
  RESEARCH_SUPPORTED: 'RESEARCH_SUPPORTED',
  ENGINEERING_ASSUMPTION: 'ENGINEERING_ASSUMPTION',
  SPECIALIST_REVIEW_REQUIRED: 'SPECIALIST_REVIEW_REQUIRED',
  RESEARCH_GAP: 'RESEARCH_GAP',
  RESEARCH_INFORMED_PROTOTYPE: 'RESEARCH_INFORMED_PROTOTYPE',
};

export const SPECIALIST_REVIEW = {
  NOT_REVIEWED: 'NOT_REVIEWED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/** Content review gate (doc 15 §5) — only APPROVED may be served to a child. */
export const REVIEW_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/** The nine sub-measures (doc 11 §3). */
export const SUB_MEASURES = [
  'LANG.RECEP_VOCAB',
  'LANG.INSTRUCTION',
  'LANG.PHON_AWARE',
  'MEM.VERBAL_STM',
  'MEM.VISUAL_STM',
  'ATT.SUSTAINED',
  'ATT.SELECTIVE',
  'VSP.MATCHING',
  'VSP.PATTERN',
];

/**
 * DPS weights — doc 11 §5.
 * ENGINEERING_ASSUMPTION [B]: "Weights 0.50 / 0.30 / 0.20 are an engineering
 * assumption requiring specialist validation."
 */
export const DPS_WEIGHTS = {
  accuracy: 0.5,
  depth: 0.3,
  independence: 0.2,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 11 §5',
};

/**
 * Profile thresholds — doc 12.
 * ENGINEERING_ASSUMPTION [B] throughout (doc 12 §9).
 */
export const PROFILE = {
  DISCREPANCY: 8, // R-PROFILE-002, ±8
  MAX_STRENGTHS: 2, // R-PROFILE-004
  MAX_SUPPORT_AREAS: 3, // R-PROFILE-004
  LEVEL_BANDS: [
    { max: 34, level: 1 },
    { max: 54, level: 2 },
    { max: 74, level: 3 },
    { max: 100, level: 4 },
  ], // R-PROFILE-006
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 12 §2–§4, §9',
};

/**
 * Band classification cut-points — doc 14 R-PATH-001.
 * ENGINEERING_ASSUMPTION [B]: doc 14 states no source in documents 01–09
 * supplies these values. Do not change without specialist authorization.
 */
export const BANDS = {
  LOW_ACCURACY_BELOW: 0.5,
  HIGH_ACCURACY_AT_LEAST: 0.8,
  HIGH_INDEPENDENCE_AT_LEAST: 0.7,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 14 R-PATH-001',
};

/**
 * Mastery — doc 13 R-GOAL-006.
 * ENGINEERING_ASSUMPTION [B]: "conventional mastery-learning values… no source
 * in documents 01–09 supplies them."
 */
export const MASTERY = {
  CONSECUTIVE_HIGH_SESSIONS: 2,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 13 R-GOAL-006',
};

/** Assessment timing/stop rules — doc 11 §4. All ENGINEERING_ASSUMPTION [B]. */
export const ASSESSMENT_CONFIG = {
  ADVANCE_STEP_AT_CORRECT: 2, // R-ASSESS-001
  DISCONTINUE_AFTER_CONSECUTIVE_WRONG: 2, // R-ASSESS-001
  MAX_HINTS_PER_ITEM: 1, // R-ASSESS-002
  HINT_DELAY_MS: 8000,
  HINT_DELAY_MS_EXTENDED: 12000,
  TIMEOUT_MS: 20000,
  TIMEOUT_MS_EXTENDED: 30000,
  RAPID_RESPONSE_MS: 600, // R-ASSESS-005
  RAPID_RESPONDING_RATIO: 0.3,
  HIGH_TIMEOUT_RATIO: 0.25,
  MIN_SCOREABLE_ITEMS: 3,
  MAX_INTERRUPTIONS: 2,
  ATTENTION_TASK_SECONDS: 60,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 11 §4, §9',
};

/** Adaptation cadence — doc 14 R-PATH-005..008. ENGINEERING_ASSUMPTION [B]. */
export const PATHWAY_CONFIG = {
  SIMPLIFY_AT_CONSECUTIVE_LOW: 1, // R-PATH-005
  MODALITY_SHIFT_AT_CONSECUTIVE_LOW: 2, // R-PATH-006
  BACKSTEP_AT_CONSECUTIVE_LOW: 3, // R-PATH-007
  REPEAT_CAP: 3, // R-PATH-008
  HOLD_LOW_CONFIDENCE_SESSIONS: 2, // R-PATH-002
  MAX_LEVEL: 4,
  MIN_LEVEL: 1,
  REDUCED_ITEMS_FACTOR: 2 / 3, // ~1/3 reduction
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 14 §3, §9',
};

/** Progress — doc 16 R-PROG-001..006. ENGINEERING_ASSUMPTION [B]. */
export const PROGRESS_CONFIG = {
  WINDOW_DAYS: 7, // R-PROG-001
  MIN_SESSIONS_FOR_TREND: 3, // R-PROG-003
  TREND_DELTA: 0.1, // R-PROG-003
  REASSESS_DAYS: 30, // R-PROG-006
  REASSESS_GOALS_MASTERED: 2,
  REASSESS_BACKSTEPS: 2,
  REASSESS_BACKSTEP_WINDOW_DAYS: 14,
  REASSESS_ENGAGEMENT_FLAGS: 2,
  REASSESS_NOT_DETERMINED_DAYS: 14,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 16 §R-PROG',
};

/** Engagement flag — doc 14 R-PATH-010. ENGINEERING_ASSUMPTION [C]. */
export const ENGAGEMENT_CONFIG = {
  TIMEOUT_NO_TAP_RATIO: 0.4,
  RAPID_RESPONSE_RATIO: 0.5,
  RAPID_RESPONSE_MS: 600,
  ABANDON_BEFORE_RATIO: 0.25,
  CONSECUTIVE_FLAGS_TO_SUGGEST_REASSESS: 2,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 14 R-PATH-010',
};

/**
 * Accommodation defaults by condition — doc 11 §1.
 *
 * THIS IS THE ONLY PLACE IN IRIS WHERE `condition` IS READ, AND IT IS
 * EXPRESSLY PERMITTED BY doc 11 §1:
 *   "Condition-conditioned differences are limited to accommodation defaults,
 *    never to task difficulty, scoring, or which sub-measures are measured."
 *
 * These are ACCESS supports (time, repeat, animation). They never enter
 * scoring, never select items, never change difficulty, never touch the
 * pathway. All are parent-visible and parent-overridable.
 */
export const ACCOMMODATION_DEFAULTS = {
  DOWN_SYNDROME: ['EXTENDED_TIME', 'SIMPLIFIED_INSTRUCTION', 'AUDIO_REPEAT'],
  WILLIAMS_SYNDROME: ['EXTENDED_TIME', 'REDUCED_ANIMATION', 'MUTED_BACKGROUND_AUDIO'],
  OTHER: ['EXTENDED_TIME'],
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'doc 11 §1 [B]',
};

/** R-ASSESS-006 — accommodations that would remove the measured construct. */
export const FORBIDDEN_ACCOMMODATIONS_BY_TASK = {
  'T-L2': ['SIMPLIFIED_INSTRUCTION'], // simplifying IS removing what is measured
  _source: 'doc 11 §6 R-ASSESS-006',
};

/** Banned terms in any child- or parent-facing text (doc 15 §6). */
export const BANNED_TERMS = [
  'deficit', 'impairment', 'disorder', 'abnormal', 'retarded',
  'low-functioning', 'suffers from', 'victim', 'handicapped',
  'normal children', 'slow learner',
  'iq', 'percentile', 'age equivalent', 'age-equivalent',
];

/** Required disclaimer on every profile view (doc 12 §6). */
export const PROFILE_DISCLAIMER = {
  en: 'This is an IRIS learning screening, not a medical or psychological assessment. It shows how your child did on these specific activities today. It is not an IQ test and cannot diagnose anything. Children often do better than a single session suggests.',
  ar: 'هذا فحص تعليمي أوّلي من IRIS، وليس تقييمًا طبيًا أو نفسيًا. هو يوضّح كيف كان أداء طفلك في هذه الأنشطة تحديدًا اليوم. ليس اختبار ذكاء ولا يمكنه تشخيص أي شيء. كثيرًا ما يكون أداء الأطفال أفضل مما تُظهره جلسة واحدة.',
};
