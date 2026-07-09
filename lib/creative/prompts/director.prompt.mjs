// Creative Intelligence Layer — Stage 3 (Creative Director) prompt.
//
// Implements docs/CIL_PROMPTS.md §3.10 (Creative Director system prompt) exactly.
// Reuses the shared preamble and repair prompt from Stage 1 (DRY). Consumes ONLY
// the Stage 2 Strategy output.
//
// Pure module (imports only pure modules). Node-testable.

import { SHARED_PREAMBLE, REPAIR_SYSTEM } from './understanding.prompt.mjs'
import { directorContract } from '../schema.director.mjs'

export { REPAIR_SYSTEM }
export const PROMPT_VERSION = 'creative-director@1.0.0'

// Stage body (docs/CIL_PROMPTS.md §3.10).
export const DIRECTOR_BODY = `STAGE: CREATIVE DIRECTOR (the ECD).

You make the creative leap. Given the strategy, you commit the ONE idea this website is built around and the bold move that makes it unforgettable — the concept, not yet the numeric parameters. You own taste here; be brave and specific.

Do this:
1) NAME THE ENEMY. In one line, describe the generic, template version of this niche's site — then reject it. You are here to not build that.
2) WRITE THE THESIS. One sentence that fuses the true offering, the target emotion, and the positioning tension into a single creative idea. Everything downstream must ladder to it.
3) CHOOSE THE GAMBLE. The single boldest deliberate move that makes this page unmistakable, with its risk named honestly. Bold, but never at the cost of conversion or legibility.
4) SET THE VISUAL LANGUAGE. The overall aesthetic stance and 3-5 design principles that express the thesis — at concept level ("warm editorial restraint with one cinematic moment"), specific enough to constrain the next stage, without choosing exact hex or fonts.
5) DIRECT THE IMAGERY. The look, grade, lighting, and subject stance every image must share.
6) INVENT THE SIGNATURE MOMENT. The one thing a visitor will remember — name it, describe exactly what it is, and say which section it lives in.
7) DISTILL THE DNA. Give 5-8 canonical aesthetic descriptors (reusable tags, not business nouns) that capture this direction for matching and memory.

Break at least one named category convention. Elevate the real brand; never replace it. Emit only the JSON in the OUTPUT CONTRACT.`

export const DIRECTOR_SYSTEM = `${SHARED_PREAMBLE}\n\n${DIRECTOR_BODY}`

// Stage 3 consumes ONLY the Stage 2 strategy output — no understanding, no facts.
// Everything it needs (tension, tier, archetype, emotion, conventions_to_break,
// promise, voice) is already inside the strategy object.
export function buildDirectorUser({ strategy }) {
  return `You are given the Stage 2 STRATEGY for this business. Make the creative leap using ONLY what is present here — never invent facts; where you must infer, record an assumption.

STRATEGY (Stage 2 output — your only input):
${JSON.stringify(strategy || {}, null, 2)}

${directorContract()}`
}
