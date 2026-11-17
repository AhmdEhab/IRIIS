import React from 'react';
import { motion, AnimatePresence, MotionConfig} from 'motion/react';
import { useReducedMotion } from './hooks/useReducedMotion';
import { pageVariants, pageVariantsCalm } from './motion/tokens';
import { AudioProvider } from './contexts/AudioContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useLanguage } from './contexts/LanguageContext';
import { AppProvider, useApp, type Screen, SCREEN_PATHS } from './contexts/AppContext';
import { IrisProvider, useIris } from './contexts/IrisContext';
import { API_URL, authHeaders, readAuthToken } from './config';
import { LoginScreen } from './components/LoginScreen';
import { RegistrationScreen } from './components/RegistrationScreen';
import { LandingPage } from './components/landing/LandingPage';
import { EmailVerificationScreen } from './components/EmailVerificationScreen';
import { mapCondition } from './components/iris/IrisFlow';
/* Route-level code splitting (performance spec §4): only the landing shell,
   the auth trio and the providers are eager; every other screen ships as its
   own chunk fetched the moment it is asked for. The navigation overhaul made
   all of them addressable, so none of them may block first paint. */
const lazyN = (loader: () => Promise<Record<string, any>>, name: string) =>
  lazyWithRecovery(loader, name);
const CaregiverProfileScreen = lazyN(() => import('./components/CaregiverProfileScreen'), 'CaregiverProfileScreen');
const IrisFirstPlan = lazyN(() => import('./components/iris/IrisFirstPlan'), 'IrisFirstPlan');
const IrisResultsScreen = lazyN(() => import('./components/iris/IrisResultsScreen'), 'IrisResultsScreen');
const IrisFamilyProfile = lazyN(() => import('./components/iris/IrisFamilyProfile'), 'IrisFamilyProfile');
const LandingChildMode = lazyN(() => import('./components/LandingChildMode'), 'LandingChildMode');
const IrisParentDashboard = lazyN(() => import('./components/iris/IrisParentDashboard'), 'IrisParentDashboard');
const IrisParentChat = lazyN(() => import('./components/iris/IrisParentChat'), 'IrisParentChat');
const IrisStoryPlayer = lazyN(() => import('./components/iris/IrisStoryPlayer'), 'IrisStoryPlayer');
const IrisParentHome = lazyN(() => import('./components/iris/IrisParentHome'), 'IrisParentHome');
const IrisHomeTips = lazyN(() => import('./components/iris/IrisHomeTips'), 'IrisHomeTips');
const IrisCommunity = lazyN(() => import('./components/iris/IrisCommunity'), 'IrisCommunity');
const IrisLearningSnapshot = lazyN(() => import('./components/iris/IrisLearningSnapshot'), 'IrisLearningSnapshot');
const IrisLadderAssessment = lazyN(() => import('./components/iris/IrisLadderAssessment'), 'IrisLadderAssessment');
const IrisLadderPractice = lazyN(() => import('./components/iris/IrisLadderPractice'), 'IrisLadderPractice');
const IrisSpecialists = lazyN(() => import('./components/iris/IrisSpecialists'), 'IrisSpecialists');
const AnimalsScreen = lazyN(() => import('./components/AnimalsScreen'), 'AnimalsScreen');
const LettersScreen = lazyN(() => import('./components/LettersScreen'), 'LettersScreen');
const NumbersScreen = lazyN(() => import('./components/NumbersScreen'), 'NumbersScreen');
const ColorsScreen = lazyN(() => import('./components/ColorsScreen'), 'ColorsScreen');
const LifeSkillsScreen = lazyN(() => import('./components/LifeSkillsScreen'), 'LifeSkillsScreen');
const SongsScreen = lazyN(() => import('./components/SongsScreen'), 'SongsScreen');
const DrawingScreen = lazyN(() => import('./components/DrawingScreen'), 'DrawingScreen');
const ShapesScreen = lazyN(() => import('./components/ShapesScreen'), 'ShapesScreen');
const FruitsScreen = lazyN(() => import('./components/FruitsScreen'), 'FruitsScreen');
const VehiclesScreen = lazyN(() => import('./components/VehiclesScreen'), 'VehiclesScreen');
const RewardsScreen = lazyN(() => import('./components/RewardsScreen'), 'RewardsScreen');
const MemoryGameScreen = lazyN(() => import('./components/MemoryGameScreen'), 'MemoryGameScreen');
const GamesHubScreen = lazyN(() => import('./components/GamesHubScreen'), 'GamesHubScreen');
const BalloonPopScreen = lazyN(() => import('./components/BalloonPopScreen'), 'BalloonPopScreen');
const ShadowMatchScreen = lazyN(() => import('./components/ShadowMatchScreen'), 'ShadowMatchScreen');
const EmotionsScreen = lazyN(() => import('./components/EmotionsScreen'), 'EmotionsScreen');
const BodyPartsScreen = lazyN(() => import('./components/BodyPartsScreen'), 'BodyPartsScreen');
const ParentSettingsScreen = lazyN(() => import('./components/ParentSettingsScreen'), 'ParentSettingsScreen');
const TransitionScreen = lazyN(() => import('./components/TransitionScreen'), 'TransitionScreen');

