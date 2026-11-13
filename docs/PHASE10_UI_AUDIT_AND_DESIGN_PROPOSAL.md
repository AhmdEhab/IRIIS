# IRIS — Phase 10, Step 1
## UI audit + proposed design system + screen-by-screen visual direction

**No implementation code has been written for this phase.** This document is the
proposal you asked for before any UI changes. Section 8 is the decision list I
need back from you.

Date: 2026-09-06 · Against the working tree at `iriss-main/`

---

## 0. Source material — what I actually looked at

I will not describe an identity I have not seen, so this comes first.

| Asset | Status | Where |
|---|---|---|
| **IRIS trifold brochure** | ✅ inspected | `IRIS_MEGA_FOLDER/WhatsApp Image 2026-09-02 at 7.21.22 PM.jpeg` |
| **Logo lockup — "IRIS" + hope·courage·wisdom, warm-white field** | ✅ inspected | `WhatsApp Image 2026-09-02 at 7.20.52 PM.jpeg` |
| **Logo, isolated on white** | ✅ inspected | `WhatsApp Image 2026-09-04 at 12.26.18 PM.jpeg` |
| **Mascot A — cream plush figure, multicolour petal crown, heart window** | ✅ inspected | `WhatsApp Image 2026-09-04 at 12.24.54 PM.jpeg` |
| **Mascot B — yellow sunflower child, red/yellow petals, heart window** | ✅ inspected | `WhatsApp Image 2026-09-04 at 12.24.55 PM.jpeg` |
| `BRAND_IDENTITY.md`, `COPY_TONE.md`, `README_FOR_CLAUDE.md`, `SOCIAL_MEDIA_GUIDE.md`, `MASTER_PROMPT_FOR_CLAUDE.md` | ✅ read | `IRIS_SHEleads/IRIS_Brand_Identity_Pack/` |
| **Business card** | ❌ **not found** | — |

### About the business card

You said "brochure and business card". I searched both connected folders
(`IRIS_SHEleads`, `IRIS_MEGA_FOLDER`) including the whole Brand Identity Pack.
There is no business-card file there — no card image, no card PDF, nothing under
that name. The pack's `assets/` folder contains only `IRIS_logo_master.png`.

So **everything below is extracted from the brochure, the three logo files, the
two mascot files and the written brand pack.** Nothing is extrapolated from a
card I have not seen. If the card exists somewhere else, send it and I will
reconcile section 2 against it before implementing — a card usually settles two
things the brochure leaves open: the compact/mono logo lockup, and how the
identity behaves at small sizes on a coloured field.

### One thing the sources disagree on, which you need to decide

There are **two mascots**. Mascot A (cream plush body, five-colour petal crown)
is what `IrisBuddy.tsx` in the app already draws. Mascot B (yellow sunflower
child, red-and-yellow petals, visible arms and legs, waving) is a different
character. The brochure uses neither — it uses photographs of children.

I am not going to guess which one is canonical. See §8, decision 1.

---

## 1. Audit of the current UI

Everything in this section is measured or screenshotted, not inferred from
reading source. Screenshots are in `p10-shots/` (20 files, real running app,
900px and 390px).

### 1.1 Structure

- **One screen at a time.** No router. `App.tsx` holds a 40-case `switch` on
  `currentScreen` from `AppContext`; `AnimatePresence` cross-fades between them.
- **50 screen components** total: **34** in `src/App/components/` (the original
  build) and **16** in `src/App/components/iris/` (built in Phases 3–9).
- Child activity screens are wrapped in `ChildShell` so the avatar/name/star
  header persists. Parent screens are not wrapped in anything.
- Providers: `LanguageProvider → AudioProvider → AppProvider → IrisProvider`.
- `PlayfulBackground` is a fixed decorative layer behind every screen.

### 1.2 Reusable components — the library exists and is mostly unused

`src/App/components/iris/ui/brand/index.tsx` defines eight brand components.
Actual render sites across all 50 screens:

| Component | Screens rendering it |
|---|---|
| `Surface` | 5 |
| `Pill` | 4 |
| `SectionHeader` | 3 |
| `AvatarRing` | 1 |
| `ProgressTrack` | **0** |
| `ActivityTile` | **0** |
| `ParentCard` | **0** |
| `StarCount` | **0** |

