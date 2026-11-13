import React from 'react';
import { BrandIcon, type IconName } from './BrandIcon';
import { Blob, DashedArc, Star, Sparkle } from './Decor';

/**
 * The IRIS layout and control system.
 *
 * ── THE PROBLEM THIS FILE SOLVES ──────────────────────────────────────────
 * The Phase 10 audit found the brand component library existed and almost
 * nothing used it: four of its eight components had zero render sites, and
 * `IrisChildHome` imported `ActivityTile` and then hand-built its own tiles.
 * The result was 21 corner radii, 761 off-palette colour utilities, forty
 * different back buttons and six type sizes on a single screen.
 *
 * Adding a ninth optional component would not have fixed that. What fixes it
 * is making the shared pieces the PATH OF LEAST RESISTANCE: a screen that uses
 * `ScreenFrame` gets its ground, its accent, its top bar, its safe areas and
 * its RTL handling for free, and a screen that does not use it has to
 * reimplement all five. That asymmetry is the enforcement mechanism.
 *
 * ── THE ONE-DOMINANT-COLOUR RULE ──────────────────────────────────────────
 * The brochure never puts five colours on one panel. `ScreenFrame` takes an
 * `accent` and publishes it as `--screen-accent` on the screen root; section
 * rules, progress, empty states and default card tones all read from it. A
 * screen therefore declares its colour once instead of repeating it thirty
 * times, and a screen using too many colours is visible in one place.
 */

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(' ');

export type Accent = 'blue' | 'coral' | 'yellow' | 'green' | 'purple';

/* ══ ScreenFrame ══════════════════════════════════════════════════════════ */

/**
 * The one page wrapper.
 *
 * Replaces the per-screen `<div className="min-h-screen bg-ground p-6 pt-20…">`
 * that every screen was reinventing — each with its own padding, its own
 * max width and its own decision about whether to leave room for the fixed
 * controls.
 *
 * `pt` handling is worth a note: the top bar is sticky rather than fixed, so
 * content flows beneath it naturally and no screen needs the `pt-20 sm:pt-6`
 * compensation that four screens had grown to avoid the old floating controls.
 */
