/**
 * ElevenLabs narration client.
 *
 * This module is deliberately the ONLY thing that knows narration audio can
 * come from a server. AudioContext keeps its existing `speak(text, lang)`
 * signature and every one of the 76 call sites across IRIS is untouched — they
 * still just ask for a line to be spoken.
 *
 * WHAT IT GUARANTEES TO ITS CALLER
 *  - `getClip()` never throws and never rejects. It resolves to an object URL,
 *    or to null meaning "use the browser voice instead". A missing key, a dead
 *    network, a 429, an over-long line: all of them are just null.
 *  - Identical text is fetched once per session. Replaying a line — which
 *    happens constantly, via the repeat button and on every re-render of a
 *    prompt — costs nothing and starts instantly.
 *  - It stops trying when trying is pointless. If the server reports no key
 *    configured, we stop asking for the rest of the session rather than putting
 *    a doomed round trip in front of every spoken line.
 */
import { API_URL } from '../config';
import type { Lang } from './phrases';

/** Mirror of the server's cap. Anything longer falls back rather than being
 *  billed as one enormous synthesis. */
const MAX_CHARS = 600;

/** text+lang → object URL for the decoded mp3. */
const clipCache = new Map<string, string>();
/** In-flight requests, so two components asking for the same line at the same
 *  moment produce one network call rather than two. */
const inflight = new Map<string, Promise<string | null>>();

/**
 * Availability state.
 *  'unknown'   — not probed yet
 *  'ready'     — the server has produced audio for us
 *  'unconfigured' — no key or no voice IDs; permanent for this session
 *  'offline'   — transient failure; retried after a cooldown
 */
type VoiceState = 'unknown' | 'ready' | 'unconfigured' | 'offline';
let state: VoiceState = 'unknown';
let offlineUntil = 0;
/** Consecutive network failures; two in a row triggers the cooldown so a
 *  disconnected demo machine does not stall before every single line. */
let failures = 0;
const COOLDOWN_MS = 30_000;

/**
 * Cache key. A plain space is an unambiguous separator here because `lang`
 * is always exactly "ar" or "en" — two characters — so no text can shift the
 * boundary and collide with another entry.
 *
 * This previously used a literal NUL byte as the separator, which worked but
 * made the whole file register as binary: git showed no diffs for it, grep
 * skipped it without -a, and an editor that strips control characters on save
 * would have silently rewritten it.
 */
const keyFor = (text: string, lang: Lang) => `${lang} ${text}`;

/** Whether it is currently worth asking the server at all. */
export function voiceUsable(): boolean {
  if (state === 'unconfigured') return false;
  if (state === 'offline' && Date.now() < offlineUntil) return false;
  return true;
}

/** Diagnostics for the setup check — see docs/ELEVENLABS_SETUP.md. */
export function voiceStatus() {
  return { state, cached: clipCache.size, retryInMs: Math.max(0, offlineUntil - Date.now()) };
}

/**
 * Fetch (or reuse) narration audio for one line.
 * Resolves to an object URL, or null to mean "fall back to the browser voice".
 */
export function getClip(text: string, lang: Lang): Promise<string | null> {
  const clean = text.trim();
  if (!clean || clean.length > MAX_CHARS) return Promise.resolve(null);
  if (!voiceUsable()) return Promise.resolve(null);

  const key = keyFor(clean, lang);

  const cached = clipCache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(key);
  if (pending) return pending;

  const req = (async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, lang }),
      });

      if (!res.ok) {
        // A 4xx/5xx is a server-side problem, not a dead network. Fall back for
        // this line but keep the feature enabled.
        return null;
      }

      // The route answers with JSON instead of audio when it wants us to fall
      // back, so that "not configured" is not indistinguishable from "broken".
      const type = res.headers.get('content-type') || '';
      if (type.includes('application/json')) {
        const body = await res.json().catch(() => ({}));
        if (body?.reason === 'NO_API_KEY' || body?.reason === 'NO_VOICE_ID') {
          state = 'unconfigured';
        }
        return null;
      }

      const blob = await res.blob();
      if (!blob.size) return null;

      const url = URL.createObjectURL(blob);
      clipCache.set(key, url);
      state = 'ready';
      failures = 0;
      return url;
    } catch {
      // Network-level failure: the backend is not running, or the machine is
      // offline. Back off so the whole app does not wait on a dead socket.
      failures += 1;
      if (failures >= 2) {
        state = 'offline';
        offlineUntil = Date.now() + COOLDOWN_MS;
      }
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, req);
  return req;
}

/**
 * Synthesise a set of lines ahead of time, ignoring the results.
 *
 * Used for the small shared phrase library — the lines a child hears within
 * seconds of starting. Without this the very first "well done" waits on a
 * network round trip, which is exactly the moment a demo looks broken. After
 * the first run these are on the server's disk cache, so warming is free.
 */
export function warmClips(texts: string[], lang: Lang): void {
  if (!voiceUsable()) return;
  for (const t of texts) {
    const clean = t.trim();
    if (clean && clean.length <= MAX_CHARS && !clipCache.has(keyFor(clean, lang))) {
      warmQueue.push({ text: clean, lang });
    }
  }
  pumpWarmQueue();
}

/**
 * Pre-synthesis is queued, not fired all at once.
 *
 * The first version called getClip() for the whole phrase library in a single
 * loop — around twenty simultaneous POSTs. ElevenLabs limits how many
 * syntheses one account may have in flight, so most of that burst came back
 * 429, and because the burst was kicked off BEFORE the line the child was
 * actually waiting for, the live line was often the one that got rejected.
 * The symptom was narration that "sometimes" fell back to the browser voice —
 * or, on a low concurrency allowance, always did.
 *
 * Two at a time, and only ever behind the live request, keeps warming free of
 * charge to the thing the child is waiting to hear.
 */
const warmQueue: { text: string; lang: Lang }[] = [];
const WARM_CONCURRENCY = 2;
let warmActive = 0;

function pumpWarmQueue(): void {
  while (warmActive < WARM_CONCURRENCY && warmQueue.length) {
    const job = warmQueue.shift()!;
    warmActive += 1;
    void getClip(job.text, job.lang).finally(() => {
      warmActive -= 1;
      // Stop the whole queue the moment the feature is known to be unusable,
      // rather than grinding through twenty doomed requests.
      if (voiceUsable()) pumpWarmQueue();
      else warmQueue.length = 0;
    });
  }
}

/** Release object URLs. Called on provider unmount. */
export function releaseClips(): void {
  clipCache.forEach((url) => {
    try { URL.revokeObjectURL(url); } catch { /* ignore */ }
  });
  clipCache.clear();
}
