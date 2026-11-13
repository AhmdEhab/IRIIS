import React from 'react';

/**
 * The IRIS drawn icon set.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * Before Phase 10 the product used emoji for its interface: 🌱 for the
 * learning snapshot, 📊 for progress, 🦊 for the child's avatar, 🎲⭐🚀 for
 * the adventure steps, 👪 for parent mode. Emoji are rendered by the operating
 * system, so IRIS looked like a different product on Windows, iOS, Android and
 * Linux — and none of those four looked like the brochure. `PlayfulBackground`
 * had already solved this for the background doodles by drawing them; the fix
 * had never reached the foreground.
 *
 * ── THE DRAWING RULES ─────────────────────────────────────────────────────
 * Every icon in this file obeys the same four rules, which is what makes forty
 * separate drawings read as one set:
 *   1. 24×24 viewBox, and the artwork keeps a ~2px margin inside it.
 *   2. Strokes are 2 units, `round` caps and `round` joins. Nothing in the
 *      IRIS identity has a mitred corner.
 *   3. Two tones only. `currentColor` draws the line; `tone` fills the soft
 *      shape behind it. That is the brochure's own icon treatment — a coloured
 *      wash with a dark line drawn over it.
 *   4. No icon carries meaning on its own. Every render site pairs it with a
 *      text label, so an icon that is misread costs nothing.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ─────────────────────────────────────────
 * Emoji used as CONTENT stay as emoji: the apples and lions inside Memory
 * Game, the animals in the animal activity, the story characters. Those are
 * the material the child is working with, not interface furniture, and
 * redrawing forty animals would be a different project with no brand payoff.
 */

export type IconName =
  // navigation and controls
  | 'back' | 'forward' | 'home' | 'close' | 'more' | 'settings' | 'logout'
  | 'check' | 'plus' | 'play' | 'pause' | 'repeat' | 'send' | 'search'
  | 'sound-on' | 'sound-off' | 'music' | 'lock' | 'info' | 'alert'
  // people
  | 'child' | 'parent' | 'family' | 'specialist'
  // parent sections
  | 'sprout' | 'chart' | 'house' | 'chat'
  // child activities
  | 'star' | 'heart' | 'rocket' | 'map' | 'dice' | 'palette' | 'book'
  | 'memory' | 'balloon' | 'shadow' | 'pencil' | 'letters' | 'numbers'
  | 'colors' | 'shapes' | 'fruit' | 'animal' | 'vehicle' | 'body'
  | 'emotion' | 'life-skills' | 'song' | 'game' | 'gift' | 'puzzle';

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** The soft coloured shape that sits behind the line work. */
const wash = (tone: string) => ({ fill: tone, stroke: 'none' });

/**
 * Each entry receives the tone colour and returns the artwork. Kept as a map
 * rather than forty exported components so a screen can pick an icon by name
 * from data (an activity list, a section config) without a switch statement.
 */
