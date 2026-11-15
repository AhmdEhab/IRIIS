/**
 * av2 P-lane / server — draft & payload validators (spec §5 §10).
 *
 * These pin server/lib/draftValidators.js, the pure layer behind
 * POST/GET /api/ladder/draft(+beacon), POST /api/caregiver/draft/beacon and
 * the av2 branch of POST /api/assessments. The HTTP behaviour itself was
 * verified against a live boot; what matters here is that the RULES are one
 * copy, frozen, and shared with the routes.
 *
 * The validators are CommonJS (server/ scope); createRequire reaches them
 * the way the server does — no duplicated rule anywhere in this file.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dv = require('../server/lib/draftValidators.js');

/* ── status normalisation ─────────────────────────────────────────────── */
test('draft status: caregiver keeps the old two-state rule exactly', () => {
  assert.equal(dv.normalizeCaregiverDraftStatus('COMPLETE'), 'COMPLETE');
  // Everything else — the empty, the wrong-case, the nonsense — normalises
  // to IN_PROGRESS, byte-for-byte what the pre-av2 route did inline.
  for (const junk of ['complete', 'complete ', 'INVALID', '', null, undefined, 42, {}]) {
    assert.equal(dv.normalizeCaregiverDraftStatus(junk), 'IN_PROGRESS', String(junk));
  }
  assert.deepEqual(dv.CAREGIVER_DRAFT_STATUSES, ['IN_PROGRESS', 'COMPLETE']);
});

test('draft status: ladder accepts IN_PROGRESS|COMPLETE|INVALID, nothing invented', () => {
  assert.equal(dv.normalizeLadderDraftStatus('IN_PROGRESS'), 'IN_PROGRESS');
  assert.equal(dv.normalizeLadderDraftStatus('COMPLETE'), 'COMPLETE');
  assert.equal(dv.normalizeLadderDraftStatus('INVALID'), 'INVALID');
  for (const junk of ['invalid', 'complete', 'DONE', '', null, {}]) {
    assert.equal(dv.normalizeLadderDraftStatus(junk), 'IN_PROGRESS', String(junk));
  }
  assert.deepEqual([...dv.LADDER_DRAFT_STATUSES].sort(), ['COMPLETE', 'INVALID', 'IN_PROGRESS'].sort());
});

/* ── beacon token precedence: body.token → query.token → Authorization ── */
test('token extraction follows body → query → header, exactly', () => {
  const H = { authorization: 'Bearer hdr' };
  assert.equal(dv.extractBearerToken({ body: { token: 'bod' }, query: { token: 'qry' }, headers: H }), 'bod');
  assert.equal(dv.extractBearerToken({ body: {}, query: { token: 'qry' }, headers: H }), 'qry');
  assert.equal(dv.extractBearerToken({ body: {}, query: {}, headers: H }), 'hdr');
  // whitespace-only body/query tokens do NOT shadow the header — a beacon
  // fired with an empty token field must not lock out the real credential.
  assert.equal(dv.extractBearerToken({ body: { token: '  ' }, query: {}, headers: H }), 'hdr');
  assert.equal(dv.extractBearerToken({ body: { token: 'bod' } }), 'bod');
  assert.equal(dv.extractBearerToken({ query: 'tokenless' in {} ? {} : { token: '  qry  ' } }), 'qry');
  assert.equal(dv.extractBearerToken({ body: {}, query: {}, headers: { authorization: 'Basic xyz' } }), null);
  assert.equal(dv.extractBearerToken({ body: {}, query: {}, headers: {} }), null);
  assert.equal(dv.extractBearerToken({}), null);
  // surrounding whitespace on the credential itself is trimmed, not kept.
  assert.equal(dv.extractBearerToken({ query: { token: '  qry  ' } }), 'qry');
});

/* ── size cap ─────────────────────────────────────────────────────────── */
test('size cap: 512 KB, and the boundary is the same >= the old route used', () => {
  assert.equal(dv.DRAFT_MAX_BYTES, 512 * 1024);
  assert.equal(dv.overSizeCap(JSON.stringify({ blob: 'x'.repeat(1024) }), 2048), false);
  assert.equal(dv.overSizeCap(JSON.stringify({ blob: 'x'.repeat(4096) }), 2048), true);
  // exactly at the cap: rejected (>=), matching the caregiver route verbatim.
  assert.equal(dv.overSizeCap('a'.repeat(dv.DRAFT_MAX_BYTES - 2), dv.DRAFT_MAX_BYTES), false);
  assert.equal(dv.overSizeCap('a'.repeat(dv.DRAFT_MAX_BYTES), dv.DRAFT_MAX_BYTES), true);
  // multibyte payloads are measured in BYTES, not characters: 5 Arabic
  // letters are 10 UTF-8 bytes — over a 9-byte cap; 4 (8 bytes) are under.
  assert.equal(dv.overSizeCap('ع'.repeat(4), 9), false);
  assert.equal(dv.overSizeCap('ع'.repeat(5), 9), true);
});

