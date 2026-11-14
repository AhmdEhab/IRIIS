/**
 * LandingChildMode — the child's home from the original IRIS repository
 * (ChildModeScreen on main: hero + "ابدأ مغامرة اليوم" + the three curriculum
 * categories with the fourteen levels, progress chips and locks), rebuilt
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
import { motion } from 'motion/react';
import { Award, ChevronRight, Home, Lock, Sparkles } from 'lucide-react';
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
  locked: boolean;
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

export function LandingChildMode() {
  const { navigateTo, childProfile, moduleProgress, activeRules, startDailySession, caregiver } = useApp();
  const { speak, playSound } = useAudio();
  const { ladder } = useIris();
  const { t, language, dir } = useLanguage();
  const ar = language === 'ar';

  const categories: Array<{ id: string; name: string; icon: string; tone: Tone }> = [
    { id: 'recommended', name: ar ? 'رحلتك المقترحة' : 'Your Journey', icon: '✨', tone: 'yellow' },
    { id: 'basics', name: t.basics, icon: '🧩', tone: 'blue' },
    { id: 'world', name: t.world, icon: '🌍', tone: 'green' },
    { id: 'creative', name: t.creative, icon: '🎨', tone: 'purple' },
  ];

  const levels: Level[] = React.useMemo(() => {
    const rawLevels: Level[] = [
      // Basics
      { id: 'letters', name: t.letters, icon: '📝', tone: 'blue', locked: false, progress: moduleProgress['letters'] || 0, category: 'basics' },
      { id: 'numbers', name: t.numbers, icon: '🔢', tone: 'purple', locked: false, progress: moduleProgress['numbers'] || 0, category: 'basics' },
      { id: 'shapes', name: t.shapes, icon: '🔺', tone: 'yellow', locked: false, progress: moduleProgress['shapes'] || 0, category: 'basics' },
      { id: 'colors', name: t.colors, icon: '🎨', tone: 'coral', locked: false, progress: moduleProgress['colors'] || 0, category: 'basics' },
      // World
      { id: 'animals', name: t.animals, icon: '🦁', tone: 'green', locked: false, progress: moduleProgress['animals'] || 0, category: 'world' },
      { id: 'fruits', name: t.fruits, icon: '🍎', tone: 'coral', locked: false, progress: moduleProgress['fruits'] || 0, category: 'world' },
      { id: 'body-parts', name: t.bodyParts, icon: '🧒', tone: 'blue', locked: false, progress: moduleProgress['body-parts'] || 0, category: 'world' },
      { id: 'life-skills', name: t.lifeSkills, icon: '🏠', tone: 'coral', locked: false, progress: moduleProgress['life-skills'] || 0, category: 'world' },
      { id: 'vehicles', name: t.vehicles, icon: '🚀', tone: 'blue', locked: false, progress: moduleProgress['vehicles'] || 0, category: 'world' },
      // Creative
      { id: 'stories', name: t.stories, icon: '📚', tone: 'purple', locked: false, progress: moduleProgress['stories'] || 0, category: 'creative' },
      { id: 'drawing', name: t.drawing, icon: '🎨', tone: 'coral', locked: false, progress: moduleProgress['drawing'] || 0, category: 'creative' },
      { id: 'emotions', name: t.emotions, icon: '😊', tone: 'yellow', locked: false, progress: moduleProgress['emotions'] || 0, category: 'creative' },
      { id: 'songs', name: t.songs, icon: '🎵', tone: 'blue', locked: false, progress: moduleProgress['songs'] || 0, category: 'creative' },
      { id: 'games-hub', name: t.gamesHub, icon: '🎮', tone: 'purple', locked: false, progress: moduleProgress['games-hub'] || 0, category: 'creative' },
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
    if (level.locked) {
      playSound('error');
      speak(ar ? 'هذا المستوى مقفل' : 'This level is locked', language);
      return;
    }
    playSound('tap');
    speak(level.name, language);
    setTimeout(() => navigateTo(level.id as any), 500);
  };

  const handleBack = () => {
    playSound('tap');
    // The repo sent children "back" to mode selection; that screen no longer
    // exists (P16), so the honest destinations are: the parent hub when there
    // is an account, otherwise the door to sign in.
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
                      disabled={level.locked}
                      className={`lc-card${level.locked ? ' lc-card--locked' : ''}`}
                    >
                      <span className={`lc-bubble lc-bubble--${level.tone}`}>
                        <span className="lc-card-emoji" aria-hidden="true">{level.icon}</span>
                        {level.locked && <Lock className="lc-card-lock" aria-hidden="true" />}
                      </span>
                      <span className="lc-card-name">{level.name}</span>
                      <span className="lc-card-chip">
                        <Sparkles aria-hidden="true" />
                        <span>
                          {level.progress > 0
                            ? (ar ? 'أكمل' : 'Continue')
                            : (ar ? 'ابدأ' : 'Start')}
                        </span>
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
    </div>
  );
}
