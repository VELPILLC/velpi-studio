# Daniela and Moe Wedding 2019 — Style Reference
> Botanical wedding invitation on blush paper — editorial, hand-drawn, sun-warmed.

**Theme:** light

A warm, editorial wedding invitation language: a blush peach canvas, two-font system (delicate serif display + clean geometric sans), and oversized organic botanical illustrations that bleed off every edge. The palette is earthy and natural — deep navy ink for text, coral-vermillion as the single warm accent for borders and interactive moments, and muted greens, mustards, and dusty pinks living inside the foliage artwork. Layout is centered, generous, and almost magazine-like, with wide tracking on small-caps labels that whisper rather than shout. Every interactive element is a full pill (200px radius), every text block breathes with 32-48px vertical rhythm, and the overall feeling is hand-illustrated, sunlit, and unhurried.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Blush Canvas | `#fef1ec` | Primary page background, section backgrounds, hero canvas — the warm paper tone that carries every screen | neutral |
| Ink Navy | `#11223f` | Primary text, headings, nav links, body copy, input borders — the only dark anchor in the system | brand |
| Coral Vermillion | `#ff5734` | Outlined link/action borders, active nav underline, button borders — the single warm accent that gives interactive elements their warmth | brand |
| Dusty Peach | `#f6bba4` | Secondary surface tint, card accents, illustration fills — the softer sibling of the canvas | accent |
| Forest Ink | `#193c35` | Botanical illustration dark foliage — the deepest green in the artwork palette | accent |
| Olive Grove | `#7e813c` | Botanical illustration mid-tone leaves and stems | accent |
| Mustard Bloom | `#e5ba2b` | Botanical illustration flower accents — warm yellow punctuation in the foliage | accent |
| Ember Orange | `#ec4f22` | Botanical illustration bright flower highlights — the vividest warm note in the artwork | accent |
| Sage Mist | `#c6d7d0` | Botanical illustration soft greenery, dot patterns — the coolest note in the foliage | accent |
| Deep Indigo | `#092a49` | Botanical illustration line work, fine stroke details | accent |
| Pure White | `#ffffff` | Neutral form states, badge text, and quiet UI feedback where color should stay understated. Do not promote it to the primary CTA color | neutral |

## Tokens — Typography

- **Canela Web** — sizes: 24, 28, 32, 48, 120px; weight: 100, 400, 500; line-height: 0.85, 1.0, 1.2, 1.3, 1.4, 1.6, 2.0; letter-spacing: normal. Role: Display and headings — ultra-light 100 weight at 120px for the couple's names creates a high-contrast, fashion-editorial feeling. The 0.85 line-height at display size lets descenders and ascenders nearly touch. Mid-weights at 28-48px for section headings, all in serif italics where the brand allows.
- **Calibre** — sizes: 12, 16, 20, 24, 36, 48px; weight: 300, 400, 500; line-height: 1.2, 1.4, 1.6, 2.0; letter-spacing: 0.2em. Role: Body, UI, labels, and secondary headings. The 0.2em letter-spacing transforms body text into small-caps labels and tracked section markers ("OUR STORY", "OCTOBER 18TH 2019"). Weight 300 for body paragraphs, 500 for emphasis. This font carries all functional text while Canela handles the poetry.

## Type Scale

- caption: 12px / lh 1.6 / ls 2.4
- body-sm: 16px / lh 2 / ls undefined
- body: 20px / lh 1.6 / ls undefined
- subheading: 24px / lh 1.4 / ls undefined
- heading-sm: 28px / lh 1.3 / ls undefined
- heading: 36px / lh 1.4 / ls undefined
- heading-lg: 48px / lh 1.2 / ls undefined
- display: 120px / lh 0.85 / ls undefined

## Spacing & Shape

- Radius — buttons: 200px, cards: 0px, inputs: 0px, tags: 200px
- Element gap: 20px; Section gap: 80px; Card padding: 32px; Page max-width: 1200px

## Components

