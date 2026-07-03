// Built-in design system library (DESIGN.md format), stored permanently in the app.
// Each style is tagged with niches so the generator can AUTO-MATCH the detected
// industry to the right preset. Add more via "+ Add Style" (saved to Supabase).
//
// REFERO_STYLES: real DESIGN.md systems harvested from styles.refero.design
// (source files in lib/refero/*.md, baked into lib/referoStyles.json).
// They are listed FIRST so Auto-Match prefers them on equal score.
import referoStyles from './referoStyles.json'

const HANDWRITTEN_STYLES = [
  {
    id: 'builtin_editorial_warm',
    name: 'Warm Editorial',
    niches: ['restaurant', 'cafe', 'bakery', 'bar', 'winery', 'catering', 'food', 'hospitality', 'hotel'],
    content: `# DESIGN.md — Warm Editorial
Mood: golden-hour dining, confident, atmospheric. Feels like a boutique hotel site.
Colors: --cream:#faf6ef (page bg), --ink:#1c1a17 (text), --accent: brand primary, --muted:#8a8378.
Typography: Headlines "Playfair Display" serif 700, 64/40/28. Body "Inter" 400 16-18px, line-height 1.7. Letterspaced small-caps labels (12px, 0.14em) above headings.
Layout: full-bleed hero image, bottom-left headline over a soft dark scrim; alternating image/text splits (60/40); menu items as two-column list with dotted leaders; 120px section padding.
Components: rectangular ink buttons with cream text, no radius; oversized serif italic review quotes; cream footer with thin top rule.
Never: card grids, drop shadows, more than one accent color.`,
  },
  {
    id: 'builtin_bold_trades',
    name: 'Bold Trades',
    niches: ['hvac', 'plumbing', 'electrical', 'roofing', 'contractor', 'construction', 'landscaping', 'pest', 'garage', 'handyman'],
    content: `# DESIGN.md — Bold Trades
Mood: dependable, urgent, high-contrast. Feels like a company that answers the phone.
Colors: --paper:#ffffff, --charcoal:#15181d (nav/footer/hero overlay), --accent: brand primary, --steel:#5b6470.
Typography: Headlines "Barlow Condensed" 700 uppercase, 72/44/30, tight leading. Body "Inter" 400 17px. Phone number is the biggest interactive element on the page.
Layout: charcoal hero with hard diagonal photo edge; 3-up services with thick left accent borders (no shadows); full-width charcoal trust strip (years, licensed, guarantee).
Components: big rectangular buttons with a 2px darker bottom edge; simple line icons; accent-background testimonial strip with white text.
Never: script fonts, pastel colors, thin gray text on white.`,
  },
  {
    id: 'builtin_clean_clinic',
    name: 'Clean Clinic',
    niches: ['medical', 'dental', 'dentist', 'doctor', 'clinic', 'chiropractic', 'physical therapy', 'optometry', 'veterinary', 'pediatric'],
    content: `# DESIGN.md — Clean Clinic
Mood: calm authority, trust at first glance, plenty of air.
Colors: --white:#ffffff, --mist:#f4f7f9 (alt sections), --navy-ink:#122033 (headings), --accent: brand primary, used only on CTAs and links.
Typography: Headlines "Source Serif 4" 600, 56/36/26. Body "Inter" 400 17px #3c4a5a, line-height 1.75.
Layout: white nav with single accent CTA; hero split 55/45 text-left photo-right, 24px rounded image corners; outlined credential chips; services as spacious 2-col rows (not cards); booking CTA mid-page and at the end.
Components: pill buttons, accent bg, white text; quiet 1px #e3e9ee dividers only where needed; mist footer.
Never: dark backgrounds, more than two font families, aggressive urgency styling.`,
  },
  {
    id: 'builtin_authority_firm',
    name: 'Authority Firm',
    niches: ['law', 'attorney', 'legal', 'finance', 'accounting', 'insurance', 'wealth', 'tax', 'consulting firm'],
    content: `# DESIGN.md — Authority Firm
Mood: quiet power, precision, old-money confidence.
Colors: --bone:#f7f5f1 (page bg), --graphite:#191c1f (headings/nav), --accent: brand primary or deep bronze #8a6d3b, --slate:#4d565e.
Typography: Headlines "Libre Baskerville" 700, 58/38/26. Body "Inter" 400 17px --slate, line-height 1.8. Numbered practice areas (01, 02…) in small serif.
Layout: graphite nav; hero with a strong left-aligned serif statement and a single consult CTA; practice areas as a numbered vertical list with generous rules of whitespace; credentials row with understated stats; final full-width graphite CTA band.
Components: rectangular buttons, graphite bg, bone text; thin 1px rules as accents; long-form paragraph styling that feels like print.
Never: rounded bubbly cards, bright saturated colors, stock-photo grids.`,
  },
  {
    id: 'builtin_energy_gym',
    name: 'High Energy',
    niches: ['gym', 'fitness', 'crossfit', 'martial arts', 'boxing', 'training', 'sports', 'bootcamp'],
    content: `# DESIGN.md — High Energy
Mood: adrenaline, momentum, join-us-now. Feels like a countdown.
Colors: --black:#0c0c0e (page bg), --white:#ffffff, --accent: brand primary at full saturation, --ash:#9aa0a8.
Typography: Headlines "Archivo Black" or "Anton", 80/48/32 uppercase italic-skewed. Body "Inter" 400 16px --ash.
Layout: full-bleed action-photo hero with heavy dark overlay and a massive one-line promise; class/program grid with photo tiles and accent hover borders; transformation strip (before/after or stats in huge numerals); trial-offer CTA repeated.
Components: oversized accent buttons, slight skew; accent-colored stat numerals 96px; marquee-style strip of program names.
Never: pastels, serif body text, whitespace-heavy minimalism.`,
  },
  {
    id: 'builtin_elegant_salon',
    name: 'Elegant Beauty',
    niches: ['salon', 'beauty', 'hair', 'nails', 'lashes', 'makeup', 'aesthetics', 'medspa', 'skincare', 'brows'],
    content: `# DESIGN.md — Elegant Beauty
Mood: soft luxury, editorial fashion, self-care as a treat.
Colors: --blush:#f9f3f0 (page bg), --espresso:#2b2220 (text), --accent: brand primary or muted rose #c98d7d, --fog:#a99d97.
Typography: Headlines "Cormorant Garamond" 600, 62/40/28 with tight elegant tracking. Body "Inter" 300-400 16px. Fine small-caps labels.
Layout: split hero — portrait photo right, airy headline left; services as a refined price list with hairline rules; portfolio as a masonry-ish 3-col gallery; booking CTA in a full-width blush band.
Components: thin outlined buttons that fill espresso on hover; circular portrait crops for team; delicate 1px hairlines.
Never: heavy shadows, bold slab fonts, cluttered grids.`,
  },
  {
    id: 'builtin_serene_spa',
    name: 'Serene Wellness',
    niches: ['spa', 'wellness', 'massage', 'yoga', 'meditation', 'therapy', 'counseling', 'holistic', 'acupuncture'],
    content: `# DESIGN.md — Serene Wellness
Mood: exhale. Stillness, nature, unhurried space.
Colors: --sand:#f4efe7 (page bg), --moss: brand primary or #6b7d6a, --bark:#3a352f (text), --stone:#8f887d.
Typography: Headlines "Fraunces" 500, 54/36/26, soft optical sizing. Body "Inter" 400 17px, line-height 1.85. Lowercase nav links.
Layout: hero with a calm nature/space photo, headline floating on generous sand space beside it (not over it); offerings as wide single-column rows with big breathing room; philosophy/quote interlude section; gentle booking CTA.
Components: soft 999px pill buttons in moss; 20px rounded photo corners; no dividers — space separates everything.
Never: urgency copy styling, high-contrast black, tight line-heights.`,
  },
  {
    id: 'builtin_luxury_estate',
    name: 'Luxury Estate',
    niches: ['real estate', 'realtor', 'property', 'broker', 'mortgage', 'development', 'architecture', 'interior design'],
    content: `# DESIGN.md — Luxury Estate
Mood: floor-to-ceiling windows, quiet wealth, the listing is the star.
Colors: --ivory:#f8f7f4 (page bg), --onyx:#111214 (nav/headings), --accent: brand primary or champagne #b7a179, --dove:#7d8288.
Typography: Headlines "DM Serif Display", 60/40/28. Body "Inter" 400 16px --dove. Wide-tracked uppercase micro-labels.
Layout: near-fullscreen property photo hero with onyx gradient at the base and headline + search/contact CTA; featured listings as large 2-up photo cards with minimal captions (price, beds, area); agent credibility split section with portrait; onyx footer with serif wordmark.
Components: understated outlined buttons on photos, solid onyx buttons elsewhere; photo-first everything; hairline dividers only in the footer.
Never: busy card grids with heavy borders, more than one accent, small hero photos.`,
  },
  {
    id: 'builtin_industrial_auto',
    name: 'Industrial Auto',
    niches: ['auto', 'mechanic', 'repair', 'detailing', 'tires', 'body shop', 'motorcycle', 'towing', 'dealership'],
    content: `# DESIGN.md — Industrial Auto
Mood: garage-floor competence, chrome and torque, no-nonsense.
Colors: --asphalt:#1a1d21 (page bg), --white:#f2f4f6, --accent: brand primary or signal red #d64541, --gunmetal:#3a4149.
Typography: Headlines "Oswald" 600 uppercase, 68/42/28. Body "Inter" 400 16px rgba(242,244,246,0.75). Big numeric stats.
Layout: asphalt page; hero with a dramatic vehicle photo fading into the bg and a hard accent underline on the headline; services as gunmetal panels with accent top borders; trust strip (years, warranties, certifications); map/contact block with oversized phone.
Components: rectangular accent buttons, uppercase; diagonal section cuts allowed once; steel-texture restraint — flat colors, no gradients.
Never: soft pastels, serif fonts, rounded bubble cards.`,
  },
  {
    id: 'builtin_product_retail',
    name: 'Product Retail',
    niches: ['retail', 'ecommerce', 'boutique', 'shop', 'store', 'clothing', 'jewelry', 'furniture', 'goods'],
    content: `# DESIGN.md — Product Retail
Mood: the product is the hero. Gallery-clean, effortless browsing.
Colors: --white:#ffffff (page bg), --carbon:#1b1b1b (text), --accent: brand primary, used sparingly, --cloud:#f2f2f0 (product tiles bg).
Typography: Headlines "Manrope" 800, 56/36/24. Body "Inter" 400 16px #555. Price styling slightly bolder than body.
Layout: minimal nav; hero as a single stunning product/lifestyle shot with short headline and one Shop CTA; featured items as a clean 3-col grid on cloud tiles with generous padding; offer/announcement thin banner; hours+location compact footer block.
Components: carbon buttons with white text; product tiles with no borders — the cloud bg defines them; subtle hover zoom on images only.
Never: more than two typefaces, colored section backgrounds, badge clutter.`,
  },
  {
    id: 'builtin_raw_studio',
    name: 'Raw Studio',
    niches: ['tattoo', 'barber', 'piercing', 'studio', 'streetwear', 'music', 'photography', 'artist'],
    content: `# DESIGN.md — Raw Studio
Mood: editorial and raw. Ink, grain, attitude — a zine, not a brochure.
Colors: --coal:#121212 (page bg), --bone:#e8e4dc, --accent: brand primary or blood red #b3382e, --smoke:#6f6c66.
Typography: Headlines "Archivo Black" mixed with "Libre Baskerville" italic accents, 72/44/30, aggressive contrast. Body "Inter" 400 16px --smoke. Oversized section numerals.
Layout: coal page; hero with a gritty b/w photo, huge headline overlapping the image edge; portfolio as an irregular editorial grid (mixed sizes, intentional asymmetry); artist bios as offset split rows; booking CTA stark and centered.
Components: bone outlined buttons; underline-only links; photos in b/w or muted duotone with accent reserved for CTAs.
Never: rounded corners, soft pastels, symmetrical card grids, corporate polish.`,
  },
  {
    id: 'builtin_personal_coach',
    name: 'Personal Brand',
    niches: ['coach', 'coaching', 'consultant', 'speaker', 'course', 'agency', 'marketing', 'mentor', 'author'],
    content: `# DESIGN.md — Personal Brand
Mood: magnetic credibility — one person, one promise, one next step.
Colors: --paper:#fdfcfa (page bg), --ink:#17181a, --accent: brand primary, --warm-gray:#75716b.
Typography: Headlines "Sora" 700, 60/38/26. Body "Inter" 400 17px --warm-gray, line-height 1.75. Highlighted keyword in the hero headline gets an accent underline sweep.
Layout: hero split — bold promise left, professional portrait right (slight accent-tinted shape behind it); social proof logo/quote strip immediately after; method/offer as 3 numbered steps in a single row; results/testimonials with real names; single strong application CTA.
Components: solid accent pill CTA repeated identically 3x max; portrait photos cut out or arched; numbered steps in oversized light numerals.
Never: stocky business imagery, multiple competing CTAs, dark theme.`,
  },
  {
    id: 'builtin_midnight_saas',
    name: 'Midnight Product',
    niches: ['tech', 'saas', 'software', 'startup', 'app', 'ai', 'it services', 'cybersecurity'],
    content: `# DESIGN.md — Midnight Product
Mood: premium, kinetic, command-deck energy.
Colors: --void:#0b0d12 (page bg), --panel:#12151d, --line:#232838, --glow: brand primary, --text:#e9edf5, --dim:#8b93a7.
Typography: Headlines "Space Grotesk" 700, 68/42/28, tight tracking. Body "Inter" 400 16px --dim. Monospace micro-labels (11px uppercase, 0.16em).
Layout: near-black hero with a huge headline, glow-accent keyword, single luminous CTA; feature rows as panels separated by 1px --line borders; stats row with oversized numerals; photography in subtle dark duotone.
Components: glow buttons with soft same-hue outer shadow; hover states brighten borders; void footer with monospace links.
Never: pure white sections, rounded-bubble cards, more than one glow color.`,
  },
  {
    id: 'builtin_friendly_home',
    name: 'Friendly Home',
    niches: ['cleaning', 'childcare', 'daycare', 'pets', 'grooming', 'tutoring', 'senior care', 'moving', 'organizing'],
    content: `# DESIGN.md — Friendly Home
Mood: trustworthy neighbor, warm and organized, family-safe.
Colors: --linen:#fbf8f3 (page bg), --cocoa:#33302b (text), --accent: brand primary, --sunny: secondary tint of accent at 12% for section bands.
Typography: Headlines "Nunito" 800, 54/34/24, friendly rounded forms. Body "Inter" 400 17px, line-height 1.7.
Layout: cheerful hero with real-people photo and a clear promise + quote CTA; how-it-works as 3 simple illustrated-feel steps; services as soft rounded tiles (16px) on the sunny band; reviews with names and neighborhoods; simple contact block with big phone.
Components: rounded 12px accent buttons; soft tiles with 1px warm borders, no shadows; checkmark lists for what's included.
Never: dark themes, corporate stiffness, tiny gray legal-feeling text.`,
  },
  {
    id: 'builtin_sacred_community',
    name: 'Sacred Community',
    niches: ['church', 'nonprofit', 'ministry', 'community', 'charity', 'foundation'],
    content: `# DESIGN.md — Sacred Community
Mood: welcoming light, quiet reverence, belonging before asking.
Colors: --dawn:#faf7f1 (page bg), --deep:#26323e (headings/footer), --accent: brand primary or warm gold #b98c3f, --dove:#7c8794.
Typography: Headlines "Cormorant Garamond" 600, 58/38/26. Body "Inter" 400 17px, line-height 1.8. Scripture/mission quotes in large italic serif.
Layout: full-width photo hero of real people gathered, soft dark-bottom scrim, welcome headline + service times immediately visible; "plan your visit" pathway as 3 gentle steps; ministries as airy rows with photos; giving CTA humble and secondary to belonging CTAs; deep-color footer with service schedule.
Components: pill buttons; generous 110px section spacing; photography warm and candid, never stocky.
Never: hard sales urgency, neon accents, cluttered event grids.`,
  },
  {
    id: 'builtin_playful_primary',
    name: 'Playful Primary',
    niches: ['daycare', 'childcare', 'preschool', 'kids', 'tutoring', 'camp', 'pediatric'],
    content: `# DESIGN.md — Playful Primary
Mood: crayon-bright joy adults still trust — playful for kids, credible for parents.
Colors: --paper:#fffdf6 (page bg), --crayon: brand primary at full saturation, --sunshine:#ffd23f (accents/shapes), --ink:#2b2b33.
Typography: Headlines "Baloo 2" 700, 56/36/26, round and friendly. Body "Inter" 400 17px --ink at 80%, line-height 1.7.
Layout: hero with real kids-at-play photo inside a big rounded blob mask, one clear promise + tour CTA; trust strip for parents (licensed, ratios, safety) in straightforward type; programs as color-dipped rounded cards (20px radius) each with a simple icon; staff with circular photos and first names; enrollment CTA repeated warmly.
Components: chunky rounded buttons; hand-drawn-feel squiggle dividers used sparingly; soft drop of one accent shape per section, never confetti everywhere.
Never: dark sections, corporate gray, thin elegant serifs, more than three brights on one screen.`,
  },
  {
    id: 'builtin_gallery_monochrome',
    name: 'Gallery Monochrome',
    niches: ['photography', 'photographer', 'artist', 'portfolio', 'gallery', 'videographer', 'design studio'],
    content: `# DESIGN.md — Gallery Monochrome
Mood: white-wall gallery; the work is the only color allowed.
Colors: --wall:#fcfcfa (page bg), --ink:#111111, --accent: brand primary used ONLY for links/CTA underlines, --ash:#9b9b96.
Typography: Headlines "Neue Haas"-style — use "Inter Tight" 600, 52/34/24, tight tracking. Body "Inter" 400 16px --ash. Captions 12px letterspaced uppercase.
Layout: near-invisible nav (wordmark + 3 links); hero is ONE full-width signature image with a single-line title beneath it, museum-placard style; portfolio as an asymmetric editorial grid — varied sizes, aligned to a strict 12-col grid, generous white gutters; about as a split with a b/w portrait; inquiry CTA as a plain oversized text link with accent underline.
Components: no buttons except one; images never cropped square by default; hover reveals caption only.
Never: colored section backgrounds, drop shadows, rounded cards, decorative icons.`,
  },
  {
    id: 'builtin_industrial_taproom',
    name: 'Industrial Taproom',
    niches: ['brewery', 'taproom', 'bar', 'distillery', 'nightlife', 'cocktail'],
    content: `# DESIGN.md — Industrial Taproom
Mood: exposed brick and steel, foam on cold glass, loud friday night confidence.
Colors: --stout:#17130f (page bg), --foam:#f2ece2, --accent: brand primary or amber #d98e32, --copper:#8a6a4b.
Typography: Headlines "Oswald" 600 uppercase 72/44/30 with condensed swagger. Body "Inter" 400 16px foam at 70%. Beer names in bold with ABV in monospace.
Layout: dark hero with a moody pour photo and a huge one-liner; tap list as a two-column menu with dotted leaders (name — style — ABV — price); events strip (trivia/live music) in accent; visit block with big hours + map cue; merch teaser row.
Components: rectangular foam-outline buttons; copper hairlines; photography low-lit and textured.
Never: pastel colors, thin script fonts, white default sections.`,
  },
  {
    id: 'builtin_coastal_escape',
    name: 'Coastal Escape',
    niches: ['hotel', 'bnb', 'resort', 'travel', 'vacation rental', 'lodge', 'tourism'],
    content: `# DESIGN.md — Coastal Escape
Mood: linen curtains moving in sea air — the pause before a deep breath.
Colors: --sand:#f7f3ec (page bg), --tide: brand primary or deep sea #2e5d68, --drift:#c8b9a2, --char:#28303a.
Typography: Headlines "Fraunces" 500, 60/40/28, soft and editorial. Body "Inter" 300-400 17px, line-height 1.8. Wide-tracked uppercase micro-labels.
Layout: full-bleed horizon hero with slow confidence — one poetic line + dates/booking bar; rooms/stays as large photo cards with airy captions (name, from-price); experience section alternating photo/text with generous sand space; reviews as sparse pull-quotes; booking CTA repeated in tide color.
Components: ghost buttons on photos, solid tide elsewhere; 16px radius on photo cards; icons thin-line only.
Never: busy grids, red urgency banners, cramped sections, more than two typefaces.`,
  },
  {
    id: 'builtin_golden_hour_events',
    name: 'Golden Hour Events',
    niches: ['wedding', 'events', 'planner', 'venue', 'florist', 'catering'],
    content: `# DESIGN.md — Golden Hour Events
Mood: champagne light on silk — romance with editorial restraint.
Colors: --ivory:#faf6f0 (page bg), --champagne:#c9a26a, --accent: brand primary or dusty rose #b76e79, --graphite:#33302e.
Typography: Headlines "Cormorant Garamond" 500 italic-accented, 62/40/28. Body "Inter" 300-400 16px, line-height 1.85. Names/dates in letterspaced small caps.
Layout: hero of a real celebration at golden hour, headline floating on ivory beside it; services as an elegant numbered list (01 Full Planning…); portfolio as a tall editorial gallery with mixed portrait crops; kind-words section with oversized serif quotes; inquiry CTA as a refined form teaser ("Tell us your date").
Components: thin outlined champagne buttons; hairline dividers; photos warm-toned, generous margins.
Never: card grids with shadows, bright saturated color blocks, sans-serif display headlines.`,
  },
]