export function ScreenFrame({
  children,
  accent = 'blue',
  topBar,
  width = 'md',
  decor = true,
  tone = 'ground',
  className = '',
  childMode = false,
  center = false,
}: {
  children: React.ReactNode;
  accent?: Accent;
  /** Usually a <TopBar/>. Sticks to the top and shares the screen's accent. */
  topBar?: React.ReactNode;
  /** sm = a form · md = reading · lg = a grid · full = an activity canvas */
  width?: 'sm' | 'md' | 'lg' | 'full';
  /** Corner blobs. Off for dense screens and for activity canvases. */
  decor?: boolean;
  tone?: 'ground' | 'tint';
  className?: string;
  /** Adds .iris-child, which raises the touch-target floor to 56px. */
  childMode?: boolean;
  /** Vertically centres short content instead of letting it sit at the top of
   *  a tall empty column — audit defect D7, the assessment card adrift in an
   *  empty field. */
  center?: boolean;
}) {
  const max =
    width === 'sm' ? 'max-w-md' : width === 'md' ? 'max-w-2xl' : width === 'lg' ? 'max-w-5xl' : 'max-w-none';

  return (
    <div
      data-accent={accent}
      data-screen-frame=""
      className={cx(
        'min-h-screen relative overflow-x-hidden flex flex-col',
        tone === 'tint' ? 'bg-ground-tint' : 'bg-ground',
        childMode && 'iris-child',
        className
      )}
    >
      {decor && <FrameDecor />}
      {topBar}
      <div
        className={cx(
          'relative z-10 flex-1 w-full mx-auto px-4 sm:px-6 pb-10 pt-5',
          max,
          center && 'flex flex-col justify-center'
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Corner colour, the way the brochure does it.
 *
 * Colour is POOLED AT THE EDGES and the middle is left clear — that is the
 * single most characteristic thing about the printed layouts, and the app was
 * not doing it. Two blobs, not four: four boxed the centre in at 390px.
 *
 * ── THE OPACITY TRAP, TWICE NOW ───────────────────────────────────────────
 * A dark brand colour at low opacity on a cream ground does not look like a
 * pale version of that colour. It looks GREY. This codebase has now hit that
 * exact bug twice: once with brand blue at 0.09 behind a practice card, and
 * again here — the first version of this component drew the screen accent at
 * 0.16 and the blue and purple screens came out with a dirty grey disc in the
 * corner. Both times it was caught by LOOKING at the rendered screen, never by
 * reading the hex value.
 *
 * So the accent blob is painted with the accent's WASH — a colour that was
 * mixed to sit on this ground and stays recognisably blue, purple, green — at
 * full strength, instead of the accent itself at a fraction of it. The warm
 * partner blob uses yellow, which is light enough to survive being thinned.
 */
function FrameDecor() {
  return (
    /* top-16, not inset-0: the top bar is opaque, so a blob anchored at the
       frame's top edge gets sliced by it and renders as a half-disc with a
       straight edge — the opposite of the organic shape it is meant to be.
       Starting the decor layer below the bar keeps the curve intact. */
    <div className="pointer-events-none absolute inset-x-0 top-16 bottom-0 overflow-hidden z-0" aria-hidden="true">
      <Blob
        color="var(--screen-accent-wash)"
        opacity={1}
        className="absolute -top-28 -start-28 w-80 h-80"
      />
      <Blob color="var(--brand-yellow)" opacity={0.3} className="absolute -bottom-28 -end-24 w-80 h-80" />
    </div>
  );
}

/* ══ TopBar ═══════════════════════════════════════════════════════════════ */

/**
 * The single navigation bar.
 *
 * ── WHAT IT REPLACES ──────────────────────────────────────────────────────
 * Forty bespoke back controls (`← Parent Mode`, `Back`, `رجوع`, `Home`, each
 * in its own position), plus `GlobalControls` — a glassmorphism pill fixed at
 * `top-4 right-4 z-[100]` on every screen, which was the only glass surface in
 * the product, used `slate`, and physically collided with whatever else lived
 * in that corner. Two audit defects came from that collision alone: "Log out"
 * was unreadable on Parent Home, and "Back" rendered as "BaAR" on Ask IRIS.
 *
 * ── DIRECTION ─────────────────────────────────────────────────────────────
 * The back chevron is chosen from the writing direction, not hard-coded. In
 * RTL, "back" points right. The old login screen got this wrong.
 */
export function TopBar({
  title,
  onBack,
  backLabel,
  actions,
  ar = false,
  sticky = true,
}: {
  title?: React.ReactNode;
  onBack?: () => void;
  /** Visible text next to the chevron. Short — it is a label, not a sentence. */
  backLabel?: string;
  actions?: React.ReactNode;
  ar?: boolean;
  sticky?: boolean;
}) {
  return (
    <header
      className={cx(
        'relative z-30 w-full border-b border-hairline-soft bg-surface',
        sticky && 'sticky top-0'
      )}
    >
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-5 py-2.5 flex items-center gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-brand-pill border-2 border-hairline bg-surface px-3 sm:px-4 h-11 font-bold text-ink hover:bg-ground-tint transition-colors"
          >
            <BrandIcon name={ar ? 'forward' : 'back'} className="w-5 h-5 shrink-0" />
            {backLabel && <span className="hidden sm:inline t-small">{backLabel}</span>}
            <span className="sr-only-iris sm:hidden">{backLabel ?? (ar ? 'رجوع' : 'Back')}</span>
          </button>
        ) : (
          <span className="shrink-0" />
        )}

        {title && (
          <div className="flex-1 min-w-0 text-center sm:text-start">
            <span className="t-heading text-ink block truncate">{title}</span>
          </div>
        )}
        {!title && <span className="flex-1" />}

        <div className="shrink-0 flex items-center gap-1.5">{actions}</div>
      </div>
    </header>
  );
}

/**
 * A round icon control for the TopBar's action slot.
 * Solid warm surface, never glass — glass over arbitrary content is what made
 * the old controls illegible against half the screens in the app.
 */
export function BarButton({
  icon,
  label,
  onClick,
  active,
  pressed,
  className = '',
}: {
  icon: IconName;
  /** Required. These are the only unlabelled controls in the product. */
  label: string;
  onClick?: () => void;
  active?: boolean;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cx(
        'w-11 h-11 rounded-brand-pill border-2 flex items-center justify-center transition-colors',
        active
          ? 'bg-accent-screen-wash border-accent-screen text-accent-screen-ink'
          : 'bg-surface border-hairline text-ink-muted hover:bg-ground-tint',
        className
      )}
    >
      <BrandIcon name={icon} className="w-5 h-5" tone="transparent" />
    </button>
  );
}

/** A compact text control for the bar — "Log out", "Home", "EN". */
export function BarAction({
  children,
  onClick,
  tone = 'quiet',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: 'quiet' | 'accent';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'h-11 px-3.5 rounded-brand-pill border-2 t-small transition-colors whitespace-nowrap',
        tone === 'accent'
          ? 'bg-brand-blue-ink border-brand-blue-ink text-white hover:brightness-125'
          : // Solid surface + ink, NOT a faint tint. The old "Log out" was
            // ink-faint on the ground and sat under the floating controls,
            // which made it effectively invisible (audit defect D1).
            'bg-surface border-hairline text-ink hover:bg-ground-tint'
      )}
    >
      {children}
    </button>
  );
}

