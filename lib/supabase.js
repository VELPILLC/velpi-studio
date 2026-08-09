import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Two Supabase clients:
// - `supabase` (anon key, NEXT_PUBLIC_SUPABASE_ANON_KEY) — cached color
//   palettes per domain and the saved Design Styles library. These tables
//   carry no sensitive data and are fine for the anon role to touch.
// - `supabaseAdmin` (service role key, SUPABASE_SERVICE_ROLE_KEY — SERVER
//   ONLY, never a NEXT_PUBLIC_ var) — used for `projects`, `creative_reviews`,
//   and the project-images Storage bucket, all of which have RLS enabled
//   with an explicit anon-deny policy (see below). The service role bypasses
//   RLS, which is exactly why this key must never reach client code: only
//   import it from app/api/**/route.js or this file's own server-side
//   functions, never from a 'use client' component.
//
// Run this once in the Supabase SQL editor to create the tables:
//
//   create table if not exists domain_palettes (
//     domain      text primary key,
//     palette     jsonb,
//     updated_at  timestamptz default now()
//   );
//
//   create table if not exists design_styles (
//     id          uuid default gen_random_uuid() primary key,
//     name        text not null,
//     niches      text default '',
//     content     text not null,
//     created_at  timestamptz default now()
//   );
//
//   create table if not exists projects (
//     id          uuid default gen_random_uuid() primary key,
//     name        text not null,
//     data        jsonb not null,
//     created_at  timestamptz default now()
//   );
//   -- if the table already exists without niches:
//   -- alter table design_styles add column if not exists niches text default '';
//
// RLS: `projects` and `creative_reviews` hold real client data (contact
// info, reviews, internal dev critique) and were previously reachable by
// anyone holding the (public, browser-bundled) anon key, since RLS was off.
// All server-side access to these two tables now goes through
// `supabaseAdmin`, so RLS can be enabled with a policy that denies anon
// everything:
//
//   alter table public.projects enable row level security;
//   alter table public.creative_reviews enable row level security;
//
//   create policy "projects deny anon" on public.projects
//     for all to anon using (false) with check (false);
//   create policy "creative_reviews deny anon" on public.creative_reviews
//     for all to anon using (false) with check (false);
//
// Storage bucket for saved-project images (run once — SQL editor, or
// Dashboard -> Storage -> New bucket named "project-images", Public bucket).
// Embedding AI-enhanced/generated images and the refined logo as base64 in
// projects.data pushed the /api/projects request body (browser -> Vercel
// function) past Vercel's serverless payload limit on heavier runs (413).
// Base64 assets are now uploaded here before saving and swapped for their
// public URL. uploadProjectAsset() uses `supabaseAdmin` (service role
// bypasses RLS/storage policies entirely), so no anon-insert policy is
// needed — only a public-read policy so the resulting URLs load for site
// visitors:
//
//   insert into storage.buckets (id, name, public)
//   values ('project-images', 'project-images', true)
//   on conflict (id) do nothing;
//
//   create policy "project-images public read" on storage.objects
//     for select using (bucket_id = 'project-images');
//
// The app degrades gracefully (try/catch) if the tables do not exist yet.
//
// Next.js's App Router patches global fetch() to auto-cache responses via its
// Data Cache — this applies even to fetches made internally by supabase-js,
// and `export const dynamic = 'force-dynamic'` on a route does not reliably
// stop it. Without an explicit no-store override here, a query can get
// cached with a stale result (e.g. "0 rows" from before a row existed) and
// keep serving that same stale answer indefinitely for the same query shape,
// regardless of what actually changes in the database afterward.
const noStoreFetch = (url, options) => fetch(url, { ...options, cache: 'no-store' })

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: noStoreFetch } })
  : null

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { global: { fetch: noStoreFetch } })
  : null

export async function getSavedPalette(domain) {
  if (!supabase || !domain) return null
  try {
    const { data, error } = await supabase
      .from('domain_palettes')
      .select('palette')
      .eq('domain', domain)
      .maybeSingle()
    if (error) return null
    return data?.palette || null
  } catch (_) {
    return null
  }
}

export async function savePalette(domain, palette) {
  if (!supabase || !domain || !palette) return
  try {
    await supabase
      .from('domain_palettes')
      .upsert({ domain, palette, updated_at: new Date().toISOString() }, { onConflict: 'domain' })
  } catch (_) {
    // ignore — palette caching is best-effort
  }
}

// ── Design Styles library ─────────────────────────────────────────────────────

export async function listStyles() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('design_styles')
      .select('id, name, niches, content, created_at')
      .order('created_at', { ascending: false })
    if (error) return []
    return data || []
  } catch (_) {
    return []
  }
}

export async function saveStyle(name, content, niches = '') {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('design_styles')
    .insert({ name, content, niches })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteStyle(id) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('design_styles').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Project library (saved builds — reloadable & refinable) ─────────────────

export async function listProjects() {
  if (!supabaseAdmin) return []
  try {
    // Arrow-selectors pull gallery fields out of the jsonb blob without
    // shipping the full multi-MB payload for every row.
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, created_at, thumb:data->>thumb, niche:data->>niche, sourceUrl:data->>sourceUrl')
      .order('created_at', { ascending: false })
    if (error) return []
    return data || []
  } catch (_) {
    return []
  }
}

export async function getProject(id) {
  if (!supabaseAdmin) throw new Error('Supabase service role is not configured.')
  const { data, error } = await supabaseAdmin.from('projects').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function saveProject(name, data) {
  if (!supabaseAdmin) throw new Error('Supabase service role is not configured.')
  const { data: row, error } = await supabaseAdmin
    .from('projects')
    .insert({ name, data })
    .select('id, name, created_at')
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function deleteProject(id) {
  if (!supabaseAdmin) throw new Error('Supabase service role is not configured.')
  const { error } = await supabaseAdmin.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Project image storage (base64 -> public URL, before saving to `projects`) ─

const PROJECT_IMAGES_BUCKET = 'project-images'

// Mints a one-time signed upload URL for the project-images bucket, so the
// BROWSER can PUT the image bytes straight to Supabase Storage. The bytes
// never pass through a Vercel function — routing multi-MB base64 through
// /api/* was what hit Vercel's ~4.5MB request-body limit (413): once bundled
// into the /api/projects save, and again per-image when the old upload route
// received the whole data URI in its body. Only this small JSON handshake
// (path + contentType in, signedUrl + publicUrl out) touches the server.
// Uses supabaseAdmin, so the bucket needs no anon-insert policy.
export async function createProjectAssetUploadUrl(path, contentType) {
  if (!supabaseAdmin) return null
  const type = String(contentType || '')
  if (!/^image\//.test(type)) return null
  const ext = type.includes('png') ? 'png'
    : type.includes('webp') ? 'webp'
      : type.includes('jpeg') || type.includes('jpg') ? 'jpg'
        : type.includes('svg') ? 'svg'
          : 'bin'
  const key = `${(path || 'asset').replace(/[^a-zA-Z0-9/_-]+/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { data, error } = await supabaseAdmin.storage
    .from(PROJECT_IMAGES_BUCKET)
    .createSignedUploadUrl(key)
  if (error) throw new Error(error.message)
  const { data: pub } = supabaseAdmin.storage.from(PROJECT_IMAGES_BUCKET).getPublicUrl(key)
  return { signedUrl: data?.signedUrl || null, publicUrl: pub?.publicUrl || null }
}
