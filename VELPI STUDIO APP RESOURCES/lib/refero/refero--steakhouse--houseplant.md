# HOUSEPLANT — Style Reference
> walnut bookstore on linen paper

**Theme:** light

Houseplant operates in a warm, earthy monochrome — deep walnut brown on aged cream, with the product photography doing all the chromatic work. The system reads like a vintage housewares catalog: tight custom typography, generous breathing room, no decorative gradients, and almost no accent color. The dark brown #321e1 is both text and surface, flipping between background and foreground depending on context, while the cream #f4f1e1 plays canvas. Components are minimal — solid filled buttons, hairline dividers, soft cards with a single subtle shadow. The signature move is the oversized custom wordmark that anchors the page footer, treating the brand name as a graphic element rather than a logo.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Walnut | `#321e1e` | Primary text color, filled action buttons, dark hero sections, footer wordmark. Deep warm brown that reads as near-black while carrying the brand's earthy warmth — used as both foreground and background surface | brand |
| Linen | `#f4f1e0` | Page canvas, card surfaces, light text on dark backgrounds. Warm aged-cream that gives the entire system its paper-like, vintage quality | neutral |
| Graphite | `#464545` | Secondary borders, muted helper text, subtle dividers. Neutral medium gray providing quiet separation without competing with the Walnut/Linen pair | neutral |
| Espresso | `#463938` | Button text on light surfaces, alternate dark fill. Slightly lighter brown variant for typographic contrast within the dark family | neutral |
| Onyx | `#000000` | Icon strokes, true-black accents on borders. Used sparingly where absolute contrast is needed | neutral |
| Soft Sand | `#f4f4f4` | Alternate light surface, hover-state wash. Neutral off-white for slight tonal shifts away from the cream canvas | neutral |

## Tokens — Typography

- **Houseplant** — sizes: 14px, 16px, 18px, 20px, 21px, 28px, 30px, 32px, 45px, 60px, 70px; weight: 400, 500, 600; line-height: 1.00–2.79; letter-spacing: -0.05em at 60-70px, -0.047em at 45px, -0.02em at 14-32px. Role: Custom display and body typeface used for all UI text — headlines at 30-70px with tight negative tracking, body at 16-20px, captions at 14px. The custom font carries geometric warmth that off-the-shelf alternatives cannot replicate
- **Roboto** — sizes: 16px; weight: 400; line-height: 2.00; letter-spacing: . Role: Fallback body text — minimal usage, system-safe default
- **NeueHelvetica55Roman** — sizes: 16px; weight: 400; line-height: 1.15, 1.63; letter-spacing: . Role: NeueHelvetica55Roman — detected in extracted data but not described by AI
- **GTStandard-M** — sizes: 16px; weight: 400; line-height: 1.5; letter-spacing: . Role: GTStandard-M — detected in extracted data but not described by AI

## Type Scale

- caption: 14px / lh 1.71 / ls -0.02
- body-sm: 16px / lh 1.5 / ls -0.02
- body: 18px / lh 1.44 / ls -0.02
- subheading: 21px / lh 1.33 / ls -0.02
- heading-sm: 28px / lh 1.3 / ls -0.02
- heading: 32px / lh 1.3 / ls -0.021
- heading-lg: 45px / lh 1.15 / ls -0.047
- display: 70px / lh 1 / ls -0.05

## Spacing & Shape

- Radius — buttons: 4px, cards: 8px, inputs: 4px, tags: 4px
- Element gap: 20px; Section gap: 80-120px; Card padding: 20px; Page max-width: 1200px

## Components

