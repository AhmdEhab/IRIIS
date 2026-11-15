import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { SYNDROME_RULES, getRulesForCondition, SyndromeRuleSet } from '../constants/syndromeRules';
import type { LearningSession, PerformanceSnapshot } from '../logic/CognitiveEngine';
import { useLanguage } from './LanguageContext';
import { AUTH_TOKEN_KEY, API_URL as SHARED_API_URL } from '../config';

export type Screen =
  | 'marketing'
  | 'splash'
  | 'login'
  | 'registration'
  | 'verify-email'
  | 'iris-parent'
  | 'iris-parent-chat'
  | 'iris-progress'
  | 'iris-tips'
  | 'iris-community'
  | 'iris-specialists'
  | 'mode-selection'
  | 'ai-assessment'
  | 'child-mode'
  | 'parent-dashboard'
  | 'stories'
  | 'animals'
  | 'letters'
  | 'numbers'
  | 'colors'
  | 'life-skills'
  | 'songs'
  | 'drawing'
  | 'shapes'
  | 'fruits'
  | 'vehicles'
  | 'rewards'
  | 'memory-game'
  | 'body-parts'
  | 'emotions'
  | 'balloon-pop'
  | 'shadow-match'
  | 'games-hub'
  | 'family-guidance'
  | 'community-sessions'
  | 'iris-snapshot'
  | 'iris-ladder-assessment'
  | 'iris-ladder-practice'
  | 'parent-settings'
  | 'transition'
  | 'caregiver-profile'
  | 'ladder-plan'
  | 'iris-family-profile'
  | 'teaching-demo';

export type Condition = 'down-syndrome' | 'autism' | 'williams' | 'fragile-x' | 'other';

export interface Badge {
  id: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  descriptionAr: string;
  descriptionEn: string;
  unlocked: boolean;
}

export interface ChildProfile {
  name: string;
  age: number;
  dateOfBirth: string;
  gender: 'male' | 'female';
  country: string;
  city: string;
  motherName: string;
  motherJob: string;
  fatherName: string;
  fatherJob: string;
  phone: string;
  condition: Condition;
  syndrome?: Condition; // Alias for condition to avoid type errors in new modules
  email?: string;
  dailyTimeSpent?: Record<string, number>; // date string -> minutes
}

export interface AssessmentResult {
  level: number;
  /**
   * REMOVED: `iqScore`. IRIS produces no IQ-like construct (doc 10 §6).
   * The previous build derived it as `baseLevel + accuracy*55` with a
   * per-diagnosis baseLevel — see AIAssessmentScreen.tsx header.
   */
  completedAt: Date;
  strengths: string[];
  areasToImprove: string[];
}


export interface ModuleProgress {
  [moduleId: string]: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  taskAr: string;
  taskEn: string;
  icon: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface TransitionState {
  message: string;
  nextScreen: Screen;
  duration: number;
}


interface AppContextType {
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
  childProfile: ChildProfile | null;
  setChildProfile: (profile: ChildProfile) => void;
  assessmentResult: AssessmentResult | null;
  setAssessmentResult: (result: AssessmentResult | null) => void;
  isParentModeUnlocked: boolean;

  unlockParentMode: (password: string) => boolean;
  isReturningUser: boolean;
  setIsReturningUser: (value: boolean) => void;
  earnedBadges: string[];
  unlockBadge: (badgeId: string) => void;
  moduleProgress: ModuleProgress;
  incrementProgress: (moduleId: string) => void;
  resetProgress: () => void;
  activities: ActivityItem[];
  logActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  loginUser: (email: string, password?: string) => Promise<any>;
  motionPreference: 'auto' | 'calm' | 'lively';
  setMotionPreference: (v: 'auto' | 'calm' | 'lively') => void;
  registerUser: (profile: ChildProfile & { password?: string }) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  /**
   * Email verification flag (auth spec §3/§5). TRUE/FALSE always comes FROM
   * THE SERVER — /api/verify/status on boot, the login payload, or a
   * confirm response. null means "not loaded yet" and the router then
   * refuses to jump ahead of the truth. localStorage is never consulted.
   */
  emailVerified: boolean | null;
  setEmailVerified: (v: boolean | null) => void;
  /** Research framework: the merged caregiver Family Profile record
      ({responses, scored}) — server-owned once hydration lands; null until
      the parent finishes the questionnaire. Never used for ability levels. */
  caregiver: { responses: Record<string, any>; scored: Record<string, any> } | null;
  setCaregiver: (v: { responses: Record<string, any>; scored: Record<string, any> } | null, childId?: number | string | null) => void;
  /** Read the locally mirrored Family Profile for a given child row id. */
  caregiverForChild: (childId: number | string | null) => { responses: Record<string, any>; scored: Record<string, any> } | null;
  /** True only when the backend reported the registration OTP email sent. */
  registerEmailSent: boolean | null;
  refreshVerifyStatus: () => Promise<void>;
  /** Last auth failure as a server error code; render with authMessage(). */
  authError: string | null;
  clearAuthError: () => void;
  authToken: string | null;
  updateUser: (email: string, updates: Partial<ChildProfile & { moduleProgress: ModuleProgress; earnedBadges: string[]; assessmentResult: AssessmentResult; activities: ActivityItem[] }>) => Promise<boolean>;
  addTime: (minutes: number) => void;