`IrisChildHome.tsx` *imports* `ActivityTile` and `SectionHeader` and then renders
neither — it hand-builds its own tiles. **This is the single biggest cause of the
drift.** The system was built; adoption stopped at five screens.

Alongside it sit 22 shadcn/ui primitives in `src/App/components/ui/`
(`button`, `card`, `input`, `dialog`, `tabs`…). These are styled from the
*shadcn* token names (`bg-primary`, `text-muted-foreground`), which are a
**separate** token layer from the brand one.

### 1.3 Colour — the measured split

Utility-class occurrences across all `.tsx`:

| | Legacy Tailwind palette (`slate-800`, `pink-500`, `indigo-600`…) | IRIS brand tokens (`bg-brand-blue`, `text-ink`, `bg-ground`…) |
|---|---|---|
| `components/*.tsx` (original 34 screens) | **726** | 188 |
| `components/iris/**` (16 screens) | 29 | **588** |
| **Total** | **761** | **787** |

So the product is almost exactly **half branded, half not**, and the seam runs
along the `iris/` directory boundary.

**Hues used that are not in the IRIS palette at all:** pink, fuchsia, rose,
indigo, violet, sky, cyan, teal, emerald, lime. Top offenders by count:
`to-pink-500` ×14, `from-pink-400` ×10, `bg-emerald-500` ×7, `to-indigo-500` ×5,
`text-pink-500` ×5. The story cards render as **pink→magenta and blue→violet
gradients**, which is the loudest identity break in the app (screenshot
`18-story-player.png`).

**Gradients:** 102 `bg-gradient-*` usages across 31 files. `BRAND_IDENTITY.md` §3
and `SOCIAL_MEDIA_GUIDE.md` both say to avoid gradients unrelated to the
identity. Almost none of these are brand gradients.

**Three overlapping token layers** currently define colour:

1. `theme.css` — shadcn variables (`--background`, `--primary`, `--muted`…),
   partly rebranded, but still carrying oklch leftovers in the `--sidebar-*`
   group and a **full `.dark` block that is cool-grey** and would destroy the
   warm identity if dark mode were ever switched on.
2. `iris.css :root` — `--brand-*` plus semantic roles. **It redefines
   `--primary` and `--background`, which `theme.css` already defined.** Both
   happen to resolve to the same value today, so there is no visible bug — but
   there are two sources of truth for the same variable.
3. `iris.css @theme` — the Tailwind v4 utility generation. This is the layer
   that actually gets used.

**Confirmed by computed style, not by reading:** the app's root wrapper in
`App.tsx` is `className="… bg-white …"`. The page only *looks* warm because
`PlayfulBackground` paints `bg-ground` as a fixed layer behind it. Remove or
fail that one decorative component and the whole app turns pure white.

### 1.4 Typography

- Loaded: **Cairo** + **Tajawal** (Arabic), **Quicksand** (Latin), via one
  Google Fonts `@import` with real local fallbacks. Arabic gets `line-height:
  1.75` and forced `letter-spacing: 0` (correct — letter-spacing breaks Arabic
  cursive joins).
- **There is no type scale.** No `--text-*` tokens in `@theme`; sizes are chosen
  per screen with raw Tailwind utilities. Measured on the login screen alone:
  `h1 60px/900`, `h2 30px/900`, `p 24px/700`, `button 30px/900`,
  `button 16px/900`, `button 12px/900` — six pairs on one screen.
- `theme.css` sets base `h1–h4` to `font-weight: 500`, while every brand screen
  overrides to `font-black` (900). The base layer is dead weight.
- **The brand's display voice is missing.** The brochure headlines are heavy
  rounded display caps ("UNDERSTANDING, NOT STANDARDIZING", "OUR IMPACT"). The
  app renders every heading in Quicksand/Cairo Bold. Nothing in the product
  looks like the brochure's headline treatment.

### 1.5 Shape

**21 distinct corner radii in use.** `rounded-full` ×140, `rounded-2xl` ×93,
`rounded-3xl` ×37, `rounded-[3rem]` ×18, `rounded-xl` ×15, `rounded-[2.5rem]`
×15, `rounded-md` ×14, `rounded-[2rem]` ×12, `rounded-lg` ×7, `rounded-[3.5rem]`
×7, plus `[1.5rem]`, `[4rem]`, `[4px]`, `[2px]`, `sm`, and one bespoke
`rounded-[50%_50%_50%_50%_/_45%_45%_55%_55%]`.

