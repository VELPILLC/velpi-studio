# BUTT STUDIO — Style Reference
> gallery wall with one massive serif wordmark

**Theme:** light

BUTT Studio is an editorial portfolio that treats type as architecture: one enormous Caslon wordmark stretches wall-to-wall across the top of the page, broken by an organic illustration that weaves through the letterforms. Below the hero, the system collapses into a clinical three-column ledger of contact, clients, and features in a quiet sans-serif, then opens into a generous two-column project grid. Color is almost entirely absent — matte black ink on warm gray paper, with a single deep indigo badge as the only chromatic punctuation. The feel is a print magazine that happens to be alive: confident serif display, utilitarian sans body, no gradients, no rounded chrome, no decorative shadows.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Ink Black | `#000000` | Primary text, borders, button outlines, structural strokes — the only color that ever carries information | neutral |
| Paper | `#ffffff` | Card surfaces, thumbnail covers, inverted text on dark blocks | neutral |
| Carbon | `#131313` | Dark project tile backgrounds, near-black surface for video panels | neutral |
| Bone Gray | `#e0e0e0` | Page canvas, neutral button fills — the warm gray the whole composition sits on | neutral |
| Studio Indigo | `#31338e` | Sole chromatic accent — STUDIO pill badge, and any deep brand punctuation. The only saturated color in the system | brand |

## Tokens — Typography

- **helvetica** — sizes: 20px body, 40px subhead; weight: 400; line-height: 1.20; letter-spacing: -0.03em at 20px, -0.02em at 40px. Role: Every utility, body, list, button, and link on the site. Stays at one weight — no bold, no medium. The decision to use weight 400 Helvetica at 20px for body (not 16px) is deliberate: text is meant to feel like printed matter, not a UI. Tighter letter-spacing on larger sizes (-0.03em) prevents the 40px from feeling airy.
- **Caslon** — sizes: 42px display, scales up to fill the viewport at the wordmark level; weight: 400; line-height: 1.00; letter-spacing: -0.02em at display sizes, tightening to nearly none at body. Role: The hero wordmark and any serif accent. A single weight of a custom display serif — chosen because its high contrast strokes and ball terminals read as editorial print, not web type. This font IS the brand; everything else is scaffolding.
- **Sometimes Times** — sizes: 20px; weight: 400; line-height: 1.2; letter-spacing: -0.02. Role: Sometimes Times — detected in extracted data but not described by AI

## Type Scale

- body: 20px / lh 1.2 / ls -0.6
- heading: 42px / lh 1 / ls -0.84
- display: 200px / lh 1 / ls -4

## Spacing & Shape

- Radius — buttons: 50px (pill-shaped), cards: 0px (sharp, like printed paper), inputs: , tags: 
- Element gap: 20px; Section gap: ; Card padding: 20px; Page max-width: fluid

## Components

### Wordmark Hero
Role: The site identity block
Full-bleed Caslon display set oversized (approximately 200-280px) so a single word fills the viewport width. Tight letter-spacing (-0.02em to -0.04em) so strokes nearly touch. An interactive illustration may weave horizontally through the letterforms, breaking the baseline — this is the signature move.

### STUDIO Pill Badge
Role: Brand stamp overlapping the wordmark
50-68px border-radius capsule. Fill #31338 (Studio Indigo). Text in Helvetica 20px, white, weight 400, letter-spacing -0.02em. Sits at the lower-left of the first letterform, partially overlapping it. The only chromatic UI element on the site.

### Three-Column Info Ledger
Role: Primary navigation and metadata block beneath the hero
Three equal columns separated only by whitespace, no dividers. Left column: contact name + email + social handle in Helvetica 20px black. Middle column: 'Selected Clients' list (adidas, Boiler Room, Chloé, Google, Instagram, Nike, Warner Records, Sony Music). Right column: 'Features' list with publication and year. All black text, no links styled differently, all weight 400.

### Project Tile (Light)
Role: Standard project entry with video thumbnail
Two-column grid item. Thumbnail is a 16:9 video player (color-tinted, often pink/magenta or blue gradient fills behind glass-like 3D objects). Below: project title in Caslon 42px, black, followed by a description in Helvetica 20px. Optional 50px-pill 'Download' button in #e0e0e0 with black text.

