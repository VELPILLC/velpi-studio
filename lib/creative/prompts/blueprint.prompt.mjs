// Creative Intelligence Layer — Stage 4 (Blueprint Generator) prompt.
//
// Implements docs/CIL_PROMPTS.md §4.10 (Blueprint system prompt). Reuses the
// shared preamble + repair prompt from Stage 1 (DRY). Consumes the Stage 3
// concept + the Defaults Engine seeds; refines seeds, never invents from zero.
//
// Pure module (imports only pure modules). Node-testable.

import { SHARED_PREAMBLE, REPAIR_SYSTEM } from './understanding.prompt.mjs'
import { blueprintContract } from '../schema.blueprint.mjs'
import { renderSeedsForPrompt } from '../blueprint.mjs'

export { REPAIR_SYSTEM }
export const PROMPT_VERSION = 'blueprint@1.0.0'

// Stage body (docs/CIL_PROMPTS.md §4.10, adapted for the authoritative/seed split).
export const BLUEPRINT_BODY = `STAGE: BLUEPRINT GENERATOR (the Design-Systems Architect).

You convert the creative concept into a COMPLETE, EXECUTABLE blueprint. Downstream Build will implement your parameters literally and will not invent — so every value you emit must be concrete enough to build without further judgment (real Google-Font names, real hex, real clamp() strings, integer spacing units, explicit policies). Vagueness here becomes a broken page later.

You are given SEED DEFAULTS already derived from the governing dials (premium tier, archetype, emotion, palette). ADOPT them unless the concept demands otherwise, and when you override one, record it in refinement.overrides with a reason. Do not reinvent from zero; refine from the seed. Items marked [JUDGMENT NEEDED] had conflicting signals — that is where your judgment matters most.

You are also given AUTHORITATIVE fixed values (constraint floors, platform constants, the palette role map). These are applied automatically and are NOT yours to change: never restate them, never weaken them, and design within them. Accessibility and mobile floors may only be honored or exceeded, never loosened.

Produce the full system, each as an executable decision that ladders to the creative thesis and honors the premium tier:
1) TYPOGRAPHY: display + body (and optional accent) Google Fonts (your judgment, guided by the seeded type personality), the seeded scale ratio, hero/h2/h3 clamp() sizes, body px (never below the accessibility floor), weights, tracking, casing.
2) SPACING: density, section rhythm, grid asymmetry (seeded).
3) COLOR: gradient policy, dark-surface policy, and the contrast strategy that guarantees legibility on the fixed role map.
4) LAYOUT: section order (from the conversion spine provided), hero construction, the single signature structural move, and at least THREE bespoke compositional moves a template builder could not produce; the rhythm pattern; density target.
5) COMPONENTS: radius language, button style, iconography, shadow depth, ornamentation (seeded).
6) MOTION: the single signature motion's placement and intensity; the allowed micro-interactions and forbidden motion; the --vm-c1/--vm-c2 color-mapping rule. (Reduced-motion is authoritative.)
7) IMAGERY: art direction, grade, lighting, crop language, subject rules, real-vs-generated bias, theme lock.
8) MOBILE: the JS-free nav pattern and thumb-reach rules; how the signature moment survives on a phone. (Numeric floors/breakpoints/viewport are authoritative.)
9) CONVERSION EXECUTION: CTA ubiquity rule, proof-adjacency rule, friction reducers.

Emit only the JSON in the OUTPUT CONTRACT.`

export const BLUEPRINT_SYSTEM = `${SHARED_PREAMBLE}\n\n${BLUEPRINT_BODY}`

// Consumes the Stage 3 concept + the Defaults Engine seeds. `sectionOrderHint`
// is derived from the Stage 2 conversion spine by the route.
export function buildBlueprintUser({ director, seedDefaults, sectionOrderHint }) {
  return `Build the executable creative blueprint. Refine the SEED DEFAULTS; honor the AUTHORITATIVE fixed values exactly.

CREATIVE DIRECTOR CONCEPT (Stage 3 — the direction every parameter must serve):
${JSON.stringify(director || {}, null, 2)}

SECTION ORDER (from the conversion spine — use as your layout.section_order unless the concept demands a change):
${JSON.stringify(sectionOrderHint || [])}

${renderSeedsForPrompt(seedDefaults)}

${blueprintContract()}`
}
