# Velpi Studio Pattern Library — recurring "premium" patterns

Synthesized 2026-08-13 from everything under `/design-inspiration/`:
8 HTML5 UP templates (CC-BY 3.0 — **attribution required if used**), 8 BootstrapMade
templates (BootstrapMade free license — footer credit required unless a license is
bought), 8 Colorlib templates from the official ColorlibHQ GitHub (MIT — no
attribution), 8 Webflow best-seller observation notes (no downloads;
`templates/webflow-notes/`), 3 icon sets (ISC/MIT — no attribution;
`icons/icons.md`), 25 font pairings (`fonts/font-pairings.md`), 28 palettes
(`colors/palettes.md`), and the animation catalog (`animations/animations.md`).

Everything below is framed for our stack: **single-file HTML, one `<style>` tag,
scoped `vp-` classes, vanilla JS, no pseudo-elements, GHL-compatible**. Patterns that
only work with Tailwind/React/Webflow-runtime machinery were dropped.

> **Images note:** every image inside the downloaded templates is a demo placeholder.
> Real client builds ALWAYS use the client's own photos (or images the client owns) —
> never ship a template's stock/demo photography.

---

## 1. Hero styles (ranked by observed frequency in the premium set)

**H1. Text-first hero (no photo in the first viewport).** 6 of 8 Webflow
best-sellers do this (Andersen, Outdo, Minerva, Brooke, Landon, Darkfolio): eyebrow →
huge headline (48–115px, weight 400–600, `clamp()` in our stack) → 1–2-line subcopy →
one primary button. Image arrives *below* as a full-bleed or offset band. Needs
discipline: 140–200px top padding and real copy. Best default for professional
services, luxury, editorial (pair with palettes 16–18, fonts #1–3, #23–25).

**H2. Split hero — text left, media right.** Fintech X, Someday, Haven Homes,
several BootstrapMade (Arsha). Modern versions rotate/overlap the media (Someday's
±7° collage — static CSS transforms) or float a product/render. Media never
squares-off symmetric: 55/45 or 60/40.

**H3. Full-bleed photo + scrim hero.** Lantern (hotel), Tavola (restaurant),
Selecao, most HTML5 UP. The observed premium execution: dark gradient scrim
(`linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.25))` as a stacked background
layer, not a pseudo-element), white display type ≥48px (large-text 3:1 zone — our
contrastFix models exactly this), single CTA. Trades/restaurant/hospitality default.

**H4. Dark statement hero on light page.** Fintech X's structure: dark navy hero
band, light body sections, near-black footer — dark bookends, light middle. Reads
premium without committing to full dark mode.

**H5. Statement-paragraph hero.** Landon: one 52px biographical sentence instead of
headline+subhead. Excellent for solo pros and local businesses with history ("Serving
Mundelein since 2003…"). Cheap to generate, hard to make look bad.

## 2. Nav styles

- **N1. Transparent → solid on scroll** (~half the collection; `is-solid` class swap,
  animations.md 3a). Pair with H3/H4.
- **N2. Hairline-ruled minimal header** (Landon, Brooke): logo left, 2–4 text links +
  arrowed contact link right, 1px bottom rule, no button chrome. Editorial niches.
- **N3. Nav with embedded CTA block** (Minerva): last nav item is a solid accent
  rectangle (even full-height). One accent block; everything else text.
- **N4. Floating pill dock** (Darkfolio): fixed bottom-center pill nav. Distinctive
  for portfolio/one-pagers; keep 3–4 items max. `position:fixed`, radius 100px.
- Mandatory for us either way: desktop nav shows real links (no hamburger on
  desktop — enforced by the builder's desktop rules).

## 3. Card & content layouts

- **C1. Tinted-card grid** (Landon, bs6-cards): neutral page, each card gets its own
  soft tint (blush/ice/lime at ~8-12% saturation) with fat inner padding (32-48px).
  Radius consistency matters more than value: pick 0, 8, or 16px sitewide.
- **C2. Numbered index rows** (Brooke, Andersen's client list, Caseworth's practice
  index): `01 / Title / meta / ↗` on one baseline, 1px hairline between rows,
  ~120-150px row height. The single most "designed-looking" list treatment that is
  also trivially GHL-safe (flex row + border-top). Use for services, projects, menus.
- **C3. Alternating media rows**: image/text, then text/image (order swap via
  `flex-direction: row-reverse` on even rows). Process pages, about sections.
- **C4. Logo strip**: single row, items at opacity .55 → 1 on hover, isolated by
  large padding (Outdo). Trust section that costs nothing.
- **C5. Stat band**: 3–4 large numerals (48-64px, same family as headings,
  `tabular-nums`) + small labels; animate with the counter (animations.md 4a).

## 4. Button / CTA treatments (match to brand voice — observed 1:1 correlation)

| Voice | Shape | Observed in |
|---|---|---|
| Luxury / trust (law, medical, high-end) | **0px radius**, solid ink or gold, generous x-padding | Minerva |
| Modern minimal (agency, portfolio) | **2–4px radius**, black or single accent | Andersen, Outdo |
| Friendly SaaS / consumer | **Full pill (99px)**, accent fill, ↗ or → glyph inside | Fintech X, bs6 |
| Bold / street | 0–4px radius, accent fill, uppercase 600-700 label | Instant, Ironworks |

Rules that held everywhere: ONE primary button style per site, repeated (nav, hero,
section ends, final band); secondary = ghost (1px border, transparent); hover =
translateY(-2px) or arrow nudge, never color inversion; label 15-17px, never
uppercase for luxury, always sentence case for minimal.

## 5. Section flow & rhythm

The observed premium page skeleton (local-business adaptation):

1. Nav (N1–N3)
2. Hero (H1–H5)
3. Trust strip — logos, review stars, or license badges (C4)
4. Services / offer — C1 cards or C2 index rows, 3–6 items
5. Signature section — ONE distinctive move: dark band with stat counters, marquee
   ticker, collage, oversized quote. Exactly one per page (every premium template
   does one big trick, not five).
6. Proof — testimonials (cross-fade 4d) or case row (C3)
7. Process / about — C3 rows or statement paragraph
8. Final CTA band — tinted or dark, giant heading + one button ("Let's chat." /
   giant-email pattern) — Outdo/Someday close
9. Footer — dark ink, 3–4 columns, quiet

**Band rhythm:** white → white → tint → white → dark → white → tint(CTA) → dark(footer).
Tint = 3–6% of the accent hue (`#F4F9FD`-style). Dark bands: max two per page plus
footer. Hard color-blocking (Someday) only for bold-voice brands.

**Spacing rhythm:** section padding 96–160px desktop / 64–96 mobile; content
max-width 1140–1240px; headline-to-body gap larger than body-to-CTA gap; whitespace
is the #1 separator between premium and stock — when in doubt, double it.

## 6. Typography rules (see fonts/font-pairings.md for pairings)

- Scale over weight: display 400–600 at 48px+ (`clamp(2.6rem, 6vw, 4.5rem)`), never
  800-900 except bold/street voice.
- Two families max (+ optional mono for numerals). Single-family sites (Inter,
  Work Sans) work when scale contrast is extreme (Outdo, Landon, Someday).
- Eyebrows: 12–13px, uppercase, +8-12% letter-spacing, accent or muted color.
- Body 16–18px, line-height 1.6–1.75, ink `#141618`–`#333` (not #000).
- Display line-height 1.05–1.2, letter-spacing −1 to −2% above 40px.

## 7. Icon usage (see icons/icons.md)

One set per site (Lucide/Tabler 2px stroke for trades/bold; Heroicons 1.5px for
medical/luxury/minimal). Inline SVG with `stroke="currentColor"`/`fill="currentColor"`
so section text color and the contrast pass govern icon color for free. 20-24px inline,
28-40px in cards, 44-56px only inside tinted chips. Icons are seasoning: services grid
+ contact row + trust badges, not every heading.

## 8. Animation policy (see animations/animations.md for the code)

The most expensive-looking templates animate the LEAST (Andersen: 2 hooks; Darkfolio:
0). Default kit per page: hero load-in (1c), fade-up per section (1a) with stagger on
grids (1b), one hover behavior per interactive family (2a-2e), optionally ONE
signature motion (marquee 3c, parallax collage 3b, or counters 4a) matched to the
signature section. Include the reduced-motion guard always. Nothing else.

## 9. License ledger (keep straight when borrowing patterns vs. assets)

| Source | License | Attribution in client work? |
|---|---|---|
| HTML5 UP templates | CC-BY 3.0 | **Required if any code/asset is reused** (footer credit). Patterns/ideas: no. |
| BootstrapMade templates | BootstrapMade Free License | **Footer credit required** unless paid license. Patterns/ideas: no. |
| Colorlib (ColorlibHQ/bootstrap-templates) | MIT | No attribution; keep MIT notice with redistributed source. |
| Webflow templates | **Observed only — nothing downloaded.** | Never copy assets/code from Webflow demos; notes describe reimplementable patterns only. |
| Lucide / Tabler / Heroicons | ISC / MIT / MIT | No attribution on sites; LICENSE files kept with the sets. |
| Google Fonts (all pairings) | OFL/Apache | No attribution required. |
| Template demo images | — | **Placeholders only. Never ship.** Client imagery always. |

Design *patterns* (layouts, rhythms, color logic) are not copyrightable and are safe
to reimplement from scratch in generated code; verbatim CSS/HTML/asset copying from
the CC-BY/BootstrapMade sets into client sites would trigger the attribution
requirements above — so the generator should treat this library as reference, not as
a snippet source (Colorlib MIT and the code in animations.md are the exceptions:
free to lift verbatim).
