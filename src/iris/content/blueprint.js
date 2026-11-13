/**
 * IRIS — Content blueprint (Phase 5).
 *
 * Turns a learning profile into constraint sets. It sits between assessment
 * and the existing content engine and preserves the contract that engine was
 * built on:
 *
 *   THE CONTENT ENGINE CHOOSES HOW TO PRESENT THE NEXT STEP.
 *   IT NEVER CHOOSES WHAT THE NEXT STEP IS.
 *
 * The blueprint chooses WHAT — which strand, which rung, which tier — from
 * observed evidence. generateActivity() then chooses HOW. Neither can see a
 * diagnosis: there is no `condition` parameter in this file, and the
 * constraint sets it emits carry accommodations as an opaque array of ACCESS
 * codes that affect presentation and timing only.
 *
 * ── WHAT DRIVES SELECTION ─────────────────────────────────────────────────
 *   current skill estimate · assessment indicator · learning priority ·
 *   recent performance · difficulty tier · formats already used
 * All of these are things the child did. None of them is a label.
 */
import { VALIDATION } from '../spec.js';
import { STRAND_BY_ID } from '../ladders/index.js';
import { templatesForStrand } from './phase5Templates.js';
import { servableStrandItems, TIERS, OPTIONS_PER_TIER } from './phase5Bank.js';
import { getEstimate } from '../engines/skillEstimate.js';

export const BLUEPRINT_CONFIG = {
  /** A strand at or above this is not practised — the child can already do it. */
  ALREADY_STRONG_AT: 80,
  /** Activities produced per planning pass. */
  MAX_ACTIVITIES: 3,
  /** Items per activity, before any REDUCED_ITEMS scaffold. */
  ITEMS_PER_ACTIVITY: 6,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'ASSESSMENT_RESEARCH_MATRIX.md §8',
};

/**
 * Difficulty tier from evidence.
 *
 * The tiers are the approved ladder FOUNDATION → GUIDED → PRACTICE →
 * INDEPENDENT → CHALLENGE, and they are not cosmetic: each maps to a real
 * change in the number of options, the closeness of distractors, and how much
 * support is offered (see OPTIONS_PER_TIER and the scaffold flags below).
 */
export function tierFor({ indicator, floor = false, confidence = 'LOW' }) {
  if (floor || indicator == null) return 'FOUNDATION';
  if (indicator < 40) return 'FOUNDATION';
  if (indicator < 55) return 'GUIDED';
  if (indicator < 70) return 'PRACTICE';
  if (indicator < BLUEPRINT_CONFIG.ALREADY_STRONG_AT) return confidence === 'LOW' ? 'PRACTICE' : 'INDEPENDENT';
  return 'CHALLENGE';
}

/** Scaffolds implied by a tier. Reuses the existing scaffold flag vocabulary. */
export function scaffoldsFor(tier) {
  switch (tier) {
    case 'FOUNDATION': return ['REDUCED_ITEMS', 'HINT_ALWAYS_SHOWN'];
    case 'GUIDED': return ['HINT_ON_REQUEST'];
    case 'PRACTICE': return [];
    case 'INDEPENDENT': return ['NO_HINT'];
    case 'CHALLENGE': return ['NO_HINT', 'STRETCH'];
    default: return [];
  }
}

/**
 * Pick a template for a strand, avoiding whatever was used last.
 *
 * Rotation is not only variety. Matrix E3 (Laing et al.) found the same
 * reading score reached by a different underlying route, so which format a
 * child succeeds in is itself information — and a strand only ever practised
 * one way can never reveal it.
 */
export function pickTemplate(strandId, recentTemplates = []) {
  const options = templatesForStrand(strandId);
  if (options.length === 0) return null;
  const unused = options.filter((t) => !recentTemplates.includes(t));
  if (unused.length) return unused[0];
  // Everything has been used recently — take the least recently used.
  const scored = options.map((t) => ({ t, at: recentTemplates.lastIndexOf(t) }));
  scored.sort((a, b) => a.at - b.at);
  return scored[0].t;
}

/**
 * Build the plan.
 *
 * @param {object} input
 * @param {object} input.indicators   from scoreProbe()
 * @param {object} input.profile      from strandProfile()
 * @param {Array}  input.priorities   from learningPriorities()
 * @param {object} [input.ledger]     skill estimates, for the current rung
 * @param {string[]} [input.accommodations] ACCESS codes; presentation only
 * @param {string[]} [input.recentTemplates] formats already used, most recent last
 * @param {string} [input.interestTheme]
 */