### Primary Filled Button
Role: Main action button — Shop Now, Explore Now, Submit
Solid Walnut (#321e1e) background, Linen (#f4f1e0) text at 16px weight 500, 4px radius, 12px vertical × 30px horizontal padding, uppercase tracking. Shadow rgba(0,0,0,0.15) 0px 2px 8px. Letter-spacing -0.02em for a tight, confident feel

### Outlined / Ghost Button
Role: Secondary action on dark backgrounds — Explore Now on dark hero
Transparent background, 1px Linen (#f4f1e0) border, Linen text, 4px radius, 12px vertical × 20-30px horizontal padding. Used when the primary filled button would be lost against a dark surface

### Product Card
Role: E-commerce product tile in grid layouts
Linen (#f4f1e0) background, 8px radius, 20px padding, shadow rgba(0,0,0,0.1) 0px 2px 8px. Product image on top half, product name in 16px Walnut, price in 14px, filled Shop Now button below. Card has no border — the shadow does the separation work

### Navigation Bar
Role: Top-level site navigation
Solid Walnut (#321e1e) background, full-width, ~60px tall. Brand wordmark centered in Linen with house icon, nav links in 16px Linen uppercase with -0.02em tracking spaced horizontally. Account/cart icons on far right. Underline appears on active/hover state

### Hero Banner
Role: Full-bleed promotional section — Italian Collection, New Arrivals
Edge-to-edge image with text overlay, no gradient. Bold display headline (30-45px) in warm color. Diagonal geometric shapes in solid blocks (terracotta, green) frame the composition for a vintage poster aesthetic

### Dark Feature Section
Role: Promotional block on Walnut background — Houseplant + Carbone
Full-width Walnut background, two-column layout: product image left, headline + body + ghost button right. Headline at 32-45px Linen weight 500, body at 16-18px Linen. Generous vertical padding (~80-100px) for breathing room

### Section Header
Role: Category section title — New & Featured
Left-aligned, 21-28px Walnut weight 500, 8-10px margin-bottom. Uppercase tracking, hairline border or no decoration. Sits flush left at content edge

### Footer Wordmark
Role: Brand identity anchor at page bottom
Full-bleed Walnut (#321e1e) text 'HOUSEPLANT' at 60-70px weight 600, -0.05em letter-spacing, filling the viewport width. Functions as both branding and visual closing — the text IS the graphic element, no logo or icon accompanies it

### Footer Link List
Role: Site utility links — Contact, FAQ, Privacy, Terms
Stacked text links in 16-18px Walnut on Linen background, no bullet markers, generous line-height (~2.5). Separated by hairline Graphite (#464545) horizontal rules

### Social Icon Link
Role: Footer social media icons — Instagram, Twitter, Facebook
Walnut line icons, ~24px, no fill, 1.5px stroke weight. Spaced 20-30px apart in a horizontal row. Minimal — icons are recognizable at small sizes without color coding

### Price Label
Role: Product pricing display under product name
14-16px Walnut weight 400, $XX.XX format, left-aligned. No sale/strike-through treatment detected — pricing stays simple

### Product Image Container
Role: Image holder within product card
Full card-width image, no border or radius at top (inherits card's 8px radius only at corners), object-fit cover. Photography is warm-lit, lifestyle-context, often on wood or marble surfaces

## Do

- Use #321e1 as the single primary action color — solid fill for buttons, no gradients, no hover color shifts
- Set page canvas to #f4f1e0 (Linen) — never pure white. The warm cream is the system's identity
- Apply -0.05em letter-spacing at 45px+ and -0.02em at body sizes. Tracking is non-negotiable for the custom typeface's character
- Use 4px radius for all buttons and 8px for all cards. Do not introduce larger radii — the system stays sharp
- Let product photography supply all chromatic color. The UI stays monochromatic brown/cream; images bring terracotta, green, and warm wood tones
- Maintain generous vertical rhythm: 80-120px between major sections, 20px between elements, 20px card padding
- Anchor every page with the oversized footer wordmark at 60-70px — the brand name as graphic closure

## Never

- Never use pure white (#FFFFFF) for backgrounds — Linen #f4f1e0 is the canonical canvas
- Do not introduce accent colors (blue, green, red) for buttons or interactive states — the brown/cream system is intentionally narrow
- Do not use sans-serif system fonts for headlines — the custom Houseplant typeface at 30px+ is the brand's signature
- Avoid drop shadows beyond the single rgba(0,0,0,0.1) 0px 2px 8px on cards. No glow effects, no colored shadows
- Do not center body text or product descriptions — left-align everything except the nav wordmark and hero headlines
- Never use border-radius above 8px. Pills, circles, and large rounded shapes break the vintage-catalog geometry
- Do not add gradients, glassmorphism, or decorative overlays. The system is flat surfaces, hairline rules, and soft shadows only

## Agent Prompt Guide

Quick Color Reference:
- text: #321e1e (Walnut)
- background: #f4f1e0 (Linen)
- border: #464545 (Graphite)
- accent: none — system is monochromatic
- primary action: #321e1e (filled action)

Example Component Prompts:

1. Create a product card: Linen (#f4f1e0) background, 8px radius, 20px padding, shadow rgba(0,0,0,0.1) 0px 2px 8px. Product image fills top half. Below: product name at 16px Houseplant weight 500 in Walnut, price at 14px weight 400. Filled Shop Now button: #321e1e background, #f4f1e0 text, 4px radius, 12px×30px padding, weight 500.

2. Create a navigation bar: Full-width #321e1e background, 60px height. Brand wordmark centered at 18px Houseplant weight 600 in #f4f1e0. Nav links (SHOP ALL, NEW ARRIVALS, ITALIAN COLLECTION, SCENT, COLLABORATIONS, EXPLORE) in 14px uppercase #f4f1e0 with -0.02em tracking, spaced horizontally.

3. Create a dark feature section: Full-width #321e1e background, two-column 50/50 split. Left: product image with no border. Right: headline at 32px Houseplant weight 500 in #f4f1e0, body text at 16px weight 400 in #f4f1e0, ghost button with 1px #f4f1e0 border, #f4f1e0 text, 4px radius.

4. Create a section header: Left-aligned 'NEW & FEATURED' at 21px Houseplant weight 500 in #321e1e, uppercase, -0.02em letter-spacing, 8px margin-bottom. No decoration, no border.

5. Create a footer wordmark: Full-width #321e1e block, 'HOUSEPLANT' text filling the viewport at 60-70px Houseplant weight 600, -0.05em letter-spacing, #321e1e color, line-height 1.0. Functions as the page's visual closing element.
