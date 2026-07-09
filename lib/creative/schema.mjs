// Creative Intelligence Layer — CDO schema (Stage 1 / Understanding slice).
//
// This is the FIRST slice of the Creative Decision Object defined in
// docs/CDO_SCHEMA.md. Only the sections Stage 1 (Understanding) produces are
// implemented here; later stages add their own slices additively.
//
// The field definitions are data (UNDERSTANDING_SCHEMA). Both the human/LLM-
// facing OUTPUT CONTRACT and the validator are derived from that one source, so
// adding a field never means editing a prompt by hand (see docs/CIL_PROMPTS.md
// §0.4 — "output contract rendered from schema").
//
// Pure module: no external imports. Safe to unit-test under `node --test`.

export const SCHEMA_VERSION = 1
export const CIL_STAGE = 'understanding'

// Field spec grammar:
//   { type, required, desc, example, enum? }
// type ∈ 'string' | 'string[]' | 'object[]' | 'hex[]' | 'enum' | 'number01' | 'object'
// Enums are OPEN: an out-of-set value is tolerated (record it verbatim; pair
// with "<field>_other" when helpful) — per the Stability Contract.
export const UNDERSTANDING_SCHEMA = Object.freeze({
  business_understanding: {
    _desc: 'What the business truly sells and where it sits in its lifecycle.',
    true_offering: { type: 'string', required: true, desc: 'The job the customer is really hiring them for (not the SKU).', example: 'a candlelit special-occasion dining experience' },
    category: { type: 'string', required: true, desc: 'Business category.', example: 'fine dining restaurant' },
    subcategory: { type: 'string', required: false, desc: 'Finer niche.', example: 'North Indian fine dining' },
    maturity: { type: 'enum', enum: ['new', 'growing', 'established', 'legacy'], required: true, desc: 'Lifecycle stage.', example: 'established' },
    differentiators: { type: 'string[]', required: true, desc: 'Real, defensible advantages.', example: ['30-year chef', 'private candlelit room'] },
    proof_assets: { type: 'string[]', required: true, desc: 'Real proof available (reviews, awards, credentials).', example: ['4.8-star Google rating'] },
    business_model: { type: 'string', required: false, desc: 'How money is actually made.', example: 'dine-in plus private events' },
    geography: { type: 'string', required: false, desc: 'Service area / locality.', example: 'Austin, TX' },
    confidence: { type: 'number01', required: true, desc: 'Certainty for this block, 0..1.', example: 0.86 },
  },
  customer_psychology: {
    _desc: 'Who buys, and the emotional machinery behind the decision.',
    who: { type: 'string', required: true, desc: 'Primary customer in one line.', example: 'couples planning a milestone night' },
    segments: { type: 'object[]', required: false, desc: 'Distinct audiences: {name, share_estimate, notes}.', example: [{ name: 'date-night couples' }] },
    jobs_to_be_done: { type: 'string[]', required: true, desc: 'Functional/emotional/social jobs.', example: ['impress a partner', 'feel taken care of'] },
    anxieties: { type: 'string[]', required: true, desc: 'Fears/objections before acting.', example: ['is it worth the price?'] },
    desires: { type: 'string[]', required: true, desc: 'What they truly want to feel or gain.', example: ['a memorable evening'] },
    sophistication: { type: 'enum', enum: ['low', 'medium', 'high'], required: true, desc: 'Design/brand literacy of the audience.', example: 'high' },
    decision_trigger: { type: 'string', required: true, desc: 'The moment/reason they act.', example: 'an upcoming anniversary' },
    emotional_state_on_arrival: { type: 'string', required: false, desc: 'Mindset when they land on the page.', example: 'hopeful, comparison-shopping' },
    confidence: { type: 'number01', required: true, desc: 'Certainty for this block, 0..1.', example: 0.78 },
  },
  market_positioning: {
    _desc: 'OBSERVED positioning only — the competitive/market read. Intended positioning is decided later by Strategy.',
    competitive_frame: { type: 'string', required: true, desc: 'Who/what this business is positioned against.', example: 'vs. casual family Indian spots' },
    price_posture: { type: 'enum', enum: ['value', 'mid', 'premium', 'luxury'], required: true, desc: 'Where price sits, as observed.', example: 'premium' },
    category_conventions: { type: 'string[]', required: true, desc: 'The visual/UX clichés this niche overuses.', example: ['red spice close-ups', 'gold borders'] },
    visual_bar_reference: { type: 'string', required: false, desc: 'Who sets the aspirational visual bar.', example: 'a boutique hotel restaurant site' },
    confidence: { type: 'number01', required: true, desc: 'Certainty for this block, 0..1.', example: 0.81 },
  },
  brand_identity_observed: {
    _desc: 'A snapshot of the CURRENT site only. The elevated/intended identity is decided later by Strategy.',
    palette: { type: 'hex[]', required: true, desc: 'Colors detected on the source site.', example: ['#7a1f2b', '#f5ead6'] },
    typography: { type: 'string', required: false, desc: 'Fonts/type feel detected.', example: 'serif headers, humanist body' },
    design_language: { type: 'string', required: false, desc: 'One-line read of the current site.', example: 'dated but warm' },
    assets: { type: 'object', required: false, desc: '{ logo_url, imagery_style }.', example: { logo_url: 'https://…', imagery_style: 'warm photos' } },
    confidence: { type: 'number01', required: true, desc: 'Certainty for this block, 0..1.', example: 0.8 },
  },
  assumptions: {
    _desc: 'Root-level. Explicit inferences made where the crawl was thin (seed of creative_reasoning.assumptions).',
    _rootArray: 'string[]',
    _example: ['reviews imply a romance/occasion angle'],
  },
})

