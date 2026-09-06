# Udemy — Style Reference
> Modern classroom whiteboard with violet ink.

**Theme:** light

Udemy reads as a calm, instructive marketplace: white canvas with soft cool-gray surfaces, a near-black ink scale for type, and two chromatic accents — a signature violet and a warm orange — that always appear as outlined borders or small marks rather than filled panels. Components are flat and lightweight, leaning on 8px radii and hairline borders instead of heavy elevation. A 3D-illustration vocabulary (soft clay-like product objects, isometric shapes, saturated accent pops) carries the personality, while the UI itself stays disciplined and instructional.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Ink | `#2a2b3f` | Primary text, heading strokes, default icon strokes, body copy | neutral |
| Obsidian | `#202230` | Card backgrounds in dark sections, inverted surfaces, footer panel | neutral |
| Graphite | `#33364a` | Body-level dark surfaces, secondary panel fills | neutral |
| Slate | `#3d4055` | Card borders and muted dark backgrounds | neutral |
| Steel | `#595c73` | Muted text, heading accents, low-emphasis borders | neutral |
| Fog | `#9194ac` | Helper text, hairline borders, disabled strokes | neutral |
| Mist | `#b7b9cd` | Card outlines, subtle dividers on light surfaces | neutral |
| Chalk | `#d1d2e0` | Light borders, icon strokes on white, card edges | neutral |
| Porcelain | `#e9eaf2` | Page background, secondary surface, button ghost fills | neutral |
| Paper | `#f6f7f9` | Off-white panel surface between white and porcelain | neutral |
| Canvas | `#ffffff` | Card surface, button text on dark, primary surface | neutral |
| Aubergine | `#6d28d2` | Violet accent for outlined action borders, linked labels, and lightweight interactive emphasis. Do not promote it to the primary CTA color | brand |
| Lavender Haze | `#c0c4fc` | Tinted link hover, soft violet highlight wash, light brand surface | brand |
| Ember | `#c4710d` | Secondary accent — badge borders, callout borders, warm icon accent | accent |

## Tokens — Typography

- **Udemy Sans** — sizes: 12px, 14px, 16px, 18px, 24px, 32px; weight: 300, 400, 500, 700; line-height: 1.10, 1.20, 1.40, 1.50, 1.60; letter-spacing: . Role: Single-family system: weight 700 for display headlines, 500 for subheadings and nav labels, 400 for body and UI, 300 sparingly for muted large text. The custom face has open apertures and a humanist x-height — it reads as instructional, not corporate.

## Type Scale

- caption: 12px / lh 1.5 / ls undefined
- body-sm: 14px / lh 1.5 / ls undefined
- body: 16px / lh 1.6 / ls undefined
- subheading: 18px / lh 1.5 / ls undefined
- heading-sm: 24px / lh 1.4 / ls undefined
- heading: 32px / lh 1.2 / ls undefined

## Spacing & Shape

- Radius — buttons: 8px, cards: 8px, inputs: 4px, tags: 
- Element gap: 16px; Section gap: 48px; Card padding: 24px; Page max-width: 1200px

## Components

### Outlined Violet Action
Role: Primary action trigger
Transparent fill, 1.5px #6d28d2 border, 8px radius, 12px 24px padding. Label in Udemy Sans 16px weight 500, #6d28d2. On hover a double-layer cool shadow appears. This is the signature control — the brand speaks through outline, not fill.

### Solid Dark Action
Role: Inverse action on light surfaces
#202230 fill, white text weight 500 at 16px, 8px radius, 12px 24px padding. Used sparingly where the outlined violet would lose contrast against a colored illustration.

### Ghost Neutral Button
Role: Secondary text action
Transparent fill, 1px #d1d2e0 border, 8px radius, 12px 20px padding, label #2a2b3f weight 500 16px.

### Pill Search Field
Role: Hero-level search
Full-width white pill at 1000px radius, 48px tall, magnifier icon at left in #2a2b3f, placeholder #9194ac, 1px #d1d2e0 border, 16px horizontal padding.

### Text Input
Role: Form input
White fill, 4px radius, 1px #d1d2e0 border, 16px text, 12px 16px padding. Focus ring shifts to 1.5px #6d28d2.

### Category Card
Role: Topic landing tile
16px radius, white surface, 0px top padding with full-bleed illustration, then 24px bottom padding for label and arrow. 1px #d1d2e0 border, 8px inner image radius. Label is 18px weight 500 #2a2b3f.

### Course Thumbnail Card
Role: Course listing tile
8px radius, white fill, 1px #e9eaf2 border. Top half is a 16:9 image with top corners matched, bottom half has 16px padding with title 16px weight 500 and instructor 14px weight 400 #595c73.

