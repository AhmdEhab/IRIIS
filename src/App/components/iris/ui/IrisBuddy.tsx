import React from 'react';

/**
 * IrisBuddy — the IRIS learning companion. An ORIGINAL character.
 *
 * DRAWN FROM THE SUPPLIED AVATAR REFERENCES
 * The two reference images share a clear DNA, and this is built to it:
 *   - a soft cream plush body, head and torso as one rounded form
 *   - a crown of petals in the IRIS brand colours, not a single hue
 *   - large dark-brown eyes with catchlights, rosy cheeks, an open smile
 *   - a heart-shaped window on the belly holding small bright sparkles
 *   - short arms and feet
 * The previous version was a flat violet flower, which matched neither
 * reference and used a colour that is not in the brand palette at all.
 *
 * COLOURS COME FROM BRAND_IDENTITY.md §2
 *   yellow #FECA34 · blue #1F67B1 · coral #F45B63 · green #49B87A
 *   purple #8060B4 · warm white #FEF6EA
 * The petals cycle through five of them, so the character carries the whole
 * identity rather than one colour from it.
 *
 * WHY IT IS DRAWN IN CODE RATHER THAN SHIPPED AS ARTWORK
 * Being SVG means: it is crisp at 32px in a header and at 200px on a welcome
 * screen; expressions are real states rather than nine separate image files
 * that could drift apart; it costs no network request; and there is no
 * third-party artwork involved, so no copyright question arises.
 *
 * EXPRESSIONS ARE NEVER NEGATIVE
 * There is deliberately no sad, angry or disappointed state. The two states
 * that follow a wrong answer — `gentle` and `tryAgain` — are warm and
 * attentive. A companion that looked let down by a child would be a
 * punishment mechanic wearing a friendly costume.
 */

export type BuddyMood =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'encourage'
  | 'happy'
  | 'celebrate'
  | 'gentle'
  | 'success'
  | 'tryAgain';

/** Brand palette, straight from the identity pack. */
const BRAND = {
  yellow: '#FECA34',
  blue: '#1F67B1',
  coral: '#F45B63',
  green: '#49B87A',
  purple: '#8060B4',
  cream: '#FEF6EA',
} as const;

/** Warm dark brown for features — softer than black, as in the references. */
const INK = '#4A3728';
const OUTLINE = '#E5CEA6';

/** Moods where an arm is raised: waving, cheering, or beckoning "come on". */
const ARM_UP = new Set<BuddyMood>(['encourage', 'celebrate', 'success', 'tryAgain']);

