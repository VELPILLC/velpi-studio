# Dollar Shave Club — Style Reference
> Navy warehouse with a single orange flare

**Theme:** dark

Dollar Shave Club is a saturated dark-mode commerce system built on a deep royal-navy canvas with one loud orange action color and a deep burgundy secondary. Typography is heavy and condensed through the custom DSC Specter display family, always uppercase for navigation and product names, giving the surface a bold, masculine-utility feel. Decorative shapes — flower blobs, wavy gold borders, orange line-art icons — soften the hard navy structure and keep the brand playful rather than clinical. Content is organized in full-bleed horizontal bands: a split cream-and-photo hero, a dark product category grid, a burgundy promo band, and a dark-navy explainer with icon-led steps.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Midnight Navy | `#142978` | Violet text accent for links, tags, and emphasized short phrases. Do not promote it to the primary CTA color | brand |
| Flame Orange | `#fe5000` | Filled CTA buttons, icon strokes, decorative accents — the single chromatic action color that commands every screen it touches | brand |
| Wine Burgundy | `#82163f` | Secondary section background, hero display text, promotional bands — adds warmth and depth against the navy | brand |
| Deep Ink | `#001233` | Outlined/ghost button borders, dark text on light surfaces, deep button variant background | brand |
| Abyss Navy | `#0a153c` | Pressed/secondary button fill — a near-black navy for dark button variants on the navy canvas | brand |
| Powder Blue | `#dbebf5` | Card surfaces and light-blue panel backgrounds within dark sections — breaks up the navy with breathing room | accent |
| Warm Cream | `#f3e0c8` | Hero left-panel background, soft warm neutral — used in only the highest-impact first-screen block | accent |
| Snow White | `#ffffff` | Primary text on dark surfaces, button borders, input fills, card text — the dominant foreground color | neutral |
| Graphite | `#404040` | Heavy-use border and text color on light sections, structural dividers | neutral |
| Ash Gray | `#e3e3e3` | Badge and pill borders on light surfaces | neutral |
| Fog | `#eeeeee` | Subtle dividers, muted panel backgrounds | neutral |
| Stone | `#949596` | Input field borders, low-priority form chrome | neutral |

## Tokens — Typography

- **DSC Specter** — sizes: 12, 14, 15, 16, 18, 20, 24, 32, 40, 52; weight: 400, 600, 700, 800, 900; line-height: 0.80–1.86; letter-spacing: -0.006em to 0.050em, tighter at display sizes. Role: Primary display and body family — condensed heavy sans with extreme weight range, used uppercase for navigation, product names, CTAs, and section headers; weights 700-900 drive display headlines (32-52px) while 400 handles body and small UI.
- **Gelica** — sizes: 12, 14, 16; weight: 400, 700, 800; line-height: 1.20–1.80; letter-spacing: 0.025em, 0.071em. Role: Secondary utility family for navigation, fine print, and body micro-copy — a serif counterpoint to Specter's industrial weight.
- **GTStandard-M** — sizes: 16px; weight: 400; line-height: 1.5; letter-spacing: . Role: GTStandard-M — detected in extracted data but not described by AI
- **Font Awesome 5 Pro** — sizes: 18px; weight: 300; line-height: 1; letter-spacing: . Role: Font Awesome 5 Pro — detected in extracted data but not described by AI

## Type Scale

- caption: 12px / lh 1.2 / ls 0.04
- body-sm: 14px / lh 1.4 / ls 0.025
- body: 16px / lh 1.5 / ls 0.015
- subheading: 18px / lh 1.3 / ls 0.012
- heading-sm: 20px / lh 1.29 / ls 0.025
- heading: 24px / lh 1.25 / ls 0.031
- heading-lg: 32px / lh 1.19 / ls 0.038
- display: 40px / lh 1.2 / ls 0.043
- hero: 52px / lh 0.8 / ls 0.05

## Spacing & Shape

- Radius — buttons: 4px, cards: 4px, inputs: 4px, tags: 
- Element gap: 10px; Section gap: 30px; Card padding: 25px; Page max-width: 1200px

## Components

### Top Promo Tab Bar
Role: Slim full-width navy band above main navigation promoting seasonal or category-specific CTAs
Background #142978, white text 14px DSC Specter weight 700 uppercase, centered links with a right-pointing arrow on promo text. Height ~40px, no border-radius.

### Main Navigation Bar
Role: Primary white navigation bar with logo, category links, and utility icons
Background #ffffff, logo left (DSC Specter stacked red/orange), 6 category links in 14px DSC Specter weight 700 uppercase with #404040 color, search and account/cart icons right with badge counter in Flame Orange. Padding 15px vertical, hairline #404040 bottom border.

### Split Hero Section
Role: First-screen brand impression combining editorial copy with lifestyle photography
Two-column ~50/50 split. Left panel: #f3e0c8 cream background, display headline at 52px DSC Specter weight 800 uppercase in #82163f, 16px body copy in #404040, Flame Orange filled CTA. Right panel: full-bleed photo with a decorative wavy gold (#fe5000 or #ffc940) border at the edge connecting panels.

### Flame Orange Filled Button
Role: Primary action button — the dominant CTA across all dark sections
Background #fe5000, text #ffffff in 14px DSC Specter weight 700 uppercase, padding 10px 15px, border-radius 4px, no border or 1px #fe5000 border. Letter-spacing 0.050em for emphasis.

