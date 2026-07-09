// Creative Director Review System — deterministic checks core (Phase 1).
//
// Every function here produces MEASURED evidence: real math (WCAG contrast),
// real extraction (headings, alt text, meta tags, tel: links) from the actual
// generated HTML. No model calls, no estimates. Pure + node-testable.
//
// House rule (docs + build spec): a fabricated score is worse than a missing
// one. Anything this module cannot genuinely measure is simply not measured
// here — the engine marks such categories "not_evaluated" instead.

export const REVIEW_ENGINE_VERSION = 'director-review@1.0.0'

// ── Letter grades ─────────────────────────────────────────────────────────────
export function gradeFor(score) {
  if (score == null || Number.isNaN(score)) return null
  const s = Math.max(0, Math.min(100, score))
  if (s >= 97) return 'A+'
  if (s >= 93) return 'A'
  if (s >= 90) return 'A-'
  if (s >= 87) return 'B+'
  if (s >= 83) return 'B'
  if (s >= 80) return 'B-'
  if (s >= 77) return 'C+'
  if (s >= 73) return 'C'
  if (s >= 70) return 'C-'
  if (s >= 67) return 'D+'
  if (s >= 63) return 'D'
  if (s >= 60) return 'D-'
  return 'F'
}

// ── Color math (WCAG) ─────────────────────────────────────────────────────────
export function parseColor(value) {
  if (!value) return null
  const v = String(value).trim().toLowerCase()
  let m = v.match(/^#([0-9a-f]{3})$/)
  if (m) {
    const h = m[1]
    return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16) }
  }
  m = v.match(/^#([0-9a-f]{6})$/)
  if (m) {
    const h = m[1]
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
  }
  m = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (m) {
    const a = m[4] === undefined ? 1 : parseFloat(m[4])
    if (a < 0.99) return null // translucent — true backdrop unknown, refuse to guess
    return { r: +m[1], g: +m[2], b: +m[3] }
  }
  const NAMED = { white: '#ffffff', black: '#000000' }
  if (NAMED[v]) return parseColor(NAMED[v])
  return null
}