export const BUILT_IN_STYLES = [...referoStyles, ...HANDWRITTEN_STYLES]

// Score a style library against a detected industry/niche string and return the
// best match (or null). Used for the AUTO preset: plug in a site, get its style.
export function matchStyleToIndustry(styles, industryText) {
  const text = (industryText || '').toLowerCase()
  if (!text) return null
  let best = null
  let bestScore = 0
  for (const s of styles) {
    const tags = Array.isArray(s.niches)
      ? s.niches
      : String(s.niches || '').split(',').map(t => t.trim()).filter(Boolean)
    let score = 0
    for (const tag of tags) {
      if (tag && text.includes(tag.toLowerCase())) score += tag.length > 4 ? 2 : 1
    }
    if (score > bestScore) { bestScore = score; best = s }
  }
  return bestScore > 0 ? best : null
}

// Top-N matches for smart mixing: the builder blends the strongest elements of
// several matched systems into one direction niched to the business.
export function matchTopStyles(styles, industryText, n = 3) {
  const text = (industryText || '').toLowerCase()
  if (!text) return []
  const scored = []
  for (const s of styles) {
    const tags = Array.isArray(s.niches)
      ? s.niches
      : String(s.niches || '').split(',').map(t => t.trim()).filter(Boolean)
    let score = 0
    for (const tag of tags) {
      if (tag && text.includes(tag.toLowerCase())) score += tag.length > 4 ? 2 : 1
    }
    if (score > 0) scored.push({ style: s, score })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, n).map(x => x.style)
}

