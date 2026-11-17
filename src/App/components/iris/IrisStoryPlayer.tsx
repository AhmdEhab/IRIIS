import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { useIris } from '../../contexts/IrisContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { STORIES, type Story } from '../../content/stories';
import { ChildProgressDots } from './ui/ChildProgressDots';
import { AudioControl } from './ui/AudioControl';
import { NarrationCaption } from './ui/NarrationCaption';
import { IrisMascot } from './ui/IrisMascot';
import { BackButton } from '../ui/BackButton';
import {
  SceneStage, Bunny, Lion, StarChar, Carrot, Bird, Nest, Rose, Flower,
  Cloud, Sun, Moon, Tree, RainbowArc, ColorBlob, HappyFace, Sparkle,
  type Placement,
} from './ui/StoryArt';

/**
 * Art registry. Scene data names a piece by string; this maps the name to the
 * drawn component. Keeping it in one place is what guarantees a character is
 * literally the same artwork in every scene it appears in.
 */
const ART: Record<string, (variant?: string) => React.ReactNode> = {
  bunny: () => <Bunny />,
  lion: () => <Lion />,
  star: () => <StarChar />,
  carrot: () => <Carrot />,
  carrotBig: () => <Carrot big />,
  bird: () => <Bird />,
  nest: () => <Nest />,
  rose: () => <Rose />,
  flower: (v) => <Flower color={v} />,
  cloud: () => <Cloud />,
  sun: () => <Sun />,
  moon: () => <Moon />,
  tree: () => <Tree />,
  rainbow: () => <RainbowArc />,
  colorBlob: (v) => <ColorBlob color={v} />,
  happyFace: () => <HappyFace />,
  sparkle: (v) => <Sparkle color={v} />,
};

/**
 * IrisStoryPlayer — stories as scene-by-scene visual experiences.
 *
 * Replaces the old screen, which showed a whole story as one paragraph of text
 * with a play button. A child who cannot read got nothing from it. Here each
 * scene is one picture and one short sentence, advanced with a large Next
 * button, so the story can be followed entirely visually.
 *
 * Structure: pick a story → scenes → one recall question → done.
 *
 * IMPORTANT SCOPE NOTE
 * The closing question is a comprehension moment, not an assessment item. It
 * is not scored, not timed, and nothing about it reaches the adaptive engine —
 * no goal, level, pathway, or difficulty is touched. Answering "the other one"
 * simply invites another look at the picture.
 *
 * Audio: each scene is narrated in the active language on arrival, and the
 * sentence is on screen at all times, so the story works identically with
 * sound off. Narration is stopped when the child leaves. This screen adds no
 * audio engine of its own — it calls the shared speak()/playSound()/playCue().
 */
