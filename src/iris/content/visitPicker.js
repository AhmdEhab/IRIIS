/* ═══════════════════════════════════════════════════════════════════════════
 * P63 — SESSION-VARIETY ITEM PICKER (user-approved delivery rules)
 *
 * Pure function. Given a strand/template item pool and what the CURRENT
 * session has already served, it returns the items to show this visit while
 * honouring the three approved rules:
 *
 *   R1  the same prompt TEXT appears at most TWICE per session;
 *   R2  the same TASK (identical stimulus + options + answer) is never
 *       served twice in one session — regardless of how it is worded;
 *   R3  fresh items are always preferred over any repeat.
 *
 * Relaxation order (so diversity can NEVER starve the engine of evidence —
 * the user's explicit condition): drop R1 first, then R2, and only as an
 * absolute last resort fall back to the legacy cyclic rotation. Coverage
 * beats variety, always.
 *
 * Deterministic: the only randomness is the visit-offset rotation used to
 * spread variants across visits.
 * ═══════════════════════════════════════════════════════════════════════════ */
import { PHASE5_ITEM_BY_ID } from './phase5Bank.js';

/** R2 task identity: everything a child perceives as "the same question". */
export function taskKeyOf(item) {
  return JSON.stringify([
    item?.stimulus ?? null,
    Array.isArray(item?.options) ? item.options : null,
    item?.correct_index ?? item?.correct_order ?? item?.expected_taps ?? null,
  ]);
}
/** R1 prompt identity (Arabic first line — the words the child hears). */
export function promptKeyOf(item) {
  return String(item?.prompt?.ar ?? item?.prompt?.en ?? '').trim();
}

const byId = (ids) => (ids ?? []).map((id) => PHASE5_ITEM_BY_ID[id]).filter(Boolean);

/**
 * @param pool            candidate items for this strand/template
 * @param itemCount       items to serve this visit
 * @param visitOffset     engine-provided rotation index (P62b)
 * @param servedItemIds   item_ids already answered/seen THIS session
 * @param promptCounts    {promptKey: timesShown} accumulated this session
 * @param taskKeysUsed    taskKeys already served this session
 * @returns array of items (length ≤ itemCount; prefers variety, relaxes R1 then R2)
 */
export function pickVisitItems({ pool, itemCount, visitOffset = 0, servedItemIds = [], promptCounts = {}, taskKeysUsed = [] }) {
  const n = Math.max(1, itemCount || 1);
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const served = new Set(servedItemIds.map(String));
  const tasks = new Set(taskKeysUsed);
  const pcounts = { ...(promptCounts || {}) };

  // Cyclic rotation keeps spread even even though filtering changes per visit.
  const len = pool.length;
  const start = ((visitOffset % len) * n) % len;
  const rotated = pool.slice(start).concat(pool.slice(0, start));

  const freshFirst = [...rotated.filter((i) => !served.has(String(i.item_id))), ...rotated.filter((i) => served.has(String(i.item_id)))];

  const pick = (relaxPrompt, relaxTask) => {
    const chosen = [];
    const localP = {};
    for (const i of freshFirst) {
      if (chosen.length >= n) break;
      if (!relaxTask && tasks.has(taskKeyOf(i))) continue;
      const pk = promptKeyOf(i);
      if (!relaxPrompt && (pcounts[pk] ?? 0) + (localP[pk] ?? 0) >= 2) continue;
      chosen.push(i);
      localP[pk] = (localP[pk] ?? 0) + 1;
    }
    return chosen;
  };

  // R1+R2 strict → relax R1 → relax R1+R2 → legacy slice (coverage wins).
  return pick(false, false).length >= Math.min(n, pool.length) ? pick(false, false)
    : pick(true, false).length >= Math.min(n, pool.length) ? pick(true, false)
      : pick(true, true).length >= Math.min(n, pool.length) ? pick(true, true)
        : freshFirst.slice(0, n);
}

/**
 * Fold one visit's item rows into the session ledger. Rows are the av2
 * per-item observations (they carry item_id); anything without an id is
 * ignored, so pre-av2 resume drafts simply start with a thinner ledger —
 * a quality-of-variety loss, never a scoring problem.
 */
export function ledgerFromObservations(rows) {
  const servedItemIds = [];
  const promptCounts = {};
  const taskKeysUsed = [];
  for (const o of rows ?? []) {
    const item = PHASE5_ITEM_BY_ID[String(o?.item_id ?? '')];
    if (!item) continue;
    servedItemIds.push(String(o.item_id));
    const pk = promptKeyOf(item);
    promptCounts[pk] = (promptCounts[pk] ?? 0) + 1;
    taskKeysUsed.push(taskKeyOf(item));
  }
  return { servedItemIds, promptCounts, taskKeysUsed };
}
