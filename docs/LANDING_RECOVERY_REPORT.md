# IRIS landing — final recovery report

**Branch:** `feature/iris-unification`
**Recovery checkpoint:** `recovery/landing-before-final-20261113-1813`, pointing to `b059617f3bcb101f60d5bbdf5e34ca8825823231`
**Main branch preserved:** `a11e8473ecd4c0b759cca46b2a44bd5297a82c66`

## What was actually wrong

The previous work relied too heavily on utility overrides and overflow probes. Inspection of the actual page and shared components revealed structural problems that an overflow check alone cannot detect.

| Root cause | Final correction |
|---|---|
| Shared `DisplayTitle` accepts `display` or `title`, not the landing's `section` value. It also applies `className` to a wrapper rather than the actual heading, so attempted inverse text color and line-height changes did not reach the text. | The landing now owns explicitly styled semantic headings. The hero is the only H1; section titles are H2. The final blue CTA directly styles its H2 white. Shared application headings were not redesigned. |
| Eight H1s and nearly identical heading/card patterns flattened the page hierarchy. | One page heading, distinct editorial, timeline, learning-ladder, activity-demo, parent, value and CTA compositions. One coherent story rather than repeating the same grid. |
| Primary and secondary buttons used different padding recipes; the secondary hero button had no horizontal padding and appeared tightly circular. Global unlayered typography rules overrode several utility choices. | Explicit reusable button variants with consistent heights, padding and interaction states. Scoped landing CSS owns dimensions and typography without important overrides. |
| The header centered links inside remaining flex space, not on the actual container midpoint. Logo and actions changed width with language and authentication. Mobile hid the direct header CTA. | Three-track desktop header grid with equal outer tracks; compact header before links become cramped. Correct logo dimensions, centered links, direct mobile CTA, and a working menu with language/login access. |
| Successive badge-offset fixes evolved into an oversized square viewer and a stretched reward card below the artwork, making the visual column unnecessarily tall. Hard-coded stars/progress looked like actual child results. | Preserve the illustration and mascot as the focal point; reserve a compact activity row below it that links to the real preview. No characters are covered. Remove fabricated personal metrics rather than present them as real data. |
| Seven mounted viewers meant seven potential WebGL contexts; `lazy()` alone did not defer mounting below the fold. | Seven model choices remain available, but the 3D viewer activates only after the user requests it. At rest there are zero canvases; after activation there is one. The stage has an explicit responsive cap. |
| Returning to a model reused the loader's cached scene after it had been reparented/scaled. Measuring its old world transform mis-centered the object, and cleanup disposed shared cached geometry/materials. | The viewer clones its scene and GPU resources before fitting and shading, then disposes only its owned resources. Switching away and back is re-tested visually. The WebGL probe also uses the real `isContextLost()` API. |
| An outer application `overflow-hidden` wrapper trapped the sticky header even though the header itself used `position: sticky`. | Change that wrapper to `overflow-visible` only for the public marketing route. Other application screens retain their original wrapper behavior. The decorative app background is also omitted only on that route. |
| The old public iframe harness assigned 1440/1920px widths but allowed flex shrinking; previous measurements of about 1241px did not prove those requested viewports. | Retire the inaccurate debug harness and use Chromium's actual `setViewportSize`. Record `innerWidth`, document dimensions and actual screenshots. The old harness remains recoverable in Git. |

## Final layout system

The landing uses the existing IRIS color tokens and fonts: Baloo display typography, Cairo Arabic body text and Quicksand English body text. No mascot or illustration was replaced. A shared container caps **content** at 1152px while fluid gutters and section spacing adapt to the device; this cap does not shrink the browser viewport.

The full sequence is header, hero, About IRIS, problem statement, five-step journey, adaptive learning/features, educational activities with live preview, Parent Mode, Why IRIS, final CTA and footer. Text and image proportions, section heading widths and column gaps are consistent. Layout is not hidden behind horizontal overflow clipping.