/* ══ Button ═══════════════════════════════════════════════════════════════ */

/**
 * The IRIS button.
 *
 * ── THE DISABLED STATE IS THE POINT ───────────────────────────────────────
 * The audit's defect D11: the login CTA is a large brand-blue slab rendered at
 * `disabled:opacity-50`, and it is the first thing a parent sees. The fill was
 * correct; the treatment read as "broken". A 50%-faded primary button tells a
 * user the app is wrong. A quiet outlined button with a helper line tells them
 * what to do next. So `disabled` here does not fade the primary style — it
 * SWITCHES to the quiet style, and callers pass `hint` to say why.
 */
export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  disabled = false,
  hint,
  full = false,
  type = 'button',
  className = '',
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  /** primary = the one action · secondary = an alternative · quiet = tertiary
   *  play = the big child-facing call to action */
  variant?: 'primary' | 'secondary' | 'quiet' | 'play';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconEnd?: IconName;
  disabled?: boolean;
  /** Shown beneath a disabled button, explaining what would enable it. */
  hint?: string;
  full?: boolean;
  type?: 'button' | 'submit';
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'>) {
  /**
   * `lg` is text-xl (20px), not text-lg (18px), and that is a contrast
   * decision rather than a taste one. WCAG treats 18.66px-bold and up as
   * "large text", where the bar drops from 7:1 to 4.5:1. At 18px the coral
   * play button sat just under that threshold and had to become a much darker
   * red to pass; at 20px it stays coral. Two pixels bought the brand colour.
   */
  const dims =
    size === 'sm'
      ? 'h-11 px-4 text-sm'
      : size === 'lg'
        ? 'min-h-[3.75rem] px-8 text-xl'
        : 'min-h-[3rem] px-6';

  /**
   * FILL COLOURS UNDER WHITE TEXT.
   *
   * `primary` can appear at any size, including 16px, so it uses the ink blue
   * (white on it: 8.2:1) rather than the bright brand blue (5.8:1 — fine for
   * a heading, short of AAA for a label).
   *
   * `play` is always large by construction (see `dims`), so it can use the
   * coral -solid value and stay recognisably coral at 4.6:1.
   *
   * Both were measured on the running app, not assumed: the live contrast
   * audit found white-on-coral at 3.2:1 and white-on-green at 2.5:1 before
   * this changed.
   */
  const looksDisabled = disabled;
  const style = looksDisabled
    ? 'bg-surface-sunk border-2 border-hairline text-ink-muted cursor-not-allowed'
    : variant === 'primary'
      ? 'bg-brand-blue-ink border-2 border-brand-blue-ink text-white hover:brightness-125 active:scale-[0.985]'
      : variant === 'play'
        ? 'bg-brand-coral-solid border-2 border-brand-coral-solid text-white hover:brightness-110 active:scale-[0.985] shadow-brand'
        : variant === 'secondary'
          ? 'bg-surface border-2 border-accent-screen text-accent-screen-ink hover:bg-accent-screen-wash'
          : 'bg-surface border-2 border-hairline text-ink hover:bg-ground-tint';

  const btn = (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2.5 rounded-brand-pill font-bold',
        'transition-[filter,transform,background-color] duration-150',
        dims,
        style,
        full && 'w-full',
        className
      )}
      {...rest}
    >
      {icon && <BrandIcon name={icon} className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} tone="transparent" />}
      <span className="truncate">{children}</span>
      {iconEnd && <BrandIcon name={iconEnd} className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} tone="transparent" />}
    </button>
  );

  if (!hint || !disabled) return btn;
  return (
    <span className={cx('inline-flex flex-col gap-1.5', full && 'w-full')}>
      {btn}
      <span className="t-small text-ink-muted text-center font-medium">{hint}</span>
    </span>
  );
}

