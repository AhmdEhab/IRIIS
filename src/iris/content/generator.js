/**
 * IRIS — Content Engine / activity generator (doc 15 §1–§2)
 *
 * THE CONSTRAINT CONTRACT (doc 15 §2):
 *   The content engine chooses HOW to present the next step.
 *   It never chooses WHAT the next step is.
 *
 * Its function signature accepts ONLY the constraint set. `condition`,
 * diagnosis-derived values, and Profile strengths are structurally out of
 * scope — enforced by TEST-CONTENT-BLIND.
 *
 * Deterministic: a seed makes item selection reproducible, so the same
 * constraint set always yields the same activity.
 */
import { TEMPLATE_BY_ID } from './templates.js';
import { servableItems } from './contentBank.js';
import { validateActivity } from './validator.js';

/** Small deterministic PRNG (mulberry32) — no Math.random anywhere. */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build an ActivityInstance from a constraint set.
 *
 * @param {object} constraints
 * @param {string} constraints.goal_id
 * @param {number} constraints.level
 * @param {string} constraints.template_id
 * @param {number} [constraints.item_count]
 * @param {string[]} [constraints.scaffold_flags]
 * @param {string[]} [constraints.accommodations]
 * @param {string} [constraints.wm_load_cap]
 * @param {string} [constraints.interest_theme]
 * @param {string} [constraints.variant_seed] rotates items between repeats
 */
export function generateActivity(constraints) {
  const {
    goal_id, level, template_id,
    item_count = 6,
    scaffold_flags = [],
    accommodations = [],
    wm_load_cap = 'HIGH',
    interest_theme = null,
    variant_seed = 'v1',
    forbidden_accommodations = [],
  } = constraints;

  const tpl = TEMPLATE_BY_ID[template_id];
  let pool = servableItems({ goal_id, level, template_id });

  // Interest personalizes the THEME only, never the learning objective.
  if (interest_theme) {
    const themed = pool.filter((i) => i.theme === interest_theme);
    if (themed.length > 0) pool = themed;
  }

  // REDUCED_ITEMS is handed down by the pathway engine, never self-selected.
  const cap = scaffold_flags.includes('REDUCED_ITEMS')
    ? Math.max(1, Math.ceil(item_count * (2 / 3)))
    : item_count;

  // Deterministic rotation so repeats differ but are reproducible.
  const rand = rng(seedFrom(`${goal_id}|${level}|${template_id}|${variant_seed}`));
  const shuffled = pool
    .map((i) => ({ i, k: rand() }))
    .sort((a, b) => a.k - b.k || a.i.item_id.localeCompare(b.i.item_id))
    .map((x) => x.i);

  const items = shuffled.slice(0, Math.min(cap, shuffled.length));

  const constraint_snapshot = { goal_id, level, template_id };

  const instance = {
    activity_id: `ACT-${goal_id}-L${level}-${template_id}-${variant_seed}`,
    goal_id,
    level,
    template_id,
    response_type: tpl?.response_type ?? null,
    items,
    scaffold_flags: [...scaffold_flags],
    accommodations: accommodations.filter((a) => !forbidden_accommodations.includes(a)),
    interest_theme,
    constraint_snapshot,
    // Provenance travels with every served activity.
    validation_status: 'RESEARCH_INFORMED_PROTOTYPE',
    specialist_review_status: 'NOT_REVIEWED',
    validator_passed: false,
  };

  const result = validateActivity(instance, { ...constraints, item_count: cap, wm_load_cap, forbidden_accommodations });
  instance.validator_passed = result.passed;
  instance.validator_failures = result.failures;

  return instance;
}