### Project Tile (Dark)
Role: Inverted project entry for visual rhythm
Same dimensions as the light tile but the right half is a #131313 carbon-black panel with minimal white progress indicators (four short white dashes) at the bottom — mimicking a video player scrubber. Used to alternate against light tiles.

### Download Button
Role: Neutral pill action
50px border-radius pill. Fill #e0e0e0 (Bone Gray). Padding 5px top/bottom, 20px left/right. Text in Helvetica 20px black, weight 400, letter-spacing -0.02em. No border, no shadow. Sits inline with project titles.

### Video Thumbnail
Role: Clickable preview for project media
Full-bleed 16:9 rectangle, no border, no radius. Centered white triangle play icon (no background plate). Behind the icon: full-color 3D render or animation frame — these are the only places saturated color appears, and they are content, not UI.

### Page Divider
Role: Visual break between project entries
1px solid #000000 horizontal line spanning the full content width, with 180px of vertical space on either side. Functions like a section break in a printed catalog.

## Do

- Set the hero wordmark oversized in Caslon at weight 400, tight tracking (-0.02em), so one word fills the full viewport width
- Use #e0e0e0 as the page canvas — never pure white at the page level; reserve #ffffff for card surfaces only
- Use Studio Indigo #31338 exactly once per surface as the only chromatic accent
- Set body text at 20px Helvetica weight 400 with -0.03em letter-spacing — bigger and tighter than web convention
- Give buttons and the STUDIO badge a 50px pill radius for the only rounded elements in the system
- Separate project tiles with a 1px black hairline and 180px vertical space to read as a printed catalog
- Let interactive illustrations physically break through or weave between the serif letterforms in the hero

## Never

- Do not introduce any color other than the four neutrals and Studio Indigo — no gradients, no tints, no hover-state color shifts
- Do not use shadows, glows, or elevation — the design is flat like print, with no synthetic depth
- Do not add border-radius to cards, tiles, or thumbnails — they must stay sharp like cut paper
- Do not set body text below 20px or add bold/medium weights to Helvetica — weight 400 is the only weight that exists
- Do not use Caslon for anything below the hero — reserve it for the wordmark and project titles to preserve its weight
- Do not add underlines, color, or icons to links in the client/feature lists — they read as plain text on purpose
- Do not center body text or list items — the ledger columns are left-aligned like a contact page

## Agent Prompt Guide

## Quick Color Reference
- background: #e0e0e0
- text: #000000
- card surface: #ffffff
- border: #000000
- accent: #31338e (Studio Indigo)
- primary action: no distinct CTA color

## 3-5 Example Component Prompts

1. **Build a three-column info ledger**: Bone Gray #e0e0e0 page background, three equal columns separated only by whitespace. Left column: contact name in Helvetica 20px weight 400 black, then email below. Middle column: heading 'Selected Clients' in Helvetica 20px black, then list of client names each on its own line. Right column: heading 'Features' in Helvetica 20px black, then list of publications with years. No dividers, no bullets, no links styled differently.

2. **Build a full-bleed wordmark hero**: Black #000000 background optional, but a Caslon (or Playfair Display fallback) weight 400 wordmark at approximately 200px, letter-spacing -0.04em, fills the full viewport width. Color #000000. Position a Studio Indigo #31338e pill badge (50px border-radius, 5px 20px padding, white Helvetica 20px text) overlapping the lower-left of the first letter.

3. **Build a light project tile**: Two-column grid cell. Top half: 16:9 video thumbnail with no border or radius, centered white triangle play icon, behind it a saturated 3D-render-style fill (pink/magenta gradient). Bottom half: 20px vertical gap, then project title in Caslon 42px weight 400 black, letter-spacing -0.02em, line-height 1.0. Below: 10px gap, then description in Helvetica 20px black. A 50px-pill Download button (fill #e0e0e0, black Helvetica 20px text) sits inline to the right of the title.

4. **Build a dark project tile**: Same dimensions as the light tile, but the right half is a solid #131313 panel. At the bottom-center of the dark panel, render four short white horizontal dashes (each ~20px wide, 2px tall, 8px apart) as a video player scrubber indicator. No other UI on the dark panel.

5. **Build a page divider**: A 1px solid #000000 horizontal line spanning the full content width, with 180px of vertical space above and below. No other styling — it functions like a printed section break.
