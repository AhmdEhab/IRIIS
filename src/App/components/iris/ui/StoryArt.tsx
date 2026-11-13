import React from 'react';

/**
 * StoryArt — original illustrations for the IRIS story scenes.
 *
 * WHY THIS EXISTS
 * Scenes were previously built from emoji: one large glyph with a few smaller
 * ones dropped at fixed coordinates over a gradient. That reads as a slideshow
 * placeholder rather than a picture — the elements do not share a horizon, a
 * light source, or a drawing style, and the "character" changes shape depending
 * on which font the device happens to render. A child cannot follow a story
 * from that.
 *
 * These are drawn instead: flat vector shapes in the same rounded, soft-palette
 * language as the IRIS companion from Pass 2, so the stories and the rest of
 * Child Mode look like one product.
 *
 * WHY SVG RATHER THAN ARTWORK FILES
 * The same reasoning as the mascot: crisp at any size, no network requests, no
 * third-party imagery and therefore no copyright question, and — most
 * importantly here — a character is ONE component reused across every scene of
 * its story, so Bandaq cannot silently become a different rabbit halfway
 * through. Composition is data (position/scale/flip), not a redraw.
 *
 * CONTENT SAFETY
 * Nothing here is realistic, dark, or threatening: no teeth, no claws, no
 * frightened expressions, no looming shapes. The lion is a round golden face
 * with a soft mane, because a story character for this audience should never
 * be the scary thing in the picture.
 */

const INK = '#3B2A5A'; // same facial ink as the IRIS companion

/* ── characters ─────────────────────────────────────────────────────────── */

/** Bandaq — the same rabbit in every scene of his story. */
export function Bunny({ smile = true }: { smile?: boolean }) {
  return (
    <g>
      {/* ears */}
      <ellipse cx="-9" cy="-40" rx="6" ry="18" fill="#E9E3F5" stroke="#CFC5E8" strokeWidth="2" />
      <ellipse cx="9" cy="-40" rx="6" ry="18" fill="#E9E3F5" stroke="#CFC5E8" strokeWidth="2" />
      <ellipse cx="-9" cy="-40" rx="2.6" ry="11" fill="#F9C9D9" />
      <ellipse cx="9" cy="-40" rx="2.6" ry="11" fill="#F9C9D9" />
      {/* body + head */}
      <ellipse cx="0" cy="22" rx="20" ry="17" fill="#EFEAF9" stroke="#CFC5E8" strokeWidth="2" />
      <circle cx="0" cy="-8" r="20" fill="#F4F0FC" stroke="#CFC5E8" strokeWidth="2" />
      {/* face */}
      <circle cx="-7" cy="-10" r="2.8" fill={INK} />
      <circle cx="7" cy="-10" r="2.8" fill={INK} />
      <circle cx="-6" cy="-11" r="1" fill="#fff" />
      <circle cx="8" cy="-11" r="1" fill="#fff" />
      <ellipse cx="0" cy="-3" rx="3" ry="2.2" fill="#F19AB6" />
      {smile && <path d="M-5 1 q5 4 10 0" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />}
      <ellipse cx="-13" cy="-4" rx="3.4" ry="2.4" fill="#F9C9D9" opacity="0.8" />
      <ellipse cx="13" cy="-4" rx="3.4" ry="2.4" fill="#F9C9D9" opacity="0.8" />
      {/* feet */}
      <ellipse cx="-11" cy="37" rx="7" ry="4.5" fill="#E9E3F5" stroke="#CFC5E8" strokeWidth="2" />
      <ellipse cx="11" cy="37" rx="7" ry="4.5" fill="#E9E3F5" stroke="#CFC5E8" strokeWidth="2" />
    </g>
  );
}

/** Simba — round, golden and gentle. Deliberately not fierce. */
export function Lion() {
  return (
    <g>
      {/* mane: overlapping rounded lobes, no spikes */}
      <g fill="#F5A83C">
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 26} cy={Math.sin(a) * 26 - 4} r="12" />;
        })}
      </g>
      <circle cx="0" cy="-4" r="24" fill="#FBD277" stroke="#E9A93A" strokeWidth="2" />
      {/* body */}
      <ellipse cx="0" cy="30" rx="19" ry="14" fill="#FBD277" stroke="#E9A93A" strokeWidth="2" />
      {/* face */}
      <circle cx="-8" cy="-7" r="3" fill={INK} />
      <circle cx="8" cy="-7" r="3" fill={INK} />
      <circle cx="-7" cy="-8" r="1.1" fill="#fff" />
      <circle cx="9" cy="-8" r="1.1" fill="#fff" />
      <ellipse cx="0" cy="3" rx="9" ry="7" fill="#FDEBC4" />
      <path d="M-3.5 1 h7 l-3.5 3z" fill="#C97B4A" />
      <path d="M-4 7 q4 4 8 0" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Lulu — a little star with a face. `glow` is off by default: a translucent warm disc over a cool
 *  background desaturates into a grey ring, which looked like a rendering
 *  fault on the blue story cover. Night scenes get their sparkle from the
 *  backdrop's own stars instead. */
