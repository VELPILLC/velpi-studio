# Chester's Garden — Style Reference
> Flimsy art-zine on drafting paper

**Theme:** light

Chester's Garden is a personal digital garden rendered as a quiet, editorial broadsheet on soft gray paper. The visual language is deliberately unfussy: a near-white canvas layered onto a cool gray substrate, serif display type at whisper-weight 300 that feels typeset rather than designed, and a masonry grid where cards of varying heights lock together like magazine columns. Body text is compact Inter with selectively bolded words inside flowing sentences, echoing how a reader underlines a phrase in a book. Pastel tag pills (mint, butter yellow, sage) and one rust-orange link color provide the only chromatic moments — accents behave like highlighter marks, not like a brand identity. Everything else is restrained: hairline borders, tiny radii, no gradients, no decorative elevation, and images sit in their own muted card frames.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Paper Gray | `#e5e7eb` | Page background, card borders, hairline dividers — the cool, slightly blue-gray substrate that every surface sits on or against | neutral |
| Bone White | `#fafafa` | Card and content-tile surface — reads as warm white against the cool Paper Gray substrate, giving each block a subtle lift without any shadow | neutral |
| Full Black | `#000000` | Primary body text, nav logo, image letterbox bars — maximum contrast, used for sentences that need to carry the page | neutral |
| Ink Charcoal | `#171717` | Headline and link text — almost black but not quite, so Fraunces serifs feel printed rather than digital | neutral |
| Soft Graphite | `#404040` | Secondary body text, supporting metadata lines under headings | neutral |
| Pencil Gray | `#a3a3a3` | Tertiary text, icon strokes, placeholder labels — fades to the background and only earns attention when scanned for | neutral |
| Highlight Mint | `#daf5ae` | Pill-tag background (FILTER, READ) — the first chromatic accent tier, like a fluorescent marker on the page | accent |
| Highlight Butter | `#fde5a7` | Pill-tag background (NOW BREWING) — second accent tier, warmer counterpart to the mint | accent |
| Highlight Sage | `#b7f2cc` | Pill-tag background (READ variants) — third accent tier, softer green for less emphatic tags | accent |
| Rust Underline | `#7c2d12` | Occasional inline emphasis — the only warm chromatic voice in the palette, used sparingly to single out one word or phrase inside a body sentence | brand |
| Navy Quotation | `#0c4a6e` | Occasional inline emphasis — the cool counterpart to Rust Underline, used for the same hand-underline-in-a-book purpose | brand |

## Tokens — Typography

- **Fraunces** — sizes: 30px, 36px, 60px; weight: 300; line-height: 1.00-1.25; letter-spacing: -0.03em. Role: Display and editorial headings — light-weight serif at 30/36/60px. The whisper weight and optical-size personality of Fraunces make every headline feel hand-set rather than UI-generated; this is the single most distinctive typographic choice on the site
- **Inter** — sizes: 14px, 16px; weight: 400; line-height: 1.43-1.63; letter-spacing: -0.025em. Role: Body, navigation, metadata, card titles, footer. Used everywhere the voice is functional and not editorial. Compact 14px for card-level metadata, comfortable 16px for running prose
- **ui-monospace** — sizes: 14px; weight: 400; line-height: 1.43; letter-spacing: -0.025em. Role: Code-fence and small technical labels — inherits the same tight tracking as Inter so mono blocks align with the proportional text around them

## Type Scale

- caption: 14px / lh 1.43 / ls -0.35
- body: 16px / lh 1.5 / ls -0.4
- heading-sm: 30px / lh 1.2 / ls -0.9
- heading: 36px / lh 1.11 / ls -1.08
- display: 60px / lh 1 / ls -1.8

## Spacing & Shape

- Radius — buttons: 4px, cards: 8px, inputs: , tags: 9999px
- Element gap: 8px; Section gap: 24px; Card padding: 20px; Page max-width: 1200px

## Components

### Top Navigation Bar
Role: Minimal site header with brand mark and routing
Transparent bar sitting on the Paper Gray canvas. Left side: 'Chester' wordmark in Inter 16px/400 Ink Charcoal. Center: nav links (Projects, Writing, Reading, Hobbies) at Inter 16px, color shifts between Full Black and Pencil Gray for active/hover. Right side: social links (GitHub, Twitter, CV) at Inter 16px Full Black. No background fill, no shadow, no border — 20px vertical padding, 28-32px horizontal padding

