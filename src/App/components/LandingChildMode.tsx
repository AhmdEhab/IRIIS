/**
 * LandingChildMode — the child's home from the original IRIS repository
 * (ChildModeScreen on main: hero + "ابدأ مغامرة اليوم" + the three curriculum
 * categories with the fourteen levels and progress chips), rebuilt
 * in the marketing landing page's design language.
 *
 * The content is deliberately 1:1 with the repo page — same strings from the
 * language dictionary, same category/level data, same click behaviour
 * (speak + tap sound + navigate). Only the skin changes: cream ground, white
 * plates with 2px blue-tinted hairlines, 22-28px corners, the brand-blue pill
 * CTA, pastel icon bubbles instead of saturated gradients, and Baloo display
 * type. Styles live in landing-child.css and every rule is scoped under
 * `.lc-root`, so nothing else in the product is touched.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Award, ChevronRight, Home, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useIris } from '../contexts/IrisContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { readAuthToken } from '../config';
import { Blob, Sparkle } from './landing/LandingDecor';
import { IrisBuddy } from './iris/ui/IrisBuddy';
import './landing-child.css';

type Tone = 'blue' | 'green' | 'yellow' | 'coral' | 'purple';

interface Level {
  id: string;
  name: string;
  icon: string;
  tone: Tone;
  progress: number;
  category: string;
}

/* ── Profile-driven recommended order (research framework §4 / audit W8) ───
   The "Recommended" head category now comes from what THIS child showed —
   Family Profile states first, learning-ladder strands second. A condition
   label never chooses the path; it was already excluded from scoring, and
   after the P34 fix it no longer drives module order either. Strand→module
   mapping is a documented heuristic pending the validation study
   (docs/research/RESEARCH_MAP.md — NEEDS-VALIDATION). */
const BLOCK_MODULES: Record<string, string[]> = {
  C: ['songs', 'stories'],
  L: ['letters', 'numbers', 'shapes', 'colors'],
  S: ['life-skills', 'body-parts'],
  M: ['drawing', 'games-hub'],
  P: ['emotions'],
};
const STATE_ORDER = ['unmet_need', 'emerging', 'does_with_support', 'does_independently'];
function recommendedFromProfile(scored: any, ladder: any): string[] {
  const ids: string[] = [];
  const push = (id?: string) => { if (id && !ids.includes(id)) ids.push(id); };
  const states = (scored && scored.domainStates) || {};
  for (const st of STATE_ORDER) {
    for (const [block, d] of Object.entries(states) as [string, any][]) {
      if (d && d.state === st) (BLOCK_MODULES[block] || []).forEach(push);
    }
  }
  const lp = (ladder && (ladder.learningPriorities || ladder.priorities)) || [];
  for (const prio of lp) {
    const key = String((prio && (prio.id || prio.label || prio)) || '').toLowerCase();
    if (key.includes('letter') || key.includes('phon')) push('letters');
    if (key.includes('number') || key.includes('count') || key.includes('quant')) push('numbers');
    if (key.includes('shape')) push('shapes');
    if (key.includes('color')) push('colors');
  }
  return ids.slice(0, 5);
}

/* ── Grown-up gate on leaving child mode ─────────────────────────────────
   The header exit used to hand a child the parent hub/login directly. It
   now opens this small confirm card with two honest paths, and both lead
   to the SAME original navigation the old back button performed:
   1) press-and-hold 1.5s — a direction-independent SVG ring (strokeDash-
      offset) driven by requestAnimationFrame; releasing early cancels and
      resets. Enter/Space keydown/keyup drive the same hold for keyboard
      users.
   2) "دخول ولي الأمر" — type the 3-digit number shown in the card.
      Nothing is stored; the code is regenerated on reveal and on a miss. */
