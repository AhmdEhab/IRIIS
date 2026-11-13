# IRIS — Phase 10 implementation report
## Brand identity → UI system → consistent application

Implemented against `PHASE10_UI_AUDIT_AND_DESIGN_PROPOSAL.md`. All decisions
Section 8 left open were made here and are justified below.

**Status: 🟢 complete and verified.** 119/119 unit tests, 15/15 QA suites,
clean build, 0 page errors across the full flow, 0 horizontal overflow at six
widths, and every measured text node meets WCAG AAA.

---

## 1. The measured result

| | Before (audit) | After |
|---|---|---|
| Off-palette Tailwind colour utilities | **761** | **0** |
| Gradients | **102** | **0** |
| Distinct corner radii | **21** | **5** (+ `rounded-full`, + 4 logical corner resets) |
| Brand-token utilities | 787 | **1,344** |
| Screens using the shared frame | 0 | **12 via `ScreenFrame` + all 20 legacy activities via `ChildShell`** |
| Brand components with **zero** render sites | **4 of 8** | **0 of 24** |
| Pure-white surfaces / borders | 92 | **0** |
| Glassmorphism surfaces | 4 | **0** |
| Text below WCAG AAA | not measured | **0 of 280 sampled nodes** |

The palette number is the one that matters most: the audit found the product
was half-branded, with the seam running along the `iris/` directory. That seam
no longer exists.

---

## 2. Design decisions I made

### 2.1 Mascot — **Mascot A** (the cream plush figure with the petal crown)

Three reasons, in order of weight:

1. **It is what the app already draws.** `IrisBuddy.tsx` is Mascot A, built as
   SVG with nine real expression states, and its file header says it was drawn
   from the two supplied avatar references. Adopting Mascot B would have meant
   redrawing nine states of a new character — a large amount of new artwork
   introduced during a *consistency* phase, with a real risk of the moods
   drifting apart.
2. **It is the more legible character for this audience.** Mascot A is a
   simpler silhouette: one rounded body, a fixed face, a colour crown. Mascot B
   has arms, legs, a waving pose and clothing, so its outline changes between
   states. A companion a child must re-recognise on every screen should be the
   one whose shape stays still.
3. **It carries the whole palette.** The petal crown cycles all five brand
   colours, so the character *is* the identity rather than one colour from it.
   Mascot B is predominantly yellow and red.

Mascot A now appears in Child Home, the assessment, practice, the celebration,
every empty state, and — this is the important one — as the face of Ask IRIS.
**Mascot B is not used anywhere in the product.** It remains a perfectly good
marketing character; it is just not the in-product companion, and mixing the
two was the thing to avoid.

### 2.2 Typography — **Baloo 2 / Baloo Bhaijaan 2 for display only**

Added, in one role. The brochure's headlines are heavy rounded display caps;
Quicksand's heaviest weight is 700 with geometric terminals, and scaled up it
reads as "large body text" rather than as a headline. Baloo 2 has the chunky
rounded terminals the printed lettering has, and **Baloo Bhaijaan 2 is its
Arabic sibling from the same superfamily** — so a bilingual heading does not
change personality when the language flips. That pairing is why Baloo and not
one of the other rounded display faces.

It is used **sparingly** — one display line per screen — because the identity
pack is explicit that not every line should look handwritten. Body, UI and all
controls stay Quicksand / Cairo, unchanged.

Accessibility was not traded for it: the display face never carries body copy,
and the stacks fall back to the **body** fonts rather than to a generic serif,
so if the Google Fonts request fails the headings degrade to bold
Quicksand/Cairo — exactly where the product was before Phase 10.

> ⚠️ **One thing you should check on your machine.** This container has no
> route to `fonts.googleapis.com`, so **no web font loads in any screenshot I
> took** — not Baloo, and not Cairo or Quicksand either, which the app has
> always loaded from there. Everything you see rendered is the local fallback.
> The layout, colour, components and spacing in the screenshots are real; the
> letterforms are not. Open the app on your machine to see the intended type.

### 2.3 Legacy activity screens — **a shared frame, not 20 restyles**

All 20 are covered, and none of them was individually redesigned.

`App.tsx` already wrapped every child screen in `ChildShell`. So `ChildShell`
became the real frame — ground, top bar, back control, star count, language,
and one dominant accent — and all 20 inherited it in a single change, with
**`App.tsx` untouched and no game's logic modified**.

The back button is the neat part. Each legacy screen renders its own
`<BackButton onClick={…}/>`, previously `fixed top-6 left-6` with a glass
background — which collided with everything and stayed on the physical left in
Arabic, where "back" is on the right. Rather than edit 22 files, `BackButton`
now **registers its handler with the frame through context and renders
nothing**; the frame draws one correct control in the top bar. If a screen is
ever used outside the frame, the button falls back to drawing itself, so
nothing can become unreachable.