/** Suspense floor: brand dots, never a blank page. */
function RouteFallback() {
  return (
    <div className="lc-root relative min-h-screen flex flex-col">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="lc-hero" style={{ width: 'min(460px, 92%)', textAlign: 'center' }}>
          <div className="lc-hero-dots" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
/** A chunk failing to fetch (offline mid-navigation) must not white-screen:
    offer a calm retry that re-imports the route. */
class RouteBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <div className="lc-root relative min-h-screen flex flex-col">
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="lc-hero" style={{ width: 'min(460px, 92%)', textAlign: 'center' }}>
              <p className="lc-hero-sub" dir="auto">
                {document.dir === 'rtl' ? 'حصل مشكلة في تحميل الصفحة — جرب تاني.' : 'This page failed to load — try again.'}
              </p>
              <button type="button" className="lc-btn lc-btn--primary" style={{ marginTop: 14 }} onClick={() => { try { location.reload(); } catch { this.setState({ failed: false }); } }}>
                {document.dir === 'rtl' ? 'أعيد المحاولة' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { lazyWithRecovery } from './lazyWithRecovery';
import { ChildShell } from './components/iris/ui/ChildShell';
// CommunitySessionsScreen is deliberately NOT imported. It contains four
// invented practitioners with ratings and review counts, three fabricated
// testimonials, and a live booking POST. Leaving it routed would put a parent
// two taps from "Dr. Sarah Ahmed ★4.9 (127 reviews)". The 'community-sessions'
// route now renders the labelled demo community instead. Dropping the import
// also keeps the file out of the bundle.
import { PlayfulBackground } from './components/ui/PlayfulBackground';


/* Framer keeps translate3d(0,0,0)/scale(1) in the transform even when a
   motion value settles at its default — and ANY transform (identity or not)
   turns the animated wrapper into the containing block of every position:fixed
   descendant. The page wrapper animates on every route change, so grown-up
   gates, break overlays and dialogs were measured against a 2245px-tall
   "viewport" and rendered below the fold. This template strips pure-identity
   transforms so settled screens go back to `transform: none` while still
   animating normally mid-flight. (Same trick the framer-motion docs use.) */
/* Split on ')' boundaries keeping the closer: 'translate3d(0px, 0px, 0px) scale(1)'
   → ['translate3d(0px, 0px, 0px)', 'scale(1)']. */
function transformParts(t: string): string[] {
  return (t.match(/[a-zA-Z]+\([^)]*\)/g) || []);
}
/* A transform function is 'identity' when its numbers are all 0 — or all 1
   for scale* (translateZ(0px), rotate(0deg) etc. count too). Parsing the
   numbers generalizes over motion's exact builder output format, which uses
   per-axis translateX/translateY/translateZ parts, not one translate3d. */
function partIsIdentity(part: string): boolean {
  const name = part.slice(0, part.indexOf('('));
  const nums = (part.match(/-?\d*\.?\d+/g) || []).map(Number);
  if (!nums.length) return false;
  if (name.startsWith('scale')) return nums.every(n => n === 1);
  return nums.every(n => n === 0);
}
type TransformTemplateProps = { transform: string; isDashCase?: boolean };
/* v12 template contract: (transformProperties, generatedTransform) => string.
   If the GENERATED string consists only of identity parts
   (translate3d(0px, 0px, 0px) / scale(1)…), return '' so the settled screen
   ends up `transform: none` — otherwise this animated page wrapper stays the
   containing block of every position:fixed descendant (grown-up gate, break
   overlays, dialogs), which then measure against the full 2000px+ document
   instead of the viewport and render off-screen. Mid-flight strings pass
   through untouched, so slides/scales still animate normally. */
function identitySafeTransform(_props: Record<string, any>, generated: string): string {
  if (typeof generated !== 'string' || !generated.trim()) return '';
  const parts = transformParts(generated);
  const identity = parts.length === 0 || parts.every(partIsIdentity);
  return identity ? '' : generated;
}

function AppContent() {
  const { currentScreen, addTime, navigateTo, childProfile, emailVerified, caregiver, setCaregiver, caregiverForChild, motionPreference, setMotionPreference } = useApp();
  const iris = useIris();
  const { language } = useLanguage();
  const ar = language === 'ar';
  // ── Onboarding gate: no entry to Parent/Child Mode until the getting-to-know
  // ladder assessment (reference repo IRIS flow) is COMPLETE for this child.
  const [ladderChecked, setLadderChecked] = React.useState(false);
  const [bindRetryTick, setBindRetryTick] = React.useState(0); // P62c cold-bind retry
  const bindAttemptsRef = React.useRef(0);
  /* Research framework: the FAMILY FILE (caregiver questionnaire) gates the
     hub exactly the way the ladder did — see ASSESSMENT_FRAMEWORK §1. */
  const [caregiverChecked, setCaregiverChecked] = React.useState(false);

  /* ── Auth spec §4–§7 route guards — computed once per render ──
     Applied from server-known state only, so every entry point —
     buttons, deep links, browser back/forward — obeys the same rules:
      · no token on a protected screen → login (and after logout the
        back button can only replay these guards, never stale screens)
      · unverified email on app screens → verification, except while the
        very first assessment is still pending (register → assess →
        verify is the deliberate product order)
      · signed-in AND verified on login/register/verify → straight to
        the hub: no repeat onboarding, no assessment restart, no loops */
  const PROTECTED_SCREENS: string[] = ['iris-parent', 'iris-snapshot', 'iris-progress', 'iris-tips', 'iris-parent-chat', 'iris-community', 'iris-specialists', 'parent-settings', 'child-mode', 'verify-email', 'iris-ladder-assessment', 'iris-ladder-practice', 'rewards', 'caregiver-profile', 'ladder-results', 'ladder-plan', 'iris-family-profile',
    /* Every route is now addressable, so every route must answer to the
       guards. The old list skipped all child activities — a signed-out
       stranger could deep-link /play/letters and land mid-game. */
    'stories', 'animals', 'letters', 'numbers', 'colors', 'life-skills', 'songs', 'drawing', 'shapes', 'fruits', 'vehicles', 'body-parts', 'emotions', 'games-hub', 'memory-game', 'balloon-pop', 'shadow-match', 'transition'];
  const signedInNow = !!readAuthToken();
  const firstAssessmentPending = signedInNow && !!childProfile?.name && (!ladderChecked || !caregiverChecked || !iris.ladder);
  const guardScreen = (name: string): string => {
    if (!signedInNow && PROTECTED_SCREENS.includes(name)) return 'login';
    // Spec order: REGISTER → VERIFY → (assessment if needed) → APP.
    // Verification has ABSOLUTE precedence over the onboarding assessment
    // gate: an unverified account never sees hub/child screens at all.
    if (signedInNow && emailVerified === false && PROTECTED_SCREENS.includes(name) && name !== 'verify-email') return 'verify-email';
    // Audit P1: F5 on /register with a signed-in unverified account used to
    // re-show the registration form. The account exists — the mailbox check
    // is the only thing left, so that is exactly where the URL must land.
    if (signedInNow && emailVerified === false && name === 'registration') return 'verify-email';
    if (signedInNow && emailVerified === true && (name === 'login' || name === 'registration' || name === 'verify-email')) return 'iris-parent';
    return name;
  };
  const guardedScreen = guardScreen(currentScreen);
  // When a guard rewrites the screen, the address bar follows — a stale
  // /login or /verify never lingers after an automatic redirect, and the
  // replaceState keeps back/forward from replaying auth screens.
  React.useEffect(() => {
    // The address bar must agree with what is on screen — always. First the
    // guard rewrite (stale /login after logging in etc.), then plain drift:
    // unknown typed paths, popstate fallbacks, retired ids falling through to
    // the marketing default. The bar silently becomes the canonical URL.
    const target = guardedScreen;
    const path = SCREEN_PATHS[target as Screen];
    if (path && window.location.pathname !== path) {
      window.history.replaceState({ screen: target }, '', path);
    }
  }, [guardedScreen, currentScreen]);
  // Motion direction token for the shared page transition (RTL-aware slide).
  React.useEffect(() => {
    document.documentElement.style.setProperty('--iris-dir-x', ar ? '-1' : '1');
  }, [ar]);
  React.useEffect(() => { setLadderChecked(false); setCaregiverChecked(false); }, [childProfile?.name]);

  /**
   * Bridge: once a parent has registered/logged in (AppContext.childProfile
   * exists), start the child in the engine (IrisContext) right away so the
   * Parent Dashboard already shows the right name and Child Mode never has
   * to ask again. This is presentation wiring only — it calls the same
   * startChild() the manual intake screen calls, with the same single
   * permitted diagnosis touchpoint (accommodations only).
   */
  React.useEffect(() => {
    if (childProfile?.name && !iris.childName) {
      // The age is passed through because calibration uses it — see
      // entryHint() in engines/calibration.js. It can only ever SHORTEN the
      // probe set for a very young child; it has no channel through which to
      // raise a rung. Dropping it here silently disabled that for every child.
      iris.startChild(
        childProfile.name,
        mapCondition(childProfile.condition),
        Number.isFinite(childProfile.age) ? childProfile.age : null
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childProfile?.name, childProfile?.condition]);

  /**
   * Bind this session to a Child ROW, creating one on first use.
   *
   * ── WHY THIS WAS THE BROKEN LINK ──────────────────────────────────────────
   * `POST /api/children`, `POST /api/sessions` and `GET /api/decisions/:childId`
   * all existed and all worked. Nothing ever called the first one, so no child
   * row existed, so every later call had no `childId` to write against — and
   * the whole persistence layer sat there unreachable behind a missing first
   * step. Assessments were saved only because that path passed a childId the
   * caller happened to have; practice had none at all.
   *
   * Reuses an existing row when the display name matches, so a returning parent
   * accumulates one continuous history rather than a new child per login.
   */
  React.useEffect(() => {
    if (!childProfile?.name) return;
    let cancelled = false;

    (async () => {
      if (!readAuthToken()) {
        if (!cancelled) setLadderChecked(true);
        return; // Child Mode without an account still runs, just unsaved
      }
      if (iris.childDbId) {
        await iris.loadLadderFromServer(iris.childDbId);
        await loadCaregiverFromServer(iris.childDbId);
        if (!cancelled) setLadderChecked(true);
        return;
      }
      const auth = authHeaders();
      try {
        const listed = await fetch(`${API_URL}/children`, { headers: auth });
        if (listed.ok) {
          const rows = await listed.json();
          const match = Array.isArray(rows) && rows.find((r: any) => r.displayName === childProfile.name);
          if (match && !cancelled) {
            iris.setChildDbId(match.id);
            await iris.loadLadderFromServer(match.id);
            await loadCaregiverFromServer(match.id);
            setLadderChecked(true);
            return;
          }
        }
        const created = await fetch(`${API_URL}/children`, {
          method: 'POST',
          headers: auth,
          body: JSON.stringify({
            displayName: childProfile.name,
            ageYears: Number.isFinite(childProfile.age) ? childProfile.age : null,
            // Stored for accommodation defaults only — no server route reads
            // it for scoring, level, goal or pathway. See models/Child.js.
            condition: childProfile.condition ?? null,
          }),
        });
        if (created.ok && !cancelled) {
          const row = await created.json();
          iris.setChildDbId(row.id);
          setLadderChecked(true); // brand-new child: nothing server-side yet
        } else if (!cancelled) {
          setLadderChecked(true);
          // P62c: a refused/failed bind still deserves another chance.
          try {
            const mirrored = caregiverForChild(null);
            if (mirrored?.scored) { setCaregiver(mirrored, null); setCaregiverChecked(true); }
          } catch { /* private mode */ }
          bindAttemptsRef.current += 1;
          if (readAuthToken() && bindAttemptsRef.current < 3) {
            setTimeout(() => { if (!cancelled) setBindRetryTick((x) => x + 1); }, 2500);
          }
        }
      } catch {
        // P62c: cold-boot /children failure used to strand the session with a
        // null childDbId — every later write then failed 400/404 SILENTLY and
        // the family file looped forever ('child assessment never appears').
        // Now: honour any local mirror so an already-finished file still
        // counts, say checked so the gate can act on the mirror, and retry
        // the bind up to three times for the signed-in cold start.
        if (!cancelled) {
          try {
            const mirrored = caregiverForChild(null);
            if (mirrored?.scored) { setCaregiver(mirrored, null); setCaregiverChecked(true); }
          } catch { /* private mode */ }
          setLadderChecked(true);
          bindAttemptsRef.current += 1;
          if (readAuthToken() && bindAttemptsRef.current < 3) {
            setTimeout(() => { if (!cancelled) setBindRetryTick((x) => x + 1); }, 2500);
          }
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childProfile?.name, iris.childDbId, bindRetryTick]);

  // Time tracking effect
  const startTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const childScreens = [
      'ai-assessment', 'child-mode', 'stories', 'animals', 'letters',
      'numbers', 'colors', 'life-skills', 'songs', 'drawing',
      'shapes', 'fruits', 'vehicles', 'memory-game', 'balloon-pop',
      'shadow-match', 'games-hub', 'body-parts', 'emotions', 'teaching-demo'
    ];

    const isChildScreen = childScreens.includes(currentScreen);

    if (isChildScreen) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
    } else {
      if (startTimeRef.current !== null) {
        const elapsedMinutes = Math.floor((Date.now() - startTimeRef.current) / 60000);
        if (elapsedMinutes > 0) {
          addTime(elapsedMinutes);
        }
        startTimeRef.current = null;
      }
    }

    // Interval to flush time if staying on one screen for long
    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= 60000) {
          addTime(1);
          startTimeRef.current = Date.now(); // Reset start time for next minute
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
      if (startTimeRef.current !== null) {
        const elapsedMinutes = Math.floor((Date.now() - startTimeRef.current) / 60000);
        if (elapsedMinutes > 0) {
          addTime(elapsedMinutes);
        }
        startTimeRef.current = null;
      }
    };
  }, [currentScreen, addTime]);

  /**
   * Screens a child sees. These get wrapped in ChildShell so the avatar, name
   * and star count stay on screen when a legacy activity opens — the child
   * should never feel they left IRIS for a different app. The wrapper is
   * purely visual; no legacy screen's own logic is modified.
   */
  const CHILD_SCREENS = new Set<Screen>([
    'stories', 'animals', 'letters', 'numbers', 'colors', 'life-skills',
    'songs', 'drawing', 'shapes', 'fruits', 'vehicles', 'rewards',
    'memory-game', 'balloon-pop', 'shadow-match', 'games-hub',
    'body-parts', 'emotions', 'teaching-demo',
  ]);

  /* One global gate: OS reduced-motion OR the in-app Calm preference stops
     every framer transform loop and infinite repeat across all 40 screens —
     the per-screen audit finding without touching 40 files. */
  const appMotionReduced = useReducedMotion();

  /* ── Family Profile plumbing (research framework §1/§5) ─────────────── */
  const loadCaregiverFromServer = React.useCallback(async (childId: number) => {
    const pick = (rows: any[]) => {
      for (const r of rows) {
        try {
          const parsed = typeof r.item_results === 'string' ? JSON.parse(r.item_results) : r.item_results;
          if (parsed && parsed.responses && parsed.scored) return parsed;
        } catch { /* row not ours — keep scanning */ }
      }
      return null;
    };
    try {
      const listed = await fetch(`${API_URL}/assessments/${childId}?kind=CAREGIVER`, { headers: authHeaders() });
      if (listed.ok) {
        const rows0 = await listed.json();
        const rows = (Array.isArray(rows0) ? rows0 : rows0?.records || []).filter(
          (r: any) => !r.assessment_kind || r.assessment_kind === 'CAREGIVER'
        );
        const found = pick(rows);
        if (found) { setCaregiver(found, childId); setCaregiverChecked(true); return true; }
      }
      const dr = await fetch(`${API_URL}/caregiver/draft?childId=${childId}`, { headers: authHeaders() });
      if (dr.ok) {
        const d: any = await dr.json();
        const draft = d?.draft;
        if (draft && draft.status === 'COMPLETE') {
          const resp: any = draft.responses || {};
          const scored = resp.scored ?? (resp.responses ? resp : null);
          const responses = resp.responses ?? resp ?? {};
          if (scored) {
            setCaregiver({ responses, scored }, childId); setCaregiverChecked(true);
            /* P62c: a submitted file that never clicked the big CTA still
               deserves its formal record. Backfill it here under the SAME
               deterministic clientRef the CTA path uses — the server's
               clientRef idempotency collapses any double write. */
            try {
              void fetch(`${API_URL}/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(readAuthToken() ? { Authorization: `Bearer ${readAuthToken()}` } : {}) },
                body: JSON.stringify({ childId, assessment_kind: 'CAREGIVER', clientRef: `cg-${childId}`, item_results: { responses, scored } }),
              });
            } catch { /* best effort — the draft itself already counts */ }
            return true;
          }
        }
      }
    } catch { /* offline — the local mirror below still counts */ }
    const mirrored = caregiverForChild(childId);
    if (mirrored?.scored) { setCaregiver(mirrored, childId); setCaregiverChecked(true); return true; }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  const handleCaregiverComplete = React.useCallback(async (responses: any, scored: any) => {
    const record = { responses, scored };
    setCaregiver(record, iris.childDbId ?? null);
    setCaregiverChecked(true);
    const id = iris.childDbId;
    if (!id || !readAuthToken()) return; // demo/offline: local mirror is enough for now
    const clientRef = `cg-${id}`; // P62c deterministic: server idempotency dedups CTA + boot backfill
    try {
      await fetch(`${API_URL}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        // item_results carries the WHOLE family record (responses + scored);
        // the ladder's own hydration filters on assessment_kind, so this
        // never leaks into learning-track state. clientRef makes retries safe.
        body: JSON.stringify({ childId: id, assessment_kind: 'CAREGIVER', clientRef, item_results: record }),
      });
    } catch { /* the questionnaire's own draft endpoint already kept it; login retries */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iris.childDbId, setCaregiver]);

  /* Access settings derived from the Family Profile become REAL defaults:
     big tap targets via a document flag, and a reduced-motion floor when the
     child is sensory-sensitive (the parent can still lock either way). */
  React.useEffect(() => {
    const acc = caregiver?.scored?.accessSettings;
    if (!acc) return;
    try { document.documentElement.dataset.caregiverTargets = acc.targetSize === 'large' ? 'large' : 'standard'; } catch { /* SSR/tests */ }
    if (acc.reducedMotion && motionPreference === 'auto') setMotionPreference('calm');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caregiver]);

  const renderScreen = () => {
  const gateLoading = (
    <div key="gate-loading" className="lc-root relative min-h-screen flex flex-col">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="lc-hero" style={{ width: 'min(460px, 92%)', textAlign: 'center' }}>
          <div className="lc-hero-dots" aria-hidden="true" />
          <p className="lc-hero-sub" style={{ maxWidth: 'none' }} dir={ar ? 'rtl' : 'ltr'}>
            {ar ? 'جارٍ تجهيز رحلة طفلك…' : 'Getting your child’s journey ready…'}
          </p>
        </div>
      </div>
    </div>
  );
  const assessmentGate = (_dest: string) => {
    if (!childProfile?.name) {
      // Audit P1: while a signed-in session is still rehydrating the gate
      // must OWN the screen. The hub flashing for one frame before being
      // replaced by the forced questionnaire was the worst first impression
      // of the whole product.
      return signedInNow ? gateLoading : null;
    }
    if (!ladderChecked) return gateLoading;
    if (emailVerified !== false && !(caregiverChecked && caregiver?.scored)) {
      /* P61: checked alone is not enough — the gate passes only when an
         actual scored family record is in hand (server-confirmed or the
         account's own local mirror). A stray flag can no longer unlock
         the hub. */
      // Research framework sequence: REGISTER → VERIFY → FAMILY FILE →
      // LADDER → FIRST PLAN → HUB. Suspension is safe: every answer is
      // auto-saved server-side (draft) and mirrored locally.
      return (
        <CaregiverProfileScreen
          key="caregiver-forced"
          forced
          onComplete={handleCaregiverComplete}
        />
      );
    }
    if (!iris.ladder) {
      // Auth spec §3: after a fresh registration the forced assessment hands
      // over to email verification instead of the hub — the hub is the
      // reward for a verified account, not for a finished quiz.
      return <IrisLadderAssessment key="ladder-forced" onFinish={() => navigateTo((emailVerified === false ? 'verify-email' : 'ladder-results') as any)} />;
    }
    return null;
  };

    switch (guardedScreen) {
      case 'marketing':
        return (
          <LandingPage
            key="marketing"
            isAuthenticated={!!readAuthToken()}
            onLogin={() => navigateTo('login')}
            onRegister={() => navigateTo(readAuthToken() ? 'iris-parent' : 'registration')}
            onAppMode={() => navigateTo(readAuthToken() ? 'iris-parent' : 'login')}
          />
        );
      case 'login':
        return <LoginScreen key="login" />;
      case 'registration':
        return <RegistrationScreen key="registration" />;
      case 'verify-email':
        return <EmailVerificationScreen key="verify-email" />;
      case 'caregiver-profile': if (assessmentGate('caregiver-profile')) return assessmentGate('caregiver-profile');
        return (
          <CaregiverProfileScreen
            key="caregiver-profile"
            onSuspend={() => navigateTo(caregiverChecked ? 'iris-family-profile' : 'iris-parent')}
            onComplete={(r: any, sc: any) => { handleCaregiverComplete(r, sc); navigateTo('iris-family-profile'); }}
          />
        );
      case 'ladder-results': {
        /* P62: the moment the child work ends — WHAT we saw, in words, from
           both the games and the family file. The gate still owns the route:
           land here with no finished ladder and the assessment is served
           instead, so /results can never be browsed around onboarding. */
        const gate = assessmentGate('ladder-results');
        if (gate) return gate;
        return <IrisResultsScreen key="ladder-results" />;
      }
      case 'ladder-plan': {
        const gate = assessmentGate('ladder-plan');
        if (gate) return gate;
        return (
          <IrisFirstPlan
            key="ladder-plan"
            caregiver={caregiver}
            onContinue={() => navigateTo('iris-parent')}
            onOpenFamily={() => navigateTo('iris-family-profile')}
          />
        );
      }
      case 'iris-family-profile': if (assessmentGate('iris-family-profile')) return assessmentGate('iris-family-profile');
        return (
          <IrisFamilyProfile
            key="iris-family-profile"
            caregiver={caregiver}
            onBack={() => navigateTo('iris-parent')}
            onEditCaregiver={() => navigateTo('caregiver-profile')}
            onOpenSnapshot={() => navigateTo('iris-snapshot')}
            onRetakeLadder={() => { iris.armLadderRetake(); navigateTo('iris-ladder-assessment'); }}
          />
        );
      case 'iris-parent': {
        const gate = assessmentGate('iris-parent');
        if (gate) return gate;
        // Parent Mode is now a hub of five sections. The original dashboard is
        // preserved unchanged as the 'iris-progress' section below.
        return (
          <IrisParentHome
            key="iris-parent"
            onSnapshot={() => navigateTo('iris-snapshot')}
            onProgress={() => navigateTo('iris-progress')}
            onTips={() => navigateTo('iris-tips')}
            onChat={() => navigateTo('iris-parent-chat')}
            onCommunity={() => navigateTo('iris-community')}
            onSpecialists={() => navigateTo('iris-specialists')}
            onEnterChildMode={() => navigateTo('child-mode')}
            onSettings={() => navigateTo('parent-settings')}
            onFamilyProfile={() => navigateTo('iris-family-profile')}
            onBack={() => navigateTo('marketing')}
          />
        );
      }
      case 'iris-progress': if (assessmentGate('iris-progress')) return assessmentGate('iris-progress');
        return (
          <IrisParentDashboard
            key="iris-progress"
            onOpenChat={() => navigateTo('iris-parent-chat')}
            onBack={() => navigateTo('iris-parent')}
            onEnterChildMode={() => navigateTo('child-mode')}
          />
        );
      case 'iris-tips': if (assessmentGate('iris-tips')) return assessmentGate('iris-tips');
        return <IrisHomeTips key="iris-tips" onBack={() => navigateTo('iris-parent')} />;
      case 'iris-ladder-assessment': if (assessmentGate('iris-ladder-assessment')) return assessmentGate('iris-ladder-assessment');
        /* P62: finishing the ladder — first time OR a retake from the
           snapshot — now lands on the family-facing RESULTS screen, which
           replaced the old snapshot hand-off as the reward moment. Mid-run
           exits still return to the snapshot so the draft has a home. */
        return <IrisLadderAssessment key="iris-ladder-assessment" onFinish={() => navigateTo('ladder-results')} onExit={() => navigateTo('iris-snapshot')} />;
      case 'iris-ladder-practice': if (assessmentGate('iris-ladder-practice')) return assessmentGate('iris-ladder-practice');
        return <IrisLadderPractice key="iris-ladder-practice" onFinish={() => navigateTo('ladder-results')} />;
      case 'iris-snapshot': if (assessmentGate('iris-snapshot')) return assessmentGate('iris-snapshot');
        return (
          <IrisLearningSnapshot
            key="iris-snapshot"
            onBack={() => navigateTo('iris-parent')}
            onStart={() => navigateTo('iris-ladder-assessment')}
            onPractise={() => navigateTo('iris-ladder-practice')}
          />
        );
      case 'iris-community': if (assessmentGate('iris-community')) return assessmentGate('iris-community');
        return <IrisCommunity key="iris-community" onBack={() => navigateTo('iris-parent')} />;
      case 'iris-specialists': if (assessmentGate('iris-specialists')) return assessmentGate('iris-specialists');
        return <IrisSpecialists key="iris-specialists" onBack={() => navigateTo('iris-parent')} />;
      case 'iris-parent-chat': if (assessmentGate('iris-parent-chat')) return assessmentGate('iris-parent-chat');
        return <IrisParentChat key="iris-parent-chat" onBack={() => navigateTo('iris-parent')} />;
      case 'child-mode': {
        const gate = assessmentGate('child-mode');
        if (gate) return gate;
        // The repository's child home (hero + curriculum categories), wearing
        // the landing page's design language. The adaptive IrisFlow stays
        // reachable from the parent hub's snapshot screen.
        return <LandingChildMode key="child-mode" />;
      }
      case 'stories': if (assessmentGate('stories')) return assessmentGate('stories');
        // The old text-paragraph StoriesScreen is preserved in the repo but no
        // longer routed: stories are now scene-based visual experiences.
        return <IrisStoryPlayer key="stories" onExit={() => navigateTo('child-mode')} />;
      case 'animals': if (assessmentGate('animals')) return assessmentGate('animals');
        return <AnimalsScreen key="animals" />;
      case 'letters': if (assessmentGate('letters')) return assessmentGate('letters');
        return <LettersScreen key="letters" />;
      case 'numbers': if (assessmentGate('numbers')) return assessmentGate('numbers');
        return <NumbersScreen key="numbers" />;
      case 'colors': if (assessmentGate('colors')) return assessmentGate('colors');
        return <ColorsScreen key="colors" />;
      case 'life-skills': if (assessmentGate('life-skills')) return assessmentGate('life-skills');
        return <LifeSkillsScreen key="life-skills" />;
      case 'songs': if (assessmentGate('songs')) return assessmentGate('songs');
        return <SongsScreen key="songs" />;
      case 'drawing': if (assessmentGate('drawing')) return assessmentGate('drawing');
        return <DrawingScreen key="drawing" />;
      case 'shapes': if (assessmentGate('shapes')) return assessmentGate('shapes');
        return <ShapesScreen key="shapes" />;
      case 'fruits': if (assessmentGate('fruits')) return assessmentGate('fruits');
        return <FruitsScreen key="fruits" />;
      case 'vehicles': if (assessmentGate('vehicles')) return assessmentGate('vehicles');
        return <VehiclesScreen key="vehicles" />;
      case 'rewards': if (assessmentGate('rewards')) return assessmentGate('rewards');
        return <RewardsScreen key="rewards" />;
      case 'memory-game': if (assessmentGate('memory-game')) return assessmentGate('memory-game');
        return <MemoryGameScreen key="memory-game" />;
      case 'balloon-pop': if (assessmentGate('balloon-pop')) return assessmentGate('balloon-pop');
        return <BalloonPopScreen key="balloon-pop" />;
      case 'shadow-match': if (assessmentGate('shadow-match')) return assessmentGate('shadow-match');
        return <ShadowMatchScreen key="shadow-match" />;
      case 'games-hub': if (assessmentGate('games-hub')) return assessmentGate('games-hub');
        return <GamesHubScreen key="games-hub" />;
      case 'body-parts': if (assessmentGate('body-parts')) return assessmentGate('body-parts');
        return <BodyPartsScreen key="body-parts" />;
      case 'emotions': if (assessmentGate('emotions')) return assessmentGate('emotions');
        return <EmotionsScreen key="emotions" />;
      case 'parent-settings': if (assessmentGate('parent-settings')) return assessmentGate('parent-settings');
        return <ParentSettingsScreen key="parent-settings" />;
      case 'transition':
        return <TransitionScreen key="transition" />;
      default:
        // Retired (splash, mode-selection, ai-assessment, parent-dashboard,
        // family-guidance, community-sessions, teaching-demo) or unknown ids
        // land on the landing page; the URL sync effect rewrites the bar.
        // These legacy screens are unreachable duplicates of the live hub —
        // flagged for the owner's delete-confirm, sources kept on disk.
        return (
          <LandingPage
            key="default-fallback"
            isAuthenticated={!!readAuthToken()}
            onLogin={() => navigateTo('login')}
            onRegister={() => navigateTo(readAuthToken() ? 'iris-parent' : 'registration')}
            onAppMode={() => navigateTo(readAuthToken() ? 'iris-parent' : 'login')}
          />
        );
    }
  };

  return (
    /* bg-ground, not bg-white. The app only LOOKED warm because
       PlayfulBackground paints the ground as a fixed layer behind everything;
       the root itself was pure white, so the identity depended on a purely
       decorative component continuing to exist. Now the ground is real. */
    <MotionConfig reducedMotion={appMotionReduced ? 'always' : 'user'} transformTemplate={identitySafeTransform as any}>
    <div className={`${currentScreen === 'marketing' ? 'w-full min-h-screen overflow-visible' : 'size-full overflow-hidden'} bg-ground relative`}>
      {currentScreen !== 'marketing' && <PlayfulBackground />}
      {/* GlobalControls used to be mounted here: a glassmorphism pill fixed at
          top-4 right-4 z-[100] above every screen. It floated over whatever
          each screen put in that corner, which is where audit defects D1
          ("Log out" unreadable on Parent Home), D2 ("Back" rendering as
          "BaAR" on Ask IRIS) and D6 (two language controls on the landing
          screen) all came from. Its two controls — mute and language — now
          live inside TopBar via <ChromeActions/>, in the layout rather than
          on top of it, so they cannot collide with anything. */}

      {currentScreen === 'marketing' ? (
        /* P66: the landing page renders in a STATIC shell. The page
           transition's motion wrapper leaves a non-identity transform on
           its subtree for a moment (and can rest mid-spring under some
           motion settings), which silently breaks `position: sticky`
           descendants — the header appeared with a few pixels of slack.
           A marketing page has nothing to crossfade anyway. */
        <div className="w-full relative z-10">
          <React.Suspense fallback={<RouteFallback />}>
            <RouteBoundary key={`rb-${currentScreen}`}>
              {renderScreen()}
            </RouteBoundary>
          </React.Suspense>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          data-child-screen={CHILD_SCREENS.has(currentScreen) || undefined}
          variants={appMotionReduced ? pageVariantsCalm : pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="size-full relative z-10"
        >
          <React.Suspense fallback={<RouteFallback />}>
            <RouteBoundary key={`rb-${currentScreen}`}>
              {CHILD_SCREENS.has(currentScreen)
                ? <ChildShell>{renderScreen()}</ChildShell>
                : renderScreen()}
            </RouteBoundary>
          </React.Suspense>
        </motion.div>
      </AnimatePresence>
      )}
    </div>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AudioProvider>
        <AppProvider>
          <IrisProvider>
            <AppContent />
          </IrisProvider>
        </AppProvider>
      </AudioProvider>
    </LanguageProvider>
  );
}
