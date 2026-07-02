# Home page | Impossible Foods — Style Reference
> Blood-red punk poster in velvet darkness. A custom condensed display face bleeds across a wine-dark canvas while single-color red CTAs punch through like a price tag on a butcher's chalkboard.

**Theme:** dark

Impossible Foods runs a dark, wine-dark canvas flooded with blood-red accents — the visual register of a punk-rock manifesto printed on butcher paper. Typography is the loudest voice: display text is enormous, brutally tight (line-height 0.73), and slightly opened in tracking, shouting product names like 'STEAK (FROM PLANTS)' in a custom condensed sans that fills the viewport. The single red (#e10600) carries all action and emphasis, with a soft blush pink (#ffc7c6) providing tonal relief and a near-black burgundy (#4f0423/#260212) for depth. Surfaces are flat, borders are crisp black hairline strokes, and food photography is presented in irregular mask-cut shapes that float around the type rather than inside conventional frames. The overall rhythm is aggressive but disciplined: massive display moments punctuated by compact product grids and pill-shaped toggle controls.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Velvet Wine | `#260212` | Page canvas and deepest section background — the floor everything sits on | neutral |
| Burgundy Stage | `#4f0423` | Section and card surfaces, slightly lifted from the canvas to separate bands of content | neutral |
| Impossible Red | `#e10600` | Primary action buttons, active toggles, headline accents, icon emphasis — the single chromatic signal that commands attention | brand |
| Blush Highlight | `#ffc7c6` | Soft secondary text, pill toggles in default state, link hover, tonal counterpoint to the aggressive red | accent |
| Butcher Black | `#000000` | Top navigation background, hairline borders, card outlines, deep contrast strokes | neutral |
| Bone White | `#ffffff` | Navigation and button text, body copy on dark surfaces, inverted toggle text | neutral |

## Tokens — Typography

- **sans-meat** — sizes: 10, 12, 14, 18, 20, 22, 24, 28, 32, 40, 48, 103, 126, 149, 150, 153, 160, 161, 185, 189, 204, 226, 228, 231px; weight: 400, 500, 700; line-height: 0.73–0.90 for display, 1.10–1.70 for body and UI; letter-spacing: 0.02em on UI labels, 0.03em on small caps, 0.06em on the most aggressive display moments. Role: The only typeface on the site. Carries everything from 10px micro-labels to 231px hero statements. Weight 700 dominates display and CTAs; 400 and 500 handle body, nav, and secondary UI. The display sizes are anti-convention — most brands cap hero text around 64–80px; sans-meat's display reaches viewport-filling proportions because the brand is built on the stunt of oversized declarations like 'STEAK (FROM PLANTS)' and 'THE POTLUCK'.

## Type Scale

- caption: 10px / lh 1.4 / ls 0.02
- body-sm: 14px / lh 1.4 / ls 0.02
- body: 18px / lh 1.4 / ls 0.02
- subheading: 24px / lh 1.15 / ls 0.02
- heading-sm: 32px / lh 1.1 / ls 0.02
- heading: 48px / lh 0.9 / ls 0.02
- heading-lg: 103px / lh 0.75 / ls 0.03
- display: 160px / lh 0.73 / ls 0.06

## Spacing & Shape

- Radius — buttons: 15px, cards: 12px, inputs: , tags: 
- Element gap: 6-16px; Section gap: 40-64px; Card padding: 16-24px; Page max-width: 1280px

## Components

### Sticky Top Navigation
Role: Persistent site header
Full-width #000000 bar, 15px radius on right-side CTA buttons, left-aligned 'IMPOSSIBLE' wordmark in #e10600, centered nav links in #ffffff with caret indicators, right-aligned 'Foodservice' dropdown and 'Find Us' CTA. Sticky to top of viewport.

### Primary CTA Button
Role: Filled action button
#e10600 background, #ffffff text, sans-meat weight 500, 14px size, 0.02em letter-spacing, uppercase. Radius 15px, padding 10px 14px, gap 6px. Includes a right-side caret arrow. Used for 'LEARN MORE', 'FIND US'.

### Ghost CTA Button
Role: Secondary action button
Transparent background, #ffffff 1px border, #ffffff text. Same typography, radius, and padding as Primary CTA. Pairs with a filled CTA to offer two-step engagement (e.g. LEARN MORE filled + FIND IT ghost with location pin).

### Filter Pill Toggle
Role: Category or recipe filter selector
Pill-shaped (15px radius), padding 10px 16px, 6px gap between pills. Active state: #e10600 background, #ffffff text. Default state: transparent with #ffc7c6 text or dark border with #ffffff text. 14–18px sans-meat uppercase, weight 500, 0.02em tracking.

### Hero Display Block
Role: Full-width section opener with oversized type
Centered stack on #260212 or #4f0423 canvas. Eyebrow label at 14–18px sans-meat 500 uppercase. Display headline at 160–231px sans-meat 700, line-height 0.73, letter-spacing 0.06em, color #e10600. Often uses parenthetical asides in a second line. A small CTA button (Primary CTA pattern) sits below.

### Product Carousel Card
Role: Showcase for packaged product
Product packaging photograph on #4f0423 background, no visible card border, no shadow. Below image: product name in 22–24px sans-meat 700 uppercase #ffc7c6 or #ffffff, 0.02em tracking. Two CTAs side by side — filled 'LEARN MORE' and ghost 'FIND IT' with pin icon. Pagination dots below carousel.

### Category Tab with Number Badge
Role: Product line selector (Beef, Sausage, Chicken)
Uppercase sans-meat 400–500 label, 20–24px, #ffc7c6. Small circular number badge to the right, 16px, #ffffff text on #4f0423 fill, fully round. Underline appears on active tab.

### Masked Food Photography
Role: Decorative hero imagery
Food shots cropped in irregular organic shapes (not rectangles, not circles — something between a blob and a rough hexagon). Treated as floating decoration around hero display type, not framed in a card. No border, no shadow, full color saturation, sharp edge.

### Section Heading with Bracket Accents
Role: Mid-page section introducer
Small all-caps eyebrow phrase bracketed by stylized arrow or chevron glyphs (e.g. '◂ FLEX ON EVERYONE AT ▸') at 14–18px sans-meat 500, #e10600. Massive display headline directly below at 103–160px sans-meat 700 #e10600.

### Recipe / Product Grid Card
Role: Content grid unit
12px or 38px radius (the large radius is used for one prominent feature card). #4f0423 surface, 1px #000000 hairline border, 16–24px internal padding. Image fills top, text and optional CTA below.

### Location Pin Icon Button
Role: Find product / store locator
Ghost button variant carrying a small map-pin glyph before the label. #ffffff border, #ffffff text, 14px sans-meat 500, 15px radius, 10px 14px padding.

### Nav Logo Mark
Role: Brand identifier in top nav
'IMPOSSIBLE' set in condensed sans-meat 700, all caps, #e10600, tightly tracked, 18–20px. Sits in a small white pill or directly on the black nav bar.

## Do

- Use sans-meat at display sizes of 103px or larger for hero and section opener text — anything smaller defeats the aggressive declaration effect.
- Set display line-height to 0.73–0.75 and letter-spacing to 0.06em; this tight-but-opened tracking is what makes the type feel like a shouted label rather than a polished headline.
- Reserve #e10600 exclusively for primary action, active toggles, and the display type itself — never use it for body copy or borders.
- Pair a filled Primary CTA with a Ghost CTA on the same row; the contrast between filled-red and outlined-white creates the brand's signature two-step engagement.
- Set pill toggles and buttons to 15px radius — this is the unifying shape language across nav, CTAs, and filters.
- Crop food photography in irregular organic mask shapes when used decoratively near hero text; use clean rectangular framing only inside product cards.
- Keep the nav bar solid #000000 with white text regardless of the section beneath; the black bar is the visual anchor across the dark page.

## Never

- Don't add drop shadows, glows, or gradients to cards or buttons — the system is intentionally flat and relies on color contrast alone for hierarchy.
- Don't introduce new chromatic colors; the entire interface is wine + red + blush + black + white. Any additional hue breaks the discipline.
- Don't use sans-meat below 10px or for long-form paragraphs — it is a display and UI face, not a reading face.
- Don't place body copy or secondary text in #e10600; red is reserved for actions and headline punctuation.
- Don't use rectangular product photography in hero zones — only mask-cut shapes belong near display type.
- Don't soften the line-height of display text below 0.80; open tracking is the only thing preventing the massive type from feeling cramped.
- Don't use a light or white page background; the wine-dark canvas is the non-negotiable foundation of the brand's visual register.

## Agent Prompt Guide

**Quick Color Reference**
- text (on dark): #ffffff
- background: #260212
- surface / card: #4f0423
- border: #000000
- accent / soft text: #ffc7c6
- primary action: #e10600 (filled action)

**3-5 Example Component Prompts**
1. *Build a hero section*: full-bleed #260212 background. Centered eyebrow at 14px sans-meat 500, #e10600, uppercase, 0.02em tracking. Display headline below at 160px sans-meat 700, #e10600, line-height 0.73, letter-spacing 0.06em, spanning two lines with a parenthetical aside on line two. Primary CTA below: #e10600 fill, #ffffff text, 15px radius, 10px 14px padding, 14px sans-meat 500, caret arrow on the right.

2. *Build a product carousel card*: 12px radius card, #4f0423 surface, no shadow, 1px #000000 hairline border. Product packaging photo fills the top 60% with no internal padding. Below: product name at 24px sans-meat 700 #ffc7c6, uppercase, 0.02em tracking. Two CTAs side by side — filled 'LEARN MORE' (#e10600, white, 15px radius) and ghost 'FIND IT' (transparent, #ffffff 1px border, location-pin glyph, white text, 15px radius).

3. *Build a filter toggle group*: three pills in a horizontal row, 6px gap, all 15px radius, 10px 16px padding, 14px sans-meat 500 uppercase, 0.02em tracking. Default state: transparent fill, #ffc7c6 text. Active state: #e10600 fill, #ffffff text. Center the group in its section.

4. *Build a category tab with number badge*: row of three items (BEEF, SAUSAGE, CHICKEN), 20px sans-meat 500 #ffc7c6, uppercase, 0.02em tracking, with a 16px fully-round number badge to the right of each label (#4f0423 fill, #ffffff text, centered). Underline the active tab in #e10600.

5. *Build a section opener with bracket accents*: small centered eyebrow line reading '◂ FLEX ON EVERYONE AT ▸' at 14px sans-meat 500 #e10600, uppercase, 0.02em tracking. Display headline below at 103px sans-meat 700 #e10600, line-height 0.75, letter-spacing 0.03em. Centered stack on #260212 canvas with 64px vertical padding above and below.

## Display Type Philosophy

The display sizes (103–231px) are not aspirational — they are the brand's primary voice. Every page or major section should carry at least one statement at this scale. The aggressive line-height (0.73–0.75) is non-negotiable: opening it up makes the type feel like a marketing headline rather than a punk poster. Positive tracking (0.06em at the largest sizes) is counterintuitive — most display type tightens at scale — but it prevents the letters from collapsing into each other and gives the type its shouted, all-caps-poster quality. Treat the parenthetical aside ('(FROM PLANTS)') as a structural device, not a decoration: it breaks the line into a claim and a qualifier, reinforcing the product proposition.

## Color Discipline

Six colors run the entire system. Any new chromatic color is a brand violation. The red (#e10600) is doing the work of ten colors in a typical palette — it is simultaneously the primary action, the active state, and the display type color. The blush (#ffc7c6) plays the role usually filled by a light gray: secondary text, inactive toggles, soft counterpoints. Wine (#260212) and burgundy (#4f0423) create depth without ever needing shadows. There is no success/error/warning semantic system visible — the brand treats 'Impossible Red' as both the action color and the only emphasis color, so semantic state is not part of the interface language.
