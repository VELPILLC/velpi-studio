# Ryan Stephen — Style Reference
> Quiet gallery wall on white plaster — the portfolio is the product, the UI is invisible.

**Theme:** light

Ryan Stephen's portfolio is a quiet gallery wall on white plaster: nearly all black and white, with one warm gray doing the work of secondary text and link borders. The layout is content-first and image-dominant — a single bio block on the left, a 3-column photo grid on the right — with no chrome, no decoration, and no brand color competing with the work. The visual system is intentionally austere: system fonts, a single 10px image radius, generous whitespace, and zero shadows or gradients. Every interface element is reduced to its function so the photographs carry the page.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Ink Black | `#000000` | Primary text, image frame borders, structural lines | neutral |
| Charcoal | `#404040` | Secondary body text, subdued labels | neutral |
| Warm Ash | `#8b8b94` | Muted helper text, link borders, link text, decorative dividers | neutral |
| Plaster White | `#ffffff` | Page canvas, card surfaces, image backgrounds | neutral |

## Tokens — Typography

- **sans-serif** — sizes: 12px; weight: 400; line-height: 1.2; letter-spacing: . Role: sans-serif — detected in extracted data but not described by AI
- **system-ui** — sizes: 16px; weight: 400, 500; line-height: 1.20; letter-spacing: . Role: All text uses the OS system font stack. 16px weight 500 carries the bio paragraph and link text; 12px weight 400 covers the small link row (Email · Twitter · LinkedIn) and metadata. The deliberate choice of native system fonts — no custom typeface, no webfont load — keeps the chrome weightless and lets the photographs be the only typographic event on the page.

## Type Scale

- caption: 12px / lh 1.2 / ls undefined
- body: 16px / lh 1.2 / ls undefined

## Spacing & Shape

- Radius — buttons: , cards: 10px, inputs: , tags: 
- Element gap: 20px; Section gap: 100px; Card padding: 40px; Page max-width: 1200px

## Components

### Bio Block
Role: Left-column introduction paragraph
Body paragraph in 16px system-ui weight 500, #000000. Sits flush-left at the top of the page, directly above the link row. No card, no border, no background — just text on the white canvas.

### Social Link Row
Role: Inline list of outbound links
Three links (Email, Twitter, LinkedIn) separated by whitespace, 12px system-ui weight 400, #000000. No icons, no underlines, no buttons — just bare text labels on a single line.

### Image Gallery Grid
Role: 3-column photo grid showing portfolio work
Three equal columns with 15–20px row and column gaps. Each tile is a photograph inside a 10px-radius container. No captions, no borders, no hover effects visible — the images speak for themselves.

### Gallery Tile
Role: Single photograph in the grid
Full-bleed image clipped to a 10px border-radius. No padding, no shadow, no border. Aspect ratio is left natural to the source photo — the grid accepts mixed orientations.

### Text Link
Role: Inline navigation to email/social profiles
Bare text at 12–16px, #000000, no underline by default. Inherits system-ui. When chromatic, sits in #000000 — the same color as body text, distinguished only by context and convention.

## Do

- Use 10px border-radius for all images and any card-like surface
- Keep the palette restricted to #000000, #404040, #8b8b94, and #ffffff — no accent colors
- Use system-ui at 16px weight 500 for body and 12px weight 400 for meta/link rows
- Set line-height to 1.20 across all text
- Maintain the 3-column image grid with 15–20px gaps and 100px section breathing room
- Let images sit on the white canvas with no frames, shadows, or backgrounds
- Write links as plain text — no buttons, no underlines, no icons

## Never

- Don't introduce a brand color or accent — the absence of color is the brand
- Don't add drop shadows, gradients, or elevation effects to any element
- Don't load a custom webfont — system fonts are the system
- Don't use a border-radius other than 10px on images or cards
- Don't wrap the bio or link row in a card, container, or bordered box
- Don't add icons to social links or nav items
- Don't apply different radii to different elements — one value across the system

## Agent Prompt Guide

Quick Color Reference:
- text: #000000
- muted text: #404040
- link/secondary: #8b8b94
- background: #ffffff
- border: #000000
- primary action: no distinct CTA color

Example Component Prompts:

1. Create a bio block: white (#ffffff) canvas, 16px system-ui weight 500, #000000, line-height 1.20. No border, no background, flush-left at page top. Max-width ~360px.

2. Create a social link row: three bare text links (Email, Twitter, LinkedIn) on one line, separated by ~20px space. 12px system-ui weight 400, #000000, no underline, no icons.

3. Create a 3-column image grid: white background, 15–20px row and column gaps, tiles clipped to 10px border-radius. No borders, no shadows, no captions. Tiles stretch to fill column width.

4. Create a single gallery tile: full-width image inside a 10px-radius container, no padding, no frame, no hover state. Aspect ratio follows the source image.

5. Create a plain text link: 16px system-ui weight 500, #000000, no underline, no background, no border. Distinguishable from body text only by context and convention.
