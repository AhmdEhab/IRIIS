/**
 * IRIS — draft/av2 request validators (spec §10, lane notes 2026-11-15).
 *
 * Pure functions only: no models, no express, no database. The caregiver and
 * ladder draft routes (server.js) and `tests/iris.parentDraft.test.js` share
 * these so the validation rules cannot drift between the server and its test.
 *
 * ── WHY A SEPARATE FILE ────────────────────────────────────────────────────
 * The beacon routes are new attack surface (a token arrives in a JSON body or
 * a query string because `sendBeacon` cannot set headers). Every rule the
 * caregiver draft already enforced — normalised status, 512 KB cap, ownership
 * handled upstream — is restated here once, in plain JS, where a test can
 * reach it. server.js imports; nothing else imports.
 */

/** The one size rule for every draft column (caregiver responses, ladder
 *  state). Same constant the caregiver draft route has always used: a
 *  serialised payload at or above this is a client bug → 413. */
const DRAFT_MAX_BYTES = 512 * 1024;

/** Statuses a caregiver draft may hold (existing semantics, unchanged). */
const CAREGIVER_DRAFT_STATUSES = ['IN_PROGRESS', 'COMPLETE'];
/** Statuses a ladder draft may hold (spec §5): COMPLETE and INVALID drafts
 *  are never resume points — the CLIENT decides that by reading `status`;
 *  the server stores whatever it is told, normalised. */
const LADDER_DRAFT_STATUSES = ['IN_PROGRESS', 'COMPLETE', 'INVALID'];

/**
 * The six av2 observation outcomes — spec §1, enums frozen.
 *
 * IMPORTANT: PLAIN ARRAY LITERAL, intentionally DUPLICATED from
 * `src/App/components/iris/ladderObservations.js` (`OUTCOMES`, built from
 * `OUTCOME`). The server is CommonJS and that module is a browser ESM file;
 * importing across the boundary would drag Vite/JSX-adjacent code into the
 * server process. The client file is owned by the engine lane, so the one
 * way to stay honest is a copy WITH this comment and a test that pins all
 * six strings (tests/iris.parentDraft.test.js) — the same pins the client's
 * own enum tests use. If a value is ever added or renamed, BOTH the client
 * module and this array must change together.
 */
const OBSERVATION_OUTCOMES = [
  'demonstrated_independent',
  'demonstrated_with_support',
  'not_demonstrated',
  'insufficient',
  'no_opportunity',
  'invalid_administration',
];

/**
 * visitValidity accepted spellings — BOTH the spec §7 shorthand
 * (`valid | low | invalid`) and the real client values from
 * `ladderObservations.js` VISIT_VALIDITY (`valid | low_performance |
 * invalid_administration`). Accepting both is the approved decision in the
 * lane notes; nothing on the wire is ever rewritten — validation only.
 */
const VISIT_VALIDITY_ACCEPTED = [
  'valid', 'low', 'invalid',
  'low_performance', 'invalid_administration',
];

/** Top-level keys an av2 `item_results` envelope may carry (spec §7). */
const AV2_ITEM_RESULT_KEYS = [
  'bankVersion', 'calibration', 'probe', 'observations',
  'opportunityGates', 'visitValidity', 'caregiverRef',
];

/** Cap on the transparency log inside a record (spec §10: 10k → 413). */
const MAX_OBSERVATIONS = 10000;

/** 'COMPLETE' only when it is exactly COMPLETE; everything else IN_PROGRESS —
 *  the byte-for-byte rule the caregiver POST route has always applied. */
function normalizeCaregiverDraftStatus(status) {
  return status === 'COMPLETE' ? 'COMPLETE' : 'IN_PROGRESS';
}

/** Ladder variant (spec §5): the three states, case-sensitive, anything
 *  else falls back to IN_PROGRESS — same conservatism as the caregiver. */
function normalizeLadderDraftStatus(status) {
  return LADDER_DRAFT_STATUSES.includes(status) ? status : 'IN_PROGRESS';
}