The hero uses a two-column desktop grid and an intentional stack on smaller screens. The activity row occupies its own space rather than covering the artwork. Tablet illustrations have a separate cap; phones do not inherit a giant square 3D hero card. Buttons and important control targets are at least 44px.

## Browser evidence

Before and after screenshots use the same real viewport sizes: **375, 768, 1024, 1440 and 1920px**. Each has a viewport image and a full-page image. Final screenshots cover Arabic RTL and English LTR. Full-page sections were inspected at readable scale, not only from a shrunk thumbnail.

Layout measurements cover **320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, 1366, 1440, 1600 and 1920px** in both languages: 30 width/language combinations. All recorded `innerWidth` values match the requested width and every recorded `scrollWidth` matches `clientWidth`. One H1 and zero browser page errors are recorded in every case.

The header was measured after scrolling 800px: before, its top was **−800px**; after, **0px** in both languages. Header-area and hero-column overlap tests at mobile and desktop are false; no sampled header/CTA controls are below the 44px target floor.

At 375 and 1440px in both languages, the browser checks open/close behavior, Escape, focus return, outside-click closing, close-on-anchor-selection, all four navigation anchors, hero/footer preview anchors and sticky behavior. It clicks every visible landing start/login CTA and waits for the corresponding existing registration/login email field. **No registration or login form is submitted**, and no test account or medical record is created.

The live-preview regression check activates 3D, selects all seven models, returns to the apple, drags it, and confirms only one canvas remains active. A separate no-WebGL browser check confirms the static alternative appears with zero canvases.

The axe WCAG-tagged scan records zero violations in the four mobile/desktop language configurations. The named ladder figure's ARIA manual-review item was corrected. The remaining marker-gradient contrast item requires manual evaluation: dark text has **10.32:1** against the yellow and **14.73:1** against the warm hero background, exceeding the large-text requirement. This is not a certification of the entire application.

## Modified components and styles

| File | Responsibility |
|---|---|
| `src/App/components/landing/LandingPage.tsx` | Page composition, concise bilingual copy, semantic headings, existing action callbacks |
| `src/App/components/landing/LandingHeader.tsx` | Brand/navigation/actions grid, language controls and responsive menu |
| `src/App/components/landing/LandingPrimitives.tsx` | Section shell, heading block and authoritative button variants |
| `src/App/components/landing/LearningPreview.tsx` | Deferred single-viewer exploration of all seven models |
| `src/App/components/landing/landing.css` | Scoped layout, typography, responsive rules, control states and inverse contrast |
| `src/App/components/three/Object3DViewer.tsx` | Cached-scene/resource ownership fix exposed by landing model switching; correct WebGL probe |
| `src/App/App.tsx` | Landing-only overflow/background wrapper change; routing/auth callbacks unchanged |
| `scripts/qa-landing.mjs` | Reproducible real-viewport screenshots and layout measurements |
| `scripts/qa-landing-interactions.mjs` | Reproducible action, keyboard, accessibility and 3D regression checks |

`public/qa-responsive.html` was an assistant-created debug harness, not a customer feature. Its retirement is intentional because its shrinking behavior produced misleading responsive evidence. The real-viewport scripts replace it; the recovery checkpoint preserves the original.

## Build, scope and remaining issues

The production build succeeds and the existing **168 engine tests pass**. Targeted TypeScript checking finds no errors in the landing files after including Vite's CSS declarations. The repository still lacks a normal TypeScript project configuration and has pre-existing Three.js JSX typing diagnostics in the imported viewer under the temporary standalone checker. The application-wide Vite bundle-size warning also remains; broader application splitting is outside this landing-only recovery. The heavy 3D chunk is deferred until activation.

No remaining landing layout blocker was found in the tested Chromium configurations. Safari/Firefox and physical-device QA are not claimed. Existing registration, login, auth, assessment, activity and backend business logic is preserved, not reimplemented or newly security-audited. Signed-in continuation retains the existing parent/role routing.

This change updates the running application and is saved on the feature branch. It is not a claim that permanent hosting, GitHub publication or a production deployment has occurred. IRIS continues to identify itself accurately as a research-framed supportive-learning prototype, not a diagnostic tool.
