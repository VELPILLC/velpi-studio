import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Single Supabase client. Used ONLY to cache extracted color palettes per domain.
//
// Run this once in the Supabase SQL editor to create the table:
//
//   create table if not exists domain_palettes (
//     domain      text primary key,
//     palette     jsonb,
//     updated_at  timestamptz default now()
//   );
//
// The app degrades gracefully (try/catch) if the table does not exist yet.
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
