# Ghia — Style Reference
> Mediterranean sunset on a vintage aperitivo label

**Theme:** light

Ghia expresses itself as a Mediterranean aperitivo label in digital form: warm cream canvases, deep wine-burgundy sections, and coral-pink CTAs that feel like vintage packaging. The type system pairs a humanist transitional serif (Vivey) for warmth and readability with a condensed display sans (FHA Condensed) for editorial all-caps headlines — the same contrast you'd find on an Italian spirits label. Components are rounded and tactile: pill buttons, circular product frames, and full-bleed product photography. The page alternates between sun-warmed cream surfaces and dark burgundy statement blocks, with color used sparingly to make the pink CTAs and blue accent moments pop. Density is relaxed and editorial — generous margins, large display headlines, and product photography that takes visual priority over text.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Ghia Burgundy | `#651c32` | Primary brand color, header bar, statement sections, marquee bands, footer — the deep wine that grounds the whole system | brand |
| Coral CTA | `#ef6079` | Filled pill buttons (Shop Bestsellers, Add to Cart, Our Story), active tab indicators, small accent dots | brand |
| Aperitivo Cream | `#f2e2d5` | Primary page canvas and warm card surfaces | neutral |
| Bone White | `#fef6ee` | Lightest surface, header text on dark, soft secondary card backgrounds | neutral |
| Smoke Gray | `#e5e7eb` | Hairline borders, dividers, subtle structural separators | neutral |
| Charcoal | `#000000` | Icons, fine details, logo strokes on light surfaces | neutral |
| Olive Grove | `#3e4938` | Supporting neutral for secondary UI, dividers, and muted labels. Do not promote it to the primary CTA color | neutral |
| Dusty Rose | `#dfcac8` | Soft accent border, tag backgrounds, muted product label echo | accent |
| Riviera Blue | `#abd2eb` | Blue supporting accent for decorative details and low-frequency emphasis | accent |
| Limoncello Yellow | `#f0e87b` | Highlight tags, sticker accents, energetic punctuation — the spark of citrus in the system | accent |
| Sage Mist | `#b6cfd0` | Muted surface accent, cool-toned badge or chip background | accent |

## Tokens — Typography

- **Vivey 22 Positive** — sizes: 10, 12, 13, 14, 15, 16, 18px; weight: 400, 700; line-height: 1.0–1.56; letter-spacing: . Role: Primary text face — body copy, nav links, buttons, product cards, footer. The humanist serif carries warmth and editorial feel; its italic-influenced curves feel handwritten and aperitivo-friendly rather than corporate.
- **FHA Condensed French NC** — sizes: 24, 30, 32, 38, 44, 48, 52, 72px; weight: 400; line-height: 1.0–1.33; letter-spacing: . Role: Display headlines, section titles, large statements — always set in all-caps with tight leading. The condensed proportions create editorial authority and reference classic spirits-label typography.

## Type Scale

- caption: 10px / lh 1.3 / ls undefined
- body: 14px / lh 1.43 / ls undefined
- body-lg: 16px / lh 1.5 / ls undefined
- subheading: 18px / lh 1.56 / ls undefined
- heading-sm: 24px / lh 1.33 / ls undefined
- heading: 32px / lh 1.2 / ls undefined
- heading-lg: 44px / lh 1.15 / ls undefined
- heading-xl: 52px / lh 1.1 / ls undefined
- display: 72px / lh 1 / ls undefined

## Spacing & Shape

- Radius — buttons: 9999px, cards: 16px, inputs: , tags: 9999px
- Element gap: 16px; Section gap: 64px; Card padding: 24px; Page max-width: 1280px

## Components

