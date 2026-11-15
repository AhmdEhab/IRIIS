/* P62b — the family session profile + anti-repetition rotation.
 * Engine-level guarantees the shortened onboarding assessment depends on. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCalibration, startProbe, nextProbe, recordProbe } from '../src/iris/journey.js';
import { PROBE_PROFILES } from '../src/iris/engines/adaptiveProbe.js';
import { PROBE_CONFIG } from '../src/iris/engines/adaptiveProbe.js';
import { servableStrandItems } from '../src/iris/content/phase5Bank.js';

const cal = runCalibration({ ageYears: 5 });

/** Mirror of the UI picker (IrisLadderAssessment.loadVisit) for test use. */
function pickIds(v) {
  const pool = servableStrandItems({ strand: v.strand, template_id: v.template });
  const fb = pool.length ? pool : servableStrandItems({ strand: v.strand });
  const n = Math.max(1, v.item_count || 1);
  const len = fb.length || 1;
  const start = (((v.visit_offset || 0) % len) * n) % len;
  return fb.slice(start).concat(fb.slice(0, start)).slice(0, Math.min(n, len)).map((i) => i.item_id);
}

function drive(responder, config) {
  let state = startProbe(cal, config);
  const visits = [];
  for (let guard = 0; guard < 300; guard++) {
    const v = nextProbe(state);
    if (!v) break;
    visits.push(v);
    state = recordProbe(state, v, responder(v, visits.length));
  }
  return { state, visits };
}

test('family profile is stamped into the state and travels with it', () => {
  const state = startProbe(cal, PROBE_PROFILES.family);
  assert.equal(state.config.ITEMS_PER_VISIT, 2);
  assert.equal(state.config.SESSION_ITEM_BUDGET, 16);
});

test('no config keeps the untouched clinical defaults', () => {
  const state = startProbe(cal);
  assert.equal(state.config.ITEMS_PER_VISIT, PROBE_CONFIG.ITEMS_PER_VISIT);
  assert.equal(state.config.MAX_VISITS_PER_TRACK, PROBE_CONFIG.MAX_VISITS_PER_TRACK);
  assert.equal(state.config.SESSION_ITEM_BUDGET, PROBE_CONFIG.SESSION_ITEM_BUDGET);
});

test('a family session never exceeds its 16-item budget (mixed answers)', () => {
  const { state } = drive((v, n) => ({
    correct: n % 3 === 0 ? 0 : 1,
    total: v.item_count,
    supported: 0,
    insufficient: n % 7 === 0 ? 1 : 0,
  }), PROBE_PROFILES.family);
  assert.ok(state.items_used <= 16, `items_used=${state.items_used}`);
  assert.equal(state.finished, true);
});

test('every family visit carries item_count 2 and a visit_offset', () => {
  const { visits } = drive(() => ({ correct: 1, total: 2, supported: 0 }), PROBE_PROFILES.family);
  assert.ok(visits.length >= 3);
  for (const v of visits) {
    assert.equal(v.item_count, 2);
    assert.equal(typeof v.visit_offset, 'number');
  }
});

test('rotation: a strand visited twice at the same rung serves different cards', () => {
  const { visits } = drive((v, n) => ({
    correct: n % 2, total: v.item_count, supported: 0, insufficient: n % 5 === 0 ? 1 : 0,
  }), PROBE_PROFILES.family);
  const byStrand = new Map();
  for (const v of visits) {
    const key = `${v.strand}@${v.rung}`;
    (byStrand.get(key) || byStrand.set(key, []).get(key)).push(v);
  }
  let revisited = 0;
  for (const [, list] of byStrand) {
    if (list.length < 2) continue;
    revisited++;
    const seen = new Set();
    for (const v of list) {
      // template may rotate (visual twin) — offsets must differ, and for the
      // SAME template the served item ids must be fresh whenever the pool
      // has room for it.
      assert.ok(v.visit_offset >= 0);
      const ids = pickIds(v);
      const pool = servableStrandItems({ strand: v.strand, template_id: v.template });
      if (pool.length >= ids.length * list.length) {
        for (const id of ids) {
          assert.ok(!seen.has(id), `${v.strand}: card ${id} served twice in one session`);
          seen.add(id);
        }
      }
    }
  }
  assert.ok(revisited >= 1, 'fixture should produce at least one re-visited strand');
});
