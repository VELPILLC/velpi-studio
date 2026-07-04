import manifest from '../presets/motion/manifest.json'

// Signature-motion selection pass. Separate from layout/style presets: every
// site gets EXACTLY ONE signature background/motion treatment, matched to the
// niche's natural intensity (law firm → subtle, streetwear → bold) and nudged
// by the creator's vibe picks. Deterministic-but-varied: the business name
// seeds rotation among the top matches so two same-niche businesses differ.

const SUBTLE_NICHES = ['law', 'attorney', 'legal', 'finance', 'accounting', 'insurance', 'medical', 'dental', 'clinic', 'funeral', 'therapy', 'counseling', 'consulting']
const BOLD_NICHES = ['gym', 'fitness', 'crossfit', 'tattoo', 'barber', 'streetwear', 'nightlife', 'music', 'brewery', 'esports', 'martial arts']

const ORDER = ['subtle', 'medium', 'bold']

export function targetIntensity(industryText, vibeText) {
  const t = (industryText || '').toLowerCase()
  const v = (vibeText || '').toLowerCase()
  let level = 1 // medium default
  if (SUBTLE_NICHES.some(n => t.includes(n))) level = 0
  if (BOLD_NICHES.some(n => t.includes(n))) level = 2
  // Vibe nudges — the creator's picks can push one step either way.
  if (/bold & high-energy|dark & moody|exciting/.test(v)) level = Math.min(2, level + 1)
  if (/minimal & modern|calm|luxurious & refined/.test(v)) level = Math.max(0, level - 1)
  return ORDER[level]
}

function hashStr(s) {
  let h = 0
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function pickSignatureMotion(analysis, vibeText, avoidIds = []) {
  // avoidIds: motion ids used in recent generations — forced variation so the
  // same effect doesn't headline five sites in a row.
  let presets = (manifest.presets || []).filter(p => p.snippet)
  if (!presets.length) return null
  const fresh = presets.filter(p => !avoidIds.includes(p.id))
  if (fresh.length >= 3) presets = fresh
  const industryText = `${analysis?.industry || ''} ${analysis?.niche || ''} ${analysis?.primary_service || ''}`.toLowerCase()
  const want = targetIntensity(industryText, vibeText)
  const wantIdx = ORDER.indexOf(want)

  const scored = presets.map(p => {
    let score = 0
    // Signature treatment should usually be a background; others still eligible.
    if (p.effect === 'background') score += 3
    const gap = Math.abs(ORDER.indexOf(p.intensity || 'medium') - wantIdx)
    score += gap === 0 ? 4 : gap === 1 ? 1 : -3
    for (const n of p.niches || []) {
      if (n && industryText.includes(String(n).toLowerCase())) score += 3
    }
    if (p.dependency === 'css-only') score += 1 // ports cleanest into no-JS output
    return { p, score }
  }).sort((a, b) => b.score - a.score)

  // Sample from the top 6 (not always #1) so same-niche businesses — and even
  // re-runs of the same business — get different signature effects.
  const top = scored.slice(0, 6).filter(x => x.score > 0)
  if (!top.length) return scored[0]?.p || null
  const idx = Math.floor(Math.pow(Math.random(), 1.5) * top.length)
  return top[Math.min(idx, top.length - 1)].p
}