export function StarChar({ glow = false }: { glow?: boolean }) {
  const pts = Array.from({ length: 10 }).map((_, i) => {
    const r = i % 2 === 0 ? 30 : 13;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  });
  return (
    <g>
      {glow && <circle cx="0" cy="0" r="34" fill="#FDE68A" opacity="0.45" />}
      <polygon points={pts.join(' ')} fill="#FCD34D" stroke="#EAB308" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="-6" cy="-3" r="2.6" fill={INK} />
      <circle cx="6" cy="-3" r="2.6" fill={INK} />
      <circle cx="-5" cy="-4" r="1" fill="#fff" />
      <circle cx="7" cy="-4" r="1" fill="#fff" />
      <path d="M-4 4 q4 4 8 0" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="-12" cy="2" rx="3" ry="2" fill="#F9A8D4" opacity="0.75" />
      <ellipse cx="12" cy="2" rx="3" ry="2" fill="#F9A8D4" opacity="0.75" />
    </g>
  );
}

/* ── props ──────────────────────────────────────────────────────────────── */

export function Carrot({ big = false }: { big?: boolean }) {
  const s = big ? 1.9 : 1;
  return (
    <g transform={`scale(${s})`}>
      <path d="M0 26 L-9 -6 q9 -6 18 0z" fill="#F97316" stroke="#EA7317" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M-5 4 h10 M-6.5 -2 h13" stroke="#FDBA74" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M0 -6 q-5 -12 -12 -12 q4 9 10 12z" fill="#4ADE80" />
      <path d="M0 -6 q5 -12 12 -12 q-4 9 -10 12z" fill="#34D399" />
      <path d="M0 -7 q0 -13 0 -15 q4 8 3 15z" fill="#22C55E" />
    </g>
  );
}

export function Bird() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="12" ry="10" fill="#7DD3FC" stroke="#38BDF8" strokeWidth="1.6" />
      <circle cx="8" cy="-6" r="7" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="1.6" />
      <circle cx="10" cy="-7" r="1.6" fill={INK} />
      <path d="M14 -5 l6 2 -6 2z" fill="#FBBF24" />
      <path d="M-4 -1 q-8 -6 -12 2 q7 4 12 -2z" fill="#38BDF8" />
      <path d="M-11 3 q-7 2 -9 6 q7 1 10 -3z" fill="#0EA5E9" opacity="0.8" />
    </g>
  );
}

export function Nest() {
  return (
    <g>
      <path d="M-22 0 q22 20 44 0 q-6 16 -22 16 q-16 0 -22 -16z" fill="#B98A5A" stroke="#9A6E44" strokeWidth="2" />
      <path d="M-16 4 q16 8 32 0" stroke="#8B6239" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function Rose() {
  return (
    <g>
      <path d="M0 40 v-22" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M0 28 q-11 -3 -13 -10 q10 -1 13 6z" fill="#4ADE80" />
      <circle cx="0" cy="0" r="15" fill="#FB7185" />
      <circle cx="0" cy="0" r="9.5" fill="#F43F5E" />
      <circle cx="0" cy="0" r="4.5" fill="#E11D48" />
    </g>
  );
}

export function Flower({ color = '#F0ABFC' }: { color?: string }) {
  return (
    <g>
      <path d="M0 16 v-8" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return <ellipse key={i} cx={Math.cos(a) * 6} cy={Math.sin(a) * 6 - 2} rx="5" ry="6" fill={color} />;
      })}
      <circle cx="0" cy="-2" r="3.4" fill="#FDE68A" />
    </g>
  );
}

export function Cloud({ opacity = 1 }: { opacity?: number }) {
  return (
    <g opacity={opacity} fill="#fff">
      <circle cx="-14" cy="2" r="12" />
      <circle cx="0" cy="-4" r="15" />
      <circle cx="15" cy="2" r="11" />
      <rect x="-16" y="2" width="33" height="11" rx="5.5" />
    </g>
  );
}

export function Sun() {
  return (
    <g>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <rect
            key={i}
            x="-2" y="-27" width="4" height="9" rx="2"
            fill="#FDE047"
            transform={`rotate(${(a * 180) / Math.PI})`}
          />
        );
      })}
      <circle cx="0" cy="0" r="16" fill="#FDE047" />
    </g>
  );
}

export function Moon() {
  return (
    <g>
      <circle cx="0" cy="0" r="16" fill="#FEF3C7" />
      <circle cx="7" cy="-4" r="13" fill="#C7D2FE" />
    </g>
  );
}

export function Tree() {
  return (
    <g>
      <rect x="-6" y="0" width="12" height="34" rx="5" fill="#A16207" />
      <circle cx="0" cy="-10" r="24" fill="#4ADE80" />
      <circle cx="-16" cy="2" r="16" fill="#34D399" />
      <circle cx="16" cy="2" r="16" fill="#22C55E" />
    </g>
  );
}

