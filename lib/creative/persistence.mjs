// Creative Intelligence Layer — Directive Store (Phase 1 / shadow only).
//
// Best-effort persistence of Stage 1 shadow output for later inspection. It is
// STRICTLY non-fatal: if Supabase is unconfigured or the table does not exist,
// it silently no-ops (the route still logs to the server console). It never
// throws and never affects the production pipeline.
//
// Run this once in the Supabase SQL editor to enable durable shadow records:
//
//   create table if not exists creative_directives (
//     id            uuid default gen_random_uuid() primary key,
//     project_id    uuid,
//     niche         text,
//     tier          text,
//     stage         text,           -- 'understanding' in Phase 1
//     schema_version int,
//     prompt_version text,
//     mode          text,           -- 'shadow'
//     directive     jsonb not null, -- the partial CDO (understanding slice)
//     meta          jsonb,          -- timings, validation, inputs hash
//     created_at    timestamptz default now()
//   );
//
// Imported only by the API route (never by unit tests).

import { supabase } from '../supabase.js'

// Generic best-effort shadow-record insert. Non-fatal by contract.
async function saveShadowStage({ id, stage, niche, tier, directive, meta }) {
  if (!supabase) return { saved: false, reason: 'supabase-not-configured' }
  try {
    const row = {
      niche: niche || null,
      tier: tier || null,
      stage,
      schema_version: meta?.schemaVersion ?? null,
      prompt_version: meta?.promptVersion ?? null,
      mode: meta?.mode ?? 'shadow',
      directive,
      meta: meta || {},
    }
    if (id) row.id = id
    const { data, error } = await supabase
      .from('creative_directives')
      .insert(row)
      .select('id')
      .single()
    if (error) return { saved: false, reason: error.message }
    return { saved: true, id: data?.id }
  } catch (e) {
    // Never let persistence break a shadow run.
    return { saved: false, reason: e?.message || 'unknown' }
  }
}

export async function saveShadowUnderstanding({ id, niche, tier, understanding, meta }) {
  return saveShadowStage({
    id, stage: 'understanding', niche, tier,
    directive: { schemaVersion: meta?.schemaVersion ?? null, stage: 'understanding', understanding },
    meta,
  })
}

export async function saveShadowStrategy({ id, niche, tier, strategy, meta }) {
  return saveShadowStage({
    id, stage: 'strategy', niche, tier,
    directive: { schemaVersion: meta?.schemaVersion ?? null, stage: 'strategy', strategy },
    meta,
  })
}

export async function saveShadowDirector({ id, niche, tier, director, meta }) {
  return saveShadowStage({
    id, stage: 'creative_director', niche, tier,
    directive: { schemaVersion: meta?.schemaVersion ?? null, stage: 'creative_director', director },
    meta,
  })
}

export async function saveShadowBlueprint({ id, niche, tier, blueprint, seedDefaults, meta }) {
  return saveShadowStage({
    id, stage: 'blueprint', niche, tier,
    directive: { schemaVersion: meta?.schemaVersion ?? null, stage: 'blueprint', blueprint, seedDefaults },
    meta,
  })
}

export async function saveShadowValidation({ id, niche, tier, result, meta }) {
  return saveShadowStage({
    id, stage: 'validation', niche, tier,
    directive: { schemaVersion: meta?.schemaVersion ?? null, stage: 'validation', ...result },
    meta,
  })
}

// ── Assembled unified Creative Directive (one row per generation) ────────────

export async function saveAssembledDirective({ id, niche, tier, directive }) {
  // The full CDO goes in `directive`; a light `meta` (rollup + provenance)
  // powers the dashboard without fetching the whole payload per row.
  return saveShadowStage({
    id, stage: 'assembled', niche, tier,
    directive,
    meta: {
      schemaVersion: directive?.schemaVersion ?? null,
      businessName: directive?.businessName || null,
      partial: !!directive?.partial,
      rollup: directive?.rollup || null,
      provenance: directive?.provenance || null,
    },
  })
}

// Light list for the dashboard: id, created_at, and the meta rollup only.
export async function listAssembledRuns(limit = 200) {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('creative_directives')
      .select('id, niche, tier, created_at, meta')
      .eq('stage', 'assembled')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data || []
  } catch (_) {
    return []
  }
}

