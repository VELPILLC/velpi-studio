// Persistent cross-project asset library. Every generated/enhanced image
// that lands in Supabase Storage at save time gets INDEXED here (url +
// subject + niche + tags), building a growing pool future generations can
// draw from: the analyze model sees matching candidates and may choose
// action:"reuse" per-slot when one genuinely fits — fresh generation stays
// the default, reuse is a judgment call, never a rule.
//
// Run once in the Supabase SQL editor (service-role access only, matching
// the RLS posture of projects/creative_reviews):
//
//   create table if not exists asset_library (
//     id          uuid default gen_random_uuid() primary key,
//     url         text not null unique,
//     subject     text,
//     section     text,
//     niche       text,
//     business    text,
//     tags        jsonb default '[]'::jsonb,
//     created_at  timestamptz default now()
//   );
//   create index if not exists asset_library_created_idx on asset_library (created_at desc);
//
//   alter table asset_library enable row level security;
//   create policy "asset_library deny anon" on asset_library
//     for all to anon using (false) with check (false);
//
// Best-effort by contract: a missing table or unconfigured service role
// silently no-ops — the generation pipeline never depends on the library.

import { supabaseAdmin } from './supabase'

// Index a batch of saved assets. records: [{ url, subject, section, niche, business, tags }]
export async function indexAssets(records) {
  if (!supabaseAdmin || !Array.isArray(records) || !records.length) return { indexed: 0 }
  const rows = records
    .filter(r => typeof r.url === 'string' && /^https?:\/\//.test(r.url))
    .map(r => ({
      url: r.url,
      subject: r.subject || null,
      section: r.section || null,
      niche: r.niche || null,
      business: r.business || null,
      tags: Array.isArray(r.tags) ? r.tags.filter(Boolean).map(t => String(t).toLowerCase()).slice(0, 12) : [],
    }))
  if (!rows.length) return { indexed: 0 }
  try {
    const { error } = await supabaseAdmin.from('asset_library').upsert(rows, { onConflict: 'url' })
    if (error) return { indexed: 0, reason: error.message }
    return { indexed: rows.length }
  } catch (e) {
    return { indexed: 0, reason: e?.message || 'unknown' }
  }
}

// Find candidate images whose tags/subject/niche words appear in the given
// text (scraped title/description/content — available BEFORE analyze runs,
// which is what lets the analyze model make the reuse decision itself).
export async function findAssetCandidates(text, limit = 12) {
  if (!supabaseAdmin || !text) return []
  try {
    const { data, error } = await supabaseAdmin
      .from('asset_library')
      .select('url, subject, section, niche, tags')
      .order('created_at', { ascending: false })
      .limit(300)
    if (error || !data?.length) return []
    const hay = String(text).toLowerCase()
    const scored = data.map(row => {
      let score = 0
      const words = [
        ...(Array.isArray(row.tags) ? row.tags : []),
        ...String(row.niche || '').toLowerCase().split(/[^a-z]+/),
        ...String(row.subject || '').toLowerCase().split(/[^a-z]+/),
      ].filter(w => w && w.length > 3)
      for (const w of new Set(words)) if (hay.includes(w)) score++
      return { row, score }
    })
    return scored
      .filter(x => x.score >= 2) // needs real overlap, not one stray word
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.row)
  } catch (_) {
    return []
  }
}