### Ghost / Outlined Button
Role: Secondary action on light surfaces where a filled orange button would feel too loud
Background transparent, 1px solid #001233 border, text #001233 in 14px DSC Specter weight 700 uppercase, padding 10px 15px, border-radius 4px.

### Product Category Card
Role: Entry-point card in a 4-column grid linking to a product collection
Two-part card: upper half is a full-bleed product/lifestyle image (no border-radius, edge to edge), lower half is #dbebf5 powder-blue background. Category title in 18-20px DSC Specter weight 800 uppercase #142978, short description 14px in #404040, centered Flame Orange 'SHOP NOW' button at bottom. 4px border-radius on the lower panel.

### Decorative Flower Badge
Role: Promotional seal used over hero photography to highlight percentage savings
Organic scalloped/flower SVG shape, lavender/purple fill (~#b8a0d0), white text 18-24px DSC Specter weight 700 stacked ('save up to / 50% off'), placed at an angle over hero imagery for playful visual punctuation.

### Wavy Gold Border
Role: Decorative SVG element that separates the hero photo from the cream panel
Vertical wavy/scalloped strip in gold-orange (~#ffc940 or gradient to #fe5000), 2-4 undulations, used as a hand-drawn frame between hero blocks.

### Section Header
Role: Bold centered display title for full-width dark sections
32-40px DSC Specter weight 800 uppercase #ffffff, centered, with 15px vertical padding above and below. Used on every navy and burgundy band to anchor the section.

### How-It-Works Step
Role: Icon-led three-step explainer in a horizontal row
Centered column on #142978 background. Icon at top in Flame Orange line art (~64px). Step number+title in 14px DSC Specter weight 800 uppercase #ffffff, description in 14px weight 400 #ffffff. 30px column gap between steps.

### Promo Band
Role: Full-width burgundy section promoting a campaign or product line
Background #82163f, white headline 24-32px DSC Specter weight 800 uppercase, Flame Orange filled CTA, flanked by decorative gold/cream blob shapes. Used between dark sections to break rhythm.

### Input Field
Role: Form input for email capture or search
Background #ffffff, 1px solid #949596 border, 4px border-radius, 15-16px horizontal padding, 14px DSC Specter body text. Focus state: border becomes #fe5000.

### Icon
Role: Inline UI iconography
Font Awesome 5 Pro 300-weight icons at 18px, typically #404040 on light surfaces and #ffffff on dark surfaces, or Flame Orange for decorative utility icons (line-art razor, shaver, play-pause).

### Badge / Pill
Role: Small status or count indicator
1px solid #e3e3e3 border, 4px border-radius, 4px right/left margin, 12-14px text, used for tags and cart counts.

## Do

- Use Flame Orange #fe5000 filled buttons with white uppercase text for all primary actions.
- Set the main canvas to Midnight Navy #142978 for all full-width dark sections and bands.
- Use DSC Specter weight 700-900 uppercase for navigation, product names, CTAs, and section titles.
- Apply 4px border-radius to all cards, buttons, inputs, and badges — never larger.
- Alternate section backgrounds between Midnight Navy, Wine Burgundy #82163f, and Powder Blue #dbebf5 to create rhythm.
- Use Flame Orange line-art icons at 64px+ for step explainers and decorative imagery.
- Reserve decorative shapes (flower badges, wavy gold borders) for hero and promo bands only — never on utility screens.

## Never

- Don't use any color other than Flame Orange for filled CTA buttons.
- Don't apply gradients — this system is flat, single-color surfaces only.
- Don't use light text on light backgrounds or dark text on dark backgrounds — the contrast pairs are strict.
- Don't set border-radius above 4px (or 10px for the rare pill variant) — anything rounder breaks the utility aesthetic.
- Don't mix fonts beyond DSC Specter and Gelica — never substitute system fonts at display sizes.
- Don't place the Flower Badge or wavy gold border on non-hero surfaces — they lose impact when overused.
- Don't use Wine Burgundy for body text on light backgrounds; reserve it for hero display copy and section bands.

## Agent Prompt Guide

**Quick Color Reference**
- Background: #142978 (Midnight Navy)
- Text: #ffffff (primary on dark), #404040 (primary on light)
- Border: #404040 (structural), #e3e3e3 (badges), #949596 (inputs)
- Accent: #82163f (Wine Burgundy, section bands)
- primary action: #fe5000 (filled action)

**Example Component Prompts**

1. **Dark Section with Product Cards**: Background #142978. Section title centered at 32px DSC Specter weight 800 uppercase #ffffff. Below, 4-column grid of cards: upper half is a full-bleed product photo (no border-radius on top), lower half is #dbebf5 with 25px padding, containing a 20px DSC Specter weight 800 uppercase #142978 category title, 14px #404040 body copy, and a centered Flame Orange (#fe5000, white 14px uppercase text, 4px radius, 10px 15px padding) 'SHOP NOW' button.

2. Create a Primary Action Button: #fe5000 background, #404040 text, 9999px radius, compact pill padding. Use this filled treatment for the main CTA.

3. **How-It-Works Step Row**: Background #142978. Centered 32px white DSC Specter weight 800 uppercase title. 3-column row with 64px Flame Orange line-art icons (stroke weight 2px), 14px weight 800 uppercase white step titles, and 14px weight 400 white descriptions. 30px gap between columns.


5. **Input Field**: White #ffffff background, 1px solid #949596 border, 4px border-radius, 16px horizontal padding, 14px DSC Specter body text in #404040. Focus border: 1px solid #fe5000.
