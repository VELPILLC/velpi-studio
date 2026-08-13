# Icon Library Index

Three complete SVG sets, all verified free for commercial use with **no attribution
required** in the end product. Every icon is a standalone `.svg` file with a `viewBox`,
designed for inline embedding — our GHL constraint (no icon fonts, no external sprite
requests). Each set's LICENSE file is kept in its folder; leave those files with the sets.

| Set | Version | License | Count | Style | Grid |
|---|---|---|---|---|---|
| **Lucide** (`lucide/icons/`) | lucide-static 1.31.0 | ISC (verified: `lucide/LICENSE`) | 2,025 | 2px stroke outline, rounded caps | 24×24 |
| **Tabler** (`tabler/outline/`, `tabler/filled/`) | @tabler/icons 3.46.0 | MIT (verified: `tabler/LICENSE`) | 5,130 outline + 1,054 filled | 2px stroke outline (+ filled variants) | 24×24 |
| **Heroicons** (`heroicons/24/`, `20/`, `16/`) | heroicons 2.2.0 | MIT (verified: `heroicons/LICENSE`) | 324 outline + 324 solid (24px), plus 20/16px solid | 1.5px stroke outline / solid | 24×24 (also 20, 16) |

License notes: ISC and MIT both require keeping the copyright notice with *distributed
copies of the icon source* (done — LICENSE files kept per set). Neither requires any
credit or link on a website that uses the icons.

## How to use inline (GHL-safe)

Copy the file's SVG markup directly into the HTML. Normalize it to inherit color and
scale with text:

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
     fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- paths from the .svg file -->