The four brand radii (`rounded-brand-sm/​brand/​lg/​xl`) account for **19 uses in
total**.

### 1.6 Navigation

- **No persistent navigation anywhere.** Every screen carries its own bespoke
  "Back" control, in its own position, with its own label
  (`← Parent Mode`, `Back`, `رجوع`, `Home`).
- `GlobalControls` is pinned `fixed top-4 right-4 z-[100]` on **every** screen,
  with a glassmorphism treatment (`bg-white/20 backdrop-blur-md
  border-white/30 text-slate-800`). It is the only glass surface in the app,
  it uses `slate`, and it collides with anything else in that corner.
- Parent Mode is a 6-card hub with no way to move sideways between sections —
  every move is section → hub → section.

### 1.7 Child / parent flows (unchanged by this phase)

```
landing ─┬─ Child Mode  → IrisFlow → intake → IrisChildHome ─┬─ Start Adventure → assessment / activity
         │                                                    └─ Free Play → 5 legacy games
         └─ Parent Mode → login/registration → IrisParentHome ─┬─ Learning Snapshot ─┬─ ladder assessment
                                                               │                      └─ ladder practice
                                                               ├─ Progress & Insights
                                                               ├─ Home Tips
                                                               ├─ Ask IRIS
                                                               ├─ Parent Community  (demo)
                                                               └─ Connect w/ Specialists (demo)
```

**None of this changes in Phase 10.** The redesign is visual only.

### 1.8 Defects visible in the screenshots

These are real, reproduced, and each one has a screenshot.

| # | Defect | Evidence |
|---|---|---|
| D1 | **"Log out" is unreadable** on Parent Home — faint text, and `GlobalControls` sits on top of it | `06-parent-home-en.png` |
| D2 | **"Back" on Ask IRIS renders as "BaAR"** — `GlobalControls` overlaps it | `10-parent-chat.png` |
| D3 | **Story cards are pink/magenta and violet gradients** — colours absent from the identity | `18-story-player.png` |
| D4 | **Landing shows the logo *and* retypes "IRIS" below it** in a plain sans — two competing wordmarks | `02-landing-en.png` |
| D5 | **Landing tagline is "Learn. Adapt. Grow."** — not an IRIS tagline. The brand's are "Explore. Grow. Play.", "Understanding, not standardizing.", "Hope. Courage. Wisdom." | `02-landing-en.png` |
| D6 | **Two language controls on screen at once** — the `عربي / English` pills *and* the `AR` glass button | `01/02-landing.png` |
| D7 | **The ladder assessment card floats in a large empty field**, no companion, decorative blob hard-clipped at the corner | `21-ladder-assessment.png` |
| D8 | **Ask IRIS looks like a generic chat app** — exactly what the brief rules out. Plain header, suggestion chips, empty void, blue Send | `10-parent-chat.png` |
| D9 | **Memory Game heading is green**, its stats panel is uppercase-tracked and overlaps the title; nothing else in the app looks like it | `15-legacy-memory.png` |
| D10 | **Emoji do the identity's work** — mascot slot (🧒👪), section headers (🗺️✨📚), avatars (🦁), progress icons (🎲⭐🚀). These render as different artwork on every OS. `PlayfulBackground` already fixed this for the background doodles; the fix never reached the foreground | most screenshots |
| D11 | **Disabled primary CTA at 50% opacity is the first thing a parent sees** on login. It reads "broken", not "fill this in". *(Checked the computed style: the fill is correct `#1F67B1`; it is the disabled treatment that misleads.)* | `03-login.png` |
| D12 | **RTL arrow direction** — login's back arrow points left in an RTL layout | `03-login.png` |

---

## 2. The identity, extracted from the brochure and logo

Not copied — read off, and stated as rules the UI can follow.

### 2.1 What the brochure actually does

1. **Warm white is the stage, not the background.** Roughly 55–60% of the
   brochure is untouched warm off-white. Colour is *pooled* at panel edges and
   in discrete blocks; the centre stays clear. Colourful ≠ covered in colour.
2. **Every colour block is an organic blob, not a rectangle.** Corners are
   irregular; edges wobble. Even the blue "CONTACT US" panel has a hand-cut
   silhouette.