Colour and weight were then normalised **mechanically**, by scripts whose
mapping tables are reviewable in one place rather than by 20 separate
judgement calls:

- `scripts/palette-sweep.mjs` — 15 off-palette hues → the 5 brand hues, cool
  greys → the warm neutral ramp, gradients collapsed to a single brand wash.
  **457 utilities across 57 files.**
- radius sweep — 21 radii → 5. **223 utilities.**
- elevation sweep — `shadow-2xl/3xl`, 8px white rings, glass → 3 shadow steps
  and one hairline. **330 utilities.**
- heading sweep — heading sizes → the type scale; **only headings**, because a
  `text-9xl` on a `<div>` holding 🏆 is content, not typography.

Each screen's accent was assigned **by counting its own markup**, not by taste:
Memory Game is green because 24 of its colour classes are green. Assigning
otherwise would have put a purple frame around a green game — a more visible
mismatch than leaving it alone.

### 2.4 Contrast target — **AAA (7:1)**, and it changed the palette

I kept the proposal's AAA target, then measured it on the running app rather
than assuming it. `qa-contrast.mjs` walks 280 visible text nodes across 11
screens and computes each one's real ratio against its effective background.

The first run found **21 failures**, and they were not where a static check
would have looked:

- The `-ink` colours were tuned in Phase 3 for 4.5:1 **on the ground**. Their
  most common real use is as text on their **own wash** — inside a `Pill`, a
  tinted card, a chip — and there they measured as low as **3.95:1**, below
  even AA. All five were retuned to clear 7:1 against all four light grounds.
- `--muted-text` measured **5.48:1**. It carries the caveats, the "not measured
  yet" notes and the demo labelling. Darkened to 7.06:1.
- White on bright coral was **3.22:1** and on bright green **2.49:1** — below
  even the large-text bar.

Second run: **0 failures.** Section 3.1 has the resulting palette.

---

## 3. How the colour system works

### 3.1 Three roles per hue, not one

The five brand colours are unchanged. What changed is that each hue now has
three values with three jobs, because one value cannot do all three:

```
            FILL        INK (text)   SOLID (fill under white text)   WASH
blue        #1F67B1     #18508A      #1F67B1                         #E5EFF9
coral       #F45B63     #863236      #C84B51                         #FDE9EA
yellow      #FECA34     #614D14      — (carries INK text, 10.3:1)    #FDF3D8
green       #49B87A     #23583B      #358458                         #E6F5ED
purple      #8060B4     #5A437E      #8060B4                         #F0EAF8

GROUND #FEF6EA · GROUND-TINT #FBF0DE · SURFACE #FFFCF6 · SURFACE-SUNK #F7EDDA
INK #2A2118 (13.6:1) · INK-MUTED #594D40 (7.1:1) · INK-FAINT #9A8B77 (2.9:1)
```

- **FILL** — icon plates, decorative shapes, progress dots. Never under text.
- **INK** — brand colour *as* text. 7:1+ on every light ground the app has.
- **SOLID** — the lightest value that carries white at 4.5:1, so a play button
  stays recognisably coral instead of turning maroon. Yellow has no such value
  (a yellow dark enough for white is not yellow), so yellow buttons take ink
  text at 10.3:1.
- **INK-FAINT is decorative only.** It is 2.9:1 and is now banned from carrying
  information; 45 places where it was carrying real sentences were promoted.

### 3.2 One dominant colour per screen, enforced mechanically

The brochure never puts five colours on one panel. `ScreenFrame` takes an
`accent` and publishes it on the screen root as `--screen-accent` /
`-ink` / `-wash`. Section rules, progress, empty states, focus decoration and
default card tones all read from it.

A screen therefore **declares its colour once** instead of repeating it thirty
times — and a screen using too many colours is visible in one place. The five
presets are `data-attribute` rules in `iris.css` rather than classes, so
Tailwind's scanner can never tree-shake a runtime-chosen accent away.

| Surface | Accent | Surface | Accent |
|---|---|---|---|
| Landing / login / registration | blue | Ask IRIS | purple |
| Parent home / progress / snapshot | blue | Community | coral |
| Home Tips | yellow | Specialists | blue |
| Child Home | yellow | Assessment | green |
| Practice | coral | Rewards | yellow |

The 20 legacy activities get theirs from `SCREEN_ACCENT` in `ChildShell`.

---

## 4. Components introduced and refactored

### New (12)