### Coral Pill Button (Primary)
Role: Main call-to-action
Filled coral-pink (#ef6079) pill with white Vivey text, 9999px radius, 12px 24px padding, 14px Vivey 400. Used for Shop Bestsellers, Add to Cart, Our Story, Save 30%. The coral against cream is the highest-energy moment in the interface.

### Outline Pill Button (Secondary)
Role: Secondary action
1px Smoke Gray border (#e5e7eb) on cream background, Vivey 14px 400 text in dark, 9999px radius, 12px 24px padding. Used for Shop All, navigation CTAs, less prominent actions.

### Top Announcement Bar
Role: Promotional header
Full-width Coral CTA (#ef6079) strip at very top of page, centered Vivey 12px white text. Always one short line — shipping, promo, or announcement.

### Navigation Header
Role: Primary site nav
Full-width Ghia Burgundy (#651c32) bar, ~64px tall. Script-serif white Ghia logo left, Vivey 14px white nav links center (Shop ▾, Build Your Own Bundle, Recipes, Subscription, Find In Store), search/user/cart icons right with 0 badge dot in coral.

### Hero Section
Role: Above-the-fold statement
Aperitivo Cream (#f2e2d5) full-bleed canvas, two-column on desktop. Left: FHA Condensed 72px Ghia Burgundy headline stacked on two lines with tight 1.0 leading, Vivey 16px muted body line, Coral Pill Button below. Right: product photography (bottles + glass) filling the frame, no rounded container — the imagery bleeds to the edges.

### Trust Marquee Bar
Role: Credibility strip
Ghia Burgundy (#651c32) full-width band, Vivey 14px 700 all-caps white text separated by bullet dots — 0% ALCOHOL • NO ARTIFICIAL FLAVORS • NO CAFFEINE • NO ADDED SUGAR • VEGAN. Repeating horizontally.

### Circular Product Card
Role: Product grid item
9999px-radius circular product image (bottle in dark setting) centered in frame, Vivey 16px 700 product name below, Vivey 12px price in muted brown. Sits on cream canvas. 'Save 30%' or 'Bestseller' yellow tag (#f0e87b) can overlay top-right.

### Brand Story Split Block
Role: Editorial about section
Two-column 50/50: left half Ghia Burgundy (#651c32) with FHA Condensed 32–44px cream text, Vivey 16px body, Coral Pill Button; right half is full-bleed lifestyle photography of cocktail glass + bottle. The dark block is the page's voice — it speaks louder than the cream sections.

### Product Detail Card (Shop Grid)
Role: E-commerce product card
Vertical card, 16px radius, cream interior, square product photo on top half, Vivey 18px 700 name (e.g. APÉRITIF), Vivey 14px body description (2 lines), Coral Pill Button 'Add to Cart — $38' at bottom. Sits on a dark burgundy textured background section.

### Category Filter Pill
Role: Product line switcher
Small pill tag, 9999px radius, 8px 16px padding. Inactive: cream fill, Vivey 12px 700 Ghia Burgundy text. Active: Rivira Blue (#abd2eb) fill or Coral CTA fill. Groups products by line — Apéritif, Le Spritz, Le Fizz.

### Footer
Role: Site footer
Ghia Burgundy (#651c32) full-width, multi-column Vivey 14px cream text, Ghia script logo repeated. Newsletter signup, social icons, legal links. Padding ~48–64px vertical.

### Highlight Sticker Tag
Role: Promotional badge on product
Limoncello Yellow (#f0e87b) rectangle, slight rotation (-5deg), Vivey 11px 700 dark text 'SAVE 30%' or 'BESTSELLER'. Applied as overlay sticker on product images — gives the tactile, hand-applied label feeling.

## Do

- Set headlines in FHA Condensed all-caps with leading 1.0–1.15 — never in mixed case or with generous line-height
- Use 9999px radius on all buttons, tags, and product image frames
- Pair Coral CTA (#ef6079) fills with Bone White (#fef6ee) text at 14px Vivey 400
- Alternate full-bleed cream and burgundy sections to create editorial rhythm
- Crop product bottles into 9999px circular frames for grid items
- Use Limoncello Yellow (#f0e87b) only for promotional sticker overlays, not large surfaces
- Maintain 64–80px section padding and 24px card padding for breathing room

## Never

- Don't use Olive Grove (#3e4938) or Rivira Blue (#abd2eb) as primary CTA fills — coral is the singular action color
- Don't set FHA Condensed below 24px — the condensed letterforms lose legibility at small sizes
- Don't use sharp 0px or 4px corner radii on interactive elements — the system is built on pill shapes
- Don't add drop shadows to cards or buttons — depth comes from color contrast and photography, not elevation
- Don't use gradients — the palette is strictly flat and Mediterranean
- Don't introduce new chromatic colors outside the burgundy/coral/cream system — Rivira Blue and Limoncello Yellow are accents, not foundations
- Don't mix serif and sans for the same hierarchy level — Vivey reads body, FHA Condensed reads display, never overlap

## Agent Prompt Guide

**Quick Color Reference**
- Background: #f2e2d5 (Aperitivo Cream)
- Text on light: #651c32 (Ghia Burgundy)
- Border: #e5e7eb (Smoke Gray)
No distinct primary action color was observed; use the extracted neutral button treatments instead of inventing a filled CTA color.
- Dark surface: #651c32 (Ghia Burgundy)
- primary action: no distinct CTA color

**3-5 Example Component Prompts**
1. **Hero Section**: Aperitivo Cream (#f2e2d5) full-bleed background, two-column layout. Left: FHA Condensed 72px all-caps Ghia Burgundy (#651c32) headline with line-height 1.0, Vivey 16px body in burgundy, Coral Pill Button (#ef6079 fill, #fef6ee text, 9999px radius, 12px 24px padding) below. Right: product photography of bottles, no container border, bleeding to frame edge.

2. **Circular Product Card**: 9999px radius product image centered, Vivey 16px 700 product name in #651c32 below, Vivey 12px price in muted #651c32. Optional Limoncello Yellow (#f0e87b) sticker tag rotated -5deg on top-right reading 'BESTSELLER' in Vivey 11px 700.

3. **Brand Story Split**: 50/50 columns. Left: Ghia Burgundy (#651c32) background, FHA Condensed 38px all-caps Bone White (#fef6ee) text, Vivey 16px body in cream, Coral Pill Button. Right: full-bleed cocktail lifestyle photography, no border or radius.

4. **Product Detail Card**: 16px radius, cream (#fef6ee) interior, square product photo top, Vivey 18px 700 name in #651c32, Vivey 14px description in #651c32, Coral Pill Button 'Add to Cart — $38' at bottom with 9999px radius.

