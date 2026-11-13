/**
 * The IRIS 3D object library — one place that knows which app item has a model.
 *
 * ── WHY A MAP AND WHY IT IS ALLOWED TO BE EMPTY ─────────────────────────
 * Every entry maps a curriculum item id (the same ids the learning screens
 * already use) to a `.glb` in `public/models/`. Items are deliberately missing
 * from this map: the rule is that a 3D object must BE the thing the child is
 * being taught. A cartoon "close enough" animal next to the word for another
 * animal is not an approximation, it is a wrong answer in a nicer costume — so
 * `modelFor()` returns null and `Explore3D` renders no button at all.
 *
 * ── PROVENANCE ───────────────────────────────────────────────────────────
 * `apple`, `orange`, `banana`, `cat` and the shape solids are generated from
 * three.js primitives by `scripts/build-models.mjs` in the brand palette, so
 * they stay small (4–170 kB) and can be re-authored when the design system
 * changes. `fox.glb` and `duck.glb` are Khronos Group glTF-Sample-Assets
 * downloads (see `public/models/README.md` for licences); they are the
 * reference-quality textured pair, used where a hand-built solid would not
 * carry the name, and in the landing hero.
 */

export type ModelEntry = {
  /** Path relative to the site root — Vite serves it from public/. */
  src: string;
  /**
   * Emoji for the static fallback. Defaults to whatever the screen passes;
   * set it here when the screen's own glyph is not the object (an Arabic
   * letter card shows «ب», not a duck).
   */
  fallbackEmoji?: string;
};

const LIBRARY: Record<string, ModelEntry> = {
  // ── Fruits ────────────────────────────────────────────────────────────
  apple: { src: '/models/apple.glb' },
  orange: { src: '/models/orange.glb' },
  banana: { src: '/models/banana.glb' },

  // ── Animals ───────────────────────────────────────────────────────────
  cat: { src: '/models/cat.glb' },
  // fox / duck name the Arabic-letter vocabulary (ثعلب, بطة) as well as any
  // future animal set.
  fox: { src: '/models/fox.glb' },
  duck: { src: '/models/duck.glb', fallbackEmoji: '🦆' },

  // ── Shapes: the 2D name, the 3D solid it stands for ───────────────────
  circle: { src: '/models/sphere.glb' },
  square: { src: '/models/cube.glb' },
  rectangle: { src: '/models/box.glb' },
  triangle: { src: '/models/prism.glb' },
  star: { src: '/models/star.glb' },
  heart: { src: '/models/heart.glb' },
};

/**
 * The model for a curriculum item, or null.
 * Null is a normal, expected answer — callers must not render a 3D control for
 * an item that has no accurate model.
 */
export function modelFor(itemId: string | null | undefined): ModelEntry | null {
  if (!itemId) return null;
  return LIBRARY[itemId] ?? null;
}

/** Full inventory, for the parent-facing settings screen or QA scripts. */
export function listModels(): Array<{ itemId: string } & ModelEntry> {
  return Object.entries(LIBRARY).map(([itemId, entry]) => ({ itemId, ...entry }));
}
