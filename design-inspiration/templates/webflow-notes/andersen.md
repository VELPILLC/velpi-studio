# Andersen — agency/portfolio (Medium Rare)

- **URL:** https://webflow.com/templates/html/andersen-website-template · demo: https://andersen-template.webflow.io/home/home-1
- **Category:** Agency / Portfolio / Consulting ("Scandi minimalism" positioning; one of the top-selling agency templates of 2026)

## Layout structure
Sticky white nav → oversized text-only hero → full-bleed image band → intro statement
section → work grid → team grid (2×3 portraits with small name/title captions) →
"Selected Clients" list (rows: client name left, service right, thin rules between) →
testimonial cards → short centered CTA line + small button → black footer.

## Hero pattern
No photo in the hero itself: a ~51px weight-400 grotesk headline, left-aligned, with
a very tall empty band above it (whitespace is the design), one small black button,
then a full-width edge-to-edge photo *below* the fold line. Headline case: sentence
case, tight letter-spacing (−0.5px).

## Color palette
Strict monochrome: `#FFFFFF` ground, `#000000` text/buttons/footer, imagery supplies
all the color. No accent hue at all — the "accent" is pure black.

## Typography
Single family throughout (BDO Grotesk — a neutral grotesk; Inter/Archivo are the
Google-font equivalents). Headings weight 400 at display sizes — scale, not weight,
carries hierarchy. Body 16px.

## Spacing/whitespace
Extreme: hero is ~60% empty space; sections separated by 120–160px+; client list uses
thin 1px rules and generous row padding instead of cards.

## CTA treatment
Small rectangular black buttons (4px radius, wide horizontal padding, white 16px
label, sentence case). Repeated mid-page and before footer as a single centered
sentence + button. Quiet, not shouty.

## Animation worth reusing
Very restrained — a couple of scroll-triggered fades only (2 interaction hooks on the
whole page). The premium feel comes from stillness; hover states are simple opacity
shifts on work items. Reusable: fade+rise on section entry, nothing else.
