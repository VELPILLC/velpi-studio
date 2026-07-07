// Creative Intelligence Layer — CDO schema (Stage 3 / Creative Director slice).
//
// Third slice of the Creative Decision Object (docs/CDO_SCHEMA.md §6,7,13,17,18,20).
// The Creative Director makes the creative LEAP: the one-sentence thesis, the
// bold gamble, the art-direction statement, the overarching visual language,
// the imagery concept, and the seed of the signature moment + Design DNA. This
// is CONCEPT, not executable parameters (those are Stage 4 / Blueprint).
//
// Decision<T> nodes (e.g. the_gamble) are FLATTENED into plain validated fields
// so the generic validator can check enums directly; they map back to CDO
// Decision nodes when the full directive is assembled later.
//
// Pure module. Node-testable. Uses the shared schema engine.

import { SCHEMA_VERSION } from './schema.mjs'
import { renderContract, validateAgainst, emptyFrom, sectionsOf } from './schema-core.mjs'

export { SCHEMA_VERSION }
export const CIL_STAGE = 'creative_director'

export const DIRECTOR_SCHEMA = Object.freeze({
  creative_concept: {
    _desc: 'The single idea this website is built around, and the bold move that makes it unforgettable.',
    creative_thesis: { type: 'string', required: true, desc: 'ONE sentence every philosophy must ladder to.', example: 'A candlelit love letter to a 30-year kitchen.' },
    gamble_move: { type: 'string', required: true, desc: 'The single boldest deliberate move.', example: 'a near-black, room-lit hero instead of appetite-red food shots' },
    gamble_justification: { type: 'string', required: true, desc: 'Why the gamble is worth it.', example: 'occasion beats appetite for a special-occasion restaurant' },
    gamble_risk: { type: 'enum', enum: ['low', 'medium', 'high'], required: true, desc: 'Risk level of the gamble.', example: 'medium' },
    art_direction_statement: { type: 'string', required: true, desc: 'The look, stated as an ECD would.', example: 'editorial warmth, cinematic light, zero clutter' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.83 },
  },
  design_philosophy: {
    _desc: 'The overarching visual-language stance (concept level, not hex/fonts).',
    visual_language: { type: 'string', required: true, desc: 'The overall aesthetic stance.', example: 'warm editorial luxury with one cinematic moment' },
    descriptors: { type: 'string[]', required: true, desc: 'Aesthetic descriptors for this language.', example: ['editorial', 'warm', 'restrained'] },
    movement_refs: { type: 'string[]', required: false, desc: 'Art/design movements referenced.', example: ['mid-century editorial', 'slow food'] },
    ornamentation: { type: 'enum', enum: ['none', 'restrained', 'expressive'], required: true, desc: 'Decoration level.', example: 'restrained' },
    surface_language: { type: 'string', required: true, desc: 'Materiality: flat/layered/paper/glass/etc.', example: 'warm paper with soft depth' },
    design_principles: { type: 'string[]', required: true, desc: '3-5 principles Build must honor.', example: ['let the room breathe', 'one hero moment'] },
    rationale: { type: 'string', required: true, desc: 'Why this language for this business.', example: 'restraint signals confidence at this tier' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.82 },
  },
  imagery_concept: {
    _desc: 'The imagery CONCEPT — Blueprint finalizes executable params later.',
    philosophy: { type: 'string', required: true, desc: 'Imagery stance.', example: 'cinematic candlelight, real room, no stock' },
    art_direction: { type: 'string', required: true, desc: 'The look of every image.', example: 'warm low-key, shallow depth, occasion energy' },
    grade: { type: 'string', required: true, desc: 'Color grade toward palette/mood.', example: 'amber-warm, lifted blacks' },
    lighting: { type: 'string', required: true, desc: 'Lighting language.', example: 'candlelit key, soft falloff' },
    subject_stance: { type: 'string', required: true, desc: 'What to depict / avoid; role-only for people.', example: 'real dishes and the room; no named individuals' },
    real_vs_generated_bias: { type: 'enum', enum: ['prefer_real', 'balanced', 'prefer_generated'], required: true, desc: 'Sourcing bias.', example: 'prefer_real' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.8 },
  },
  signature_moment: {
    _desc: 'The one unforgettable thing (concept). The hard gate the critic checks later.',
    name: { type: 'string', required: true, desc: 'Short evocative name.', example: 'The Candlelit Threshold' },
    description: { type: 'string', required: true, desc: 'Exactly what it is.', example: 'full-bleed dark room hero with a single warm glow behind the headline' },
    location: { type: 'string', required: true, desc: 'Which section it lives in.', example: 'hero' },
    why_unforgettable: { type: 'string', required: true, desc: 'Why it sticks.', example: 'it feels like walking into the room, not reading a menu' },
    must_survive_mobile: { type: 'bool', required: false, desc: 'Whether it is required on phones.', example: true },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.87 },
  },
  design_dna_seed: {
    _desc: 'Canonical aesthetic fingerprint (seed of design_dna) that drives reference matching.',
    descriptors: { type: 'string[]', required: true, desc: '5-8 canonical, reusable aesthetic tags (not business nouns).', example: ['editorial', 'warm', 'candlelit', 'restrained'] },
  },
  creative_reasoning: {
    _desc: 'The narrative "why" (explainability / future distillation). Never consumed by Build.',
    narrative: { type: 'string', required: false, desc: "The ECD's paragraph on the direction.", example: 'We reject the red-spice cliche because occasion, not appetite, is the job.' },
    key_insights: { type: 'string[]', required: true, desc: 'The 3-5 insights that drove the direction.', example: ['occasion > everyday', 'heritage is the moat'] },
  },
  assumptions: {
    _desc: 'Explicit creative inferences made where the strategy was thin.',
    _rootArray: 'string[]',
  },
})

const FOOTER = 'Rules: the thesis is ONE sentence and everything ladders to it; the gamble is bold but conversion-safe; break at least one named convention; the signature moment is concrete and locatable; DNA descriptors are canonical (reusable), not business nouns; keep to CONCEPT (no hex, no fonts, no numeric params); never invent facts — use assumptions. Every confidence is a number in [0,1].'

export function directorContract() { return renderContract(DIRECTOR_SCHEMA, { footer: FOOTER }) }
export function validateDirector(obj) { return validateAgainst(DIRECTOR_SCHEMA, obj) }
export function emptyDirector() { return emptyFrom(DIRECTOR_SCHEMA) }
export const DIRECTOR_SECTIONS = sectionsOf(DIRECTOR_SCHEMA)