3. **One dominant colour per panel.** Left panel = yellow; centre = blue;
   right = blue+purple. Accents are supporting, never equal partners.
4. **Headlines are heavy rounded display caps**, and one word inside the
   headline changes colour to carry the meaning — "**NOT** STANDARDIZING" in
   coral, "understood" in coral, "standardized" in blue. Colour is used as
   *emphasis inside a sentence*, not as decoration.
5. **Body copy is small, clean, dark, and set on plain warm white.** It never
   sits on a busy field.
6. **Content lives in soft-cornered colour cards** — the four "WHAT WE DO?"
   tiles are yellow / green / purple / coral washes with a small line icon and
   two short lines. That is exactly the ActivityTile pattern IRIS already has
   and does not use.
7. **Numbered lists use coloured discs** (red 1, blue 2, yellow 3) — the brand's
   way of showing ordered steps.
8. **Highlight = a yellow marker swipe behind text**, not a border or a badge.
9. **Doodles are sparse and small**: sun rays, dashed arcs, stars, dots, tiny
   ticks. Maybe 8–12 per panel, never crowding the copy.
10. **Photography is warm, close, and shows children mid-activity, capable** —
    holding a pen, drawing, smiling at the camera. Never posed as a subject of
    concern.

### 2.2 What that means for a product UI

The brochure's discipline translates to four rules:

> **R1 — Colour is earned.** A screen gets *one* dominant colour. Everything else
> is warm white, ink, and at most two supporting accents.
>
> **R2 — Colour marks meaning, never mood.** A coloured word is the important
> word. A coloured card is a category. A coloured disc is a step number. If a
> colour is not saying something, it should not be there.
>
> **R3 — Organic edges, generous white space.** Blobs, not panels. Room around
> everything.
>
> **R4 — The playful voice is in the *display* type and the *doodles*, not in
> the body copy or the controls.** Controls stay calm and legible.

### 2.3 Where the current app breaks each rule

- R1: child home and legacy activities put 5–6 colours on screen simultaneously
  with no dominant one.
- R2: gradients and pink/indigo/emerald fills carry no meaning at all.
- R3: 21 radii; several screens use square-ish `rounded-md`/`rounded-lg`.
- R4: display voice is missing entirely; meanwhile emoji add noise to controls
  and headers where calm is needed.

---

## 3. Proposed IRIS design system

### 3.1 Colour tokens

Keep the five brand values — they are already correct and already sampled from
the identity. **Nothing in the palette changes.** What changes is the *role*
structure around them, so a screen never has to invent a colour.

```
BRAND          FILL       INK (text/icon)  WASH (tinted surface)
blue           #1F67B1    #17518C          #E5EFF9
coral          #F45B63    #C93B43          #FDE9EA
yellow         #FECA34    #96700A          #FDF3D8
green          #49B87A    #2F8757          #E6F5ED
purple         #8060B4    #63479A          #F0EAF8

GROUND         #FEF6EA  warm white — the stage
GROUND-TINT    #FBF0DE  banded sections
SURFACE        #FFFCF6  cards
SURFACE-SUNK   #F7EDDA  wells, inputs, disabled

INK            #2A2118  warm near-black
INK-MUTED      #6B5D4D
INK-FAINT      #9A8B77  (decorative / non-essential only — see §5)
HAIRLINE       #E6D7C0
HAIRLINE-SOFT  #F0E5D2
```

**New:** one token per screen, `--screen-accent`, set once at the screen root.
Cards, section rules, progress and focus decoration read from it. This is how
R1 gets enforced mechanically rather than by discipline.

Proposed screen accents:

| Area | Accent | Why |
|---|---|---|
| Landing / auth | blue | trust — the parent's first impression |
| Child home & play | yellow | the brochure's "energy" panel colour |
| Assessment ("getting to know you") | green | growth, and it is not a scoring colour |
| Learning Snapshot / Progress | blue | this is the credible, parent-facing surface |
| Home Tips | green | |
| Ask IRIS | purple | imagination/creativity — and it visually separates the assistant |
| Community | coral | |
| Specialists | blue | |
| Rewards / celebration | yellow | |

**Retired:** all 761 legacy-palette utilities, all 102 gradients, and every
pink / fuchsia / rose / indigo / violet / sky / cyan / teal / emerald / lime
occurrence.

### 3.2 Typography tokens

