import React from 'react';
import { Blob, Sparkle } from '../landing/LandingDecor';
import { IrisBuddy } from '../iris/ui/IrisBuddy';
import { FloatingLanguage } from '../landing/LandingHeader';
import './auth.css';

/**
 * AuthShell — the landing page's composition, wrapped around the two doors
 * into the product: sign in and register.
 *
 * ── WHY IT EXISTS ─────────────────────────────────────────────────────────
 * The marketing page earns its "playful premium" read from a small number of
 * decisions working together: a cream ground with colour pooled at the edges,
 * one white plate with a 2px warm border and a 28px corner, the display face
 * underlined by a yellow swash, and pill buttons that push back when you press
 * them. The auth screens had none of that — they were assembled from Tailwind
 * utilities directly, so the product changed character in the one step between
 * "this looks lovely" and "let me actually get in".
 *
 * AuthShell owns the scene once so both screens get it identically. It is
 * presentation only: it holds no state, reads no context, fires no sound and
 * navigates nowhere. Every behavioural piece — the back control, the language
 * and mute controls, the step indicator, the form — is passed in as a slot by
 * the screen that owns it, wired exactly as it was.
 *
 * ── WHY IT DOES NOT USE ScreenFrame ───────────────────────────────────────
 * `ScreenFrame` is the right wrapper for the content screens: a top bar, then a
 * column that starts at the top of the page. An auth screen wants the opposite
 * shape — one object, centred in the viewport, with the brand's ambient layer
 * around it — and its widths (`max-w-md` / `max-w-2xl`) are not the two the
 * card needs (460 / 640). So the scene is drawn here.
 *
 * It keeps the one contract that matters: `data-accent="blue"` on the root,
 * because that is how `--screen-accent` reaches the shared controls.
 * ChromeActions styles its mute button from `bg-accent-screen-wash`, and
 * without the attribute the language and sound controls lose their colour.
 *
 * ── THE MASCOT AND THE TOP EDGE ───────────────────────────────────────────
 * The buddy overlaps the card rather than sitting above it, the way the hero's
 * companion overlaps its pedestal. It is absolutely positioned inside the card
 * with `inset-inline: 0; margin-inline: auto` — centred by auto margins instead
 * of a transform, so it neither depends on the writing direction nor extends
 * the card's scroll box. The space it needs is paid for by the card's own top
 * padding, and the stage reserves half the mascot's height above the card so it
 * can never collide with the chrome row.
 *
 * ── DECORATION IS DECORATION ──────────────────────────────────────────────
 * Blobs and sparkles sit inside one `aria-hidden` container; the mascot is
 * drawn without a `title`, so `IrisBuddy` marks itself hidden rather than being
 * announced next to a heading that already says "Welcome back". Motion is CSS
 * only, inside `@media (prefers-reduced-motion: no-preference)` — the screens
 * keep their own Framer Motion props untouched.
 */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export function AuthShell({
  topBar,
  title,
  tagline,
  head,
  footer,
  wide = false,
  tone = 'blue',
  children,
}: {
  /** The screen's own <TopBar/> — back control plus <ChromeActions/>. */
  topBar: React.ReactNode;
  /** Existing heading string, rendered verbatim. Never split, never re-worded. */
  title: string;
  /** Existing sub-heading string, rendered verbatim. */
  tagline?: string;
  /** Between the heading and the form: the registration step indicator. */
  head?: React.ReactNode;
  /** Below the card: login's "Don't have an account?" line. */
  footer?: React.ReactNode;
  /** 640px instead of 460px — a screen with two fields per row. */
  wide?: boolean;
  /** Blue border for the one-action screen, neutral hairline for the wizard. */
  tone?: 'blue' | 'neutral';
  children: React.ReactNode;
}) {
  return (
    <div data-accent="blue" className="ir-auth-scene">
      <div className="ir-auth-decor" aria-hidden="true">
        <Blob className="ir-auth-blob ir-auth-blob--1" fill="var(--brand-yellow-wash)" />
        <Blob className="ir-auth-blob ir-auth-blob--2" fill="var(--brand-blue-wash)" />
        <Sparkle className="ir-auth-spark ir-auth-spark--1" />
        <Sparkle className="ir-auth-spark ir-auth-spark--2" fill="var(--brand-coral)" />
        <Sparkle className="ir-auth-spark ir-auth-spark--3" fill="var(--brand-purple)" />
        <Sparkle className="ir-auth-spark ir-auth-spark--4" fill="var(--brand-green)" />
        <Sparkle className="ir-auth-spark ir-auth-spark--5" />
        <Sparkle className="ir-auth-spark ir-auth-spark--6" fill="var(--brand-blue)" />
      </div>

      {/* The logo is a mark here, not a link: the way out of this scene is the
          back control inside `topBar`, which is where it has always been. */}
      <div className="ir-auth-chrome">
        <img
          src="/images/iris-logo-tight.png"
          width={726}
          height={509}
          alt="IRIS"
          draggable={false}
          className="ir-auth-logo"
        />
        <div className="ir-auth-chrome-bar">{topBar}</div>
      </div>

      <FloatingLanguage />
      <div className="ir-auth-main">
        <div className="ir-auth-stack">
          <div className={cx('ir-auth-card', wide && 'ir-auth-card--wide', tone === 'blue' && 'ir-auth-card--blue')}>
            <IrisBuddy mood="happy" className="ir-auth-buddy" />
            <div className="ir-auth-head">
              <h1 className="ir-auth-title">{title}</h1>
              {tagline && <p className="ir-auth-tagline">{tagline}</p>}
            </div>
            {head}
            <div className="ir-auth-body">{children}</div>
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
