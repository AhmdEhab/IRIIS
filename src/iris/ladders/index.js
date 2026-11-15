/**
 * IRIS — Skill ladders: shared model and registry (Phase 5).
 *
 * ── WHAT A LADDER IS, AND WHAT IT IS NOT ──────────────────────────────────
 * A ladder is a DIFFICULTY ORDERING used to choose which item to show next.
 * It is NOT a prerequisite chain. Nothing in this file prevents a child from
 * being measured on a high rung while a lower rung is unmeasured or weak.
 *
 * That is a research requirement, not a convenience:
 *   - Kennedy & Flynn (matrix D3) found only 1 of 9 children with Down syndrome
 *     showed rhyme awareness while several had MORE advanced phoneme-level
 *     skills. The typical rhyme-before-phoneme order did not hold.
 *   - The early-numeracy review (matrix C7) describes development as
 *     "interconnected and hierarchical but not strictly linear".
 * A rigid chain would have hidden real skills in exactly the children IRIS
 * serves. See TEST "out-of-order mastery".
 *
 * ── PARALLEL STRANDS ──────────────────────────────────────────────────────
 * Strands that share a `rung` number are PARALLEL: neither gates the other and
 * both are probed independently. This is how the model represents, e.g., a
 * child who can do sound → letter but not letter → sound.
 *
 * ── DIAGNOSIS-BLINDNESS ───────────────────────────────────────────────────
 * No function in this file, and no field on any strand, accepts or reads
 * `condition`. The ladders are identical for every child. Research shapes the
 * ORDER of the rungs and the DESIGN of the items — never one child's position.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { LITERACY_STRANDS, LITERACY_META } from './literacy.js';
import { NUMERACY_STRANDS, NUMERACY_META } from './numeracy.js';
import { VSP_STRANDS, VSP_META } from './visual.js';
import { MEM_STRANDS, MEM_META } from './memory.js';
import { COMM_STRANDS, COMM_META } from './communication.js';

export { LITERACY_STRANDS, LITERACY_META } from './literacy.js';
export { NUMERACY_STRANDS, NUMERACY_META } from './numeracy.js';
export { VSP_STRANDS, VSP_META } from './visual.js';
export { MEM_STRANDS, MEM_META, ATTENTION_POLICY } from './memory.js';
export { COMM_STRANDS, COMM_META } from './communication.js';
export * from './literacy.js';

/**
 * Every strand in the system, in one flat list.
 *
 * av2 (spec §2): the COMM track lives INSIDE the LITERACY ladder as a
 * parallel track — expressive channel next to the receptive LISTENING track —
 * so COMM strands are appended to the LITERACY ladder's strand set while
 * LITERACY_STRANDS itself keeps its original meaning (the LADDER list,
 * MAIN + LISTENING). VSP and MEM are their own ladders. The registry is the
 * ONLY wiring the adaptive probe needs: a track that exists here is probed
 * automatically, at its own base rung, and gates nothing else.
 */
export const LADDER_LITERACY_STRANDS = [...LITERACY_STRANDS, ...COMM_STRANDS];
export const ALL_STRANDS = [...LADDER_LITERACY_STRANDS, ...NUMERACY_STRANDS, ...VSP_STRANDS, ...MEM_STRANDS];

export const STRAND_BY_ID = Object.fromEntries(ALL_STRANDS.map((s) => [s.id, s]));

export const LADDERS = {
  LITERACY: { id: 'LITERACY', strands: LADDER_LITERACY_STRANDS, meta: LITERACY_META },
  NUMERACY: { id: 'NUMERACY', strands: NUMERACY_STRANDS, meta: NUMERACY_META },
  VSP: { id: 'VSP', strands: VSP_STRANDS, meta: VSP_META },
  MEM: { id: 'MEM', strands: MEM_STRANDS, meta: MEM_META },
};

export const LADDER_IDS = Object.keys(LADDERS);

/** Per-track metadata for tracks that are not a whole ladder (COMM). */
export const TRACK_META = {
  'LITERACY:COMM': COMM_META,
};

export const metaForTrack = (ladderId, track) =>
  TRACK_META[`${ladderId}:${track}`] ?? LADDERS[ladderId]?.meta ?? null;

/** Strands belonging to one ladder track (main track or a parallel track). */
export function strandsInTrack(ladderId, track) {
  return ALL_STRANDS.filter((s) => s.ladder === ladderId && s.track === track);
}

/** All distinct tracks declared for a ladder, main first. */
export function tracksFor(ladderId) {
  const seen = [];
  for (const s of ALL_STRANDS) {
    if (s.ladder === ladderId && !seen.includes(s.track)) seen.push(s.track);
  }
  return seen;
}

/**
 * The strands at a given rung of a track.
 *
 * More than one strand at the same rung means they are PARALLEL — the routing
 * layer probes each independently and neither is treated as a prerequisite for
 * the other.
 */
export function strandsAtRung(ladderId, track, rung) {
  return strandsInTrack(ladderId, track)
    .filter((s) => s.rung === rung)
    .sort((a, b) => a.id.localeCompare(b.id)); // deterministic
}

/** Ordered, de-duplicated rung numbers for a track. */
export function rungsOf(ladderId, track) {
  return [...new Set(strandsInTrack(ladderId, track).map((s) => s.rung))].sort((a, b) => a - b);
}

export const baseRungOf = (ladderId, track) => rungsOf(ladderId, track)[0] ?? 0;
export const topRungOf = (ladderId, track) => rungsOf(ladderId, track).slice(-1)[0] ?? 0;

/** Height used as the `depth` denominator in the indicator formula. */
export function heightOf(ladderId, track) {
  const rungs = rungsOf(ladderId, track);
  return Math.max(1, (rungs.slice(-1)[0] ?? 0) - (rungs[0] ?? 0));
}

/** The next rung up, or null at the top. Skips gaps in the rung numbering. */
export function nextRung(ladderId, track, rung) {
  return rungsOf(ladderId, track).find((r) => r > rung) ?? null;
}

/** The next rung down, or null at the base. */
export function prevRung(ladderId, track, rung) {
  const below = rungsOf(ladderId, track).filter((r) => r < rung);
  return below.length ? below[below.length - 1] : null;
}

/**
 * Sanity checks the ladders must satisfy. Called by the test suite and by
 * qa-ladders.mjs so a malformed strand cannot ship.
 */
export function validateLadders() {
  const problems = [];
  const ids = new Set();

  for (const s of ALL_STRANDS) {
    if (ids.has(s.id)) problems.push(`duplicate strand id: ${s.id}`);
    ids.add(s.id);

    for (const field of ['id', 'ladder', 'track', 'rung', 'code', 'nameAr', 'nameEn']) {
      if (s[field] === undefined || s[field] === null) {
        problems.push(`${s.id}: missing ${field}`);
      }
    }
    if (!LADDERS[s.ladder]) problems.push(`${s.id}: unknown ladder ${s.ladder}`);
    if (!Number.isInteger(s.rung) || s.rung < 0) problems.push(`${s.id}: rung must be a non-negative integer`);
    if (!Array.isArray(s.research)) problems.push(`${s.id}: research must be an array of matrix row ids`);
  }

  // A ladder with a single rung has no ordering and cannot be climbed.
  for (const ladderId of LADDER_IDS) {
    for (const track of tracksFor(ladderId)) {
      if (rungsOf(ladderId, track).length < 2) {
        problems.push(`${ladderId}/${track}: needs at least two rungs to be adaptive`);
      }
    }
  }

  return { ok: problems.length === 0, problems };
}