Three roles, and the display role is the one that is missing today.

| Role | Family | Use |
|---|---|---|
| **Display** | Baloo 2 (Latin) / Baloo Bhaijaan 2 (Arabic) — heavy rounded, and the Arabic sibling is designed as a matched pair | Screen titles, hero statements, celebration. **Sparingly** — one per screen. |
| **UI / body** | Quicksand (Latin) / Cairo (Arabic) — already loaded, already correct | Everything else |
| **Numerals** | `tabular-nums`, `dir="ltr"` | Counts, scores, ages |

*Baloo is the closest widely-available match to the brochure's headline
lettering, and it is the only family in the proposal that adds a font request.
If you would rather not add one, the fallback is Quicksand 700 at display sizes
with wider tracking — noticeably less like the brochure, but zero cost. §8,
decision 2.*

A real scale, as tokens:

```
--text-display   clamp(2.25rem, 5vw, 3.5rem)  / 900 / 1.05
--text-title     clamp(1.75rem, 3.5vw, 2.25rem) / 900 / 1.15
--text-heading   1.375rem / 800 / 1.3
--text-body-lg   1.0625rem / 500 / 1.7    ← child mode floor
--text-body      1rem      / 500 / 1.6
--text-small     0.875rem  / 600 / 1.5
--text-label     0.75rem   / 800 / 1.4 / uppercase (Latin only — never Arabic)
```

Arabic keeps `line-height × 1.1` on every step and `letter-spacing: 0` always.
`--text-label` never applies uppercase to Arabic, which has no case.

### 3.3 Shape, elevation, motion

```
--radius-sm    0.75rem   chips, small controls
--radius       1.25rem   inputs, inner blocks
--radius-lg    1.75rem   cards
--radius-xl    2.25rem   hero cards, modals
--radius-pill  999px     buttons, pills, tags
```

**Five radii, no exceptions**, replacing the 21 in use. Arbitrary
`rounded-[Nrem]` values are removed.

Three elevations only (`flat` / `raised` / `lifted`), warm-tinted shadows —
already defined, just not applied consistently.

Motion: `--motion-fast 150ms`, `--motion 250ms`, `--motion-slow 400ms`, all
`cubic-bezier(0.2, 0.8, 0.2, 1)`. All decorative motion already respects
`prefers-reduced-motion`; this stays.

### 3.4 Component set

**Existing, to be finished and actually adopted:**
`Surface`, `SectionHeader`, `Pill`, `AvatarRing`, `ProgressTrack`,
`ActivityTile`, `ParentCard`, `StarCount`,
`Blob`, `DashedArc`, `Star`, `Sparkle`, `SunRays`, `DotScatter`, `WavyRule`,
`IrisBuddy`, `LadderItemCard`, `ChildShell`.

**New, and each one exists to kill a specific defect above:**

| Component | Kills |
|---|---|
| `ScreenFrame` — the one page wrapper: ground, accent, top bar, safe areas, RTL | D1, D2, D6, and the `bg-white` root |
| `TopBar` — the single navigation bar: back / title / actions, one place | D1, D2, D6, D12, and the 40 bespoke back buttons |
| `Button` (brand) — primary / secondary / quiet / play, with an *honest disabled state* | D11 |
| `DisplayTitle` — the brochure headline, with a `<Mark>` child for the one coloured word | D4, and the missing display voice |
| `Mark` — the yellow marker-swipe highlight from the brochure | — |
| `StepDisc` — the brochure's numbered coloured disc | — |
| `BrandIcon` — a drawn icon set replacing foreground emoji | D10 |
| `AssistantBubble` / `AssistantComposer` — the Ask IRIS surface, mascot-led | D8 |
| `EmptyState` — mascot + one line + one action | D7, D8 |
| `Celebration` — the one "well done" treatment | D9 |
| `Logo` — the master lockup, three sizes, with clear-space enforced | D4 |

`BrandIcon` is the biggest single piece of work: roughly **40 drawn icons** to
retire the emoji in headers, tiles, avatars and progress. Game *content* emoji
(the apples and lions inside Memory Game) can stay — they are content, and they
read fine.

### 3.5 Token cleanup

- Delete the `.dark` block from `theme.css`. IRIS has no dark mode, and the one
  that is defined is cool-grey and off-identity.
