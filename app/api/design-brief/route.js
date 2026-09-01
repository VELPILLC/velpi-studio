// Vercel: allow long-running AI work
export const maxDuration = 300

import { callClaude, stripFences } from '../../../lib/claude'

// The fusion step. Instead of handing the builder three raw design systems and
// hoping it blends them well while writing 60k tokens of HTML, a creative
// director first COMMITS to one fused spec. The builder then executes a
// decision, not a pile of references. The brief also surfaces in the Build
// Report so the creator can critique the thinking.

const SYSTEM = `You are the creative director of a high-end web agency, and you OWN this outcome. You are given: the business's brand analysis, the creator's vibe selections, the conversion strategy, and up to three reference design systems. Fuse them into ONE committed design brief. Commit hard — no options, no hedging, no "could". Make the judgment calls yourself and state your assumptions inline; never pose questions.

AUTONOMY RULES:
- Form your own point of view BEFORE specifying anything: what makes this business genuinely interesting, what the generic AI-built site for this niche would look like, and what you will do differently.
- The reference systems and vibe selections are INPUTS, not orders. Mix them, invert them, or overrule them when the brand calls for it — and say why. A boring-but-correct direction is a failure; bias toward the interesting choice and take the stylistic risk without asking permission.
- Justify each risk in one line so the creator can read your reasoning.

Write the brief as plain text (no markdown headers needed, no code) in EXACTLY these labeled parts:

POV: 2-3 sentences — what makes this business interesting, what the generic version of this site would be, and the stance you're taking instead.
THE GAMBLE: the single boldest deliberate choice in this design and the one-line justification for it.

CONCEPT: a name + two sentences capturing the big idea (e.g. "Golden Hour Authority — warm editorial luxury with clinical precision...").
PALETTE MAP: every color with its exact hex and role — page background, section alternates, headline ink, body text, primary CTA, accents. Only the brand's real palette plus tints/shades, white, and one near-black.
TYPE SYSTEM: the exact Google Fonts pairing (display + body), weights, and the scale (hero/h2/h3/body sizes with clamp() values for fluid mobile-first sizing).
HERO CONCEPT: precisely what the hero is — image treatment, composition, headline attitude, CTA placement.
SECTION TREATMENTS: for each section in the persuasion flow, one line — its background treatment and focal element. Each section's layout SKELETON is fixed by an assigned blueprint (listed in the input when available): keep its composition, grid ratios and container logic. Everything that makes the page feel like ONE designed object is yours to unify and you are expected to use it — a single material language (one shadow scale, one corner radius, one border treatment), one spacing rhythm, one image-crop language, consistent focal weight from section to section. State these once as page-wide rules, then note only where a section deliberately departs. Alternate background rhythm deliberately.
SIGNATURE DETAILS: 3-5 specific touches that make this site unmistakable (oversized numerals, pull-quotes, border treatments, image crops, hover behaviors).
SIGNATURE MOTION: exactly ONE motion/background treatment for the whole site — you are given a pre-selected preset matched to the niche's intensity; state where it lives (hero backdrop, section interlude, headline) and how it supports the vibe. You may overrule the preset with "none — stillness serves this brand" if motion would cheapen it. Never specify more than one motion treatment.
MOBILE BEHAVIOR: how the design lands on a 390px phone — edge-to-edge moments, full-width CTAs, type scale floor.

Steal the STRONGEST ideas from the reference systems and fuse them so the result feels like one intentional brand, never a collage. The brand's real identity always wins conflicts. Keep the whole brief under 700 words.`

export async function POST(request) {
  try {
    const { analysis, vibe, styleMds, motion, blueprintAssignments, guided } = await request.json()
    if (!analysis) {
      return Response.json({ error: 'Missing analysis for the design brief.' }, { status: 400 })
    }

    // Guided directives are DECISIONS THE CLIENT ALREADY MADE, so they sit
    // above the autonomy rules — the brief's job here is to build the best
    // possible design around them, not to reconsider them.
    const guidedBlock = guided && Object.keys(guided).length
      ? `THE CLIENT HAS ALREADY DECIDED THESE — THEY ARE NOT YOURS TO REVISIT. Every part of the brief must be built around them, and any section that would contradict one is wrong:
${Object.entries(guided).map(([k, v]) => `- ${k.toUpperCase()}: ${v}`).join('\n')}
Use the exact fonts and hex values given. Do not substitute a "better" pairing or palette.

`
      : ''

    const user = `${guidedBlock}BUSINESS: ${analysis.business_name || ''} — ${analysis.industry || ''}${analysis.niche ? ` (${analysis.niche})` : ''}
${Array.isArray(blueprintAssignments) && blueprintAssignments.length ? `FIXED SECTION BLUEPRINTS (structure already decided — brief the treatment WITHIN each): ${blueprintAssignments.join(' | ')}` : ''}
TONE: ${analysis.tone || ''}
BRAND PALETTE (locked): ${(analysis.color_palette || []).join(', ')}
BRAND ANALYSIS: ${JSON.stringify(analysis.brand || {}, null, 1)}
${vibe ? `CREATOR'S VIBE SELECTIONS: ${vibe}` : ''}
CONVERSION STRATEGY: ${JSON.stringify(analysis.conversion_strategy || {}, null, 1)}
PERSUASION FLOW SECTIONS: ${JSON.stringify(analysis.layout?.section_order || analysis.sections || [])}
${motion ? `PRE-SELECTED SIGNATURE MOTION (matched to niche intensity — place it or overrule it): "${motion.name}" — ${motion.summary || ''} (effect: ${motion.effect}, intensity: ${motion.intensity})` : ''}

REFERENCE DESIGN SYSTEMS TO FUSE (${(styleMds || []).length}):
${(styleMds || []).map((s, i) => `--- SYSTEM ${i + 1} ---\n${String(s).slice(0, 4000)}`).join('\n\n') || '(none — derive the direction from brand + vibe alone)'}`

    // A missing brief is NOT a soft failure: build-site's prompt switches to
    // an explicit "mix & match the raw systems" collage path when no brief is
    // present, which is the exact incoherence the brief exists to prevent. So
    // retry once, and report honestly when it still can't be written instead
    // of silently returning '' and letting the page degrade unnoticed.
    let brief = ''
    let attempts = 0
    let lastErr = null
    for (attempts = 1; attempts <= 2; attempts++) {
      try {
        brief = stripFences(await callClaude({ system: SYSTEM, user, maxTokens: 2500 }))
        if (brief && brief.length >= 200) return Response.json({ brief, attempts })
      } catch (e) {
        lastErr = e
        console.error(`design-brief attempt ${attempts} failed:`, e.message)
      }
    }
    console.error('design-brief: no usable brief after 2 attempts — the build will fall back to raw systems')
    return Response.json({
      brief: '',
      attempts: attempts - 1,
      degraded: true,
      reason: lastErr ? `brief call failed: ${lastErr.message}` : 'the model returned an unusably short brief twice',
    })
  } catch (err) {
    console.error('design-brief error:', err)
    return Response.json({ brief: '', degraded: true, reason: err.message }) // never block the pipeline
  }
}
