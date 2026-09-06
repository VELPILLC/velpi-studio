# Sigmaphoto — Style Reference
> Monochrome gallery for precision instruments — a hushed white room where the only color that matters is the one that asks you to act.

**Theme:** light

Sigma's site reads like a museum exhibition catalog for precision optical instruments — entirely weight-400 typography, vast whitespace, and a single vivid cobalt-blue accent that punctuates an otherwise purely monochrome experience. Product photography dominates at near-full-bleed scale, shot against dark studio gradients that let matte-black lens bodies dissolve into shadow and re-emerge as sculptural objects. The editorial restraint — centered serif headlines, tiny all-caps section labels, text-only CTAs — signals confidence through quietness, with the single blue button (#0048ff) functioning as the only raised voice in an otherwise whispered conversation. Sharp corners, no shadows, no gradients, no decorative motion: every screen is a frame around a piece of glass and metal.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Slate Ink | `#333333` | Primary text, dominant borders, nav links — the workhorse dark that replaces pure black everywhere a softer edge is wanted | neutral |
| Pure White | `#ffffff` | Neutral form states, badge text, and quiet UI feedback where color should stay understated. Do not promote it to the primary CTA color | neutral |
| Onyx Black | `#000000` | Icon strokes, input borders, and hard-edge accents where maximum contrast is required | neutral |
| Warm Bone | `#faf7ef` | Secondary surface — a barely-warm cream that lifts cards off pure white without introducing visible color | neutral |
| Ash Gray | `#707070` | Muted helper text, secondary borders, disabled states — quieter than Slate Ink by two stops | neutral |
| Cobalt Signal | `#0048ff` | Primary action fill — the only chromatic color in the system, reserved for CTA buttons and live action moments | brand |
| Stone Gray | `#999999` | Tertiary borders and inactive icon strokes — the quietest neutral, used only when Ash is still too loud | neutral |

## Tokens — Typography

- **Sigma Sans** — sizes: 13px, 16px; weight: 400; line-height: 1.20–1.54; letter-spacing: -0.3100em, 0.0050em, 0.0060em, 0.0200em. Role: Navigation links, buttons, form labels, and utility micro-copy — the functional voice, compact and quiet
- **Sigma Serif Head** — sizes: 48px, 88px; weight: 400; line-height: 1.10–1.25; letter-spacing: -0.3px at 48px, -0.5px at 88px. Role: Display and hero headlines — a high-contrast didone-style serif at regular weight only, creating editorial authority without boldness
- **Sigma Serif** — sizes: 16px, 24px; weight: 400; line-height: 1.25; letter-spacing: -0.3100em, 0.0030em, 0.0050em, 0.0160em. Role: Subheadings, body paragraphs, and mid-size editorial text — the reading voice of the site, set at regular weight with generous line-height
- **Metropolis** — sizes: 14px; weight: 500; line-height: 1.14; letter-spacing: -0.0040em. Role: Rare medium-weight sans for emphasized micro-labels — the only weight above 400 in the system, used sparingly
- **Arial** — sizes: 13px; weight: 400; line-height: 1.2; letter-spacing: . Role: Arial — detected in extracted data but not described by AI
- **Times** — sizes: 16px; weight: 400; line-height: 1.2; letter-spacing: . Role: Times — detected in extracted data but not described by AI

## Type Scale

- heading-sm: 24px / lh 1.25 / ls 0
- heading: 48px / lh 1.25 / ls -0.3
- display: 88px / lh 1.1 / ls -0.5

## Spacing & Shape

- Radius — buttons: 0px, cards: 0px, inputs: 1px, tags: 0px
- Element gap: 16px; Section gap: 80px; Card padding: 16px; Page max-width: 1440px

## Components

### Promotional Banner
Role: Top-of-page announcement strip
Full-width bar, #333333 background, 13px Sigma Sans weight 400 in white, centered text with a 'SHOP NOW' link on the right. Height ~40px, no padding variations. This is the darkest surface on the site and the first element users see.

### Primary Navigation Bar
Role: Site-wide navigation
White background, 1px #333333 bottom border. Left: section links in 13px Sigma Sans uppercase (PRODUCTS, MADE IN AIZU, INSPIRATION, SUPPORT, NEWS). Center: SIGMA wordmark in 24px Sigma Serif Head. Right: utility links (LOG IN, SEARCH, CART (0)) in 13px Sigma Sans uppercase. Height ~60px, no fill, no shadow.

### Full-Bleed Hero Image
Role: Primary product showcase on landing
100vw width, ~100vh height or ~600px minimum. Dark studio gradient background (charcoal to black). Single camera lens centered, photographed in dramatic isolation. No overlay UI on the hero itself. Sharp corners, no border.

### Centered Editorial Text Block
Role: Product introduction copy on white
White background, max-width ~600px, centered horizontally. Headline in 48px Sigma Serif Head weight 400, #333333, slight negative tracking. Body in 16px Sigma Serif weight 400, #707070, 1.54 line-height, 20px paragraph spacing. No card chrome, no background fill.