| Component | Why it exists |
|---|---|
| `ScreenFrame` | The one page wrapper: ground, accent, top bar, width, RTL, child-mode touch floor, optional vertical centring |
| `TopBar` | The single navigation bar — replaces 40 bespoke back controls **and** the floating `GlobalControls` |
| `BarButton` / `BarAction` | The only unlabelled controls in the product; `BarButton` **requires** a label prop |
| `ChromeActions` | Mute + language, in the layout instead of on top of it |
| `Button` | primary / secondary / quiet / play, with an **honest disabled state** |
| `DisplayTitle` | The brochure headline, with an optional dashed arc |
| `Mark` | The brochure's yellow marker swipe — a background, so text stays selectable and screen readers hear words, not "highlight" |
| `SectionTitle` | Accent-driven section header |
| `StepDisc` | The brochure's numbered coloured disc |
| `InfoTile` | The **non-interactive** sibling of `ActivityTile` |
| `EmptyState` / `ErrorState` / `Celebration` | One treatment each, mascot-led |
| `Logo` | Master lockup, three sizes, clear space enforced |
| `Field` + `inputClass` | Always-visible labels, described-by wiring, real error association |
| `BrandIcon` | **~45 drawn icons**, one 24×24 grid, 2px round strokes, two tones |

### Refactored (previously dead or drifting)

`ActivityTile`, `ParentCard`, `ProgressTrack`, `StarCount` — all four had **zero
render sites** and are now the real components on Child Home, Parent Home and
every activity. `Surface` had a **latent bug**: `tone` layered a wash class on
top of `bg-surface`, and which won depended on Tailwind's generated order — in
practice the tone did nothing, which is why the Learning Snapshot's confidence
banner had been rendering plain white. Fixed by choosing the background once.

`LadderProgress` now renders `ProgressTrack` dots instead of drawing its own
filled bar. A bar reads as "how much is left to endure"; dots read as "how many
we have collected", which is the register the rest of Child Mode is written in.

**Removed:** `StepRow`, `LoadingState` and `Modal` — I wrote them, nothing
rendered them, and shipping unused components is the exact failure this phase
exists to undo.

### Icons

`BrandIcon` replaces interface emoji throughout: section headers, parent cards,
activity tiles, progress steps, mode cards, audio controls. Emoji are rendered
by the operating system, so IRIS looked like a different product on Windows,
iOS, Android and Linux — none of which looked like the brochure.

**Game content emoji stay.** The apples and lions inside Memory Game, the
animals, the story characters are the material the child is working with, not
interface furniture, and redrawing 40 animals would be a different project with
no brand payoff.

---

## 5. Screens redesigned

**Entry:** Splash · Landing · Login · Registration
**Parent Mode:** Home hub · Learning Snapshot · Progress & Insights · Home Tips
(3 views) · **Ask IRIS** · Community · Specialists
**Child Mode:** Child Home · ladder assessment · ladder practice · celebration
**Legacy activities (20, via the shared frame):** Stories · Animals · Letters ·
Numbers · Colors · Life Skills · Songs · Drawing · Shapes · Fruits · Vehicles ·
Rewards · Memory Game · Games Hub · Balloon Pop · Shadow Match · Body Parts ·
Emotions · Transition · Syndrome Teaching Demo

### Ask IRIS, specifically

The brief singled this out, and it was the worst offender: a plain header, grey
suggestion pills, a large empty void and a blue Send — a generic AI wrapper
bolted onto the side of the product.

- **IrisBuddy is the assistant.** Present before the first message, changes
  mood while answering, and every reply visibly comes *from* it — the same
  companion the child sees. That is the point: one product, not an app with a
  bot in it.
- Replies are warm surface cards beside the companion, not full-width bands.
- The empty state is a greeting plus **brochure-style coloured question tags**
  cycling the five brand colours, not grey chips in a void.
- The composer is a rounded warm field with a drawn send mark.
- **The medical disclaimer stays exactly where it was**, and takes the marker
  swipe — it is the most important sentence on the screen, so it is emphasised
  rather than shrunk.

Not one line of the retrieval logic changed. `answerParentQuestion` is called
with the same arguments and every `meta` branch renders the same sections.

---

## 6. Architectural changes

1. **One token layer, not three.** `theme.css` used to *define* `--background`
   and `--primary` alongside `iris.css`. It now maps shadcn's names onto the
   brand tokens. The `.dark` block is gone (a cool grey ramp that would have
   destroyed the warm identity the moment anything toggled it), and the last
   oklch `--sidebar-*` leftovers with it.
2. **New token families:** a 7-step type scale, motion tokens, `--radius-pill`,
   the `--screen-accent` machinery, and the `-solid` fills.
3. **Typographic roles as classes.** `t-display` / `t-title` / `t-heading` /
   `t-body-lg` / `t-body` / `t-small` / `t-label` bind family, size and
   line-height together, because a heading that takes the display size but not
   the display face is the exact drift being undone.
