// Creative Director Review System — review engine (Phase 1).
//
// Orchestrates the full review:
//   1. Deterministic checks (accessibility, SEO) — pure measurement.
//   2. Content judge — model reads the page, quotes verbatim evidence; every
//      quote is mechanically re-verified against the document, and a category
//      whose evidence fails verification is VOIDED to not_evaluated.
//   3. Vision judge — model looks at real rendered screenshot(s); runs only
//      when a screenshot exists. No screenshot → not_evaluated, never inferred
//      from CSS.
//   4. Aggregation (overall = transparent mean) + impact-ranked priorities.
//
// Judges are injected so the engine is unit-testable with fakes. The route
// supplies real Claude-backed judges. Pure module otherwise.

import {
  REVIEW_ENGINE_VERSION, collectFacts, stripDataUris,
  buildAccessibilityCategory, buildSeoCategory,
  verifyEvidence, aggregateOverall, prioritize, notEvaluated, gradeFor,
} from './checks.mjs'
import {
  CONTENT_CATEGORIES, VISION_CATEGORIES,
  CONTENT_SYSTEM, VISION_SYSTEM, buildContentUser, buildVisionUser,
  CONTENT_PROMPT_VERSION, VISION_PROMPT_VERSION,
} from './prompts.mjs'

export { REVIEW_ENGINE_VERSION }

const JUDGE_HTML_CAP = 120000

// Normalize a judge's raw category into the house shape (or not_evaluated).
function normalizeCategory(raw, method) {
  if (!raw || typeof raw !== 'object') return notEvaluated('judge omitted this category', method)
  if (raw.status === 'not_evaluated') return notEvaluated(raw.reason || 'judge could not evaluate', method)
  const score = Number.isFinite(raw.score) ? Math.max(0, Math.min(100, Math.round(raw.score))) : null
  if (score == null) return notEvaluated('judge returned no numeric score', method)
  return {
    status: 'evaluated', method,
    score, grade: gradeFor(score),
    explanation: typeof raw.explanation === 'string' ? raw.explanation : '',
    evidence: Array.isArray(raw.evidence) ? raw.evidence.filter(e => typeof e === 'string') : [],
    deductions: Array.isArray(raw.deductions) ? raw.deductions.filter(d => typeof d === 'string') : [],
    recommendations: (Array.isArray(raw.recommendations) ? raw.recommendations : [])
      .filter(r => r && typeof r === 'object' && r.fix)
      .map(r => ({
        fix: String(r.fix),
        refinement_prompt: String(r.refinement_prompt || r.fix),
        impact: {
          level: ['high', 'medium', 'low'].includes(r.impact?.level) ? r.impact.level : 'medium',
          rationale: String(r.impact?.rationale || ''),
        },
      })),
    evidence_verified: null, // set by the verification gate below where applicable
  }
}

