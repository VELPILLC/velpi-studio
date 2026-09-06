# Eventbrite — Style Reference
> pillow-soft discovery wall with a single electric blue pulse

**Theme:** light

Eventbrite's visual system reads as a warm, welcoming event-discovery surface: a soft off-white canvas (#f8f7fa) with generous 40px-radius cards that feel almost pillow-like, pill-shaped controls (360px), and a single vivid blue (#3659e3) doing all the interactive heavy lifting. The dominant text/border color is a deep muted aubergine (#39364f) rather than pure black — this single tonal choice gives the entire interface a slightly warm, editorial feel without going purple on screen. Orange is reserved exclusively for the brand mark and the cookie consent button, never for product UI, which keeps the accent palette disciplined. Typography is Neue Plak at restrained sizes (14–24px range for most content), and layout is built on a 4-column event grid with circular category icons that hint at the playful, community-first nature of the product.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Aubergine Ink | `#39364f` | Primary text, borders, dividers, icon strokes — the structural backbone of every surface | neutral |
| Pure White | `#ffffff` | Card surfaces, badge fills, nav background — the elevated layer above the canvas | neutral |
| Warm Linen | `#f8f7fa` | Page canvas and page-level background — slightly warm off-white, never sterile | neutral |
| Soft Mist | `#dbdae3` | Hairline borders, list dividers, subtle separators between list items and sections | neutral |
| Pale Silver | `#bec0c6` | Link borders, secondary borders, muted outlines on ghost elements | neutral |
| Cloud Veil | `#eeedf2` | Secondary card backgrounds, subtle surface differentiation | neutral |
| Periwinkle Tint | `#dee5ff` | Soft blue-tinted card borders — the gentler cousin of the accent | neutral |
| Carbon | `#000000` | Icon fills, certain link text — used sparingly where maximum contrast is needed | neutral |
| Smoke | `#6f7287` | Muted secondary text, nav borders, low-emphasis icon strokes | neutral |
| Plum Depth | `#1e0a3c` | Headlines, event titles, and deep emphasis text — the voice of large type | brand |
| Indigo Slate | `#585163` | Nav borders, secondary structural lines, quieter sibling of Aubergine Ink | neutral |
| Electric Iris | `#3659e3` | Violet accent for outlined action borders, linked labels, and lightweight interactive emphasis. | brand |
| Ember Orange | `#f05537` | Orange wash for highlight backgrounds, decorative bands, and soft emphasis behind content. Do not promote it to the primary CTA color | accent |

## Tokens — Typography

- **Neue Plak** — sizes: 12px, 14px, 16px, 18px, 24px, 32px; weight: 400, 600, 700; line-height: 1.20–2.00 (context-dependent); letter-spacing: 0.0100em to 0.0180em — barely positive, kept consistent across all sizes for a calm, unfussy rhythm. Role: All UI text — body, headings, buttons, badges, nav, event titles. The custom geometric sans carries the entire interface; no second typeface is needed.
- **Neue Plak Text** — sizes: 14px; weight: 600; line-height: 1.20–1.43; letter-spacing: . Role: Semi-bold companion for nav and select UI labels where extra weight is needed at small sizes

## Type Scale

- caption: 12px / lh 1.43 / ls undefined
- body-sm: 14px / lh 1.43 / ls undefined
- body: 16px / lh 1.5 / ls undefined
- subheading: 18px / lh 1.43 / ls undefined
- heading-sm: 24px / lh 1.33 / ls undefined
- heading: 32px / lh 1.2 / ls undefined

## Spacing & Shape

- Radius — buttons: 360px (pill), cards: 40px, inputs: 4px, tags: 20px
- Element gap: 12px; Section gap: 64-80px; Card padding: 12-16px; Page max-width: 1200px

## Components

