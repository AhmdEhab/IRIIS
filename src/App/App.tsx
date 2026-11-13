import React from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { useReducedMotion } from './hooks/useReducedMotion';
import { AudioProvider } from './contexts/AudioContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppProvider, useApp, type Screen } from './contexts/AppContext';
import { IrisProvider, useIris } from './contexts/IrisContext';
import { API_URL, authHeaders, readAuthToken } from './config';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { RegistrationScreen } from './components/RegistrationScreen';
import { ModeSelectionScreen } from './components/ModeSelectionScreen';
import { AIAssessmentScreen } from './components/AIAssessmentScreen';
import { ChildModeScreen } from './components/ChildModeScreen';
import { ParentDashboardScreen } from './components/ParentDashboardScreen';
import { IrisLanding } from './components/iris/IrisLanding';
import { LandingPage } from './components/landing/LandingPage';
import { IrisFlow, mapCondition } from './components/iris/IrisFlow';
import { IrisParentDashboard } from './components/iris/IrisParentDashboard';
import { IrisParentChat } from './components/iris/IrisParentChat';
import { ChildShell } from './components/iris/ui/ChildShell';
import { IrisStoryPlayer } from './components/iris/IrisStoryPlayer';
import { IrisParentHome } from './components/iris/IrisParentHome';
import { IrisHomeTips } from './components/iris/IrisHomeTips';
import { IrisCommunity } from './components/iris/IrisCommunity';
import { IrisLearningSnapshot } from './components/iris/IrisLearningSnapshot';
import { IrisLadderAssessment } from './components/iris/IrisLadderAssessment';
import { IrisLadderPractice } from './components/iris/IrisLadderPractice';
import { IrisSpecialists } from './components/iris/IrisSpecialists';
import { StoriesScreen } from './components/StoriesScreen';
import { AnimalsScreen } from './components/AnimalsScreen';
import { LettersScreen } from './components/LettersScreen';
import { NumbersScreen } from './components/NumbersScreen';
import { ColorsScreen } from './components/ColorsScreen';
import { LifeSkillsScreen } from './components/LifeSkillsScreen';
import { SongsScreen } from './components/SongsScreen';
import { DrawingScreen } from './components/DrawingScreen';
import { ShapesScreen } from './components/ShapesScreen';
import { FruitsScreen } from './components/FruitsScreen';
import { VehiclesScreen } from './components/VehiclesScreen';
import { RewardsScreen } from './components/RewardsScreen';
import { MemoryGameScreen } from './components/MemoryGameScreen';
import { GamesHubScreen } from './components/GamesHubScreen';
import { BalloonPopScreen } from './components/BalloonPopScreen';
import { ShadowMatchScreen } from './components/ShadowMatchScreen';
import { EmotionsScreen } from './components/EmotionsScreen';
import { BodyPartsScreen } from './components/BodyPartsScreen';
import { FamilyGuidanceScreen } from './components/FamilyGuidanceScreen';
// CommunitySessionsScreen is deliberately NOT imported. It contains four
// invented practitioners with ratings and review counts, three fabricated
// testimonials, and a live booking POST. Leaving it routed would put a parent
// two taps from "Dr. Sarah Ahmed ★4.9 (127 reviews)". The 'community-sessions'
// route now renders the labelled demo community instead. Dropping the import
// also keeps the file out of the bundle.
import { ParentSettingsScreen } from './components/ParentSettingsScreen';
import { TransitionScreen } from './components/TransitionScreen';
import { SyndromeTeachingDemoScreen } from './components/SyndromeTeachingDemoScreen';
import { PlayfulBackground } from './components/ui/PlayfulBackground';