function ParentGate({ ar, onCancel, onPass }: { ar: boolean; onCancel: () => void; onPass: () => void }) {
  const HOLD_MS = 1500;
  const R = 26;
  const CIRC = 2 * Math.PI * R;
  const [progress, setProgress] = React.useState(0);
  const [codeOpen, setCodeOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [entry, setEntry] = React.useState('');
  const [miss, setMiss] = React.useState(false);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number | null>(null);
  const doneRef = React.useRef(false);

  const stopHold = React.useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    if (!doneRef.current) setProgress(0);
  }, []);
  const startHold = React.useCallback(() => {
    if (rafRef.current != null || doneRef.current) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - (startRef.current as number)) / HOLD_MS);
      setProgress(p);
      if (p >= 1) { doneRef.current = true; rafRef.current = null; onPass(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onPass]);
  React.useEffect(() => () => stopHold(), [stopHold]);

  const revealCode = () => {
    setCode(String(100 + Math.floor(Math.random() * 900)));
    setEntry('');
    setMiss(false);
    setCodeOpen(true);
  };
  const checkCode = () => {
    if (entry.trim() === code) { onPass(); return; }
    setMiss(true);
    setCode(String(100 + Math.floor(Math.random() * 900)));
    setEntry('');
  };

  return (
    <div className="lc-gate lc-token-scope" role="dialog" aria-modal="true" aria-label={ar ? 'خروج للكبار فقط' : 'Grown-ups only'}>
      <button type="button" className="lc-gate-backdrop" aria-label={ar ? 'إلغاء' : 'Cancel'} onClick={onCancel} />
      <div className="lc-gate-card">
        <p className="lc-gate-title">
          {ar ? 'دي حاجة للكبار — امسك الزرار لحد ما يعد' : 'This one is for grown-ups — hold the button until it counts.'}
        </p>
        <button
          type="button"
          className="lc-gate-hold"
          aria-label={ar ? 'اضغط مطولاً لثانية ونص' : 'Press and hold for one and a half seconds'}
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); startHold(); } }}
          onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopHold(); } }}
        >
          <svg className="lc-gate-ring" viewBox="0 0 64 64" aria-hidden="true">
            <circle className="lc-gate-ring-bg" cx="32" cy="32" r={R} />
            <circle
              className="lc-gate-ring-fg"
              cx="32"
              cy="32"
              r={R}
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              transform="rotate(-90 32 32)"
            />
          </svg>
          <Home className="lc-gate-home" aria-hidden="true" />
        </button>
        <div className="lc-gate-row">
          {!codeOpen ? (
            <button type="button" className="lc-pill lc-pill--ghost" onClick={revealCode}>
              <span>{ar ? 'دخول ولي الأمر' : 'Parent sign-in'}</span>
            </button>
          ) : (
            <div className="lc-gate-code">
              <span>{ar ? 'اكتب الرقم:' : 'Type the number:'}</span>
              <span className="lc-gate-code-num" dir="ltr">{code}</span>
              <input
                className="lc-gate-input"
                dir="ltr"
                inputMode="numeric"
                maxLength={3}
                value={entry}
                aria-label={ar ? 'رقم تأكيد ولي الأمر' : 'Parent confirmation number'}
                onChange={(e) => { setEntry(e.target.value.replace(/\D/g, '')); setMiss(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') checkCode(); }}
              />
              <button type="button" className="lc-pill lc-pill--blue" onClick={checkCode}>
                <span>{ar ? 'تأكيد' : 'Confirm'}</span>
              </button>
            </div>
          )}
        </div>
        {miss && (
          <p className="lc-gate-error" role="alert">
            {ar ? 'الرقم اتغير، جرّب تاني' : 'The number changed — try the new one'}
          </p>
        )}
        <button type="button" className="lc-pill lc-pill--ghost" onClick={onCancel}>
          <span>{ar ? 'إلغاء' : 'Cancel'}</span>
        </button>
      </div>
    </div>
  );
}

export function LandingChildMode() {
  const { navigateTo, childProfile, moduleProgress, activeRules, startDailySession, caregiver } = useApp();
  const { speak, playSound } = useAudio();
  const { ladder } = useIris();
  const { t, language, dir } = useLanguage();
  const ar = language === 'ar';

  /* Press feedback on level tiles: the tapped card gets `is-pressed`
     (scale 0.96 via CSS transform in landing-child.css) immediately and
     navigation follows after 140ms — no more 500ms blind wait. */
  const [pressedId, setPressedId] = React.useState<string | null>(null);
  const navigateTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /* The grown-up gate for the header exit button (leave-child-mode only;
     activity screens' own BackButtons are unaffected). */
  const [gateOpen, setGateOpen] = React.useState(false);

  const categories: Array<{ id: string; name: string; icon: string; tone: Tone }> = [
    { id: 'recommended', name: ar ? 'رحلتك المقترحة' : 'Your Journey', icon: '✨', tone: 'yellow' },
    { id: 'basics', name: t.basics, icon: '🧩', tone: 'blue' },
    { id: 'world', name: t.world, icon: '🌍', tone: 'green' },
    { id: 'creative', name: t.creative, icon: '🎨', tone: 'purple' },
  ];

  const levels: Level[] = React.useMemo(() => {
    const rawLevels: Level[] = [
      // Basics
      { id: 'letters', name: t.letters, icon: '📝', tone: 'blue', progress: moduleProgress['letters'] || 0, category: 'basics' },
      { id: 'numbers', name: t.numbers, icon: '🔢', tone: 'purple', progress: moduleProgress['numbers'] || 0, category: 'basics' },
      { id: 'shapes', name: t.shapes, icon: '🔺', tone: 'yellow', progress: moduleProgress['shapes'] || 0, category: 'basics' },
      { id: 'colors', name: t.colors, icon: '🎨', tone: 'coral', progress: moduleProgress['colors'] || 0, category: 'basics' },
      // World
      { id: 'animals', name: t.animals, icon: '🦁', tone: 'green', progress: moduleProgress['animals'] || 0, category: 'world' },
      { id: 'fruits', name: t.fruits, icon: '🍎', tone: 'coral', progress: moduleProgress['fruits'] || 0, category: 'world' },
      { id: 'body-parts', name: t.bodyParts, icon: '🧒', tone: 'blue', progress: moduleProgress['body-parts'] || 0, category: 'world' },
      { id: 'life-skills', name: t.lifeSkills, icon: '🏠', tone: 'coral', progress: moduleProgress['life-skills'] || 0, category: 'world' },
      { id: 'vehicles', name: t.vehicles, icon: '🚀', tone: 'blue', progress: moduleProgress['vehicles'] || 0, category: 'world' },
      // Creative
      { id: 'stories', name: t.stories, icon: '📚', tone: 'purple', progress: moduleProgress['stories'] || 0, category: 'creative' },
      { id: 'drawing', name: t.drawing, icon: '🎨', tone: 'coral', progress: moduleProgress['drawing'] || 0, category: 'creative' },
      { id: 'emotions', name: t.emotions, icon: '😊', tone: 'yellow', progress: moduleProgress['emotions'] || 0, category: 'creative' },
      { id: 'songs', name: t.songs, icon: '🎵', tone: 'blue', progress: moduleProgress['songs'] || 0, category: 'creative' },
      { id: 'games-hub', name: t.gamesHub, icon: '🎮', tone: 'purple', progress: moduleProgress['games-hub'] || 0, category: 'creative' },
    ];
    const orderedIds = recommendedFromProfile(caregiver?.scored ?? null, ladder);
    if (!orderedIds.length) return rawLevels;
    const recommendedLevels = orderedIds
      .map((id: string) => rawLevels.find((l) => l.id === id))
      .filter((l): l is Level => l !== undefined)
      .map((l) => ({ ...l, category: 'recommended' }));
    return [...recommendedLevels, ...rawLevels];
  }, [moduleProgress, t, caregiver, ladder, language]);

  const handleLevelClick = (level: Level) => {
    playSound('tap');
    speak(level.name, language);
    setPressedId(level.id);
    if (navigateTimer.current) clearTimeout(navigateTimer.current);
    navigateTimer.current = setTimeout(() => {
      setPressedId(null);
      navigateTo(level.id as any);
    }, 140);
  };
  React.useEffect(() => () => {
    if (navigateTimer.current) clearTimeout(navigateTimer.current);
  }, []);

  /* The repo sent children "back" to mode selection; that screen no longer
     exists (P16), so the honest destinations are: the parent hub when there
     is an account, otherwise the door to sign in. That door is for adults —
     the exit now opens the ParentGate, which performs this exact original
     navigation once the grown-up passes it. */
  const handleBack = () => {
    playSound('tap');
    setGateOpen(true);
  };
  const leaveToParent = () => {
    navigateTo(readAuthToken() ? 'iris-parent' : 'login');
  };

  const chevronFlip = dir === 'rtl' ? 'lc-chevron-flip' : '';

  return (
    <div className="lc-root" data-accent="blue">
      <div className="lc-decor" aria-hidden="true">
        <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
        <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
        <Sparkle className="lc-spark lc-spark--1" />
        <Sparkle className="lc-spark lc-spark--2" />
        <Sparkle className="lc-spark lc-spark--3" />
      </div>

      {/* Chrome — the landing header's frosted bar, same controls as the repo navbar */}
      <header className="lc-header">
        <div className="lc-header-inner">
          <button type="button" className="lc-pill lc-pill--blue" onClick={handleBack}>
            <Home aria-hidden="true" />
            <span>{ar ? 'العودة' : 'Back'}</span>
          </button>
          <div className="lc-header-side">
            <button
              type="button"
              className="lc-pill lc-pill--yellow"
              onClick={() => { playSound('celebration'); navigateTo('rewards'); }}
            >
              <Award aria-hidden="true" />
              <span>{ar ? 'جوائزي' : 'Awards'}</span>
            </button>
            <span className="lc-name-chip">{childProfile?.name || 'Explorer'}</span>
          </div>
        </div>
      </header>

      <main className="lc-main">
        {/* Hero — the repo's greeting card, white-plate treatment */}
        <motion.section
          className="lc-hero"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="lc-hero-dots" aria-hidden="true" />
          <div className="lc-hero-grid">
            <div className="lc-hero-copy">
              <h1 className="lc-hero-title">
                {ar
                  ? <>أهلاً بك يا <span className="lc-hero-mark">{childProfile?.name || 'بطلنا'}</span>! ✨</>
                  : <>Welcome back, <span className="lc-hero-mark">{childProfile?.name || 'Hero'}</span>! ✨</>}
              </h1>
              <p className="lc-hero-sub">
                {ar
                  ? 'مستعد لمغامرة تعليمية جديدة اليوم؟ لقد حضرنا لك أشياء ممتعة!'
                  : "Ready for a new learning adventure today? We've prepared some fun things for you!"}
              </p>
              <button
                type="button"
                className="lc-pill lc-pill--primary"
                onClick={() => { playSound('celebration'); startDailySession(); }}
              >
                <Sparkles aria-hidden="true" />
                <span>{ar ? 'ابدأ مغامرة اليوم' : 'Start Daily Adventure'}</span>
                <ChevronRight aria-hidden="true" className={chevronFlip} />
              </button>
            </div>
            <div className="lc-hero-mascot" aria-hidden="true">
              <IrisBuddy mood="happy" />
            </div>
          </div>
        </motion.section>

        {/* Sections — the repo's category/level content, landing skin */}
        {categories.map((category) => {
          const catLevels = levels.filter((l) => l.category === category.id);
          if (catLevels.length === 0) return null;
          return (
            <section key={category.id} className="lc-section">
              <div className="lc-section-head">
                <span className={`lc-bubble lc-bubble--${category.tone} lc-bubble--head`}>{category.icon}</span>
                <h2 className="lc-section-title">{category.name}</h2>
              </div>
              <div className="lc-grid">
                {catLevels.map((level, idx) => (
                  <motion.div
                    key={`${category.id}-${level.id}`}
                    initial={{ scale: 0.94, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(idx * 0.06, 0.3) }}
                  >
                    <button
                      type="button"
                      onClick={() => handleLevelClick(level)}
                      className={`lc-card${pressedId === level.id ? ' is-pressed' : ''}`}
                    >
                      <span className={`lc-bubble lc-bubble--${level.tone}`}>
                        <span className="lc-card-emoji" aria-hidden="true">{level.icon}</span>
                      </span>
                      <span className="lc-card-name">{level.name}</span>
                      <span className="lc-card-chip">
                        {level.progress > 0 ? (
                          /* Tiny progress ring (moduleProgress is 0–100) in the
                             brand-wash chip's own ink colour — never white. */
                          <svg
                            className="lc-progress-ring"
                            viewBox="0 0 20 20"
                            role="img"
                            aria-label={ar ? `${level.progress}% من الرحلة` : `${level.progress}% of the journey`}
                          >
                            <circle className="lc-progress-bg" cx="10" cy="10" r="7" />
                            <circle
                              className="lc-progress-fg"
                              cx="10"
                              cy="10"
                              r="7"
                              strokeDasharray={2 * Math.PI * 7}
                              strokeDashoffset={2 * Math.PI * 7 * (1 - Math.min(Math.max(level.progress, 0), 100) / 100)}
                              transform="rotate(-90 10 10)"
                            />
                          </svg>
                        ) : (
                          <Sparkles aria-hidden="true" />
                        )}
                        <span>{level.progress > 0 ? (ar ? 'كمّلنا' : 'Keep going') : (ar ? 'ابدأ' : 'Start')}</span>
                        <ChevronRight aria-hidden="true" className={`lc-card-chevron ${chevronFlip}`} />
                      </span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Grown-up gate for the header exit — the only leave-child-mode path. */}
      {gateOpen && createPortal(
        <ParentGate
          ar={ar}
          onCancel={() => setGateOpen(false)}
          onPass={() => { setGateOpen(false); leaveToParent(); }}
        />,
        document.body,
      )}
    </div>
  );
}
