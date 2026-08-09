import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Single Supabase client. Used for (1) cached color palettes per domain and
// (2) the saved Design Styles library (DESIGN.md files pasted by the user).
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
// Storage bucket for saved-project images (run once — SQL editor, or
// Dashboard -> Storage -> New bucket named "project-images", Public bucket).
// Embedding AI-enhanced/generated images and the refined logo as base64 in
// projects.data pushed the /api/projects request body (browser -> Vercel
// function) past Vercel's serverless payload limit on heavier runs (413).
// Base64 assets are now uploaded here before saving and swapped for their
// public URL; only the anon key is configured in this app (no service role),
// so the bucket needs a public-read + anon-insert policy:
//
//   insert into storage.buckets (id, name, public)
//   values ('project-images', 'project-images', true)
//   on conflict (id) do nothing;
//
//   create policy "project-images public read" on storage.objects
//     for select using (bucket_id = 'project-images');
//   create policy "project-images anon upload" on storage.objects
//     for insert with check (bucket_id = 'project-images');
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
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    })
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
  if (!supabase) return []
  try {
    // Arrow-selectors pull gallery fields out of the jsonb blob without
    // shipping the full multi-MB payload for every row.
    const { data, error } = await supabase
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
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function saveProject(name, data) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data: row, error } = await supabase
    .from('projects')
    .insert({ name, data })
    .select('id, name, created_at')
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function deleteProject(id) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Project image storage (base64 -> public URL, before saving to `projects`) ─

const PROJECT_IMAGES_BUCKET = 'project-images'

// Uploads a single "data:<mime>;base64,<...>" string to Storage and returns
// its public URL. Used only at save time — live preview/export during the
// session still uses the base64 straight from the image API, untouched.
export async function uploadProjectAsset(dataUri, path) {
  if (!supabase) return null
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUri || '')
  if (!match) return null
  const contentType = match[1]
  const buffer = Buffer.from(match[2], 'base64')
  const ext = contentType.includes('png') ? 'png'
    : contentType.includes('webp') ? 'webp'
      : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg'
        : 'bin'
  const key = `${(path || 'asset').replace(/[^a-zA-Z0-9/_-]+/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .upload(key, buffer, { contentType, upsert: true })
  if (uploadError) throw new Error(uploadError.message)
  const { data } = supabase.storage.from(PROJECT_IMAGES_BUCKET).getPublicUrl(key)
  return data?.publicUrl || null
}
