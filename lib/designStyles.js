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
  {
    id: 'builtin_neo_brutalist_slab',
    name: "Neo Brutalist",
    niches: ["startup","agency","tech","portfolio","saas","creative","web3","bold","playful","editorial"],
    content: `# DESIGN.md — Neo Brutalist
Mood: loud, honest, hyper-confident, anti-corporate.
Colors: --paper:#fffef2 (page bg), --ink:#000000, --accent: brand primary, --electric:#ff4d00, --pop:#2b6bff, --lime:#c6f800. Blocks are flat, fully saturated.
Typography: Headlines "Archivo Black" 900, 84/52/30, letter-spacing -0.02em, ALL CAPS options. Body "Space Grotesk" 500 17px --ink. Micro-labels "JetBrains Mono" 12px uppercase.
Layout: everything sits on a 4px solid black border; cards offset with a hard 8px black drop-shadow (no blur); asymmetric grid, elements deliberately overlap; giant hero headline breaks the margin; sticker-like badges rotated 3-6deg.
Components: chunky buttons with 4px border + 6px hard shadow that collapses on press; tags as black-bordered pills; tables with visible thick gridlines; no gradients anywhere.
Never: soft drop-shadows with blur, rounded gentle cards, muted pastel-only palettes.`,
  },
  {
    id: 'builtin_frosted_glass_depth',
    name: "Frosted Glass",
    niches: ["saas","fintech","tech","app","product","crypto","dashboard","modern","minimal","dark"],
    content: `# DESIGN.md — Frosted Glass
Mood: airy, layered, premium software depth.
Colors: --bg-a:#0f1226, --bg-b:#2a1a52 (deep gradient page bg), --glass:rgba(255,255,255,0.08), --glass-line:rgba(255,255,255,0.18), --accent: brand primary, --text:#f4f6ff, --dim:#a9b0d6.
Typography: Headlines "Sora" 700, 64/40/26, tracking -0.01em. Body "Inter" 400 16px --dim. Labels 12px uppercase 0.12em.
Layout: full-bleed mesh gradient background with two soft brand-colored orbs; content lives on translucent frosted panels (backdrop-blur 24px, 1px light top border, 20px radius); stacked layered cards with slight parallax offset; hero card floats above a blurred product shot.
Components: glass cards with inner highlight; pill buttons with subtle glass fill and glowing accent border; navbar is a floating blurred capsule; soft shadows in cool blue.
Never: opaque flat white cards, harsh black borders, more than two background orbs.`,
  },
  {
    id: 'builtin_bento_modular',
    name: "Bento Grid",
    niches: ["saas","tech","product","app","portfolio","agency","hardware","dashboard","modern","minimal"],
    content: `# DESIGN.md — Bento Grid
Mood: organized, feature-rich, Apple-keynote precision.
Colors: --bg:#f5f5f7, --tile:#ffffff, --tile-dark:#1d1d1f, --line:#e3e3e8, --accent: brand primary, --text:#1d1d1f, --dim:#6e6e73.
Typography: Headlines "Onest" 700, 56/36/24, tight tracking. Body "Inter" 400 16px --dim. Numerals oversized for stat tiles.
Layout: strict mixed-size tile grid (2x1, 1x1, 2x2, wide 3x1) with consistent 16px gaps and 24px tile radius; each tile owns one idea — a stat, a mini chart, an icon, a screenshot, a quote; alternate light and dark tiles for rhythm; hero is one wide feature tile.
Components: rounded tiles with tiny 1px border and whisper shadow; inline mini-charts and badges; icon chips; hover lifts tile 2px.
Never: full-width text paragraphs spanning the page, ragged uneven gaps, heavy ornamentation.`,
  },
  {
    id: 'builtin_swiss_international',
    name: "Swiss Grid",
    niches: ["agency","design","architecture","consulting","publishing","portfolio","editorial","minimal","corporate","bold"],
    content: `# DESIGN.md — Swiss Grid
Mood: rational, precise, timeless International Style.
Colors: --paper:#ffffff, --ink:#111111, --accent:#e2231a (red), map brand primary onto --accent, --grid:#ededed, --dim:#6b6b6b.
Typography: Headlines "Archivo" 700, 72/40/24, tight -0.02em, flush-left. Body "Libre Franklin" 400 16px, generous leading. Labels 11px uppercase 0.1em.
Layout: visible 12-column baseline grid; everything aligns hard-left to grid lines; huge headline top-left, tiny caption bottom-right; thin 1px horizontal rules divide sections; asymmetric whitespace; one red accent used sparingly for emphasis and a single diagonal.
Components: text-only links with red underline on hover; numbered section indices (01 / 02); no decorative icons; images cropped to strict grid modules.
Never: centered symmetric layouts, decorative gradients, more than one accent color.`,
  },
  {
    id: 'builtin_editorial_magazine',
    name: "Editorial Magazine",
    niches: ["media","publishing","fashion","blog","journalism","lifestyle","culture","editorial","luxury","creative"],
    content: `# DESIGN.md — Editorial Magazine
Mood: literary, tactile, printed-page sophistication.
Colors: --paper:#f7f4ec, --ink:#1a1a1a, --accent: brand primary, --rule:#151515, --dim:#5a544a.
Typography: Masthead "Playfair Display" 900, 96/56/32. Deck "Newsreader" italic 400 22px. Body "Spectral" 400 18px, multi-column, hyphenated. Kicker "Libre Franklin" 11px uppercase 0.14em.
Layout: newspaper masthead with hairline rules above/below; 2-3 column justified body text; oversized drop cap opening each article; pull-quotes set large in the margin; bylines and datelines in small caps; full-bleed lead image with caption in italic.
Components: thin black section rules, running folios, footnote-style small text; images with 1px keyline frame.
Never: sans-only body copy, single-column marketing blocks, rounded playful cards.`,
  },
  {
    id: 'builtin_art_deco_luxe',
    name: "Art Deco Luxe",
    niches: ["hotel","restaurant","jewelry","events","spa","realestate","luxury","elegant","editorial","fashion"],
    content: `# DESIGN.md — Art Deco Luxe
Mood: opulent, symmetrical, 1920s Gatsby grandeur.
Colors: --noir:#0e0e10 (page bg), --emerald:#0d3b32, --gold:#c9a24b, map brand primary onto --gold, --cream:#efe7d3 (text), --dim:#9a927f.
Typography: Headlines "Cormorant Garamond" 600, 80/48/28, wide tracking 0.04em. Body "Spectral" 400 17px --cream. Labels "Cormorant Garamond" small caps 13px 0.2em.
Layout: strictly centered symmetric composition; thin gold linework frames and geometric fan/sunburst motifs at section tops; vertical gold hairline dividers; deep dark backgrounds with gold ornament; stepped chevron borders.
Components: gold 1px bordered buttons with letterspaced caps; symmetric two-column feature blocks; geometric divider ornaments between sections; gold-on-black stat plaques.
Never: asymmetric grunge layouts, neon colors, sans-serif display headlines.`,
  },
  {
    id: 'builtin_retro_vaporwave',
    name: "Retro Futurism",
    niches: ["music","gaming","nft","creative","entertainment","events","tech","playful","bold","dark"],
    content: `# DESIGN.md — Retro Futurism
Mood: 80s neon, chrome, sunset-grid nostalgia.
Colors: --night:#160b2e (page bg), --grid:#ff2e97, --cyan:#00e5ff, --accent: brand primary, --sun-a:#ff6ec7, --sun-b:#feca57, --text:#f5e9ff.
Typography: Headlines "Unbounded" 700, 76/46/28, wide tracking, chrome-gradient fill. Body "Sora" 400 16px --text. Labels "JetBrains Mono" 12px uppercase.
Layout: dark purple sky with a glowing perspective grid horizon and a gradient sun; neon magenta-to-cyan gradient headlines; chrome/metallic text treatment on hero; scanline overlay; retro badges and starbursts.
Components: glowing outlined buttons (magenta glow), gradient stroke borders, chrome pill nav, VHS-style corner marks; neon divider lines.
Never: muted corporate neutrals, flat matte-only surfaces, serif body text.`,
  },
  {
    id: 'builtin_cyberpunk_terminal',
    name: "Terminal Cyberpunk",
    niches: ["tech","security","web3","devtools","gaming","crypto","ai","dark","bold","developer"],
    content: `# DESIGN.md — Terminal Cyberpunk
Mood: hacker-console, high-signal, dystopian precision.
Colors: --black:#050807, --panel:#0a0f0d, --acid:#39ff14, map brand primary onto --acid, --amber:#ffb000, --line:#12331f, --text:#c8ffd6, --dim:#4f7a5c.
Typography: Headlines "JetBrains Mono" 700, 60/38/24, uppercase, tight. Body "IBM Plex Mono" 400 15px --text. Everything monospace.
Layout: black terminal canvas with faint scanline texture; content in bordered ASCII-style boxes with corner brackets; blinking cursor accents; command-prompt prefixes (> $) before headings; acid-green glow on key text; data rendered as tables/logs.
Components: outlined buttons that render like [ RUN ]; glitch hover states; status chips (green/amber); 1px acid borders with soft outer glow; typewriter reveal feel.
Never: soft pastel gradients, rounded friendly bubbles, proportional serif body fonts.`,
  },
  {
    id: 'builtin_claymorphism_soft',
    name: "Soft Clay",
    niches: ["kids","education","app","health","wellness","fintech","saas","playful","friendly","modern"],
    content: `# DESIGN.md — Soft Clay
Mood: puffy, friendly, tactile 3D softness.
Colors: --bg:#eef0fb, --clay:#f7f8ff, --accent: brand primary, --pink:#ffb3c7, --mint:#b8f2d8, --lav:#c9c0ff, --text:#3a3a52, --dim:#8a89a6.
Typography: Headlines "Baloo 2" 700, 58/36/24, rounded. Body "Nunito" 400 17px --text. Labels "Nunito" 700 13px.
Layout: pastel canvas; every element is a soft rounded blob (28-40px radius) with dual shadow — light inner highlight top-left + soft colored drop bottom-right — for a squishy 3D clay look; big rounded icons; generous padding; gentle floating shapes.
Components: puffy pill buttons that press inward on click; clay cards with inset+outset shadows; rounded toggle chips; chunky friendly icons in circles.
Never: sharp corners, thin hairline borders, dark high-contrast backgrounds.`,
  },
  {
    id: 'builtin_kinetic_display_type',
    name: "Kinetic Type",
    niches: ["agency","fashion","music","portfolio","creative","events","art","bold","editorial","dark"],
    content: `# DESIGN.md — Kinetic Type
Mood: expressive, cinematic, type-as-architecture.
Colors: --bg:#0a0a0a, --paper:#f2f0ea (alternating), --accent: brand primary, --ink:#0a0a0a, --dim:#7a7a74.
Typography: Display "Anton" 400, monumental 180/120/64 clamp sizes, uppercase, tracking -0.03em, lines set edge-to-edge. Secondary "Bricolage Grotesque" 600. Body "Familjen Grotesk" 400 16px.
Layout: the type IS the layout — colossal headlines fill the viewport, wrap intentionally, and bleed off both edges; words stacked in tight leading; alternating black/paper sections; a single accent word per screen; minimal supporting copy tucked in a corner; implied motion via scale jumps.
Components: marquee scrolling word strips; oversized index numbers; underline-sweep links; almost no boxes — dividers are giant words.
Never: small timid headlines, busy multi-card grids, decorative illustration clutter.`,
  },
  {
    id: 'builtin_maximalist_eclectic',
    name: "Maximalist Pop",
    niches: ["fashion","music","events","creative","retail","food","entertainment","playful","bold","maximalist"],
    content: `# DESIGN.md — Maximalist Pop
Mood: exuberant, clashing, more-is-more collage.
Colors: --canvas:#fff0d9, --accent: brand primary, --hot:#ff2d6b, --violet:#7b2ff7, --teal:#00c2a8, --sun:#ffd23f, --ink:#1a1421. Colors clash on purpose.
Typography: Headlines mix "Bricolage Grotesque" 800 + italic "DM Serif Display" for contrast, 72/44/26. Body "Hanken Grotesk" 500 16px. Loud oversized quotes.
Layout: dense layered collage; overlapping shapes, stickers, arrows and squiggles; sections each in a different bold background color; rotated elements; mixed type sizes crammed with energy; patterned fills (dots, stripes) behind blocks.
Components: sticker badges, hand-drawn arrows, patterned dividers, multi-color buttons; cutout-photo treatment; confetti accents.
Never: monochrome restraint, single-font timidity, vast empty whitespace.`,
  },
  {
    id: 'builtin_organic_earthen',
    name: "Organic Earth",
    niches: ["ceramics","skincare","food","artisan","yoga","wellness","sustainability","organic","calm","handmade"],
    content: `# DESIGN.md — Organic Earth
Mood: warm, tactile, hand-thrown and natural.
Colors: --clay:#e7ddcc (page bg), --terra:#b5623c, --olive:#6d7355, --accent: brand primary, --ink:#2e2a24, --dim:#7d7466, --cream:#f4efe4.
Typography: Headlines "Fraunces" 500 (soft optical), 66/40/26, gentle. Body "Spectral" 400 17px --ink. Labels "Fraunces" italic 14px.
Layout: soft blobby organic shapes as section dividers and image masks (irregular rounded, not circles); warm earthy palette; lots of breathing room; overlapping hand-torn paper edges; imperfect asymmetry; grain/paper texture overlay.
Components: pill buttons with organic squish; images masked into fluid blob shapes; wavy section separators; muted watercolor accents.
Never: hard geometric grids, cold blue tech palettes, glossy synthetic gradients.`,
  },
  {
    id: 'builtin_gradient_mesh_tech',
    name: "Mesh Modern",
    niches: ["ai","saas","fintech","startup","product","tech","cloud","modern","minimal","airy"],
    content: `# DESIGN.md — Mesh Modern
Mood: soft, futuristic, calm high-tech optimism.
Colors: --bg:#fbfcff, --mesh-a:#c6d4ff, --mesh-b:#ffd6ec, --mesh-c:#d3f8ee, --accent: brand primary, --ink:#141726, --dim:#6a6f85.
Typography: Headlines "Schibsted Grotesk" 700, 62/40/26, tracking -0.015em. Body "Inter" 400 16px --dim. Labels 12px uppercase 0.1em.
Layout: bright white base with a huge soft multi-color gradient mesh blooming behind the hero; airy generous spacing; content on crisp white cards with faint shadow; subtle noise over the mesh; rounded 20px corners; centered hero with a single gradient CTA.
Components: gradient-fill primary button; soft glassy secondary buttons; pill badges with light gradient borders; abstract 3D blob renders.
Never: harsh flat primary blocks, heavy black borders, cluttered dense grids.`,
  },
  {
    id: 'builtin_y2k_frutiger_aero',
    name: "Frutiger Aero",
    niches: ["tech","app","kids","gaming","consumer","eco","gadgets","playful","glossy","modern"],
    content: `# DESIGN.md — Frutiger Aero
Mood: glossy, optimistic, early-2000s aqua sheen.
Colors: --sky:#dff3ff (page bg), --aqua:#22b3e6, --green:#7ed957, --accent: brand primary, --gloss:#ffffff, --ink:#123043, --dim:#5b7a8c.
Typography: Headlines "Onest" 700, 58/38/24, friendly. Body "Hanken Grotesk" 400 16px --ink. Labels 12px.
Layout: bright sky-blue gradient backgrounds evoking water and glass; glossy bubble buttons with top highlight and reflection; rounded 24px panels with subtle inner glow; nature-tech imagery (water droplets, leaves, clean surfaces); shiny badges and orbs.
Components: aqua glass buttons with white gloss highlight; reflective card tops; bubble icons; smooth candy-gradient bars.
Never: matte flat brutalist blocks, dark grungy palettes, sharp cornerless slabs.`,
  },
  {
    id: 'builtin_memphis_geometric',
    name: "Memphis Play",
    niches: ["kids","education","events","creative","retail","food","startup","playful","bold","geometric"],
    content: `# DESIGN.md — Memphis Play
Mood: 80s Memphis-Milano, geometric and joyful.
Colors: --paper:#fffdf5, --accent: brand primary, --red:#ff5252, --blue:#2d7dff, --yellow:#ffd400, --teal:#00c2b8, --ink:#161616.
Typography: Headlines "Bricolage Grotesque" 800, 66/40/26. Body "Hanken Grotesk" 500 16px --ink. Labels 12px uppercase.
Layout: light canvas scattered with primary-color geometric confetti — squiggles, zigzags, dots, triangles, half-circles; playful asymmetric placement of shapes behind and around content; bold flat color blocks; grid-of-triangles and terrazzo patterns.
Components: flat buttons with a small offset shape accent; badges as geometric tags; dividers made of repeating shapes; squiggle underlines.
Never: photorealistic gradients, muted single-tone palettes, serif elegance.`,
  },
  {
    id: 'builtin_quiet_couture',
    name: "Quiet Couture",
    niches: ["fashion","luxury","beauty","jewelry","architecture","design","hotel","minimal","elegant","editorial"],
    content: `# DESIGN.md — Quiet Couture
Mood: whispered luxury, vast restraint, couture minimalism.
Colors: --paper:#f6f5f3, --ink:#1b1b1b, --accent: brand primary (used once), --hair:#d8d6d1, --dim:#8f8c86.
Typography: Headlines "Cormorant Garamond" 400, 52/34/22, wide tracking 0.06em, very thin weight. Body "Libre Franklin" 300 14px, letterspaced. Labels 10px uppercase 0.22em.
Layout: extreme whitespace — content occupies maybe 40% of the screen; tiny centered type floating in emptiness; a single 1px hairline as the only divider; huge margins; one editorial image per section, framed generously; slow, minimal.
Components: text links with a thin underline; ghost buttons (1px border, letterspaced caps); no shadows, no fills; a single hairline separates all.
Never: bold heavy fonts, busy multi-card grids, saturated color fields.`,
  },
  {
    id: 'builtin_dark_saas_precise',
    name: "Dark SaaS",
    niches: ["saas","devtools","ai","fintech","analytics","cloud","b2b","dark","modern","premium"],
    content: `# DESIGN.md — Dark SaaS
Mood: precise, engineered, premium developer-grade.
Colors: --bg:#0b0c0f, --panel:#111318, --line:#1e222b, --accent: brand primary, --glow: brand primary at 30%, --text:#eceef3, --dim:#8b90a0.
Typography: Headlines "Sora" 600, 58/38/24, tracking -0.02em. Body "Inter" 400 16px --dim. Code/labels "JetBrains Mono" 12px.
Layout: near-black canvas with subtle dotted-grid background; crisp 1px-bordered panels with 12px radius; a faint accent glow behind the hero product screenshot; feature rows with mono micro-labels; precise 8px spacing system; syntax-highlighted code block hero.
Components: subtle-glow primary button; ghost secondary with 1px border; status pills; gradient-underline nav on hover; fine gridlines in data tables.
Never: pure white sections, playful rounded blobs, more than one glow hue.`,
  },
  {
    id: 'builtin_scandi_muji_calm',
    name: "Scandi Calm",
    niches: ["home","furniture","lifestyle","wellness","stationery","skincare","cafe","calm","minimal","natural"],
    content: `# DESIGN.md — Scandi Calm
Mood: warm, restrained, muji-quiet functionalism.
Colors: --offwhite:#f4f2ec, --sand:#e6e0d4, --accent: brand primary (soft), --ink:#33302a, --dim:#8b8578, --soft:#c9c2b3.
Typography: Headlines "Onest" 500, 48/32/22, calm and light. Body "Hanken Grotesk" 400 16px --ink, roomy leading. Labels 11px uppercase 0.12em --dim.
Layout: warm off-white canvas; simple, honest grid with lots of quiet whitespace; soft natural-light product photography with matching beige backgrounds; gentle 8px radius; understated; horizontal thin dividers in --soft.
Components: minimal outline buttons, muted tag chips, calm two-column feature rows; no shadows or a single very soft one; matte surfaces.
Never: saturated neon accents, glossy gradients, dense cluttered layouts.`,
  },
  {
    id: 'builtin_corporate_fintrust',
    name: "Corporate Trust",
    niches: ["fintech","insurance","banking","legal","consulting","healthcare","b2b","corporate","professional","clean"],
    content: `# DESIGN.md — Corporate Trust
Mood: trustworthy, crisp, institutional confidence.
Colors: --bg:#ffffff, --wash:#f3f6fb, --navy:#0b2545, --accent: brand primary, --blue:#1665d8, --ink:#1a2233, --dim:#5b6472, --line:#e3e8f0.
Typography: Headlines "Libre Franklin" 700, 56/36/24, tight -0.01em. Body "Inter" 400 16px --ink. Labels 12px uppercase 0.08em.
Layout: clean white with pale blue wash sections; structured 12-column grid; navy headlines, blue accents; trust markers row (logos, compliance badges, stats); clear card hierarchy with 1px borders and 12px radius; ample but efficient spacing.
Components: solid accent primary button, outlined secondary; subtle shadow cards; stat blocks with big numerals; checkmark feature lists; logo strip; footer with organized link columns.
Never: experimental grunge layouts, neon or pastel-only palettes, hand-drawn playful elements.`,
  },
  {
    id: 'builtin_broadsheet_press',
    name: "Broadsheet Press",
    niches: ["news","publishing","politics","research","nonprofit","academia","journalism","editorial","authoritative","serif"],
    content: `# DESIGN.md — Broadsheet Press
Mood: authoritative, dense, newspaper of record.
Colors: --newsprint:#f7f5ef, --ink:#111111, --accent: brand primary (used for section tags), --rule:#000000, --dim:#4a4a4a.
Typography: Nameplate "Playfair Display" 900, 88/52/30. Headlines "Newsreader" 700, 34/26. Body "Spectral" 400 16px, tight leading, justified. Dateline "Libre Franklin" 11px uppercase.
Layout: newspaper nameplate with double-rule border and date/edition line; multi-column text with vertical column rules; dense grid of headlines with kickers; small caps bylines; thin black hairlines everywhere; image with cutline caption; classified-style dense blocks.
Components: section flags in small caps, continuation cues, folio numbers; no rounded corners, no shadows; strictly typographic hierarchy.
Never: sans-serif body text, glossy cards, generous marketing whitespace.`,
  },
  {
    id: 'builtin_botanical_farm',
    name: "Botanical Table",
    niches: ["restaurant","farm","cafe","florist","winery","catering","organic","natural","elegant","food"],
    content: `# DESIGN.md — Botanical Table
Mood: fresh, seasonal, farm-to-table elegance.
Colors: --cream:#f6f3e7, --sage:#7c8a6a, --forest:#2f4230, --accent: brand primary, --ink:#26261f, --dim:#6c7161, --blush:#e4c9b6.
Typography: Headlines "Fraunces" 500 italic option, 64/40/26, warm. Body "Spectral" 400 17px --ink. Labels "Fraunces" small caps 13px 0.14em.
Layout: cream canvas with delicate line-drawn botanical illustrations (leaves, sprigs) framing sections and margins; sage and forest greens; elegant serif headlines; menu-style two-column lists with dotted leaders; generous airy spacing; pressed-flower motifs.
Components: thin botanical divider illustrations; serif ghost buttons with letterspaced caps; menu rows with dot leaders and prices; framed food photography.
Never: neon tech palettes, chunky sans display, industrial hard-edge grids.`,
  },
  {
    id: 'builtin_gradient_startup',
    name: "Vivid Gradient",
    niches: ["startup","app","saas","crypto","social","consumer","tech","bold","energetic","modern"],
    content: `# DESIGN.md — Vivid Gradient
Mood: energetic, optimistic, scroll-stopping duotone.
Colors: --grad-a:#6a11cb, --grad-b:#ff5f9e, --accent: brand primary, --bg:#ffffff, --ink:#12111a, --dim:#6a6675, --soft:#f4f0fb.
Typography: Headlines "Sora" 700, 66/42/26, tracking -0.02em. Body "Hanken Grotesk" 400 16px --dim. Labels 12px uppercase 0.1em.
Layout: bold full-width duotone gradient hero (brand color to a vivid partner hue) with white headline; rounded 24px cards on white below; gradient-filled CTAs and icon chips; playful floating 3D shapes; big rounded feature blocks alternating gradient and white.
Components: gradient primary buttons with soft colored shadow; pill badges; gradient-stroke icon tiles; rounded testimonial cards; gradient progress bars.
Never: flat gray corporate palettes, sharp brutalist edges, serif-heavy body text.`,
  },
  {
    id: 'builtin_concrete_architectural',
    name: "Concrete Brut",
    niches: ["architecture","construction","design","furniture","gallery","studio","realestate","brutalist","minimal","bold"],
    content: `# DESIGN.md — Concrete Brut
Mood: raw, monumental, refined-brutalist architecture.
Colors: --concrete:#d7d4cf (page bg), --slate:#3a3a38, --charcoal:#1c1c1a, --accent: brand primary (single hit), --ink:#141412, --dim:#77746e.
Typography: Headlines "Big Shoulders Display" 800, 100/56/30, condensed, uppercase, tight tracking. Body "Familjen Grotesk" 400 16px --slate. Labels "IBM Plex Mono" 11px uppercase.
Layout: raw concrete-gray canvas with subtle poured-texture; enormous condensed headlines set against wide margins; heavy horizontal slab dividers; full-bleed architectural photography in cool grayscale; strict modular blocks; large void spacing; one accent stripe only.
Components: sharp-cornered flat blocks; thin mono captions bottom-aligned; oversized index numerals; no radius, no soft shadow; hairline grid overlay.
Never: rounded friendly cards, pastel color washes, decorative gradients.`,
  },
  {
    id: 'builtin_festival_poster',
    name: "Festival Poster",
    niches: ["events","music","festival","nightlife","sports","entertainment","conference","bold","energetic","maximalist"],
    content: `# DESIGN.md — Festival Poster
Mood: high-voltage, layered, gig-poster motion.
Colors: --bg:#120a24, --accent: brand primary, --hot:#ff3d5a, --acid:#e6ff3d, --cyan:#25f4ee, --ink:#0a0612, --paper:#fdf7e3.
Typography: Headlines "Anton" 400 + "Unbounded" 800 mixed, colossal 150/90/48, uppercase, arched/stacked, tight -0.03em. Body "Space Grotesk" 500 16px. Labels mono 12px.
Layout: dense poster composition — giant stacked headline lockups filling the frame, layered over duotone photography and burst shapes; diagonal energy, tilted lineup lists, ticket-stub blocks; high-contrast neon on dark; overlapping type with drop-shadow and outline strokes; implied motion via skew and repetition.
Components: outlined/stroked display type, starburst badges, ticket-tear dividers, lineup grids, neon CTA buttons with hard shadow; date/venue slabs.
Never: calm minimal whitespace, single-column corporate restraint, muted monochrome palettes.`,
  },
]

