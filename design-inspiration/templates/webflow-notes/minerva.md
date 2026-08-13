# Minerva — professional services (law firm)

- **URL:** https://webflow.com/templates/html/minerva-website-template · demo: https://minerva-template.webflow.io/
- **Category:** Business / professional services (law demo "Nemea Advocacia")

## Layout structure
White nav with a full-height gold CTA block flush to the right edge → editorial hero
(eyebrow + serif headline + subcopy, no hero image in the viewport) → offset photo
band → dark "Practice areas" section (`#12151C`) → light about/history section → dark
testimonial section with a solid gold sub-panel → news/blog cards → CTA band →
contact section → footer.

## Hero pattern
Text-first editorial hero: small uppercase letter-spaced gold eyebrow ("NEW YORK
LAWYERS"), then a 64px Source Serif Pro 700 two-line headline in near-black, then a
2-line muted paragraph. The photo arrives *below* as an asymmetric band that doesn't
touch the left viewport edge. A gold square scroll-indicator button (↓) overlaps the
photo's top-right corner — nice depth cue.

## Color palette
Dominant: white. Secondary: near-black ink `#12151C` (text + dark bands). Accent:
muted tan-gold `#C0A684` (buttons, eyebrow, nav block, testimonial panel). Classic
60/30/10 executed literally; reads instantly as "established firm."

## Typography
Source Serif Pro 700 headings (free Google font) + Barlow body — authoritative serif
over a cool grotesk. Eyebrows: ~12-13px uppercase, wide tracking, gold.

## Spacing/whitespace
Editorial: huge top padding before the hero text (~180px), 120px+ between sections;
asymmetric grids (content pushed left, air on the right).

## CTA treatment
Sharp-cornered rectangles (border-radius 0), solid gold with white label, plus an
arrow glyph; the nav CTA is a full-height colored block, not a floating button.
Zero-radius + serif = the "trust" look.

## Animation worth reusing
~27 interaction hooks: slow fade-in on hero text (opacity + slight translateX for the
eyebrow), scroll-triggered fade-up per section, subtle photo scale-on-hover for news
cards. The overlapping scroll-down square is static but reads as crafted. Reusable:
eyebrow slide-in (translateX −16px→0 + fade, 600ms) then headline fade-up 100ms later.
