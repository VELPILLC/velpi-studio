# Boostinsurance — Style Reference
> Abyssal mission control

**Theme:** dark

Boost Insurance inhabits an abyssal command center: deep teal canvas, faint topographic grid lines, and bioluminescent lime-green accents that feel switched-on against the matte dark surface. The platform is rendered as floating glass UI cards — slightly translucent, subtly bordered, rounded generously — floating over the dark ocean of the page, suggesting infrastructure and scale rather than personality. Typography does most of the talking: an enormous light-weight display cut (Gellix at 90–120px) with tight negative tracking, paired against a quiet, readable body. Color is rationed — a single signature cyan-to-lime gradient powers the primary action and a few under-line flourishes, while the rest of the surface stays deep teal, off-white text, and barely-visible hairline borders. The overall density is spacious and confident, with breathing room between every section and section transitions that feel like descending deeper into a system rather than scrolling a brochure.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Abyss Teal | `#002025` | Page canvas and dominant surface — the deep-ocean background that carries every section; large bordered card fills also read as this token because the surface stack collapses into a single dark plane | neutral |
| Slate Reef | `#244348` | Mid-tier surface and dividers — floating card fills slightly lighter than the canvas, section dividers, hairline borders around hero card and feature blocks | neutral |
| Tidewater | `#455c60` | Elevated surface and heavier borders — used for raised card surfaces and stroke weights where more separation from the canvas is needed | neutral |
| Lichen | `#54696c` | Muted surface accent and softer card borders — for secondary container backgrounds and quieter stroke treatments | neutral |
| Deep Kelp | `#05333a` | Lowest-elevation surface behind content inside dark cards — used for card padding interior fills where the outer card is lighter | neutral |
| Storm Glass | `#7d8f92` | Muted body text and secondary borders — helper text, captions, inactive icon strokes, and quiet UI labels | neutral |
| Sea Mist | `#9eaeb0` | Tertiary text and border — for less-emphasized copy and fine dividers that should recede further than Storm Glass | neutral |
| Pale Foam | `#b7c6c9` | Lightest neutral — icon outlines on dark surfaces and thin card borders where higher contrast is needed without using full white | neutral |
| Bone | `#fffffa` | Primary text and high-contrast iconography — headlines, body copy, button text, and reverse-mode icon fills; a warm off-white that softens against the teal canvas | neutral |
| Lime Voltage | `#79fa4b` | Primary brand accent — underline flourishes under display keywords, eyebrow labels in uppercase, decorative SVG fills, product-category icon glows, and the terminal stop of the signature gradient | brand |
| Pale Lime | `#a4ed8a` | Lighter lime used for subdued accent text and outlined-link borders where a softer hit of brand color is needed | brand |
| Voltage Dark | `#0b3222` | Dark green surface — for solid-fill lime-tinted backgrounds and badge containers where the lime accent needs a darker anchor | brand |
| Cyan Pulse | `#30d7f1` | Supporting palette color for small decorative accents when the core palette needs contrast. Do not promote it to the primary CTA color | accent |
| Solar Yellow | `#fce344` | Secondary gradient stop — the warm tail of the tri-stop accent gradient used sparingly on decorative flows and a few product-card highlights | accent |

## Tokens — Typography

- **Gellix** — sizes: 12, 13, 14, 16, 18, 20, 22, 26, 48, 90, 120px; weight: 300, 400, 500, 600; line-height: 0.85, 1.00, 1.05, 1.10, 1.20, 1.25, 1.30, 1.45; letter-spacing: -0.04em at 90-120px, -0.03em at 48-90px, -0.02em at 22-26px, -0.01em at 16-20px, 0.08em at 14px, 0.35em at 12-13px uppercase labels. Role: Primary brand typeface — used for all display, heading, body, and UI copy. Weight 300 at 90–120px is the signature headline treatment: anti-convention for an enterprise platform, the whisper-weight display is what makes the dark canvas feel premium rather than heavy. The 0.35em tracking on 12-13px is reserved for uppercase eyebrow labels like 'OUR PRODUCTS'.
- **Times** — sizes: 16px; weight: 400; line-height: 1.20; letter-spacing: normal. Role: Rare legacy or fallback appearance — appears sparsely in the data, likely a system fallback for a single decorative or legal string; not a brand typeface and should not be propagated into new pages

## Type Scale

- caption: 12px / lh 1.3 / ls 0.35
- body-sm: 14px / lh 1.45 / ls 0.08
- body: 16px / lh 1.25 / ls -0.01
- subheading: 18px / lh 1.3 / ls -0.01
- heading-sm: 22px / lh 1.25 / ls -0.02
- heading: 26px / lh 1.2 / ls -0.02
- heading-lg: 48px / lh 1.1 / ls -0.03
- display: 90px / lh 1 / ls -0.04
- display-xl: 120px / lh 0.85 / ls -0.04

## Spacing & Shape