// Creative mixer — replaces "same niche = same preset" with a deliberate trio:
//   1. the strongest NICHE anchor (keeps it appropriate to the industry)
//   2. the strongest VIBE carrier (the creator's chosen mood drives the look)
//   3. the best remaining overall match (diversity / wildcard)
// Two brands in the same industry with different vibes get different blends.
export function pickCreativeMix(styles, industryText, vibeText, n = 3) {
  const nicheText = (industryText || '').toLowerCase()
  const vibeWords = (vibeText || '').toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3)
  const scored = styles.map(s => {
    const tags = Array.isArray(s.niches) ? s.niches : String(s.niches || '').split(',').map(t => t.trim()).filter(Boolean)
    let nicheScore = 0
    for (const tag of tags) if (tag && nicheText.includes(tag.toLowerCase())) nicheScore += tag.length > 4 ? 2 : 1
    const hay = `${s.name} ${tags.join(' ')} ${String(s.content || '').slice(0, 700)}`.toLowerCase()
    let vibeScore = 0
    for (const w of vibeWords) if (hay.includes(w)) vibeScore += 1
    return { style: s, nicheScore, vibeScore, total: nicheScore * 2 + vibeScore }
  })
  const picked = []
  const take = list => {
    const found = list.find(x => !picked.includes(x.style))
    if (found) picked.push(found.style)
  }
  const byNiche = [...scored].sort((a, b) => b.nicheScore - a.nicheScore || b.vibeScore - a.vibeScore)
  const byVibe = [...scored].sort((a, b) => b.vibeScore - a.vibeScore || b.nicheScore - a.nicheScore)
  const byTotal = [...scored].sort((a, b) => b.total - a.total)
  if (byNiche[0]?.nicheScore > 0) take(byNiche)
  if (byVibe[0]?.vibeScore > 0) take(byVibe)
  while (picked.length < n && byTotal.some(x => !picked.includes(x.style) && x.total > 0)) take(byTotal.filter(x => x.total > 0))
  if (!picked.length && styles.length) picked.push(styles[0])
  return picked.slice(0, n)
}

export function findBuiltIn(id) {
  return BUILT_IN_STYLES.find(s => s.id === id) || null
}