function AppContent() {
  const { currentScreen, addTime, navigateTo, childProfile } = useApp();
  const iris = useIris();

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
    if (!childProfile?.name || iris.childDbId) return;
    let cancelled = false;

    (async () => {
      if (!readAuthToken()) return; // Child Mode without an account still runs, just unsaved
      const auth = authHeaders();
      try {
        const listed = await fetch(`${API_URL}/children`, { headers: auth });
        if (listed.ok) {
          const rows = await listed.json();
          const match = Array.isArray(rows) && rows.find((r: any) => r.displayName === childProfile.name);
          if (match && !cancelled) { iris.setChildDbId(match.id);
        iris.loadLadderFromServer(match.id); return; }
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
        }
      } catch {
        // Offline or unauthenticated: the adaptive loop still runs in state,
        // and IrisContext surfaces the unsaved condition to the parent.
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childProfile?.name, iris.childDbId]);

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
  const renderScreen = () => {
    switch (currentScreen) {
      case 'marketing':
        return (
          <LandingPage
            key="marketing"
            isAuthenticated={!!readAuthToken()}
            onLogin={() => navigateTo('login')}
            onRegister={() => navigateTo(readAuthToken() ? 'iris-parent' : 'registration')}
            onAppMode={() => navigateTo(readAuthToken() && childProfile ? 'iris-parent' : 'landing')}
          />
        );
      case 'landing':
        return (
          <IrisLanding
            key="landing"
            onChildMode={() => navigateTo('child-mode')}
            onParentMode={() => navigateTo(childProfile ? 'iris-parent' : 'login')}
          />
        );
      case 'splash':
        return <SplashScreen key="splash" />;
      case 'login':
        return <LoginScreen key="login" />;
      case 'registration':
        return <RegistrationScreen key="registration" />;
      case 'iris-parent':
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
            onBack={() => navigateTo('landing')}
          />
        );
      case 'iris-progress':
        return (
          <IrisParentDashboard
            key="iris-progress"
            onOpenChat={() => navigateTo('iris-parent-chat')}
            onBack={() => navigateTo('iris-parent')}
            onEnterChildMode={() => navigateTo('child-mode')}
          />
        );
      case 'iris-tips':
        return <IrisHomeTips key="iris-tips" onBack={() => navigateTo('iris-parent')} />;
      case 'iris-ladder-assessment':
        return <IrisLadderAssessment key="iris-ladder-assessment" onFinish={() => navigateTo('iris-snapshot')} />;
      case 'iris-ladder-practice':
        return <IrisLadderPractice key="iris-ladder-practice" onFinish={() => navigateTo('iris-snapshot')} />;
      case 'iris-snapshot':
        return (
          <IrisLearningSnapshot
            key="iris-snapshot"
            onBack={() => navigateTo('iris-parent')}
            onStart={() => navigateTo('iris-ladder-assessment')}
            onPractise={() => navigateTo('iris-ladder-practice')}
          />
        );
      case 'iris-community':
        return <IrisCommunity key="iris-community" onBack={() => navigateTo('iris-parent')} />;
      case 'iris-specialists':
        return <IrisSpecialists key="iris-specialists" onBack={() => navigateTo('iris-parent')} />;
      case 'iris-parent-chat':
        return <IrisParentChat key="iris-parent-chat" onBack={() => navigateTo('iris-parent')} />;
      case 'mode-selection':
        return <ModeSelectionScreen key="mode-selection" />;
      case 'ai-assessment':
        return <AIAssessmentScreen key="ai-assessment" />;
      case 'child-mode':
        return (
          <IrisFlow
            key="child-mode"
            onExit={() => navigateTo('landing')}
            prefillName={childProfile?.name}
            prefillCondition={childProfile?.condition}
            prefillAge={Number.isFinite(childProfile?.age) ? childProfile?.age : null}
            onLegacyGame={(id) => navigateTo(id as any)}
            onGoParent={() => navigateTo('iris-parent')}
          />
        );
      case 'parent-dashboard':
        return <ParentDashboardScreen key="parent-dashboard" />;
      case 'stories':
        // The old text-paragraph StoriesScreen is preserved in the repo but no
        // longer routed: stories are now scene-based visual experiences.
        return <IrisStoryPlayer key="stories" onExit={() => navigateTo('child-mode')} />;
      case 'animals':
        return <AnimalsScreen key="animals" />;
      case 'letters':
        return <LettersScreen key="letters" />;
      case 'numbers':
        return <NumbersScreen key="numbers" />;
      case 'colors':
        return <ColorsScreen key="colors" />;
      case 'life-skills':
        return <LifeSkillsScreen key="life-skills" />;
      case 'songs':
        return <SongsScreen key="songs" />;
      case 'drawing':
        return <DrawingScreen key="drawing" />;
      case 'shapes':
        return <ShapesScreen key="shapes" />;
      case 'fruits':
        return <FruitsScreen key="fruits" />;
      case 'vehicles':
        return <VehiclesScreen key="vehicles" />;
      case 'rewards':
        return <RewardsScreen key="rewards" />;
      case 'memory-game':
        return <MemoryGameScreen key="memory-game" />;
      case 'balloon-pop':
        return <BalloonPopScreen key="balloon-pop" />;
      case 'shadow-match':
        return <ShadowMatchScreen key="shadow-match" />;
      case 'games-hub':
        return <GamesHubScreen key="games-hub" />;
      case 'body-parts':
        return <BodyPartsScreen key="body-parts" />;
      case 'emotions':
        return <EmotionsScreen key="emotions" />;
      case 'family-guidance':
        return <FamilyGuidanceScreen key="family-guidance" />;
      case 'community-sessions':
        // The Community button on the legacy parent dashboard lands here.
        // onBack returns to that dashboard, not to iris-parent, so the user
        // ends up where they started rather than on the other parent surface.
        return <IrisCommunity key="community-sessions" onBack={() => navigateTo('parent-dashboard')} />;
      case 'parent-settings':
        return <ParentSettingsScreen key="parent-settings" />;
      case 'transition':
        return <TransitionScreen key="transition" />;
      case 'teaching-demo':
        return <SyndromeTeachingDemoScreen key="teaching-demo" />;
      default:
        return <SplashScreen key="default" />;
    }
  };

  return (
    /* bg-ground, not bg-white. The app only LOOKED warm because
       PlayfulBackground paints the ground as a fixed layer behind everything;
       the root itself was pure white, so the identity depended on a purely
       decorative component continuing to exist. Now the ground is real. */
    <MotionConfig reducedMotion={appMotionReduced ? 'always' : 'user'}>
    <div className="size-full overflow-hidden bg-ground relative">
      <PlayfulBackground />
      {/* GlobalControls used to be mounted here: a glassmorphism pill fixed at
          top-4 right-4 z-[100] above every screen. It floated over whatever
          each screen put in that corner, which is where audit defects D1
          ("Log out" unreadable on Parent Home), D2 ("Back" rendering as
          "BaAR" on Ask IRIS) and D6 (two language controls on the landing
          screen) all came from. Its two controls — mute and language — now
          live inside TopBar via <ChromeActions/>, in the layout rather than
          on top of it, so they cannot collide with anything. */}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          data-child-screen={CHILD_SCREENS.has(currentScreen) || undefined}
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 1.02 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="size-full relative z-10"
        >
          {CHILD_SCREENS.has(currentScreen)
            ? <ChildShell>{renderScreen()}</ChildShell>
            : renderScreen()}
        </motion.div>
      </AnimatePresence>
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