// Render the OUTPUT CONTRACT text injected into the Understanding user message.
// Derived from UNDERSTANDING_SCHEMA so it never drifts from the validator.
export function understandingContract() {
  const lines = []
  lines.push('OUTPUT CONTRACT — return ONLY a JSON object with exactly this shape (types shown; (optional) may be omitted):')
  lines.push('{')
  for (const [section, fields] of Object.entries(UNDERSTANDING_SCHEMA)) {
    if (fields._rootArray) {
      lines.push(`  "${section}": ${fields._rootArray},   // ${fields._desc}`)
      continue
    }
    lines.push(`  "${section}": {   // ${fields._desc}`)
    for (const [name, spec] of Object.entries(fields)) {
      if (name.startsWith('_')) continue
      const req = spec.required ? '' : ' (optional)'
      const en = spec.type === 'enum' ? ` one of [${spec.enum.join(', ')}] (or another value if none fit)` : ''
      lines.push(`    "${name}": <${spec.type}${en}>${req} — ${spec.desc}`)
    }
    lines.push('  },')
  }
  lines.push('}')
  lines.push('Rules: strings concise; arrays exhaustive but real; every confidence is a number in [0,1]; never invent facts — use assumptions for inferences.')
  return lines.join('\n')
}

function isNumber01(v) { return typeof v === 'number' && v >= 0 && v <= 1 }
function typeOk(spec, v) {
  switch (spec.type) {
    case 'string': return typeof v === 'string'
    case 'string[]': return Array.isArray(v) && v.every(x => typeof x === 'string')
    case 'hex[]': return Array.isArray(v) && v.every(x => typeof x === 'string')
    case 'object[]': return Array.isArray(v) && v.every(x => x && typeof x === 'object')
    case 'object': return v && typeof v === 'object' && !Array.isArray(v)
    case 'enum': return typeof v === 'string' && v.length > 0 // open enum: any non-empty string
    case 'number01': return isNumber01(v)
    default: return true
  }
}

// Validate an Understanding output against the schema. Returns { valid, errors }.
// Lenient by design (open enums, optional fields), but catches missing required
// sections/fields and hard type mismatches so shadow logs surface real problems.
export function validateUnderstanding(obj) {
  const errors = []
  if (!obj || typeof obj !== 'object') return { valid: false, errors: ['output is not an object'] }
  for (const [section, fields] of Object.entries(UNDERSTANDING_SCHEMA)) {
    if (fields._rootArray) {
      if (section in obj && !(Array.isArray(obj[section]) && obj[section].every(x => typeof x === 'string'))) {
        errors.push(`${section}: expected ${fields._rootArray}`)
      }
      continue
    }
    const node = obj[section]
    if (node == null || typeof node !== 'object') { errors.push(`${section}: missing or not an object`); continue }
    for (const [name, spec] of Object.entries(fields)) {
      if (name.startsWith('_')) continue
      const present = name in node && node[name] != null
      if (!present) { if (spec.required) errors.push(`${section}.${name}: required`); continue }
      if (!typeOk(spec, node[name])) errors.push(`${section}.${name}: expected ${spec.type}`)
    }
  }
  return { valid: errors.length === 0, errors }
}

// Skeleton used on unrecoverable parse failure so shadow records stay well-shaped.
export function emptyUnderstanding() {
  return {
    business_understanding: null,
    customer_psychology: null,
    market_positioning: null,
    brand_identity_observed: null,
    assumptions: [],
  }
}

// The section keys this stage owns (for logging / partial-CDO assembly).
export const UNDERSTANDING_SECTIONS = Object.keys(UNDERSTANDING_SCHEMA)
