import React from 'react';

/**
 * Hand-drawn brand marks.
 *
 * BRAND_IDENTITY.md §3 asks for "organic blobs, hand-drawn arrows, doodles,
 * stars and sparkles, suns / rays, dots and playful marks, wavy underlines",
 * and explicitly rules out "sharp corporate grids" and "generic technology
 * stock aesthetics". These are those marks, drawn as SVG so they inherit the
 * brand colours, cost no network request, and scale cleanly.
 *
 * They are decoration and nothing else: every one is aria-hidden and
 * pointer-events-none, so a screen reader never meets them and they can never
 * intercept a tap meant for a control underneath.
 *
 * Restraint is part of the spec. The identity is "colourful does not mean
 * cluttered" — two or three of these per screen, never a confetti storm.
 */

const HIDE = { 'aria-hidden': true as const, focusable: 'false' as const };

/** Soft irregular blob — the shape the whole identity is built on. */
export function Blob({
  color = '#FECA34',
  className = '',
  opacity = 0.18,
}: { color?: string; className?: string; opacity?: number }) {
  return (
    <svg viewBox="0 0 200 200" className={`pointer-events-none ${className}`} {...HIDE}>
      <path
        fill={color}
        opacity={opacity}
        d="M46 -62C60 -50 70 -33 74 -14C78 5 76 26 66 43C56 60 38 73 18 78C-2 83 -24 80 -44 70C-64 60 -82 43 -88 22C-94 1 -88 -24 -74 -43C-60 -62 -38 -75 -16 -78C6 -81 32 -74 46 -62Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}

/** Dashed arc — the curved dotted line that sits under the logo wordmark. */
export function DashedArc({ color = '#FECA34', className = '' }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={`pointer-events-none ${className}`} {...HIDE}>
      <path
        d="M8 14 Q100 66 192 14"
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="2 18"
      />
    </svg>
  );
}

/** Five-point star, the reward mark. */
export function Star({ color = '#FECA34', className = '' }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`pointer-events-none ${className}`} {...HIDE}>
      <path
        fill={color}
        d="M12 2.4l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.6 6.2 20l1.5-6.5-5-4.4 6.6-.6z"
      />
    </svg>
  );
}

/** Four-point sparkle — lighter than a star, for small flourishes. */
export function Sparkle({ color = '#1F67B1', className = '' }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`pointer-events-none ${className}`} {...HIDE}>
      <path fill={color} d="M12 1.5l2.4 8.1 8.1 2.4-8.1 2.4L12 22.5l-2.4-8.1L1.5 12l8.1-2.4z" />
    </svg>
  );
}

/** Radiating sun — taken from the burst behind the logo's "R". */
export function SunRays({ color = '#FECA34', className = '' }: { color?: string; className?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 100 100" className={`pointer-events-none ${className}`} {...HIDE}>
      <circle cx="50" cy="50" r="13" fill="none" stroke={color} strokeWidth="4" />
      <circle cx="50" cy="50" r="4.5" fill={color} />
      {rays.map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="26"
          x2="50"
          y2="18"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
    </svg>
  );
}

/** A scatter of brand dots — the confetti in the logo's negative space. */
export function DotScatter({ className = '' }: { className?: string }) {
  const dots = [
    { cx: 12, cy: 20, r: 4, fill: '#49B87A' },
    { cx: 44, cy: 10, r: 3, fill: '#FECA34' },
    { cx: 72, cy: 26, r: 5, fill: '#1F67B1' },
    { cx: 96, cy: 12, r: 3.5, fill: '#8060B4' },
    { cx: 28, cy: 44, r: 3, fill: '#F45B63' },
    { cx: 86, cy: 48, r: 4, fill: '#FECA34' },
  ];
  return (
    <svg viewBox="0 0 110 60" className={`pointer-events-none ${className}`} {...HIDE}>
      {dots.map((d, i) => (
        <circle key={i} {...d} />
      ))}
    </svg>
  );
}

/** Wavy underline, for putting emphasis under a heading word. */
export function WavyRule({ color = '#F45B63', className = '' }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={`pointer-events-none ${className}`} {...HIDE} preserveAspectRatio="none">
      <path
        d="M2 8 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