- Remove the oklch `--sidebar-*` leftovers (no sidebar exists).
- Make `iris.css` the **only** definition of `--primary` and `--background`;
  `theme.css` maps shadcn's names *onto* the brand tokens rather than redefining
  them.
- Change the `App.tsx` root from `bg-white` to `bg-ground` so the warm ground is
  real rather than borrowed from a decorative layer.

---

## 4. Screen-by-screen visual direction

Your brief named ~15 screens. The app has 50 components across 40 routes, so
below I have grouped them into the 15 *surfaces* a user actually experiences,
and named the components each one covers. Every entry is **visual only** — no
flow, copy-logic, engine or data behaviour changes.

### A. Entry & identity

**1. Splash** — `SplashScreen.tsx`
Master logo centred on warm white, generous clear space, the dashed arc drawing
itself once (150ms, skipped under reduced motion). Nothing else. Today it is a
gradient with emoji.

**2. Landing / mode select** — `IrisLanding.tsx`, `ModeSelectionScreen.tsx`
Logo at hero size. **Remove the retyped "IRIS" wordmark below it (D4)** — the
logo already says it. Under it, one brochure-voice line: *"Understanding, not
standardizing."* with "not standardizing" marked in coral, and beneath that
*Explore. Grow. Play.* Two big blob-cornered choice cards — Child (yellow wash,
drawn child mark) and Parent (blue wash, drawn family mark), **not emoji**.
Language pills move into `TopBar`; the floating glass `AR` button goes away
(D6). Corner blobs come up from 7% to ~14% opacity so the identity is actually
visible instead of a grey smudge.

**3. Login** — `LoginScreen.tsx`
Warm white, one blue accent. Display title, no emoji in the heading. Inputs on
`surface-sunk` with hairline borders and 48px min height. Primary button full
brand blue; the disabled state becomes a *quiet* button with a helper line
("Enter your email and password"), not a 50%-faded blue slab (D11). Back arrow
uses a logical direction so RTL is correct (D12).

**4. Registration** — `RegistrationScreen.tsx`
Same shell. Multi-step becomes a `ProgressTrack` dot row (the brand's counting
metaphor) rather than a filled bar. Consent text stays exactly as written —
legally load-bearing, visual only.

### B. Parent Mode

**5. Parent Home hub** — `IrisParentHome.tsx`
`TopBar` with child name + `StarCount` + a single overflow menu that finally
makes **Log out readable (D1)**. Six `ParentCard`s — the real component, the
brochure's "WHAT WE DO?" tile pattern: soft colour wash, drawn icon, title, one
line. "Soon" badges stay honest. A `DashedArc` under the section header. One
dominant colour (blue), five washes as category markers.

**6. Learning Snapshot** — `IrisLearningSnapshot.tsx`
The most important parent screen and the one closest to right already. Keep
every rule it enforces (no zeros for unmeasured, no overall score, caveat beside
the number). Visual changes only: display title; confidence banner as a
`Surface tone="blue"` at the top; strength/developing/priority sections divided
by `WavyRule` instead of stacked cards; priorities as `StepDisc` 1-2-3 in
coral/blue/yellow — the brochure's own device; the floor note gets a small
`Sparkle`, not a warning colour, because a floor is a starting point.

**7. Progress & Insights** — `IrisParentDashboard.tsx`
Charts recoloured to `--chart-1..5` = blue, green, yellow, purple, coral —
already declared in `theme.css`, not yet used. Every series is also
distinguishable without colour (dash pattern + direct label), per §5.

**8. Home Tips** — `IrisHomeTips.tsx`
Brochure list treatment: `StepDisc` numbers, `Mark` on the one key phrase per
tip, generous space. Currently gradients.

**9. Ask IRIS** — `IrisParentChat.tsx` (+ `IRISAssistant`, `ParentChatModal`)
**This is the screen the brief singles out, and the current one is a generic
chat app (D8).** The redesign:
- The assistant *is the mascot*. A small IrisBuddy sits at the top-left of the
  conversation and changes mood — thinking, answering, referring on.
- Replies come in warm `surface` bubbles with a soft blob tail, purple accent,
  never a full-width grey band.
- The empty state is mascot + one warm line + the suggestion chips as
  brochure-style coloured tags, not grey pills in a void.
- The composer is a rounded warm field on `surface`, the send control is a
  drawn brand mark.