/* ══ Typography ═══════════════════════════════════════════════════════════ */

/**
 * The brochure headline.
 *
 * `<DisplayTitle>Understanding, <Mark>not standardizing</Mark></DisplayTitle>`
 *
 * One per screen. The display face is deliberately scarce — the identity pack
 * says "do not make every line look handwritten. Use the playful display style
 * selectively for hierarchy."
 */
export function DisplayTitle({
  children,
  as: Tag = 'h1',
  size = 'display',
  className = '',
  arc = false,
}: {
  children: React.ReactNode;
  as?: any;
  size?: 'display' | 'title';
  className?: string;
  /** The logo's dashed arc, tucked under the heading. */
  arc?: boolean;
}) {
  return (
    <div className={cx('relative', className)}>
      <Tag className={cx(size === 'display' ? 't-display' : 't-title', 'text-ink')}>{children}</Tag>
      {arc && <DashedArc color="var(--screen-accent)" className="w-40 h-6 -mt-1 opacity-80" />}
    </div>
  );
}

/**
 * The yellow marker swipe from the brochure — used on ONE phrase per heading.
 * It is a background, so the words stay selectable and a screen reader hears
 * the text rather than "highlight".
 */
export function Mark({ children }: { children: React.ReactNode }) {
  return <span className="iris-mark">{children}</span>;
}

