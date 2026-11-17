/* P65: chunk-loading self-healing.
 *
 * React.lazy permanently caches a rejected import promise: once a lazy
 * route's chunk fails to fetch (stale build after a redeploy, a flaky
 * network mid-navigation), even the "retry" card re-throws the SAME cached
 * error forever. This wrapper instead:
 *   1. re-imports after a short delay (transient failures recover in place),
 *   2. on persistent failure performs ONE full document reload — which
 *      re-fetches index.html and the new hashed entry, the only reliable
 *      cure for stale-chunk 404s after a deployment — guarded per tab by
 *      sessionStorage so a true offline loop can never spin,
 *   3. clears the guard the first time any route succeeds, so a later
 *      deployment can heal this tab again.
 * If the reload already happened and chunks still fail, the caller's
 * RouteBoundary card (with a manual retry) is shown, as before.
 */
import React from 'react';

const RELOAD_KEY = 'iris_chunk_reloaded';

function readGuard(): boolean {
  try { return sessionStorage.getItem(RELOAD_KEY) === '1'; } catch { return false; }
}
function writeGuard(): void {
  try { sessionStorage.setItem(RELOAD_KEY, '1'); } catch { /* private mode */ }
}
function clearGuard(): void {
  try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* private mode */ }
}

type RecoveryDeps = {
  reload?: () => void;
  wait?: (ms: number) => Promise<void>;
  readGuard?: () => boolean;
  writeGuard?: () => void;
  clearGuard?: () => void;
};

/** The retry → one-hard-reload → give-up sequence, exposed for tests. */
export async function importWithRecovery<T extends Record<string, any>>(
  loader: () => Promise<T>,
  name: string,
  deps: RecoveryDeps = {},
): Promise<{ default: unknown }> {
  const reload = deps.reload ?? (() => { try { location.reload(); } catch { /* test */ } });
  const wait = deps.wait ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const read = deps.readGuard ?? readGuard;
  const write = deps.writeGuard ?? writeGuard;
  const clear = deps.clearGuard ?? clearGuard;
  return await inner();

  async function inner(): Promise<{ default: unknown }> {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const m = await loader();
        clear(); // this tab can heal again after future deploys
        return { default: m[name] } as unknown as { default: React.ComponentType<any> };
      } catch (e) {
        lastErr = e;
        if (attempt === 0) await wait(700);
      }
    }
    if (!read()) {
      // Stale or unreachable build: hard-refresh ONCE to pull fresh assets.
      write();
      reload();
      // Never resolve — the browser is navigating away.
      return new Promise<{ default: unknown }>(() => {});
    }
    throw lastErr; // card + manual retry as last resort
  }
}

export function lazyWithRecovery<T extends Record<string, any>>(
  loader: () => Promise<T>,
  name: string,
  deps: RecoveryDeps = {},
) {
  return React.lazy(async () => importWithRecovery(loader, name, deps) as { default: React.ComponentType<any> });
}