- Radius — buttons: 999px, cards: 30px, inputs: , tags: 999px
- Element gap: 20-25px; Section gap: 96-128px; Card padding: 40px; Page max-width: 1200px

## Components

### Top Navigation Bar
Role: Persistent dark header
Sits directly on Abyss Teal (#002025) canvas with no border, 80px height, 20px horizontal padding. Logo on the left (boost wordmark + lime-green stacked-layers icon), five text nav items with dropdown chevrons in Bone (#fffffa) at 14px, and a ghost outlined Contact Us button on the right with 1px Bone border, 999px radius, 18px horizontal padding, 9px vertical padding.

### Gradient Pill CTA
Role: Primary action button
Filled with the signature cyan-to-lime gradient (linear-gradient(100.7deg, #30d7f1, #79fa4b)), Bone (#fffffa) text at 16px Gellix 500, 999px radius, 18px horizontal padding, 9px vertical padding. The gradient orientation runs roughly horizontal with cyan at the top-left and lime at the bottom-right, giving the button a directional pull. Use this for exactly one action per view.

### Ghost Outline Button
Role: Secondary nav action
Transparent background, 1px Bone (#fffffa) border, Bone text at 14px Gellix 500, 999px radius, 20px horizontal padding, 9px vertical padding. Used in the nav bar for the right-aligned Contact Us. No hover fill change beyond a subtle opacity dip.

### Floating Product Card
Role: Hero illustration
A glassmorphic card floating in the right half of the hero: Slate Reef (#244348) semi-transparent background, 1px Slate Reef border, 30px radius, 40px padding. Inside it, a list of insurance category tags (Insurance, Business Owners, Crypto, Pet Health) in muted Storm Glass with 10px radius, then a highlighted active card with Deep Kelp (#05333a) background containing a green product icon, a 'Your Product' label, and a yellow Solar Yellow gradient button.

### Feature Illustration Tile
Role: Section visual
A 30px-radius container with a Slate Reef border, holding a tilted (slight rotation, roughly -3deg) grid of miniature product cards. Each mini card mirrors the hero product-card pattern: green icon top-left, gradient bar placeholders, 'Your Product' or 'Your Insurance' label in Pale Foam. The tilt and the repeated pattern create depth without using shadows.

### Stats Highlight Block
Role: Social proof band
A rounded-rectangle band on Abyss Teal with a 1px Slate Reef border, 30px radius, housing a large sentence-left and a logo-grid right. Sentence uses Gellix 300 at 26-32px with the key number ($100+ Billion) underlined in Lime Voltage, plus a horizontal Lime Voltage gradient line under the whole block as a visual anchor. Logo grid is 2 columns of 5 partner logos, each in faded Pale Foam at 40% opacity.

### Underline Accent
Role: Inline emphasis on keywords
A 2-3px lime-green (#79fa4b) line drawn under a single display-scale word, usually the last word of a headline. Sits flush at the baseline of the Gellix 300 letterforms. Used to give the giant whisper-weight headlines a focal point without breaking the monochrome text treatment.

### Eyebrow Label
Role: Section category marker
12-13px Gellix 500, uppercase, Lime Voltage (#79fa4b) color, 0.35em letter-spacing, 1.0-1.2 line height. Sits above section headlines with a small 4-6px gap. A 6px lime-green dot or icon typically precedes the text. Examples: 'OUR PRODUCTS', 'COMMERCIAL LINES'.

### Display Headline
Role: Primary section and hero headline
Gellix 300, 90-120px on desktop, Bone (#fffffa) color, line-height 0.85-1.0, letter-spacing -0.04em. Tightly set, with one keyword carrying the Underline Accent. At 120px the line-height drops to 0.85 to overlap ascenders/descenders across two lines into a single confident block.

### Insurance Product Tag
Role: Category chip
Small pill at 10px radius, Abyss Teal (#002025) background, 1px Slate Reef (#244348) border, Storm Glass (#7d8f92) text at 12-14px Gellix 400. Stacks vertically in lists. Active state: 1px Lime Voltage border and Pale Foam text.

### Product Icon Badge
Role: Category icon container
32-40px square container, 8px radius, filled with a darker green or lime-tinted gradient, holding a white icon at 60% of container size. Always Lime Voltage or a lime-gradient fill. Used in product cards, feature lists, and as inline anchors next to product names.

### Inline Text Link
Role: In-prose navigation
Bone (#fffffa) text at 16-18px Gellix 400, no underline by default, 2px Lime Voltage underline on hover. Used inside body paragraphs to link to secondary actions like 'or work with Boost to create something new.'

### Section Divider Line
Role: Quiet transition between sections
A 1px horizontal stroke in Slate Reef (#244348) spanning the full content width, occasionally interrupted by an eyebrow label or a 2px Lime Voltage gradient segment. The gradient variant is used as a visual bookmark under a stats block.

## Do

- Use the cyan-to-lime linear-gradient(100.7deg, #30d7f1, #79fa4b) on exactly one primary CTA per view, set on a 999px-radius pill with Bone text at 16px Gellix 500 and 18px/9px padding.
- Set display headlines at 90-120px Gellix 300 with -0.04em letter-spacing and line-height 0.85-1.0; let the last keyword carry a 2-3px Lime Voltage (#79fa4b) underline accent.
- Reserve Lime Voltage (#79fa4b) for accents only — eyebrow labels, underline flourishes, product icons, and gradient stops — never as a paragraph background or large fill.
- Use the four-tier surface stack (Abyss #002025 → Deep Kelp #05333a → Slate Reef #244348 → Tidewater #455c60) to imply depth without shadows; each step is roughly +5-8% luminance over the previous.
- Round all large containers — cards, illustrations, hero panels — to 30px; round all chips, tags, and small surfaces to 10px; round all buttons and pills to 999px. Never use a square corner on a card-sized element.
- Set body copy at 16-18px Gellix 400 in Bone (#fffffa) with -0.01 to -0.02em letter-spacing, and mute secondary text to Storm Glass (#7d8f92) or Sea Mist (#9eaeb0) at the same size.
- Use uppercase eyebrow labels at 12-13px Gellix 500 with 0.35em letter-spacing in Lime Voltage, typically preceded by a 6px lime-green dot, to introduce every major section.

## Never

- Do not use a filled neutral or lime rectangle as a CTA background — the primary action must be the cyan-to-lime gradient pill; outlined actions in Pale Lime or Bone are the only acceptable alternatives.
- Do not set display headlines in weight 500 or 600 — the whisper-weight 300 at 90-120px is the signature; bolder display weights destroy the premium dark-canvas feel.
- Do not introduce shadows beyond the soft Abyss-tinted glow on the floating hero card — the design relies on surface-tier contrast and 30px radii, not drop shadows, to imply depth.
- Do not place photography on the page — all imagery must be UI mockups, isometric card grids, or icon-driven product illustrations rendered in lime-green and cyan.
- Do not use red, orange, or warm-saturated semantic colors — the palette is intentionally cold-teal with a single lime-green hit; success states should use Lime Voltage or Voltage Dark, not green-from-semantic-library.
- Do not set body text tighter than -0.02em — negative tracking works at 90px+ but destroys readability at 16-18px; respect the size-to-tracking curve.
- Do not exceed one gradient element per viewport — the cyan-to-lime gradient is precious; if a section already uses a gradient CTA, the section's underline accents and icons should stay solid Lime Voltage.

## Agent Prompt Guide

**Quick Color Reference**
- text primary: #fffffa (Bone)
- text muted: #7d8f92 (Storm Glass)
- background canvas: #002025 (Abyss Teal)
- card surface: #244348 (Slate Reef)
- border hairline: #244348 (Slate Reef)
- accent: #79fa4b (Lime Voltage)
- primary action: #a4ed8a (outlined action border)

**3-5 Example Component Prompts**
1. Create an Outlined Primary Action: Transparent background, #a4ed8a border and text, 9999px radius, compact pill padding. Use it for the main CTA instead of a filled button.

2. *Stats highlight block*: full-width band, Abyss Teal background, 30px radius, 1px Slate Reef (#244348) border, 40px padding. Left side: 'We've helped leading brands provide over $100+ Billion of protection.' in Gellix 300 at 26px, Bone, with '$100+ Billion' underlined in Lime Voltage. Right side: 2-column partner logo grid in Pale Foam (#b7c6c9) at 40% opacity. A 2px Lime Voltage gradient divider line spans the bottom of the block.

3. *Section with eyebrow + headline + body + illustration*: Eyebrow 'OUR PRODUCTS' at 12px Gellix 500, uppercase, 0.35em letter-spacing, Lime Voltage, preceded by a 6px Lime Voltage dot. Headline 'Products built for the modern world.' in Gellix 300 at 48px Bone, -0.03em letter-spacing, with 'world' underlined Lime Voltage. Body at 18px Gellix 400 in Storm Glass, with a Pale Lime (#a4ed8a) inline text link. Left side: a 30px-radius container holding a tilted (-3deg) grid of miniature product cards, each with a Lime Voltage icon and a cyan-to-lime gradient placeholder bar.

4. *Footer link with hover state*: Inline link 'or work with Boost to create something new.' set as Bone text at 18px Gellix 400 with no underline by default, gaining a 2px Lime Voltage underline on hover. The link sits at the end of a body paragraph in Storm Glass; only the link itself is Bone.

5. *Ghost outline nav button*: Transparent background, 1px Bone (#fffffa) border, 999px radius, 20px horizontal and 9px vertical padding, text 'Contact Us' in Gellix 500 at 14px Bone. Right-aligned in the 80px-tall top nav bar that sits directly on Abyss Teal canvas with no border.
