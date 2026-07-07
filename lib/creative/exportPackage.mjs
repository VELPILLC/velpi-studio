// Developer Review System — export packager.
//
// Per docs/DEV_REVIEW_SYSTEM.md §7. Pure builders that assemble a portable
// review artifact from already-persisted rows (CDO + review + project). No I/O,
// no secrets. Node-testable.

import { reviewCompleteness } from './review.mjs'

export const EXPORT_VERSION = 'export@1.0.0'

export const SINGLE_INSTRUCTIONS =
  "You are auditing one output of Velpi's Creative Intelligence Layer. This file contains the creative decisions (creative_directive), the deterministic seed defaults (defaults), the model's overrides of those seeds (overrides), the validator's verdict (validation), the human developer's review (developer_review), the run metrics (metrics), and the generated site (html + screenshots). Assess: (1) were the creative decisions good and coherent to the thesis? (2) where the model overrode a deterministic default, was it right? (3) does the generated HTML/screenshot actually implement the directive? (4) do the human review scores agree or disagree with the validator, and why? (5) name the top 5 concrete changes — to defaults.js tables, a specific prompt version, or a schema — that would improve the next generation. Reference fields by path."

export const BATCH_INSTRUCTIONS =
  "Here are N reviewed CIL generations with the fleet metrics summary. Find systemic patterns, not per-run nits: which stages/parameters most correlate with low human scores; the most-overridden seed defaults and whether the overrides improved outcomes; recurring section-tag complaints; and score deltas across prompt versions. Recommend the top 5 changes to defaults.js, prompts, or schema, ranked by expected impact."

const FIELD_MAP = {
  creative_directive: 'the full assembled Creative Decision Object (all five CIL stages)',
  validation: 'Stage 5 validator report, internal critique, confidence, and recommended revisions',
  defaults: 'the deterministic seed defaults the Blueprint refined',
  overrides: 'seeds the model overrode (learning signal)',
  metrics: 'this run rollup (tokens, latency, pass/score) + fleet context',
  developer_review: 'the human developer scores, flag, section tags, and notes',
  html: 'generated site — tokenized template and rendered form',
  screenshots: 'thumbnail (stored) and optional full-page capture',
  prompt_versions: 'per-stage prompt/schema/defaults versions for attribution',
}

const SECURITY_NOTE = 'contains no API keys, env vars, or secrets'

// Pure token substitution (mirrors the client/preview logic) for the rendered HTML.
export function substituteTokens(html, { assetsById = {}, ghlUrls = {}, logoSrc = null } = {}) {
  if (!html) return ''
  return String(html).replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, id) => {
    if (ghlUrls[id] && String(ghlUrls[id]).trim()) return String(ghlUrls[id]).trim()
    if (assetsById[id]) return assetsById[id]
    if (id === 'logo') return logoSrc || `[image:${id}]`
    return `[image:${id}]`
  })
}

function promptVersions(cdo) {
  const p = cdo?.provenance || {}
  return {
    understanding: p.understanding?.promptVersion || null,
    strategy: p.strategy?.promptVersion || null,
    creative_director: p.creative_director?.promptVersion || null,
    blueprint: p.blueprint?.promptVersion || null,
    validation: p.validation?.promptVersion || null,
    defaults: p.defaultsVersion || cdo?.seedDefaults?.version || null,
    assembler: cdo?.assemblerVersion || null,
    schema: cdo?.schemaVersion ?? null,
  }
}

