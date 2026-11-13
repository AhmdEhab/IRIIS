/**
 * DEPRECATED — presentation helpers, now diagnosis-blind.
 *
 * These previously read a diagnosis-derived rule set. They now operate on the
 * single neutral presentation default (see constants/syndromeRules.ts).
 * Content sizing is handed down by the pathway engine, not chosen here.
 */
import { SyndromeRuleSet } from '../constants/syndromeRules';

export type AgeGroup = '3-5' | '6-8' | '9-12';

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 5) return '3-5';
  if (age <= 8) return '6-8';
  return '9-12';
}

export function filterContentByAge<T>(items: T[], age: number, rules: SyndromeRuleSet): T[] {
  const maxItems = rules.contentComplexity[getAgeGroup(age)].itemCount;
  return items.slice(0, maxItems);
}

export function getMaxStepsPerTask(age: number, rules: SyndromeRuleSet): number {
  return rules.contentComplexity[getAgeGroup(age)].stepsPerTask;
}

export function getAnimationDuration(rules: SyndromeRuleSet): number {
  switch (rules.animationIntensity) {
    case 'low': return 1000;
    case 'medium': return 500;
    case 'high': return 300;
    default: return 500;
  }
}

export function shouldAutoAdvance(rules: SyndromeRuleSet): boolean {
  return rules.advanceMode === 'auto' || rules.advanceMode === 'both';
}

export function shouldAllowTapAdvance(rules: SyndromeRuleSet): boolean {
  return rules.advanceMode === 'tap' || rules.advanceMode === 'both';
}

/** @deprecated Feedback is multimodal for every child; no diagnosis-derived channel. */
export function getFeedbackType(_rules: SyndromeRuleSet): 'visual' | 'auditory' | 'both' {
  return 'both';
}

export function getBackgroundClass(rules: SyndromeRuleSet, defaultGradient: string): string {
  return rules.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : defaultGradient;
}

export function getColorClass(rules: SyndromeRuleSet, standardColor: string, lowArousalColor = ' '): string {
  return rules.sensoryProfile === 'low-arousal' ? lowArousalColor : standardColor;
}

export function getTextColorClass(rules: SyndromeRuleSet, standardColor: string, lowArousalColor = 'text-ink-muted'): string {
  return rules.sensoryProfile === 'low-arousal' ? lowArousalColor : standardColor;
}

export function getTransitionDuration(rules: SyndromeRuleSet): number {
  switch (rules.animationIntensity) {
    case 'low': return 800;
    case 'medium': return 500;
    case 'high': return 300;
    default: return 500;
  }
}

export function isErrorlessMode(rules: SyndromeRuleSet): boolean {
  return rules.errorHandling === 'errorless';
}

export function isGentleRedirect(rules: SyndromeRuleSet): boolean {
  return rules.errorHandling === 'gentle-redirect';
}