export async function runDirectorReview({ html, screenshots = {}, businessName = '', judges = {} }) {
  if (!html || typeof html !== 'string') throw new Error('runDirectorReview needs the generated HTML.')

  const htmlForJudge = stripDataUris(html).slice(0, JUDGE_HTML_CAP)
  const truncated = stripDataUris(html).length > JUDGE_HTML_CAP
  const facts = collectFacts(html)
  const categories = {}
  const evidenceStats = { checked: 0, verified: 0, voided_categories: [] }

  // 1) Deterministic categories — always available, always real.
  categories.accessibility = buildAccessibilityCategory(facts)
  categories.seo = buildSeoCategory(facts)

  // 2+3) Content and vision judges are independent — run them in parallel.
  const contentMethod = 'content judge — model read the page; every quote mechanically re-verified against the document'
  const desktopShot = screenshots.desktop || null
  const mobileShot = screenshots.mobile || null

  const contentPromise = typeof judges.content === 'function'
    ? judges.content({
        system: CONTENT_SYSTEM,
        user: buildContentUser({ html: htmlForJudge + (truncated ? '\n[...document truncated for review]' : ''), facts, businessName }),
      }).catch(e => ({ __error: e?.message || 'content judge failed' }))
    : Promise.resolve(null)

  const visionPromise = (desktopShot && typeof judges.vision === 'function')
    ? judges.vision({
        system: VISION_SYSTEM,
        user: buildVisionUser({ coverageNote: screenshots.coverageNote || '', hasMobile: !!mobileShot }),
        images: [desktopShot, mobileShot].filter(Boolean),
      }).catch(e => ({ __error: e?.message || 'vision judge failed' }))
    : Promise.resolve(null)

  const [contentOut, visionOut] = await Promise.all([contentPromise, visionPromise])
  for (const key of CONTENT_CATEGORIES) {
    if (!judges.content) { categories[key] = notEvaluated('no verification method implemented (content judge not wired)'); continue }
    if (contentOut?.__error) { categories[key] = notEvaluated(`content judge call failed: ${contentOut.__error}`, contentMethod); continue }
    const cat = normalizeCategory(contentOut?.[key], contentMethod)
    if (cat.status === 'evaluated') {
      const { verified, failed } = verifyEvidence(html, cat.evidence)
      evidenceStats.checked += cat.evidence.length
      evidenceStats.verified += verified.length
      if (verified.length === 0) {
        // Anti-hallucination gate: no quote survived verification → the score is void.
        categories[key] = notEvaluated('evidence could not be verified in the page — score voided', contentMethod)
        evidenceStats.voided_categories.push(key)
        continue
      }
      cat.evidence = verified
      cat.evidence_verified = failed.length === 0 ? true : 'partial'
      if (failed.length) cat.deductions = [...cat.deductions, `(reviewer note: ${failed.length} unverifiable quote(s) discarded)`]
    }
    categories[key] = cat
  }

  // Vision categories — only with a real screenshot.
  const visionMethod = d => `vision judge — scored from a real rendered ${d} screenshot`
  for (const key of VISION_CATEGORIES) {
    if (!desktopShot) { categories[key] = notEvaluated('not evaluated — no rendered screenshot provided (visual scores are never inferred from source code)'); continue }
    if (!judges.vision) { categories[key] = notEvaluated('no verification method implemented (vision judge not wired)'); continue }
    if (visionOut?.__error) { categories[key] = notEvaluated(`vision judge call failed: ${visionOut.__error}`, visionMethod('desktop')); continue }
    categories[key] = normalizeCategory(visionOut?.[key], visionMethod('desktop'))
  }
  if (!mobileShot) {
    categories.mobile_responsiveness = notEvaluated('not evaluated — no 375px mobile screenshot provided (mobile is never inferred from desktop CSS). Note: viewport meta tag presence IS checked deterministically under accessibility/SEO.')
  } else if (visionOut?.__error) {
    categories.mobile_responsiveness = notEvaluated(`vision judge call failed: ${visionOut.__error}`, visionMethod('mobile'))
  } else {
    categories.mobile_responsiveness = normalizeCategory(visionOut?.mobile_responsiveness, visionMethod('mobile (375px viewport)'))
  }

  // 4) Aggregate + prioritize.
  categories.overall_quality = aggregateOverall(categories)
  const priorities = prioritize(categories)

  const evaluated = Object.entries(categories).filter(([, v]) => v.status === 'evaluated').map(([k]) => k)
  const not_evaluated = Object.entries(categories)
    .filter(([, v]) => v.status === 'not_evaluated')
    .map(([k, v]) => ({ category: k, reason: v.reason }))

  return {
    reviewVersion: REVIEW_ENGINE_VERSION,
    promptVersions: { content: CONTENT_PROMPT_VERSION, vision: VISION_PROMPT_VERSION },
    businessName: businessName || null,
    method_summary: { evaluated, not_evaluated },
    categories,
    overall: categories.overall_quality,
    priorities,
    evidence_verification: evidenceStats,
    facts_snapshot: {
      contrast_pairs_measured: facts.contrast.measured,
      contrast_failing: facts.contrast.failing.length,
      images: facts.alt.total,
      images_missing_alt: facts.alt.missing.length,
      tel_links: facts.conversion.telLinks,
      leftover_image_tokens: facts.conversion.leftoverTokens,
      word_count: facts.conversion.wordCount,
      truncated_for_judge: truncated,
    },
  }
}
