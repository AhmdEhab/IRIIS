import React, { Suspense, useState } from 'react';
import { Button } from '../ui/button';

/**
 * Explore3D — the "استكشف بالثلاثي / Explore in 3D" door into the 3D layer.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM Object3DViewer
 * `Object3DViewer` is the module that imports three.js, and it must only ever
 * be reached through `React.lazy`, or the whole 3D chunk lands in the main
 * bundle and every low-end tablet pays for it. This file is the safe half: it
 * imports nothing 3D at module scope, so a learning screen can import it
 * statically, while the viewer below it is fetched the first time a child
 * actually opens the toggle.
 *
 * WHY THE 3D IS BEHIND A TOGGLE AND NOT IN THE CARD
 * The learning sequence in `SyndromeLearningCard` is timed and per-syndrome:
 * visual step, audio step, context step. Replacing its main visual with a live
 * WebGL canvas would change what the child sees during a measured activity,
 * for every syndrome, on hardware we do not control. So the emoji and the real
 * photograph stay exactly as they are, and the object is offered as an
 * extra — a card-sized stage a child can spin. `src === null` renders nothing
 * at all, so an item with no accurate model never shows a 3D button.
 */

/** The 3D viewer is loaded on demand — see the note above before changing it. */
const Object3DViewer = React.lazy(() => import('./Object3DViewer'));

const LABELS = {
  ar: {
    open: 'استكشف بالثلاثي الأبعاد',
    close: 'إخفاء المجسّم',
    caption: (name: string) => `مجسّم ${name} — اسحب لتدويره`,
    badge: 'ثلاثي الأبعاد',
  },
  en: {
    open: 'Explore in 3D',
    close: 'Hide the 3D model',
    caption: (name: string) => `A 3D ${name} — drag to turn it`,
    badge: '3D',
  },
} as const;

export interface Explore3DProps {
  /**
   * Path to the `.glb` for this item, or null when the library has no accurate
   * model for it. Null renders nothing: a wrong 3D object is worse for a child
   * who is learning the word than no 3D object.
   */
  src: string | null;
  /** The object's name, already in the child's language. */
  alt: string;
  /** Emoji reused for the 3D fallback tile and the closed-state preview. */
  emoji: string;
  language: 'ar' | 'en';
  /** Open on mount. False by default so nothing changes for low-end devices. */
  defaultOpen?: boolean;
  /** 'card' sits under a learning card; 'hero' is a larger landing stage. */
  size?: 'card' | 'hero';
  className?: string;
}

export function Explore3D({
  src,
  alt,
  emoji,
  language,
  defaultOpen = false,
  size = 'card',
  className = '',
}: Explore3DProps) {
  const [open, setOpen] = useState(defaultOpen);
  const t = LABELS[language];

  if (!src) return null;

  const stageClass =
    size === 'hero'
      ? 'aspect-[4/3] w-full max-h-[62vh]'
      : 'aspect-square w-full max-h-[46vh] sm:aspect-[4/3]';

  return (
    <section
      aria-label={t.open}
      className={`rounded-brand-xl border-2 border-hairline bg-surface p-4 shadow-brand sm:p-5 ${className}`}
    >
      {!open && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-brand-lg bg-brand-blue-wash text-3xl"
            >
              {emoji}
            </span>
            <div className="min-w-0">
              <p className="t-body truncate font-bold text-ink">{alt}</p>
              <p className="t-small text-ink-muted">{t.badge}</p>
            </div>
          </div>
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            size="lg"
            aria-expanded={false}
            className="shrink-0 rounded-brand-pill border-2 border-brand-blue-ink bg-brand-blue-ink text-xl text-white hover:bg-brand-blue-ink hover:text-white"
          >
            🔍 {t.open}
          </Button>
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-3">
          <Suspense
            fallback={
              // Placeholder while the 3D chunk itself arrives. Same footprint
              // as the stage, so nothing shifts underneath.
              <div
                className={`${stageClass} animate-pulse rounded-brand-xl border-2 border-hairline bg-surface-sunk`}
                aria-hidden="true"
              />
            }
          >
            <Object3DViewer
              src={src}
              alt={alt}
              fallbackEmoji={emoji}
              lang={language}
              autoRotate
              className={`${stageClass} mx-auto`}
            />
          </Suspense>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="t-small min-w-0 flex-1 text-ink-muted">{t.caption(alt)}</p>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              size="lg"
              aria-expanded
              className="shrink-0 rounded-brand-pill border-2 border-hairline bg-surface text-lg hover:bg-ground-tint"
            >
              {t.close}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Explore3D;
