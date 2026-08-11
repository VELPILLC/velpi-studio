'use client'
import { useState, useEffect, useRef } from 'react'
import LightningBackground from './LightningBackground'
import ReviewExportBar from './dev/ReviewExportBar'
import { isDevReviewClient } from '../lib/creative/flags.mjs'

// Accurate device preview viewports — real widths, not scaled approximations.
// Picked once and recorded here so every build's decisions.md is consistent.
const PREVIEW_VIEWPORTS = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } }

// Vibe question data — kept only so vibeSummary() can reconstruct a readable
// summary from a LOADED project's saved vibe answers. There is no manual entry
// UI anymore: every generation is fully automatic (the agent infers feel, look,
// and primary CTA itself). `ai` is the richer phrasing sent to the agent.
const VIBE_QUESTIONS = [
  {
    id: 'feel', q: 'How should it feel?',
    options: [
      { label: 'Luxurious', desc: 'High-end, expensive look', ai: 'Luxurious & refined — premium, high-end, feels worth paying more', preview: 'lux' },
      { label: 'Bold & loud', desc: 'Huge text, high energy', ai: 'Bold & high-energy — massive type, exciting, alive', preview: 'bold' },
      { label: 'Warm & friendly', desc: 'Cozy, welcoming, local', ai: 'Warm & welcoming — friendly, inviting, neighborly', preview: 'warm' },
      { label: 'Clean & modern', desc: 'Simple, crisp, minimal', ai: 'Minimal & modern — clean, calm, precise', preview: 'minimal' },
      { label: 'Artsy magazine', desc: 'Creative editorial layouts', ai: 'Editorial & artistic — magazine-style, asymmetric, creative', preview: 'editorial' },
      { label: 'Classic & pro', desc: 'Traditional, trustworthy', ai: 'Classic & trusted — established, professional authority', preview: 'classic' },
    ],
  },
  {
    id: 'look', q: 'How should it look?',
    options: [
      { label: 'Big photos', desc: 'Photos fill the screen', ai: 'Dramatic full-screen imagery-led design', preview: 'photos' },
      { label: 'Light & airy', desc: 'Lots of open space', ai: 'Airy whitespace — light, generous breathing room', preview: 'airy' },
      { label: 'Dark & moody', desc: 'Deep colors, dramatic', ai: 'Dark & moody — deep tones, dramatic contrast', preview: 'dark' },
      { label: 'Color blocks', desc: 'Bold bands of color', ai: 'Bold color-blocked sections in the brand palette', preview: 'blocks' },
      { label: 'Neat grid', desc: 'Tidy rows & columns', ai: 'Clean structured grid layouts', preview: 'grid' },
      { label: 'Layered', desc: 'Overlapping, rich, deep', ai: 'Rich & layered — overlapping elements, tasteful depth', preview: 'layered' },
    ],
  },
  {
    id: 'convert', q: 'What should visitors do?',
    options: [
      { label: 'Call now', desc: 'Phone rings today', ai: 'Primary action: call now', icon: '📞' },
      { label: 'Book online', desc: 'Schedule an appointment', ai: 'Primary action: book / schedule online', icon: '📅' },
      { label: 'Get a quote', desc: 'Fill a quick form', ai: 'Primary action: request a quote', icon: '📋' },
      { label: 'Browse & order', desc: 'See menu or products', ai: 'Primary action: browse the menu / products', icon: '🛍' },
      { label: 'Come visit', desc: 'Walk in the door', ai: 'Primary action: visit in person', icon: '📍' },
      { label: 'Build trust', desc: 'Get known, then contacted', ai: 'Primary action: build trust first, then contact', icon: '⭐' },
    ],
  },
]

const BLUE = '#2990fa'
// Translucent surfaces let the ambient lightning glow through the UI.
const BG = 'rgba(6, 13, 31, 0.72)'
const PANEL = 'rgba(10, 22, 40, 0.82)'
const BORDER = 'rgba(41, 144, 250, 0.16)'
const GREEN = '#39d98a'

const STEP_DEFS = [
  { id: 'crawl', label: 'Crawling website' },
  { id: 'logo', label: 'Fetching & refining logo' },
  { id: 'analyze', label: 'Analyzing brand' },
  { id: 'brief', label: 'Writing design brief' },
  { id: 'copy', label: 'Writing copy' },
  { id: 'build', label: 'Building website' },
  { id: 'images', label: 'Generating images' },
]

function VelpiLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden>
      <circle cx="15" cy="15" r="13" fill={BLUE} />
      <path d="M9 10 L15 21 L21 10" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

async function callRoute(path, body) {
  let res
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch (_) {
    throw new Error(`Could not reach ${path}. Is the server running? (start-velpi.bat)`)
  }
  let data = {}
  try { data = await res.json() } catch (_) {}
  if (!res.ok || data.error) throw new Error(data.error || `Request to ${path} failed (status ${res.status}).`)
  return data
}

function safeName(s) {
  return (s || 'velpi').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'velpi'
}

// Save-pipeline only: swap base64 data-URI assets for permanent Storage URLs
// right before a project is persisted. The server only mints a signed upload
// URL (small JSON); the image BYTES go straight from the browser to Supabase
// Storage — never through a Vercel function, whose ~4.5MB request-body limit
// is what produced 413s when base64 rode inside /api/* bodies.
// Plain URLs (real photos kept as-is) and non-base64 data URIs (tiny SVG
// placeholders) pass through untouched. A failed upload DROPS that asset
// from the persisted payload instead of keeping the base64 — keeping it is
// what re-triggered the 413 and lost the whole save; dropping costs one
// image (recoverable via Regenerate) and the failure is reported to the
// caller via `failed` so the UI can say so.
async function uploadBase64Assets(assetsById, refinedLogoValue, keyPrefix) {
  const failed = []
  const uploadOne = async (id, src) => {
    const match = typeof src === 'string' ? /^data:([^;,]+);base64,/.exec(src) : null
    if (!match) return [id, src]
    try {
      const contentType = match[1]
      const { signedUrl, publicUrl } = await callRoute('/api/upload-image', { path: `${keyPrefix}-${id}`, contentType })
      const blob = await (await fetch(src)).blob()
      const put = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob })
      if (!put.ok) throw new Error(`storage PUT failed (${put.status})`)
      return [id, publicUrl]
    } catch (_) {
      failed.push(id)
      return [id, null] // drop — never let base64 back into the save payload
    }
  }

  const uploadedEntries = await Promise.all(Object.entries(assetsById || {}).map(([id, src]) => uploadOne(id, src)))
  const newAssetsById = Object.fromEntries(uploadedEntries.filter(([, src]) => src))

  const [, newRefinedLogo] = await uploadOne('logo-refined', refinedLogoValue)
  return { assetsById: newAssetsById, refinedLogo: newRefinedLogo, failed }
}

// Trim fully-transparent margins off a PNG data URI and return the tight
// content crop (+ a small even margin) with its true content dimensions.
// The refine model letterboxes logos inside its fixed API canvases
// (1536x1024 / 1024x1024) — without this trim, a 4:1 wordmark lives inside a
// 1.5:1 file and every height-based header sizing renders it tiny with huge
// invisible padding. The TRIMMED image is what the app stores, displays,
// exports, and measures.
function trimTransparentPng(dataUri) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const d = ctx.getImageData(0, 0, c.width, c.height).data
        let minX = c.width, maxX = -1, minY = c.height, maxY = -1
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            if (d[(y * c.width + x) * 4 + 3] > 8) {
              if (x < minX) minX = x
              if (x > maxX) maxX = x
              if (y < minY) minY = y
              if (y > maxY) maxY = y
            }
          }
        }
        if (maxX < 0) return resolve({ uri: dataUri, width: c.width, height: c.height }) // fully transparent — leave as-is
        const margin = Math.round(Math.max(maxX - minX, maxY - minY) * 0.03)
        const sx = Math.max(0, minX - margin), sy = Math.max(0, minY - margin)
        const sw = Math.min(c.width - sx, maxX - minX + 1 + margin * 2)
        const sh = Math.min(c.height - sy, maxY - minY + 1 + margin * 2)
        const out = document.createElement('canvas')
        out.width = sw
        out.height = sh
        out.getContext('2d').drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh)
        resolve({ uri: out.toDataURL('image/png'), width: sw, height: sh })
      } catch (e) { reject(e) }
    }
    img.onerror = () => reject(new Error('Could not load the refined logo for trimming.'))
    img.src = dataUri
  })
}

function classifyLogoShape(width, height) {
  if (!width || !height) return { shape: 'unknown', ratio: null }
  const ratio = +(width / height).toFixed(2)
  if (ratio >= 2) return { shape: 'wide', ratio }
  if (ratio >= 0.8 && ratio <= 1.25) return { shape: 'square', ratio }
  if (ratio > 1.25) return { shape: 'landscape', ratio }
  return { shape: 'tall', ratio }
}