### Pill Navigation Button
Role: Top nav links and interactive links
Text-only with 1-2px solid bottom border in Coral Vermillion (#ff5734). Calibre weight 400, ~16px, letter-spacing 0.2em. No background fill. The colored underline appears on hover/active. 200px border-radius despite being text links — the pill system is universal.

### Outlined Pill Button
Role: Primary action buttons (RSVP, etc.)
1-2px solid border in Coral Vermillion (#ff5734), no fill, 200px border-radius. Padding approximately 6px 24px. Calibre weight 500, 12-16px, letter-spacing 0.2em, uppercase. White or blush background.

### White Quiz Card
Role: Fun Facts grid items
Pure white (#ffffff) surface, no border, no shadow, no radius. Padding ~20-32px. Contains a line-art icon (64-80px) centered above a Calibre 16px label. Icons are thin-stroke line illustrations in #000000 or coral.

### Botanical Illustration Frame
Role: Decorative section edges
Full-bleed organic foliage in #193c35, #7e813c, #e5ba2b, #ec4f22, #c6d7d0. Flat vector style with no gradients. Abstract shapes that bleed off page edges. No border, no container — the illustration IS the container.

### Section Label

Calibre weight 400, 12-14px, letter-spacing 0.2em, uppercase, color #11223f. Centered above headings. Acts as a typographic anchor that creates editorial structure.

### Hero Name Display
Role: Couple's names centerpiece
Canela Web weight 100, 120px, line-height 0.85, color #11223f. Centered. The × or & between names is rendered as a thin coral line. No bold — the ultra-light weight is the signature.

### Date Eyebrow
Role: Date label above hero name
Calibre weight 400, 14-16px, letter-spacing 0.2em, uppercase, color #11223f. Centered. Sits 32-48px above the display name.

### Line-Art Icon
Role: Quiz card icons, decorative marks
Thin-stroke (1-1.5px) line illustrations in #000000 or #11223f. No fill, no color. Organic, hand-drawn quality. Size 60-80px. Abstract and minimal.

### Body Paragraph
Role: Long-form story text
Calibre weight 300, 20px, line-height 1.6-2.0, color #11223f. Max-width ~600px centered. Generous line-height creates the breathing room of editorial print.

### Section Heading (Serif Caps)
Role: Section titles ("DANCE, DANCE, DANCE")
Canela Web weight 400, 28-36px, uppercase, letter-spacing slightly tracked, color #11223f. Centered. Serif caps creates a typographic counterpoint to the sans-serif labels.

### Quiz Grid Container
Role: Fun Facts card grid
4-column grid of white cards on blush canvas. Gap ~4px between cards (tight grid). The grid sits inside a blush border frame. Each cell is equal-width.

### Hover Underline
Role: Interactive feedback for links and nav
1-2px solid line in Coral Vermillion (#ff5734) appears below text on hover. No color change, no background — just the underline materializing. Minimal, quiet interaction.

## Do

- Use 200px border-radius on every button, tag, and pill-shaped element — the pill is the only shape language in the system
- Apply 0.2em letter-spacing to all Calibre text, especially labels, nav, and small caps
- Use Canela Web weight 100 at 120px for the hero name display — the ultra-light serif is the signature
- Set page backgrounds to Blush Canvas (#fef1ec) — never use pure white for section backgrounds
- Use #11223f for all text — never default to #000000 for body copy
- Let botanical illustrations bleed off page edges — contain them in rectangles and the design loses its hand
- Keep cards borderless and shadowless — depth comes from white-on-blush contrast, not elevation

## Never

- Don't use bold weights (600+) for headings — the system whispers with 100-400 weights
- Don't use sharp corners on interactive elements — 200px pill radius is mandatory for buttons and tags
- Don't add drop shadows or box-shadows anywhere — the flat aesthetic is intentional
- Don't use #000000 for body text — use #11223f (Ink Navy) for warmth
- Don't use multiple accent colors for actions — Coral Vermillion (#ff5734) is the only warm accent
- Don't center-align long paragraphs — body text should be max-width ~600px, left-aligned within its centered container
- Don't use system fonts or sans-serifs for display text — Canela Web (or a quality serif substitute) is required for the hero and section headings

## Agent Prompt Guide

## Quick Color Reference
- Primary text: #11223f (Ink Navy)
- Canvas/background: #fef1ec (Blush Canvas)
- Card surface: #ffffff (Pure White)
- Accent/interactive: #ff5734 (Coral Vermillion)
- Secondary surface: #f6bba4 (Dusty Peach)
- primary action: #ff5734 (filled action)

## Example Component Prompts

1. **Hero Name Display**: Canela Web weight 100, 120px, line-height 0.85, color #11223f, centered. A thin coral (#ff5734) × or & symbol between the two names. Above it, a Calibre 14px date label with 0.2em letter-spacing, uppercase, centered, 40px gap.

2. **Pill Navigation Button**: Calibre weight 400, 16px, letter-spacing 0.2em, uppercase, color #11223f. No background. On hover, a 1-2px solid bottom border in #ff5734 appears. Padding 8px 12px. Top of page, horizontally centered with 24-32px gaps between links.

3. **White Quiz Card**: Background #ffffff, no border, no shadow, no border-radius. Padding 24px 20px. Contains a 64px thin-stroke line-art icon in #000000 centered above, and a Calibre 16px label centered below. Arranged in a 4-column grid with 4px gaps.

4. **Section Heading Block**: Calibre 12px label with 0.2em letter-spacing, uppercase, color #11223f, centered. 24px gap below. Canela Web weight 400, 32px, uppercase, color #11223f, centered. 32px gap below. Calibre weight 300, 20px, line-height 1.6, color #11223f, max-width 600px, centered.

5. **Outlined Action Button**: Calibre weight 500, 14px, letter-spacing 0.2em, uppercase, color #ff5734. 1-2px solid border in #ff5734, no fill. Padding 8px 24px. Border-radius 200px. Background transparent over blush canvas.

## Illustration System

Botanical illustrations follow a strict flat-vector, no-gradient, organic-shape style. Only these colors are permitted in artwork: #193c35 (deepest dark), #7e813c (olive), #e5ba2b (mustard), #ec4f22 (ember), #c6d7d0 (sage), #f6bba4 (peach), #11223f (fine line work). Shapes should feel hand-cut and asymmetric — leaves, flowers, stems, and organic blobs. Illustrations always bleed off at least one page edge. No photographic elements, no 3D, no shadows within artwork.
