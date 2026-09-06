# Cowboy — Style Reference
> Belgian bicycle gallery in porcelain white. A showroom where matte surfaces, oversized editorial type, and near-zero decoration force the eye onto the machine and the message.

**Theme:** light

Cowboy's visual system is editorial restraint taken to its logical extreme: a near-monochrome canvas where the only chromatic signal comes from product photography and press logos. SuisseIntl at near-poster sizes (72–100px) with aggressive negative tracking gives every headline a magazine-cover gravity, while 8px radii and 9999px pill buttons keep the chrome physically quiet. Surfaces are white porcelain; structure is communicated through hairline #e5e7eb borders rather than shadows or filled panels. The interface is designed to disappear so the bicycle — and the word — can carry the room.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Porcelain | `#ffffff` | Page canvas, card surfaces, button text on dark fills — the dominant neutral that lets photography carry all chromatic weight | neutral |
| Charcoal | `#1d1d1d` | Primary text, filled primary action buttons, active nav — a soft black that reads warm rather than digital | neutral |
| Hairline | `#e5e7eb` | Dividers, card borders, input outlines, image frame edges — the structural skeleton of every section | neutral |
| Smoke | `#737373` | Secondary body text, button borders, subtle metadata — a middle gray that recedes behind primary copy | neutral |
| Ash | `#a3a3a3` | Tertiary text, disabled state, muted helper copy — the quietest text tier | neutral |
| Mist | `#f3f4f6` | Soft card backgrounds, subtle alternating bands — provides the only tonal step between white surface and white surface | neutral |
| Graphite | `#5e5e5e` | Body section background, mid-tier surface for inset panels | neutral |
| Bone | `#cacaca` | Faint dividers, disabled borders, focus halos at rest | neutral |
| Onyx | `#000000` | Icon fills, high-contrast graphic marks — reserved for SVG iconography only | neutral |
| Slate | `#6b7280` | Input field borders at rest — the one input-state neutral | neutral |
| Moss | `#569d5f` | Green wash for highlight backgrounds, decorative bands, and soft emphasis behind content. Use as a supporting accent, not as a status color | accent |
| Signal Blue | `#2563eb` | Info state, focused input highlight — the only chromatic functional signal in the system | semantic |

## Tokens — Typography

- **SuisseIntl** — sizes: 12, 13, 14, 16, 18, 20, 24, 36, 42, 44, 46, 52, 72, 100; weight: 400, 500, 600; line-height: 0.90–1.50 (display: 0.90–1.00, headings: 1.05–1.25, body: 1.47–1.50); letter-spacing: -0.0250em at display sizes (72–100px), -0.0200em at 42–52px, -0.0150em at 18–24px, normal at body sizes. Role: Primary typeface across every UI surface. SuisseIntl is a Swiss-geometric grotesque with squared terminals and optical precision; its cold neutrality is the counterweight to Cowboy's warm lifestyle photography. Use weight 500 for navigation and UI labels, 600 for emphasis and button text, 400 for body and editorial copy. The extreme type scale (100px display) with -0.025em tracking is signature — headlines feel cut, not typed.
- **ui-monospace** — sizes: 64; weight: 400; line-height: 1.00; letter-spacing: . Role: Oversized monospaced display mark used as a graphic element — the only departure from SuisseIntl, lending a technical/spec-sheet accent to counter the humanist photography
- **Intercom Sans** — sizes: 16; weight: 400; line-height: 1.50; letter-spacing: . Role: Reserved for the Intercom chat widget — not a design system font, do not propagate
- **intercom-font** — sizes: 16px; weight: 400; line-height: 1.5; letter-spacing: . Role: intercom-font — detected in extracted data but not described by AI

## Type Scale

- caption: 12px / lh 1.5 / ls undefined
- body-sm: 14px / lh 1.5 / ls undefined
- body: 16px / lh 1.5 / ls undefined
- subheading: 20px / lh 1.25 / ls -0.3
- heading-sm: 24px / lh 1.25 / ls -0.36
- heading: 36px / lh 1.05 / ls undefined
- heading-lg: 44px / lh 1.05 / ls -0.88
- display: 72px / lh 1 / ls -1.8
- display-xl: 100px / lh 0.9 / ls -2.5

## Spacing & Shape

- Radius — buttons: 9999px, cards: 8px, inputs: 8px, tags: 9999px
- Element gap: 8px; Section gap: 80px; Card padding: 48px; Page max-width: 1440px

## Components

