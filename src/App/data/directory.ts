import { API_URL } from '../config';
import { MOCK_SPECIALISTS, type Specialist } from './mockSpecialists';
import {
  COMMUNITY_CATEGORIES, MOCK_POSTS, COMMUNITY_TIPS,
  type CommunityCategory, type CommunityPost,
} from './mockCommunity';

/**
 * The seam between demo data and the real database.
 *
 * WHY THIS FILE EXISTS
 * Screens must never import mockSpecialists or mockCommunity directly. If they
 * did, swapping to real data would mean editing every screen, and the demo
 * records would stay reachable from production code paths. Instead the screens
 * call these functions, which already have the SHAPE of the real API:
 * asynchronous, fallible, returning the same types either way.
 *
 * HOW TO GO LIVE — the whole change is on this page
 *
 *   1. Build the endpoints. They should return the same shapes:
 *        GET /api/specialists            → Specialist[]
 *        GET /api/community/categories   → CommunityCategory[]
 *        GET /api/community/posts        → CommunityPost[]
 *      Real specialist rows must carry verification_status 'VERIFIED' and
 *      is_demo false. A row that is not verified must not be returned.
 *
 *   2. Flip USE_DEMO_DIRECTORY to false (or set VITE_USE_DEMO_DIRECTORY=false).
 *
 *   3. Delete mockSpecialists.ts and mockCommunity.ts.
 *
 * No screen changes. No component knows which source it is reading.
 *
 * WHILE THE FLAG IS ON
 * `isDemoDirectory()` is true, and every screen is expected to say so on the
 * page. That is not decoration: a demo directory that does not announce itself
 * is indistinguishable from a real one, which is exactly the failure this
 * whole layer is built to prevent.
 */

/**
 * Demo mode. The env var lets a deployment turn it off without a code change;
 * the default stays true until real verified profiles exist.
 */
export const USE_DEMO_DIRECTORY: boolean =
  ((import.meta as any).env.VITE_USE_DEMO_DIRECTORY ?? 'true') !== 'false';

export const isDemoDirectory = () => USE_DEMO_DIRECTORY;

/** Small helper so a dead backend degrades to an empty list, never a crash. */
async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

/**
 * The specialist directory.
 *
 * The live branch filters to VERIFIED and drops anything still flagged demo,
 * so a stray demo row on the server can never reach a parent even if the flag
 * is off. Belt and braces, deliberately.
 */
export async function listSpecialists(): Promise<Specialist[]> {
  if (USE_DEMO_DIRECTORY) return MOCK_SPECIALISTS;
  const rows = await get<Specialist[]>('/specialists', []);
  return rows.filter((s) => s.verification_status === 'VERIFIED' && !s.is_demo);
}

export async function listCommunityCategories(): Promise<CommunityCategory[]> {
  if (USE_DEMO_DIRECTORY) return COMMUNITY_CATEGORIES;
  return get<CommunityCategory[]>('/community/categories', []);
}

export async function listCommunityPosts(categoryId?: string): Promise<CommunityPost[]> {
  const all = USE_DEMO_DIRECTORY
    ? MOCK_POSTS
    : await get<CommunityPost[]>('/community/posts', []);
  return categoryId ? all.filter((p) => p.category_id === categoryId) : all;
}

export async function listCommunityTips() {
  if (USE_DEMO_DIRECTORY) return COMMUNITY_TIPS;
  return get<typeof COMMUNITY_TIPS>('/community/tips', []);
}

export type { Specialist, CommunityCategory, CommunityPost };
