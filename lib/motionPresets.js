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

// Shared scoring: niche fit + how close the preset's intensity sits to what
// this industry wants + how cleanly it ports into the no-JS output.
function scoreMotionPresets(presets, analysis, vibeText) {
  const industryText = `${analysis?.industry || ''} ${analysis?.niche || ''} ${analysis?.primary_service || ''}`.toLowerCase()
  const wantIdx = ORDER.indexOf(targetIntensity(industryText, vibeText))
  return presets.map(p => {
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
}

// The best-fitting presets, for offering a real choice in guided mode instead
// of letting a hash decide. Same scoring the automatic pick uses.
export function rankMotionPresets(analysis, vibeText, n = 4) {
  const presets = (manifest.presets || []).filter(p => p.snippet)
  return scoreMotionPresets(presets, analysis, vibeText).slice(0, n).map(x => x.p)
}

export function pickSignatureMotion(analysis, vibeText, avoidIds = [], rng = null, lockedId = null) {
  // lockedId: a structure lock pinned this exact preset on a previous run of
  // the same input — honor it verbatim so regeneration keeps the skeleton.
  // rng: injected seeded PRNG (deterministic per-domain); falls back to
  // Math.random for legacy callers. avoidIds: legacy anti-repetition list.
  let presets = (manifest.presets || []).filter(p => p.snippet)
  if (!presets.length) return null
  if (lockedId) {
    const locked = presets.find(p => p.id === lockedId)
    if (locked) return locked
  }
  const fresh = presets.filter(p => !avoidIds.includes(p.id))
  if (fresh.length >= 3) presets = fresh
  const scored = scoreMotionPresets(presets, analysis, vibeText)

  // Sample UNIFORMLY from the top 6 (the old front-weighted curve funneled
  // most businesses onto the same one or two effects). With a seeded rng the
  // sample is a pure function of the domain — same business, same pick,
  // every run; different businesses spread across the whole top set.
  const top = scored.slice(0, 6).filter(x => x.score > 0)
  if (!top.length) return scored[0]?.p || null
  const random = rng || Math.random
  const idx = Math.floor(random() * top.length)
  return top[Math.min(idx, top.length - 1)].p
}
