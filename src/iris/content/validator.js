/**
 * IRIS — Content Validator (doc 15 §6)
 *
 * Deterministic gate. `validator_passed = false` blocks serving.
 * Nothing invalid can silently enter the playable Content Bank.
 */
import { BANNED_TERMS } from '../spec.js';
import { TEMPLATE_BY_ID, wmLoadRank } from './templates.js';
import { GOAL_BY_ID } from '../engines/goals.js';

const textOf = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(textOf).join(' ');
  if (typeof v === 'object') return Object.values(v).map(textOf).join(' ');
  return String(v);
};

/**
 * Validate one ActivityInstance against its constraint set.
 * @returns {{ passed: boolean, failures: Array<{check:string, detail:string}> }}
 */
export function validateActivity(instance, constraints) {
  const failures = [];
  const fail = (check, detail) => failures.push({ check, detail });

  // 1. Constraint fidelity — the snapshot must equal the input exactly.
  const snap = instance.constraint_snapshot || {};
  for (const key of ['goal_id', 'level', 'template_id']) {
    if (snap[key] !== constraints[key]) {
      fail('constraint_fidelity', `${key}: snapshot=${snap[key]} constraint=${constraints[key]}`);
    }
  }

  // 2. Template eligibility.
  const tpl = TEMPLATE_BY_ID[instance.template_id];
  if (!tpl) {
    fail('template_eligibility', `unknown template ${instance.template_id}`);
  } else {
    const levels = tpl.goals[instance.goal_id] || [];
    if (!levels.includes(instance.level)) {
      fail('template_eligibility', `${instance.template_id} does not declare ${instance.goal_id} L${instance.level}`);
    }
  }

  // 3. Goal must exist in the MVP library (no goal invention).
  if (!GOAL_BY_ID[instance.goal_id]) {
    fail('goal_eligibility', `${instance.goal_id} is not one of the six MVP goals`);
  }

  // 4. Item eligibility + approval gate.
  const items = instance.items || [];
  if (items.length === 0) fail('item_count', 'no items resolved');
  for (const it of items) {
    if (it.goal_id !== instance.goal_id) fail('item_eligibility', `${it.item_id} goal mismatch`);
    if (it.level !== instance.level) fail('item_eligibility', `${it.item_id} level mismatch`);
    if (it.template_id !== instance.template_id) fail('item_eligibility', `${it.item_id} template mismatch`);
    if (it.review_status !== 'APPROVED') fail('approval_gate', `${it.item_id} is ${it.review_status}, not APPROVED`);
  }

  // 5. Item count within template bounds and the requested cap.
  if (constraints.item_count && items.length > constraints.item_count) {
    fail('item_count', `${items.length} items exceeds requested ${constraints.item_count}`);
  }

  // 6. WM load cap.
  if (tpl && constraints.wm_load_cap) {
    if (wmLoadRank(tpl.wm_load) > wmLoadRank(constraints.wm_load_cap)) {
      fail('wm_load', `template ${tpl.wm_load} exceeds cap ${constraints.wm_load_cap}`);
    }
  }

  // 7. Distractor sanity — exactly one correct answer, no duplicate of target.
  for (const it of items) {
    if (it.correct_index != null) {
      const opts = it.options || [];
      if (it.correct_index < 0 || it.correct_index >= opts.length) {
        fail('distractor_sanity', `${it.item_id} correct_index out of range`);
      }
      const correct = opts[it.correct_index];
      const dupes = opts.filter((o) => JSON.stringify(o) === JSON.stringify(correct)).length;
      // VSP "odd one out" items legitimately repeat the non-target, so only
      // flag when the CORRECT option itself appears more than once.
      if (dupes > 1) fail('distractor_sanity', `${it.item_id} correct option appears ${dupes} times`);
    }
    if (it.correct_sequence != null) {
      if (!Array.isArray(it.correct_sequence) || it.correct_sequence.some((i) => i < 0)) {
        fail('distractor_sanity', `${it.item_id} invalid correct_sequence`);
      }
    }
  }

  // 8. Banned terms in CHILD-FACING text.
  // Internal provenance fields (evidence_note, source) legitimately quote the
  // research literature, which uses clinical vocabulary. Those fields are
  // never rendered to a child or a parent, so they are excluded from the scan
  // — but everything the child can actually see or hear is scanned.
  const childFacing = (instance.items || []).map((it) => ({
    prompt: it.prompt, options: it.options, hint: it.hint, target: it.target,
    label: it.label, distractors: it.distractors,
  }));
  const haystack = textOf(childFacing).toLowerCase();
  for (const term of BANNED_TERMS) {
    // word-ish boundary check to avoid false positives inside other words
    const re = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i');
    if (re.test(haystack)) fail('banned_terms', `contains banned term "${term}"`);
  }

  // 9. Diagnosis must not appear anywhere in child-facing content.
  for (const d of ['down syndrome', 'williams', 'متلازمة داون', 'متلازمة ويليامز', 'autism', 'fragile']) {
    if (haystack.includes(d)) fail('safety', `diagnosis name "${d}" present in activity content`);
  }

  // 10. Accommodation compliance — R-ASSESS-006 style validity constraint.
  if (constraints.forbidden_accommodations?.length) {
    const applied = instance.accommodations || [];
    for (const f of constraints.forbidden_accommodations) {
      if (applied.includes(f)) fail('accommodation_compliance', `${f} is not permitted for this task`);
    }
  }

  return { passed: failures.length === 0, failures };
}
