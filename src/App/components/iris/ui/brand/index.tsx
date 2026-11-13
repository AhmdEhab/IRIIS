import React from 'react';
import { DashedArc, DotScatter, Star } from './Decor';
import { BrandIcon, type IconName } from './BrandIcon';

/* The Phase 10 layout and control system. Re-exported here so a screen has ONE
   import path for the whole design system — the previous split across three
   files was part of why screens gave up and hand-rolled their own markup. */
export * from './system';
export { BrandIcon, ICON_NAMES } from './BrandIcon';
export type { IconName } from './BrandIcon';

/**
 * IRIS brand components.
 *
 * These exist so a screen never has to re-decide what an IRIS card, heading or
 * badge looks like. Before this file, every screen hand-assembled its own —
 * which is how the product ended up with five page widths, two neutral ramps
 * and eighteen colour families for a five-colour identity.
 *
 * Everything here is styled from the tokens in styles/iris.css. No component
 * in this file contains a raw colour that is not a brand value.
 */

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

/** The brand's five accent roles, for components that take a colour. */
export type BrandTone = 'blue' | 'coral' | 'yellow' | 'green' | 'purple';

/**
 * NOTE ON WHY EVERY VARIANT IS WRITTEN OUT IN FULL, INCLUDING THE HOVER ONES.
 * Tailwind generates utilities by scanning source text for complete class
 * names. A template like `hover:${TONE[tone].border}` is assembled at runtime
 * and never appears in the source, so the class is silently never generated
 * and the hover state simply does not exist. Writing `hoverBorder` out as a
 * literal is what makes it real.
 */
const TONE: Record<
  BrandTone,
  { bg: string; wash: string; ink: string; border: string; hoverBorder: string }
> = {
  blue: {
    bg: 'bg-brand-blue', wash: 'bg-brand-blue-wash', ink: 'text-brand-blue-ink',
    border: 'border-brand-blue', hoverBorder: 'hover:border-brand-blue',
  },
  coral: {
    bg: 'bg-brand-coral', wash: 'bg-brand-coral-wash', ink: 'text-brand-coral-ink',
    border: 'border-brand-coral', hoverBorder: 'hover:border-brand-coral',
  },
  yellow: {
    bg: 'bg-brand-yellow', wash: 'bg-brand-yellow-wash', ink: 'text-brand-yellow-ink',
    border: 'border-brand-yellow', hoverBorder: 'hover:border-brand-yellow',
  },
  green: {
    bg: 'bg-brand-green', wash: 'bg-brand-green-wash', ink: 'text-brand-green-ink',
    border: 'border-brand-green', hoverBorder: 'hover:border-brand-green',
  },
  purple: {
    bg: 'bg-brand-purple', wash: 'bg-brand-purple-wash', ink: 'text-brand-purple-ink',
    border: 'border-brand-purple', hoverBorder: 'hover:border-brand-purple',
  },
};

export const brandTone = (t: BrandTone) => TONE[t];

/* ── Surface ─────────────────────────────────────────────────────────────── */

/**
 * A rounded card on the warm ground.
 *
 * Three elevations, not one. The audit found a single radius and a single
 * shadow stamped on every block, which flattens hierarchy — border, fill and
 * shadow each say "separate object", so they are spent by role here.
 */
export function Surface({
  children,
  elevation = 'raised',
  tone,
  className = '',
  as: Tag = 'div',
  ...rest
}: {
  children?: React.ReactNode;
  /** flat = sits in the page · raised = a card · lifted = the hero of a screen */
  elevation?: 'flat' | 'raised' | 'lifted';
  /** Optional tinted wash, for cards that carry a category colour. */
  tone?: BrandTone;
  className?: string;
  as?: any;
} & React.HTMLAttributes<HTMLElement>) {
  /**
   * NOTE: the background is chosen ONCE rather than layering the tone wash on
   * top of `bg-surface`. Both are background utilities in the same Tailwind
   * layer, so which one won depended on their generated order — and in
   * practice `bg-surface` was winning, which meant `tone` silently did
   * nothing. The confidence banner on the Learning Snapshot had been rendering
   * plain white for that reason.
   */
  const bg = tone ? TONE[tone].wash : 'bg-surface';
  const shape =
    elevation === 'flat'
      ? 'border border-hairline-soft rounded-brand'
      : elevation === 'lifted'
        ? 'border border-hairline rounded-brand-xl shadow-brand-lg'
        : 'border border-hairline rounded-brand-lg shadow-brand';
  return (
    <Tag className={cx(bg, shape, className)} {...rest}>
      {children}
    </Tag>
  );
}