// Full assembled directive by id (for the per-run inspector).
export async function getAssembledRun(id) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('creative_directives')
      .select('*')
      .eq('id', id)
      .eq('stage', 'assembled')
      .maybeSingle()
    if (error) return null
    return data || null
  } catch (_) {
    return null
  }
}

// Full assembled directives (with the CDO payload) for batch export.
export async function listAssembledFull(limit = 100, filters = {}) {
  if (!supabase) return []
  try {
    let q = supabase.from('creative_directives').select('id, niche, tier, created_at, directive').eq('stage', 'assembled')
    if (filters.niche) q = q.ilike('niche', `%${filters.niche}%`)
    if (filters.tier) q = q.eq('tier', filters.tier)
    if (filters.since) q = q.gte('created_at', filters.since)
    q = q.order('created_at', { ascending: false }).limit(Math.min(100, limit))
    const { data, error } = await q
    if (error) return []
    return data || []
  } catch (_) {
    return []
  }
}

// ── Developer reviews (DEV ONLY) ─────────────────────────────────────────────
// See db/creative_reviews.sql. Upsert on (run_id, reviewer) — `run_id` stores
// the build's id whether or not the CIL ever produced a Creative Directive for
// it (see review v2: reviews no longer depend on CIL at all). Best-effort:
// returns { saved:false } when Supabase/table is unavailable — never throws.

export async function getReview(buildId, reviewer = 'dev') {
  if (!supabase || !buildId) return null
  try {
    const { data, error } = await supabase
      .from('creative_reviews')
      .select('*')
      .eq('run_id', buildId)
      .eq('reviewer', reviewer)
      .maybeSingle()
    if (error) return null
    return data || null
  } catch (_) {
    return null
  }
}

export async function saveReview(review) {
  if (!supabase) return { saved: false, reason: 'supabase-not-configured' }
  try {
    const row = {
      run_id: review.buildId || null,
      project_id: review.projectId || null,
      reviewer: review.reviewer || 'dev',
      rating: review.rating || null,
      flags: review.flags || [],
      notes: review.note || '',
      review_version: review.reviewVersion || 2,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('creative_reviews')
      .upsert(row, { onConflict: 'run_id,reviewer' })
      .select()
      .single()
    if (error) return { saved: false, reason: error.message }
    return { saved: true, row: data }
  } catch (e) {
    return { saved: false, reason: e?.message || 'unknown' }
  }
}

export async function listReviews({ limit = 200, rating } = {}) {
  if (!supabase) return []
  try {
    let q = supabase.from('creative_reviews').select('*')
    if (rating) q = q.eq('rating', rating)
    q = q.order('created_at', { ascending: false }).limit(Math.min(500, limit))
    const { data, error } = await q
    if (error) return []
    return data || []
  } catch (_) {
    return []
  }
}

// All reviews joined to a human-readable build name (via projects.name), for
// the plain-markdown export. Never surfaces raw ids — a review whose project
// can't be resolved gets buildName: null (the formatter falls back to
// "Untitled build" rather than printing an id).
export async function listReviewsForExport({ projectId, since, until } = {}) {
  if (!supabase) return []
  try {
    let q = supabase.from('creative_reviews').select('project_id, rating, flags, notes, created_at')
    if (projectId) q = q.eq('project_id', projectId)
    if (since) q = q.gte('created_at', since)
    if (until) q = q.lte('created_at', until)
    q = q.order('created_at', { ascending: false }).limit(1000)
    const { data: reviews, error } = await q
    if (error || !reviews) return []

    const ids = [...new Set(reviews.map(r => r.project_id).filter(Boolean))]
    let names = {}
    if (ids.length) {
      const { data: projects } = await supabase.from('projects').select('id, name').in('id', ids)
      names = Object.fromEntries((projects || []).map(p => [p.id, p.name]))
    }
    return reviews.map(r => ({
      buildName: names[r.project_id] || null,
      rating: r.rating,
      flags: r.flags || [],
      note: r.notes || '',
      createdAt: r.created_at,
    }))
  } catch (_) {
    return []
  }
}
