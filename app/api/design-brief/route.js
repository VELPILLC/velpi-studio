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
SECTION TREATMENTS: for each section in the persuasion flow, one line — its background treatment, layout pattern, and focal element. Alternate rhythm deliberately.
SIGNATURE DETAILS: 3-5 specific touches that make this site unmistakable (oversized numerals, pull-quotes, border treatments, image crops, hover behaviors).
MOBILE BEHAVIOR: how the design lands on a 390px phone — edge-to-edge moments, full-width CTAs, type scale floor.

Steal the STRONGEST ideas from the reference systems and fuse them so the result feels like one intentional brand, never a collage. The brand's real identity always wins conflicts. Keep the whole brief under 700 words.`

export async function POST(request) {
  try {
    const { analysis, vibe, styleMds } = await request.json()
    if (!analysis) {
      return Response.json({ error: 'Missing analysis for the design brief.' }, { status: 400 })
    }

    const user = `BUSINESS: ${analysis.business_name || ''} — ${analysis.industry || ''}${analysis.niche ? ` (${analysis.niche})` : ''}
TONE: ${analysis.tone || ''}
BRAND PALETTE (locked): ${(analysis.color_palette || []).join(', ')}
BRAND ANALYSIS: ${JSON.stringify(analysis.brand || {}, null, 1)}
${vibe ? `CREATOR'S VIBE SELECTIONS: ${vibe}` : ''}
CONVERSION STRATEGY: ${JSON.stringify(analysis.conversion_strategy || {}, null, 1)}
PERSUASION FLOW SECTIONS: ${JSON.stringify(analysis.layout?.section_order || analysis.sections || [])}

REFERENCE DESIGN SYSTEMS TO FUSE (${(styleMds || []).length}):
${(styleMds || []).map((s, i) => `--- SYSTEM ${i + 1} ---\n${String(s).slice(0, 4000)}`).join('\n\n') || '(none — derive the direction from brand + vibe alone)'}`

    const brief = stripFences(await callClaude({ system: SYSTEM, user, maxTokens: 2500 }))
    if (!brief || brief.length < 200) {
      return Response.json({ brief: '' }) // non-fatal — build falls back to raw systems
    }
    return Response.json({ brief })
  } catch (err) {
    console.error('design-brief error:', err)
    return Response.json({ brief: '' }) // never block the pipeline on the brief
  }
}
