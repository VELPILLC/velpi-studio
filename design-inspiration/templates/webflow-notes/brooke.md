# Brooke — minimalist designer portfolio

- **URL:** https://webflow.com/templates/html/brooke-portfolio-website-template · demo: https://brooke-template.webflow.io/
- **Category:** Portfolio (freelancer)

## Layout structure
Unconventional header: name (left) · tiny inline photo + 3-line intro sentence
(center) · "Menu" text link (right) — the header IS the hero copy. Below: a giant
horizontal text marquee ("Digital designer") → "Recent work" as a numbered index list
(01 / project name / year / one-liner / ↗ arrow, thin rule between rows) → about →
footer.

## Hero pattern
No hero block at all — a small factual intro sentence up top, then an oversized
scrolling text ticker (~200px letters) where a hero image would be. Duplicated words
alternate solid black / light gray for depth. Work list starts immediately after.

## Color palette
Dominant: warm light gray `#F7F7F7`. Secondary: black ink + mid-gray `#898989` for
secondary text. Accent: none — grayscale until project imagery appears. "Open for new
work" status line in gray acts as a soft trust signal.

## Typography
Inter Display throughout, mostly weight 400 — even the giant marquee is regular
weight, scale does everything. Numbered-index rows use small numerals + large project
names on one baseline.

## Spacing/whitespace
Header compressed; then a massive empty band around the marquee; list rows are tall
(~140px) with 1px hairline dividers. Feels like a printed index sheet.

## CTA treatment
No buttons anywhere — links are plain text and ↗ glyphs. For client work this is too
quiet, but the numbered work-index row pattern (number / title / meta / arrow) is a
premium list treatment worth stealing for service or project lists.

## Animation worth reusing
The infinite horizontal marquee: pure translateX loop, duplicated content for
seamlessness — implementable with CSS `@keyframes` translateX(−50%) on a doubled
inline-flex track (transform-only, GHL-safe). Row hover: arrow translates 4px
diagonally, row background lightens. Both cheap and effective.