/* ── SectionHeader ───────────────────────────────────────────────────────── */

/**
 * A section title with the brand's hand-drawn punctuation.
 *
 * The dotted rule above the title is the logo's own dashed arc, reused as a
 * structural mark — it says "a new section starts here" without needing a
 * heavy border.
 */
export function SectionHeader({
  title,
  eyebrow,
  tone = 'yellow',
  className = '',
  children,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  tone?: BrandTone;
  className?: string;
  /** Optional trailing control, e.g. a "see all" button. */
  children?: React.ReactNode;
}) {
  return (
    <div className={cx('flex items-end justify-between gap-4 mb-4', className)}>
      <div>
        <span className={cx('iris-dot-row block', TONE[tone].ink)} aria-hidden="true" />
        {eyebrow && <span className={cx('t-label block mb-0.5', TONE[tone].ink)}>{eyebrow}</span>}
        {/* t-title binds family + size + line-height together, so a heading can
            no longer take the display size without the display face. */}
        <h2 className="t-title text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ── Pill ────────────────────────────────────────────────────────────────── */

/** A small status chip. Colour AND text always, never colour alone (WCAG 1.4.1). */
export function Pill({
  children,
  tone = 'blue',
  className = '',
  ...rest
}: { children: React.ReactNode; tone?: BrandTone; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
        TONE[tone].wash,
        TONE[tone].ink,
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ── AvatarRing ──────────────────────────────────────────────────────────── */

/**
 * The container the companion or a chosen avatar sits inside.
 * A soft brand-tinted disc with a warm ring — never a hard circle border.
 */
export function AvatarRing({
  children,
  tone = 'yellow',
  size = 'md',
  className = '',
}: {
  children: React.ReactNode;
  tone?: BrandTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dim = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-28 h-28' : 'w-16 h-16';
  return (
    <div
      className={cx(
        'relative flex items-center justify-center rounded-full border-4 border-surface shadow-brand-sm',
        TONE[tone].wash,
        dim,
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── ProgressTrack ───────────────────────────────────────────────────────── */

/**
 * Progress as a row of dots rather than a filled bar.
 *
 * A bar reads as "how much is left to endure"; dots read as "how many we have
 * collected", which is the register the rest of the child UI is written in.
 * The count is also announced as text, so the information does not live in
 * colour or shape alone.
 */
export function ProgressTrack({
  total,
  done,
  tone = 'green',
  label,
  className = '',
}: {
  total: number;
  done: number;
  tone?: BrandTone;
  /** Accessible description, e.g. "Question 3 of 8". */
  label: string;
  className?: string;
}) {
  const safeTotal = Math.max(0, total);
  const safeDone = Math.min(Math.max(0, done), safeTotal);
  return (
    <div
      className={cx('flex items-center gap-1.5', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={safeDone}
      aria-label={label}
    >
      {Array.from({ length: safeTotal }, (_, i) => (
        <span
          key={i}
          className={cx(
            'h-2.5 rounded-full transition-all duration-300',
            i < safeDone ? cx(TONE[tone].bg, 'w-6') : 'bg-hairline w-2.5'
          )}
        />
      ))}
    </div>
  );
}

/* ── ActivityTile ────────────────────────────────────────────────────────── */

/**
 * The child-facing card for a game or activity.
 *
 * This is the brochure's "WHAT WE DO?" tile, one-for-one: a soft colour wash,
 * a simple drawn mark, and a two-word label. It existed before Phase 10 and
 * had ZERO render sites — `IrisChildHome` imported it and then hand-built its
 * own tiles beside it, which is how the child grid ended up with a different
 * radius, a different shadow and emoji icons.
 *
 * `icon` takes a drawn `IconName`. A ReactNode is still accepted so a caller
 * with genuine picture content (a story thumbnail, a letter glyph) can pass it
 * through, but interface icons come from the set.
 */
export function ActivityTile({
  icon,
  label,
  tone = 'blue',
  onClick,
  className = '',
}: {
  icon: IconName | React.ReactNode;
  label: string;
  tone?: BrandTone;
  onClick?: () => void;
  className?: string;
}) {
  const isNamed = typeof icon === 'string';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group w-full bg-surface border-2 border-hairline rounded-brand-lg shadow-brand-sm',
        'p-4 sm:p-5 flex flex-col items-center gap-3 text-center',
        'transition-[transform,border-color] duration-200 hover:-translate-y-1',
        TONE[tone].hoverBorder,
        className
      )}
    >
      <span
        className={cx(
          'w-16 h-16 rounded-brand flex items-center justify-center text-3xl',
          TONE[tone].wash,
          TONE[tone].ink
        )}
        aria-hidden="true"
      >
        {isNamed ? <BrandIcon name={icon as IconName} className="w-9 h-9" tone="transparent" /> : icon}
      </span>
      <span className="font-bold text-ink leading-snug">{label}</span>
    </button>
  );
}

/**
 * The non-interactive sibling of ActivityTile.
 *
 * Child Home showed "We play / We collect stars / We learn something new" in
 * cards that looked exactly like the tappable Free Play tiles. A child cannot
 * tell those apart, taps one, and nothing happens. This is visibly information:
 * no border lift, no shadow, no hover.
 */
export function InfoTile({
  icon,
  label,
  tone = 'blue',
  className = '',
}: {
  icon: IconName;
  label: string;
  tone?: BrandTone;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'w-full rounded-brand-lg p-4 flex items-center gap-3 text-start',
        TONE[tone].wash,
        className
      )}
    >
      <span className={cx('shrink-0 w-10 h-10 flex items-center justify-center', TONE[tone].ink)} aria-hidden="true">
        <BrandIcon name={icon} className="w-7 h-7" tone="transparent" />
      </span>
      <span className="font-bold text-ink leading-snug">{label}</span>
    </div>
  );
}

/* ── ParentCard ──────────────────────────────────────────────────────────── */

/**
 * A Parent Mode section card. Calmer than the child cards — parents are
 * reading, not playing — but built from the same tokens so the two modes are
 * recognisably one product.
 */
export function ParentCard({
  title,
  description,
  icon,
  tone = 'blue',
  badge,
  onClick,
  disabled = false,
  className = '',
}: {
  title: string;
  description?: string;
  icon?: IconName | React.ReactNode;
  tone?: BrandTone;
  /** e.g. a "Coming soon" pill. Kept honest — see IrisSpecialists. */
  badge?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const Tag: any = onClick ? 'button' : 'div';
  const isNamed = typeof icon === 'string';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      className={cx(
        'w-full text-start bg-surface border-2 border-hairline rounded-brand-lg shadow-brand-sm',
        'p-5 flex items-start gap-4 transition-[border-color,background-color] duration-200',
        onClick && !disabled && cx('hover:bg-ground-tint', TONE[tone].hoverBorder),
        disabled && 'opacity-80',
        className
      )}
    >
      {icon && (
        <span
          className={cx(
            'shrink-0 w-12 h-12 rounded-brand flex items-center justify-center text-2xl',
            TONE[tone].wash,
            TONE[tone].ink
          )}
          aria-hidden="true"
        >
          {isNamed ? <BrandIcon name={icon as IconName} className="w-7 h-7" tone="transparent" /> : icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-ink">{title}</span>
          {badge}
        </span>
        {description && <span className="block text-sm text-ink-muted mt-1 leading-relaxed">{description}</span>}
      </span>
    </Tag>
  );
}

/* ── StarCount ───────────────────────────────────────────────────────────── */

/** The reward counter, using the brand star rather than an emoji. */
export function StarCount({ count, className = '' }: { count: number; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full bg-brand-yellow-wash border border-brand-yellow px-3 py-1',
        className
      )}
      role="status"
    >
      <Star className="w-4 h-4" />
      {/* dir=ltr so the numeral never renders as "1+" under RTL bidi. */}
      <span dir="ltr" className="font-black text-brand-yellow-ink tabular-nums">
        {count}
      </span>
    </span>
  );
}

export { DashedArc, DotScatter, Star };
