/**
 * Phase 10 — palette sweep.
 *
 * WHAT THIS DOES
 * Rewrites off-palette Tailwind colour utilities in the legacy screens to IRIS
 * brand tokens, and collapses gradients to a single brand wash.
 *
 * WHY IT IS A SCRIPT AND NOT TWENTY HAND EDITS
 * The audit measured 761 off-palette utilities, 726 of them inside the twenty
 * original activity screens, plus 102 gradients across 31 files. Hand-editing
 * that is where twenty one-off designs come from: each screen gets whatever
 * the person editing it felt like that hour. A single mapping table applied
 * mechanically is the opposite — every `pink-500` in the product becomes the
 * same brand colour, and the mapping itself is reviewable in one place.
 *
 * WHAT IT DELIBERATELY DOES NOT TOUCH
 *   - Anything outside a className string context is left alone by the
 *     word-boundary matching (hex values in data, CSS files, comments in prose).
 *   - `text-white` and `text-black`: white on a brand fill is correct.
 *   - Any `brand-*`, `ink*`, `ground*`, `surface*`, `hairline*` token that is
 *     already right.
 *   - Game CONTENT — emoji, images, activity data. Only colour classes change.
 *
 * HUE MAPPING RATIONALE
 * The five brand hues absorb the fifteen off-palette ones by nearest family:
 *   blue · sky · indigo · cyan        → brand-blue
 *   purple · violet · fuchsia         → brand-purple
 *   pink · rose · red                 → brand-coral
 *   orange · amber · yellow           → brand-yellow
 *   green · emerald · teal · lime     → brand-green
 *   slate · gray · zinc · neutral · stone → the WARM neutral ramp
 * The neutral case matters most: slate and gray are cool blue-greys, and on a
 * warm cream ground they read as dirty rather than as neutral.
 */
import fs from 'fs';
import path from 'path';

const BRAND = {
  blue: 'blue', sky: 'blue', indigo: 'blue', cyan: 'blue',
  purple: 'purple', violet: 'purple', fuchsia: 'purple',
  pink: 'coral', rose: 'coral', red: 'coral',
  orange: 'yellow', amber: 'yellow', yellow: 'yellow',
  green: 'green', emerald: 'green', teal: 'green', lime: 'green',
};
const NEUTRALS = ['slate', 'gray', 'grey', 'zinc', 'neutral', 'stone'];
const HUES = Object.keys(BRAND);

/** A shade <= 200 is a tint (use the wash); >= 300 is a fill (use the colour). */
const isWash = (n) => Number(n) <= 200;

/** Neutral shade → warm ramp role, by property. */
function neutral(prop, n) {
  const v = Number(n);
  if (prop === 'text') return v >= 700 ? 'text-ink' : v >= 400 ? 'text-ink-muted' : 'text-ink-faint';
  if (prop === 'bg') return v >= 700 ? 'bg-ink' : v >= 300 ? 'bg-hairline' : 'bg-surface-sunk';
  if (prop === 'border') return v >= 400 ? 'border-hairline' : 'border-hairline-soft';
  if (prop === 'ring') return 'ring-hairline';
  if (prop === 'fill') return v >= 700 ? 'fill-ink' : 'fill-ink-muted';
  if (prop === 'stroke') return v >= 700 ? 'stroke-ink' : 'stroke-ink-muted';
  if (prop === 'divide') return 'divide-hairline';
  if (prop === 'placeholder') return 'placeholder-ink-muted';
  if (prop === 'decoration') return 'decoration-hairline';
  if (prop === 'outline') return 'outline-hairline';
  if (prop === 'shadow') return 'shadow-brand';
  if (prop === 'accent') return 'accent-ink-muted';
  if (prop === 'caret') return 'caret-ink';
  return null;
}

function brandClass(prop, hue, n) {
  const b = BRAND[hue];
  if (!b) return null;
  if (prop === 'text') return `text-brand-${b}-ink`;
  if (prop === 'bg') return isWash(n) ? `bg-brand-${b}-wash` : `bg-brand-${b}`;
  if (prop === 'border') return `border-brand-${b}`;
  if (prop === 'ring') return `ring-brand-${b}`;
  if (prop === 'fill') return `fill-brand-${b}`;
  if (prop === 'stroke') return `stroke-brand-${b}`;
  if (prop === 'divide') return `divide-brand-${b}`;
  if (prop === 'placeholder') return `placeholder-brand-${b}-ink`;
  if (prop === 'decoration') return `decoration-brand-${b}`;
  if (prop === 'outline') return `outline-brand-${b}`;
  if (prop === 'shadow') return 'shadow-brand';
  if (prop === 'accent') return `accent-brand-${b}`;
  if (prop === 'caret') return `caret-brand-${b}`;
  return null;
}