### Testimonial Card
Role: Social proof block
White surface, 8px radius, 24px padding, no border. Large violet quotation glyph top-left at 32px, quote text 16px weight 400 #2a2b3f, author block with 40px avatar + name 14px weight 500 + role 14px weight 400 #595c73, and a violet arrow link at bottom.

### Certification Provider Card
Role: Certification upsell tile
On dark #202230 panel. Image fills top with 16px radius, 24px padding below with provider name 18px weight 700 white, topic 14px weight 400 #b7b9cd.

### Pagination Indicator
Role: Carousel page control
Pill at 1000px radius, 24px wide x 6px tall, #6d28d2 fill for active state, #d1d2e0 for inactive. Surrounded by 40px circular ghost prev/next buttons with #2a2b3f chevrons.

### Logo Lockup
Role: Brand mark
Lowercase wordmark 'udemy' in Udemy Sans 24px weight 700, #2a2b3f, preceded by a rounded-square violet badge with white 'U' glyph. Icon and wordmark share a 28px cap height.

### Footer Link List
Role: Site directory
Vertical list, 8px row gap, each item 14px weight 400 #595c73, hover transitions to #2a2b3f.

### Dark Hero Band
Role: Section inversion
#202230 full-bleed band with 48px vertical padding. Internal card at 16px radius, #33364a fill, hosts image placeholder on right and text stack on left with 32px gap.

## Do

- Use outlined violet #6d28d2 with 1.5px stroke as the primary action treatment — never a flooded fill.
- Set page background to #e9eaf2 and card surfaces to #ffffff; band intermediate sections in #f6f7f9.
- Use 8px radius for buttons and small cards, 16px for feature cards, 1000px for pills and search.
- Keep type to one family (Udemy Sans / Inter) and use weight 700 for display, 500 for subheadings and nav, 400 for body, 300 only for muted large text.
- Reach for 1px #d1d2e0 or #e9eaf2 borders before adding shadow; reserve the double-layer cool shadow for hover and lift states.
- Pair the violet Aubergine with the warm Ember #c4710d as a secondary accent — never introduce a third chromatic hue.
- Maintain 24px card padding and 16px element gap as the default interior rhythm.

## Never

- Don't fill buttons with #6d28d2 — the brand voice comes from outline, not flood.
- Don't use solid #6d28d2 as a panel background; reserve violet for stroke, icon, and small marks.
- Don't add gradients — the surface language is flat and instructional.
- Don't mix radii on the same component class: all standard buttons share 8px, all pills share 1000px.
- Don't introduce a third type family; the single-family discipline is part of the identity.
- Don't apply warm orange #c4710d to body text or large fills — keep it to badge borders and small icon accents.
- Don't use pure #000 or #fff for surfaces — use #2a2b3f for ink and #e9eaf2 for canvas to preserve the cool instructional tone.

## Agent Prompt Guide

Quick Color Reference:
- text: #2a2b3f
- background: #e9eaf2
- card surface: #ffffff
- border: #d1d2e0
- accent: #6d28d2 (Aubergine violet)
- secondary accent: #c4710d (Ember)
- primary action: #6d28d2 (outlined action border)

Example Component Prompts:

1. Outlined Violet Action Button: 12px 24px padding, 8px radius, transparent fill, 1.5px #6d28d2 border, label 'Enroll now' in Udemy Sans 16px weight 500 #6d28d2. On hover add the double-layer cool shadow: oklch(0.6295 0.0204 306.5 / 0.08) 0px 2px 8px 0px, oklch(0.6295 0.0204 306.5 / 0.12) 0px 4px 16px 0px.

2. Category Card: White #ffffff surface, 16px radius, 1px #d1d2e0 border. Top half is a 16:9 illustration placeholder, bottom 24px padding holds 'Generative AI' label in 18px weight 500 #2a2b3f and a right arrow in #2a2b3f.

3. Testimonial Card: White #ffffff, 8px radius, no border, 24px padding. Opening quote glyph at 32px #6d28d2, quote body 16px weight 400 #2a2b3f, 40px circular avatar, author name 14px weight 500 #2a2b3f, role 14px weight 400 #595c73, footer link 'View course →' in 14px weight 500 #6d28d2.

4. Dark Hero Band: Full-width #202230 panel, 48px vertical padding, internal card at 16px radius with #33364a fill. Left column has heading 32px weight 700 white over subtext 16px weight 400 #b7b9cd. Right column is a #2a2b3f image placeholder block.

5. Pill Search Field: 1000px radius, 48px tall, white #ffffff fill, 1px #d1d2e0 border, magnifier icon #2a2b3f at left 16px, placeholder 'Search for anything' in 16px weight 400 #9194ac, spans full content width.