### Text-Only Link CTA
Role: Exploration trigger ("EXPLORE MORE")
No background, no border, no button chrome. 13px Sigma Sans uppercase, #333333, with subtle hover underline. Vertically separated from body by 24–32px. This is the default interactive element on content sections.

### Cobalt Action Button
Role: Primary action (cart, checkout, form submit)
Filled rectangle, #0048ff background, white text in 13–16px Sigma Sans weight 400, 11px vertical × 16px horizontal padding, 0px radius. One button type in one color — no hover state variation needed since the color itself is the rarity.

### Section Label
Role: Content divider between editorial blocks
13px Sigma Sans uppercase, #707070, letter-spacing 0.08em, centered above a content band. Functions as a typographic section break replacing visual dividers.

### Product Feature Banner
Role: Full-bleed product spotlight with overlay text
Full-viewport image with a large white headline overlaid in 48px Sigma Serif Head weight 400. The text sits at left or center, directly on the dark image. A small "EXPLORE MORE" text link appears below the headline. This is the second-level hero pattern, used after the opening section.

### Ghost Form Input
Role: Search and form fields
1px #333333 border, 7px vertical × 11px horizontal padding, 1px border-radius, 13–16px Sigma Sans in #333333. No fill, no focus glow — the design trusts the border to do all the work.

### Product Card (Grid Context)
Role: Catalog or collection grid items
White background, 0px radius, no shadow, 16px padding around a product image. Image fills card with no rounding. Product name in 16px Sigma Serif, price in 13px Sigma Sans #707070. Minimal — the image carries the visual weight.

### Search Icon Trigger
Role: Utility action in nav
Text label "SEARCH" in 13px Sigma Sans uppercase, #333333. No icon button — the text IS the button. Hover adds underline.

### Cart Link with Count
Role: Utility action in nav
Text label "CART (0)" in 13px Sigma Sans uppercase, #333333. Count is inline, no badge background, no color emphasis — zero is treated identically to ten.

### Footer Navigation
Role: Site map and legal links
White or #faf7ef background, multi-column link lists in 13px Sigma Sans, #333333. 1px #333333 top border separator. No newsletter signup, no social icons in primary footer — these are utility links only.

## Do

- Use #0048ff only for filled primary action buttons — it is the system's single chromatic voice and loses all power if applied to anything else
- Set all headings at weight 400 — the site has no bold weights and adding them would break the editorial whisper
- Pair Sigma Serif Head for display with Sigma Serif for body — the serif-to-serif continuity is the site's typographic signature, not sans-to-serif
- Leave at least 80px of vertical breathing room between full-bleed image bands and centered text blocks
- Use the warm bone #faf7ef as a secondary surface instead of gray cards — it is warmer than gray and more distinctive than white
- Keep corners sharp: 0px radius on all cards, buttons, and images; 1px maximum on form inputs
- Place section labels (13px uppercase, #707070, 0.08em tracking) as typographic dividers between content bands rather than using visible lines

## Never

- Do not introduce any color other than #0048ff as an accent — the 0% colorfulness is the design
- Do not use bold or semibold weights in any font — weight 400 across all roles is deliberate, not a fallback
- Do not add box-shadows to cards or buttons — the flat system relies on whitespace and borders for separation
- Do not use rounded corners above 1px on any element — sharpness communicates precision and engineering
- Do not use gradients on buttons, backgrounds, or overlays — the only gradient is the photographic studio backdrop behind products
- Do not place multiple CTA buttons of different colors on the same screen — one blue button per view is the ceiling
- Do not use icon-only buttons in the navigation — Sigma labels every action in text, even SEARCH and CART

## Agent Prompt Guide

**Quick Color Reference**
- text: #333333
- background: #ffffff
- secondary surface: #faf7ef
- border: #333333
- muted text: #707070
- primary action: #0048ff (filled action)

**Example Component Prompts:**

1. *Full-bleed product hero*: Viewport-height image section. Dark charcoal-to-black photographic background. No overlay text, no UI elements. Product subject centered at ~40% width. 0px radius, full-bleed.

2. *Centered editorial intro*: White background, 80px top padding. Centered headline in 48px Playfair Display weight 400, #333333, letter-spacing -0.3px. Body text in 16px Cormorant Garamond weight 400, #707070, 1.54 line-height, max-width 600px centered. 32px gap to a text-only "EXPLORE MORE" link in 13px Inter weight 400, #333333, uppercase, 0.08em letter-spacing.

3. *Cobalt action button*: Filled rectangle, #0048ff background, 0px radius, 11px vertical × 16px horizontal padding. Text: "ADD TO CART" in 13px Inter weight 400, white, uppercase, 0.08em letter-spacing.

4. *Section divider label*: White background, 48px vertical padding, centered text "NEW PRODUCT" in 13px Inter weight 400, #707070, uppercase, 0.08em letter-spacing. No horizontal rules, no borders.

5. *Navigation bar*: White background, 1px #333333 bottom border, 60px height. Left: "PRODUCTS  MADE IN AIZU  INSPIRATION  SUPPORT  NEWS" in 13px Inter uppercase #333333. Center: "SIGMA" in 24px Playfair Display weight 400 #333333. Right: "LOG IN  SEARCH  CART (0)" in 13px Inter uppercase #333333.