- **The medical disclaimer stays exactly where and as it is** — it is a
  substantive constraint, and it gets a yellow `Mark`, not a shrink.

**10. Community** — `IrisCommunity.tsx` · **11. Specialists** — `IrisSpecialists.tsx`
These two already use the brand components properly and need the least work:
`TopBar` adoption, the top-right blob un-clipped, and the `EXPERIENCE` /
`AVAILABILITY` micro-labels raised off `ink-faint` to `ink-muted` for contrast.
**Every "demo — not verified" label stays verbatim.**

### C. Child Mode

**12. Child Home** — `IrisChildHome.tsx`
Yellow-dominant. Hero: IrisBuddy + display greeting + one big play button
(coral, pill, `--radius-pill`). "Our adventure" becomes three `StepDisc` rows —
visibly *information*, not tappable, which the identical-looking cards get wrong
today. "Free Play" becomes real `ActivityTile`s with drawn icons. Header
collapses into `TopBar`: avatar, stars, audio, one overflow. Five separate icon
buttons at 390px is the current crowding problem.

**13. Assessment — "getting to know you"** — `IrisLadderAssessment.tsx`,
`IrisAssessmentScreen.tsx`, `AIAssessmentScreen.tsx`, `LadderItemCard.tsx`
Green accent, calm. Fixes D7: the card gets vertical anchoring instead of
floating in emptiness; IrisBuddy appears at a fixed low-motion position and
reacts once per answer; the clipped blob becomes a properly placed one;
`ProgressTrack` dots replace the thin bar. Option tiles get a real resting
border, a clear hover, and a 3px focus ring. **Item content, ordering, scoring
and the engine are untouched.**

**14. Practice & activities** — `IrisLadderPractice.tsx`, `IrisActivityScreen.tsx`,
`IrisStoryPlayer.tsx`, and the 20 legacy activity screens
(`AnimalsScreen`, `LettersScreen`, `NumbersScreen`, `ColorsScreen`, `ShapesScreen`,
`FruitsScreen`, `VehiclesScreen`, `BodyPartsScreen`, `EmotionsScreen`,
`LifeSkillsScreen`, `SongsScreen`, `DrawingScreen`, `MemoryGameScreen`,
`BalloonPopScreen`, `ShadowMatchScreen`, `GamesHubScreen`, `StoriesScreen`,
`RewardsScreen`, `TransitionScreen`, `SyndromeTeachingDemoScreen`)
This is the bulk of the work — **726 of the 761 off-brand utilities live here.**
Each screen gets: `ScreenFrame` + one accent, brand radii, brand `Surface`,
brand buttons, `ProgressTrack`, `Celebration`, and **its gradients removed**.
Story cards specifically lose pink/magenta/violet (D3) and take brand washes
with the existing drawn `StoryArt`. Memory Game's green heading and floating
uppercase stats panel are normalised (D9). **No game logic is touched.**

**15. Rewards & celebration** — `RewardsScreen.tsx`, `IrisCelebration.tsx`,
`StarPop.tsx`, `RewardBadge.tsx`
One celebration language: brand `Star`, yellow, `StarCount`, a short
`Sparkle` burst that is fully suppressed under reduced motion. Replaces the
several different congratulation treatments in use now.

### Cross-cutting

**`GlobalControls`** stops being a floating glass overlay and becomes part of
`TopBar` — that single change resolves D1, D2 and D6 at once.

---

## 5. Accessibility — treated as a hard constraint, not a checklist

The brief is right that this matters more here than in a typical product. Every
rule below is testable, and I will add each one to the existing `qa-a11y.mjs`
suite so a regression breaks the build rather than shipping.

