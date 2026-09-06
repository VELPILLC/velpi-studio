# Function — Style Reference
> warm apothecary journal on parchment

**Theme:** light

Function reads like a premium editorial wellness journal printed on warm cream paper: a serif display voice (Financier) delivers headlines with quiet authority while a humanist sans (Ftbase) carries the body language of a calm clinician. The canvas is never sterile white — every surface sits in a warm parchment range from #fef9ef to #f5eee1, and a single terracotta accent (#b05a36) punctuates actions, badges, and icon strokes like a wax seal on an apothecary label. Components are rounded generously (24px cards, 40px buttons, 9999px pills) but never feel toy-like because shadows are used sparingly and only at two elevations. Italic serif words mixed with roman serif in the same headline create a typographic rhythm that's the system's strongest signature — health tech that trusts the reader to slow down.

## Tokens — Colors

| Name | Value | Role | Group |
|------|-------|------|-------|
| Terracotta Seal | `#b05a36` | Primary action buttons, eyebrow labels, active states, icon strokes, key badges — a single warm rust against cream paper, evokes clinical warmth without medical sterility; Subtle hero overlay gradient from terracotta to a lighter tan — used on hero photo treatment and decorative seals, not on UI surfaces | brand |
| Parchment | `#fef9ef` | Page canvas and primary surface — never use pure white; this warm off-white is the system's base tone | neutral |
| Aged Paper | `#f5eee1` | Card and panel surfaces, subtle wash backgrounds — one step deeper than the canvas to create soft elevation without shadows | neutral |
| Warm Taupe | `#d1c9bf` | Hairline borders, divider lines, card outlines — replaces cold gray with a tone that belongs to the cream family | neutral |
| Ink | `#2a2b2f` | Primary text, heading fills, strong borders — near-black with a barely-warm cast to harmonize with parchment rather than fight it | neutral |
| Charcoal | `#333333` | Secondary text, body copy, default icon fills, structural borders — slightly softer than Ink for reading-length passages | neutral |
| Graphite | `#515151` | Muted helper text, captions, secondary metadata — never below 14px without sufficient weight to maintain AAA contrast on parchment | neutral |
| Ash | `#808988` | Input borders, disabled state outlines, placeholder text — the only cool-leaning neutral, used only on form elements | neutral |
| Pure Black | `#000000` | SVG fill default, logo mark — reserve for vector illustration, never use as text or background | neutral |

## Tokens — Typography

- **Financier Display** — sizes: 34, 45, 64, 80, 88px; weight: 300, 400; line-height: 0.90–1.15; letter-spacing: normal. Role: Display and editorial headlines — weight 400 for roman, weight 300 for italic accent words within the same headline (e.g. 'Testing is easy' pairs roman with italic). The mix of roman + italic serif in one line is the system's most distinctive typographic move. Substitute: GT Super, Domaine Display, Tiempos Headline
- **Ftbase** — sizes: 12, 14, 16, 18, 20, 24px; weight: 300, 400, 600, 700; line-height: 1.20–1.50; letter-spacing: -0.023em (≈ -0.28px at 12px, -0.37px at 16px, -0.55px at 24px). Role: Body, navigation, buttons, UI labels, and all interface text. Weight 300 is used for hero subhead and large descriptive passages; weight 400 for body; weight 600 for button labels and strong UI; weight 700 reserved for emphasis. The consistent -0.023em tracking pulls the type into a tight, confident block that contrasts the generous serif spacing. Substitute: Inter, Söhne, or Untitled Sans
- **Fragment mono** — sizes: 11px; weight: 400; line-height: 1.00; letter-spacing: normal. Role: Tiny all-caps labels in badge and eyebrow contexts — monospace gives a clinical, data-precise feel for markers like 'HSA/FSA Eligible'. Use sparingly; Ftbase caps at 600+ serve most label needs

## Type Scale

- eyebrow: 12px / lh 1.4 / ls -0.28
- body-sm: 14px / lh 1.5 / ls -0.32
- body: 16px / lh 1.5 / ls -0.37
- body-lg: 18px / lh 1.4 / ls -0.41
- subheading: 20px / lh 1.3 / ls -0.46
- heading: 34px / lh 1.15 / ls undefined
- heading-lg: 45px / lh 1.1 / ls undefined
- display: 64px / lh 1 / ls undefined
- hero: 80px / lh 0.95 / ls undefined
- display-xl: 88px / lh 0.9 / ls undefined