export function relLuminance({ r, g, b }) {
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(colorA, colorB) {
  const la = relLuminance(colorA)
  const lb = relLuminance(colorB)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

// ── HTML utilities ────────────────────────────────────────────────────────────
// Replace multi-megabyte data: URIs with short placeholders so the judge payload
// stays small and evidence quotes come from real page content, not base64 noise.
export function stripDataUris(html) {
  return String(html || '').replace(/(["'(])data:[^"')]{64,}(["')])/g, '$1[image-data]$2')
}

function textOf(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── CSS same-rule contrast pairs ─────────────────────────────────────────────
// Only pairs declared in the SAME rule are measured (that pairing is certain).
// Cross-rule inheritance needs a real renderer — out of scope, stated honestly.
export function extractCssRules(html) {
  const styles = [...String(html || '').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
  const noMedia = styles.replace(/@media[^{]*\{([\s\S]*?)\}\s*(?=(\.|@|#|\w|$))/g, '$1') // flatten one level of @media
  const rules = []
  const re = /([^{}@]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(noMedia))) {
    const selector = m[1].trim().replace(/\s+/g, ' ')
    const body = m[2]
    const get = prop => {
      const d = body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i'))
      return d ? d[1].trim() : null
    }
    rules.push({ selector, color: get('color'), background: get('background-color') || firstColorToken(get('background')) })
  }
  return rules
}

function firstColorToken(backgroundValue) {
  if (!backgroundValue) return null
  if (/gradient|url\(/i.test(backgroundValue)) return null // not a flat color — cannot measure honestly
  const tok = backgroundValue.match(/#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)|\bwhite\b|\bblack\b/)
  return tok ? tok[0] : null
}

export function checkContrast(html) {
  const rules = extractCssRules(html)
  const pairs = []
  for (const r of rules) {
    if (!r.color || !r.background) continue
    const fg = parseColor(r.color)
    const bg = parseColor(r.background)
    if (!fg || !bg) continue
    const ratio = Math.round(contrastRatio(fg, bg) * 100) / 100
    pairs.push({ selector: r.selector, color: r.color, background: r.background, ratio, passesAA: ratio >= 4.5 })
  }
  return { measured: pairs.length, failing: pairs.filter(p => !p.passesAA), pairs }
}

// ── Headings ──────────────────────────────────────────────────────────────────
export function checkHeadings(html) {
  const seq = [...String(html || '').matchAll(/<h([1-6])[\s>]/gi)].map(m => +m[1])
  const h1Count = seq.filter(l => l === 1).length
  const jumps = []
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] > seq[i - 1] + 1) jumps.push(`h${seq[i - 1]} → h${seq[i]} (skips h${seq[i - 1] + 1})`)
  }
  return { sequence: seq, h1Count, jumps }
}

// ── Images / alt text ─────────────────────────────────────────────────────────
export function checkAltText(html) {
  const imgs = [...String(html || '').matchAll(/<img\b[^>]*>/gi)].map(m => m[0])
  const withAlt = imgs.filter(t => /\balt\s*=\s*["'][^"']+["']/i.test(t))
  const missing = imgs.filter(t => !/\balt\s*=\s*["'][^"']+["']/i.test(t))
    .map(t => t.replace(/(src\s*=\s*["'])[^"']{40,}(["'])/i, '$1…$2').slice(0, 120))
  return { total: imgs.length, withAlt: withAlt.length, missing }
}

// ── SEO facts ─────────────────────────────────────────────────────────────────
export function checkSeoFacts(html) {
  const h = String(html || '')
  const title = (h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || null
  const metaDescription = (h.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || h.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i) || [])[1] || null
  return {
    title,
    titleLength: title ? title.length : 0,
    metaDescription,
    metaDescriptionLength: metaDescription ? metaDescription.length : 0,
    viewport: /<meta[^>]+name=["']viewport["']/i.test(h),
    ogTitle: /<meta[^>]+property=["']og:title["']/i.test(h),
    lang: /<html[^>]+lang=/i.test(h),
    nav: /<nav[\s>]/i.test(h),
    footer: /<footer[\s>]/i.test(h),
    header: /<header[\s>]/i.test(h),
  }
}

// ── Conversion facts ──────────────────────────────────────────────────────────
export function checkConversionFacts(html) {
  const h = String(html || '')
  const telLinks = (h.match(/href=["']tel:/gi) || []).length
  const mailtoLinks = (h.match(/href=["']mailto:/gi) || []).length
  const text = textOf(h)
  const phoneTexts = [...new Set((text.match(/(?:\(\d{3}\)\s*|\b\d{3}[-.\s])\d{3}[-.\s]\d{4}\b/g) || []))]
  const ctaCandidates = (h.match(/<a\b[^>]*class=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>/gi) || []).length
    + (h.match(/<button\b/gi) || []).length
  const leftoverTokens = (h.match(/%%IMG:[a-z0-9_]+%%/gi) || []).length
  return {
    telLinks, mailtoLinks, phoneTexts, ctaCandidates, leftoverTokens,
    phoneWithoutTelLink: phoneTexts.length > 0 && telLinks === 0,
    wordCount: text.split(' ').filter(Boolean).length,
  }
}

export function collectFacts(html) {
  return {
    contrast: checkContrast(html),
    headings: checkHeadings(html),
    alt: checkAltText(html),
    seo: checkSeoFacts(html),
    conversion: checkConversionFacts(html),
  }
}

// ── Deterministic categories (score derived from measurements only) ──────────
function rec(fix, refinement_prompt, impact, rationale) {
  return { fix, refinement_prompt, impact: { level: impact, rationale } }
}

export function buildAccessibilityCategory(facts) {
  const evidence = []
  const deductions = []
  const recs = []
  let score = 100

  const c = facts.contrast
  evidence.push(`Contrast: ${c.measured} same-rule color/background pairs measured; ${c.failing.length} fail WCAG AA (4.5:1).`)
  for (const f of c.failing.slice(0, 3)) {
    const pts = 15
    score -= pts
    deductions.push(`-${pts}: "${f.selector}" sets color ${f.color} on background ${f.background} — ratio ${f.ratio}:1, below WCAG AA 4.5:1.`)
    recs.push(rec(
      `Increase contrast for "${f.selector}" (currently ${f.ratio}:1).`,
      `Increase the text/background contrast for the "${f.selector}" element so it meets WCAG AA (at least 4.5:1) — keep the brand palette, darken the text or lighten/darken the background as needed.`,
      'high', 'Failing contrast makes text illegible for low-vision visitors and fails accessibility audits.'
    ))
  }

  const a = facts.alt
  if (a.total > 0) {
    evidence.push(`Images: ${a.withAlt}/${a.total} have non-empty alt text.`)
    if (a.missing.length) {
      const pts = Math.min(20, Math.round((a.missing.length / a.total) * 20))
      score -= pts
      deductions.push(`-${pts}: ${a.missing.length} of ${a.total} <img> tags have no alt text (e.g. ${a.missing[0]}).`)
      recs.push(rec(
        `Add descriptive alt text to ${a.missing.length} image(s).`,
        `Add a short, descriptive alt attribute to every <img> that is missing one — describe what the photo shows for this business.`,
        'medium', 'Missing alt text blocks screen readers and loses image SEO value.'
      ))
    }
  } else {
    evidence.push('Images: none found in the document.')
  }

  const hd = facts.headings
  evidence.push(`Headings: sequence ${hd.sequence.map(l => 'h' + l).join(' ') || '(none)'}; ${hd.h1Count} h1.`)
  if (hd.h1Count === 0) {
    score -= 15
    deductions.push('-15: no <h1> found — the page has no top-level heading.')
    recs.push(rec('Add a single <h1> to the hero headline.',
      'Make the main hero headline an <h1> element (exactly one on the page).',
      'high', 'A missing h1 harms both screen-reader navigation and SEO.'))
  } else if (hd.h1Count > 1) {
    score -= 10
    deductions.push(`-10: ${hd.h1Count} <h1> elements found — should be exactly one.`)
    recs.push(rec('Keep only one <h1>; demote the others.',
      'Keep the hero headline as the only <h1> and demote all other <h1> elements to <h2>.',
      'medium', 'Multiple h1s dilute document structure for assistive tech and search engines.'))
  }
  if (hd.jumps.length) {
    const pts = Math.min(10, hd.jumps.length * 5)
    score -= pts
    deductions.push(`-${pts}: heading level jump(s): ${hd.jumps.join('; ')}.`)
    recs.push(rec('Fix skipped heading levels.',
      `Fix the heading hierarchy so levels never skip (found: ${hd.jumps.join('; ')}).`,
      'low', 'Skipped levels confuse screen-reader outline navigation.'))
  }

  if (!facts.seo.viewport) {
    score -= 15
    deductions.push('-15: no viewport meta tag — the page will render zoomed-out on phones.')
    recs.push(rec('Add the viewport meta tag.',
      'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.',
      'high', 'Without it every mobile visitor gets an unusable desktop-scaled page.'))
  } else {
    evidence.push('Viewport meta tag: present.')
  }
  if (!facts.seo.lang) {
    score -= 4
    deductions.push('-4: <html> has no lang attribute.')
    recs.push(rec('Add lang="en" to <html>.', 'Add lang="en" to the <html> element.', 'low', 'Screen readers use lang to pick pronunciation rules.'))
  }

  score = Math.max(0, Math.round(score))
  return {
    status: 'evaluated', method: 'deterministic — computed from the page (WCAG math, DOM extraction)',
    score, grade: gradeFor(score),
    explanation: `Measured checks: same-rule contrast pairs, alt-text coverage, heading hierarchy, viewport and lang attributes. Cross-rule/inherited contrast requires a renderer and is not claimed.`,
    evidence, deductions,
    recommendations: recs,
    evidence_verified: true,
  }
}

export function buildSeoCategory(facts) {
  const s = facts.seo
  const evidence = []
  const deductions = []
  const recs = []
  let score = 100

  if (!s.title) {
    score -= 25
    deductions.push('-25: no <title> tag found.')
    recs.push(rec('Add a descriptive <title>.', 'Add a concise, descriptive <title> tag naming the business and its main service/city.', 'high', 'The title is the single strongest on-page SEO element and the search-result headline.'))
  } else {
    evidence.push(`<title> present (${s.titleLength} chars): "${s.title.slice(0, 80)}"`)
    if (s.titleLength < 10 || s.titleLength > 65) {
      score -= 8
      deductions.push(`-8: title length ${s.titleLength} chars is outside the 10–65 range that displays fully in results.`)
      recs.push(rec('Rewrite the title to 10–65 chars.', `Rewrite the <title> to 10–65 characters, keeping the business name and primary service.`, 'medium', 'Truncated or thin titles lower click-through from search results.'))
    }
  }

  if (!s.metaDescription) {
    score -= 20
    deductions.push('-20: no meta description found.')
    recs.push(rec('Add a meta description.', 'Add a <meta name="description"> of 120–160 characters summarizing the business, services, and location with a reason to click.', 'high', 'The description is the search-result snippet; missing means Google improvises.'))
  } else {
    evidence.push(`Meta description present (${s.metaDescriptionLength} chars).`)
    if (s.metaDescriptionLength < 50 || s.metaDescriptionLength > 165) {
      score -= 6
      deductions.push(`-6: meta description length ${s.metaDescriptionLength} outside 50–165.`)
      recs.push(rec('Resize the meta description to 120–160 chars.', 'Rewrite the meta description to 120–160 characters.', 'low', 'Snippets outside the range get truncated or padded by the engine.'))
    }
  }

  const hd = facts.headings
  if (hd.h1Count === 0) { score -= 15; deductions.push('-15: no <h1>.') }
  else if (hd.h1Count > 1) { score -= 8; deductions.push(`-8: ${hd.h1Count} <h1> elements.`) }
  else evidence.push('Exactly one <h1>: ✓')

  const a = facts.alt
  if (a.total > 0 && a.missing.length) {
    const pts = Math.min(12, Math.round((a.missing.length / a.total) * 12))
    score -= pts
    deductions.push(`-${pts}: ${a.missing.length}/${a.total} images missing alt text (image SEO).`)
  } else if (a.total > 0) {
    evidence.push(`All ${a.total} images have alt text: ✓`)
  }

  if (!s.viewport) { score -= 10; deductions.push('-10: no viewport meta (mobile-friendliness ranking signal).') }
  if (!s.nav || !s.footer) {
    score -= 6
    deductions.push(`-6: missing semantic landmark(s): ${[!s.nav && '<nav>', !s.footer && '<footer>'].filter(Boolean).join(', ')}.`)
    recs.push(rec('Use semantic <nav>/<footer> landmarks.', 'Wrap the navigation in a <nav> element and the footer in a <footer> element.', 'low', 'Semantic landmarks help crawlers and assistive tech map the page.'))
  } else {
    evidence.push('Semantic landmarks <nav> and <footer>: present.')
  }
  if (!s.ogTitle) {
    score -= 4
    deductions.push('-4: no Open Graph tags (og:title) — link shares show no rich preview.')
    recs.push(rec('Add og:title/og:description.', 'Add Open Graph meta tags (og:title, og:description) matching the page title and description.', 'low', 'OG tags control how the site looks when shared on social/messaging apps.'))
  }

  score = Math.max(0, Math.round(score))
  return {
    status: 'evaluated', method: 'deterministic — inspected actual meta tags, headings, alt attributes, landmarks',
    score, grade: gradeFor(score),
    explanation: 'On-page factors inspected in the DOM. Off-page/infrastructure items (canonical URL, sitemap, robots, structured data) are out of scope for a single-file GoHighLevel embed and are not scored.',
    evidence, deductions,
    recommendations: recs,
    evidence_verified: true,
  }
}

// ── Evidence verification (anti-hallucination gate) ──────────────────────────
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[""]/g, '"').replace(/['']/g, "'").trim()

export function verifyEvidence(html, quotes) {
  const hay = norm(stripDataUris(html)) // match against what the judge was shown
  const verified = []
  const failed = []
  for (const q of quotes || []) {
    const needle = norm(q).replace(/^…|…$/g, '').replace(/^\.\.\.|\.\.\.$/g, '').trim()
    if (needle.length >= 8 && hay.includes(needle)) verified.push(q)
    else failed.push(q)
  }
  return { verified, failed }
}

// ── Aggregation + prioritization ─────────────────────────────────────────────
export function aggregateOverall(categories) {
  const evaluated = Object.entries(categories)
    .filter(([k, v]) => k !== 'overall_quality' && v && v.status === 'evaluated' && typeof v.score === 'number')
  if (!evaluated.length) return { status: 'not_evaluated', reason: 'no categories were evaluated', score: null, grade: null }
  const score = Math.round(evaluated.reduce((s, [, v]) => s + v.score, 0) / evaluated.length)
  return {
    status: 'evaluated', method: 'deterministic — equal-weight mean of all evaluated categories',
    score, grade: gradeFor(score),
    explanation: `Equal-weight mean of ${evaluated.length} evaluated categories (unevaluated categories excluded, never assumed).`,
    evidence: [`Formula: (${evaluated.map(([k, v]) => `${k}:${v.score}`).join(' + ')}) / ${evaluated.length} = ${score}`],
    deductions: [], recommendations: [], evidence_verified: true,
  }
}

const IMPACT_RANK = { high: 3, medium: 2, low: 1 }

export function prioritize(categories, cap = 12) {
  const out = []
  for (const [key, cat] of Object.entries(categories)) {
    if (!cat || cat.status !== 'evaluated') continue
    for (const r of cat.recommendations || []) {
      out.push({
        category: key,
        score: cat.score,
        impact: r.impact?.level || 'medium',
        impact_rationale: r.impact?.rationale || '',
        fix: r.fix,
        refinement_prompt: r.refinement_prompt,
      })
    }
  }
  out.sort((x, y) => (IMPACT_RANK[y.impact] || 0) - (IMPACT_RANK[x.impact] || 0) || x.score - y.score)
  return out.slice(0, cap)
}

export function notEvaluated(reason, method) {
  return {
    status: 'not_evaluated', reason,
    method: method || 'no verification method implemented',
    score: null, grade: null, explanation: null, evidence: [], deductions: [], recommendations: [],
    evidence_verified: null,
  }
}
