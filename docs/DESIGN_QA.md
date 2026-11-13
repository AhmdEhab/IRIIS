# Design QA — audit & consistency pass (2026-11-13)

Audit headline (full report summarized here):
- 40 routed screens classified; contrast: NO same-hue saturated-fill+ink pairs left in routed bodies (Rewards coral card moved to wash+ink in this pass; blue-on-surface and yellow-on-ink verified).
- i18n: all screens use the language API; DrawingScreen tautology fixed (nameAr added for 9 swatches, aria-labels on swatch buttons).
- Motion: global MotionConfig reducedMotion gate in App.tsx now stops ALL framer loops when OS reduced-motion or in-app Calm mode is active; 8 stray Tailwind animate-* classes got motion-safe/motion-reduce variants.
- Surfaces: dead via-white/to-white gradient stops removed in 13 screens (pure-white remnants contradicted the warm-white identity); t-title role prepended to 11 legacy h1/h2.
- Deliberate deviations kept: oversized game titles (GamesHub/Memory text-6xl) left as-is; modal/icon-card padding kept (child touch targets).
- animate-spin-slow in TransitionScreen is a dead class (never defined); rotation comes from a framer prop already gated. Cosmetic cleanup deferred.

Next-tier items (documented, not yet done): migrate raw buttons (~30) to shared Button across IrisFlow/ParentSettings/ParentDashboard; single token-source consolidation (tokens.css absent; iris.css + theme.css overlap); Colors/Drawing art-palette hex → named palette tokens.

3D: Object3DViewer (R3F, lazy 910KB chunk, WebGL probe, error boundary, reduced-motion aware) + Explore3D toggle + modelLibrary (13 authored/CC0 GLBs, 1MB total, duck=CC-BY SCEA). Wired: FruitsScreen. Drop-in next (5 lines each): ShapesScreen, AnimalsScreen — mappings already in modelLibrary.