## Spacing & Shape

- Radius — buttons: 40px, cards: 24px, inputs: 9999px, tags: 9999px
- Element gap: 16px; Section gap: 64-96px; Card padding: 24-32px; Page max-width: 1280px

## Components

### Primary CTA Button
Role: Main conversion action — 'Start testing', 'Get started'
Filled terracotta (#b05a36) background, white text in Ftbase 600 at 16px, padding 12px 24px, border-radius 40px. No border, no shadow. The pill-rounded shape is a signature — buttons are never rectangular.

### Outlined Secondary Button
Role: Supporting action — 'See how it works', 'Learn more'
Transparent background, 1.5px terracotta (#b05a36) border, terracotta text in Ftbase 600 at 16px, padding 12px 24px, border-radius 40px. Sits at the same height as the primary CTA, never subordinate in size.

### Ghost Text Button
Role: Nav links, low-priority actions, 'Log in'
No background, no border, Ink (#2a2b2f) text in Ftbase 400-600 at 14-16px, padding 8px 12px. Hover state may add a subtle aged-paper (#f5eee1) background wash.

### Announcement Bar
Role: Top-of-page promotional message — 'Use your HSA/FSA funds'
Full-width terracotta (#b05a36) background, white text centered in Ftbase 400 at 14px, padding 8px 16px. Underlined link in white sits inline with the message. Sticky to the top of the viewport.

### Primary Navigation Bar
Role: Site-wide navigation
White or parchment (#fef9ef) background, 64-72px tall, logo mark left (terracotta swatch + 'Function' wordmark in Ink), center nav links in Ftbase 400 at 14-16px separated by 24-32px gaps, right side holds Ghost 'Log in' + Primary CTA + search icon + hamburger. Sticky on scroll with a subtle bottom hairline in Warm Taupe (#d1c9bf).

### Numbered Step Card
Role: How-it-works feature step ('01', '02', '03')
Aged Paper (#f5eee1) background, 24px border-radius, padding 40px 32px, no border. Step number ('01') in terracotta at 14px Ftbase 600 eyebrow style. Title in Financier Display 34px, descriptive subtext in Ftbase 400 at 16px in Charcoal. May include an inline illustration or micro-UI preview (calendar, chart) in the lower half.

### Doctor Testimonial Card
Role: Social proof with credentialed endorsement
Inline horizontal layout on parchment canvas, no card chrome. Circular avatar 48-56px, quote in Financier Display 20-24px italic in Ink, attribution in Ftbase 600 at 14px in Ink, credential line in Ftbase 400 at 14px in Graphite.

### Hero Stat Block
Role: Key metric in hero or feature sections — '160+ lab tests', '$1 per day'
Vertical stack: large metric in Financier Display 34-45px in Ink, sub-label in Ftbase 400 at 14px in Graphite below. Separated from adjacent stats by 1px vertical Warm Taupe divider.

### Eyebrow Label
Role: Section pre-title — 'HSA/FSA Eligible', 'Step 01'
All caps Ftbase 600 at 12px in Charcoal or terracotta, letter-spacing tight at -0.28px. Sits 8-12px above the section heading.

### Disease Tag
Role: Inline condition marker — 'Prostate cancer', 'Anemia'
No background, no border. Text in Ftbase 400 at 14px in Charcoal, separated from siblings by a terracotta bullet '·' with 16px horizontal padding. Wraps in a horizontal flow with 8px row gap.

### Bar Chart Widget
Role: Data visualization in feature cards and results previews
Terracotta (#b05a36) bars on parchment background, 1px Warm Taupe axis lines, values labeled in Ftbase 400 at 12px in Graphite. No grid background. Bar corners are square (2px radius) — deliberately not rounded to contrast with the pill-shaped UI.

### Input Field
Role: Form input — search, email, date
Parchment background, 1px Ash (#808988) border, 9999px border-radius (fully pill-shaped), padding 12px 20px, Ftbase 400 at 16px in Ink. Focus ring: 0 0 0 3px rgba(176, 90, 54, 0.2). Placeholder in Graphite.

### Search Icon Button
Role: Toggle search overlay
40px circular, no background, Ink stroke icon at 20px. Hover: Aged Paper (#f5eee1) background fill. Subtle outer glow shadow when active.

### Calendar Picker Widget
Role: Date selection inside step cards
Parchment background with very faint Warm Taupe dividers, day labels (TUE, WED…) in Ftbase 400 at 10-11px in Graphite, day numbers in Ftbase 400 at 14px in Ink. Active day: terracotta text with a subtle terracotta underline. No card chrome — sits flat within the step card.

## Do

- Use Financier Display for all editorial headlines, always pairing roman and italic weights within the same line to create the signature typographic rhythm
- Set body and UI text in Ftbase with the global -0.023em tracking, never override it per element
- Default to the cream surface stack (Parchment → Aged Paper → Taupe Outline) for elevation before reaching for shadows
- Apply the 40px border-radius to all buttons and the 24px radius to all cards — rectangular shapes break the system's identity
- Reserve #b05a36 for exactly three uses: primary CTAs, eyebrow labels, and active/selected states — never as body text or large surface fills
- Use the terracotta bullet '·' with 16px horizontal spacing when listing inline items like diseases or categories
- Keep hero photography warm-toned with a dark overlay so headlines in white or parchment remain legible

## Never

- Never use pure white (#ffffff) as a background — it kills the parchment warmth that defines the brand
- Don't set body text in anything other than Ftbase; the serif is for editorial headlines only
- Don't use small sharp drop shadows; elevation must come from color stepping or the two approved shadow recipes
- Don't apply the terracotta to large background areas, decorative blocks, or text over 24px — it overwhelms when undiluted
- Avoid rectangular buttons or square card corners; the rounded shape family (40px / 24px / 9999px) is non-negotiable
- Don't introduce a second accent color — the system is monochromatic warm with one rust accent, and a second hue breaks the apothecary mood
- Don't use the -0.023em tracking on the serif Financier Display — it belongs only to Ftbase

## Agent Prompt Guide

## Quick Color Reference
- text: #2a2b2f (Ink)
- background: #fef9ef (Parchment)
- border: #d1c9bf (Warm Taupe)
- accent: #b05a36 (Terracotta Seal)
- card surface: #f5eee1 (Aged Paper)
- primary action: #b05a36 (filled action)

## Example Component Prompts

**1. Hero with editorial headline:** Full-bleed dark warm-toned photo background with 60% dark overlay. Parchment (#fef9ef) eyebrow at 12px Ftbase 600 weight, letter-spacing -0.28px. Headline at 80px Financier Display weight 400, color #fef9ef, with the last word in weight 300 italic. Subtext at 18px Ftbase 300 weight, #fef9ef at 80% opacity. Primary CTA: #b05a36 background, white text at 16px Ftbase 600, padding 12px 24px, 40px radius.

**2. Numbered step card:** Aged Paper (#f5eee1) background, 24px border-radius, 40px padding. Step number '01' in 14px Ftbase 600, color #b05a36. Title in 34px Financier Display weight 400, color #2a2b2f. Body text in 16px Ftbase 400, color #333333, line-height 1.5. Optional inline calendar or chart in the lower half.

**3. Doctor testimonial row:** No card chrome, sits directly on Parchment. Circular avatar 48px. Quote in 20px Financier Display weight 300 italic, color #2a2b2f. Name in 14px Ftbase 600, color #2a2b2f. Credential in 14px Ftbase 400, color #515151. Max-width 720px, left-aligned.

**4. Disease tag list:** Horizontal flow with 16px column gap. Each item: 14px Ftbase 400, color #333333. Separator between items is a terracotta (#b05a36) bullet '·' with 16px space on each side. Wraps to multiple lines with 8px row gap.

*Create a Primary Action Button: #b05a36 background, #fef9ef text, 9999px radius, compact pill padding. Use this filled treatment for the main CTA.

## Typographic Rhythm

The single most distinctive move in this system is the roman + italic pairing within Financier Display headlines. 'Testing is easy' uses roman 'Testing is' and italic 'easy' in the same line. '1000s of diseases' is entirely italic. '160+ lab tests chosen by top doctors' pairs roman with italic. This pattern is not decorative — it signals the editorial, almost personal voice of the brand, distinguishing Function from typical health-tech clinical copy. The italic word is always the emotional or surprising word; the roman words set up the structure. Never italicize whole sentences; never italicize UI labels or body text. Italic is reserved for Financier Display at 34px and above.