### Editorial Intro Block
Role: Opening prose section above the card grid
Large left-aligned text block on the Paper Gray canvas, no card chrome. Begins with 'Hey there, I'm Chester 👋' at 60px Fraunces 300 in Ink Charcoal. Body sentences at 16px Inter 400, with strategic words bumped to weight 600 (Chester, digital garden, building, Mobbin, coffee, plants, climbing, reading, writing). 24px row gap between paragraphs. No box, no border — text floats on the substrate

### Project Tile (Image Card)
Role: Default unit in the masonry grid, links out to external project
Bone White card with 8px radius, 1px hairline border in Paper Gray. Full-bleed image (or screenshot) clipped to the card's top, 8px top radius. Below image: 16px padding block containing 'Projects · [Project Name]' caption at Inter 14px in Soft Graphite, and a 12×12 external-link arrow icon top-right in Pencil Gray. No drop shadow. Inset top + bottom borders using rgba(0,0,0,0.1) at 1px give a subtle ruled-paper edge

### Book Cover Tile
Role: Card variant for reading-shelf entries
Bone White card, 8px radius, 1px Paper Gray border. Left: book-cover image clipped to 4px radius. Right column: 16px Inter 600 title in Ink Charcoal, 'Donald A. Norman' at 16px Inter 400 in Soft Graphite, and an 'READ' pill badge floating at the right edge

### Accent Tag Pill
Role: Compact label badge on cards and metadata lines
9999px (pill) radius, horizontal padding 6-8px, vertical padding 2-4px. Inter 12-14px uppercase, letter-spacing 0.5px, weight 500. Available background fills: Highlight Mint, Highlight Butter, Highlight Sage. Text always Full Black for AAA contrast on the pastels. Floating, no border

### Hobby Feature Card
Role: Photo-forward card for hobbies (Coffee, Plants) with headline + descriptor
Tall Bone White card, 8px radius, 1px Paper Gray border. Top: full-bleed photograph at 8px top radius. Below: stacked text — a Highlight Butter or Highlight Mint tag pill, then a 30-36px Fraunces 300 headline in Ink Charcoal, then a Soft Graphite descriptor line at 14px Inter. 20px padding inside the text block

### Image Letterbox Card
Role: Photo entry with date and film stock caption (Camera section)
Bone White card, 8px radius. Image framed by Full Black letterbox bars top and bottom (typical 2.4:1 cinematic crop). Caption strip: 'Film:NeverBik KIRO 400' at Inter 12px in Pencil Gray, bottom-left of the letterbox

### Inline Word Emphasis
Role: Selective bolding of single words within body sentences
Within a 16px Inter 400 sentence, one or two words are bumped to weight 600 in Ink Charcoal to simulate hand-underlining. No underline, no highlight background, no italic — just a weight shift. Used for personal-noun and activity-noun emphasis (Chester, plants, climbing, writing)

### Ghost Link Arrow
Role: External-link affordance on every project tile
12×12 outlined arrow-up-right icon in Pencil Gray, absolutely positioned top-right of card with 8px inset. No background, no border, no hover state beyond color shift to Full Black

### Footer Social Row
Role: Bottom-of-page social links and CV
Inter 16px Full Black text links separated by 8-12px gaps, left-aligned or right-aligned in the page column. No background, no border, no icon — plain text only, matching the nav's restraint

## Do