// Refero styles now carry all four formats on disk (presets/styles/{key}/:
// design.md, tokens.json, css-vars.css, tailwind.config.snippet.js). The
// compact cssVars string is appended to the prompt-facing content so the
// builder synthesizes in the style's SPIRIT but with its EXACT token values.
const referoWithTokens = referoStyles.map(s => s.cssVars
  ? { ...s, content: `${s.content}\n\nEXACT DESIGN TOKENS (verbatim values from this system — use these for accuracy when this style leads a decision):\n${s.cssVars}` }
  : s)

export const BUILT_IN_STYLES = [...referoWithTokens, ...HANDWRITTEN_STYLES]

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

// Creative mixer — variance by design. Instead of deterministically taking the
// same top-3 for a niche (which converged five runs onto one look), it:
//   1. anchors on ONE strong niche match (kept deterministic — appropriateness),
//   2. builds a candidate POOL of the top ~12 by combined niche+vibe score,
//   3. SAMPLES the remaining 3 slots from that pool at random (fresh every run),
//   4. rejects any combination used in the recent-history avoid list.
// Result: 4 systems to synthesize across, different on every run of the same site.
export function pickCreativeMix(styles, industryText, vibeText, n = 4, avoidMixes = []) {
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
  const byNiche = [...scored].sort((a, b) => b.nicheScore - a.nicheScore || b.vibeScore - a.vibeScore)
  const byTotal = [...scored].sort((a, b) => b.total - a.total)

  const anchor = byNiche[0]?.nicheScore > 0 ? byNiche[0].style : (byTotal[0]?.style || styles[0])
  if (!anchor) return []

  // Candidate pool: top 12 by combined score (excluding the anchor), padded with
  // next-best entries so thin niches still get a full pool.
  const pool = byTotal.map(x => x.style).filter(s => s !== anchor).slice(0, 14)

  const sig = arr => arr.map(s => s.id).sort().join('+')
  const sample = () => {
    const bag = [...pool]
    const picks = [anchor]
    while (picks.length < n && bag.length) {
      // Weighted toward the front of the pool but genuinely random.
      const idx = Math.floor(Math.pow(Math.random(), 1.6) * bag.length)
      picks.push(bag.splice(idx, 1)[0])
    }
    return picks
  }

  // Up to 6 draws to find a combination not used recently.
  let out = sample()
  for (let tries = 0; tries < 6 && avoidMixes.includes(sig(out)); tries++) out = sample()
  return out
}

export function findBuiltIn(id) {
  return BUILT_IN_STYLES.find(s => s.id === id) || null
}