// Rasterize any uploaded image (PNG/JPG/SVG/screenshot) to PNG base64,
// preserving transparency. Returns { data (raw b64), preview (data uri) }.
function fileToPng(file, maxW = 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / Math.max(img.width, 1))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/png')
        resolve({ data: dataUrl.split(',')[1], preview: dataUrl, name: file.name })
      }
      img.onerror = () => reject(new Error('Could not read that image file.'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

async function downloadImage(src, filename) {
  try {
    if (src.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = src
      a.download = filename
      a.click()
      return
    }
    const res = await fetch(src)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  } catch (_) {
    window.open(src, '_blank')
  }
}

function slotIdFor(item, i) {
  if (/logo/i.test(item.what || '') || item.section === 'header') return 'logo'
  return `img_${item.slot != null ? item.slot : i}`
}

// Structure locks — the record that makes "regenerate = refine, not reroll".
// Keyed per domain; captured from the first successful run's /api/plan-structure
// result and sent back on every later regeneration of the same input so the
// skeleton (section order, blueprints, design systems, motion) never rerolls.
// Also stored inside each saved project, so loading a project restores its lock.
const STRUCTURE_LOCKS_KEY = 'velpi_structure_locks_v1'
function readStructureLock(domain) {
  if (!domain) return null
  try {
    const all = JSON.parse(localStorage.getItem(STRUCTURE_LOCKS_KEY) || '{}')
    return all[domain] || null
  } catch (_) {
    return null
  }
}
function writeStructureLock(domain, lock) {
  if (!domain || !lock) return
  try {
    const all = JSON.parse(localStorage.getItem(STRUCTURE_LOCKS_KEY) || '{}')
    all[domain] = lock
    localStorage.setItem(STRUCTURE_LOCKS_KEY, JSON.stringify(all))
  } catch (_) {}
}

function placeholderSvg(text) {
  const t = encodeURIComponent((text || 'image').slice(0, 40))
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect width='100%25' height='100%25' fill='%23233248'/%3E%3Ctext x='50%25' y='50%25' fill='%237d8aa0' font-family='monospace' font-size='36' text-anchor='middle'%3E${t}%3C/text%3E%3C/svg%3E`
}

// Shared %%IMG:id%% token substitution — used both for the active session's
// live preview and for quick-previewing a saved project straight from the
// Library without disturbing whatever is currently being built.
function substituteImageTokens(html, { assetsById = {}, ghlUrls = {}, logoSrc = null, slots = [] }) {
  if (!html) return ''
  return html.replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, id) => {
    if (ghlUrls[id]?.trim()) return ghlUrls[id].trim()
    if (assetsById[id]) return assetsById[id]
    if (id === 'logo') return logoSrc || placeholderSvg('logo')
    const slot = slots.find(s => s.id === id)
    return placeholderSvg(slot ? slot.name : id)
  })
}

// Plain-text report of everything the generator extracted, decided, and used —
// made to be copy-pasted into a chat so the "thinking" can be critiqued.
function composeReport(analysis, vibeText, chosenStyles, photoSlots, designBrief) {
  const a = analysis || {}
  const f = a.facts || {}
  const b = a.brand || {}
  const L = []
  L.push('===== VELPI BUILD REPORT =====')
  L.push(`Business: ${a.business_name || '?'}`)
  L.push(`Industry: ${a.industry || '?'}${a.niche ? ` — ${a.niche}` : ''}`)
  L.push(`Primary service: ${a.primary_service || '?'}`)
  L.push(`Target customer: ${a.target_customer || '?'}`)
  L.push(`Tone: ${a.tone || '?'}`)
  L.push('')
  L.push('--- CREATOR VIBE SELECTIONS ---')
  L.push(vibeText || '(none selected — generator chose freely)')
  L.push('')
  L.push('--- CREATIVE DIRECTION ---')
  L.push(`Design direction: ${a.design_direction || '?'}`)
  L.push(`3-second feeling: ${a.target_feeling || '?'}`)
  L.push(`Section order: ${(a.layout?.section_order || a.sections || []).join(' → ')}`)
  if (a.layout?.notes) L.push(`Layout notes: ${a.layout.notes}`)
  L.push(`Styles mixed: ${(chosenStyles || []).map(s => s.name).join(' + ') || '(none)'}`)
  L.push('')
  if (designBrief) {
    L.push('--- DESIGN BRIEF (the committed direction) ---')
    L.push(designBrief)
    L.push('')
  }
  L.push('--- CONVERSION STRATEGY (the thinking) ---')
  const cs = a.conversion_strategy || {}
  L.push(`Primary action: ${cs.primary_action || '?'} | Secondary: ${cs.secondary_action || '?'}`)
  L.push(`Offer (honest urgency): ${cs.offer || '?'}`)
  if (cs.objections?.length) {
    L.push('Objections → answered by:')
    cs.objections.forEach(o => L.push(`  • "${o.objection}" → ${o.answered_by} (in ${o.where})`))
  }
  if (cs.proof_map?.length) {
    L.push('Proof placement:')
    cs.proof_map.forEach(p => L.push(`  • ${p.proof} → ${p.placement}`))
  }
  if (cs.persuasion_flow?.length) {
    L.push('Persuasion flow:')
    cs.persuasion_flow.forEach(s => L.push(`  ${s.section}: ${s.job}`))
  }
  L.push('')
  L.push('--- BRAND DETECTED ---')
  L.push(`Palette: ${(a.color_palette || []).join(', ') || '?'}`)
  if (b.primary_colors?.length) L.push(`Primary: ${b.primary_colors.join(', ')} | Secondary: ${(b.secondary_colors || []).join(', ') || '—'} | Accent: ${(b.accent_colors || []).join(', ') || '—'}`)
  if (b.typography) L.push(`Typography: ${b.typography}`)
  if (b.button_style) L.push(`Buttons: ${b.button_style} | Radius: ${b.border_radius || '?'} | Spacing: ${b.spacing || '?'}`)
  if (b.design_language) L.push(`Design language: ${b.design_language}`)
  if (b.brand_personality) L.push(`Personality: ${b.brand_personality}`)
  L.push('')
  L.push('--- INFORMATION EXTRACTED ---')
  L.push(`Phone: ${f.phone || 'NOT FOUND'}`)
  L.push(`Emails: ${f.emails?.length ? f.emails.join(', ') : 'NOT FOUND'}`)
  L.push(`Address: ${f.address || 'NOT FOUND'}`)
  L.push(`Hours: ${f.hours || 'NOT FOUND'}`)
  L.push(`Socials: ${f.socials?.length ? f.socials.join(', ') : 'NOT FOUND'}`)
  L.push(`Services (${f.services?.length || 0}): ${(f.services || []).join(' | ') || 'NOT FOUND'}`)
  L.push(`Reviews (${f.reviews?.length || 0}):`)
  if (f.reviews?.length) f.reviews.forEach(r => L.push(`  • "${r}"`))
  else L.push('  NOT FOUND — likely rendered by a JS review widget the crawler cannot see')
  L.push('')
  L.push('--- IMAGE PLAN ---')
  ;(photoSlots || []).forEach((s, i) => {
    L.push(`${i + 1}. [${s.section || '?'}] ${s.name}`)
    if (s.prompt) L.push(`   prompt: ${s.prompt}`)
  })
  L.push('')
  L.push('--- PREVIEW VIEWPORTS ---')
  L.push(`Mobile: ${PREVIEW_VIEWPORTS.mobile.width}x${PREVIEW_VIEWPORTS.mobile.height} (iPhone-standard Safari viewport)`)
  L.push(`Desktop: ${PREVIEW_VIEWPORTS.desktop.width}x${PREVIEW_VIEWPORTS.desktop.height}`)
  L.push('Fixed widths, consistent across every build — not scaled approximations.')
  L.push('')
  L.push('===== END REPORT =====')
  return L.join('\n')
}

export default function Studio() {
  // ── Setup inputs ──
  const [input, setInput] = useState('')
  const [logo, setLogo] = useState(null)            // { data, preview, name } manual upload override
  const [logoNotes, setLogoNotes] = useState('')
  const [logoPalette, setLogoPalette] = useState([]) // dominant colors from uploaded logo
  const logoInputRef = useRef(null)
  const [vibe, setVibe] = useState({})              // question id -> up to 2 selected options
  const [refinedLogo, setRefinedLogo] = useState(null) // data uri after refinement
  const [logoMeta, setLogoMeta] = useState(null) // { shape, ratio, width, height } probed from the source logo

  // ── Pipeline ──
  const [generating, setGenerating] = useState(false)
  const [steps, setSteps] = useState(STEP_DEFS.map(s => ({ ...s, status: 'pending' })))
  const [error, setError] = useState(null)
  const [bizName, setBizName] = useState('')
  const [analysisData, setAnalysisData] = useState(null)
  const [slots, setSlots] = useState([])
  const [assetsById, setAssetsById] = useState({})
  const [logoUrl, setLogoUrl] = useState(null)      // scraped logo url (fallback)
  const [ghlUrls, setGhlUrls] = useState({})
  const [htmlTemplate, setHtmlTemplate] = useState(null)
  const [built, setBuilt] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [buildReport, setBuildReport] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)
  const [snapping, setSnapping] = useState(false)
  const [makingPdf, setMakingPdf] = useState(false)

  // ── Device previews open the dedicated /device-preview page (new tab) —
  // works for the active build AND for any saved Library project via a
  // quick, non-destructive fetch. previewMode remembers the last-used mode. ──
  const [previewMode, setPreviewMode] = useState('mobile') // 'mobile' | 'desktop'
  const [mobilePreviewLoadingId, setMobilePreviewLoadingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // ── Run evidence: exact prompt payload + image-API attestation ──
  const [promptTrace, setPromptTrace] = useState(null) // { system, user }
  const [imagesMeta, setImagesMeta] = useState(null)   // { apiCalled, aiCalls, generated, enhanced, keptOriginal }

  // ── Alternate layouts (post-generation option) ──
  const [altLayouts, setAltLayouts] = useState([])
  const [rebuilding, setRebuilding] = useState(null) // alternate name while rebuilding
  const lastRunRef = useRef(null) // { analysis, copy, brief, motion, sectionRefs, slots }

  // ── Project library ──
  const [projects, setProjects] = useState([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [savingProject, setSavingProject] = useState(false)
  const [savedMsg, setSavedMsg] = useState(null)
  const [loadingProjectId, setLoadingProjectId] = useState(null)
  const [regenIds, setRegenIds] = useState({})

  // ── Styles library — Auto-Match only, no manual override UI ──
  const [styles, setStyles] = useState([])
  const [styleId] = useState('auto')
  const [matchedStyleName, setMatchedStyleName] = useState('')

  // ── Dev Review System (development only) — a build id for every generation,
  // independent of the Creative Intelligence Layer (set unconditionally below,
  // whether or not CIL shadow mode is on), plus the auto-saved project id. ──
  const [reviewBuildId, setReviewBuildId] = useState(null)
  const [reviewProjectId, setReviewProjectId] = useState(null)

  // ── Results UI ──
  const [showCode, setShowCode] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(null)
  const [copiedInfo, setCopiedInfo] = useState(false)

  useEffect(() => {
    fetch('/api/styles').then(r => r.json()).then(d => setStyles(d.styles || [])).catch(() => {})
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {})
    try {
      const saved = localStorage.getItem('velpi_preview_mode')
      if (saved === 'mobile' || saved === 'desktop') setPreviewMode(saved)
    } catch (_) {}
  }, [])

  // ── Project library: save / load / delete ──
  async function saveProjectToLibrary() {
    if (!htmlTemplate || savingProject) return
    setSavingProject(true)
    setError(null)
    try {
      const name = `${bizName || 'Untitled'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      const uploaded = await uploadBase64Assets(assetsById, refinedLogo, safeName(bizName))
      const data = {
        bizName, analysisData, slots, assetsById: uploaded.assetsById, ghlUrls, htmlTemplate, buildReport,
        vibe, refinedLogo: uploaded.refinedLogo, logoUrl, logoMeta, input,
        structureLock: readStructureLock(analysisData?._source?.domain || '') || null,
        savedAt: new Date().toISOString(),
      }
      const { project } = await callRoute('/api/projects', { name, data })
      setProjects(prev => [project, ...prev])
      setSavedMsg(`Saved "${project.name}" to the library`)
      setTimeout(() => setSavedMsg(null), 3000)
      if (uploaded.failed.length) {
        setError(`Saved, but ${uploaded.failed.length} image${uploaded.failed.length > 1 ? 's' : ''} (${uploaded.failed.join(', ')}) could not be uploaded to storage and ${uploaded.failed.length > 1 ? 'were' : 'was'} left out of the saved copy — the live session still has ${uploaded.failed.length > 1 ? 'them' : 'it'}. Check SUPABASE_SERVICE_ROLE_KEY / the project-images bucket, then save again.`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingProject(false)
    }
  }

  async function loadProject(id) {
    if (generating || loadingProjectId) return
    setLoadingProjectId(id)
    setError(null)
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`)
      const json = await res.json()
      if (json.error || !json.project?.data) throw new Error(json.error || 'Project data missing.')
      const d = json.project.data
      setBizName(d.bizName || '')
      setAnalysisData(d.analysisData || null)
      setSlots(d.slots || [])
      setAssetsById(d.assetsById || {})
      setGhlUrls(d.ghlUrls || {})
      setHtmlTemplate(d.htmlTemplate || null)
      setBuildReport(d.buildReport || '')
      setVibe(d.vibe || {})
      setRefinedLogo(d.refinedLogo || null)
      setLogoMeta(d.logoMeta || null)
      setLogoUrl(d.logoUrl || null)
      setInput(d.input || '')
      setBuilt(!!d.htmlTemplate)
      setImagesReady(true)
      setSteps(STEP_DEFS.map(s => ({ ...s, status: 'complete' })))
      setLibraryOpen(false)
      // Restore the project's structure lock so regenerating this business
      // (even from a different day/browser state) keeps its exact skeleton.
      if (d.structureLock?.domain) writeStructureLock(d.structureLock.domain, d.structureLock)
      // A loaded project has no separate "build id" of its own — the project's
      // id is already a stable, unique identity, so the review attaches to that.
      setReviewProjectId(id)
      setReviewBuildId(id)
    } catch (e) {
      setError(`Could not load that project: ${e.message}`)
    } finally {
      setLoadingProjectId(null)
    }
  }

  async function removeProject(id) {
    try {
      await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      setError(`Could not delete that project: ${e.message}`)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  // Opens the dedicated /device-preview PAGE in a new tab (popup/modal
  // previews are gone — a page renders the exact HTML a client would see,
  // with no height clamping). The HTML travels via a postMessage handshake:
  // the new tab announces readiness, this tab answers with the payload.
  function openDevicePreview(html, label, mode) {
    if (!html) return
    setPreviewMode(mode)
    try { localStorage.setItem('velpi_preview_mode', mode) } catch (_) {}
    const payload = {
      type: 'velpi-preview-html',
      html,
      label: label || bizName || 'Preview',
      buildId: reviewBuildId || null,
      projectId: reviewProjectId || null,
    }
    const win = window.open(`/device-preview?mode=${mode}`, '_blank')
    if (!win) { setError('The preview tab was blocked — allow popups for this site.'); return }
    const onReady = e => {
      if (e.origin !== window.location.origin || e.data?.type !== 'velpi-preview-ready') return
      try { win.postMessage(payload, window.location.origin) } catch (_) {}
      window.removeEventListener('message', onReady)
    }
    window.addEventListener('message', onReady)
    // Safety: stop listening after a minute so stale listeners never stack.
    setTimeout(() => window.removeEventListener('message', onReady), 60000)
  }

  // Quick-preview a saved Library project on mobile WITHOUT loading it into
  // the active session — a non-destructive peek at finished work.
  async function quickPreviewProjectMobile(project) {
    if (mobilePreviewLoadingId) return
    setMobilePreviewLoadingId(project.id)
    setError(null)
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(project.id)}`)
      const json = await res.json()
      if (json.error || !json.project?.data) throw new Error(json.error || 'Project data missing.')
      const d = json.project.data
      const html = substituteImageTokens(d.htmlTemplate, {
        assetsById: d.assetsById || {},
        ghlUrls: d.ghlUrls || {},
        slots: d.slots || [],
        logoSrc: d.refinedLogo || d.logoUrl,
      })
      openDevicePreview(html, d.bizName || project.name, 'mobile')
    } catch (e) {
      setError(`Could not preview that project: ${e.message}`)
    } finally {
      setMobilePreviewLoadingId(null)
    }
  }

  // The logo is auto-detected from the website and refined automatically —
  // uploading one is now just an optional override.
  const readyToGenerate = !!input.trim() && !!logo
  const missing = [!input.trim() && 'website URL', !logo && 'business logo'].filter(Boolean)

  // Reconstructs a readable vibe summary — only ever populated by loading a
  // project saved before manual vibe entry was removed. Fresh runs are fully
  // automatic, so this returns '' and the agent infers everything itself.
  function vibeSummary() {
    const parts = []
    for (const q of VIBE_QUESTIONS) {
      const sel = vibe[q.id] || []
      if (!sel.length) continue
      const rich = sel.map(labelSel => q.options.find(o => o.label === labelSel)?.ai || labelSel)
      parts.push(`${q.q} ${rich.join(' + ')}`)
    }
    return parts.join(' | ')
  }

  // ── HTML rendering ──
  function previewHtml() {
    if (!htmlTemplate) return ''
    return substituteImageTokens(htmlTemplate, {
      assetsById, ghlUrls, slots,
      logoSrc: refinedLogo || logo?.preview || logoUrl,
    })
  }

  function finalHtml() {
    if (!htmlTemplate) return ''
    return htmlTemplate.replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, id) => {
      // A pasted GoHighLevel URL always wins (that's the deliberate final-deploy
      // override). Otherwise fall back to the AI-generated/enhanced image itself
      // — every slot already has one after a normal run, so export should show
      // the real image, not a "paste it yourself" placeholder.
      if (ghlUrls[id]?.trim()) return ghlUrls[id].trim()
      if (id === 'logo') return refinedLogo || assetsById.logo || logoUrl || logo?.preview || 'https://PASTE-LOGO-URL-HERE'
      if (assetsById[id]) return assetsById[id]
      const n = slots.findIndex(s => s.id === id) + 1
      return `https://PASTE-IMAGE-${n || 'X'}-URL-HERE`
    })
  }

  // Dominant brand colors from an uploaded logo (canvas sampling, grays skipped) —
