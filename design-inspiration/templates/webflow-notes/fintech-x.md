# Fintech X — fintech / SaaS business

- **URL:** https://webflow.com/templates/html/fintech-x-bank-website-template · demo: https://fintech-x-template.webflow.io/home-pages/home-v1
- **Category:** Business (banking/fintech, 4 home variants)

## Layout structure
Transparent nav over dark hero → split hero (text left, floating product render
right) → light `#F6F6F6` feature sections → alternating content/media rows → near-black
`#080808` footer.

## Hero pattern
Full-viewport dark band (deep desaturated navy-violet, ~`#333856`) with an 80px
Satoshi 500 white headline; one keyword gets a thick blue underline/highlight bar.
Right side: hero product image blended with a colorful pink/violet smoke render that
supplies all the color drama. Lorem-short subcopy, then two buttons.

## Color palette
Dominant: deep navy-violet `#333856` (hero/dark bands) and near-black `#080808`
(footer). Secondary: off-white `#F6F6F6` section ground. Accent: light cyan
`#7ED0E0`-ish (primary pill button) + electric blue highlight bar; imagery adds
pink/violet. Body text on light: mid-gray `#575757`.

## Typography
Satoshi (geometric grotesk; Google-font stand-ins: Manrope or Space Grotesk (headings) + Inter).
H1 80px/500 — hierarchy from scale and color contrast, not weight. Body ~16px gray.

## Spacing/whitespace
Full-height hero; generous 100-140px section padding; content max-width ~1200px with
wide gutters.

## CTA treatment
Fully-rounded pill buttons (border-radius 80px), light cyan fill with dark label +
small ↗ arrow glyph; secondary is a white-outline ghost pill on dark. "Get started"
repeated nav + hero + section ends. Arrow-in-button is the signature detail.

## Animation worth reusing
Heavy interaction use (60+ hooks): staggered fade-up of hero text on load, parallax
drift on the product render, hover lift + arrow slide on buttons. Reusable subset:
load-time staggered fade-up (translateY 20-30px, 500-700ms, 80-120ms stagger) and the
button hover where the ↗ arrow translates 2-3px diagonally.