- Set every headline in Fraunces weight 300 at 30, 36, or 60px with line-height 1.0-1.25 and -0.03em tracking — never bold or semibold the serif
- Place every card surface on the Paper Gray (#e5e7eb) substrate using Bone White (#fafafa) as the fill; rely on this single color step instead of drop shadows for separation
- Use 8px radius for image cards, 4px radius for small UI controls, and 9999px for accent tag pills
- Bump single words inside Inter body sentences from 400 to 600 weight for emphasis — never use underline, italic, or color for the same purpose
- Reach for Highlight Mint (#daf5ae), Highlight Butter (#fde5a7), or Highlight Sage (#b7f2cc) as tag backgrounds with Full Black text — these are the only allowed chromatic fills on UI elements
- Use ui-monospace 14px with -0.025em tracking for any inline code or technical label so the mono block aligns with surrounding Inter
- Keep the nav and footer as transparent text rows on the Paper Gray canvas — no fills, no borders, no logos, no icons

## Never

- Do not raise Fraunces above weight 300 — the whisper-weight serif is the defining choice and bolding it destroys the editorial voice
- Do not introduce drop shadows, gradient fills, or glow effects on standard content tiles — the only shadow is the soft 10% black blur on hero image cards and the 1px inset paper edge
- Do not use bright saturated brand colors for buttons, links, or CTAs — there is no CTA color in this system; actions are text links in Ink Charcoal
- Do not alternate dark and light sections or introduce a dark mode — the entire page is a single Paper Gray tone
- Do not add icon systems, illustrations, or 3D graphics; visuals are restricted to photographs, book covers, and screenshots inside Bone White cards
- Do not set body text above 16px or below 14px — the Inter scale is intentionally narrow to maintain the compact zine rhythm
- Do not use the two inline emphasis colors (Rust Underline, Navy Quotation) on more than one or two words per sentence — they are the most chromatic elements on the site and must remain rare

## Agent Prompt Guide

**Quick Color Reference**
- text: #000000 (primary body), #171717 (headlines/links), #404040 (secondary), #a3a3a3 (tertiary/icons)
- background: #e5e7eb (page), #fafafa (card)
- border: #e5e7eb (hairline), rgba(0,0,0,0.1) (inset paper edge)
- accent: #daf5ae, #fde5a7, #b7f2cc (tag pill backgrounds only)
- primary action: no distinct CTA color

**Example Component Prompts**
1. Build the editorial intro block: Paper Gray (#e5e7eb) canvas, no card chrome. 'Hey there, I'm Chester 👋' at 60px Fraunces weight 300, color #171717, letter-spacing -1.8px, line-height 1.0. Follow with 16px Inter 400 body in #000000, selectively bolding single words (Chester, digital garden, building, Mobbin, plants, climbing) to weight 600. 24px row gap between paragraphs.
2. Build a project tile card: Bone White (#fafafa) fill, 8px radius, 1px #e5e7eb hairline border plus the inset paper-edge shadow (rgba(0,0,0,0.1) 0px 0px 0px 1px inset, rgba(0,0,0,0.1) 0px -2px 0px 1px inset). Top: full-bleed project screenshot clipped to 8px top corners. Below: 20px padding, caption 'Projects · Design Spells' at 14px Inter 400 in #404040. Top-right 12×12 outlined arrow-up-right icon in #a3a3a3.
3. Build an accent tag pill: 9999px radius, 6px vertical and 8px horizontal padding, Highlight Mint (#daf5ae) background, 'READ' in Inter 12px weight 500 uppercase in #000000. No border, floats on the card surface.
4. Build a hobby feature card: tall Bone White tile, 8px radius, 1px #e5e7eb border. Full-bleed plant photograph at top with 8px top radius. Below: 20px padding, then a Highlight Butter (#fde5a7) pill with 'ARACEAE' text, then 'Philodendron hederaceum 'Micans'' at 36px Fraunces 300 in #171717, line-height 1.11, letter-spacing -1.08px.
5. Build the top nav bar: transparent background, no shadow, 20px vertical padding, 32px horizontal padding. Left: 'Chester' at 16px Inter 400 in #171717. Center row: Projects, Writing, Reading, Hobbies at 16px Inter 400 in #000000, 12px gaps. Right row: GitHub, Twitter, CV at 16px Inter 400 in #000000, 12px gaps.

## The Bolding-In-Prose Rule

The site's most distinctive content pattern is the selective bolding of single words inside otherwise regular-weight sentences — 'I like building things and I'm currently helping to build Mobbin', where 'building' and 'Mobbin' jump to weight 600. This is the equivalent of underlining a word with a pencil while reading. When generating prose for this system, always identify one or two carry-words per sentence (proper nouns, activity verbs, project names) and bump them to 600. Do not bold phrases, do not bold more than two words per sentence, and do not introduce any other emphasis mechanism (no underline, no italic, no color).
