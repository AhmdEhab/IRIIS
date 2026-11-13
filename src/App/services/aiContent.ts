/**
 * Client side of the constrained generation layer.
 *
 * ── THE ONE THING THIS IS FOR ─────────────────────────────────────────────
 * Topping up a practice activity that the reviewed bank could not fill.
 *
 * 45 of the 70 (strand × rung × tier × format) slots in the bank hold fewer
 * than four items. When the engine holds a child at a rung — which is the
 * common case, and the correct one — that child meets the same three questions
 * again and again. The adaptation is real but the content behind it runs out,
 * and repetition of identical items stops measuring the skill and starts
 * measuring memory of the item.
 *
 * ── WHAT IT IS NOT FOR ────────────────────────────────────────────────────
 * It does not choose the skill, the rung, the tier, the format, the number of
 * options, or when to move. Every one of those arrives from the engine and is
 * passed through to the server, which re-checks them against the real ladders
 * before any request is made. If this whole file were deleted, IRIS would
 * assess, adapt, record and explain exactly as it does now — the child would
 * simply see the bank's items more often.
 *
 * ── FAILURE IS THE DEFAULT, NOT THE EXCEPTION ─────────────────────────────
 * No key, no network, a slow response, a refused request, a model that writes
 * something unsafe: every one of these returns an empty array. There is no
 * error path that a child or a parent can see, because the correct behaviour
 * in all of them is the behaviour they already had.
 */
import { API_URL, authHeaders } from '../config';

/** The bank's item shape, so a generated item is indistinguishable downstream. */
export type PracticeItem = {
  item_id: string;
  prompt: { ar: string; en: string };
  options: string[];
  correct_index: number;
  hint?: { ar: string; en: string } | null;
  source?: string;
  validation_status?: string;
  specialist_review_status?: string;
};

/** Don't hold a child's screen waiting for content that is a bonus. */
const CLIENT_TIMEOUT_MS = 6000;

/**
 * Reshape a server-generated item into the bank's shape.
 *
 * The generated item has one prompt in one language; the bank's items carry
 * both. The missing language is left EMPTY rather than machine-filled: an
 * item generated in Arabic has no reviewed English wording, and inventing one
 * on the client would be exactly the kind of quiet fabrication this codebase
 * is careful about. The item card falls back to `fallbackPrompt`, and a
 * language switch mid-activity shows the activity's own label instead of a
 * confidently wrong translation.
 */
function toBankShape(raw: any, language: 'ar' | 'en'): PracticeItem {
  const both = (v: string | null) => ({
    ar: language === 'ar' ? (v ?? '') : '',
    en: language === 'en' ? (v ?? '') : '',
  });
  return {
    item_id: raw.item_id,
    prompt: both(raw.prompt),
    options: raw.options,
    correct_index: raw.correct_index,
    hint: raw.hint ? both(raw.hint) : null,
    source: raw.source,
    validation_status: raw.validation_status,
    specialist_review_status: raw.specialist_review_status,
  };
}

/**
 * Ask for `want` extra items for an activity the engine has already planned.
 *
 * @param activity  a materialised plan activity — strand, rung, tier, template
 * @param want      how many are missing. Zero or fewer means don't ask.
 * @returns         extra items, or `[]` for every failure mode there is
 */
export async function topUpActivityItems(
  activity: any,
  { language, want }: { language: 'ar' | 'en'; want: number }
): Promise<PracticeItem[]> {
  if (!activity || want <= 0) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/ai/items`, {
      method: 'POST',
      signal: controller.signal,
      // Authenticated: generation is billable, so the route refuses anonymous
      // callers. A signed-out session simply gets an empty array and the bank.
      headers: authHeaders(),
      body: JSON.stringify({
        // Straight from the plan. Nothing here is chosen by this file, and
        // nothing identifying a child is included — there is no field for it.
        strand: activity.strand,
        rung: activity.rung,
        tier: activity.tier,
        template_id: activity.template_id,
        language,
        count: Math.min(want, 4),
        // So a "variant" is actually different from what is already on offer.
        avoid: (activity.items ?? [])
          .map((i: any) => i?.prompt?.[language])
          .filter(Boolean)
          .slice(0, 8),
      }),
    });
    if (!res.ok) return [];
    const body = await res.json();
    if (!Array.isArray(body?.items)) return [];
    return body.items.map((i: any) => toBankShape(i, language));
  } catch {
    // Offline, aborted, refused, malformed — all the same answer: use the bank.
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Whether generation is available, for an operator-facing status view. */
export async function aiStatus(): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/ai/status`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
