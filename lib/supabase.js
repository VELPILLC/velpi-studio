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
// The app degrades gracefully (try/catch) if the tables do not exist yet.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

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
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, created_at')
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
