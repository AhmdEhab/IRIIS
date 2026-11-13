/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║  DEPRECATED — DIAGNOSIS-BASED TEACHING SEQUENCES HAVE BEEN REMOVED     ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * WHAT WAS REMOVED, AND WHY
 * -------------------------
 * This file previously defined a different teaching sequence per diagnosis
 * ("DOWN SYNDROME: Visual First", "WILLIAMS SYNDROME: Auditory First, Social,
 * Musical") and carried research citations in its comments.
 *
 * Two separate problems, both serious:
 *
 * 1. THE CLAIMS ARE FORBIDDEN. 31_CLAIMS_WE_MUST_NOT_MAKE.md §I1/§I2/§I3/§I4
 *    name "DS → visual learner", "WS → language learner", "WS → auditory
 *    learner" and "WS → social learner" as forbidden inferences.
 *
 * 2. ONE CITATION WAS MISATTRIBUTED. The file cited "(Mervis & John, 2010)" as
 *    evidence that Williams syndrome means auditory/social learning. That
 *    source IS in the evidence corpus (source S7) — and it is the source that
 *    states these apparent strengths "may mislead" a professional about the
 *    child's actual needs. The code cited a real paper as supporting the claim
 *    that paper warns against. Citing a source for the opposite of what it says
 *    is worse than citing nothing, so both citations were removed rather than
 *    softened.
 *
 * WHAT REPLACED IT
 * ----------------
 * Presentation sequencing is now uniform, and *adaptation* is driven by the
 * child's measured performance through src/iris/engines/pathway.js. When a
 * child struggles, R-PATH-005 reduces task load first; only if that fails does
 * R-PATH-006 shift modality — and the alternate modality is chosen from the
 * template's declared partner, never from a diagnosis table.
 *
 * This file is a compatibility shim. Do not reintroduce a diagnosis branch.
 */

export type LearningStep = {
  type: 'visual' | 'audio' | 'visual-audio' | 'interaction' | 'feedback' | 'context' | 'song' | 'social' | 'letter-name' | 'letter-sound';
  duration: number;
  silent?: boolean;
  autoAdvance?: boolean;
  blur?: boolean;
  enthusiastic?: boolean;
  waitForTap?: boolean;
};

export type SyndromeSequence = {
  intro: LearningStep[];
  learning: LearningStep[];
  feedback: LearningStep[];
};

/**
 * The ONE neutral sequence, used for every child.
 *
 * Multimodal by default: the item is shown AND named, so no child is forced
 * down a single channel by a default. Which channel actually suits a given
 * child is discovered from their performance, not assumed in advance.
 *
 * ENGINEERING ASSUMPTION — durations are conservative defaults, not research
 * findings. 29_RESEARCH_GAPS_REGISTER.md §F confirms no timing evidence exists.
 */
export const NEUTRAL_SEQUENCE: SyndromeSequence = {
  intro: [
    { type: 'visual-audio', duration: 2500, waitForTap: false },
  ],
  learning: [
    { type: 'visual-audio', duration: 2500, waitForTap: false },
    { type: 'interaction', duration: 0, waitForTap: true },
  ],
  feedback: [
    { type: 'feedback', duration: 1500, silent: false },
  ],
};

/** @deprecated The `syndrome` argument is IGNORED BY DESIGN. */
export function getLearningSequence(_syndrome?: string): SyndromeSequence {
  return NEUTRAL_SEQUENCE;
}

/** @deprecated Kept so legacy imports resolve. */
export const downSyndromeSequence = NEUTRAL_SEQUENCE;
export const williamsSyndromeSequence = NEUTRAL_SEQUENCE;
export const fragileXSequence = NEUTRAL_SEQUENCE;
export const autismSequence = NEUTRAL_SEQUENCE;
