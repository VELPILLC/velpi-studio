// The guided design conversation — turning the decisions the pipeline used
// to make by hash into decisions a human makes with the agent.
//
// Two rules shape everything here:
//
// 1. CANDIDATES ARE REAL. The server builds every option list from actual
//    catalog entries (style systems, vetted palettes, font pairings, section
//    blueprints, motion presets). The model is allowed to write the LABEL and
//    the description — never the id, and never an option that isn't already
//    in the candidate set. An invented option is an option the builder can't
//    execute, and unexecutable direction is precisely how "premium" collapses
//    back into generic.
//
// 2. CANDIDATES ARE NARROWED BY WHAT WE ALREADY KNOW — the niche, the brand
//    read from the logo, and the answers given so far — so the questions get
//    more specific to this one site as the conversation goes.
//
// Nothing here reads the app's own previously generated sites; every source is
// a curated reference library.

import { chooseFamily, rankWithinFamily, neededCategoriesFor } from './sectionFamily.mjs'
import { productTypeFor, palettesFor, rankPalettesByBrand, pairingsFor, reasoningFor } from './designIntel.mjs'
import { rankHeroEffects } from './effectsLibrary.mjs'

export const QUESTION_IDS = ['direction', 'color', 'typography', 'hero', 'depth', 'rhythm', 'imagery', 'proof', 'motion', 'density']

// Treatment vocabularies rather than catalog rows — these describe HOW an
// asset is handled, which no library enumerates. Kept deliberately small so
// each choice is a real fork rather than a shade of the same thing.
const IMAGERY = [
  { id: 'img-full-bleed', hint: 'Full-bleed atmospheric photography, edge to edge, minimal framing' },
  { id: 'img-editorial-crop', hint: 'Tight editorial crops in measured frames, generous surrounding space' },
  { id: 'img-warm-graded', hint: 'Warm color-graded photography tuned to the brand palette' },
  { id: 'img-documentary', hint: 'Natural documentary photography, unstyled, true to the room' },
]
const DENSITY = [
  { id: 'den-airy', hint: 'Editorial and airy — large section padding, long measure, room to breathe' },
  { id: 'den-standard', hint: 'Balanced rhythm — the default premium marketing cadence' },
  { id: 'den-rich', hint: 'Rich and dense — more per screen, tighter rhythm, catalogue energy' },
]

const PROOF_KEYS = ['reviews', 'testimonials', 'stats', 'credentials', 'awards']

function orderVariants(order) {
  const base = (order || []).map(s => String(s).toLowerCase())
  if (!base.length) return []
  const move = (arr, pred, toIdx) => {
    const found = arr.filter(pred)
    if (!found.length) return null
    const rest = arr.filter(x => !found.includes(x))
    const at = Math.min(toIdx, rest.length)
    return [...rest.slice(0, at), ...found, ...rest.slice(at)]
  }
  const out = [{ id: 'rhy-as-planned', order: base, hint: 'The flow the strategy already chose for this business' }]
  const proofFirst = move(base, s => /review|testimonial|trust/.test(s), 1)
  if (proofFirst && proofFirst.join() !== base.join()) {
    out.push({ id: 'rhy-proof-first', order: proofFirst, hint: 'Social proof immediately after the hero, before anything is asked' })
  }
  const offerFirst = move(base, s => /offer|special|pricing|menu/.test(s), 1)
  if (offerFirst && offerFirst.join() !== base.join()) {
    out.push({ id: 'rhy-offer-first', order: offerFirst, hint: 'Lead with the offer — what they get, up front' })
  }
  return out
}

/**
 * Build the full candidate set. Everything the model later sees is derived
 * from this, so anything absent here can never end up in an option.
 */