/** A section title, with the accent's dotted rule above it. */
export function SectionTitle({
  title,
  eyebrow,
  children,
  className = '',
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Optional trailing control. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex items-end justify-between gap-4 mb-3', className)}>
      <div className="min-w-0">
        <span className="iris-accent-dots block" aria-hidden="true" />
        {eyebrow && <span className="t-label block text-accent-screen-ink mb-0.5">{eyebrow}</span>}
        <h2 className="t-heading text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/**
 * The brochure's numbered disc — a coloured circle with the step number in it.
 * Used for ordered lists (priorities, home tips, "our adventure"), where a
 * plain bullet would lose the sense of sequence.
 */
const DISC_TONES = ['bg-brand-coral', 'bg-brand-blue', 'bg-brand-yellow', 'bg-brand-green', 'bg-brand-purple'];
const DISC_INK = ['text-white', 'text-white', 'text-ink', 'text-white', 'text-white'];

export function StepDisc({ n, className = '' }: { n: number; className?: string }) {
  const i = (n - 1) % DISC_TONES.length;
  return (
    <span
      className={cx(
        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black tabular-nums',
        DISC_TONES[i],
        DISC_INK[i],
        className
      )}
      dir="ltr"
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

/* ══ Inputs ═══════════════════════════════════════════════════════════════ */

/**
 * A labelled field. The label is always visible — placeholder-as-label
 * disappears the moment a user starts typing, which is exactly when someone
 * who needs the reminder needs it.
 */
export function Field({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  children: React.ReactElement;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block t-small text-ink font-bold">
        {label}
      </label>
      {React.cloneElement(children as any, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {hint && !error && (
        <p id={`${id}-hint`} className="t-small text-ink-muted font-medium">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="t-small text-brand-coral-ink flex items-start gap-1.5">
          <BrandIcon name="alert" className="w-4 h-4 mt-0.5 shrink-0" tone="var(--brand-coral-wash)" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'w-full rounded-brand border-2 border-hairline bg-surface px-4 py-3 text-ink placeholder:text-ink-muted ' +
  'min-h-[3rem] transition-colors focus:border-accent-screen';

/* ══ States ═══════════════════════════════════════════════════════════════ */

/**
 * The empty state.
 *
 * Mascot, one warm line, at most one action. The audit found Ask IRIS
 * presenting a bare grey void with suggestion chips floating in it, and the
 * assessment card adrift in an empty field; both are this component's job.
 */
export function EmptyState({
  title,
  body,
  action,
  illustration,
  className = '',
}: {
  title?: string;
  body: string;
  action?: React.ReactNode;
  /** Usually an <IrisBuddy/>. Falls back to accent decoration. */
  illustration?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('text-center py-8 px-4 flex flex-col items-center gap-4', className)}>
      <div className="w-28 h-28 flex items-center justify-center" aria-hidden="true">
        {illustration ?? <Sparkle color="var(--screen-accent)" className="w-16 h-16 opacity-70" />}
      </div>
      {title && <h3 className="t-heading text-ink">{title}</h3>}
      <p className="t-body text-ink-muted max-w-sm leading-relaxed">{body}</p>
      {action}
    </div>
  );
}

/**
 * An error state a parent can act on.
 * Coral is IRIS's attention colour; it never appears in child-facing feedback,
 * where a red flash beside an answer would describe the child rather than the
 * attempt.
 */
export function ErrorState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-brand-lg border-2 border-brand-coral bg-brand-coral-wash p-4 flex items-start gap-3"
    >
      <BrandIcon name="alert" className="w-6 h-6 shrink-0 text-brand-coral-ink" tone="transparent" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink">{title}</p>
        <p className="t-small text-ink-muted mt-0.5 leading-relaxed">{body}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

/* ══ Celebration ══════════════════════════════════════════════════════════ */

/**
 * The single "well done" treatment.
 *
 * The app had several: a green heading here, a confetti burst there, a bare
 * "Well done!" somewhere else. One is enough, and one is what makes finishing
 * an activity feel the same everywhere.
 *
 * The sparkle burst is decoration and is suppressed under reduced motion by
 * the global rule; the words and the star carry the whole message without it.
 */
export function Celebration({
  headline,
  body,
  note,
  action,
  mascot,
}: {
  headline: string;
  body?: string;
  /** A true, specific thing that happened — not a score. */
  note?: string;
  action?: React.ReactNode;
  mascot?: React.ReactNode;
}) {
  return (
    <div className="text-center space-y-4 py-6 flex flex-col items-center">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <Blob color="var(--brand-yellow)" opacity={0.3} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10">{mascot ?? <Star className="w-20 h-20" />}</div>
        <Sparkle color="var(--brand-coral)" className="absolute top-1 end-2 w-6 h-6" />
        <Sparkle color="var(--brand-blue)" className="absolute bottom-3 start-1 w-5 h-5" />
      </div>
      <h1 className="t-title text-ink">{headline}</h1>
      {body && <p className="t-body text-ink-muted max-w-md leading-relaxed">{body}</p>}
      {note && (
        <p className="t-small text-brand-green-ink inline-flex items-center gap-1.5 bg-brand-green-wash rounded-brand-pill px-4 py-2">
          <BrandIcon name="sprout" className="w-4 h-4" tone="transparent" />
          {note}
        </p>
      )}
      {action}
    </div>
  );
}

/* ══ Logo ═════════════════════════════════════════════════════════════════ */

/**
 * The master logo, with clear space enforced.
 *
 * The identity pack is explicit: keep the proportions, give it clear space, no
 * effects, no gradients, no shadows, and no busy artwork behind it. It also
 * already contains the IRIS wordmark — which is why the landing screen setting
 * the logo above a second, retyped "IRIS" heading was a defect (D4) rather
 * than a reinforcement.
 */
export function Logo({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  // The source artwork carries a lot of internal margin, so the rendered
  // mark is noticeably smaller than the box. These sizes are the box.
  const dim = size === 'sm' ? 'w-20 h-20' : size === 'lg' ? 'w-56 h-56 md:w-72 md:h-72' : 'w-40 h-40';
  return (
    <img
      src="/images/iris-logo-static.png"
      alt="IRIS"
      draggable={false}
      className={cx(dim, 'object-contain mx-auto select-none', className)}
    />
  );
}
