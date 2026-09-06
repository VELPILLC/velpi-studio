# Foundry — Style Reference
> orange-lit type cathedral — a black room where enormous illuminated letterforms hang as exhibits and the only guide rails are pale wireframe borders and one neon marker color.

**Theme:** dark

Foundry is a type foundry presented as a dark workbench where the products are also the interface. A near-black canvas (#121212) hosts sharp-cornered UI chrome built almost entirely from monospaced text and hairline borders, giving the whole site the feel of a developer's terminal crossed with a gallery wall. The only chromatic voice is a vivid orange (#ff4d00) used as a structural accent on the logo, outlined action borders, and selective highlights — never as a filled button background, which keeps the accent feeling like a warning lamp or marker stroke rather than a brand paint job. Every screen is a specimen: massive custom display faces (90–234px) dominate the viewport, the UI recedes around them, and even sidebar items are styled as labeled tags. Compact spacing, near-zero radii (2.8px), and uppercase monospace metadata reinforce a precise, industrial, no-decoration sensibility — decoration lives entirely inside the typefaces themselves.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Ember Orange | `#ff4d00` | Orange accent for outlined action borders, linked labels, and lightweight interactive emphasis. Do not promote it to the primary CTA color | brand |
| Foundry Black | `#121212` | Page background, section canvas, main surface — the dominant ground that lets white type and orange accents read as luminous | neutral |
| Chalk White | `#e2e8f0` | Hairline borders, nav rules, link underlines, tag outlines — the wireframe color that constructs the entire UI scaffold | neutral |
| Bone White | `#efefef` | Primary body and UI text, icon strokes, button text, secondary surface fills — the readable text color and the inverse fill used for emphasized controls | neutral |
| Soot | `#3a3a3a` | Low-contrast structural borders, subtle dividers between stacked sections — the quietest rule line, only visible against the bone-white inverted surfaces | neutral |
| Ash | `#747474` | Muted helper text, inactive labels, secondary metadata — recedes so the monospace chrome can carry hierarchy without competing with display type | neutral |

## Tokens — Typography

- **JetBrains Mono** — sizes: 12px, 14px, 18px; weight: 400, 700; line-height: 1.14, 1.29, 1.30, 1.32, 1.40, 1.50; letter-spacing: -0.02em, 0.01em, 0.04em, 0.06em. Role: The operating-system font: drives the sidebar navigation, font-spec labels, button text, metadata strips, and body copy. Treated as a UI element itself — uppercase, tracked-out (0.04–0.06em) for labels, tight (-0.02em) for body. Its monospaced geometry is the visual signature of every chrome component.
- **Inter** — sizes: 14px, 16px, 18px; weight: 400; line-height: 1.29, 1.30, 1.50; letter-spacing: normal. Role: Secondary text voice for longer-form copy blocks and supporting paragraphs that need a less technical rhythm than the monospace. Appears sparingly so the monospace remains the dominant signal.
- **Basement Grotesque, FFFLAUTA, B-Mecha, Bunker, Caniche, Carpenter, Curia, Adhesion, Trovador, XER0, Blob** — sizes: 90px (FFFLAUTA) → 120px (Basement Grotesque, B-Mecha) → 156–234px (the rest); weight: 400 (each is a single-weight specimen); line-height: 0.95–1.20; letter-spacing: 0.01em. Role: Display specimens — the products. Each fills a full-width section at monumental size, set tight (0.95–1.10 leading) with a hair of positive tracking. An AI agent should treat these as content blocks to be authored, not as system fonts to be re-created; substitute with the user's own display typefaces at proportional sizes.
- **FFFLAUTA 400** — sizes: 90px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: FFFLAUTA 400 — detected in extracted data but not described by AI
- **Basement Grotesque Black Expanded** — sizes: 120px; weight: 400; line-height: 0.95; letter-spacing: 0.01. Role: Basement Grotesque Black Expanded — detected in extracted data but not described by AI
- **Mecha Regular** — sizes: 120px; weight: 400; line-height: 1.2; letter-spacing: 0.01. Role: Mecha Regular — detected in extracted data but not described by AI
- **Curia Regular** — sizes: 156px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: Curia Regular — detected in extracted data but not described by AI
- **Adhesion Regular** — sizes: 164px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: Adhesion Regular — detected in extracted data but not described by AI
- **Carpenter Regular** — sizes: 169px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: Carpenter Regular — detected in extracted data but not described by AI
- **Bunker Regular** — sizes: 185px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: Bunker Regular — detected in extracted data but not described by AI
- **Trovador Regular** — sizes: 198px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: Trovador Regular — detected in extracted data but not described by AI
- **XER0 Regular** — sizes: 198px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: XER0 Regular — detected in extracted data but not described by AI
- **Caniche Regular** — sizes: 203px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: Caniche Regular — detected in extracted data but not described by AI
- **Blob Regular** — sizes: 234px; weight: 400; line-height: 1.1; letter-spacing: 0.01. Role: Blob Regular — detected in extracted data but not described by AI

## Type Scale

- caption: 12px / lh 1.4 / ls 0.04
- body-sm: 14px / lh 1.29 / ls -0.02
- body: 16px / lh 1.5 / ls 0
- subheading: 18px / lh 1.32 / ls 0
- display: 120px / lh 0.95 / ls 0.01

## Spacing & Shape

- Radius — buttons: 2.8px, cards: 8px, inputs: , tags: 2.8px
- Element gap: 8px; Section gap: 64px; Card padding: 15px; Page max-width: 1440px

## Components

### Sidebar Nav Item (Tag)
Role: Navigation entry styled as a labeled tag, the primary wayfinding element
Inverted surface fill (#efefef) with #121212 text; 2.8px radius; ~10px vertical padding and 6–10px horizontal padding; 12–14px JetBrains Mono 400, uppercase, letter-spacing 0.04em. When a count badge appears (e.g. "10"), the number is a separate inline pill in the same color, no border separator.

### Sidebar Section Header
Role: Group label above nav tag clusters
No background; 12–14px JetBrains Mono 700 (or 400 with +0.06em tracking), uppercase, #efefef; preceded by a small geometric marker (L-shaped bracket in #efefef).

### Outlined Action Button (BUY NOW)
Role: Primary commercial action
Transparent fill; 1px solid #ff4d00 border; 2.8px radius; 10px 15px padding; 12–14px JetBrains Mono 400, uppercase, letter-spacing 0.04em, #ff4d00 text. The orange outline is the entire signal — no fill, no shadow.

### Ghost Action Button (EXPLORE)
Role: Secondary action paired with the outlined CTA
Transparent fill; 1px solid #efefef border; 2.8px radius; 10px 15px padding; 12–14px JetBrains Mono 400, uppercase, #efefef text and border.

### Font Specimen Card
Role: Showcase block for a single typeface in the catalog grid
Full-width band on #121212 canvas, separated by a 1px #e2e8f0 hairline at the top. Interior: a top metadata strip (font name on the left, "N STYLES / N HEIGHTS" plus a glyph-size toggle and mode toggle in the center, action buttons on the right), then a generous vertical gap to the display specimen set at 90–234px. No card background, no shadow — the hairline border IS the card chrome.

### Metadata Strip
Role: Top utility bar of each specimen section
Single horizontal row, 12–14px JetBrains Mono 400 uppercase, #efefef text; 1px #e2e8f0 bottom border. Houses: section name (left), type stats and toggles (center), action buttons (right). 10–15px vertical padding.

### Ticker / Announcement Bar
Role: Scrolling top-of-page notification
1px tall hairline border in #e2e8f0, dark fill; inline monospaced text scrolling horizontally; small geometric triangle markers as separators between phrases.

### Logo Mark
Role: Brand identifier, top-left, persistent across screens
Two-line stacked wordmark in Basement Grotesque (or equivalent heavy display face) set in #ff4d00 — "BASEMENT" over "FOUNDRY." The period is part of the mark. Orange against black is the loudest single element on any screen.

### Body Copy Block
Role: Long-form descriptive paragraph
Inter 400, 14–16px, line-height 1.5, #efefef; sits below a specimen as a quiet explanatory footnote. Constrained to roughly 40–50ch column width.

### Glyph Toggle / Mode Pill
Role: Small control switching the displayed character set or display mode
Inline JetBrains Mono 12–14px, uppercase; current state shown with a small icon glyph (Aa, ¶, etc.) rather than a colored fill; sits inside the metadata strip.

## Do

- Use JetBrains Mono 400 for all UI chrome — nav, labels, metadata, buttons, section headers. It is the operating-system font.
- Set sidebar items and button text in uppercase with 0.04em letter-spacing; reserve tight tracking (-0.02em) for running body text only.
- Use the orange #ff4d00 only as a 1px outlined border or as a text accent — never as a filled background. The outlined-buy-now button is the canonical use.
- Keep all corners sharp: 2.8px for nav, tags, and buttons; 8px only for larger card containers. Nothing round.
- Build depth through color inversion (bone-white panel on near-black canvas) and hairline #e2e8f0 borders — never through drop shadows.
- Let one display typeface fill the full width of its section at 90–234px; treat the specimen area as an exhibition, not a constrained content card.
- Pair every action button with a ghost companion (e.g. outlined orange BUY NEXT to ghost white EXPLORE) in the same row.

## Never

- Don't fill buttons or surfaces with #ff4d00 — it is exclusively a stroke and text accent.
- Don't introduce new accent colors; the palette is monochromatic neutrals plus exactly one chromatic voice.
- Don't apply drop shadows or heavy elevation to any component; the system is flat by design.
- Don't set body copy or metadata in the display typefaces — those are specimen content, not UI fonts.
- Don't use radii larger than 8px anywhere; the 2.8px tag radius is a signature and any rounding larger breaks the blueprint feel.
- Don't use Inter for labels, buttons, or metadata — reserve it for paragraph-length supporting copy only.
- Don't center the page layout: the sidebar is fixed-left, content is left-aligned within its column, and the canvas extends right.

## Agent Prompt Guide

Quick Color Reference
- text (primary): #efefef
- text (muted/helper): #747474
- background (canvas): #121212
- border (hairline): #e2e8f0
- accent: #ff4d00
- primary action: #efefef (filled action)

3–5 Example Component Prompts
1. **Sidebar tag nav item**: Inverted #efefef fill, #121212 text, 2.8px radius, 10px 10px padding. Label in JetBrains Mono 14px, weight 400, uppercase, letter-spacing 0.04em. If a count follows (e.g. "BUNKER 4"), render the number as inline text on the same line, no separator.

2. Create a Primary Action Button: #efefef background, #747474 text, 9999px radius, compact pill padding. Use this filled treatment for the main CTA.

3. **Ghost secondary action button**: Transparent fill, 1px solid #efefef border, 2.8px radius, 10px 15px padding. Text in JetBrains Mono 12px, weight 400, uppercase, letter-spacing 0.04em, color #efefef. Label "EXPLORE".

4. **Font specimen card**: Full-width band on #121212 canvas with a 1px #e2e8f0 top border. Top metadata strip: font name in JetBrains Mono 12px uppercase #efefef on the left, "N STYLES / N HEIGHTS" + glyph/mode toggles centered, action buttons on the right. Below, a 60–80px vertical gap, then a single display specimen set full-width at 120–200px in #efefef.

5. **Top ticker bar**: Full-bleed, 1px tall, #121212 background, 1px #e2e8f0 bottom border. Scrolling inline text in JetBrains Mono 12px uppercase, #efefef, separated by small triangle markers.

## Typeface-as-Content Rule

Every display face in the catalog (Basement Grotesque, Bunker, Curia, Adhesion, Trovador, XER0, etc.) is content, not system typography. An AI agent reproducing a page should pick one of these custom families to fill the hero/specimen area, but the rest of the UI must always fall back to JetBrains Mono (UI) and Inter (long body copy). Never use a specimen face for nav, buttons, labels, or metadata.
