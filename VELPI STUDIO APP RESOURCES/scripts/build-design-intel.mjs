#!/usr/bin/env node
// Converts the vendored design-intelligence CSVs into the JSON the app
// imports at runtime.
//
// Why a build step instead of parsing CSV in the app: every other preset
// catalog here is a static JSON import (`import manifest from
// '../presets/sections/manifest.json'`), which Next bundles cleanly and
// which works identically on Vercel. Shipping a CSV parser to the runtime
// would add a dependency and a failure mode for data that never changes
// between deploys.
//
// Run after refreshing the CSVs from the source skill:
//   node scripts/build-design-intel.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'presets', 'design-intel')

// RFC4180-ish: quoted fields may contain commas, newlines and "" escapes.
// These files rely on all three, so a naive split() silently corrupts rows.
function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  const src = text.replace(/^﻿/, '').replace(/\r\n/g, '\n')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += ch
      continue
    }
    if (ch === '"') { inQuotes = true; continue }
    if (ch === ',') { row.push(field); field = ''; continue }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    field += ch
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows.filter(r => r.some(c => c.trim() !== ''))
  const keys = header.map(h => h.trim())
  return body.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])))
}

const hexes = s => (String(s).match(/#[0-9A-Fa-f]{6}\b/g) || [])

function build() {
  const out = {}

  // Palettes — full semantic token sets, already WCAG-checked upstream.
  const colors = parseCsv(readFileSync(join(DIR, 'colors.csv'), 'utf8'))
  out.palettes = colors.map(r => ({
    id: `pal-${r.No}`,
    productType: r['Product Type'],
    primary: r.Primary, onPrimary: r['On Primary'],
    secondary: r.Secondary, accent: r.Accent, onAccent: r['On Accent'],
    background: r.Background, foreground: r.Foreground,
    card: r.Card, muted: r.Muted, border: r.Border,
    notes: r.Notes,
  })).filter(p => hexes(p.primary).length)

  // Font pairings — the CSS @import matters: the output contract requires
  // fonts loaded via @import inside the single <style> tag.
  const type = parseCsv(readFileSync(join(DIR, 'typography.csv'), 'utf8'))
  out.pairings = type.map(r => ({
    id: `fp-${r.No}`,
    name: r['Font Pairing Name'],
    category: r.Category,
    heading: r['Heading Font'],
    body: r['Body Font'],
    mood: r['Mood/Style Keywords'],
    bestFor: r['Best For'],
    cssImport: r['CSS Import'],
    notes: r.Notes,
  })).filter(p => p.heading && p.body)

  // Per-category direction: recommended pattern, moods, anti-patterns.
  const reasoning = parseCsv(readFileSync(join(DIR, 'ui-reasoning.csv'), 'utf8'))
  out.reasoning = reasoning.map(r => ({
    id: `ur-${r.No}`,
    category: r.UI_Category,
    pattern: r.Recommended_Pattern,
    stylePriority: r.Style_Priority,
    colorMood: r.Color_Mood,
    typographyMood: r.Typography_Mood,
    effects: r.Key_Effects,
    antiPatterns: r.Anti_Patterns,
  })).filter(r => r.category)

  // Motion: TIMING GUIDANCE ONLY. The snippets are GSAP (JavaScript) and the
  // GoHighLevel output contract forbids JS, so the snippet column is dropped
  // deliberately rather than shipped and never used.
  const motion = parseCsv(readFileSync(join(DIR, 'motion.csv'), 'utf8'))
  out.motionGuidance = motion.map(r => ({
    id: `mo-${r.No}`,
    category: r.Category,
    tier: r['Intensity Tier'],
    trigger: r.Trigger,
    duration: r.Duration,
    easing: r.Easing,
    doThis: r.Do,
    dontDoThis: r["Don't"],
  })).filter(r => r.category)

  for (const [name, rows] of Object.entries(out)) {
    writeFileSync(join(DIR, `${name}.json`), JSON.stringify(rows, null, 0) + '\n')
    console.log(`${name}.json — ${rows.length} rows`)
  }
}

build()