### Hero Banner
Role: Full-bleed promotional banner with photographic background and overlay text
Full-width image with a dark overlay; headline in 32px Neue Plak 700 Plum Depth (#1e0a3c) on a semi-transparent white card with 4px radius; CTA below is a pill button (360px radius, 12px 24px padding, Aubergine Ink border, Aubergine Ink text). Image is cropped to roughly 320px height on desktop.

### Event Listing Card
Role: Primary content unit — a single event in the discovery grid
White (#ffffff) surface on the Warm Linen canvas. 40px border-radius — the system's signature softness. Card has 1px Soft Mist (#dbdae3) border. Event image sits at top (16:9 ratio, 16px top-radius clipping to 40px card radius). Below image: 12–16px padding, event title in 16px Neue Plak 600 Plum Depth, date/venue in 14px weight 400 Aubergine Ink, price in 14px weight 600. No drop shadow; the border alone defines elevation.

### Category Circle Icon
Role: Circular icon button for browsing events by category
80px circle with 1px Soft Mist border, white fill. Centered line icon in Aubergine Ink at ~24px. Category label in 14px weight 400 below. 24px gap between circles in a horizontal row.

### Pill Search Bar
Role: Header search input with location selector
Single 100px-radius container holding a search input and a location selector. White fill, 1px Soft Mist border. The trailing search button is a 40px circle filled with Eventbrite Ember Orange (#f05537) containing a white magnifier icon — the only circular orange element in the system.

### Pill Nav Link
Role: Header navigation items
14px Neue Plak Text weight 600, Aubergine Ink text, no border or fill. Horizontal row with 16-24px gaps. 'Sign in' sits at the far right as a ghost text link.

### Outlined Action Link
Role: Interactive text/button — the primary CTA style
1.5px Electric Iris (#3659e3) border with Electric Iris text, 4-8px radius (not pill for inline actions). Used for 'Get Into Live Music', category filters, and event detail links. 12px 16px padding. Underline appears on hover.

### Filled Cookie Accept Button
Role: The sole filled-button instance — the cookie consent CTA
Eventbrite Ember Orange (#f05537) fill, white text, 4px radius, 8px 16px padding. This is the only filled-color button in the product UI and exists only in the consent overlay.

### Event Status Badge
Role: Small label for event capacity or status
20px radius, white fill with 1px Soft Mist border, 12px Neue Plak 600 Aubergine Ink text. 4px 8px padding. Examples: 'Almost full', 'Sales end soon'.

### Pagination Arrow Button
Role: Circular chevron for paginating event rows
40px circle, white fill, 1px Soft Mist border, centered chevron icon in Aubergine Ink. Two sit side by side (left/right) at section end.

### Search Input Field
Role: Text input within the header search bar
No visible border — sits inside the Pill Search Bar container. Placeholder text in Smoke (#6f7287), 14px weight 400. The search icon and orange submit button are external to the input itself.

### Cookie Consent Panel
Role: Fixed-bottom overlay for GDPR/privacy controls
White surface with 8px radius, subtle border, anchored bottom-left. Heading 'We use cookies' in 16px weight 600 Plum Depth. Body text in 14px Smoke. Three stacked buttons on the right: Filled Cookie Accept (orange), and two ghost buttons with Aubergine Ink borders labeled 'Reject all' and 'More choices'.

### Event Grid Row
Role: Horizontal arrangement of Event Listing Cards
4 columns on desktop, 16-24px gaps between cards, wrapping to 2 columns on tablet, 1 column on mobile. Each row represents one section of curated or algorithmically-grouped events.

## Do

- Use 40px border-radius for all content cards — this is the system's defining softness; flattening to 8px breaks the visual identity.
- Reserve Electric Iris (#3659e3) for interactive elements only — links, outlined buttons, selected states, icon accents. Never use it for decorative fills or large background blocks.
- Use Aubergine Ink (#39364f) for all body text and borders instead of pure black — the slight warmth is what keeps the interface from feeling cold.
- Default to outlined or ghost action styles; the only filled button in product UI is the cookie consent CTA in Ember Orange.
- Set page background to Warm Linen (#f8f7fa) and card surfaces to Pure White (#ffffff) — the two-tone layering is how depth is communicated without shadows.
- Use 14px Neue Plak as the default body size; only go to 16px+ for event titles and primary content.
- Apply 1px Soft Mist (#dbdae3) borders for all card and list separators; avoid box-shadows for elevation.

## Never

- Do not use Ember Orange (#f05537) for product actions, CTAs, or interactive elements — it is reserved for the brand mark and the cookie consent button only.
- Do not use pure black (#000000) for body text — always use Aubergine Ink (#39364f) for warmth.
- Do not add drop shadows to cards; the 40px radius + 1px border is the elevation language.
- Do not introduce a second typeface; Neue Plak carries the entire system.
- Do not use Electric Iris as a large surface fill — keep it to 1.5px outlines and icon strokes to preserve its signal value.
- Do not use sharp 0px or 2px radius on cards — the softness is a brand pillar.
- Do not use Plum Depth (#1e0a3c) for body text; reserve it for event titles and large headings where deep emphasis is needed.

## Agent Prompt Guide

## Quick Color Reference
- text: #39364f (Aubergine Ink)
- background: #f8f7fa (Warm Linen)
- card surface: #ffffff (Pure White)
- border: #dbdae3 (Soft Mist)
- accent: #3659e3 (Electric Iris)
- primary action: #3659e3 (outlined action border)

## 3-5 Example Component Prompts
1. **Event Listing Card**: White (#ffffff) surface on Warm Linen (#f8f7fa) canvas. 40px border-radius, 1px Soft Mist (#dbdae3) border, no shadow. Top: 16:9 event image with top corners clipping to 40px. Below: 12px padding. Title in 16px Neue Plak weight 600 Plum Depth (#1e0a3c). Date/venue in 14px weight 400 Aubergine Ink (#39364f). Price in 14px weight 600.
2. **Hero Banner**: Full-bleed photographic background (concert/live event). Overlay: left-aligned white rectangle with 4px radius containing 'GET INTO IT' in 14px weight 600, then 'FROM POP BALLADS TO EMO ENCORES' in 32px weight 700 Plum Depth. Below: outlined ghost action — Electric Iris (#3659e3) 1.5px border, Electric Iris text, 360px pill radius, 12px 24px padding, 14px weight 600.
3. **Pill Search Bar**: 100px border-radius container, white fill, 1px Soft Mist border, ~48px tall. Left: search input with placeholder 'Search events' in Smoke (#6f7287) 14px. Center divider. Right: location text with pin icon. Far right: 40px circle filled Ember Orange (#f05537) with white magnifier icon.
4. **Category Circle Icon Row**: 8 circles in a horizontal row, each 80px diameter, white fill, 1px Soft Mist border, centered line icon in Aubergine Ink at 24px. 24px gap between circles. Labels in 14px weight 400 Aubergine Ink below each circle.
5. **Cookie Consent Panel**: Fixed bottom-left overlay, white surface, 8px radius, 1px Soft Mist border. Heading 'We use cookies' in 16px weight 600 Plum Depth. Body in 14px Smoke. Three stacked buttons on the right: filled Ember Orange 'Accept all' (4px radius, white text, 8px 16px padding), then two ghost buttons with Aubergine Ink border labeled 'Reject all' and 'More choices'.

## Rounded Corner Philosophy

Corner radius is the most opinionated decision in this system. Cards get 40px — extraordinarily soft for content surfaces, making every event feel approachable. Badges and tags get 20px — half of card radius, creating a nested softness. Buttons in the header get 360px (full pill). Nav containers get 100px (near-pill). Inputs and small elements get 4px — the only place sharp edges survive. The hierarchy is: 4px (small/cold) → 20px (tags) → 40px (cards) → 100px (nav) → 360px (buttons). Never break this scale; never go to 8px or 12px on cards.
