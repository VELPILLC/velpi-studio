# BelArosa Chalet — Style Reference
> dusk on alpine vellum

**Theme:** mixed

The BelArosa Chalet system channels alpine luxury through a restrained two-color palette: deep mountain teal (#193741) dominates as the signature surface and structural border color, while warm honey gold (#eac486) appears only in the monogram and decorative accents, never as a functional fill. Typography pairs a humanist sans (Avenir) for all UI, navigation, and body text with a transitional serif (ITC Giovanni) exclusively for editorial headlines — this duality is the site's defining signature, creating an editorial-luxury identity where serif moments feel like pull quotes in a travel magazine. Layout alternates between full-bleed dark teal hero sections and warm parchment content bands, using 80px pill-radius outlined buttons and generous 64–80px section gaps to create a slow, breathing rhythm. The design is flat and architectural: no drop shadows, depth communicated entirely through color contrast and hairline borders. The colorfulness of just 5% is intentional — restraint is the luxury signal.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Mountain Slate | `#193741` | Dominant structural color — hero backgrounds, dark section surfaces, primary text, navigation links, and the most-used border color in the system. The near-gray teal reads as atmospheric depth rather than saturated color | brand |
| Deep Teal | `#1d414d` | Slightly lifted variant of Mountain Slate for outlined action borders, hover states, and secondary dark surfaces. Provides subtle differentiation from the primary teal without introducing a new hue family | brand |
| Honey Gold | `#eac486` | Yellow decorative accent for icons, marks, and small graphic details. Do not promote it to the primary CTA color | accent |
| Snow White | `#ffffff` | Primary page canvas, navigation bar, light content section backgrounds, and ghost button text on dark surfaces | neutral |
| Warm Parchment | `#ebe7e1` | Cream surface for content bands — sits between pure white and the dark teal sections to create a soft warm middle tone. Reads as aged paper or natural linen | neutral |
| Stone Gray | `#8c9ba0` | Muted text, secondary borders, and subdued UI elements. A cool desaturated gray that sits comfortably between the warm cream and deep teal | neutral |
| Charcoal | `#222222` | Rare dark accent for button text and select borders where pure black feels too harsh against the teal-and-cream system | neutral |
| Ink Black | `#000000` | Input field borders, fine icon fills. Used sparingly as a true-black anchor | neutral |

## Tokens — Typography

- **Avenir LT Pro Roman** — sizes: 12px, 14px, 16px, 20px, 24px, 28px, 40px; weight: 400; line-height: 1.0–1.71 (context-dependent: 1.50 for UI labels, 1.40 for body, 1.20–1.25 for larger sans text); letter-spacing: 0.1250em, 0.1670em. Role: All UI, navigation, body copy, buttons, form labels, and small headlines up to 28px. The humanist geometry gives the system a calm, European-civic clarity. Uppercase usage carries generous tracking (0.125em–0.167em) for editorial feel.
- **ITC Giovanni Std Bold** — sizes: 16px, 18px, 28px, 48px, 64px; weight: 700; line-height: 1.10–1.40 (tight at display sizes: 1.10 at 64px); letter-spacing: . Role: Exclusively for editorial display headlines, section titles, and large pull quotes. The transitional serif with a bold weight creates contrast against the sans body — a serif headline signals "this is a moment" in the page rhythm. Never used below 16px.

## Type Scale

- caption: 12px / lh 1.5 / ls 1.5
- body-sm: 14px / lh 1.43 / ls 2.34
- body: 16px / lh 1.4 / ls 2
- subheading: 20px / lh 1.25 / ls undefined
- heading-sm: 24px / lh 1.2 / ls undefined
- heading: 28px / lh 1.2 / ls undefined
- heading-lg: 40px / lh 1.25 / ls undefined
- display: 48px / lh 1.2 / ls undefined
- display-lg: 64px / lh 1.1 / ls undefined

## Spacing & Shape

- Radius — buttons: 80px, cards: , inputs: , tags: 
- Element gap: 24px; Section gap: 64-80px; Card padding: 32-48px; Page max-width: 1200px

## Components

### Header Navigation Bar
Role: Site-wide top bar
White (#ffffff) background, full-width. Left: hamburger icon + 'MENU' label in Avenir 12px uppercase tracked. Center: BelArosa logo with Honey Gold monogram and dark teal wordmark. Right: globe icon + 'BOOK' outlined pill button. Fixed/sticky position with no shadow.

### Outlined Teal Pill Button (Primary CTA)
Role: Primary action button on light surfaces
Border: 1.5px solid #193741. Background: transparent. Text: #193741, Avenir 12–14px uppercase, letter-spacing 0.167em. Border-radius: 80px (full pill). Padding: 12px 28px. Hover: fills with #193741, text becomes #ffffff. Used for 'BOOK', 'Mehr erfahren' on light sections.

### Ghost White Button
Role: Action button on dark teal sections
Border: 1.5px solid #ffffff. Background: transparent. Text: #ffffff, Avenir uppercase tracked. Border-radius: 80px. Same padding as teal variant. Hover: fills white, text becomes #193741.

### Hero Section
Role: Full-bleed dark opening section
Background: #193741 full-bleed. Centered layout. Small uppercase eyebrow in Avenir 12px white (0.167em tracking) above serif display headline. Headline: ITC Giovanni Bold 48–64px, white, line-height 1.10. Two circular/teal-tinted photograph frames flanking the text. No scroll-indicator border on the image circles — they bleed into the teal canvas.

### Seasonal Badge
Role: Floating circular callout
Circular shape, 80px border-radius. Background: #193741. Text: white, Avenir 12–14px centered. Positioned top-left of hero. Functions as a decorative informational medallion.

### Eyebrow Label
Role: Small uppercase category marker above headlines
Avenir 12–14px, uppercase, letter-spacing 0.125–0.167em, color matches the section's text color. Examples: 'THE BELAROSA CHALET', 'CUISINE', 'PHILOSOPHY'. Always paired with a serif headline below.

### Sub-Navigation Menu
Role: Category links below main nav
Horizontal bar on white or light background. Items: Avenir 12–14px uppercase, letter-spacing 0.125em, color #193741. Items: PHILOSOPHY, CHALETS, CUISINE, WELLNESS, FRIENDS & FAMILY, GALLERY, EXPERIENCES. Active state: Honey Gold underline or subtle border-bottom. Even spacing across the full bar width.

### Split Content Section (Dark)
Role: Two-column text + image on dark teal background
Full-bleed #193741 background. 50/50 grid: one side large lifestyle photograph with no border-radius (raw edges into the teal), other side centered text block with eyebrow + serif heading + body paragraph + ghost white CTA. Vertical centering. 64–80px padding top/bottom.

### Editorial Content Card
Role: Centered content unit on light sections
Warm Parchment or white background. Centered large photograph (constrained width ~600–700px) above serif headline (ITC Giovanni 28–40px) in #193741. No card border or shadow. Generous whitespace around the unit. 48–64px vertical padding.

### Logo Lockup
Role: Brand identity mark
Centered. Monogram 'B' in ITC Giovanni Bold or custom italic serif, Honey Gold #eac486. Below: 'BelArosa' in Avenir or similar geometric sans, #193741, 16–18px, letter-spacing 0.05em. Below: 'CHALET' in Avenir 10px uppercase, #193741, letter-spacing 0.3em. Stacked vertically, centered alignment.

### Cookie Consent Banner
Role: Fixed overlay notice
Background: Honey Gold #eac486 at 95% opacity. Fixed bottom-right. Avenir 14px body text in #193741. 'MEHR ERFAHREN' as uppercase tracked link. Close icon (×) top-right. Warm tone signals non-intrusive, on-brand notification.

### Scroll Indicator
Role: Bottom-left scroll prompt
Small downward chevron icon in a diamond/rhombus frame, white stroke, with 'SCROLL' label in Avenir 12px uppercase white, letter-spacing 0.167em. Positioned bottom-left of the hero.

## Do

- Use 80px border-radius on all buttons, tags, and pill-shaped elements — the full pill is a signature shape, not a stylistic choice
- Pair every serif headline with an uppercase tracked eyebrow label above it — the eyebrow-to-serif rhythm is the editorial structure
- Use Mountain Slate #193741 as both surface color and border color interchangeably — the system blurs the line between background and edge
- Maintain 64–80px vertical gaps between major sections; the design breathes slowly and never feels dense
- Use the sans (Avenir) for all UI, body, and navigation text; the serif (ITC Giovanni) appears only in display headlines 16px and above
- Apply 0.125–0.167em letter-spacing to all uppercase text in Avenir — tight tracking would break the editorial-luxury tone
- Keep the colorfulness at 5% or below; color appears only in the monogram, seasonal badge, and cookie banner — never as a functional fill

## Never

- Never use drop shadows anywhere in the system — depth comes from color contrast and 1px borders, not elevation
- Never use the Honey Gold #eac486 as a CTA fill, hover state, or interactive surface — it is decorative only
- Never mix the serif and sans within the same text block; they serve distinct roles and must not compete
- Never use the sans for display headlines above 28px — large sans text breaks the serif-pull-quote rhythm
- Never create filled colored buttons; all CTAs are outlined/ghost pills, even the primary action
- Never use the deep teal #1d414d for large surface fills — it is a border and hover-state variant, not a section background
- Never compress section padding below 48px; the slow vertical rhythm is what gives the site its unhurried, luxury pacing

## Agent Prompt Guide

**Quick Color Reference**
- text: #193741
- background: #ffffff
- border: #193741
- accent: #eac486
- dark surface: #193741
- primary action: #1d414d (outlined action border)

**3 Example Component Prompts**

1. Create a hero section: full-bleed #193741 background, centered. Eyebrow in Avenir 12px uppercase white, letter-spacing 0.167em. Display headline in ITC Giovanni Bold 64px white, line-height 1.10: 'Nestled in nature'. Two circular photo insets (200px diameter) on left and right with a teal overlay. Scroll indicator (chevron + 'SCROLL' label in Avenir 12px white) at bottom-left.

2. Create a dark cuisine section: full-bleed #193741 background, 50/50 grid. Left: large food-prep photograph with raw edges into the teal, no border-radius. Right: centered text block. Eyebrow: 'CUISINE' in Avenir 14px uppercase white, letter-spacing 0.125em. Heading: 'Only the finest: our dining philosophy.' in ITC Giovanni Bold 40px white. Body paragraph: Avenir 16px white at line-height 1.40. Ghost white outlined button: border 1.5px #ffffff, border-radius 80px, padding 12px 28px, text 'Mehr erfahren' in Avenir 12px uppercase white.

3. Create an editorial content card on light section: #ffffff background, max-width 700px centered. Full-width lifestyle photograph (mountain balcony scene) above. Title below: 'Summer Escape' in ITC Giovanni Bold 28px, #193741, centered. No border, no shadow, no card background — the whitespace IS the card.