export function IrisBuddy({
  mood = 'idle',
  className = '',
  title,
}: {
  mood?: BuddyMood;
  className?: string;
  /** Accessible name. Omit for decorative use beside text that already says it. */
  title?: string;
}) {
  // Body and petals stay constant so the character never looks like a
  // different creature; only the FACE and a small accessory change.
  const uid = React.useId();
  const bodyGrad = `irisBody-${uid}`;
  const heartGrad = `irisHeart-${uid}`;

  const eyes = () => {
    switch (mood) {
      case 'happy':
      case 'celebrate':
      case 'success':
        // Upturned arcs — "smiling eyes" that read as delight at any size.
        return (
          <>
            <path d="M41 51 q7 -9 14 0" stroke={INK} strokeWidth="4.6" strokeLinecap="round" fill="none" />
            <path d="M65 51 q7 -9 14 0" stroke={INK} strokeWidth="4.6" strokeLinecap="round" fill="none" />
          </>
        );
      case 'thinking':
        // BOTH eyes look up and to one side. An earlier version narrowed only
        // the right eye, which read as a wink — a wink is a joke, not thought.
        return (
          <>
            <ellipse cx="47" cy="49" rx="6.6" ry="8" fill={INK} />
            <circle cx="45.4" cy="45.6" r="2.4" fill="#fff" />
            <ellipse cx="73" cy="49" rx="6.6" ry="8" fill={INK} />
            <circle cx="71.4" cy="45.6" r="2.4" fill="#fff" />
          </>
        );
      case 'listening':
        // Wide and attentive — the child is being heard.
        return (
          <>
            <ellipse cx="47" cy="50" rx="8.2" ry="9.6" fill={INK} />
            <circle cx="49.8" cy="46.2" r="3.1" fill="#fff" />
            <circle cx="45.4" cy="53" r="1.4" fill="#fff" opacity="0.7" />
            <ellipse cx="73" cy="50" rx="8.2" ry="9.6" fill={INK} />
            <circle cx="75.8" cy="46.2" r="3.1" fill="#fff" />
            <circle cx="71.4" cy="53" r="1.4" fill="#fff" opacity="0.7" />
          </>
        );
      case 'encourage':
      case 'tryAgain':
      case 'gentle':
        // Slightly larger, softer eyes — "I'm with you, have another go."
        // Deliberately distinct from idle so the child can tell IRIS noticed,
        // with no hint of disappointment anywhere in the shape.
        return (
          <>
            <ellipse cx="47" cy="50" rx="7.6" ry="9" fill={INK} />
            <circle cx="49.4" cy="46.6" r="2.8" fill="#fff" />
            <ellipse cx="73" cy="50" rx="7.6" ry="9" fill={INK} />
            <circle cx="75.4" cy="46.6" r="2.8" fill="#fff" />
          </>
        );
      case 'idle':
      default:
        // Wide, calm, attentive. Highlights give life without extra detail.
        return (
          <>
            <ellipse cx="47" cy="50" rx="7" ry="8.4" fill={INK} />
            <circle cx="49.2" cy="46.8" r="2.6" fill="#fff" />
            <ellipse cx="73" cy="50" rx="7" ry="8.4" fill={INK} />
            <circle cx="75.2" cy="46.8" r="2.6" fill="#fff" />
          </>
        );
    }
  };

  const mouth = () => {
    switch (mood) {
      case 'celebrate':
        // Open and joyful — but small and soft-cornered, never a shout.
        return (
          <>
            <path d="M51 62 q9 13 18 0 q-9 5 -18 0z" fill={INK} />
            <path d="M56 66.5 q4 4 8 0 q-4 1.6 -8 0z" fill="#E8909A" />
          </>
        );
      case 'happy':
      case 'success':
        return (
          <>
            <path d="M52 62 q8 10 16 0 q-8 4 -16 0z" fill={INK} />
            <path d="M57 65.5 q3 3 6 0 q-3 1.2 -6 0z" fill="#E8909A" />
          </>
        );
      case 'thinking':
        // A small, thoughtful mouth.
        return <path d="M55 63 q5 3 10 0" stroke={INK} strokeWidth="4.2" strokeLinecap="round" fill="none" />;
      case 'listening':
        // Slightly open, as though about to answer.
        return <ellipse cx="60" cy="63.5" rx="4.6" ry="5" fill={INK} />;
      case 'gentle':
        // Soft, level, kind — acknowledges without any downturn.
        return <path d="M54 63 q6 5 12 0" stroke={INK} strokeWidth="4.2" strokeLinecap="round" fill="none" />;
      case 'encourage':
      case 'tryAgain':
        // A warmer, wider smile than idle — encouragement you can see.
        return <path d="M50 62 q10 9 20 0" stroke={INK} strokeWidth="4.4" strokeLinecap="round" fill="none" />;
      case 'idle':
      default:
        return <path d="M53 62 q7 7 14 0" stroke={INK} strokeWidth="4.4" strokeLinecap="round" fill="none" />;
    }
  };

  const armUp = ARM_UP.has(mood);

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={bodyGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFCF5" />
          <stop offset="100%" stopColor="#F5E4C6" />
        </linearGradient>
        <linearGradient id={heartGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8F1FA" />
        </linearGradient>
      </defs>

      {/* Petal crown — five brand colours, so the character carries the whole
          identity rather than one colour from it. Drawn behind the body so the
          petal bases tuck under the head. */}
      <g stroke={OUTLINE} strokeWidth="1.6">
        <ellipse cx="26.4" cy="35" rx="9.2" ry="14" fill={BRAND.purple} transform="rotate(-68 26.4 35)" />
        <ellipse cx="39" cy="18.6" rx="10" ry="15.4" fill={BRAND.blue} transform="rotate(-34 39 18.6)" />
        <ellipse cx="60" cy="12.6" rx="10.4" ry="16" fill={BRAND.coral} />
        <ellipse cx="81" cy="18.6" rx="10" ry="15.4" fill={BRAND.green} transform="rotate(34 81 18.6)" />
        <ellipse cx="93.6" cy="35" rx="9.2" ry="14" fill={BRAND.yellow} transform="rotate(68 93.6 35)" />
      </g>

      {/* Feet — behind the body so they read as peeking out below. */}
      <g fill="#F2DEBC" stroke={OUTLINE} strokeWidth="2">
        <ellipse cx="47" cy="105" rx="9" ry="5.5" />
        <ellipse cx="73" cy="105" rx="9" ry="5.5" />
      </g>

      {/* Arms. The right arm lifts for the encouraging, celebrating, success
          and try-again states — the wave in the second reference image. */}
      <g fill="#F7E9CF" stroke={OUTLINE} strokeWidth="2">
        <ellipse cx="25" cy="78" rx="7" ry="10.5" transform="rotate(-22 25 78)" />
        {armUp ? (
          <ellipse cx="99" cy="57" rx="7" ry="10.5" transform="rotate(42 99 57)" />
        ) : (
          <ellipse cx="95" cy="78" rx="7" ry="10.5" transform="rotate(22 95 78)" />
        )}
      </g>

      {/* Body — head and torso as one soft plush form, as in both references. */}
      <path
        d="M60 20 C78 20 93 33 93 51 C93 61 89 69 84 75 C89 80 90 85 90 91
           C90 100 76 104 60 104 C44 104 30 100 30 91 C30 85 31 80 36 75
           C31 69 27 61 27 51 C27 33 42 20 60 20 Z"
        fill={`url(#${bodyGrad})`}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />

      {/* Cheeks: warmth without adding visual complexity. */}
      <ellipse cx="35.5" cy="58" rx="6.4" ry="4.4" fill="#F9A8A8" opacity="0.75" />
      <ellipse cx="84.5" cy="58" rx="6.4" ry="4.4" fill="#F9A8A8" opacity="0.75" />

      {eyes()}
      {mouth()}

      {/* Heart window — the detail both references share. A little bright
          world carried on the character's front. */}
      <path
        d="M60 97 C51 90 46 85.5 46 81 C46 77.8 48.6 75.2 51.8 75.2
           C54.4 75.2 56.6 76.7 60 79.8 C63.4 76.7 65.6 75.2 68.2 75.2
           C71.4 75.2 74 77.8 74 81 C74 85.5 69 90 60 97 Z"
        fill={`url(#${heartGrad})`}
        stroke="#DCE7F2"
        strokeWidth="1.8"
      />
      <g>
        <circle cx="54.5" cy="81.5" r="2.2" fill={BRAND.yellow} />
        <path d="M65.5 79 l1.3 2.7 2.7 1.3 -2.7 1.3 -1.3 2.7 -1.3 -2.7 -2.7 -1.3 2.7 -1.3z" fill={BRAND.blue} />
        <path d="M60 89.5 c-2 -1.6 -3.2 -2.6 -3.2 -3.7 0 -0.8 0.6 -1.4 1.4 -1.4 0.6 0 1.2 0.35 1.8 1.1 0.6 -0.75 1.2 -1.1 1.8 -1.1 0.8 0 1.4 0.6 1.4 1.4 0 1.1 -1.2 2.1 -3.2 3.7z" fill={BRAND.coral} />
        <circle cx="52.8" cy="86.5" r="1.3" fill={BRAND.green} />
        <circle cx="67" cy="87.5" r="1.3" fill={BRAND.purple} />
      </g>

      {/* Per-mood accessories. Each is small and sits clear of the face. */}
      {mood === 'thinking' && (
        <g fill={BRAND.blue} opacity="0.85">
          <circle cx="96" cy="30" r="2.2" />
          <circle cx="103" cy="23" r="3" />
          <circle cx="111" cy="15" r="3.8" />
        </g>
      )}

      {mood === 'listening' && (
        <g stroke={BRAND.blue} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.8">
          <path d="M101 46 q5 6 0 12" />
          <path d="M108 42 q8 10 0 20" />
        </g>
      )}

      {(mood === 'celebrate' || mood === 'success') && (
        <g fill={BRAND.yellow}>
          <path d="M18 24 l2.6 5.6 5.6 2.6 -5.6 2.6 -2.6 5.6 -2.6 -5.6 -5.6 -2.6 5.6 -2.6z" />
          {mood === 'celebrate' && (
            <path d="M104 28 l2 4.3 4.3 2 -4.3 2 -2 4.3 -2 -4.3 -4.3 -2 4.3 -2z" />
          )}
        </g>
      )}
    </svg>
  );
}