const ART: Record<IconName, (t: string) => React.ReactNode> = {
  /* ── navigation and controls ─────────────────────────────────────────── */
  back: () => <><path {...S} d="M15 5 8 12l7 7" /></>,
  forward: () => <><path {...S} d="m9 5 7 7-7 7" /></>,
  home: (t) => <><path {...wash(t)} d="M12 3.2 21 11v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V11z" /><path {...S} d="M3.4 11.4 12 4l8.6 7.4M5.5 11v9.5h13V11" /><path {...S} d="M9.8 20.5v-5.2h4.4v5.2" /></>,
  close: () => <><path {...S} d="M6 6l12 12M18 6L6 18" /></>,
  more: () => <><circle cx="5" cy="12" r="1.9" fill="currentColor" /><circle cx="12" cy="12" r="1.9" fill="currentColor" /><circle cx="19" cy="12" r="1.9" fill="currentColor" /></>,
  settings: (t) => <><circle cx="12" cy="12" r="8.2" {...wash(t)} /><circle cx="12" cy="12" r="3" {...S} /><path {...S} d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8" /></>,
  logout: () => <><path {...S} d="M14 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8" /><path {...S} d="m17 8 4 4-4 4M21 12h-9" /></>,
  check: () => <><path {...S} strokeWidth={2.6} d="m5 12.8 4.6 4.4L19 6.6" /></>,
  plus: () => <><path {...S} d="M12 5v14M5 12h14" /></>,
  play: (t) => <><circle cx="12" cy="12" r="9" {...wash(t)} /><path d="M10 8.2 16.4 12 10 15.8z" fill="currentColor" /></>,
  pause: (t) => <><circle cx="12" cy="12" r="9" {...wash(t)} /><path {...S} strokeWidth={2.6} d="M10 8.6v6.8M14 8.6v6.8" /></>,
  repeat: () => <><path {...S} d="M4 11a8 8 0 0 1 13.3-6M20 13a8 8 0 0 1-13.3 6" /><path {...S} d="M17 2.6V5.4h-2.8M7 21.4v-2.8h2.8" /></>,
  send: (t) => <><path {...wash(t)} d="M3.4 11.2 20 4.4l-6.6 16.4-2.3-6.7z" /><path {...S} d="M3.4 11.2 20 4.4l-6.6 16.4-2.3-6.7zM11.1 14.1 20 4.4" /></>,
  search: (t) => <><circle cx="10.7" cy="10.7" r="6.2" {...wash(t)} /><circle cx="10.7" cy="10.7" r="6.2" {...S} /><path {...S} d="m15.4 15.4 4.2 4.2" /></>,
  'sound-on': (t) => <><path {...wash(t)} d="M4 9.4h3.4L12 5.6v12.8L7.4 14.6H4z" /><path {...S} d="M4 9.4h3.4L12 5.6v12.8L7.4 14.6H4z" /><path {...S} d="M15.4 9.6a3.6 3.6 0 0 1 0 4.8M17.9 7.2a7 7 0 0 1 0 9.6" /></>,
  'sound-off': (t) => <><path {...wash(t)} d="M4 9.4h3.4L12 5.6v12.8L7.4 14.6H4z" /><path {...S} d="M4 9.4h3.4L12 5.6v12.8L7.4 14.6H4z" /><path {...S} d="m16 9.6 4.4 4.8M20.4 9.6 16 14.4" /></>,
  music: (t) => <><circle cx="7" cy="17.4" r="2.8" {...wash(t)} /><circle cx="17.4" cy="15.2" r="2.8" {...wash(t)} /><path {...S} d="M9.8 17.4V6.6l10.4-2.2v10.8" /><circle cx="7" cy="17.4" r="2.8" {...S} /><circle cx="17.4" cy="15.2" r="2.8" {...S} /></>,
  lock: (t) => <><rect x="4.4" y="10.4" width="15.2" height="10.2" rx="2.6" {...wash(t)} /><rect x="4.4" y="10.4" width="15.2" height="10.2" rx="2.6" {...S} /><path {...S} d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" /></>,
  info: (t) => <><circle cx="12" cy="12" r="9" {...wash(t)} /><circle cx="12" cy="12" r="9" {...S} /><path {...S} d="M12 11v5.4" /><circle cx="12" cy="7.8" r="1.2" fill="currentColor" /></>,
  alert: (t) => <><path {...wash(t)} d="M12 3.6 21.4 20H2.6z" /><path {...S} d="M12 3.6 21.4 20H2.6z" /><path {...S} d="M12 9.6v4.6" /><circle cx="12" cy="17" r="1.15" fill="currentColor" /></>,

  /* ── people ──────────────────────────────────────────────────────────── */
  /* A child, not an insect. The first draft added two little strokes above the
     head meant to read as a hair tuft; at 24px they read as antennae and the
     landing screen's Child Mode card looked like it offered a bug. The tuft is
     now a single curl on the crown, drawn inside the head's silhouette. */
  child: (t) => <><circle cx="12" cy="8.2" r="4.4" {...wash(t)} /><circle cx="12" cy="8.2" r="4.4" {...S} /><path {...S} d="M4.8 20.6c0-3.8 3.2-6.2 7.2-6.2s7.2 2.4 7.2 6.2" /><path {...S} d="M12 3.9c.9-1 2.3-.9 2.7.2" /><circle cx="10.3" cy="7.9" r="0.95" fill="currentColor" /><circle cx="13.7" cy="7.9" r="0.95" fill="currentColor" /></>,
  parent: (t) => <><circle cx="12" cy="7.4" r="3.8" {...wash(t)} /><circle cx="12" cy="7.4" r="3.8" {...S} /><path {...S} d="M5 20.6c0-3.9 3.1-6.4 7-6.4s7 2.5 7 6.4" /></>,
  family: (t) => <><circle cx="7.6" cy="7.6" r="3.2" {...wash(t)} /><circle cx="16.6" cy="8.4" r="2.6" {...wash(t)} /><circle cx="7.6" cy="7.6" r="3.2" {...S} /><circle cx="16.6" cy="8.4" r="2.6" {...S} /><path {...S} d="M2.6 20.4c0-3.3 2.3-5.6 5-5.6s5 2.3 5 5.6M14 20.4c0-2.8 1.6-4.8 3.6-4.8s3.8 1.7 3.8 4.6" /></>,
  /* A stethoscope. The first attempt drew only the tubing and rendered as a
     bare "U" at 24px — a shape with no meaning. It now has the two earpieces
     and the chest piece, which is what makes it read. */
  specialist: (t) => <><circle cx="17.4" cy="16.6" r="3.4" {...wash(t)} /><path {...S} d="M6.2 3.6v6.2a4.6 4.6 0 0 0 9.2 0V3.6" /><path {...S} d="M4.6 3.6h3.2M13.8 3.6h3.2" /><path {...S} d="M10.8 14.4v-.2" /><path {...S} d="M10.8 14.4a4.6 4.6 0 0 0 4.6 4.6" /><circle cx="17.4" cy="16.6" r="2.6" {...S} /><path {...S} d="M17.4 14v-2.4" /></>,

  /* ── parent sections ─────────────────────────────────────────────────── */
  sprout: (t) => <><path {...wash(t)} d="M12 20.4c-4.2 0-7.4-2.6-7.4-6.4 4.2 0 7.4 2.6 7.4 6.4z" /><path {...wash(t)} d="M12 20.4c0-4.2 3.2-7.4 7.4-7.4 0 4.2-3.2 7.4-7.4 7.4z" /><path {...S} d="M12 21V11.6" /><path {...S} d="M12 15.4c-4 0-7-2.4-7-6 4 0 7 2.4 7 6z" /><path {...S} d="M12 13.6c0-4 3-7 7-7 0 4-3 7-7 7z" /></>,
  chart: (t) => <><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.4" {...wash(t)} /><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.4" {...S} /><path {...S} d="M8.2 16.2v-3.6M12 16.2V8.4M15.8 16.2v-5.6" /></>,
  house: (t) => <><path {...wash(t)} d="M12 3.4 21 11v9.6H3V11z" /><path {...S} d="M3 11.4 12 4l9 7.4M5.4 11.2v9.4h13.2v-9.4" /><path {...S} d="M10.2 20.6V15h3.6v5.6" /><path {...S} d="M16.4 5.4h2.2v2.6" /></>,
  chat: (t) => <><path {...wash(t)} d="M4 5.6h16a1 1 0 0 1 1 1v8.6a1 1 0 0 1-1 1h-8.4l-4.4 3.6v-3.6H4a1 1 0 0 1-1-1V6.6a1 1 0 0 1 1-1z" /><path {...S} d="M4 5.6h16a1 1 0 0 1 1 1v8.6a1 1 0 0 1-1 1h-8.4l-4.4 3.6v-3.6H4a1 1 0 0 1-1-1V6.6a1 1 0 0 1 1-1z" /><circle cx="8.6" cy="11" r="1.15" fill="currentColor" /><circle cx="12" cy="11" r="1.15" fill="currentColor" /><circle cx="15.4" cy="11" r="1.15" fill="currentColor" /></>,

  /* ── child activities ────────────────────────────────────────────────── */
  star: (t) => <><path {...wash(t)} d="m12 2.6 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.4 5.9 21l1.5-6.8L2.2 9.6l6.9-.7z" /><path {...S} d="m12 2.6 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.4 5.9 21l1.5-6.8L2.2 9.6l6.9-.7z" /></>,
  heart: (t) => <><path {...wash(t)} d="M12 20.6 4.4 13.2a4.7 4.7 0 0 1 6.6-6.7l1 1 1-1a4.7 4.7 0 0 1 6.6 6.7z" /><path {...S} d="M12 20.6 4.4 13.2a4.7 4.7 0 0 1 6.6-6.7l1 1 1-1a4.7 4.7 0 0 1 6.6 6.7z" /></>,
  rocket: (t) => <><path {...wash(t)} d="M12 2.6c3.6 2.7 5.2 6.5 5.2 10.2l-2.6 3.4H9.4L6.8 12.8C6.8 9.1 8.4 5.3 12 2.6z" /><path {...S} d="M12 2.6c3.6 2.7 5.2 6.5 5.2 10.2l-2.6 3.4H9.4L6.8 12.8C6.8 9.1 8.4 5.3 12 2.6z" /><circle cx="12" cy="9.6" r="2" {...S} /><path {...S} d="M9.4 16.2c-.8 1.6-1 3.3-.6 5.2 1.6-.6 2.7-1.5 3.2-2.6M14.6 16.2c.8 1.6 1 3.3.6 5.2-1.6-.6-2.7-1.5-3.2-2.6" /></>,
  map: (t) => <><path {...wash(t)} d="m3.4 6.4 5.6-2.2 6 2.2 5.6-2.2v13.4l-5.6 2.2-6-2.2-5.6 2.2z" /><path {...S} d="m3.4 6.4 5.6-2.2 6 2.2 5.6-2.2v13.4l-5.6 2.2-6-2.2-5.6 2.2z" /><path {...S} d="M9 4.2v13.4M15 6.4v13.4" /></>,
  dice: (t) => <><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4" {...wash(t)} /><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4" {...S} /><circle cx="8.4" cy="8.4" r="1.3" fill="currentColor" /><circle cx="15.6" cy="15.6" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /></>,
  palette: (t) => <><path {...wash(t)} d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.4 0 2-.9 2-1.8s-.7-1.5-.7-2.3c0-.8.6-1.5 1.5-1.5h1.8a4 4 0 0 0 4-4c0-4.2-3.9-7.6-8.6-7.6z" /><path {...S} d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.4 0 2-.9 2-1.8s-.7-1.5-.7-2.3c0-.8.6-1.5 1.5-1.5h1.8a4 4 0 0 0 4-4c0-4.2-3.9-7.6-8.6-7.6z" /><circle cx="7.6" cy="11.4" r="1.2" fill="currentColor" /><circle cx="10.4" cy="7.4" r="1.2" fill="currentColor" /><circle cx="15.2" cy="8.2" r="1.2" fill="currentColor" /></>,
  book: (t) => <><path {...wash(t)} d="M4 4.6h5.6c1.4 0 2.4.9 2.4 2v12.8c0-1-1-1.8-2.4-1.8H4zM20 4.6h-5.6c-1.4 0-2.4.9-2.4 2v12.8c0-1 1-1.8 2.4-1.8H20z" /><path {...S} d="M4 4.6h5.6c1.4 0 2.4.9 2.4 2v12.8c0-1-1-1.8-2.4-1.8H4zM20 4.6h-5.6c-1.4 0-2.4.9-2.4 2v12.8c0-1 1-1.8 2.4-1.8H20z" /></>,
  memory: (t) => <><rect x="3" y="4.4" width="8" height="10.4" rx="2.2" {...wash(t)} /><rect x="3" y="4.4" width="8" height="10.4" rx="2.2" {...S} /><rect x="12.4" y="9.2" width="8" height="10.4" rx="2.2" {...wash(t)} /><rect x="12.4" y="9.2" width="8" height="10.4" rx="2.2" {...S} /><path {...S} d="M6 9.6h2M15.4 14.4h2" /></>,
  balloon: (t) => <><path {...wash(t)} d="M12 3.2c3 0 5.2 2.5 5.2 5.8S15 15.8 12 15.8 6.8 12.3 6.8 9 9 3.2 12 3.2z" /><path {...S} d="M12 3.2c3 0 5.2 2.5 5.2 5.8S15 15.8 12 15.8 6.8 12.3 6.8 9 9 3.2 12 3.2z" /><path {...S} d="M12 15.8v1.4M12 17.2c-1.4 1-1.4 2.6 0 3.6" /></>,
  shadow: (t) => <><circle cx="9.4" cy="9.4" r="5.4" {...wash(t)} /><circle cx="9.4" cy="9.4" r="5.4" {...S} /><path {...S} strokeDasharray="3 3" d="M14.6 14.6a5.4 5.4 0 1 0-5.2-5.2" /><ellipse cx="14" cy="19" rx="6" ry="1.8" {...wash(t)} /></>,
  pencil: (t) => <><path {...wash(t)} d="M4 20 5.2 15.4 16.4 4.2l3.4 3.4L8.6 18.8z" /><path {...S} d="M4 20 5.2 15.4 16.4 4.2l3.4 3.4L8.6 18.8z" /><path {...S} d="m14.6 6 3.4 3.4" /></>,
  letters: (t) => <><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4" {...wash(t)} /><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4" {...S} /><path {...S} d="M8 16.4 11.2 7.6l3.2 8.8M9.1 13.6h4.2" /></>,
  numbers: (t) => <><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4" {...wash(t)} /><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4" {...S} /><path {...S} d="M9.4 9.6 11.6 8v8.4M11.6 16.4h2.6" /></>,
  colors: (t) => <><circle cx="9" cy="9.6" r="5" {...wash(t)} /><circle cx="9" cy="9.6" r="5" {...S} /><circle cx="15" cy="9.6" r="5" {...S} /><circle cx="12" cy="15" r="5" {...S} /></>,
  shapes: (t) => <><circle cx="7.4" cy="7.4" r="4" {...wash(t)} /><circle cx="7.4" cy="7.4" r="4" {...S} /><rect x="12.6" y="12.6" width="8" height="8" rx="1.8" {...S} /><path {...S} d="M16.6 3.4 20.6 10h-8z" /></>,
  fruit: (t) => <><path {...wash(t)} d="M12 6.8c2.8-2 6.6-.4 6.6 4 0 4.4-3 9.8-6.6 9.8s-6.6-5.4-6.6-9.8c0-4.4 3.8-6 6.6-4z" /><path {...S} d="M12 6.8c2.8-2 6.6-.4 6.6 4 0 4.4-3 9.8-6.6 9.8s-6.6-5.4-6.6-9.8c0-4.4 3.8-6 6.6-4z" /><path {...S} d="M12 6.6V3.6M12 4.4c1.6-1.4 3.2-1.2 4.2-.6" /></>,
  animal: (t) => <><path {...wash(t)} d="M12 8.4c3.6 0 6.2 2.6 6.2 5.8s-2.6 5.6-6.2 5.6-6.2-2.4-6.2-5.6S8.4 8.4 12 8.4z" /><path {...S} d="M12 8.4c3.6 0 6.2 2.6 6.2 5.8s-2.6 5.6-6.2 5.6-6.2-2.4-6.2-5.6S8.4 8.4 12 8.4z" /><path {...S} d="m7.6 9.2-2-4.6 4.6 2M16.4 9.2l2-4.6-4.6 2" /><circle cx="10" cy="13.4" r="1.1" fill="currentColor" /><circle cx="14" cy="13.4" r="1.1" fill="currentColor" /><path {...S} d="M10.6 16.6a2 2 0 0 0 2.8 0" /></>,
  vehicle: (t) => <><path {...wash(t)} d="M3.6 15.4V12l2.2-4.6h12.4L20.4 12v3.4z" /><path {...S} d="M3.6 15.4V12l2.2-4.6h12.4L20.4 12v3.4z" /><path {...S} d="M3.6 12h16.8" /><circle cx="7.4" cy="17.4" r="2.2" {...S} /><circle cx="16.6" cy="17.4" r="2.2" {...S} /></>,
  body: (t) => <><circle cx="12" cy="5.4" r="2.8" {...wash(t)} /><circle cx="12" cy="5.4" r="2.8" {...S} /><path {...S} d="M12 8.4v7M12 10.4 7.4 13M12 10.4l4.6 2.6M12 15.4l-2.8 5.2M12 15.4l2.8 5.2" /></>,
  emotion: (t) => <><circle cx="12" cy="12" r="8.6" {...wash(t)} /><circle cx="12" cy="12" r="8.6" {...S} /><circle cx="9.2" cy="10.2" r="1.2" fill="currentColor" /><circle cx="14.8" cy="10.2" r="1.2" fill="currentColor" /><path {...S} d="M8.4 14.4a4.6 4.6 0 0 0 7.2 0" /></>,
  'life-skills': (t) => <><path {...wash(t)} d="M6.4 9.4h11.2v10.2a1 1 0 0 1-1 1H7.4a1 1 0 0 1-1-1z" /><path {...S} d="M6.4 9.4h11.2v10.2a1 1 0 0 1-1 1H7.4a1 1 0 0 1-1-1z" /><path {...S} d="M9.2 9.4V6.6a2.8 2.8 0 0 1 5.6 0v2.8" /><path {...S} d="M10 14h4" /></>,
  song: (t) => <><circle cx="12" cy="12" r="8.6" {...wash(t)} /><circle cx="12" cy="12" r="8.6" {...S} /><path {...S} d="M10.4 15.4V8.6l5-1v6.2" /><circle cx="9" cy="15.6" r="1.6" {...S} /><circle cx="14" cy="14.2" r="1.6" {...S} /></>,
  game: (t) => <><rect x="2.6" y="7.4" width="18.8" height="9.6" rx="4.4" {...wash(t)} /><rect x="2.6" y="7.4" width="18.8" height="9.6" rx="4.4" {...S} /><path {...S} d="M7.6 10.4v3.6M5.8 12.2h3.6" /><circle cx="16" cy="11.4" r="1.15" fill="currentColor" /><circle cx="18" cy="13.6" r="1.15" fill="currentColor" /></>,
  gift: (t) => <><rect x="3.6" y="8.6" width="16.8" height="11.8" rx="2.2" {...wash(t)} /><rect x="3.6" y="8.6" width="16.8" height="11.8" rx="2.2" {...S} /><path {...S} d="M2.6 8.6h18.8M12 8.6v11.8" /><path {...S} d="M12 8.6C10.4 6 8.6 3.6 7 4.4c-1.6.8-1 3.2 5 4.2zM12 8.6c1.6-2.6 3.4-5 5-4.2 1.6.8 1 3.2-5 4.2z" /></>,
  puzzle: (t) => <><path {...wash(t)} d="M4.4 5.6h5c0-1.6.9-2.4 2.2-2.4s2.2.8 2.2 2.4h5v5c1.6 0 2.4.9 2.4 2.2s-.8 2.2-2.4 2.2v5.4H4.4z" /><path {...S} d="M4.4 5.6h5c0-1.6.9-2.4 2.2-2.4s2.2.8 2.2 2.4h5v5c1.6 0 2.4.9 2.4 2.2s-.8 2.2-2.4 2.2v5.4H4.4z" /></>,
};

/**
 * @param name  which drawing
 * @param tone  the wash colour behind the line work. Defaults to the screen
 *              accent, so an icon dropped on a green screen tints green
 *              without the caller thinking about it.
 * @param label pass a string to make the icon meaningful to assistive tech.
 *              Omit it (the default) when a visible text label sits beside the
 *              icon — which is the case almost everywhere, by design.
 */
export function BrandIcon({
  name,
  className = 'w-6 h-6',
  tone = 'var(--screen-accent-wash)',
  label,
}: {
  name: IconName;
  className?: string;
  tone?: string;
  label?: string;
}) {
  const art = ART[name];
  if (!art) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {art(tone)}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(ART) as IconName[];