/**
 * Bearer token extraction for the beacon routes.
 *
 * PRECEDENCE (lane notes §decisions, matching the sibling UI lane that
 * beacons `?token=…`): `body.token` → `query.token` → `Authorization: Bearer`
 * header. The plain JSON `fetch` callers keep using the header via
 * requireAuth and never reach this.
 */
function extractBearerToken(req) {
  const body = (req && req.body) || {};
  if (typeof body.token === 'string' && body.token.trim()) return body.token.trim();
  const query = (req && req.query) || {};
  if (typeof query.token === 'string' && query.token.trim()) return query.token.trim();
  const header = String((req && req.headers && req.headers.authorization) || '');
  if (header.startsWith('Bearer ') && header.slice(7).trim()) return header.slice(7).trim();
  return null;
}

/** True when a serialised draft payload must be rejected (>= 512 KB).
 *  The `>=` is the existing caregiver-route rule, kept exactly. */
function overSizeCap(serializedJson, maxBytes = DRAFT_MAX_BYTES) {
  return Buffer.byteLength(String(serializedJson ?? ''), 'utf8') >= maxBytes;
}

function isKnownOutcome(outcome) {
  return OBSERVATION_OUTCOMES.includes(outcome);
}

/** A visitValidity row is `{ visit, …, valid: 'valid' | … }` (what the UI
 *  lane actually posts) — the spelling may be under `valid`, `validity`,
 *  `status` or `result`. Absent key ⇒ nothing to check (rows ride inside
 *  the record; the server never invents one). */
function isKnownVisitValidity(row) {
  if (!row || typeof row !== 'object') return false;
  const value = [row.valid, row.validity, row.status, row.result]
    .find((v) => typeof v === 'string' && v.length > 0);
  return value !== undefined ? VISIT_VALIDITY_ACCEPTED.includes(value) : true;
}

/**
 * The av2 branch of POST /api/assessments (spec §10): enum + cap checks on
 * the NEW arrays only. Called ONLY when `item_results.bankVersion === 'av2'`
 * — legacy records never reach it (server.js guards the call itself), so old
 * payloads are stored byte-for-byte exactly as before.
 *
 * Returns { ok: true } or { ok: false, status, error, detail }.
 * No ids are cross-checked — the bank stays client authority.
 */
function validateAv2ItemResults(itemResults) {
  const ir = itemResults || {};

  if (Array.isArray(ir.observations)) {
    if (ir.observations.length > MAX_OBSERVATIONS) {
      return {
        ok: false, status: 413,
        error: 'TOO_MANY_OBSERVATIONS',
        detail: `observations must hold at most ${MAX_OBSERVATIONS} entries.`,
      };
    }
    for (const o of ir.observations) {
      if (!o || typeof o !== 'object') continue; // opaque rows are stored, not invented
      if ('outcome' in o && !isKnownOutcome(o.outcome)) {
        return {
          ok: false, status: 400,
          error: 'BAD_OBSERVATION_OUTCOME',
          detail: `Unknown observation outcome: ${String(o.outcome).slice(0, 64)}`,
        };
      }
    }
  }

  if (Array.isArray(ir.visitValidity)) {
    for (const row of ir.visitValidity) {
      if (!isKnownVisitValidity(row)) {
        return {
          ok: false, status: 400,
          error: 'BAD_VISIT_VALIDITY',
          detail: 'visitValidity rows must use valid | low | invalid or the full client spellings.',
        };
      }
    }
  }

  return { ok: true };
}

module.exports = {
  DRAFT_MAX_BYTES,
  CAREGIVER_DRAFT_STATUSES,
  LADDER_DRAFT_STATUSES,
  OBSERVATION_OUTCOMES,
  VISIT_VALIDITY_ACCEPTED,
  AV2_ITEM_RESULT_KEYS,
  MAX_OBSERVATIONS,
  normalizeCaregiverDraftStatus,
  normalizeLadderDraftStatus,
  extractBearerToken,
  overSizeCap,
  isKnownOutcome,
  isKnownVisitValidity,
  validateAv2ItemResults,
};
