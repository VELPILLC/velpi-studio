// Rebuilds lib/referoStyles.json from lib/refero/*.md.
// Curated entries keep hand-written names/niches; bulk-harvested files get
// their name from the md title and niches from the map below.
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'lib', 'refero')

const curated = [
  { file: 'salon-glossgenius.md', id: 'refero_salon_glossgenius', name: 'All-In-One Salon — GlossGenius', niches: ['salon', 'beauty', 'hair', 'nails', 'lashes', 'barber', 'medspa', 'spa', 'aesthetics'] },
  { file: 'restaurant-amrit-palace.md', id: 'refero_amrit_palace', name: 'Amrit Palace — Candlelit Fine Dining', niches: ['restaurant', 'fine dining', 'bar', 'winery', 'hospitality', 'catering'] },
  { file: 'food-sweetgreen.md', id: 'refero_sweetgreen', name: 'sweetgreen — Farm-Stand Fresh', niches: ['restaurant', 'cafe', 'fast casual', 'juice', 'food', 'healthy', 'bakery'] },
  { file: 'fitness-whoop.md', id: 'refero_whoop', name: 'WHOOP — Midnight Performance Lab', niches: ['gym', 'fitness', 'crossfit', 'training', 'sports', 'martial arts', 'boxing'] },
  { file: 'medical-ease-health.md', id: 'refero_ease_health', name: 'Ease Health — Sunlit Clinic', niches: ['medical', 'dental', 'dentist', 'clinic', 'doctor', 'chiropractic', 'therapy', 'veterinary'] },
  { file: 'law-legora.md', id: 'refero_legora', name: 'Legora — Editorial Law Journal', niches: ['law', 'attorney', 'legal', 'accounting', 'finance', 'consulting'] },
  { file: 'realestate-aspelin-reitan.md', id: 'refero_aspelin_reitan', name: 'Aspelin Reitan — Architectural Archive', niches: ['real estate', 'realtor', 'property', 'architecture', 'development', 'interior design'] },
  { file: 'coffee-assembly.md', id: 'refero_assembly_coffee', name: 'Assembly Coffee — Dark Roastery', niches: ['coffee', 'cafe', 'roastery', 'bakery', 'bar'] },
]

const bulk = {
  'refero--architecture--mostlikely.md': ['architecture', 'design studio', 'construction'],
  'refero--auto--aurora.md': ['auto', 'automotive', 'transport', 'tech'],
  'refero--bank--the-online-bank.md': ['bank', 'banking', 'finance', 'fintech'],
  'refero--barber--dollar-shave-club.md': ['barber', 'grooming', 'mens', 'shave'],
  'refero--boutique--glein.md': ['boutique', 'fashion', 'retail', 'clothing'],
  'refero--brewery--foundry.md': ['brewery', 'taproom', 'industrial', 'bar'],
  'refero--burger--home-page-impossible-foods.md': ['burger', 'restaurant', 'fast casual', 'food brand'],
  'refero--cocktail-bar--ghia.md': ['cocktail', 'bar', 'nightlife', 'beverage', 'aperitif'],
  'refero--creative-agency--sick-agency.md': ['agency', 'creative', 'marketing', 'studio'],
  'refero--education--udemy.md': ['education', 'courses', 'tutoring', 'school'],
  'refero--florist--daniela-and-moe-wedding-2019.md': ['florist', 'wedding', 'flowers', 'events'],
  'refero--hotel--belarosa-chalet.md': ['hotel', 'bnb', 'resort', 'chalet', 'vacation rental', 'travel'],
  'refero--insurance--boostinsurance.md': ['insurance', 'finance', 'coverage'],
  'refero--jewelry--ino.md': ['jewelry', 'luxury', 'accessories', 'boutique'],
  'refero--kids--playdate.md': ['kids', 'childcare', 'daycare', 'play', 'family'],
  'refero--landscaping--chester-s-garden.md': ['landscaping', 'garden', 'outdoor', 'lawn'],
  'refero--luxury-fashion--lunch.md': ['fashion', 'luxury', 'retail', 'apparel'],
  'refero--minimal-portfolio--ryan-stephen.md': ['portfolio', 'personal', 'minimal', 'freelancer'],
  'refero--motorcycle--cowboy.md': ['motorcycle', 'bike', 'ebike', 'auto'],
  'refero--museum--twomuch-studio.md': ['museum', 'culture', 'gallery', 'creative'],
  'refero--music-venue--eventbrite.md': ['events', 'tickets', 'venue', 'entertainment'],
  'refero--pets--finn.md': ['pets', 'pet care', 'grooming', 'dog', 'cat'],
  'refero--photography--sigmaphoto.md': ['photography', 'camera', 'photographer', 'visual'],
  'refero--pizza--roberta-s-pizza.md': ['pizza', 'restaurant', 'fast casual', 'italian'],
  'refero--premium-editorial--portal.md': ['premium', 'editorial', 'luxury', 'magazine'],
  'refero--steakhouse--houseplant.md': ['retail', 'lifestyle', 'home goods', 'cannabis'],
  'refero--sushi--lim-n.md': ['restaurant', 'brasserie', 'casual dining', 'mexican'],
  'refero--tattoo--butt-studio.md': ['tattoo', 'studio', 'creative', 'bold'],
  'refero--wedding--cup-of-couple.md': ['wedding', 'events', 'couple', 'celebration'],
  'refero--wellness--function.md': ['wellness', 'health', 'longevity', 'lab'],
}

const out = []
for (const m of curated) {
  out.push({ id: m.id, name: m.name, niches: m.niches, content: fs.readFileSync(path.join(DIR, m.file), 'utf8') })
}
for (const [file, niches] of Object.entries(bulk)) {
  const p = path.join(DIR, file)
  if (!fs.existsSync(p)) { console.log('missing, skipped:', file); continue }
  const content = fs.readFileSync(p, 'utf8')
  const first = content.split('\n')[0].replace(/^#\s*/, '').replace(/\s*—\s*Style Reference\s*$/i, '').trim()
  const id = 'refero_' + file.replace(/^refero--/, '').replace(/\.md$/, '').replace(/[^a-z0-9]+/g, '_')
  const label = niches[0][0].toUpperCase() + niches[0].slice(1)
  out.push({ id, name: `${first} — ${label}`, niches, content })
}

const dest = path.join(ROOT, 'lib', 'referoStyles.json')
fs.writeFileSync(dest, JSON.stringify(out, null, 2))
console.log('total refero styles:', out.length, '| size:', Math.round(fs.statSync(dest).size / 1024), 'KB')
