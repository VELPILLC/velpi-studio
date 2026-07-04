import manifest from '../presets/sections/manifest.json'

// Section/layout reference pass: for each build, pick a handful of harvested
// structural patterns (hero, pricing, testimonials, footer…) that match the
// page's persuasion flow. They're handed to the builder as REFERENCES to study
// and re-express in its own scoped CSS — never copied verbatim (the originals
// are Tailwind/React; the output is plain scoped CSS).

const SECTION_TO_CATEGORY = {
  hero: 'hero',
  services: 'features',
  menu: 'pricing',
  pricing: 'pricing',
  reviews: 'testimonials',
  testimonials: 'testimonials',
  about: 'features',
  gallery: 'card',
  stats: 'stats',
  credentials: 'stats',
  hours: 'footer',
  contact: 'cta',
  faq: 'faq',
  footer: 'footer',
}

export function pickSectionReferences(analysis, n = 4) {
  const entries = (manifest.sections || []).filter(s => s.reference)
  if (!entries.length) return []

  const flow = analysis?.layout?.section_order || analysis?.sections || []
  const industryText = `${analysis?.industry || ''} ${analysis?.niche || ''}`.toLowerCase()

  const wantedCategories = [...new Set(flow.map(sec => SECTION_TO_CATEGORY[String(sec).toLowerCase()] || null).filter(Boolean))]

  const picked = []
  for (const cat of wantedCategories) {
    if (picked.length >= n) break
    const candidates = entries
      .filter(e => e.category === cat && !picked.includes(e))
      .map(e => {
        let score = 1
        for (const niche of e.niches || []) {
          if (niche && industryText.includes(String(niche).toLowerCase())) score += 2
        }
        return { e, score }
      })
      .sort((a, b) => b.score - a.score)
    if (candidates[0]) picked.push(candidates[0].e)
  }
  return picked.slice(0, n)
}