export function IrisStoryPlayer({ onExit }: { onExit: () => void }) {
  const { language } = useLanguage();
  const { speak, playSound, stopSpeaking, playCue } = useAudio();
  const { awardPresentationStar } = useIris() as any;
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';

  const [story, setStory] = useState<Story | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState<'scenes' | 'question' | 'done'>('scenes');
  const [picked, setPicked] = useState<number | null>(null);
  /** Which tappable element the child has found on the current scene. */
  const [tapped, setTapped] = useState<string | null>(null);
  /**
   * The title and the first sentence are narrated 1.4s apart so they do not run
   * together. If the child leaves inside that gap, the pending line would start
   * speaking on the screen they just moved to — stopSpeaking() cannot help,
   * because the speak() call has not happened yet. Holding the timer lets
   * closeStory cancel it.
   */
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openStory = (s: Story) => {
    playSound('tap');
    setStory(s);
    setSceneIndex(0);
    setPhase('scenes');
    setPicked(null);
    setTapped(null);
    // Narrate the title, then the first scene's sentence — the scene text is
    // always on screen too, so a muted child loses nothing.
    speak(ar ? s.titleAr : s.titleEn, ar ? 'ar' : 'en');
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      const first = s.scenes[0];
      if (first) speak(ar ? first.ar : first.en, ar ? 'ar' : 'en');
    }, 1400);
  };

  const closeStory = () => {
    // Narration must not follow the child out of the story — including a line
    // that has been scheduled but not yet spoken.
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    stopSpeaking();
    setStory(null);
    setPhase('scenes');
    setSceneIndex(0);
    setPicked(null);
    setTapped(null);
  };

  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, []);

  const narrate = (text: string) => speak(text, ar ? 'ar' : 'en');

  /**
   * The child tapped the element this scene invited them to find. Warm
   * confirmation only — nothing is scored and nothing is reported anywhere.
   */
  const handleTap = (id: string) => {
    if (tapped) return;
    setTapped(id);
    playSound('success');
    const scene = story?.scenes[sceneIndex];
    if (scene?.tap) narrate(ar ? scene.tap.foundAr : scene.tap.foundEn);
  };

  const goNext = () => {
    if (!story) return;
    playSound('tap');
    if (sceneIndex < story.scenes.length - 1) {
      const next = sceneIndex + 1;
      setSceneIndex(next);
      setTapped(null);
      narrate(ar ? story.scenes[next].ar : story.scenes[next].en);
    } else {
      setPhase('question');
      narrate(ar ? story.question.ar : story.question.en);
    }
  };

  const goPrev = () => {
    if (!story || sceneIndex === 0) return;
    playSound('tap');
    const prev = sceneIndex - 1;
    setSceneIndex(prev);
    setTapped(null);
    narrate(ar ? story.scenes[prev].ar : story.scenes[prev].en);
  };

  const answer = (i: number) => {
    if (!story || picked !== null) return;
    setPicked(i);
    const correct = i === story.question.correct;
    // Same gentle cue used everywhere else. A miss is never a buzzer.
    playSound(correct ? 'success' : 'retry');
    if (correct) {
      // A story is a presentation-layer reward only; it never reaches the
      // adaptive engine, which decides levels from activity performance alone.
      awardPresentationStar?.(1);
      // Children applauding — the 'complete' cue from the supplied Sounds.
      setTimeout(() => { playCue('complete'); setPhase('done'); }, 900);
    }
  };

  // ── story picker ─────────────────────────────────────────────────────────
  if (!story) {
    return (
      <div className="iris-child min-h-screen p-6 bg-ground">
        <BackButton onClick={onExit} />
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-3">
            <h1 className="t-title text-ink">{ar ? 'حكاياتنا' : 'Our Stories'}</h1>
            <AudioControl language={ar ? 'ar' : 'en'} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {STORIES.map((s) => (
              <motion.button
                key={s.id}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                onClick={() => openStory(s)}
                aria-label={ar ? s.titleAr : s.titleEn}
                className="rounded-brand-lg bg-surface border-2 border-hairline shadow-brand overflow-hidden text-start transition-[transform,border-color] hover:border-brand-purple"
              >
                <div className={`h-32 ${s.color} flex items-center justify-center`}>
                  <svg viewBox="-48 -62 96 112" className="w-28 h-28 drop-shadow" aria-hidden="true">
                    {ART[s.coverArt]?.()}
                  </svg>
                </div>
                <div className="p-5">
                  <h2 className="t-heading text-ink">{ar ? s.titleAr : s.titleEn}</h2>
                  <p className="t-small text-ink-muted mt-1">
                    {ar
                      ? `${s.scenes.length} مشاهد`
                      : `${s.scenes.length} scenes`}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
          <NarrationCaption language={ar ? 'ar' : 'en'} className="mt-6" />
        </div>
      </div>
    );
  }

  // ── finished ─────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="iris-child min-h-screen flex items-center justify-center p-6 bg-ground">
        <div className="max-w-md text-center space-y-6">
          <IrisMascot
            mood="happy"
            size="lg"
            messageAr="حلوة الحكاية دي!"
            messageEn="What a lovely story!"
            language={ar ? 'ar' : 'en'}
            className="mx-auto"
          />
          <h2 className="text-3xl font-black text-ink">
            {ar ? 'خلصنا الحكاية! 🌟' : 'Story finished! 🌟'}
          </h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => openStory(story)}
              className="rounded-brand bg-surface border-4 border-hairline px-6 py-4 text-xl font-black text-brand-purple-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
            >
              🔁 {ar ? 'نسمعها تاني' : 'Read it again'}
            </button>
            <button
              onClick={closeStory}
              className="rounded-brand bg-brand-blue-ink px-6 py-4 text-xl font-black text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
            >
              {ar ? 'حكاية تانية' : 'Another story'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── question ─────────────────────────────────────────────────────────────
  if (phase === 'question') {
    const q = story.question;
    return (
      <div className="iris-child min-h-screen p-6 bg-ground">
        <BackButton onClick={closeStory} />
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-end"><AudioControl language={ar ? 'ar' : 'en'} repeatText={ar ? q.ar : q.en} /></div>
          <IrisMascot mood={picked === null ? 'thinking' : 'happy'} size="md" className="mx-auto" />
          <h2 className="text-3xl font-black text-center text-ink">{ar ? q.ar : q.en}</h2>

          <div className="grid grid-cols-2 gap-5" role="group" aria-label={ar ? q.ar : q.en}>
            {q.options.map((opt, i) => {
              const isPicked = picked === i;
              const isRight = i === q.correct;
              return (
                <motion.button
                  key={i}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  onClick={() => answer(i)}
                  aria-label={ar ? opt.ar : opt.en}
                  style={{ minHeight: 140 }}
                  className={`relative rounded-brand-lg border-4 bg-surface flex flex-col items-center justify-center gap-2 p-4
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue
                    ${isPicked ? (isRight ? 'border-brand-green bg-brand-green-wash' : 'border-brand-yellow bg-brand-yellow-wash') : 'border-hairline hover:border-brand-blue'}`}
                >
                  <svg viewBox="-48 -62 96 112" className="w-24 h-28" aria-hidden="true">
                    {ART[opt.art]?.(opt.variant)}
                  </svg>
                  <span className="text-lg font-black text-ink-muted">{ar ? opt.ar : opt.en}</span>
                  {isPicked && (
                    <span aria-hidden="true" className="absolute top-2 end-2 text-2xl">
                      {isRight ? '✅' : '🔁'}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {picked !== null && picked !== q.correct && (
            // Never "wrong": invite another look at the picture instead.
            <p role="status" className="text-center text-xl font-bold text-ink-muted">
              {ar ? 'قريّب! تعالى نبص على الصورة تاني 🔎' : "Close! Let's look at the picture again 🔎"}
            </p>
          )}

          <NarrationCaption language={ar ? 'ar' : 'en'} />
        </div>
      </div>
    );
  }

  // ── scenes ───────────────────────────────────────────────────────────────
  const scene = story.scenes[sceneIndex];
  const sentence = ar ? scene.ar : scene.en;

  return (
    <div className="iris-child min-h-screen p-6 bg-ground">
      <BackButton onClick={closeStory} />
      {/* P72: the stage is the story — give it the widest column the reading
          line stays calm at (was 3xl, which read as a small postcard). */}
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <ChildProgressDots
            total={story.scenes.length}
            currentIndex={sceneIndex}
            language={ar ? 'ar' : 'en'}
          />
          <AudioControl language={ar ? 'ar' : 'en'} repeatText={sentence} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={sceneIndex}
            initial={reduceMotion ? false : { opacity: 0, x: ar ? -24 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: ar ? 24 : -24 }}
            transition={{ duration: reduceMotion ? 0 : 0.28 }}
            className="space-y-5"
          >
            {/* The illustration: one drawn scene, sharing a horizon and a
                drawing style with every other scene. The sentence below
                carries the same meaning, so the picture is labelled for
                assistive tech and the story survives with images described
                rather than seen. */}
            <div
              className="rounded-brand-xl border-2 border-hairline shadow-brand-lg overflow-hidden bg-surface"
              role="img"
              aria-label={sentence}
            >
              <SceneStage
                backdrop={scene.backdrop}
                className="w-full block"
                tappedId={tapped}
                onTap={scene.tap ? handleTap : undefined}
                items={scene.pieces.map((p): Placement => ({
                  el: ART[p.art]?.(p.variant) ?? null,
                  x: p.x,
                  y: p.y,
                  scale: p.scale,
                  flip: p.flip,
                  // Only the element this scene actually invites a tap on is
                  // made tappable, so there is never a hunt across the picture.
                  tapId: scene.tap && p.art.startsWith(scene.tap.target) ? scene.tap.target : undefined,
                }))}
              />
            </div>

            {/* One short sentence, large. Never a paragraph. */}
            <p className="text-2xl md:text-3xl font-black text-center text-ink leading-relaxed px-2">
              {sentence}
            </p>

            {/* The one light interaction. It is an invitation, never a gate:
                Next stays enabled throughout, so a child who does not want to
                tap — or cannot — is never stuck in the story. */}
            {scene.tap && (
              <p
                role="status"
                className={`text-center text-lg md:text-xl font-bold rounded-brand px-4 py-3 mx-auto max-w-xl
                  ${tapped ? 'bg-brand-green-wash text-brand-green-ink border-2 border-brand-green'
                           : 'bg-brand-blue-wash text-brand-blue-ink border-2 border-brand-blue'}`}
              >
                {tapped
                  ? (ar ? scene.tap.foundAr : scene.tap.foundEn)
                  : `👆 ${ar ? scene.tap.ar : scene.tap.en}`}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4 pt-1">
          <button
            onClick={goPrev}
            disabled={sceneIndex === 0}
            aria-label={ar ? 'المشهد السابق' : 'Previous scene'}
            className="rounded-brand bg-surface border-4 border-hairline px-6 py-4 text-xl font-black text-ink-muted disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
          >
            {ar ? '→' : '←'}
          </button>

          <button
            onClick={goNext}
            aria-label={
              sceneIndex < story.scenes.length - 1
                ? (ar ? 'المشهد التالي' : 'Next scene')
                : (ar ? 'سؤال الحكاية' : 'Story question')
            }
            className="flex-1 rounded-brand bg-brand-blue-ink px-6 py-4 text-2xl font-black text-white shadow-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
          >
            {sceneIndex < story.scenes.length - 1
              ? (ar ? 'كمّل ' : 'Next ') + (ar ? '←' : '→')
              : (ar ? 'يلا نسأل سؤال! 🎯' : "Let's answer! 🎯")}
          </button>
        </div>

        <NarrationCaption language={ar ? 'ar' : 'en'} />
      </div>
    </div>
  );
}