</svg>
```

- **Stroke sets (Lucide, Tabler outline, Heroicons outline):** keep `fill="none"`,
  color via `stroke="currentColor"` — the icon then follows the surrounding `color`.
- **Filled/solid sets (Tabler filled, Heroicons solid):** use `fill="currentColor"`, no stroke.
- Strip the `class` attribute and the `<!-- @license -->` comment Lucide ships;
  keep `viewBox`, set explicit `width`/`height` (or size via CSS on a scoped class).
- Heroicons' stroke is 1.5px (lighter, more editorial); Lucide/Tabler are 2px
  (sturdier). Don't mix stroke weights within one site.

## Niche index

Names below are verified against the downloaded files (add `.svg`). Lucide and Tabler
overlap heavily — pick ONE set per site for visual consistency. Tabler has the deepest
niche coverage; Heroicons is best for generic UI in a softer, more "SaaS" voice.

### Trades / construction / contractor
- **Lucide:** `hammer`, `drill`, `hard-hat`, `construction`, `brick-wall`, `axe`,
  `pickaxe`, `forklift`, `paint-bucket`, `paint-roller`, `paintbrush`, `pencil-ruler`,
  `house`, `house-plus`, `map-pin-house`, `wrench` , `ruler`, `truck`
- **Tabler outline:** `hammer`, `hammer-drill`, `helmet`, `backhoe`, `bulldozer`,
  `crane`, `car-crane`, `forklift`, `axe`, `building-warehouse`, `firetruck`,
  `home-2`, `home-bolt`, `home-check`, `home-cog`, `wall`, `shovel`, `ladder`,
  `paint`, `ruler-measure`
- **Heroicons 24/outline:** `wrench`, `wrench-screwdriver`, `home-modern`,
  `paint-brush`, `truck`, `building-office-2`

### Restaurant / food
- **Lucide:** `chef-hat`, `utensils`, `fork-knife`, `fork-knife-crossed`, `coffee`,
  `cup-soda`, `beer`, `bottle-wine`, `cake`, `cake-slice`, `croissant`, `egg-fried`,
  `fish`, `hamburger`, `ice-cream-2`, `apple`, `carrot`, `cherry`, `glass-water`
- **Tabler outline:** `chef-hat`, `tools-kitchen-2`, `coffee`, `cup`, `beer`, `bottle`,
  `burger`, `bread`, `cake`, `carrot`, `cherry`, `egg-cracked`, `cooker`, `grill`,
  `pizza`, `salad`, `soup`, `meat`, `glass-cocktail`
- **Heroicons 24/outline:** `cake`, `building-storefront`, `clock`, `map-pin`, `phone`
  (Heroicons has little food coverage — use Lucide/Tabler for this niche)

### Beauty / salon / spa
- **Lucide:** `scissors`, `brush`, `paintbrush-2`, `sparkles`, `sparkle`, `flower`,
  `flower-2`, `gem`, `leaf`, `droplet`, `droplets`, `feather`, `bath`, `mirror-round`,
  `mirror-rectangular`, `sun`, `heart`, `wand-sparkles`
- **Tabler outline:** `scissors`, `brush`, `bath`, `droplet`, `droplet-half-2`,
  `flower`, `leaf`, `massage`, `perfume`, `razor`, `spray`, `sparkles`, `diamond`,
  `wand`, `sun`, `moon-stars`
- **Heroicons 24/outline:** `scissors`, `sparkles`, `paint-brush`, `sun`, `heart`,
  `calendar-days` (booking CTA)

### Medical / dental / clinical
- **Lucide:** `stethoscope`, `heart-pulse`, `activity`, `syringe`, `pill`,
  `pill-bottle`, `ambulance`, `bandage`, `bone`, `brain`, `briefcase-medical`,
  `hospital`, `microscope`, `thermometer`, `dna`
- **Tabler outline:** `stethoscope`, `heartbeat`, `activity-heartbeat`, `dental`,
  `dental-broken`, `first-aid-kit`, `emergency-bed`, `building-hospital`, `ambulance`,
  `bandage`, `bone`, `brain`, `dna-2`, `health-recognition`, `nurse`, `pill`,
  `vaccine`, `wheelchair`, `microscope`
- **Heroicons 24/outline:** `heart`, `shield-check`, `clipboard-document-check`,
  `user-group`, `phone` (thin medical coverage — prefer Tabler here)

### General business / UI (nav, contact, trust, social)
- **Lucide:** `menu`, `x`, `chevron-down`, `chevron-right`, `arrow-right`,
  `arrow-up-right`, `phone`, `mail`, `map-pin`, `clock`, `calendar`, `check`,
  `badge-check`, `star`, `quote`, `shield`, `shield-check`, `award`, `medal`,
  `trophy`, `users`, `user`, `briefcase`, `building`, `handshake`, `target`,
  `trending-up`, `thumbs-up`, `send`, `message-circle`, `globe`, `external-link`,
  `share-2`, `at-sign` (Lucide removed its brand/social icons — take
  Facebook/Instagram/LinkedIn/YouTube glyphs from Tabler's `brand-*` files even on a
  Lucide site; stroke style matches)
- **Tabler outline:** `menu-2`, `x`, `chevron-down`, `arrow-right`, `arrow-up-right`,
  `phone`, `mail`, `map-pin`, `clock`, `calendar`, `check`, `circle-check`, `star`,
  `quote`, `shield-check`, `award`, `certificate`, `medal`, `trophy`, `users`,
  `briefcase`, `building`, `thumb-up`, `trending-up`, `target`, `send`, `message`,
  `world`, `external-link`, `brand-facebook`, `brand-instagram`, `brand-linkedin`,
  `brand-youtube`, `brand-x`
- **Heroicons 24/outline:** `bars-3` (menu), `x-mark`, `chevron-down`,
  `chevron-right`, `arrow-right`, `arrow-up-right`, `phone`, `envelope`, `map-pin`,
  `clock`, `calendar`, `check`, `check-circle`, `check-badge`, `star`, `shield-check`,
  `trophy`, `users`, `user-group`, `briefcase`, `building-office`,
  `building-storefront`, `globe-alt`, `paper-airplane`, `chat-bubble-left-right`,
  `arrow-trending-up`, `hand-thumb-up` (note: Heroicons has NO social/brand icons —
  pull social glyphs from Lucide or Tabler `brand-*`)

## Selection guidance for the generator

- One set per site. Match stroke weight to the design voice: Tabler/Lucide 2px for
  trades and bold brands, Heroicons 1.5px for medical, professional services, and
  minimal/luxury looks (or Tabler `filled` / Heroicons `solid` for chunky accents).
- Icon color should come from `currentColor` so section-scoped text colors (and the
  contrast pass) automatically apply.
- Typical sizes: 20–24px inline with text, 28–40px in feature cards, 44–56px only
  when the icon sits in a tinted circle/rounded-square chip.
