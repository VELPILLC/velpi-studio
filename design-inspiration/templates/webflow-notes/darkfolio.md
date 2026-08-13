# Darkfolio — dark portfolio (designer/art director)

- **URL:** https://webflow.com/templates/html/darkfolio-website-template · demo: https://darkfolio-template.webflow.io/
- **Category:** Portfolio / personal brand (dark)

## Layout structure
Minimal top bar (name only, left) → full-viewport typographic hero → work grid
("Selected work") → contact statement ("Let's make something great") → footer. A
floating pill-shaped dock nav (HOME · ABOUT · CONTACT) hovers at bottom-center of the
viewport — the signature element.

## Hero pattern
Pure typography: "DESIGNER AND ART DIRECTOR" uppercase at ~115px Satoshi 500 white on
charcoal, deliberately offset (line 1 indented right, line 2 flush left) for a
composed-asymmetry feel. Body paragraph is small and pushed to the bottom-RIGHT
corner. Negative space is most of the viewport.

## Color palette
Dominant: charcoal `#151515`. Secondary: white text. Accent: pale blush pink
`#FFD9D9` (active pill in the dock nav only). One tiny accent on near-black = very
fashionable; work thumbnails carry all remaining color.

## Typography
Satoshi 500 (uppercase display) + same family for body (Google stand-ins: Space Grotesk
or Archivo for display, Inter for body). Hierarchy from enormous scale jumps
(115px → 16px, almost nothing between).

## Spacing/whitespace
Extreme vertical air; hero is a full viewport with two text blocks pinned to opposite
corners. Section gaps ~160px.

## CTA treatment
No solid buttons at all besides the dock pills — contact is a giant text line. Pill
radius 100px, pale pink bg with dark text for the active state; inactive pills are
transparent with white text.

## Animation worth reusing
Zero Webflow interaction hooks — everything is CSS. The floating dock (position:
fixed; bottom offset; centered; pill background; backdrop feel via a solid dark bg)
is directly reusable and GHL-safe. Add simple CSS hover (background fade) on the
pills. Good reminder that a dark one-accent site needs no motion to feel premium.
