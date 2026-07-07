// Creative Intelligence Layer — CDO schema (Stage 2 / Strategy slice).
//
// Second slice of the Creative Decision Object (docs/CDO_SCHEMA.md §5,6,4,2,14).
// Strategy turns Understanding into COMMITMENT: the emotional target, the
// premium tier, the archetype, the intended positioning/brand, and the
// conversion spine. Governing dials (tier, archetype, emotion) are set here.
//
// Decision<T> nodes from the CDO (e.g. premium_level, brand_archetype) are
// FLATTENED here into plain validated fields so the generic validator can check
// enums/ranges directly; they map back to CDO Decision nodes when the full
// directive is assembled in a later phase.
//
// Pure module. Node-testable. Uses the shared schema engine.

import { SCHEMA_VERSION } from './schema.mjs'
import { renderContract, validateAgainst, emptyFrom, sectionsOf } from './schema-core.mjs'

export { SCHEMA_VERSION }
export const CIL_STAGE = 'strategy'

const JUNG = ['Innocent', 'Sage', 'Explorer', 'Outlaw', 'Magician', 'Hero', 'Lover', 'Jester', 'Everyman', 'Caregiver', 'Ruler', 'Creator']

export const STRATEGY_SCHEMA = Object.freeze({
  emotional_objectives: {
    _desc: 'The feeling the page must create; a governing dial.',
    north_star_feeling: { type: 'string', required: true, desc: 'The single feeling within 3 seconds.', example: 'romantic anticipation' },
    primary_emotion: { type: 'string', required: true, desc: 'Dominant emotion to evoke.', example: 'warmth' },
    secondary_emotion: { type: 'string', required: false, desc: 'Supporting emotion.', example: 'reverence' },
    evoke: { type: 'string[]', required: true, desc: 'Feelings to actively create.', example: ['intimacy', 'occasion', 'trust'] },
    avoid: { type: 'string[]', required: true, desc: 'Feelings to prevent.', example: ['cheap', 'loud', 'generic'] },
    emotional_arc: { type: 'object[]', required: false, desc: 'Per-stage feeling: {section, feeling}.', example: [{ section: 'hero', feeling: 'awe' }] },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.84 },
  },
  creative_direction: {
    _desc: 'The governing dials: premium tier, archetype, and the positioning tension.',
    premium_tier: { type: 'enum', enum: ['mass', 'mid', 'premium', 'luxury', 'ultra'], required: true, desc: 'The master dial.', example: 'luxury' },
    premium_score: { type: 'int0100', required: true, desc: 'Premium score 0..100.', example: 88 },
    premium_justification: { type: 'string', required: true, desc: 'Why this tier, from evidence.', example: 'price posture + proof + audience sophistication' },
    archetype_primary: { type: 'enum', enum: JUNG, required: true, desc: 'Primary Jungian archetype.', example: 'Lover' },
    archetype_secondary: { type: 'enum', enum: JUNG, required: false, desc: 'Secondary archetype.', example: 'Sage' },
    voice_adjectives: { type: 'string[]', required: true, desc: '3-5 brand-voice adjectives.', example: ['warm', 'refined', 'timeless'] },
    positioning_tension: { type: 'string', required: true, desc: 'The interesting contrast to lean into.', example: 'heritage kitchen x modern restraint' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.83 },
  },
  market_positioning_intended: {
    _desc: 'The committed (intended) positioning — distinct from Stage 1 observed positioning.',
    statement: { type: 'string', required: true, desc: 'One-line positioning statement.', example: 'the special-occasion restaurant, not the everyday one' },
    primary_promise: { type: 'string', required: true, desc: 'The core promise the page must land.', example: "a night you'll remember" },
    reasons_to_believe: { type: 'string[]', required: true, desc: 'Real proof backing the promise.', example: ['30-year chef', 'private candlelit room'] },
    conventions_to_break: { type: 'string[]', required: true, desc: 'Category clichés to deliberately reject.', example: ['stock curry close-ups'] },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.81 },
  },
  brand_identity_intended: {
    _desc: 'The elevated identity to build toward (never a different brand).',
    brand_promise: { type: 'string', required: true, desc: 'The elevated promise.', example: "the city's most romantic table" },
    personality: { type: 'string[]', required: true, desc: '3-5 intended personality adjectives.', example: ['warm', 'refined', 'timeless'] },
    voice_tone: { type: 'string', required: true, desc: 'The copy voice/tone.', example: 'warm authority' },
    reading_level: { type: 'enum', enum: ['low', 'medium', 'high'], required: true, desc: 'Target reading level.', example: 'low' },
    person: { type: 'enum', enum: ['first', 'second', 'third'], required: false, desc: 'Grammatical person.', example: 'second' },
    brand_continuity_rule: { type: 'string', required: true, desc: 'How much to elevate vs. preserve.', example: 'elevate, never reinvent — keep the maroon' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.8 },
  },
  conversion_strategy: {
    _desc: 'The conversion spine (strategic half). Built ONLY from real proof.',
    primary_action: { type: 'string', required: true, desc: 'The one money action / CTA label.', example: 'Reserve a Table' },
    secondary_action: { type: 'string', required: true, desc: 'Lower-commitment action.', example: 'View the Menu' },
    offer_moment: { type: 'string', required: true, desc: 'The honest reason to act now (never fake scarcity).', example: 'private room books out on holidays' },
    objections: { type: 'object[]', required: true, desc: '{objection, answered_by (real fact), where (section)}.', example: [{ objection: 'pricey?', answered_by: '30-year chef', where: 'story' }] },
    persuasion_flow: { type: 'object[]', required: true, desc: '{section, job} per section.', example: [{ section: 'hero', job: 'arrest with the room' }] },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.85 },
  },
  assumptions: {
    _desc: 'Explicit strategic inferences made where understanding was thin.',
    _rootArray: 'string[]',
  },
})

const FOOTER = 'Rules: commit one decision each; keep tier, archetype, and emotion internally consistent; build objections and the offer ONLY from real proof present in the understanding; never invent facts — use assumptions. Every confidence is a number in [0,1].'

export function strategyContract() { return renderContract(STRATEGY_SCHEMA, { footer: FOOTER }) }
export function validateStrategy(obj) { return validateAgainst(STRATEGY_SCHEMA, obj) }
export function emptyStrategy() { return emptyFrom(STRATEGY_SCHEMA) }
export const STRATEGY_SECTIONS = sectionsOf(STRATEGY_SCHEMA)
