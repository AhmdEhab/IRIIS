/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║  DEPRECATED — DIAGNOSIS-BASED PEDAGOGY HAS BEEN REMOVED                ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS FILE USED TO CONTAIN, AND WHY IT WAS REMOVED
 * ------------------------------------------------------
 * This file previously held a lookup table keyed on the child's DIAGNOSIS that
 * set their learning modality, teaching strategy, content order, session
 * length, and assessment focus. Concretely it asserted:
 *
 *     down-syndrome → visualPriority 'high', nonVerbalWeight 0.8,
 *                     assessmentFocus 'visual', feedbackStyle 'visual-primary'
 *     williams      → auditoryHook true, verbalWeight 0.7,
 *                     assessmentFocus 'auditory', feedbackStyle 'auditory-primary'
 *
 * Those are exactly the two claims the project's own evidence review names as
 * FORBIDDEN by name:
 *   - 31_CLAIMS_WE_MUST_NOT_MAKE.md §I1 "Down syndrome → visual learner"
 *     — contradicted three separate times inside the corpus's own cited tables.
 *   - 31_CLAIMS_WE_MUST_NOT_MAKE.md §I2/§I3 "Williams syndrome → language /
 *     auditory learner" — the corpus exists in part to correct this claim.
 *
 * The session-length values (15 / 10 / 12 / 20 minutes) had no evidence at all:
 * 29_RESEARCH_GAPS_REGISTER.md §F records that not one session length appears
 * anywhere in the entire research corpus, for either syndrome, at any age.
 *
 * WHAT REPLACED IT
 * ----------------
 * Pedagogical decisions now come from the child's OWN OBSERVED PERFORMANCE via
 * the specification engines:
 *   - src/iris/engines/assessment.js  (doc 11)  — what the child actually did
 *   - src/iris/engines/profile.js     (doc 12)  — intra-individual profile
 *   - src/iris/engines/goals.js       (doc 13)  — which goal, which level
 *   - src/iris/engines/pathway.js     (doc 14)  — advance / repeat / simplify /
 *                                                 shift modality / step back
 *
 * Diagnosis now touches EXACTLY ONE thing, and only because doc 11 §1 expressly
 * permits it: the ACCESS accommodation defaults (extra time, audio repeat,
 * reduced animation). See `accommodationDefaults()` in src/iris/journey.js.
 * Those affect presentation and timing only — never scoring, never item
 * selection, never difficulty, never the pathway. They are parent-overridable.
 *
 * THIS FILE IS KEPT ONLY AS A COMPATIBILITY SHIM so that legacy screens which
 * still import `activeRules` keep compiling during the migration. Every value
 * below is now a SINGLE NEUTRAL DEFAULT, identical for every child regardless
 * of diagnosis. `getRulesForCondition` deliberately ignores its argument.
 *
 * Do not add a diagnosis branch here. TEST-PATH-BLIND will fail if you do.
 */

export type SyndromeRuleSet = {
  /** @deprecated presentation default only — no longer diagnosis-derived */
  repetitionFrequency: 'high' | 'standard';
  /** @deprecated presentation default only */
  sensoryProfile: 'standard' | 'low-arousal';
  /** @deprecated presentation default only */
  animationIntensity: 'high' | 'medium' | 'low';
  /** @deprecated presentation default only */
  advanceMode: 'auto' | 'tap' | 'both';
  /** @deprecated presentation default only */
  errorHandling: 'gentle-redirect' | 'errorless' | 'standard';
  /** @deprecated no longer used for pedagogy — the goals engine owns ordering */
  moduleOrder: string[];
  /** @deprecated interaction sizing default */
  gameAdjustments: {
    balloonPopStyle: 'pop' | 'dissolve';
    memoryGameHints: boolean;
    hitboxScaling: number;
  };
  /** @deprecated content sizing default — the pathway engine hands down item counts */
  contentComplexity: {
    '3-5': { itemCount: number; stepsPerTask: number };
    '6-8': { itemCount: number; stepsPerTask: number };
    '9-12': { itemCount: number; stepsPerTask: number };
  };
};

/**
 * The ONE neutral default. Identical for every child.
 *
 * These are accessibility-friendly presentation defaults chosen to be
 * conservative for all users (large touch targets, gentle error handling,
 * moderate motion). They are ENGINEERING ASSUMPTIONS, not research findings,
 * and they are not derived from any diagnosis.
 */
export const NEUTRAL_PRESENTATION_DEFAULTS: SyndromeRuleSet = {
  repetitionFrequency: 'standard',
  sensoryProfile: 'standard',
  animationIntensity: 'medium',
  advanceMode: 'both',
  errorHandling: 'gentle-redirect',
  moduleOrder: [],
  gameAdjustments: {
    balloonPopStyle: 'pop',
    memoryGameHints: true,
    hitboxScaling: 1.3, // ≥96px touch targets for everyone (doc 15 §7)
  },
  contentComplexity: {
    '3-5': { itemCount: 8, stepsPerTask: 3 },
    '6-8': { itemCount: 8, stepsPerTask: 3 },
    '9-12': { itemCount: 8, stepsPerTask: 3 },
  },
};

/** @deprecated Kept so legacy imports resolve. There is only one rule set now. */
export const SYNDROME_RULES: Record<string, SyndromeRuleSet> = {
  default: NEUTRAL_PRESENTATION_DEFAULTS,
};

/**
 * @deprecated The `condition` argument is IGNORED BY DESIGN.
 *
 * The signature is preserved so existing call sites keep compiling, but the
 * function is a constant: every child receives the same presentation defaults.
 * Personalization comes from measured performance, not from a diagnosis.
 */
export function getRulesForCondition(_condition?: string): SyndromeRuleSet {
  return NEUTRAL_PRESENTATION_DEFAULTS;
}