export function contentBlueprint({
  indicators,
  profile,
  priorities,
  ledger = null,
  accommodations = [],
  recentTemplates = [],
  interestTheme = null,
}) {
  const plan = [];
  const used = [...recentTemplates];
  const skipped = [];

  for (const p of priorities) {
    if (plan.length >= BLUEPRINT_CONFIG.MAX_ACTIVITIES) break;

    const ind = indicators[p.strand];
    const strand = STRAND_BY_ID[p.strand];
    if (!strand) continue;

    // Never practise what the child can already do. A strand at 80+ is not a
    // learning priority, it is a strength — practising it fills the session
    // with success the child does not need.
    if (ind && !ind.notMeasured && ind.indicator >= BLUEPRINT_CONFIG.ALREADY_STRONG_AT) {
      skipped.push({ strand: p.strand, reason: 'ALREADY_STRONG', indicator: ind.indicator });
      continue;
    }

    const est = ledger ? getEstimate(ledger, p.strand) : null;
    const rung = est?.rung ?? ind?.lowest_probed_rung ?? strand.rung;
    const tier = tierFor({
      indicator: ind?.indicator ?? null,
      floor: !!ind?.floor,
      confidence: ind?.confidence ?? 'LOW',
    });

    const template_id = pickTemplate(p.strand, used);
    if (!template_id) {
      skipped.push({ strand: p.strand, reason: 'NO_TEMPLATE' });
      continue;
    }
    used.push(template_id);

    const pool = servableStrandItems({ strand: p.strand, template_id, tier });
    // Fall back across tiers rather than serving nothing: a thin tier is a
    // content gap, and returning an empty activity would look like a bug to a
    // child. The fallback is recorded so the gap is visible in the plan.
    const fallback = pool.length === 0
      ? servableStrandItems({ strand: p.strand, template_id })
      : pool;

    plan.push({
      strand: p.strand,
      strand_name_ar: strand.nameAr,
      strand_name_en: strand.nameEn,
      ladder: strand.ladder,
      track: strand.track,
      rung,
      tier,
      template_id,
      item_count: BLUEPRINT_CONFIG.ITEMS_PER_ACTIVITY,
      options_per_item: OPTIONS_PER_TIER[tier],
      scaffold_flags: scaffoldsFor(tier),
      accommodations: [...accommodations],
      interest_theme: interestTheme,
      available_items: fallback.length,
      tier_fallback: pool.length === 0 && fallback.length > 0,
      reason: p.reason,
      source_indicator: ind?.indicator ?? null,
      source_confidence: ind?.confidence ?? null,
    });
  }

  return {
    activities: plan,
    skipped,
    rule_ids: ['R-BLUEPRINT-001'],
    _contract: 'The blueprint chooses WHAT. generateActivity() chooses HOW. Neither reads a diagnosis.',
  };
}

/**
 * Turn one blueprint entry into concrete items.
 *
 * Deterministic: the same entry and seed always yield the same items, so a
 * session can be replayed and a bug reproduced.
 */
export function materialise(entry, { seed = 1 } = {}) {
  const pool = servableStrandItems({
    strand: entry.strand,
    template_id: entry.template_id,
    tier: entry.tier,
  });
  const usable = pool.length ? pool : servableStrandItems({ strand: entry.strand, template_id: entry.template_id });

  const cap = entry.scaffold_flags.includes('REDUCED_ITEMS')
    ? Math.max(1, Math.ceil(entry.item_count * (2 / 3)))
    : entry.item_count;

  const ordered = [...usable].sort((a, b) => {
    const ka = (a.item_id.charCodeAt(a.item_id.length - 1) * seed) % 97;
    const kb = (b.item_id.charCodeAt(b.item_id.length - 1) * seed) % 97;
    return ka - kb || a.item_id.localeCompare(b.item_id);
  });

  return {
    activity_id: `ACT5-${entry.strand}-R${entry.rung}-${entry.tier}-${entry.template_id}`,
    strand: entry.strand,
    rung: entry.rung,
    tier: entry.tier,
    template_id: entry.template_id,
    items: ordered.slice(0, Math.min(cap, ordered.length)),
    /**
     * How many items this activity was SUPPOSED to have, after scaffolding.
     * `items` can be shorter — most bank slots hold fewer than four — and a
     * caller that only sees the short list cannot tell a deliberately reduced
     * activity from one the bank could not fill. Carrying the intent makes the
     * shortfall visible and lets it be topped up at the right difficulty.
     */
    item_count: cap,
    bank_shortfall: Math.max(0, cap - Math.min(cap, ordered.length)),
    scaffold_flags: [...entry.scaffold_flags],
    accommodations: [...entry.accommodations],
    validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
    specialist_review_status: 'NOT_REVIEWED',
  };
}

export { TIERS };
