# Someday — bold creative agency

- **URL:** https://webflow.com/templates/html/someday-website-template · demo: https://someday-template.webflow.io/
- **Category:** Agency (colorful, personality-forward)

## Layout structure
Blue nav (text links only) → full-viewport blue hero: headline left, collage of 3
rotated photos right, yellow ↓ arrow bottom-left → white manifesto section → pale-blue
"Work highlights" → deep-blue "Our capabilities" → white "How we work" → pale-blue
contact section (giant email address as the heading) → deep-blue footer. Strict
color-alternation rhythm: blue / white / pale-blue / blue…

## Hero pattern
Split hero on saturated royal blue `#1B4089`: 64px Work Sans 600 white headline with
key phrases emphasized in pale periwinkle (`#C9D9FF`-ish) and uppercase — two-tone
emphasis inside one headline. Right: three overlapping photos rotated ±5-10° like a
casual collage. Hand-drawn-style yellow arrow anchors the scroll cue.

## Color palette
Dominant: royal blue `#1B4089`. Secondary: white + ice blue `#E8F0FF` (alternate
sections). Accent: warm yellow (arrow/details) + periwinkle highlight text. Feels
energetic but still two-hue disciplined.

## Typography
Work Sans 600/400 everywhere (free Google font). Emphasis via color + uppercase
inside headlines rather than size jumps. Big email-as-headline in the contact
section.

## Spacing/whitespace
Full-viewport hero; sections ~120px padding; collage bleeds toward the edge.

## CTA treatment
No solid buttons on the home page — nav text links, arrow cues, and the giant
clickable email. The color-block sections themselves act as CTAs. For client sites,
keep the giant-email contact section idea but add one real button.

## Animation worth reusing
9 hooks: photos in the collage drift/parallax slightly on scroll at different rates,
sections fade up. Reusable: the rotated-collage hero (static transforms: rotate(-7deg)
etc. — pure CSS, no pseudo-elements) with a gentle per-image translateY parallax on
scroll (transform-only, rAF + scroll listener in vanilla JS).