// Build the single-generation artifact from prepared rows.
//   cdo:     the assembled Creative Directive (creative_directives.directive) | null
//   review:  the logical review object | null
//   project: the raw project row's `data` (projects.data) | null
export function buildSingleArtifact({ cdo, review, project, fleetContext, generatedAt } = {}) {
  const rollup = cdo?.rollup || {}
  const pv = promptVersions(cdo)

  const html = project?.htmlTemplate
    ? {
        template: project.htmlTemplate,
        rendered: substituteTokens(project.htmlTemplate, {
          assetsById: project.assetsById || {},
          ghlUrls: project.ghlUrls || {},
          logoSrc: project.refinedLogo || project.logoUrl || null,
        }),
      }
    : null

  const screenshots = project?.thumb ? { thumbnail_dataUri: project.thumb } : null

  return {
    artifact: 'velpi-cil-review-export',
    format: 'single',
    version: EXPORT_VERSION,
    cdoSchemaVersion: cdo?.schemaVersion ?? null,
    reviewSchemaVersion: review?.reviewVersion ?? null,
    generatedAt: generatedAt || null,
    instructions: SINGLE_INSTRUCTIONS,
    field_map: FIELD_MAP,
    business: {
      name: cdo?.businessName || project?.bizName || null,
      url: project?.sourceUrl || project?.input || null,
      niche: cdo?.creative_direction?.premium_tier ? (cdo?.design_dna?.tier || null) : (cdo?.market_positioning?.category || null),
      tier: cdo?.creative_direction?.premium_tier || null,
    },
    build: {
      createdAt: cdo?.createdAt || project?.savedAt || null,
      model: cdo?.provenance?.blueprint?.model || 'claude-sonnet-4-5',
      tokens: rollup.tokens || null,
      latency_ms: rollup.latency_ms_total ?? null,
      mode: cdo?.mode || null,
      imagesMeta: project?.imagesMeta || null,
    },
    prompt_versions: pv,
    creative_directive: cdo || null,
    validation: cdo ? { report: cdo.validation || null, internal_critique: cdo.internal_critique || null, confidence: cdo.confidence || null, revisions: cdo.revisions || [] } : null,
    defaults: { seedDefaults: cdo?.seedDefaults || null },
    overrides: rollup.overrides_detected || [],
    metrics: { rollup, fleet_context: fleetContext || null },
    developer_review: review ? { flag: review.flag ?? null, scores: review.scores || {}, tags: review.tags || {}, notes: review.notes || '', completeness: reviewCompleteness(review) } : null,
    html,
    screenshots,
    security: SECURITY_NOTE,
  }
}

// Build the batch artifact from many assembled rows + their reviews.
//   rows: [{ directive (cdo), review }]
//   metrics: computeFleetMetrics output over the selection
export function buildBatchArtifact({ rows = [], metrics = null, selection = {}, includeHtml = false, generatedAt } = {}) {
  const runs = rows.map(({ directive: cdo, review }) => {
    const rollup = cdo?.rollup || {}
    const base = {
      runId: cdo?.id || null,
      business: cdo?.businessName || null,
      niche: cdo?.design_dna?.tier || null,
      tier: cdo?.creative_direction?.premium_tier || null,
      directive_summary: {
        thesis: cdo?.creative_direction?.creative_thesis || null,
        archetype: cdo?.creative_direction?.brand_archetype?.primary || null,
        signature_moment: cdo?.signature_moment?.name || null,
        dna: cdo?.design_dna?.descriptors || [],
      },
      validation_summary: {
        passed: cdo?.validation?.passed ?? null,
        score: cdo?.validation?.score ?? null,
        issues: (cdo?.validation?.issues || []).slice(0, 5),
      },
      developer_review: review ? { flag: review.flag ?? null, scores: review.scores || {}, tags: review.tags || {}, notes: review.notes || '', completeness: reviewCompleteness(review) } : null,
      rollup,
      prompt_versions: promptVersions(cdo),
    }
    if (includeHtml && cdo) base.html_available = true
    return base
  })

  return {
    artifact: 'velpi-cil-review-batch',
    format: 'batch',
    version: EXPORT_VERSION,
    generatedAt: generatedAt || null,
    count: runs.length,
    selection,
    instructions: BATCH_INSTRUCTIONS,
    field_map: FIELD_MAP,
    fleet_metrics: metrics,
    runs,
    security: SECURITY_NOTE,
  }
}
