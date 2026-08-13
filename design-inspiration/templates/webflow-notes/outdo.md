# Outdo — conversion-focused studio/agency

- **URL:** https://webflow.com/templates/html/outdo-website-template · demo: https://outdo-template.webflow.io/
- **Category:** Agency (small studio, conversion-first)

## Layout structure
White nav (logo left, 3 links + solid blue button right) → pale-blue gradient hero
(text only, left-aligned) → grayscale client-logo strip → work case rows → pale-blue
testimonial band → "About the Studio" → pale-blue "Let's chat." CTA band → footer.
Only ~6 sections — deliberately short page.

## Hero pattern
Text-only hero on a very light blue gradient (white → `#EAF2FE`-ish). 64px Inter 600
near-black headline over three lines; subcopy is a paragraph with tiny inline emoji-
style icons (personality without imagery). A circular rotating-text badge sits
bottom-right of the hero — playful trust element. No hero photo.

## Color palette
Dominant: white + pale blue tint `#F4F9FD`. Secondary: near-black ink `#141618`.
Accent: friendly mid-blue `#5994FA` (all buttons, thin top announcement bar).
Monochrome-blue scheme = "trustworthy SaaS-ish agency."

## Typography
Inter for everything (600 headings, 400 body). Proof that a single free Google font
carries a whole premium site when scale/spacing do the work.

## Spacing/whitespace
Airy: hero ~70vh mostly empty; logo strip isolated with big padding; sections
~100-120px apart. Content max ~1140px.

## CTA treatment
Solid `#5994FA` blue rectangles with 2px radius, white label, no icon. Same button
repeated: nav, hero, each work row, CTA band. Tinted-band "Let's chat." section with
a giant heading + one button is the closer.

## Animation worth reusing
Light (17 hooks): fade-up on scroll per section, logo-strip items fade in with
stagger, hover on work images = slight scale (1.03) with overflow hidden. Reusable:
tinted-band CTA reveal and the grayscale→color transition on client logos (filter
isn't transform/opacity — skip the filter part, keep opacity 0.5→1 on hover).