  irisProfile: IrisProfile | null;
  setIrisProfile: (profile: IrisProfile | null) => void;
  reconstructIrisProfile: () => Promise<void>;
  getAiRecommendations: (contentType?: string) => Promise<any[]>;

  parentChatHistory: ChatMessage[];
  sendParentMessage: (text: string) => Promise<void>;
  activeRules: import('../constants/syndromeRules').SyndromeRuleSet;

  transitionState: TransitionState;
  startTransition: (message: string, nextScreen: Screen, duration?: number) => void;

  // Integrated Cognitive Program
  currentSession: LearningSession | null;
  startDailySession: () => void;
  reportPerformance: (itemId: string, repeated: boolean, completed: boolean) => void;
}



const AppContext = createContext<AppContextType | undefined>(undefined);

const PARENT_PASSWORD = '1234'; // Simple password for demo

// Shared with the legacy community screen — see src/App/config.ts.
const API_URL = SHARED_API_URL;
/**
 * The MVP has no AI service. This constant is retained only so the two
 * remaining legacy call sites below can report honestly that the feature is
 * unavailable instead of failing silently.
 */
const AI_SERVICE_AVAILABLE = false;

export interface IrisProfile {
  child_id: string;
  age: number;
  condition: string;
  iq_score: number;
  iq_category: string;
  age_group: string;
  cognitive_level: string;
  recommended_difficulty: string;
  content_pace: string;
  strengths: string[];
  challenges: string[];
  preferred_modalities: string[];
}


/** Re-exported name kept local for readability; the key itself lives in config.ts. */
const TOKEN_KEY = AUTH_TOKEN_KEY;



/* Public URLs (spec 16E + the navigation overhaul). EVERY live screen is
   now addressable so browser back/forward covers the whole app, refresh
   lands where you left, and shared links boot through the same guards.
   One source of truth: PATH_SCREENS is derived from SCREEN_PATHS below. */
export const SCREEN_PATHS: Partial<Record<Screen, string>> = {
  marketing: '/',
  login: '/login',
  registration: '/register',
  'verify-email': '/verify',
  'iris-parent': '/parent',
  'caregiver-profile': '/caregiver',
  'ladder-plan': '/plan',
  'iris-family-profile': '/family',
  'iris-snapshot': '/snapshot',
  'iris-progress': '/progress',
  'iris-tips': '/tips',
  'iris-parent-chat': '/chat',
  'iris-community': '/community',
  'iris-specialists': '/specialists',
  'parent-settings': '/settings',
  'iris-ladder-assessment': '/assessment',
  'iris-ladder-practice': '/practice',
  'child-mode': '/play',
  stories: '/play/stories',
  animals: '/play/animals',
  letters: '/play/letters',
  numbers: '/play/numbers',
  colors: '/play/colors',
  'life-skills': '/play/life-skills',
  songs: '/play/songs',
  drawing: '/play/drawing',
  shapes: '/play/shapes',
  fruits: '/play/fruits',
  vehicles: '/play/vehicles',
  'body-parts': '/play/body-parts',
  emotions: '/play/emotions',
  rewards: '/play/rewards',
  'games-hub': '/play/games',
  'memory-game': '/play/games/memory',
  'balloon-pop': '/play/games/balloon',
  'shadow-match': '/play/games/shadow',
};
const PATH_SCREENS: Record<string, Screen> = Object.fromEntries(
  Object.entries(SCREEN_PATHS).map(([screen, path]) => [path, screen as Screen]),
);
/* The orphan legacy cluster (splash/mode-selection/ai-assessment/parent-
   dashboard/family-guidance/community-sessions/teaching-demo) intentionally
   has NO paths: direct URLs for them hit the guard and land on the hub or
   login. Their router cases are gone from App.tsx, so they ship zero bytes. */
/** Pending startTransition timer, shared so navigation can cancel it. A
    transition must NEVER yank the user after they (or the back button) left. */
const transitionHold: { timer: ReturnType<typeof setTimeout> | number } = { timer: 0 };

/**
 * Performance-driven sensory adaptation (the repo-1 mechanism, restored).
 * Reads only the child's own observed behaviour — never a diagnosis:
 *  - repeating a lot (>40% of the last 20 actions) => calm the animation down;
 *  - racing through items (>2 completions/second)  => a little more energy;
 *  - comfortable flow                               => medium.
 * Parent settings override this loop entirely (see motionPreference).
 */
function adaptFromPerformance(history: PerformanceSnapshot[]): Partial<SyndromeRuleSet> {
  const recent = history.slice(-20);
  if (recent.length < 5) return {};
  const repeatRate = recent.filter(h => h.repeated).length / recent.length;
  const rates: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].completed && !recent[i - 1].completed) {
      const dt = (recent[i].timestamp - recent[i - 1].timestamp) / 1000;
      if (dt > 0) rates.push(1 / dt);
    }
  }
  const rate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  if (repeatRate > 0.4) return { animationIntensity: 'low' };
  if (rate > 2) return { animationIntensity: 'high' };
  if (repeatRate < 0.15) return { animationIntensity: 'medium' };
  return {};
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => PATH_SCREENS[typeof window !== 'undefined' ? window.location.pathname : '/'] ?? 'marketing');
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  /**
   * Bearer token for the secure backend (bcrypt + requireAuth/requireSelf/
   * requireConsent). Persisted so a page refresh does not silently lose the
   * session. Never sent anywhere except this app's own /api/* calls.
   */
  const [authToken, setAuthTokenState] = useState<string | null>(() => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  });
  const setAuthToken = useCallback((token: string | null) => {
    setAuthTokenState(token);
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch { /* localStorage unavailable — session still works in-memory */ }
  }, []);
  const authHeaders = useCallback((): Record<string, string> => (
    authToken ? { Authorization: `Bearer ${authToken}` } : {}
  ), [authToken]);
  /**
   * Last authentication failure, as a server error code. Screens turn this
   * into a sentence via authMessage(). Held as a code rather than a string so
   * the message follows the user's current language even if they switch it
   * after the error appeared.
   */
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const clearAuthError = useCallback(() => setAuthErrorCode(null), []);
  const [assessmentResult, _setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isParentModeUnlocked, setIsParentModeUnlocked] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>(['explorer', 'beginner']);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress>({});
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [irisProfile, setIrisProfile] = useState<IrisProfile | null>(null);
  const [parentChatHistory, setParentChatHistory] = useState<ChatMessage[]>([]);
  const [transitionState, setTransitionState] = useState<TransitionState>({
    message: '',
    nextScreen: 'splash',
    duration: 3000
  });

  // Cognitive Program State
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceSnapshot[]>([]);
  const [dynamicRuleAdaptions, setDynamicRuleAdaptions] = useState<Partial<SyndromeRuleSet>>({});
  /* Parent-level sensory access control. 'auto' lets the observed-performance
     loop run; 'calm'/'lively' are the parent's explicit lock and beat it. */
  const [motionPreference, setMotionPreferenceRaw] = useState<'auto' | 'calm' | 'lively'>(() => {
    try { const v = localStorage.getItem('iris_motion_pref'); return v === 'calm' || v === 'lively' ? v : 'auto'; } catch { return 'auto'; }
  });
  const setMotionPreference = useCallback((v: 'auto' | 'calm' | 'lively') => {
    setMotionPreferenceRaw(v);
    try { localStorage.setItem('iris_motion_pref', v); } catch { /* private mode */ }
  }, []);
  const effectiveMotionIntensity: 'low' | 'medium' | 'high' =
    motionPreference === 'calm' ? 'low'
    : motionPreference === 'lively' ? 'high'
    : (dynamicRuleAdaptions.animationIntensity ?? 'medium');
  /* ── P61: account boundary on shared devices ──────────────────────────
     Everything below localStorage is per-DEVICE, but the onboarding gate
     reads it as if it were per-ACCOUNT. A brand-new family registering on
     a browser that once held another family could inherit that device's
     mirrors (family file, ladder drafts, stars) and sail past the gate.
     iris_owner_email stamps who the local data belongs to; the moment a
     DIFFERENT identity signs in or boots, the account-scoped keys are
     wiped — the server remains the only durable source, so the returning
     legitimate owner simply rehydrates from it, and nobody borrows
     another family's progress. Device prefs (language, motion, sound,
     display) are deliberately kept. */
  const ACCOUNT_SCOPED_KEYS = React.useRef<string[]>([
    'iris_child_profile',
    'iris_family_profiles_v1',
    'iris_caregiver_draft_v1',
    'iris_ladder_probe_v1',
    'iris_ladder_cal_v1',
    'iris_stars_v1',
    'iris_avatar_v1',
    'iris_stage_feedback',
  ]);
  const purgeAccountScoped = useCallback(() => {
    try { ACCOUNT_SCOPED_KEYS.current.forEach((k) => localStorage.removeItem(k)); } catch { /* private mode */ }
  }, []);
  const ensureOwnerBoundary = useCallback((nextEmail: string | null | undefined) => {
    try {
      const owner = localStorage.getItem('iris_owner_email');
      if (nextEmail && owner && owner !== nextEmail) purgeAccountScoped();
      if (nextEmail) localStorage.setItem('iris_owner_email', nextEmail);
    } catch { /* storage unavailable: nothing to protect */ }
  }, [purgeAccountScoped]);

  useEffect(() => {
    // Single global knob that useReducedMotion() and iris.css both honour.
    document.documentElement.dataset.motion = effectiveMotionIntensity;
    window.dispatchEvent(new CustomEvent('iris-motion', { detail: effectiveMotionIntensity }));
  }, [effectiveMotionIntensity]);

  const activeRules = useMemo(() => {
    const baseRules = getRulesForCondition(childProfile?.condition);
    return { ...baseRules, ...dynamicRuleAdaptions };
  }, [childProfile?.condition, dynamicRuleAdaptions]);

  /**
   * DISABLED. This previously POSTed to http://localhost:8000/assessment — a
   * Python service that does not exist anywhere in this repository, so every
   * call threw and was silently swallowed. It also fabricated an IQ value
   * (`iqScore || 40 + level*10`) to send as input.
   *
   * The profile is now computed locally and deterministically by
   * src/iris/engines/profile.js (doc 12). No network call, no IQ.
   */
  const reconstructIrisProfile = useCallback(async () => {
    return;
  }, []);

  // Auto-persist and reconstruct IRIS session
  React.useEffect(() => {
    if (childProfile && assessmentResult && !irisProfile) {
      reconstructIrisProfile();
    }
  }, [childProfile?.email, assessmentResult, !!irisProfile, reconstructIrisProfile]);




  const updateUser = useCallback(async (email: string, updates: Partial<ChildProfile & { moduleProgress: ModuleProgress; earnedBadges: string[]; assessmentResult: AssessmentResult; activities: ActivityItem[] }>) => {
    if (!authToken) return false; // requireAuth on the server will reject this anyway
    try {
      const response = await fetch(`${API_URL}/users/${email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        // Only update childProfile if relevant fields are changed
        if (updates.name || updates.age || updates.gender || updates.country || updates.city || updates.motherName || updates.motherJob || updates.fatherName || updates.fatherJob || updates.phone || updates.condition || updates.email) {
          setChildProfile(prev => prev ? { ...prev, ...updates as Partial<ChildProfile> } : null);
        }
        // Update other states if they are part of the updates
        if (updates.moduleProgress) setModuleProgress(updates.moduleProgress);
        if (updates.earnedBadges) setEarnedBadges(updates.earnedBadges);
        if (updates.assessmentResult) _setAssessmentResult(updates.assessmentResult);
        if (updates.activities) setActivities(updates.activities);
        return true;
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
    return false;
  }, []);

  const syncWithBackend = useCallback(async (updates: Partial<{ moduleProgress: ModuleProgress; earnedBadges: string[]; assessmentResult: AssessmentResult | null; activities: ActivityItem[]; dailyTimeSpent: Record<string, number> }>) => {
    if (!childProfile?.email) return;
    updateUser(childProfile.email, updates as any);
  }, [childProfile?.email, updateUser]);

  const setAssessmentResult = useCallback((result: AssessmentResult | null) => {
    _setAssessmentResult(result);
    setTimeout(() => syncWithBackend({ assessmentResult: result }), 0);
  }, [syncWithBackend]);


  /**
   * Registration hits the SECURE backend route (/api/register — bcrypt +
   * consent gate). The old build posted to /api/users, an endpoint that no
   * longer exists (it was the open, unauthenticated user dump removed as a
   * P0 security fix — see server.js and IRIS_IMPLEMENTATION_AUDIT.md §14.3).
   * That endpoint now returns 410 for anyone who still calls it.
   */
  /* P61b: the identity boundary must run BEFORE any hydration effect can
     re-pollute iris_auth_email. A function body runs on every render — the
     guard below is idempotent, so repeating it costs a key compare. */
  const ownerBoundaryRan = React.useRef(false);
  if (!ownerBoundaryRan.current) {
    ownerBoundaryRan.current = true;
    try {
      const authEmail = localStorage.getItem('iris_auth_email');
      const owner = localStorage.getItem('iris_owner_email');
      if (authEmail && owner && authEmail !== owner) {
        ACCOUNT_SCOPED_KEYS.current.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem('iris_owner_email', authEmail);
      } else if (authEmail && !owner) {
        localStorage.setItem('iris_owner_email', authEmail);
      }
      /* P61b: no token does NOT clear the stamp — an empty session is
         exactly the window where the NEXT identity (login/register) must
         find a mismatch to purge. Clearing it here erased the evidence
         that the device belonged to someone else. */
    } catch { /* private mode */ }
  }
  const registerUser = useCallback(async (profile: ChildProfile & { password?: string }) => {
    setAuthErrorCode(null);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          name: profile.name || 'Parent',
          consent_mvp_use: true,
          consent_at: new Date().toISOString(),
          moduleProgress: {},
          earnedBadges: ['explorer', 'beginner'],
          assessmentResult: null,
          activities: [],
          dailyTimeSpent: {}
        }),
      });
      if (response.ok) {
        const data = await response.json(); // { token, user, verification }
        const user = data.user || {};
        /* The fresh account owns this device's local state now — drop any
           previous family's mirrors BEFORE the gate reads them. */
        ensureOwnerBoundary(user.email || profile.email);
        setAuthToken(data.token || null);
        setRegisterEmailSent(data.verification ? data.verification.sent === true : null);
        try { localStorage.setItem('iris_auth_email', user.email || profile.email || ''); } catch {}
        const fullProfile = {
          ...profile,
          ...user,
          syndrome: profile.syndrome || profile.condition || user.condition,
        };
        setChildProfile(fullProfile as ChildProfile);
        setModuleProgress(user.moduleProgress || {});
        setEarnedBadges(user.earnedBadges || ['explorer', 'beginner']);
        setActivities(user.activities || []);
        setIsReturningUser(true);
        // Auth spec §3: a brand-new account starts unverified — the server
        // payload says so; we mirror it without deciding anything locally.
        setEmailVerified(user.emailVerified === true);
        return true;
      }
      // Surface WHY it failed. Previously this only reached the console, so a
      // duplicate email or a too-short password looked to the parent like the
      // form was simply broken.
      const errorInfo = await response.json().catch(() => ({}));
      setAuthErrorCode(errorInfo.error || 'REGISTRATION_FAILED');
      return false;
    } catch (error) {
      // A thrown fetch means the network/back end is unreachable, which is a
      // different problem from a rejected registration — say so.
      setAuthErrorCode('NETWORK');
      return false;
    }
  }, [setAuthToken]);

  const loginUser = useCallback(async (email: string, password?: string) => {
    setAuthErrorCode(null);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const payload = await response.json(); // { token, user }
        const data = payload.user || {};
        // P61: an identity change on this device purges the old account's
        // mirrors first — see ensureOwnerBoundary above. Same account = no-op.
        ensureOwnerBoundary(data.email || email);
        setAuthToken(payload.token || null);
        try { localStorage.setItem('iris_auth_email', data.email || email); } catch {}
        setChildProfile({
          email: data.email,
          name: data.name,
          age: data.age,
          condition: data.condition,
          syndrome: data.condition, // Ensure alias is set for legacy accounts
          gender: data.gender || 'male',
          motherName: data.motherName || '',
          fatherName: data.fatherName || '',
          phone: data.phone || '',
          country: data.country || '',
          city: data.city || '',
          dateOfBirth: data.dateOfBirth || '',
          motherJob: data.motherJob || '',
          fatherJob: data.fatherJob || '',
          dailyTimeSpent: data.dailyTimeSpent || {}
        });
        setModuleProgress(data.moduleProgress || {});
        setEarnedBadges(data.earnedBadges || ['explorer', 'beginner']);
        if (data.assessmentResult) {
          setAssessmentResult(data.assessmentResult);
          // Auto-reconstruction removed: it fabricated an IQ value and called
          // a service that does not exist. See reconstructIrisProfile above.
        } else {
          setAssessmentResult(null);
        }
        setActivities(data.activities || []);
        setIsReturningUser(true);
        // Auth spec §4.5/§5: verification state travels WITH the login
        // response, so a returning unverified account resumes at /verify.
        setEmailVerified(data.emailVerified === true);
        // A login is not a fresh registration: the verify screen must go
        // back to requesting a code normally.
        setRegisterEmailSent(null);
        return data;
      }
      // Wrong password / unknown email — tell the parent, don't fail silently.
      const errorInfo = await response.json().catch(() => ({}));
      setAuthErrorCode(errorInfo.error || 'INVALID_CREDENTIALS');
    } catch (error) {
      setAuthErrorCode('NETWORK');
    }
    return null;
  }, [setAuthToken]);

  /** Logout — invalidates the server-side session then clears local state. */
  const logoutUser = useCallback(async () => {
    try {
      if (authToken) {
        await fetch(`${API_URL}/logout`, { method: 'POST', headers: { ...authHeaders() } });
      }
    } catch { /* best-effort — clear local state regardless */ }
    setAuthToken(null);
    try { localStorage.removeItem('iris_auth_email'); } catch {}
    setChildProfile(null);
    setEmailVerified(null);
    setIsReturningUser(false);
    setIsParentModeUnlocked(false);
    setAssessmentResult(null);
    setModuleProgress({});
    setEarnedBadges(['explorer', 'beginner']);
    setActivities([]);
    // After logout the user lands back on the public marketing page.
    // used to drop the user on the older 'splash' screen instead, which shows
    // a different pair of entry buttons — so after logging out they landed
    // somewhere that did not match where they had started.
    // navigateTo keeps the address bar in step (the previous direct
    // setCurrentScreen left a stale /parent URL behind after logout).
    navigateTo('marketing');
    // navigateTo is intentionally NOT in the deps array: it is declared
    // later in this hook (TDZ at evaluation time) and is a stable
    // useCallback anyway.
  }, [authToken, authHeaders, setAuthToken]);

  /** Rehydrate a session on page load if a token + email survived a refresh. */
  useEffect(() => {
    if (!authToken || childProfile) return;
    let email: string | null = null;
    try { email = localStorage.getItem('iris_auth_email'); } catch { email = null; }
    if (!email) return;
    (async () => {
      try {
        const response = await fetch(`${API_URL}/users/${encodeURIComponent(email!)}`, {
          headers: { ...authHeaders() },
        });
        if (!response.ok) {
          // The stored token is stale (expired, revoked, or issued by a
          // database that has since been reset). Drop it and say so, rather
          // than leaving the app in a half-logged-in state where the parent
          // sees no profile and no explanation.
          const info = await response.json().catch(() => ({}));
          setAuthToken(null);
          try { localStorage.removeItem('iris_auth_email'); } catch {}
          if (response.status === 401) setAuthErrorCode(info.error || 'SESSION_EXPIRED');
          return;
        }
        const data = await response.json();
        setChildProfile({
          email: data.email, name: data.name, age: data.age, condition: data.condition,
          syndrome: data.condition, gender: data.gender || 'male',
          motherName: data.motherName || '', fatherName: data.fatherName || '',
          phone: data.phone || '', country: data.country || '', city: data.city || '',
          dateOfBirth: data.dateOfBirth || '', motherJob: data.motherJob || '',
          fatherJob: data.fatherJob || '', dailyTimeSpent: data.dailyTimeSpent || {},
        });
        setModuleProgress(data.moduleProgress || {});
        setEarnedBadges(data.earnedBadges || ['explorer', 'beginner']);
        if (data.assessmentResult) setAssessmentResult(data.assessmentResult);
        setEmailVerified(data.emailVerified === true);
        setActivities(data.activities || []);
        setIsReturningUser(true);
      } catch { /* silent — user can just log in again */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const logActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newItem: ActivityItem = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    setActivities(prev => {
      const newActivities = [newItem, ...prev].slice(0, 50); // Keep last 50
      setTimeout(() => syncWithBackend({ activities: newActivities }), 0);
      return newActivities;
    });
  }, [syncWithBackend]);

  // ── Email verification state (auth spec §3) — server is the source ──
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  /**
   * Whether the registration OTP email actually went out (spec: honest
   * delivery state — null = unknown/not from a fresh registration).
   */
  const [registerEmailSent, setRegisterEmailSent] = useState<boolean | null>(null);
  const refreshVerifyStatus = useCallback(async () => {
    if (!authToken) { setEmailVerified(null); return; }
    try {
      const res = await fetch(`${API_URL}/verify/status`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEmailVerified(!!data.emailVerified);
      }
    } catch { /* offline keeps the last known value; the router gates on it */ }
  }, [authToken]);
  /* Boot safety net (audit P1): if we hold a token but the rehydrator could
     not run (missing email mirror) the guards must never sit on a permanent
     null. Ask the server the moment a null + token pair appears. */
  useEffect(() => {
    if (authToken && emailVerified === null) void refreshVerifyStatus();
  }, [authToken, emailVerified, refreshVerifyStatus]);
  /* ── Research framework: the Family Profile (caregiver questionnaire) ────
     Server is the durable source; localStorage is a per-child MIRROR so the
     hub/plan screens work offline between hydrations. Keyed by the Child ROW
     id — never by name/email — so two families sharing a device don't mix. */
  const FAMILY_KEY = 'iris_family_profiles_v1';
  const [caregiver, setCaregiverState] = useState<{ responses: Record<string, any>; scored: Record<string, any> } | null>(null);
  const readFamilyMap = useCallback((): Record<string, any> => {
    try { return JSON.parse(localStorage.getItem(FAMILY_KEY) || '{}'); } catch { return {}; }
  }, []);
  const setCaregiver = useCallback((v: { responses: Record<string, any>; scored: Record<string, any> } | null, childId?: number | string | null) => {
    setCaregiverState(v);
    try {
      const map = readFamilyMap();
      const cid = String(childId ?? 'current');
      if (v) map[cid] = v; else delete map[cid];
      try { map[String(childId)].owner = localStorage.getItem('iris_auth_email') || null; } catch { /* stamped best-effort */ }
      localStorage.setItem(FAMILY_KEY, JSON.stringify(map));
    } catch { /* private mode — in-memory state still serves this session */ }
  }, [readFamilyMap]);
  const caregiverForChild = useCallback((childId: number | string | null) => {
    const map = readFamilyMap();
    const rec = map[String(childId ?? 'current')] ?? map['current'] ?? null;
    /* P61c: defense in depth — even if a purge was ever missed, a family
       mirror stamped to a DIFFERENT account is never handed to this one.
       Unstamped pre-boundary records still pass (offline legacy support). */
    if (rec && (rec as any).owner) {
      try {
        const me = localStorage.getItem('iris_auth_email');
        if (me && (rec as any).owner !== me) return null;
      } catch { /* private mode */ }
    }
    return rec;
  }, [readFamilyMap]);
  const navigateTo = useCallback((screen: Screen) => {
    clearTimeout(transitionHold.timer as ReturnType<typeof setTimeout>);
    setCurrentScreen(screen);
    try {
      const path = SCREEN_PATHS[screen];
      if (path && window.location.pathname !== path) window.history.pushState({ screen }, '', path);
    } catch { /* sandboxed iframes */ }
  }, []);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      clearTimeout(transitionHold.timer as ReturnType<typeof setTimeout>);
      const fromState = (e.state as { screen?: Screen } | null)?.screen;
      const next = fromState ?? PATH_SCREENS[window.location.pathname];
      // Unknown history entries (typed paths, hand-made bookmarks) must not
      // leave the screen frozen under a changed URL: fall back to marketing
      // and let the App guard rewrite the bar to a canonical route.
      setCurrentScreen(next ?? 'marketing');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const unlockParentMode = useCallback((password: string) => {
    if (password === PARENT_PASSWORD) {
      setIsParentModeUnlocked(true);
      return true;
    }
    return false;
  }, []);

  const unlockBadge = useCallback((badgeId: string) => {
    setEarnedBadges(prev => {
      const newBadges = [...new Set([...prev, badgeId])];
      if (newBadges.length !== prev.length) {
        setTimeout(() => syncWithBackend({ earnedBadges: newBadges }), 0);
      }
      return newBadges;
    });
  }, [syncWithBackend]);

  const incrementProgress = useCallback((moduleId: string) => {
    setModuleProgress(prev => {
      const current = prev[moduleId] || 0;
      if (current >= 100) return prev;
      const newProgress = { ...prev, [moduleId]: Math.min(100, current + 10) };
      setTimeout(() => syncWithBackend({ moduleProgress: newProgress }), 0);
      return newProgress;
    });
  }, [syncWithBackend]);

  const resetProgress = useCallback(() => {
    setModuleProgress({});
    syncWithBackend({ moduleProgress: {} });
  }, [syncWithBackend]);

  const addTime = useCallback((minutes: number) => {
    setChildProfile(prev => {
      if (!prev) return null;
      const today = new Date().toISOString().split('T')[0];
      const currentDailyTime = prev.dailyTimeSpent || {};
      const newDailyTime = {
        ...currentDailyTime,
        [today]: (currentDailyTime[today] || 0) + minutes
      };

      // Use setTimeout to avoid side effects during render
      setTimeout(() => syncWithBackend({ dailyTimeSpent: newDailyTime } as any), 0);

      return { ...prev, dailyTimeSpent: newDailyTime };
    });
  }, [syncWithBackend]);

  /**
   * DISABLED. There is no AI recommendation service in this repository.
   * Returns an empty list rather than pretending to call one.
   */
  const getAiRecommendations = useCallback(async (_contentType?: string) => {
    if (!AI_SERVICE_AVAILABLE) return [];
    return [];
  }, []);



  /**
   * DISABLED in the legacy surface. The working parent chatbot is the
   * rule-based, knowledge-base-backed one at
   * src/App/components/iris/IrisParentChat.tsx (src/iris/parent/chatbot.js).
   * It cannot invent a citation, a diagnosis, or a benefit claim.
   */
  const sendParentMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user', text, timestamp: new Date().toISOString(),
    };
    const reply: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'ai',
      text: 'هذه الشاشة القديمة معطّلة. استخدمي «اسألي IRIS» في وضع الوالدين الجديد.',
      timestamp: new Date().toISOString(),
    };
    setParentChatHistory((prev) => [...prev, userMsg, reply]);
  }, []);

  const startTransition = useCallback((message: string, nextScreen: Screen, duration: number = 3000) => {
    setTransitionState({ message, nextScreen, duration });
    setCurrentScreen('transition');
    // The address bar moves to the DESTINATION immediately (replace, so the
    // interstitial adds no history entry): back from here leaves the flow,
    // and navigateTo/popstate cancel this timer — no blind yank mid-navigation.
    try {
      const dest = SCREEN_PATHS[nextScreen];
      if (dest) window.history.replaceState({ screen: nextScreen }, '', dest);
    } catch { /* sandboxed iframes */ }
    clearTimeout(transitionHold.timer as ReturnType<typeof setTimeout>);
    transitionHold.timer = setTimeout(() => {
      setCurrentScreen(nextScreen);
    }, duration);
  }, []);

  const startDailySession = useCallback(() => {
    if (!childProfile) return;
    const session: LearningSession | null = null;
    void session;
    startTransition(
      language === 'ar' ? 'نحن نجهز لك مغامرة مخصصة...' : 'Preparing your custom adventure...',
      (assessmentResult ? 'iris-ladder-practice' : 'iris-ladder-assessment') /* the ladder engine is the router now */,
      2500
    );
  }, [childProfile, moduleProgress, performanceHistory, startTransition, language]);

  const reportPerformance = useCallback((itemId: string, repeated: boolean, completed: boolean) => {
    const snapshot: PerformanceSnapshot = {
      itemId,
      repeated,
      completed,
      timestamp: Date.now()
    };

    setPerformanceHistory(prev => {
      const newHistory = [...prev, snapshot].slice(-100); // Keep last 100

      // Evaluate and adapt rules if enough data exists
      if (newHistory.length % 5 === 0) {
        const adaptions: Partial<SyndromeRuleSet> = motionPreference === 'auto' ? adaptFromPerformance(newHistory) : {};
        if (Object.keys(adaptions).length > 0) {
          console.log("Pedagogical Engine: Adapting rules", adaptions);
          setDynamicRuleAdaptions(prev => ({ ...prev, ...adaptions }));
        }
      }
      return newHistory;
    });

    if (completed) {
      incrementProgress(itemId); // Use internal ID for granular tracking
    }
  }, [activeRules, incrementProgress, motionPreference]);

  return (
    <AppContext.Provider
      value={useMemo(() => ({
        motionPreference, setMotionPreference,
        currentScreen,
        navigateTo,
        childProfile,
        setChildProfile,
        assessmentResult,
        setAssessmentResult,
        isParentModeUnlocked,
        unlockParentMode,
        isReturningUser,
        setIsReturningUser,
        earnedBadges,
        unlockBadge,
        moduleProgress,
        incrementProgress,
        resetProgress,
        activities,
        logActivity,
        loginUser,
        registerUser,
        logoutUser,
        emailVerified,
        registerEmailSent,
        setEmailVerified,
        refreshVerifyStatus,
        caregiver,
        setCaregiver,
        caregiverForChild,
        authError: authErrorCode,
        clearAuthError,
        authToken,
        updateUser,
        addTime,
        irisProfile,
        setIrisProfile,
        reconstructIrisProfile,
        getAiRecommendations,
        parentChatHistory,

        sendParentMessage,
        activeRules,
        transitionState,
        startTransition,

        currentSession,
        startDailySession,
        reportPerformance
      }), [
        motionPreference,
        setMotionPreference,
        currentScreen,
        navigateTo,
        childProfile,
        setChildProfile,
        assessmentResult,
        setAssessmentResult,
        isParentModeUnlocked,
        unlockParentMode,
        isReturningUser,
        setIsReturningUser,
        earnedBadges,
        unlockBadge,
        moduleProgress,
        incrementProgress,
        resetProgress,
        activities,
        logActivity,
        loginUser,
        registerUser,
        logoutUser,
        emailVerified,
        registerEmailSent,
        setEmailVerified,
        refreshVerifyStatus,
        caregiver,
        setCaregiver,
        caregiverForChild,
        authErrorCode,
        clearAuthError,
        authToken,
        updateUser,
        addTime,
        irisProfile,
        setIrisProfile,
        reconstructIrisProfile,
        getAiRecommendations,
        parentChatHistory,
        sendParentMessage,
        activeRules,
        transitionState,
        startTransition,
        currentSession,
        startDailySession,
        reportPerformance,
      ])}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