// feeds theming so an uploaded logo drives the palette like a crawled one does.
function extractLogoColors(dataUrl) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      try {
        const s = 48
        const c = document.createElement('canvas')
        c.width = s; c.height = s
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, s, s)
        const d = ctx.getImageData(0, 0, s, s).data
        const buckets = {}
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue
          const r = d[i], g = d[i + 1], b = d[i + 2]
          const max = Math.max(r, g, b), min = Math.min(r, g, b)
          if (max - min < 18 && (max > 235 || max < 25)) continue // near-white/black
          const key = `${r >> 5},${g >> 5},${b >> 5}`
          const bk = (buckets[key] = buckets[key] || { n: 0, r: 0, g: 0, b: 0 })
          bk.n++; bk.r += r; bk.g += g; bk.b += b
        }
        const hex = v => Math.round(v).toString(16).padStart(2, '0')
        resolve(Object.values(buckets).sort((a, b) => b.n - a.n).slice(0, 3)
          .map(bk => `#${hex(bk.r / bk.n)}${hex(bk.g / bk.n)}${hex(bk.b / bk.n)}`))
      } catch (_) { resolve([]) }
    }
    img.onerror = () => resolve([])
    img.src = dataUrl
  })
}

// Small gallery thumbnail: render the top of the site off-screen, capture,
  // downscale to a compact JPEG data URI. Returns null on any failure.
  async function captureThumb(substitutedHtml) {
    const frame = document.createElement('iframe')
    try {
      frame.style.cssText = 'position:fixed;left:-99999px;top:0;width:1024px;height:1280px;border:none;'
      frame.setAttribute('sandbox', 'allow-same-origin')
      document.body.appendChild(frame)
      frame.srcdoc = substitutedHtml
      await new Promise(res => { frame.onload = res })
      await new Promise(res => setTimeout(res, 900))
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(frame.contentDocument.documentElement, {
        useCORS: true, allowTaint: false, backgroundColor: '#ffffff',
        windowWidth: 1024, width: 1024, height: 1280, scale: 0.35, logging: false,
      })
      return canvas.toDataURL('image/jpeg', 0.72)
    } catch (_) {
      return null
    } finally {
      try { document.body.removeChild(frame) } catch (_) {}
    }
  }

  // Render the mockup in a hidden iframe at a REAL browser viewport
  // (1440x900) and capture its entire scrollable height — the way a
  // full-page screenshot extension does. The iframe is deliberately NEVER
  // resized to the page height: the old code did, which re-based every
  // vh unit against the huge new "viewport" (an 88vh hero suddenly became
  // thousands of px), growing the page far past the already-measured
  // height — that mismatch is exactly why captures came out truncated.
  // Instead the viewport stays 900px tall (vh keeps meaning what it means
  // in a real browser) and html2canvas is told the full document height
  // to draw, with windowHeight pinned to the real viewport.
  async function captureFullPageCanvas() {
    const out = previewHtml()
    if (!out) return null
    const frame = document.createElement('iframe')
    try {
      frame.style.cssText = 'position:fixed;left:-99999px;top:0;width:1440px;height:900px;border:none;'
      frame.setAttribute('sandbox', 'allow-same-origin')
      document.body.appendChild(frame)
      frame.srcdoc = out
      await new Promise(res => { frame.onload = res })
      await new Promise(res => setTimeout(res, 1200)) // let fonts/images settle
      const doc = frame.contentDocument
      const fullH = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0)
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(doc.documentElement, {
        useCORS: true, allowTaint: false, backgroundColor: '#ffffff',
        windowWidth: 1440, windowHeight: 900, width: 1440, height: Math.min(fullH, 40000),
        scale: 1, logging: false,
      })
      return canvas
    } finally {
      try { document.body.removeChild(frame) } catch (_) {}
    }
  }

  // Capture the whole rendered mockup as ONE tall PNG you can scroll through.
  async function downloadFullImage() {
    if (!htmlTemplate || snapping) return
    setSnapping(true)
    try {
      const canvas = await captureFullPageCanvas()
      if (!canvas) return
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `${safeName(bizName)}-mockup-fullpage.png`
      a.click()
    } catch (e) {
      setError(`Could not capture the full-page image: ${e.message}. The Open Full Preview tab + your browser's full-page screenshot works as a fallback.`)
    } finally {
      setSnapping(false)
    }
  }

  // PRIMARY download: the full mockup as a single-page PDF (one continuous
  // page at the site's real height — made for sharing a finished mockup
  // without pasting HTML anywhere). Image-based by design: it's a visual
  // proof, the deployable artifact stays the HTML.
  async function downloadPdf() {
    if (!htmlTemplate || makingPdf) return
    setMakingPdf(true)
    setError(null)
    try {
      const canvas = await captureFullPageCanvas()
      if (!canvas) return
      const { jsPDF } = await import('jspdf')
      const w = canvas.width
      const h = canvas.height
      const pdf = new jsPDF({
        orientation: h >= w ? 'portrait' : 'landscape',
        unit: 'px',
        format: [w, h],
        hotfixes: ['px_scaling'],
        compress: true,
      })
      // JPEG keeps a tall-page PDF at a shareable size; the backdrop is
      // already flattened to white by the capture.
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, w, h)
      pdf.save(`${safeName(bizName)}-mockup.pdf`)
    } catch (e) {
      setError(`Could not create the PDF: ${e.message}`)
    } finally {
      setMakingPdf(false)
    }
  }

  // GHL header export — only offered for horizontal (wide) logos: GHL renders
  // header logos inside a fixed-height container and squishes anything tall,
  // so the export keeps height small relative to width. Square logos don't
  // need this; their existing 1:1 transparent PNG already fits GHL as-is.
  async function downloadGhlHeaderLogo() {
    const src = refinedLogo || assetsById.logo || logo?.preview
    if (!src) return
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Could not load the logo image.')); img.src = src })
      const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1)
      const targetH = 120 // small height, crisp at GHL's ~40-60px render
      const targetW = Math.round(targetH * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      canvas.getContext('2d').drawImage(img, 0, 0, targetW, targetH)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png') // preserves alpha
      a.download = `${safeName(bizName)}-logo-ghl-header.png`
      a.click()
    } catch (e) {
      setError(`GHL header export failed: ${e.message}`)
    }
  }

  const linkedCount = slots.filter(s => ghlUrls[s.id]?.trim()).length
  const allLinked = slots.length > 0 && linkedCount === slots.length

  // ── Logo upload ──
  // Manual logo override: skip crawl detection entirely; the upload becomes the
  // source logo and its dominant colors feed theming, same as a crawled logo.
  async function onLogoFile(fileList) {
    const file = Array.from(fileList || []).find(f => f.type.startsWith('image/') || /\.svg$/i.test(f.name))
    if (!file) return
    setError(null)
    try {
      const png = await fileToPng(file)
      setLogo(png)
      setRefinedLogo(null)
      setLogoMeta(null)
      setLogoPalette(await extractLogoColors(png.preview))
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Generation ──
  async function runGeneration() {
    if (!readyToGenerate || generating) return
    setError(null)
    setBuilt(false)
    // A build id exists for every generation, independent of CIL — this is
    // what the Dev Review Panel attaches reviews to. Declared as a local const
    // (not just state) so the rest of this function can use the real value
    // immediately instead of a stale render's state.
    const buildId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `build_${Date.now()}`
    setReviewBuildId(buildId)
    setReviewProjectId(null)
    setImagesReady(false)
    setHtmlTemplate(null)
    setAnalysisData(null)
    setSlots([])
    setAssetsById({})
    setGhlUrls({})
    setLogoUrl(null)
    setBizName('')
    setMatchedStyleName('')
    setShowCode(false)
    setDetailsOpen(false)
    setGenerating(true)

    const statuses = {}
    STEP_DEFS.forEach(s => { statuses[s.id] = 'pending' })
    const mark = (id, status) => {
      statuses[id] = status
      setSteps(STEP_DEFS.map(s => ({ ...s, status: statuses[s.id] })))
    }

    try {
      // Crawl first — the logo is auto-detected from the site itself.
      mark('crawl', 'active')
      const { scrapedData } = await callRoute('/api/scrape', { input: input.trim() })
      mark('crawl', 'complete')

      // Logo: uploaded override wins; otherwise the icon detected on the site.
      // Refinement (isolate icon, 1:1, fill frame, transparent, premium) runs in
      // parallel with everything else — it never blocks the build.
      mark('logo', 'active')
      let logoAssetLocal = null // local mirror for auto-save
      let logoMetaLocal = null // measured shape/ratio — drives header sizing in the build
      const refinePayload = logo
        ? { b64: logo.data, instructions: logoNotes.trim() }
        : (scrapedData.logo ? { url: scrapedData.logo, instructions: logoNotes.trim() } : null)
      const refineP = refinePayload
        ? callRoute('/api/refine-logo', refinePayload)
            .then(async res => {
              if (res.logoMeta) { logoMetaLocal = res.logoMeta; setLogoMeta(res.logoMeta) }
              if (res.b64) {
                let uri = `data:image/png;base64,${res.b64}`
                // Trim the API's transparent letterbox and re-measure from the
                // CONTENT — the trimmed asset + its true ratio are what header
                // sizing must be based on, or a wide lockup inside a 1.5:1
                // canvas renders tiny no matter what CSS asks for.
                try {
                  const trimmed = await trimTransparentPng(uri)
                  uri = trimmed.uri
                  const contentMeta = { ...classifyLogoShape(trimmed.width, trimmed.height), width: trimmed.width, height: trimmed.height }
                  if (contentMeta.shape !== 'unknown') { logoMetaLocal = contentMeta; setLogoMeta(contentMeta) }
                } catch (_) { /* trim is an enhancement — untrimmed still works */ }
                logoAssetLocal = uri
                setRefinedLogo(uri)
                setAssetsById(prev => ({ ...prev, logo: uri }))
              } else if (res.src || logo?.preview) {
                // Unsupported format or refine failure — use the raw source.
                logoAssetLocal = res.src || logo.preview
                setAssetsById(prev => ({ ...prev, logo: logoAssetLocal }))
              }
              mark('logo', 'complete')
            })
            .catch(() => {
              const fallback = logo?.preview || scrapedData.logo
              if (fallback) {
                logoAssetLocal = fallback
                setAssetsById(prev => ({ ...prev, logo: fallback }))
              }
              mark('logo', 'complete')
            })
        : Promise.resolve().then(() => mark('logo', 'complete')) // no logo found — build uses a text wordmark

      // Uploaded-logo colors lead the theme, exactly like crawled brand colors.
      if (logo && logoPalette.length) {
        scrapedData.palette = [...new Set([...logoPalette, ...(scrapedData.palette || [])])].slice(0, 6)
      }

      mark('analyze', 'active')
      const manualVibe = vibeSummary()
      const { analysis } = await callRoute('/api/analyze', { scrapedData, vibe: manualVibe })

      // Vibe is INFERRED, not asked: when the creator touched nothing in
      // Customize, the agent's own read of the business (copy tone → feel,
      // imagery → look, business type → CTA) drives everything downstream.
      const inf = analysis.inferred_vibe || {}
      const vibeText = manualVibe || [
        inf.feel ? `How should it feel? ${inf.feel}` : null,
        inf.look ? `How should it look? ${inf.look}` : null,
        inf.primary_cta ? `What should visitors do? ${inf.primary_cta}` : null,
      ].filter(Boolean).join(' | ')
      setBizName(analysis.business_name || '')
      setAnalysisData(analysis)
      setLogoUrl(analysis._source?.logo || scrapedData.logo || null)

      // ── CIL Stages 1→2→3→4→5 (Understanding → Strategy → Creative Director → Blueprint → Validator) — SHADOW ONLY ──
      // Fire-and-forget: never awaited, never sets state, never touches the
      // shipped output or the legacy pipeline. Gated by NEXT_PUBLIC_CIL_MODE
      // (each server route re-checks CIL_MODE, so BOTH flags must be enabled).
      // Off by default → this block is inert. Stage 5 consumes the fully
      // assembled Blueprint (+ context) and reports; it never modifies it.
      // Nothing downstream consumes any of them. Logs only.
      try {
        const cilMode = (process.env.NEXT_PUBLIC_CIL_MODE || '').toLowerCase()
        if (cilMode && cilMode !== 'off' && cilMode !== 'legacy') {
          // Reuse the same build id so a CDO (if one gets assembled) and this
          // build's review always share one identity — no separate id needed.
          const cilRunId = buildId
          callRoute('/api/creative/understand', { scrapedData, analysis })
            .then(u => {
              try { console.log('[CIL:shadow] understanding', u) } catch (_) {}
              if (!(u?.ok && u.understanding)) return
              return callRoute('/api/creative/strategize', { understanding: u.understanding })
                .then(s => {
                  try { console.log('[CIL:shadow] strategy', s) } catch (_) {}
                  if (!(s?.ok && s.strategy)) return
                  return callRoute('/api/creative/direct', { strategy: s.strategy })
                    .then(d => {
                      try { console.log('[CIL:shadow] creative_director', d) } catch (_) {}
                      if (!(d?.ok && d.director)) return
                      return callRoute('/api/creative/blueprint', {
                        director: d.director, strategy: s.strategy,
                        palette: analysis.color_palette, industry: analysis.industry,
                      }).then(b => {
                        try { console.log('[CIL:shadow] blueprint', b) } catch (_) {}
                        if (!(b?.ok && b.blueprint)) return
                        return callRoute('/api/creative/validate', {
                          blueprint: b.blueprint, director: d.director, strategy: s.strategy,
                          palette: analysis.color_palette, industry: analysis.industry,
                        }).then(v => {
                          try { console.log('[CIL:shadow] validation', v) } catch (_) {}
                          // Assemble all five stages into one versioned CDO for the dashboard.
                          return callRoute('/api/creative/assemble', {
                            runId: cilRunId,
                            businessName: analysis.business_name || '',
                            niche: analysis.industry || '',
                            tier: s.strategy?.creative_direction?.premium_tier || '',
                            stages: {
                              understanding: u.understanding, strategy: s.strategy, director: d.director,
                              blueprint: b.blueprint, seedDefaults: b.seedDefaults,
                              validation: v?.ok ? { validation: v.validation, internal_critique: v.internal_critique, confidence: v.confidence, revisions: v.revisions } : null,
                            },
                            metas: {
                              understanding: u.meta, strategy: s.meta, creative_director: d.meta,
                              blueprint: b.meta, validation: v?.meta,
                            },
                          }).then(a => { try { console.log('[CIL:shadow] assembled', a?.directive?.rollup) } catch (_) {} })
                        })
                      })
                    })
                })
            })
            .catch(err => { try { console.warn('[CIL:shadow] chain failed:', err?.message) } catch (_) {} })
        }
      } catch (_) { /* shadow must never affect the run */ }

      const inv = analysis.image_inventory || []
      const photoSlots = inv
        .map((item, i) => ({ item, id: slotIdFor(item, i) }))
        .filter(x => x.id !== 'logo')
        .map(x => ({ id: x.id, name: x.item.what || x.id, section: x.item.section || '', prompt: x.item.prompt || '' }))
      setSlots([...photoSlots, { id: 'logo', name: 'Logo', section: 'header', prompt: '' }])

      // Deterministic structure plan — regenerate = refine, not reroll.
      // A lock captured on this domain's first run pins the whole skeleton
      // (section order, per-section blueprints, design systems, motion);
      // without a lock, choices are seeded by the domain so the same input
      // still resolves the same way. Randomness is gone from structure.
      const siteDomain = analysis._source?.domain || scrapedData.domain || ''
      const priorLock = readStructureLock(siteDomain)
      const manual = styles.find(s => s.id === styleId)
      const structPlan = await callRoute('/api/plan-structure', {
        analysis,
        vibe: vibeText,
        lock: priorLock,
        manualStyleId: manual ? manual.id : null,
      })
      const chosenStyles = structPlan.styles || []
      const motionPreset = structPlan.motion || null
      const sectionRefs = structPlan.sectionRefs || []
      const structure = { sectionOrder: structPlan.sectionOrder || [], sectionMap: structPlan.sectionMap || {} }
      // Persist the lock immediately — this run's structure IS the contract
      // every later regeneration of this input refines within.
      if (structPlan.lock) writeStructureLock(siteDomain, structPlan.lock)
      // Align the analysis's own section keys with the (possibly locked)
      // order so downstream copy generation writes for the same skeleton.
      if (structure.sectionOrder.length) {
        analysis.sections = structure.sectionOrder
        analysis.layout = { ...(analysis.layout || {}), section_order: structure.sectionOrder }
      }
      setMatchedStyleName(chosenStyles.map(s => s.name).join('  +  '))
      mark('analyze', 'complete')

      // Design brief — a creative director fuses brand + vibe + the matched
      // systems into ONE committed spec before any HTML is written.
      mark('brief', 'active')
      let designBrief = ''
      try {
        const res = await callRoute('/api/design-brief', {
          analysis, vibe: vibeText,
          styleMds: chosenStyles.map(s => s.content),
          motion: motionPreset ? { name: motionPreset.name, summary: motionPreset.summary, effect: motionPreset.effect, intensity: motionPreset.intensity } : null,
          blueprintAssignments: Object.entries(structure.sectionMap).map(([sec, refId]) => {
            const ref = sectionRefs.find(r => r.id === refId)
            return `${sec}: ${ref?.name || refId}`
          }),
        })
        designBrief = res.brief || ''
        mark('brief', 'complete')
      } catch (_) {
        mark('brief', 'error') // non-fatal — build falls back to raw systems
      }

      mark('images', 'active')
      const localAssets = {} // local mirror of generated assets for auto-save
      let imagesMetaLocal = null // image-API attestation, mirrored for auto-save
      const imagesPromise = callRoute('/api/generate-images', { analysis })
        .then(({ images }) => {
          const map = {}
          for (const a of images?.assets || []) {
            if (a.src) map[a.id] = a.src
          }
          if (images?.meta) { imagesMetaLocal = images.meta; setImagesMeta(images.meta) }
          // Server-side warnings (dead API key, missing key) were previously
          // dropped on the floor — a run could ship all-original photos while
          // every step showed green.
          if (images?.warning) setError(images.warning)
          Object.assign(localAssets, map)
          // Never let a scraped logo overwrite the refined upload.
          setAssetsById(prev => ({ ...map, ...(prev.logo ? { logo: prev.logo } : {}) }))
          setImagesReady(true)
          mark('images', images?.warning ? 'error' : 'complete')
        })
        .catch(e => {
          mark('images', 'error')
          setError(`Image generation: ${e.message} (the website is still usable — slots show placeholders)`)
        })

      mark('copy', 'active')
      const { copy } = await callRoute('/api/generate-copy', { analysis })
      mark('copy', 'complete')

      mark('build', 'active')
      // The logo's measured geometry drives header sizing in the build prompt.
      // Refinement runs in parallel and is in practice long done by now (one
      // image op vs analyze+brief+copy); awaiting is ~free and never rejects.
      await refineP
      const buildSlots = [
        { id: 'logo', name: 'Logo', section: 'header' },
        ...photoSlots.map(s => ({ id: s.id, name: s.name, section: s.section })),
      ]
      const buildPayload = {
        analysis, copy,
        vibe: vibeText,
        slots: buildSlots,
        styleMds: chosenStyles.map(s => s.content),
        brief: designBrief,
        motion: motionPreset,
        sectionRefs,
        structure, // the deterministic skeleton — same on every regeneration
        logoMeta: logoMetaLocal, // measured shape/ratio — wide wordmarks size by ratio
      }
      lastRunRef.current = buildPayload // kept for alternate-layout rebuilds
      const { html, trace } = await callRoute('/api/build-site', buildPayload)
      if (trace) setPromptTrace(trace)
      setHtmlTemplate(html)
      setBuilt(true)
      mark('build', 'complete')

      // Alternate layout outlines — fetched in the background; a post-generation
      // option, never an upfront decision.
      setAltLayouts([])
      callRoute('/api/alt-layouts', { analysis, currentOrder: analysis.layout?.section_order || analysis.sections || [] })
        .then(res => setAltLayouts(res.alternates || []))
        .catch(() => {})

      // Single-pass build: every elevation/density/conversion directive that
      // used to run as a separate "pass 2" + critique-and-fix loop is now baked
      // directly into the one build-site call — no second pass, no re-prompting.
      const report = composeReport(analysis, vibeText, chosenStyles, photoSlots, designBrief)
        + (!manualVibe && (inf.feel || inf.look || inf.primary_cta) ? `\n--- AUTO-INFERRED VIBE (no manual selections — agent's own read) ---\nFeel: ${inf.feel || '—'}\nLook: ${inf.look || '—'}\nPrimary CTA: ${inf.primary_cta || '—'}\n` : '')
        + (motionPreset ? `\n--- SIGNATURE MOTION ---\n${motionPreset.name} (${motionPreset.intensity} ${motionPreset.effect}, ${motionPreset.dependency}) — ${motionPreset.summary || ''}\n` : '')
        + (sectionRefs.length ? `\n--- STRUCTURAL REFERENCES STUDIED ---\n${sectionRefs.map(r => `${r.name} (${r.category}) — ${r.source}`).join('\n')}\n` : '')
      setBuildReport(report)

      await Promise.all([imagesPromise, refineP])

      // IMAGE COMPLETION GATE — no placeholders ship. Every photo slot must
      // hold a real (enhanced) or freshly generated image; missing slots are
      // resolved automatically with per-slot regeneration, up to two rounds.
      let lastFailReason = null
      for (let round = 1; round <= 2; round++) {
        const missing = photoSlots.filter(s => !localAssets[s.id])
        if (!missing.length) break
        mark('images', 'active')
        for (const s of missing) {
          try {
            const slotNum = Number(String(s.id).replace('img_', '')) || 0
            const item = { slot: slotNum, what: s.name, section: s.section, source: 'none', action: 'generate', url: null, prompt: s.prompt || '' }
            const { images: retry } = await callRoute('/api/generate-images', { analysis: { ...analysis, image_inventory: [item] } })
            const asset = (retry?.assets || []).find(a => a.id === s.id && a.src)
            if (asset) {
              localAssets[s.id] = asset.src
              setAssetsById(prev => ({ ...prev, [s.id]: asset.src }))
            } else if (retry?.meta?.failures?.length) {
              lastFailReason = retry.meta.failures[0].reason
            }
          } catch (_) {}
        }
        mark('images', photoSlots.every(s => localAssets[s.id]) ? 'complete' : 'active')
      }
      const stillMissing = photoSlots.filter(s => !localAssets[s.id])
      if (stillMissing.length) {
        mark('images', 'error')
        setError(`${stillMissing.length} image slot${stillMissing.length > 1 ? 's' : ''} could not be generated after retries (${stillMissing.map(s => s.name).join(', ')})${lastFailReason ? ` — last API error: "${lastFailReason}"` : ''} — use Regenerate on those slots in Assets.`)
      } else {
        mark('images', 'complete')
      }

      // (The old anti-repetition memory is gone on purpose: same-input
      // regenerations must KEEP their structure, not be forced to vary —
      // cross-business variety now comes from per-domain seeding instead.)

      // AUTO-SAVE — every generation lands in the library automatically with a
      // thumbnail and a shareable /preview/{id} URL. Best-effort: never blocks.
      try {
        const allSlots = [...photoSlots, { id: 'logo', name: 'Logo', section: 'header', prompt: '' }]
        const finalAssets = { ...localAssets, ...(logoAssetLocal ? { logo: logoAssetLocal } : {}) }
        const substituted = html.replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, tid) => {
          if (finalAssets[tid]) return finalAssets[tid]
          if (tid === 'logo') return logoAssetLocal || scrapedData.logo || placeholderSvg('logo')
          const slot = allSlots.find(s => s.id === tid)
          return placeholderSvg(slot ? slot.name : tid)
        })
        const thumb = await captureThumb(substituted)
        // Swap base64 assets for Storage URLs only in the payload that's about
        // to be persisted — the live session (preview/export/thumb above)
        // keeps using the base64 straight from the image API, untouched.
        const uploaded = await uploadBase64Assets(finalAssets, logoAssetLocal, safeName(analysis.business_name))
        const projData = {
          bizName: analysis.business_name || '',
          niche: analysis.industry || '',
          sourceUrl: input.trim(),
          analysisData: analysis,
          slots: allSlots,
          assetsById: uploaded.assetsById,
          ghlUrls: {},
          htmlTemplate: html,
          buildReport: report,
          promptTrace: trace || null, // the exact payload sent to the build model
          imagesMeta: imagesMetaLocal || null, // proof the image API ran (call counts)
          vibe,
          refinedLogo: uploaded.refinedLogo,
          logoUrl: scrapedData.logo || null,
          logoMeta: logoMetaLocal,
          input: input.trim(),
          thumb,
          structureLock: structPlan.lock || null,
          savedAt: new Date().toISOString(),
        }
        const name = `${analysis.business_name || 'Untitled'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        const { project } = await callRoute('/api/projects', { name, data: projData })
        setReviewProjectId(project.id)
        setProjects(prev => [{ ...project, thumb }, ...prev])
        setSavedMsg(`Auto-saved to the library — shareable at /preview/${project.id}`)
        setTimeout(() => setSavedMsg(null), 5000)
        // Index this run's uploaded images into the cross-project asset
        // library (fire-and-forget; upsert-by-url, so re-saves are harmless).
        // Future generations see these as reuse candidates during analysis.
        try {
          const records = Object.entries(uploaded.assetsById)
            .filter(([id, src]) => id !== 'logo' && typeof src === 'string' && /^https?:\/\//.test(src))
            .map(([id, src]) => {
              const slot = allSlots.find(s => s.id === id)
              return {
                url: src,
                subject: slot?.name || id,
                section: slot?.section || '',
                niche: analysis.niche || analysis.industry || '',
                business: analysis.business_name || '',
                tags: [analysis.industry, analysis.niche, slot?.section, ...(slot?.name || '').split(/[^a-zA-Z]+/)].filter(w => w && w.length > 3),
              }
            })
          if (records.length) callRoute('/api/asset-library', { records }).catch(() => {})
        } catch (_) {}
        if (uploaded.failed.length) {
          setError(`Auto-saved, but ${uploaded.failed.length} image${uploaded.failed.length > 1 ? 's' : ''} (${uploaded.failed.join(', ')}) could not be uploaded to storage and ${uploaded.failed.length > 1 ? 'were' : 'was'} left out of the saved copy — the live session still has ${uploaded.failed.length > 1 ? 'them' : 'it'}. Check SUPABASE_SERVICE_ROLE_KEY / the project-images bucket, then use Save to retry.`)
        }
      } catch (e) {
        // Silent failure hid a missing DB table for weeks — never again.
        setError(`Auto-save to the library FAILED: ${e.message}${/table|schema/i.test(e.message) ? ' — run the projects SQL from lib/supabase.js in the Supabase SQL editor, then use the Save button.' : ' — use the Save button to retry.'}`)
      }
    } catch (e) {
      const activeId = Object.keys(statuses).find(k => statuses[k] === 'active')
      if (activeId) mark(activeId, 'error')
      setError(e.message || 'Something went wrong during generation.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Per-asset actions ──
  async function replaceAsset(slotId, fileList) {
    const file = Array.from(fileList || []).find(f => f.type.startsWith('image/') || /\.svg$/i.test(f.name))
    if (!file) return
    try {
      const png = await fileToPng(file, 1600)
      setAssetsById(prev => ({ ...prev, [slotId]: png.preview }))
    } catch (e) {
      setError(e.message)
    }
  }

  async function regenerateSlot(slot) {
    if (!analysisData || regenIds[slot.id]) return
    setRegenIds(prev => ({ ...prev, [slot.id]: true }))
    try {
      const n = Number(String(slot.id).replace('img_', '')) || 0
      const item = { slot: n, what: slot.name, section: slot.section, source: 'none', action: 'generate', url: null, prompt: slot.prompt || '' }
      const { images } = await callRoute('/api/generate-images', { analysis: { ...analysisData, image_inventory: [item] } })
      const asset = (images?.assets || []).find(a => a.id === slot.id)
      if (asset?.src) setAssetsById(prev => ({ ...prev, [slot.id]: asset.src }))
      // A 200 response can still mean this slot silently produced nothing (e.g.
      // a billing-limit or bad-key failure on a from-scratch "generate" item has
      // no photo to fall back to) — surface the same warning the main
      // generation flow reads instead of leaving the click looking like a no-op.
      if (images?.warning) setError(images.warning)
      else if (!asset?.src) {
        const reason = images?.meta?.failures?.find(f => f.id === slot.id)?.reason
        setError(`Regenerate failed for "${slot.name}"${reason ? `: ${reason}` : ''}.`)
      }
    } catch (e) {
      setError(`Regenerate failed: ${e.message}`)
    } finally {
      setRegenIds(prev => ({ ...prev, [slot.id]: false }))
    }
  }

  function copyHtml() {
    const out = finalHtml()
    if (!out) return
    try { navigator.clipboard?.writeText(out) } catch (_) {}
    setCopiedHtml(true)
    setTimeout(() => setCopiedHtml(false), 1500)
  }

  function downloadHtml() {
    const out = finalHtml()
    if (!out) return
    const blob = new Blob([out], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName(bizName)}-website.html`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  // Rebuild the site with a chosen alternate structure — same analysis, copy,
  // brief, styles, and assets; only the architecture changes. Single fast pass.
  async function switchLayout(alt) {
    if (!lastRunRef.current || rebuilding) return
    setRebuilding(alt.name)
    setError(null)
    try {
      const { html } = await callRoute('/api/build-site', { ...lastRunRef.current, forcedLayout: alt })
      if (html) {
        setHtmlTemplate(html)
        // A deliberately chosen alternate structure UPDATES the lock — this is
        // the one sanctioned way structure changes; regenerations then keep it.
        const dom = lastRunRef.current?.analysis?._source?.domain
        if (dom && alt.section_order?.length) {
          const lock = readStructureLock(dom)
          if (lock) writeStructureLock(dom, { ...lock, sectionOrder: alt.section_order })
          if (lastRunRef.current.structure) lastRunRef.current.structure = { ...lastRunRef.current.structure, sectionOrder: alt.section_order }
        }
        setSavedMsg(`Rebuilt with the "${alt.name}" structure — open the preview to see it`)
        setTimeout(() => setSavedMsg(null), 4000)
      }
    } catch (e) {
      setError(`Could not rebuild with that layout: ${e.message}`)
    } finally {
      setRebuilding(null)
    }
  }

  // The exact payload sent to the code-generation model — full system + user text.
  function downloadPromptTrace() {
    if (!promptTrace) return
    const text = `===== EXACT BUILD PAYLOAD =====\nBusiness: ${bizName || '?'}\nCaptured: ${new Date().toISOString()}\n\n----- SYSTEM PROMPT -----\n${promptTrace.system || ''}\n\n----- USER PROMPT -----\n${promptTrace.user || ''}\n`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName(bizName)}-prompt-trace.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  function copyPrompt(idx, prompt) {
    try { navigator.clipboard?.writeText(prompt) } catch (_) {}
    setCopiedPrompt(idx)
    setTimeout(() => setCopiedPrompt(null), 1500)
  }

  async function downloadAll() {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]
      const src = s.id === 'logo' ? (refinedLogo || assetsById.logo || logo?.preview) : assetsById[s.id]
      if (src) {
        await downloadImage(src, `${i + 1}-${safeName(s.name)}.png`)
        await new Promise(r => setTimeout(r, 400))
      }
    }
  }

  function copyAllInfo() {
    if (!analysisData) return
    const f = analysisData.facts || {}
    const lines = [
      `BUSINESS: ${analysisData.business_name || ''}`,
      `INDUSTRY: ${analysisData.industry || ''}${analysisData.niche ? ` — ${analysisData.niche}` : ''}`,
      f.phone ? `PHONE: ${f.phone}` : null,
      f.emails?.length ? `EMAIL: ${f.emails[0]}` : null,
      f.address ? `ADDRESS: ${f.address}` : null,
      f.hours ? `HOURS: ${f.hours}` : null,
      analysisData.color_palette?.length ? `THEME COLORS: ${analysisData.color_palette.join(', ')}` : null,
    ].filter(Boolean)
    try { navigator.clipboard?.writeText(lines.join('\n')) } catch (_) {}
    setCopiedInfo(true)
    setTimeout(() => setCopiedInfo(false), 1500)
  }

  // ── Shared styles ──
  const label = { fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase' }
  const monoBtn = {
    background: 'transparent', border: `1px solid ${BLUE}`, color: BLUE, borderRadius: 8,
    padding: '9px 16px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.72rem', letterSpacing: '0.05em',
  }
  const card = { width: '100%', background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }
  const stepBadge = (done) => ({
    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.7rem',
    background: done ? GREEN : 'rgba(41,144,250,0.15)',
    color: done ? '#04240f' : BLUE,
    border: `1px solid ${done ? GREEN : 'rgba(41,144,250,0.4)'}`,
  })
  const infoLabel = { ...label, fontSize: '0.56rem', color: BLUE, marginBottom: 3 }
  const infoValue = { fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: '#fff', lineHeight: 1.55, wordBreak: 'break-word' }

  const facts = analysisData?.facts || {}

  return (
    <div style={{ minHeight: '100vh', color: '#fff', position: 'relative' }}>
      <LightningBackground />

      {/* ── App bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: 'rgba(4, 9, 22, 0.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <VelpiLogo size={26} />
          <span style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.25rem', letterSpacing: '0.14em' }}>VELPI STUDIO</span>
        </div>
        <span style={{ ...{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase' }, color: generating ? BLUE : 'rgba(255,255,255,0.4)' }}>
          {generating ? '⚡ Generating' : 'Website Mockup Generator'}
        </span>
      </header>

      <div style={{ position: 'relative', zIndex: 1, padding: '26px 12px 90px' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

        {/* ── STEP 1 — URL ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={stepBadge(!!input.trim())}>{input.trim() ? '✓' : '1'}</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.95rem' }}>Website</span>
          </div>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={generating}
            placeholder="Paste the business website URL"
            style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff', padding: '14px 16px', fontSize: '1rem', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', opacity: generating ? 0.6 : 1 }}
          />
        </div>

        {/* ── STEP 2 — Logo (required) ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={stepBadge(!!logo)}>{logo ? '✓' : '2'}</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.95rem' }}>Business logo</span>
            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: logo ? GREEN : '#ff8a8a' }}>required</span>
          </div>
          <div
            onClick={() => !generating && logoInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (!generating) onLogoFile(e.dataTransfer.files) }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: generating ? 'default' : 'pointer', background: BG, border: `1.5px dashed ${logo ? 'rgba(57,217,138,0.5)' : 'rgba(255,138,138,0.5)'}`, borderRadius: 10, padding: 10 }}
          >
            <div style={{ width: 54, height: 54, borderRadius: 8, background: '#101c30', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {logo ? <img src={logo.preview} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ opacity: 0.3 }}>✦</span>}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: '#fff' }}>
                {logo ? `${logo.name} — tap to change` : 'Upload the business logo (PNG, SVG, or a screenshot)'}
              </div>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                {logo ? 'Auto-refined for the build — upscaled, cleaned, theme colors extracted.' : 'Required before you can generate — used to lock the brand theme and refine into a premium mark.'}
              </div>
              {logoPalette.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.54rem', color: 'rgba(255,255,255,0.4)' }}>theme colors:</span>
                  {logoPalette.map(c => <span key={c} title={c} style={{ width: 13, height: 13, borderRadius: 3, background: c, border: '1px solid rgba(255,255,255,0.25)' }} />)}
                </div>
              )}
            </div>
            {logo && (
              <button onClick={e => { e.stopPropagation(); setLogo(null); setLogoPalette([]); setRefinedLogo(null) }} style={{ background: 'transparent', border: '1px solid rgba(255,68,85,0.4)', color: '#ff6675', borderRadius: 7, padding: '4px 9px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem', flexShrink: 0 }}>✕</button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*,.svg" onChange={e => { onLogoFile(e.target.files); e.target.value = '' }} style={{ display: 'none' }} />
          </div>
          {logo && (
            <input
              value={logoNotes}
              onChange={e => setLogoNotes(e.target.value)}
              disabled={generating}
              placeholder='Optional refinement notes — e.g. "remove the white background"'
              style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff', padding: '10px 13px', fontSize: '0.8rem', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginTop: 8 }}
            />
          )}
        </div>


        {/* ── Library (saved builds — load & keep refining) ── */}
        {projects.length > 0 && (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setLibraryOpen(v => !v)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
            >
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: 'rgba(255,255,255,0.75)' }}>
                📁 Library <span style={{ color: 'rgba(255,255,255,0.4)' }}>({projects.length} saved)</span>
              </span>
              <span style={{ color: BLUE, fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>{libraryOpen ? '▲' : '▼'}</span>
            </button>
            {libraryOpen && (
              <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {projects.map(p => (
                  <div key={p.id} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                    <a href={`/preview/${p.id}`} target="_blank" rel="noreferrer" title="Open live preview" style={{ display: 'block', aspectRatio: '4/5', background: '#0d1626', position: 'relative' }}>
                      {p.thumb ? (
                        <img src={p.thumb} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                      ) : (
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', opacity: 0.3 }}>🖥</span>
                      )}
                    </a>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.54rem', color: 'rgba(255,255,255,0.4)', marginBottom: 7 }}>
                        {p.niche ? `${p.niche} · ` : ''}{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginBottom: confirmDeleteId === p.id ? 5 : 0 }}>
                        <button onClick={() => loadProject(p.id)} disabled={!!loadingProjectId} style={{ ...monoBtn, flex: 1, padding: '5px 0', fontSize: '0.58rem', opacity: loadingProjectId ? 0.5 : 1 }}>
                          {loadingProjectId === p.id ? '…' : 'Load'}
                        </button>
                        <button
                          onClick={() => quickPreviewProjectMobile(p)}
                          disabled={!!mobilePreviewLoadingId}
                          title="Preview on mobile"
                          style={{ ...monoBtn, padding: '5px 9px', fontSize: '0.58rem', opacity: mobilePreviewLoadingId ? 0.5 : 1 }}
                        >{mobilePreviewLoadingId === p.id ? '…' : '📱'}</button>
                        <button
                          onClick={() => { try { navigator.clipboard?.writeText(`${window.location.origin}/preview/${p.id}`) } catch (_) {}; setSavedMsg('Preview link copied'); setTimeout(() => setSavedMsg(null), 2000) }}
                          title="Copy shareable preview link"
                          style={{ ...monoBtn, padding: '5px 9px', fontSize: '0.58rem' }}
                        >⧉</button>
                        <button onClick={() => setConfirmDeleteId(p.id)} title="Delete" style={{ background: 'transparent', border: '1px solid rgba(255,68,85,0.4)', color: '#ff6675', borderRadius: 8, padding: '5px 9px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.58rem' }}>
                          ✕
                        </button>
                      </div>
                      {confirmDeleteId === p.id && (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', background: 'rgba(255,68,85,0.08)', border: '1px solid rgba(255,68,85,0.35)', borderRadius: 8, padding: '5px 7px' }}>
                          <span style={{ flex: 1, fontFamily: 'var(--font-inter)', fontSize: '0.62rem', color: '#ff9aa5' }}>Delete for good?</span>
                          <button onClick={() => removeProject(p.id)} style={{ background: '#ff4455', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 9px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.56rem' }}>Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: '#fff', borderRadius: 6, padding: '4px 9px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.56rem' }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── GENERATE ── */}
        <button
          onClick={runGeneration}
          disabled={!readyToGenerate || generating}
          style={{
            width: '100%', background: readyToGenerate && !generating ? BLUE : '#0d1e33',
            border: `1px solid ${readyToGenerate ? BLUE : BORDER}`, borderRadius: 12, color: readyToGenerate ? '#fff' : 'rgba(255,255,255,0.35)',
            padding: '16px 0', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.9rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: readyToGenerate && !generating ? 'pointer' : 'not-allowed',
          }}
        >
          {generating ? 'Generating…' : 'Generate Website'}
        </button>
        {!readyToGenerate && !generating && (
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', marginTop: -6 }}>
            Add the {missing.join(' and ')} to continue
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ width: '100%', background: '#2a0d12', border: '1px solid #ff4455', borderRadius: 12, padding: '12px 16px', color: '#ffb3bd', fontFamily: 'var(--font-inter)', fontSize: '0.84rem', lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {/* ── Progress ── */}
        {(generating || steps.some(s => s.status !== 'pending')) && (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.map(step => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 2px' }}>
                <StatusDot status={step.status} />
                <span style={{
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.76rem', letterSpacing: '0.03em',
                  color: step.status === 'active' ? BLUE : step.status === 'complete' ? '#fff' : step.status === 'error' ? '#ff6675' : 'rgba(255,255,255,0.4)',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
            {matchedStyleName && (
              <div style={{ marginTop: 6, paddingTop: 10, borderTop: `1px solid ${BORDER}`, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.64rem', color: BLUE, letterSpacing: '0.04em', lineHeight: 1.6 }}>
                ✦ Style: {matchedStyleName}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ RESULTS — preview first, everything else follows ══ */}
      {built && (
        <div style={{ maxWidth: 1140, margin: '26px auto 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── 1. WEBSITE PREVIEW (the hero) ── */}
          <div>
            <div style={{
              border: `1px solid ${BORDER}`, borderRadius: 16, background: PANEL,
              padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
              boxShadow: '0 18px 60px rgba(0,0,0,0.5)',
            }}>
              <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '1.02rem', color: '#fff' }}>
                {bizName ? `${bizName} — website ready` : 'Website ready'}
              </span>
              <button onClick={() => openDevicePreview(previewHtml(), bizName, 'mobile')} style={{ background: BLUE, border: 'none', color: '#fff', borderRadius: 10, padding: '13px 0', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', width: '100%' }}>
                Preview Mobile
              </button>
              <button onClick={() => openDevicePreview(previewHtml(), bizName, 'desktop')} style={{ ...monoBtn, width: '100%', padding: '12px 0' }}>
                Preview Desktop
              </button>
              <button onClick={downloadFullImage} disabled={snapping} style={{ ...monoBtn, width: '100%', padding: '12px 0', opacity: snapping ? 0.6 : 1 }}>
                {snapping ? 'Capturing…' : 'Download as Image (full page)'}
              </button>
            </div>
            {/* Developer Review export toolbar (dev only) — ratings themselves now
                live inside each device preview overlay, scoped per viewport */}
            {isDevReviewClient() && (
              <ReviewExportBar buildId={reviewBuildId} projectId={reviewProjectId} businessName={bizName} getRenderedHtml={() => previewHtml()} />
            )}

            {/* Alternate structures — post-generation option, never upfront */}
            {altLayouts.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ ...label, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  Same content, different architecture — optional
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                  {altLayouts.map(alt => (
                    <div key={alt.name} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '0.86rem', color: '#fff', marginBottom: 4 }}>{alt.name}</div>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 8 }}>{alt.hook}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
                        {(alt.section_order || []).map((s, i) => (
                          <span key={i} style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.54rem', color: BLUE, background: 'rgba(41,144,250,0.1)', border: '1px solid rgba(41,144,250,0.3)', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase' }}>
                            {i + 1}.{s}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => switchLayout(alt)}
                        disabled={!!rebuilding}
                        style={{ ...monoBtn, width: '100%', padding: '8px 0', fontSize: '0.64rem', opacity: rebuilding ? 0.5 : 1 }}
                      >
                        {rebuilding === alt.name ? 'Rebuilding…' : 'Rebuild with this structure'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Build Report UI removed by request — the decision log still exists
              per generation (saved in project data, downloadable as decisions.md
              from the Export row). */}

          {/* ── 2. ASSETS ── */}
          <div style={{ ...card, maxWidth: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ ...label, color: 'rgba(255,255,255,0.55)' }}>
                Assets ({slots.length}){!imagesReady && generating ? ' — generating…' : ''}{imagesMeta ? ` — API verified: ${imagesMeta.generated} generated · ${imagesMeta.enhanced} enhanced · ${imagesMeta.keptOriginal} kept` : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.64rem', color: allLinked ? GREEN : '#e5c07b' }}>
                  {linkedCount}/{slots.length} linked
                </span>
                {imagesReady && <button onClick={downloadAll} style={{ ...monoBtn, padding: '5px 12px', fontSize: '0.62rem' }}>⬇ Download All</button>}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 12 }}>
              Download each asset → upload to your GoHighLevel media library → paste the GHL link back here. The website updates itself.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slots.map((s, i) => {
                const src = s.id === 'logo' ? (refinedLogo || assetsById.logo || logo?.preview || null) : assetsById[s.id]
                const linked = !!ghlUrls[s.id]?.trim()
                return (
                  <div key={s.id} style={{ background: BG, border: `1px solid ${linked ? 'rgba(57,217,138,0.5)' : BORDER}`, borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: 86, height: 62, borderRadius: 8, overflow: 'hidden', background: '#101c30', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={src || placeholderSvg(s.name)} alt={s.name} style={{ width: '100%', height: '100%', objectFit: s.id === 'logo' ? 'contain' : 'cover', display: 'block' }} />
                      {((!src && !imagesReady && generating) || regenIds[s.id]) && (
                        <span className="velpi-loading" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'rgba(6,13,31,0.6)' }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
                        </span>
                      )}
                    </div>
                    <div style={{ flex: '1 1 170px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ ...label, fontSize: '0.6rem', color: BLUE }}>{i + 1}. {s.name}</span>
                        {linked && <span style={{ color: GREEN, fontSize: '0.68rem' }}>✓ linked</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.56rem', color: 'rgba(255,255,255,0.4)' }}>
                        {i + 1}-{safeName(s.name)}.png{s.section ? ` · ${s.section}` : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {src && (
                          <button onClick={() => downloadImage(src, `${i + 1}-${safeName(s.name)}.png`)} title="Download" style={{ ...monoBtn, padding: '3px 9px', fontSize: '0.58rem' }}>⬇</button>
                        )}
                        {s.id === 'logo' && src && (logoMeta?.shape === 'wide' || logoMeta?.shape === 'landscape') && (
                          <button onClick={downloadGhlHeaderLogo} title="Transparent PNG sized for GoHighLevel's fixed-height header container" style={{ ...monoBtn, padding: '3px 9px', fontSize: '0.58rem' }}>⬇ GHL header</button>
                        )}
                        <label style={{ ...monoBtn, padding: '3px 9px', fontSize: '0.58rem', cursor: 'pointer' }}>
                          ⇧ Replace
                          <input type="file" accept="image/*,.svg" onChange={e => { replaceAsset(s.id, e.target.files); e.target.value = '' }} style={{ display: 'none' }} />
                        </label>
                        {s.id !== 'logo' && s.prompt && (
                          <>
                            <button onClick={() => regenerateSlot(s)} disabled={!!regenIds[s.id]} style={{ ...monoBtn, padding: '3px 9px', fontSize: '0.58rem', opacity: regenIds[s.id] ? 0.5 : 1 }}>
                              {regenIds[s.id] ? '…' : '↻ Regenerate'}
                            </button>
                            <button onClick={() => copyPrompt(i, s.prompt)} style={{ ...monoBtn, padding: '3px 9px', fontSize: '0.58rem' }}>
                              {copiedPrompt === i ? '✓' : '⧉ prompt'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <input
                      value={ghlUrls[s.id] || ''}
                      onChange={e => setGhlUrls(prev => ({ ...prev, [s.id]: e.target.value }))}
                      placeholder="Paste GoHighLevel asset URL"
                      style={{ flex: '2 1 240px', minWidth: 200, background: '#101c30', border: `1px solid ${linked ? 'rgba(57,217,138,0.5)' : BORDER}`, borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: '0.74rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── 3. FINALIZE & EXPORT — swapping in GHL media URLs is the standard
                 path to a production file, not an afterthought. Export is never
                 locked, but the steps make the expected flow explicit. ── */}
          <div style={{ ...card, maxWidth: 'none', border: `1px solid ${allLinked ? 'rgba(57,217,138,0.5)' : BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ minWidth: 260 }}>
                <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>
                  {allLinked ? '✓ Finalized — production-ready' : 'Finalize & Export'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  {[
                    { n: 1, text: 'Images generated', done: imagesReady },
                    { n: 2, text: `GHL media URLs linked ${linkedCount}/${slots.length}`, done: allLinked },
                    { n: 3, text: 'Export final HTML', done: false },
                  ].map(step => (
                    <span key={step.n} style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem', letterSpacing: '0.04em', padding: '3px 9px', borderRadius: 99, border: `1px solid ${step.done ? 'rgba(57,217,138,0.5)' : BORDER}`, color: step.done ? GREEN : 'rgba(255,255,255,0.55)' }}>
                      {step.done ? '✓' : step.n}. {step.text}
                    </span>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  {allLinked
                    ? 'Every slot points at a GoHighLevel media URL. This HTML deploys to GHL with zero manual edits.'
                    : `Standard path: upload each image above to your GoHighLevel media library and paste its URL per slot — ${slots.length - linkedCount} slot${slots.length - linkedCount === 1 ? '' : 's'} left. Exporting now embeds the AI images directly (works, but heavier and not production-final).`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={downloadPdf} disabled={makingPdf} style={{ ...monoBtn, background: BLUE, borderColor: BLUE, color: '#fff', opacity: makingPdf ? 0.6 : 1 }}>
                  {makingPdf ? 'Rendering PDF…' : '⬇ Download PDF'}
                </button>
                <button onClick={copyHtml} style={{ ...monoBtn, ...(allLinked ? { background: GREEN, borderColor: GREEN, color: '#04240f' } : {}) }}>{copiedHtml ? 'Copied ✓' : (allLinked ? '⧉ Copy Final HTML' : '⧉ Copy HTML (draft)')}</button>
                <button onClick={downloadHtml} style={monoBtn}>⬇ HTML file</button>
                {promptTrace && <button onClick={downloadPromptTrace} style={monoBtn}>⬇ prompt-trace</button>}
                <button onClick={() => setShowCode(v => !v)} style={monoBtn}>{showCode ? 'Hide code' : '</> Code'}</button>
              </div>
            </div>
            {showCode && (
              <pre style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, fontSize: '0.66rem', fontFamily: 'var(--font-ibm-plex-mono)', color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 420, overflowY: 'auto', marginTop: 12 }}>
                {finalHtml()}
              </pre>
            )}
          </div>

          {/* ── 4. PROJECT DETAILS (collapsed) ── */}
          {analysisData && (
            <div style={{ ...card, maxWidth: 'none', padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setDetailsOpen(v => !v)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
              >
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: 'rgba(255,255,255,0.75)' }}>Project details</span>
                <span style={{ color: BLUE, fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>{detailsOpen ? '▲' : '▼'}</span>
              </button>
              {detailsOpen && (
                <div style={{ padding: '0 18px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                    <button onClick={copyAllInfo} style={{ ...monoBtn, padding: '3px 10px', fontSize: '0.58rem' }}>{copiedInfo ? '✓ Copied' : '⧉ Copy All'}</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <div style={infoLabel}>Business</div>
                      <div style={{ ...infoValue, fontWeight: 600 }}>{analysisData.business_name}</div>
                      <div style={{ ...infoValue, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                        {analysisData.industry}{analysisData.niche ? ` — ${analysisData.niche}` : ''}
                      </div>
                    </div>
                    {facts.phone && <div><div style={infoLabel}>Phone</div><div style={infoValue}>{facts.phone}</div></div>}
                    {facts.emails?.length > 0 && <div><div style={infoLabel}>Email</div><div style={infoValue}>{facts.emails[0]}</div></div>}
                    {facts.address && <div><div style={infoLabel}>Address</div><div style={infoValue}>{facts.address}</div></div>}
                    {facts.hours && <div><div style={infoLabel}>Hours</div><div style={{ ...infoValue, whiteSpace: 'pre-wrap' }}>{facts.hours}</div></div>}
                    {analysisData.color_palette?.length > 0 && (
                      <div>
                        <div style={infoLabel}>Theme Colors</div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {analysisData.color_palette.map((c, i) => (
                            <div key={i} title={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 15, height: 15, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block' }} />
                              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.56rem', color: 'rgba(255,255,255,0.5)' }}>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysisData.brand?.design_language && (
                      <div><div style={infoLabel}>Design Language</div><div style={{ ...infoValue, fontSize: '0.76rem' }}>{analysisData.brand.design_language}</div></div>
                    )}
                    {analysisData.brand?.brand_personality && (
                      <div><div style={infoLabel}>Brand Personality</div><div style={{ ...infoValue, fontSize: '0.76rem' }}>{analysisData.brand.brand_personality}</div></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* ── 5. SAVE TO LIBRARY ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={saveProjectToLibrary}
              disabled={savingProject || !htmlTemplate}
              style={{
                width: '100%', background: savingProject ? 'rgba(41,144,250,0.25)' : BLUE, border: 'none',
                borderRadius: 12, color: '#fff', padding: '15px 0',
                fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: savingProject ? 'wait' : 'pointer',
              }}
            >
              {savingProject ? 'Saving…' : '💾 Save to Library'}
            </button>
          </div>
        </div>
      )}

      {/* ── Global toast (saves, copied links) ── */}
      {savedMsg && (
        <div style={{
          position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          background: 'rgba(10, 22, 40, 0.96)', border: `1px solid ${GREEN}`, borderRadius: 10,
          padding: '10px 18px', color: GREEN, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.7rem',
          letterSpacing: '0.04em', maxWidth: '92vw', textAlign: 'center',
        }}>
          ✓ {savedMsg}
        </div>
      )}

      {/* Device previews open the dedicated /device-preview page in a new
          tab — the popup/modal is gone (its height-clamped frame was the
          popup-vs-page divergence). */}
      </div>
    </div>
  )
}

function StatusDot({ status }) {
  if (status === 'complete') {
    return <span style={{ width: 18, height: 18, borderRadius: '50%', background: BLUE, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff' }}>✓</span>
  }
  if (status === 'error') {
    return <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#ff4455', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff' }}>!</span>
  }
  if (status === 'active') {
    return (
      <span className="velpi-loading" style={{ width: 18, height: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
      </span>
    )
  }
  return <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `1px solid ${BORDER}`, background: 'transparent' }} />
}