export function buildCandidateSets({
  analysis = {}, brandColors = [], styles = [], sectionEntries = [],
  motionPresets = [], palettes = [], pairings = [], reasoning = [], answers = {},
} = {}) {
  const industryText = `${analysis.industry || ''} ${analysis.niche || ''}`.toLowerCase()
  const domain = analysis?._source?.domain || analysis.business_name || ''
  const order = analysis?.layout?.section_order || analysis?.sections || []
  // Derived exactly as the builder derives it — otherwise guided mode could
  // offer hero/proof options from a family the build then doesn't commit to.
  const neededCats = neededCategoriesFor(order)

  const { family } = chooseFamily(sectionEntries, { neededCats, industryText, domain })
  const productType = productTypeFor(palettes, analysis.industry, analysis.niche)
  const guide = reasoningFor(reasoning, productType || analysis.industry)

  // The chosen direction colors every later question's mood, which is what
  // makes the conversation narrow as it goes.
  const chosenStyle = styles.find(s => s.id === answers.direction) || null
  const moodWords = [
    analysis.tone, analysis.target_feeling,
    analysis.brand?.brand_personality, analysis.brand?.design_language,
    guide?.typographyMood, chosenStyle?.name,
    ...(analysis.brand_read?.personality || []),
  ].filter(Boolean).join(' ')

  const styleCandidates = styles
    .map(s => {
      const hay = `${s.name || ''} ${(s.niches || []).join(' ')} ${String(s.content || '').slice(0, 400)}`.toLowerCase()
      let score = 0
      for (const t of industryText.split(/\s+/)) if (t.length > 3 && hay.includes(t)) score += 3
      if (guide?.stylePriority) {
        for (const t of String(guide.stylePriority).toLowerCase().split(/[^a-z]+/)) {
          if (t.length > 4 && hay.includes(t)) score += 1
        }
      }
      return { s, score }
    })
    .sort((a, b) => b.score - a.score || (a.s.id < b.s.id ? -1 : 1))
    .slice(0, 5)
    .map(x => ({ id: x.s.id, hint: x.s.name || x.s.id }))

  const palettePool = palettesFor(palettes, productType, { limit: 12 })
  const paletteCandidates = rankPalettesByBrand(palettePool.length ? palettePool : palettes, brandColors, { limit: 4 })
    .map(p => ({ id: p.id, hint: `${p.primary} + ${p.accent} — ${p.notes || p.productType}`, meta: p }))
  // The brand's own colors are always offered, and always first: the point of
  // reading the logo is that using it should be the easy default.
  if (brandColors.length) {
    paletteCandidates.unshift({
      id: 'pal-brand',
      hint: `${brandColors.slice(0, 2).map(c => (typeof c === 'string' ? c : c.hex)).join(' + ')} — straight from your logo`,
      meta: { id: 'pal-brand', fromBrand: true, colors: brandColors },
    })
  }

  const pairingCandidates = pairingsFor(pairings, moodWords, { limit: 4 })
    .map(p => ({ id: p.id, hint: `${p.heading} + ${p.body} — ${p.mood}`, meta: p }))

  const heroCandidates = rankWithinFamily(family?.byCat?.hero || [], { industryText, category: 'hero' })
    .slice(0, 4)
    .map(e => ({ id: e.id, hint: e.summary || e.name || e.id }))

  const proofCats = ['testimonials', 'stats', 'card']
  const proofCandidates = proofCats
    .flatMap(c => rankWithinFamily(family?.byCat?.[c] || [], { industryText, category: c }).slice(0, 2))
    .slice(0, 4)
    .map(e => ({ id: e.id, hint: e.summary || e.name || e.id }))

  const motionCandidates = [
    ...(motionPresets || []).slice(0, 4).map(m => ({ id: m.id, hint: `${m.name} — ${m.summary || m.effect || ''}` })),
    { id: 'motion-none', hint: 'No motion — stillness reads as confidence for this brand' },
  ]

  const rhythmCandidates = orderVariants(order).map(v => ({ id: v.id, hint: v.hint, meta: { order: v.order } }))

  // The advanced/3D hero treatment. The hint carries ONLY the plain register —
  // this is what a human reads when choosing. The technical recipe that
  // actually drives the build is never shown here: the answer travels as a bare
  // id, and effectsLibrary resolves it to full instructions server-side at
  // build time. Someone picking a site for their concrete business should not
  // have to know what a gradient mesh is to choose one.
  const depthCandidates = rankHeroEffects(analysis, 4)
    .map(e => ({ id: e.id, hint: `${e.label} — ${e.summary}`, meta: { bestFor: e.bestFor } }))

  const sets = {
    direction: styleCandidates,
    color: paletteCandidates,
    typography: pairingCandidates,
    hero: heroCandidates,
    depth: depthCandidates,
    rhythm: rhythmCandidates,
    imagery: IMAGERY,
    proof: proofCandidates,
    motion: motionCandidates,
    density: DENSITY,
  }

  // A question with fewer than two real options isn't a choice — drop it
  // rather than showing the user a single button.
  for (const id of Object.keys(sets)) {
    if (!sets[id] || sets[id].length < 2) delete sets[id]
  }
  return { sets, family: family?.id || null, productType, guide }
}

const QUESTION_TEXT = {
  direction: 'Which design direction should this site commit to?',
  color: 'Which palette should the site be built from?',
  typography: 'How should the typography feel?',
  hero: 'How should the hero be composed?',
  depth: 'Should the top of the page have movement behind your headline, and how much?',
  rhythm: 'What order should the page tell its story in?',
  imagery: 'How should the photography be treated?',
  proof: 'How should trust and proof be presented?',
  motion: 'How much motion is right for this brand?',
  density: 'How dense should the page feel?',
}

export function autoLabel(candidates) {
  return (candidates || []).map(c => {
    const hint = String(c.hint || c.id)
    const [head, ...rest] = hint.split('—')
    return {
      id: c.id,
      label: head.trim().slice(0, 46) || c.id,
      desc: (rest.join('—').trim() || hint).slice(0, 120),
      ai: hint,
    }
  })
}