export function RainbowArc() {
  const bands = ['#F87171', '#FB923C', '#FDE047', '#4ADE80', '#38BDF8', '#A78BFA'];
  return (
    <g fill="none" strokeLinecap="round">
      {bands.map((c, i) => (
        <path key={c} d={`M${-58 + i * 7} 30 a${58 - i * 7} ${58 - i * 7} 0 0 1 ${(58 - i * 7) * 2} 0`} stroke={c} strokeWidth="7" />
      ))}
    </g>
  );
}

/** A plain coloured blob — used for the "each colour boasted" scene. */
export function ColorBlob({ color = '#F87171' }: { color?: string }) {
  return (
    <g>
      <circle cx="0" cy="0" r="15" fill={color} />
      <circle cx="-4" cy="-5" r="4" fill="#fff" opacity="0.35" />
    </g>
  );
}

/** A small happy face — the crowd in the final rainbow scene. */
export function HappyFace() {
  return (
    <g>
      <circle cx="0" cy="0" r="14" fill="#FDE68A" stroke="#F5C542" strokeWidth="2" />
      <circle cx="-5" cy="-3" r="2.2" fill={INK} />
      <circle cx="5" cy="-3" r="2.2" fill={INK} />
      <path d="M-5 4 q5 5 10 0" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  );
}

export function Sparkle({ color = '#FDE047' }: { color?: string }) {
  return <path d="M0 -10 l2.6 7.4 7.4 2.6 -7.4 2.6 -2.6 7.4 -2.6 -7.4 -7.4 -2.6 7.4 -2.6z" fill={color} />;
}

/* ── the stage ──────────────────────────────────────────────────────────── */

export type Backdrop = 'meadow' | 'forest' | 'night' | 'garden' | 'rainy' | 'sunny';

const BACKDROPS: Record<Backdrop, { sky: [string, string]; ground?: string }> = {
  meadow: { sky: ['#BFE9FF', '#E8F8E0'], ground: '#86E08D' },
  forest: { sky: ['#CFEFFF', '#E6F8EA'], ground: '#6FD47F' },
  night: { sky: ['#4C51BF', '#8B7FD4'], ground: '#5B4B9E' },
  garden: { sky: ['#FFE4F1', '#E9F7FF'], ground: '#8FE39B' },
  rainy: { sky: ['#C3CFE2', '#E4ECF7'], ground: '#9BD9A5' },
  sunny: { sky: ['#FFE9B0', '#FFF7E3'], ground: '#8FE39B' },
};

/**
 * One placed element inside a scene. Coordinates are in the 400x250 viewBox,
 * so a scene is described as data and the same character component is reused
 * everywhere it appears.
 */
export interface Placement {
  el: React.ReactNode;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  /** Marks the element a child is invited to tap, for the one interactive scene. */
  tapId?: string;
}

export function SceneStage({
  backdrop,
  items,
  onTap,
  tappedId,
  className = '',
}: {
  backdrop: Backdrop;
  items: Placement[];
  onTap?: (id: string) => void;
  tappedId?: string | null;
  className?: string;
}) {
  const b = BACKDROPS[backdrop];
  const uid = React.useId();
  const skyId = `sky-${uid}`;

  return (
    <svg viewBox="0 0 400 250" className={className} role="presentation" focusable="false">
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={b.sky[0]} />
          <stop offset="100%" stopColor={b.sky[1]} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect x="0" y="0" width="400" height="250" rx="26" />
        </clipPath>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <rect x="0" y="0" width="400" height="250" fill={`url(#${skyId})`} />
        {b.ground && (
          // A single gentle hill gives every scene the same horizon, which is
          // what makes a set of pictures read as one place.
          <path d={`M0 250 L0 196 q100 -26 200 -6 q100 20 200 -4 L400 250z`} fill={b.ground} />
        )}
        {backdrop === 'night' &&
          [[40, 40], [110, 26], [330, 36], [270, 60], [180, 30], [360, 90]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 2.4 : 1.6} fill="#FFF7CC" opacity="0.9" />
          ))}

        {items.map((it, i) => {
          const isTappable = !!it.tapId && !!onTap;
          const wasTapped = !!it.tapId && tappedId === it.tapId;
          const content = (
            <g
              transform={`translate(${it.x} ${it.y}) scale(${(it.scale ?? 1) * (it.flip ? -1 : 1)} ${it.scale ?? 1})`}
            >
              {it.el}
            </g>
          );
          if (!isTappable) return <React.Fragment key={i}>{content}</React.Fragment>;
          return (
            <g
              key={i}
              onClick={() => onTap!(it.tapId!)}
              style={{ cursor: 'pointer' }}
              className={wasTapped ? 'opacity-100' : 'opacity-100'}
            >
              {/* A soft ring marks what can be tapped — a visible affordance
                  rather than expecting the child to hunt for it. */}
              <circle
                cx={it.x}
                cy={it.y}
                r={34 * (it.scale ?? 1)}
                fill="none"
                stroke={wasTapped ? '#22C55E' : '#FFFFFF'}
                strokeWidth="4"
                strokeDasharray={wasTapped ? undefined : '7 7'}
                opacity={wasTapped ? 1 : 0.9}
              />
              {content}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
