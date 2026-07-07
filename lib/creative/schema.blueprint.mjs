// Creative Intelligence Layer — CDO schema (Stage 4 / Blueprint slice).
//
// Fourth slice of the Creative Decision Object (docs/CDO_SCHEMA.md §8-16). The
// Blueprint Generator turns the Creative Director concept + the deterministic
// seed defaults into an EXECUTABLE design system.
//
// IMPORTANT: this schema describes ONLY the MODEL-DECIDED (judgment) fields the
// Blueprint model emits. The AUTHORITATIVE seeds (constraint floors, platform
// constants, palette role_map) are NOT in this schema — they are stitched onto
// the final blueprint from the Defaults Engine and can never be model-overridden
// (see lib/creative/blueprint.mjs: assembleBlueprint / IMMUTABLE_PATHS).
//
// Pure module. Node-testable. Uses the shared schema engine.

import { SCHEMA_VERSION } from './schema.mjs'
import { renderContract, validateAgainst, emptyFrom, sectionsOf } from './schema-core.mjs'

export { SCHEMA_VERSION }
export const CIL_STAGE = 'blueprint'

export const BLUEPRINT_SCHEMA = Object.freeze({
  typography: {
    _desc: 'Executable type system. Font families are pure judgment; refine the seeded scale.',
    display_family: { type: 'string', required: true, desc: 'Google Font for headlines.', example: 'Cormorant Garamond' },
    body_family: { type: 'string', required: true, desc: 'Google Font for body.', example: 'Inter' },
    accent_family: { type: 'string', required: false, desc: 'Optional third family.', example: 'IBM Plex Mono' },
    scale_ratio: { type: 'number', required: true, desc: 'Modular scale ratio (seeded).', example: 1.414 },
    hero_clamp: { type: 'string', required: true, desc: 'Fluid hero size.', example: 'clamp(2.6rem, 9vw, 6.5rem)' },
    h2_clamp: { type: 'string', required: true, desc: 'Fluid h2 size.', example: 'clamp(1.8rem, 5vw, 3rem)' },
    h3_clamp: { type: 'string', required: false, desc: 'Fluid h3 size.', example: 'clamp(1.3rem, 3vw, 1.8rem)' },
    body_px: { type: 'int', required: true, desc: 'Base body px (>= accessibility floor, seeded).', example: 17 },
    weights: { type: 'object', required: true, desc: 'Role->weight map.', example: { display: 600, body: 400, label: 500 } },
    tracking: { type: 'object', required: false, desc: 'Role->letter-spacing.', example: { label: '0.14em' } },
    case_rules: { type: 'string[]', required: false, desc: 'Casing treatments.', example: ['small-caps eyebrows'] },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.9 },
  },
  spacing: {
    _desc: 'Spacing/grid system (seeded).',
    density: { type: 'enum', enum: ['tight', 'balanced', 'airy', 'palatial'], required: true, desc: 'Content density.', example: 'airy' },
    section_rhythm: { type: 'int', required: true, desc: 'Vertical section rhythm in px.', example: 128 },
    grid_asymmetry: { type: 'enum', enum: ['none', 'subtle', 'bold'], required: true, desc: 'Grid asymmetry.', example: 'subtle' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.85 },
  },
  color: {
    _desc: 'Color policies (role_map + accent_reservation are authoritative — stitched, not here).',
    gradient_policy: { type: 'enum', enum: ['none', 'subtle', 'expressive'], required: true, desc: 'Gradient usage.', example: 'subtle' },
    dark_surface_policy: { type: 'enum', enum: ['restricted', 'hero-allowed', 'freely-allowed'], required: true, desc: 'Where dark sections are allowed.', example: 'restricted' },
    contrast_strategy: { type: 'string', required: true, desc: 'How contrast is guaranteed.', example: 'dark ink on cream; white only on scrimmed photos' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.85 },
  },
  layout: {
    _desc: 'Layout system + the bespoke compositional moves (judgment-heavy).',
    section_order: { type: 'string[]', required: true, desc: 'Persuasion-ordered sections.', example: ['hero', 'story', 'menu', 'proof', 'visit'] },
    hero_construction: { type: 'string', required: true, desc: 'Exactly what the hero is.', example: 'full-bleed candlelit room, headline bottom-left over scrim' },
    signature_structural_move: { type: 'string', required: true, desc: 'The one defining layout move.', example: 'menu as two-column dotted-leader list' },
    bespoke_moves: { type: 'string[]', required: true, desc: '>=3 compositional moves a template could not produce.', example: ['8/4 About split', 'image-bleed headline', 'off-grid stat'] },
    rhythm_pattern: { type: 'string', required: true, desc: 'Alternation of dense/airy, light/dark.', example: 'airy -> dense -> airy -> dark CTA' },
    density_target: { type: 'enum', enum: ['minimal', 'balanced', 'rich'], required: true, desc: 'Content density target.', example: 'rich' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.83 },
  },
  component: {
    _desc: 'Reusable UI atom treatments (seeded).',
    radius_language: { type: 'enum', enum: ['sharp', 'soft', 'pill'], required: true, desc: 'Corner language.', example: 'soft' },
    button_style: { type: 'string', required: true, desc: 'Button shape/weight/treatment.', example: 'solid ink, generous, subtle lift on hover' },
    iconography: { type: 'enum', enum: ['none', 'line', 'filled', 'duotone'], required: true, desc: 'Icon style.', example: 'line' },
    shadow_depth: { type: 'enum', enum: ['none', 'low', 'medium', 'layered', 'refined', 'hairline'], required: true, desc: 'Shadow/elevation language.', example: 'refined' },
    ornamentation: { type: 'enum', enum: ['none', 'restrained', 'expressive'], required: true, desc: 'Decoration level.', example: 'restrained' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.84 },
  },
  motion: {
    _desc: 'Signature motion + micro-interaction policy (reduced-motion is authoritative — stitched).',
    placement: { type: 'string', required: true, desc: 'Where the single signature motion lives.', example: 'hero backdrop' },
    intensity: { type: 'enum', enum: ['none', 'subtle', 'medium', 'bold'], required: true, desc: 'Motion energy (seeded).', example: 'subtle' },
    micro_interactions_allowed: { type: 'string[]', required: true, desc: 'Permitted CSS-only interactions.', example: ['hover lift', 'nav underline', 'image scale 1.03'] },
    forbidden: { type: 'string[]', required: true, desc: 'Explicitly banned motion.', example: ['autoplay carousels', 'parallax stacks'] },
    color_mapping_rule: { type: 'string', required: true, desc: 'How --vm-c1/--vm-c2 map to palette.', example: 'secondary/neutral only; never the accent' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.8 },
  },
  imagery: {
    _desc: 'Executable imagery direction (seeded).',
    art_direction: { type: 'string', required: true, desc: 'The look of every image.', example: 'warm low-key, shallow depth, occasion energy' },
    grade: { type: 'string', required: true, desc: 'Color grade toward palette/mood.', example: 'amber-warm, lifted blacks' },
    lighting: { type: 'string', required: true, desc: 'Lighting language.', example: 'candlelit key, soft falloff' },
    crop_language: { type: 'string', required: true, desc: 'Crop/aspect intent.', example: 'full-bleed hero; tight food macros' },
    subject_rules: { type: 'string[]', required: true, desc: 'What to depict/avoid; role-only for people.', example: ['real dishes', 'no named individuals'] },
    real_vs_generated_bias: { type: 'enum', enum: ['prefer_real', 'balanced', 'prefer_generated'], required: true, desc: 'Sourcing bias (seeded).', example: 'prefer_real' },
    theme_lock: { type: 'string', required: true, desc: 'Cohesion rule across all images.', example: 'every image graded to one shoot' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.8 },
  },
  mobile: {
    _desc: 'Mobile behavior (numeric floors/breakpoints/viewport are authoritative — stitched).',
    nav_pattern: { type: 'string', required: true, desc: 'JS-free mobile nav.', example: 'logo + single CTA; links hidden' },
    thumb_reach_rules: { type: 'string[]', required: false, desc: 'Reachability/tap-spacing rules.', example: ['>=52px CTAs', '>=8px between targets'] },
    signature_adaptation: { type: 'string', required: false, desc: 'How the signature moment survives on mobile.', example: 'headline stacks over scrim' },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.82 },
  },
  conversion_execution: {
    _desc: 'The execution half of the conversion philosophy.',
    cta_ubiquity_rule: { type: 'string', required: true, desc: 'Where the CTA must appear.', example: 'sticky nav + hero + closing band' },
    proof_adjacency_rule: { type: 'string', required: true, desc: 'Proof placed next to conversion.', example: 'a review beside the reserve CTA' },
    friction_reducers: { type: 'string[]', required: true, desc: 'Ways to lower action cost.', example: ['tap-to-call', 'one-line reserve'] },
    confidence: { type: 'number01', required: true, desc: 'Certainty, 0..1.', example: 0.83 },
  },
  refinement: {
    _desc: 'Which seeds were overridden and why (learning signal). Empty if all seeds adopted.',
    overrides: { type: 'object[]', required: false, desc: '{param, from, to, why} for each overridden seed.', example: [{ param: 'motion.intensity', from: 'subtle', to: 'medium', why: 'the gamble needs more life' }] },
    notes: { type: 'string', required: false, desc: 'Any brief refinement note.', example: '' },
  },
})

const FOOTER = 'Rules: every value must be executable (real Google-Font names, real clamp() strings, integer px, explicit policies) — no vagueness. Adopt each SEED default unless the concept demands otherwise; when you override a seed, record it in refinement.overrides with a reason. Provide at least THREE bespoke_moves. Never restate or alter the AUTHORITATIVE fixed values. Every confidence is a number in [0,1].'

export function blueprintContract() { return renderContract(BLUEPRINT_SCHEMA, { footer: FOOTER }) }
export function validateBlueprint(obj) { return validateAgainst(BLUEPRINT_SCHEMA, obj) }
export function emptyBlueprint() { return emptyFrom(BLUEPRINT_SCHEMA) }
export const BLUEPRINT_SECTIONS = sectionsOf(BLUEPRINT_SCHEMA)