### Primary Action Button
Role: Main CTA — 'Discover Cruiser', 'Book a test ride'
Filled pill (#1d1d1d background, #ffffff text), 9999px radius, 12px 24px padding, SuisseIntl 500 at 16px. No border, no shadow. On hover, background lightens slightly toward #5e5e5e.

### Secondary Outlined Button
Role: Supporting CTA — 'Continue' in locale dialog
Pill shape with #1d1d1d border at 1px, transparent fill, #1d1d1d text, 9999px radius, 12px 24px padding, 16px weight 500.

### Ghost Text Button
Role: Inline dismiss or skip — 'No thanks'
No background, no border, #1d1d1d underlined text at 16px weight 500, inline alignment. Sits adjacent to a filled primary.

### Navigation Pill
Role: Top nav items — E-bikes, AdaptivePower, Connect, Leasing
Transparent fill, #1d1d1d text at 16px weight 500, 9999px radius, 8px 16px padding. Active state uses a subtle #f3f4f6 background fill.

### Tab Switcher Pill
Role: Product variant toggle — Cruiser / Cruiser ST
Segmented pill control with 8px radius overall, individual segments 9999px. Active segment is #1d1d1d fill with white text; inactive is transparent with #737373 text.

### Hero Section
Role: Full-viewport opening screen
Full-bleed video or photograph, dark scrim overlay (rgba 0,0,0,0.3–0.4), left-aligned white headline at 72–100px SuisseIntl weight 500, letter-spacing -0.025em. Single white pill CTA bottom-left. No gradient, no decorative chrome — the image does the work.

### Product Showcase Card
Role: Bicycle product detail — 'The easy-rider'
White background, 8px radius optional, full-width product photo centered, 24px padding around image, 36–44px heading in #1d1d1d above, variant switcher in upper-right corner. No card border, no shadow — image floats on white.

### Press Logo Tile
Role: Award and publication credentialling — red dot, Verge, TIME, GQ, Frandroid
White background, 8px radius, 1px #e5e7eb border, 48px vertical padding, centered logo at native color (logos retain their brand colors — this is the only place the system tolerates chromatic noise).

### Feature Row Card
Role: Award or feature highlight — 'Award-winning design'
Transparent or #1d1d1d background, 48px padding, 16–18px weight 500 label in #ffffff or #1d1d1d, 13–14px weight 400 descriptor below in same color at reduced opacity. Icon or mark at left, text right.

### Locale Dialog
Role: Geo-detection overlay — 'Looks like you're in Spain'
White card with 8px radius, 24px padding, 16px heading, 14px body text, filled primary button + ghost link inline. Appears as a small floating card in the upper-left viewport, not a modal.

### Carousel Arrow Button
Role: Product gallery navigation
Square 40×40 control, 8px radius, 1px #e5e7eb border, #1d1d1d chevron icon at 16px. Transparent fill, no shadow.

### Sticky Announcement Bar
Role: Top-of-page notification — 'Cowboy is back. Learn more'
#1d1d1d full-width strip, 32px height, white 14px text centered, with a linked 'Learn more' in white weight 500 and a dismiss × in white at far right.

### Editorial Display Headline
Role: Section opener — 'Power so natural, you're always in flow.'
SuisseIntl weight 500 at 72–100px, #1d1d1d, centered or left-aligned, letter-spacing -0.025em, line-height 0.90–1.00. May use a gradient-to-white mask on the last word to create a fade-out punctuation effect — this is a signature Cowboy device.

## Do

- Use 9999px radius for every button, nav item, and tag — the pill is the system's only shape signature
- Set headlines at 72–100px with -0.025em tracking; body text stays at 14–16px with normal tracking
- Communicate structure with 1px #e5e7eb borders, not shadows or filled panels
- Let product photography supply all chromatic contrast; keep UI surfaces achromatic
- Default button background to #1d1d1d with #ffffff text — this is the primary action, there is no chromatic CTA color
- Use the 8px radius on all cards, images, inputs, and containers — never use 4px or 12px
- Anchor every section to a single editorial headline at display scale; the type is the section, not a label

## Never

- Do not introduce a chromatic primary action color — the filled button is always #1d1d1d
- Do not use drop shadows on cards, nav, or content blocks; shadows break the editorial flatness
- Do not set headlines below 36px when they carry section meaning — Cowboy's hierarchy is extreme
- Do not use 4px or 6px radii on cards or images; the system speaks in 8px and 9999px only
- Do not pair positive letter-spacing with SuisseIntl — tracking is always neutral or negative
- Do not use color as decoration on UI chrome; reserve #569d5f and #2563eb exclusively for semantic states
- Do not fill backgrounds with #f3f4f6 on hero or product sections; white is the only canvas for the bicycle

## Agent Prompt Guide

**Quick Color Reference**
- text: #1d1d1d (primary), #737373 (secondary), #a3a3a3 (tertiary)
- background: #ffffff (canvas), #f3f4f6 (inset)
- border: #e5e7eb (hairline), #cacaca (faint)
- primary action: #1d1d1d (filled action)
- accent: none — the system is achromatic; #2563eb is info state only, #569d5f is success state only

**Example Component Prompts**

1. *Build a hero section.* Full-bleed image with rgba(0,0,0,0.35) scrim. Headline 'Riding reinvented' in SuisseIntl 500 at 100px, #ffffff, letter-spacing -2.5px, line-height 0.90, left-aligned in the left third. Subtext 'Meet the e-bike that thinks for itself.' in 18px weight 400, #ffffff at 80% opacity. primary action: #1d1d1d (filled action)

2. *Build a press logo row.* White background, 1440px max-width, 5-column grid with 24px gaps. Each tile: white fill, 1px #e5e7eb border, 8px radius, 48px vertical padding, logo image centered at native color, 14px caption below in #737373.

3. *Build a product showcase card.* White background, no border, no shadow. Section heading in SuisseIntl 500 at 44px, #1d1d1d, left-aligned at 48px from left edge. Product image centered below at full content width, 8px radius. Variant switcher (pill segmented control) in upper-right: 8px container radius, active segment #1d1d1d with white text at 14px, inactive transparent with #737373 text.

4. *Build a feature row item.* Transparent or #1d1d1d background, 48px padding, 16px label in SuisseIntl 500 #ffffff (or #1d1d1d on light), 13px descriptor in same color at 70% opacity, arranged in a 3-column grid with 24px gaps.

5. Create a Primary Action Button: #1d1d1d background, #ffffff text, 9999px radius, compact pill padding. Use this filled treatment for the main CTA.

## Editorial Type Philosophy

Cowboy treats headlines as architectural elements, not labels. The 72–100px range with -0.025em tracking and tight 0.90–1.00 line-height means a single headline can occupy a full viewport height. A signature device: the last word of a display headline fades to white via a CSS mask-gradient, creating a trailing silence. This is the system's only typographic flourish — it signals continuation without adding a period. When building new sections, default to one display headline per section, left or center aligned, and let the body copy recede to 16–18px in #737373.