const PROPS = 'bg|text|border|ring|fill|stroke|divide|placeholder|decoration|outline|shadow|accent|caret';
const ALL_HUES = [...HUES, ...NEUTRALS].join('|');

/**
 * Gradients first, because `from-`/`to-`/`via-` have to disappear together
 * with the `bg-gradient-to-*` that drives them. The replacement colour comes
 * from the `from-` stop, which is the one a viewer reads as the card's colour.
 */
function collapseGradients(src) {
  let out = src;
  // Any class list containing bg-gradient-to-X … from-A-N … to-B-M (any order)
  out = out.replace(/(?:^|(?<=[\s'"`{]))bg-gradient-to-[a-z]{1,2}((?:\s+(?:via|from|to)-[a-z]+-\d{2,3})+)/g, (m, stops) => {
    const from = stops.match(/from-([a-z]+)-(\d{2,3})/);
    if (from && BRAND[from[1]]) return `bg-brand-${BRAND[from[1]]}-wash`;
    if (from && NEUTRALS.includes(from[1])) return 'bg-surface-sunk';
    return 'bg-surface-sunk';
  });
  // Leftover bg-gradient-to-* with the stops written before it, or with
  // arbitrary/opacity stops we could not read.
  out = out.replace(/(?:^|(?<=[\s'"`{]))(?:from|via|to)-(?:[a-z]+-\d{2,3}|\[[^\]]+\])(?=[\s'"`}]|$)/g, '');
  out = out.replace(/(?:^|(?<=[\s'"`{]))bg-gradient-to-[a-z]{1,2}(?=[\s'"`}]|$)/g, 'bg-surface-sunk');
  // text-transparent + bg-clip-text was only ever used for gradient headings;
  // with no gradient behind it the text would vanish entirely.
  out = out.replace(/(?:^|(?<=[\s'"`{]))bg-clip-text(?=[\s'"`}]|$)/g, '');
  out = out.replace(/(?:^|(?<=[\s'"`{]))text-transparent(?=[\s'"`}]|$)/g, 'text-ink');
  return out;
}

function sweep(src) {
  let out = collapseGradients(src);

  // Plain and variant-prefixed utilities: hover:bg-pink-500, md:text-slate-600…
  const re = new RegExp(
    `(?:^|(?<=[\\s'"\`{]))((?:(?:hover|focus|focus-visible|active|group-hover|disabled|md|sm|lg|xl|dark|first|last|odd|even|rtl|ltr):)*)(${PROPS})-(${ALL_HUES})-(\\d{2,3})(\\/\\d{1,3})?(?=[\\s'"\`}]|$)`,
    'g'
  );

  out = out.replace(re, (m, variants, prop, hue, shade, opacity) => {
    const mapped = NEUTRALS.includes(hue) ? neutral(prop, shade) : brandClass(prop, hue, shade);
    if (!mapped) return m;
    return `${variants}${mapped}${opacity ?? ''}`;
  });

  // Collapse the double spaces the removals leave behind, inside strings only.
  out = out.replace(/className=(["'`])([^"'`]*)\1/g, (m, q, body) =>
    `className=${q}${body.replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/g, '')}${q}`
  );
  return out;
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('usage: node scripts/palette-sweep.mjs <files…>');
  process.exit(1);
}

let changed = 0;
let total = 0;
for (const f of targets) {
  const before = fs.readFileSync(f, 'utf8');
  const after = sweep(before);
  if (after !== before) {
    fs.writeFileSync(f, after);
    changed++;
    const hits = (before.match(new RegExp(`\\b(?:${PROPS})-(?:${ALL_HUES})-\\d{2,3}`, 'g')) || []).length;
    total += hits;
    console.log(`  ${path.basename(f).padEnd(34)} ${hits} utilities`);
  }
}
console.log(`\n${changed} files rewritten, ~${total} colour utilities mapped.`);