export function fallbackQuestions(sets) {
  return QUESTION_IDS.filter(id => sets[id]).map(id => ({
    id, q: QUESTION_TEXT[id], why: '', options: autoLabel(sets[id]),
  }))
}

/**
 * Sanitize model output against the candidate sets. Ids are only ever taken
 * from the server's own lists; the model contributes wording, nothing else.
 */
export function validateGuided(raw, sets) {
  const byId = {}
  for (const [qid, list] of Object.entries(sets || {})) byId[qid] = new Set(list.map(c => c.id))

  const modelQuestions = Array.isArray(raw?.questions) ? raw.questions : []
  const out = []
  for (const qid of QUESTION_IDS) {
    if (!sets[qid]) continue
    const fromModel = modelQuestions.find(q => q?.id === qid)
    const seen = new Set()
    const options = (Array.isArray(fromModel?.options) ? fromModel.options : [])
      .filter(o => o && byId[qid].has(o.id) && !seen.has(o.id) && seen.add(o.id))
      .map(o => ({
        id: o.id,
        label: String(o.label || '').trim().slice(0, 46) || o.id,
        desc: String(o.desc || '').trim().slice(0, 120),
        ai: String(o.ai || o.desc || '').trim().slice(0, 300),
      }))
    // Anything less than two survivors means the model didn't give us a real
    // choice for this question — use the honest auto-labeled list instead of
    // showing a degraded one.
    out.push(options.length >= 2
      ? { id: qid, q: String(fromModel.q || QUESTION_TEXT[qid]).slice(0, 140), why: String(fromModel.why || '').slice(0, 200), options }
      : { id: qid, q: QUESTION_TEXT[qid], why: '', options: autoLabel(sets[qid]) })
  }
  return out
}

/**
 * Turn answers into the hard inputs the pipeline already understands.
 * Every field here maps onto an existing parameter — styleId onto
 * manualStyleId, sectionOrder onto forcedLayout, motionId onto the lock —
 * so guided mode steers the real pipeline rather than a parallel one.
 */
export function decisionsFromAnswers(answers = {}, built = {}) {
  const sets = built.sets || {}
  const pick = (qid) => (sets[qid] || []).find(c => c.id === answers[qid]) || null

  const color = pick('color')
  const typography = pick('typography')
  const rhythm = pick('rhythm')
  const imagery = pick('imagery')
  const density = pick('density')
  const motion = pick('motion')
  const depth = pick('depth')

  const forcedMap = {}
  if (answers.hero && pick('hero')) forcedMap.hero = answers.hero
  if (answers.proof && pick('proof')) {
    // The proof blueprint's own category decides which section key it locks.
    for (const key of PROOF_KEYS) forcedMap[key] = answers.proof
  }

  const paletteMeta = color?.meta
  const paletteHexes = paletteMeta?.fromBrand
    ? (paletteMeta.colors || []).map(c => (typeof c === 'string' ? c : c.hex))
    : [paletteMeta?.primary, paletteMeta?.accent, paletteMeta?.background, paletteMeta?.foreground].filter(Boolean)

  const directives = {}
  if (paletteHexes.length) directives.palette = `Build from exactly these: ${paletteHexes.join(', ')}${paletteMeta?.notes ? ` (${paletteMeta.notes})` : ''}.`
  if (typography?.meta) directives.typography = `Headings ${typography.meta.heading}, body ${typography.meta.body}. Load with: ${typography.meta.cssImport}`
  if (imagery) directives.imagery = imagery.hint
  if (density) directives.density = density.hint

  const vibeSuffix = [
    pick('direction') ? `Design direction: ${pick('direction').hint}` : null,
    directives.typography ? `Typography: ${typography.meta.heading} + ${typography.meta.body}` : null,
    directives.imagery ? `Imagery: ${imagery.hint}` : null,
    directives.density ? `Density: ${density.hint}` : null,
  ].filter(Boolean).join(' | ')

  return {
    v: 1,
    answers: { ...answers },
    styleId: answers.direction || null,
    familyId: built.family || null,
    forcedMap: Object.keys(forcedMap).length ? forcedMap : null,
    motionId: answers.motion === 'motion-none' ? null : (answers.motion || null),
    motionOff: answers.motion === 'motion-none',
    // Travels as a bare id on purpose. effectsLibrary turns it into the full
    // technical recipe at build time, so the plain wording shown in the
    // question never has to carry the vocabulary that steers the model.
    heroEffectId: depth ? answers.depth : null,
    sectionOrder: rhythm?.meta?.order || null,
    palette: paletteHexes.length ? paletteHexes : null,
    directives,
    vibeSuffix,
  }
}
