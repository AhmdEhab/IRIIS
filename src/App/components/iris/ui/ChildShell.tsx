import React from 'react';
import { useIris } from '../../../contexts/IrisContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useApp } from '../../../contexts/AppContext';
import { TopBar, StarCount, type Accent } from './brand';
import { ChromeActions } from './ChromeActions';

/**
 * ChildShell — the single visual frame every child-facing screen sits inside.
 *
 * ── WHY THIS FILE CARRIES THE WHOLE LEGACY REDESIGN ───────────────────────
 * There are twenty legacy activity screens. Restyling each by hand would have
 * produced twenty one-off designs that drift apart again within a phase — the
 * exact failure the Phase 10 audit documented. Instead, ALL of them already
 * flow through this component (App.tsx wraps every screen in CHILD_SCREENS in
 * it), so making this the real frame gives every one of them the same ground,
 * the same top bar, the same back control and the same accent in one place.
 *
 * App.tsx did not have to change for that to happen, and no game's logic was
 * touched.
 *
 * ── THE BACK-BUTTON SLOT ──────────────────────────────────────────────────
 * Each legacy screen renders its own `<BackButton onClick={…}/>`, fixed at
 * top-left with a glass background, which collided with everything and looked
 * like nothing else in the product. Rather than edit twenty files, `BackButton`
 * now REGISTERS its handler with this frame through the context below and
 * renders nothing itself. The frame draws one real back control in the top bar
 * — correct direction under RTL, in the layout rather than over it.
 *
 * If a screen using `BackButton` is ever rendered outside this frame, the
 * button falls back to drawing itself, so nothing can become unreachable.
 *
 * ── ACCENT ────────────────────────────────────────────────────────────────
 * Each activity gets ONE dominant colour, assigned here from the screen id.
 * That is the brochure's rule — a panel has a dominant colour and a couple of
 * supporting marks — and doing it centrally means an activity cannot pick a
 * sixth colour for itself.
 */

type BackSlot = { set: (fn: (() => void) | null) => void };
const BackSlotContext = React.createContext<BackSlot | null>(null);

/** Used by ui/BackButton to hand its handler up to the frame. */
export function useBackSlot() {
  return React.useContext(BackSlotContext);
}

/**
 * Activity → accent: ONE dominant colour per activity.
 *
 * ── HOW THESE WERE CHOSEN ─────────────────────────────────────────────────
 * Not by taste. Each activity's own markup was counted after the palette
 * sweep, and the accent is the brand colour that screen already uses most —
 * Memory Game is green because 24 of its colour classes are green, Balloon Pop
 * is blue because 12 of its are. Assigning the accent any other way would have
 * put a purple frame around a green game and made the mismatch WORSE than
 * leaving it alone, because the frame would then be visibly disagreeing with
 * the content instead of merely being absent.
 *
 * The three screens with no clear majority (Numbers, Colors, Body Parts) are
 * assigned by subject, matching the sibling activities a child moves between.
 */
const SCREEN_ACCENT: Record<string, Accent> = {
  // measured majority
  stories: 'purple',
  'games-hub': 'purple',
  'life-skills': 'blue',
  songs: 'blue',
  letters: 'blue',
  shapes: 'blue',
  vehicles: 'blue',
  'balloon-pop': 'blue',
  'shadow-match': 'blue',
  'memory-game': 'green',
  drawing: 'green',
  animals: 'yellow',
  rewards: 'yellow',
  fruits: 'coral',
  emotions: 'coral',
  // assigned by subject, no majority in the file
  numbers: 'purple',
  colors: 'coral',
  'body-parts': 'coral',
  'teaching-demo': 'green',
};

export function ChildShell({
  children,
  showIdentity = true,
}: {
  children: React.ReactNode;
  /** Hide the identity cluster on screens that show their own. */
  showIdentity?: boolean;
}) {
  const { childName, avatar, stars } = useIris();
  const { language } = useLanguage();
  const { currentScreen } = useApp();
  const ar = language === 'ar';

  const [onBack, setOnBack] = React.useState<(() => void) | null>(null);
  // Stable identity so the child screens do not re-register every render.
  const slot = React.useMemo<BackSlot>(() => ({ set: (fn) => setOnBack(() => fn) }), []);

  const accent = SCREEN_ACCENT[currentScreen as string] ?? 'blue';

  return (
    <BackSlotContext.Provider value={slot}>
      <div data-accent={accent} className="iris-child relative min-h-screen bg-ground flex flex-col">
        <TopBar
          ar={ar}
          onBack={onBack ?? undefined}
          backLabel={ar ? 'رجوع' : 'Back'}
          title={
            showIdentity && childName ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-xl leading-none" aria-hidden="true">
                  {avatar}
                </span>
                <span className="truncate">{childName}</span>
              </span>
            ) : undefined
          }
          actions={
            <>
              {showIdentity && <StarCount count={stars} />}
              {/* Child activity screens carry their own mute/repeat/music
                  cluster in a few cases; the language toggle is always here. */}
              <ChromeActions showMute={false} />
            </>
          }
        />
        <div className="relative z-0 flex-1">{children}</div>
      </div>
    </BackSlotContext.Provider>
  );
}