1. **Contrast.** Body and any text conveying information ≥ **7:1** (AAA), not
   4.5:1 — the audience includes children with visual and cognitive
   differences. `ink-faint` (#9A8B77) is **decorative only** and is banned from
   any text a user must read. This retires the faint labels in D1 and on the
   Specialists cards.
2. **Never colour alone** (WCAG 1.4.1). Every state also carries text or shape.
   Chart series get dash patterns and direct labels.
3. **Touch targets ≥ 44×44** everywhere, ≥ **56×56** in Child Mode. Currently
   enforced only inside `.iris-child`.
4. **Focus ring 3px solid brand blue + 6px halo**, visible on every interactive
   element in both languages. Already correct in `iris.css`; the new `Button`
   must not undo it (a previous version did — noted in the CSS comment).
5. **One primary action per screen** in Child Mode. Reduces choice load.
6. **Reduced motion** removes all decorative motion; nothing informational is
   ever carried by animation.
7. **Arabic first.** Every screen designed RTL first, then mirrored. Logical
   properties (`ms-`/`me-`/`start`/`end`) everywhere except deliberately
   physical anchors, which get a comment saying why. No uppercase on Arabic. No
   letter-spacing on Arabic.
8. **Bidi isolation** on every Arabic glyph or numeral inside a Latin sentence
   and vice versa — `IrisLearningSnapshot` already does this; it becomes a rule.
9. **Text never in images.** All drawn icons are decorative with real text
   labels beside them.
10. **Screen reader**: `TopBar` provides a consistent landmark structure, which
    the app currently has none of.

---

## 6. Proposed implementation order

Each stage ends green (`npm test` 119/119, 14 QA suites, `npm run build`) and
each has its own screenshot pass at 360 / 390 / 820 / 1440.

| Stage | Work | Risk |
|---|---|---|
| **10a** | Token consolidation: type scale, radii, motion, `--screen-accent`, delete `.dark`, fix `bg-white` root, single `--primary` | Low — additive |
| **10b** | Build `ScreenFrame`, `TopBar`, `Button`, `DisplayTitle`, `Mark`, `StepDisc`, `EmptyState`, `Celebration`, `Logo`; retire `GlobalControls` | Low |
| **10c** | `BrandIcon` set (~40 drawn icons), retire foreground emoji | Medium — volume |
| **10d** | Entry + Parent Mode (screens 1–11), incl. the Ask IRIS rebuild | Medium |
| **10e** | Child Mode core (screens 12, 13, 15) | Medium |
| **10f** | The 20 legacy activity screens (screen 14) — the 726 utilities | **High volume, low individual risk.** Mechanical: swap palette, remove gradients, adopt `ScreenFrame`. Logic untouched. |
| **10g** | A11y verification pass: contrast sweep, RTL sweep, focus sweep, reduced-motion sweep, overflow at four widths, added to `qa-a11y.mjs` | — |

Stage 10f is the largest and the most tedious; it is also where the visual
inconsistency actually lives, so skipping it would leave the app looking exactly
as split as it does now.

---

## 7. What will NOT change

- The adaptive engine, ladders, calibration, probe, indicators, skill estimates.
- Diagnosis-blindness and the `TEST-PATH-BLIND` guarantee.
- Assessment items, scoring, tiers, scaffolds, routing.
- ElevenLabs integration, voice IDs, keys, TTS settings, caching, fallback.
- Authentication, the API, the database schema.
- Navigation *structure* and every screen's behaviour.
- All demo/not-verified labelling, medical disclaimers, and the "no diagnosis"
  wording.
- Any existing test. Nothing gets weakened to go green.
- The logo itself — no redraw, no proportion change, no effects.

---

## 8. Decisions I need from you before implementing

1. **Which mascot is canonical?** (a) Mascot A, the cream plush figure —
   `IrisBuddy` already draws this, zero work; (b) Mascot B, the yellow sunflower
   child — I would redraw `IrisBuddy` to match; (c) both, with a defined split
   (e.g. B for marketing, A in-product).
2. **Add the Baloo display font?** Yes = closest to the brochure headlines, one
   extra font request. No = Quicksand 700 at display sizes, zero cost, less like
   the brochure.
3. **The business card** — does it exist? If yes, send it before stage 10b; the
   compact lockup and small-size behaviour would come from it.
4. **Legacy activity screens (stage 10f)** — restyle all 20 now, or restyle the
   5 reachable from Free Play (Memory, Balloon Pop, Shadow Match, Stories,
   Drawing) and defer the rest? All 20 is the honest answer to "consistently";
   5 is faster to a demo.
5. **Contrast target** — I have proposed AAA (7:1) rather than AA (4.5:1). It is
   the right call for this audience but it does constrain how light a colour can
   carry text. Confirm.

Say go — with answers to 1, 2 and 4 at minimum — and I will start at stage 10a.

---

*Screenshots referenced: `p10-shots/` (20 files). Scripts: `shot-p10-audit.mjs`,
`shot-p10-b.mjs`, `probe-p10.mjs`.*