/* ── outcome enum: six values, frozen, mirrored from the client ───────── */
test('outcome enum: the six frozen values are pinned here AND exist client-side', () => {
  assert.deepEqual([...dv.OBSERVATION_OUTCOMES].sort(), [
    'demonstrated_independent',
    'demonstrated_with_support',
    'insufficient',
    'invalid_administration',
    'no_opportunity',
    'not_demonstrated',
  ].sort());
  for (const o of dv.OBSERVATION_OUTCOMES) assert.equal(dv.isKnownOutcome(o), true);
  for (const junk of ['correct', 'wrong', 'partial', undefined, null, '']) assert.equal(dv.isKnownOutcome(junk), false);
  // The array is a documented DUPLICATE of the client module's OUTCOME
  // values (server/ is CJS, the client file is browser ESM). This trips if
  // either side drifts without the other.
  const client = readFileSync(
    fileURLToPath(new URL('../src/App/components/iris/ladderObservations.js', import.meta.url)), 'utf8',
  );
  for (const o of dv.OBSERVATION_OUTCOMES) {
    assert.ok(client.includes(`'${o}'`), `${o} no longer exists in ladderObservations.js`);
  }
});

/* ── visitValidity: BOTH spellings accepted ───────────────────────────── */
test('visitValidity accepts the spec shorthand AND the real client values', () => {
  for (const spelling of ['valid', 'low', 'invalid', 'low_performance', 'invalid_administration']) {
    assert.equal(dv.isKnownVisitValidity({ visit: 1, valid: spelling }), true, spelling);
  }
  // the value may ride under any of the keys the UI lane could use:
  assert.equal(dv.isKnownVisitValidity({ visit: 1, validity: 'low_performance' }), true);
  assert.equal(dv.isKnownVisitValidity({ visit: 1, status: 'invalid' }), true);
  assert.equal(dv.isKnownVisitValidity({ visit: 1 }), true); // no value ⇒ nothing to judge
  assert.equal(dv.isKnownVisitValidity({ visit: 1, valid: 'maybe' }), false);
  assert.equal(dv.isKnownVisitValidity(null), false);
});

/* ── the composite av2 payload gate ───────────────────────────────────── */
test('validateAv2ItemResults: clean av2 envelopes pass, broken ones answer 400/413', () => {
  assert.deepEqual(dv.validateAv2ItemResults({
    bankVersion: 'av2',
    calibration: { LITERACY: 3 },
    probe: [[{ strand: 'LIT.LETTER_NAME', rung: 3, correct: 2, total: 3, supported: 1 }]],
    observations: [{ outcome: 'demonstrated_with_support' }, { outcome: 'insufficient' }],
    opportunityGates: { LITERACY: 'not_yet' },
    visitValidity: [{ visit: 1, valid: 'valid' }, { visit: 2, valid: 'low_performance' }],
    caregiverRef: { clientRef: 'x' },
  }), { ok: true });

  const bad = dv.validateAv2ItemResults({ bankVersion: 'av2', observations: [{ outcome: 'half_right' }] });
  assert.equal(bad.ok, false);
  assert.equal(bad.status, 400);
  assert.equal(bad.error, 'BAD_OBSERVATION_OUTCOME');

  const badV = dv.validateAv2ItemResults({ bankVersion: 'av2', visitValidity: [{ visit: 1, valid: 'sortof' }] });
  assert.equal(badV.ok, false);
  assert.equal(badV.status, 400);
  assert.equal(badV.error, 'BAD_VISIT_VALIDITY');

  const many = dv.validateAv2ItemResults({
    bankVersion: 'av2',
    observations: Array.from({ length: dv.MAX_OBSERVATIONS + 1 }, () => ({ outcome: 'insufficient' })),
  });
  assert.equal(many.ok, false);
  assert.equal(many.status, 413);
  assert.equal(many.error, 'TOO_MANY_OBSERVATIONS');
  // exactly at the cap is legal.
  assert.deepEqual(dv.validateAv2ItemResults({
    bankVersion: 'av2',
    observations: Array.from({ length: dv.MAX_OBSERVATIONS }, () => ({ outcome: 'insufficient' })),
  }), { ok: true });
});

test('validateAv2ItemResults: the legacy shape is a no-op — and server.js only ever calls it on the bankVersion stamp', () => {
  // A phase5-1.0.0 record can carry ANYTHING in calibration/probe; the
  // validator never looks at those arrays. (The route guards the call;
  // this pins that the function itself is inert on a legacy envelope.)
  assert.deepEqual(dv.validateAv2ItemResults({ calibration: { x: 1 }, probe: [ { nonsense: true } ] }), { ok: true });
  const route = readFileSync(fileURLToPath(new URL('../server/server.js', import.meta.url)), 'utf8');
  assert.ok(route.includes("itemResultsIn.bankVersion === 'av2'"), 'the av2 branch must stay gated on the bankVersion stamp');
});