4. **The app root paints the brand ground.** It was `bg-white`; the app only
   *looked* warm because a decorative component painted the ground behind it.
5. **`GlobalControls` is retired.** Its two controls live in `TopBar` now.
6. **`ChildShell` is the legacy frame**, with a back-button slot via context.
7. **`qa-brand.mjs` and `qa-contrast.mjs` are new build-time guards.** The
   first checks *adoption*, not just token existence — a check that only asked
   "do the tokens exist?" would have passed during the audit too. The second
   measures real contrast in a real browser.

---

## 7. Tests performed

| | Result |
|---|---|
| `npm test` | **119/119** |
| `npm run build` | clean |
| `npm run demo` — diagnosis blindness | **IDENTICAL OUTCOMES ACROSS ALL 5 DIAGNOSES: PASS** |
| `qa-brand` (new) | **ALL CHECKS PASS** — 38 checks |
| `qa-contrast` (new) | **280 nodes, 0 below AAA** |
| `qa-a11y` | 16/16 |
| `qa-integration` | 15/15 |
| `qa-journey` | 42/42 |
| `qa-ladders` | 54/54 |
| `qa-security` | 29/29 |
| `qa-demo-data` | 34/34 |
| `qa-voice` · `qa-tts` | 19/19 · 19/19 |
| `qa-stories` · `qa-audio` · `qa-companion` · `qa-resilience` · `qa-demo-visual` | 18/18 · 14/14 · 12/12 · 7/7 · 10/10 |
| Live flow: landing → login → parent hub → all 6 sections → assessment (70 items) → snapshot → practice (14 items) → child home → 4 legacy games | **0 page errors, 0 console errors** |
| Horizontal overflow at 360 / 390 / 768 / 820 / 1024 / 1440 | **0px at every width** |

### Two test findings worth naming

**One regression I caused, and reverted.** While rewriting the login screen I
also reworded three Arabic strings into Egyptian Arabic. That was outside the
brief — Phase 10 owns the layout, not the words — and it broke
`qa-integration`, which finds the registration link by matching
`ليس لديك حساب؟`. The fix was to put the copy back, not to update the test.

**One assertion I did change, deliberately.** `qa-integration` asserted the
literal `⭐` character was in the page while inside a legacy game. Phase 10
replaced interface emoji with drawn marks, so that assertion was pinned to an
implementation that was intentionally removed. It now checks the actual
behaviour — the star counter exists, is exposed as a status to assistive tech,
and shows a number — which is a **stronger** check than the character match.

---

## 8. Accessibility

- **AAA (7:1)** for body text, 4.5:1 for large — verified live, not asserted.
- `ink-faint` is decorative-only and banned from text.
- Touch targets: **44px** minimum everywhere, **56px** in Child Mode (top-bar
  chrome excepted, or the bar grew taller than the content at 390px).
- Focus ring: 3px solid brand blue + 6px halo, `!important` on longhands so no
  utility can quietly remove it.
- Never colour alone — every state carries text or shape.
- Reduced motion removes all decorative motion, including the always-on
  rotating background discs on Splash, which are simply gone.
- RTL: logical properties throughout; back chevron follows writing direction;
  chat-bubble tails switched from physical (`rounded-tr`) to logical corners,
  so under RTL the tail no longer points away from its speaker; Arabic is never
  letter-spaced or uppercased.
- `BarButton` **cannot** be constructed without a label.

---

## 9. Known issues and honest limits

1. **Web fonts do not load in this container**, so no screenshot shows Baloo,
   Cairo or Quicksand. Please open the app on your machine to judge the type.
2. **Home Tips has three top bars, one per view** (list → category → tip).
   Correct behaviour, but the three views are still three code paths rather
   than one; a future pass could collapse them.
3. **`IrisActivityScreen`, `IrisAssessmentScreen`, `AIAssessmentScreen` and
   `ChildModeScreen`** are on the token system and inside the frame, but did
   not get individual layout attention — they are reachable but off the main
   routed flow.
4. **The Learning Snapshot showed a duplicated "what to observe" line** in
   testing. That is engine data, not styling, and I left it alone.
5. Carried over from Phase 9, unchanged and still open: practice results are
   not POSTed to the backend; the dialect-distance list needs an Egyptian
   speech-language specialist; there are no numeracy home activities; **the
   ElevenLabs API key still needs rotating**; and `scripts/check-voice.mjs`
   still needs running on a machine that has the key.

---

*Screenshots: `p10-after/` (26 files, real running app, 1000px and 390px, both
languages). Scripts: `qa-brand.mjs`, `qa-contrast.mjs`, `shot-p10-final.mjs`,
`scripts/palette-sweep.mjs`.*
