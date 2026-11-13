/**
 * Single source of truth for the backend base URL.
 *
 * Previously this string was hardcoded in AppContext and again, separately, in
 * four fetch calls inside CommunitySessionsScreen. That meant changing the
 * backend host silently broke the community screen while the rest of the app
 * kept working. One constant, imported everywhere, removes that class of bug.
 *
 * VITE_API_URL lets a deployment point at a real host without a code change;
 * the localhost default is what `npm run dev` + `npm run server` expect.
 */
export const API_URL: string =
  (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Single source of truth for where the session's bearer token is kept.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * The key was written out as a bare string in AppContext (`iris_auth_token`)
 * and, separately, as a *different* bare string in every module that wanted to
 * make an authenticated call (`iris_token`). The mismatch is silent: the fetch
 * still goes out, just with no Authorization header, so the server answers 401
 * and the write disappears. That is exactly how assessment persistence came to
 * look implemented while never once reaching the database. One constant and one
 * helper, imported everywhere, removes the whole class of bug.
 *
 * The token is read from localStorage rather than passed down so that non-React
 * call sites (fire-and-forget writes inside callbacks) can use it too. It is
 * only ever attached to this app's own API_URL calls.
 */
export const AUTH_TOKEN_KEY = 'iris_auth_token';

export function readAuthToken(): string | null {
  try { return localStorage.getItem(AUTH_TOKEN_KEY); } catch { return null; }
}

/** Request headers for an authenticated JSON call. Omits the header entirely when signed out. */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = readAuthToken();
  return { 'Content-Type': 'application/json', ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
