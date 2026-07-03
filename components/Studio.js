'use client'
import { useState, useEffect } from 'react'
import { pickCreativeMix } from '../lib/designStyles'
import LightningBackground from './LightningBackground'

// Vibe questionnaire — quick multiple-choice (tap up to 2 per question). The
// answers steer style mixing + the build direction so every site is themed to
// the brand's vibe instead of one default format per industry.
// Vibe picker — every option is a tiny visual preview of the look, with a
// plain-English description. `ai` is the richer phrasing sent to the agent.
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

// Hand-drawn mini website previews (pure CSS) so every vibe option is SEEN,
// not decoded from marketing words.
function MiniPreview({ kind }) {
  const box = { width: '100%', aspectRatio: '16/10', borderRadius: 8, overflow: 'hidden', position: 'relative', display: 'block' }
  const bar = (w, h, bg, extra = {}) => <div style={{ width: w, height: h, background: bg, borderRadius: 2, ...extra }} />
  switch (kind) {
    case 'lux': return (
      <div style={{ ...box, background: '#161210', padding: '8px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          {bar(14, 3, '#c9a35f')}{bar(30, 2, 'rgba(255,255,255,0.25)')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 8 }}>
          {bar('55%', 5, '#e9dfd0')}{bar('35%', 3, '#c9a35f')}{bar(26, 8, 'transparent', { border: '1px solid #c9a35f', marginTop: 5 })}
        </div>
      </div>)
    case 'bold': return (
      <div style={{ ...box, background: '#f2f0eb', padding: '7px 9px' }}>
        {bar('88%', 11, '#111', { marginBottom: 4 })}
        {bar('66%', 11, '#111', { marginBottom: 7 })}
        <div style={{ display: 'flex', gap: 4 }}>{bar(34, 10, '#e8442e')}{bar(20, 10, 'transparent', { border: '1.5px solid #111' })}</div>
      </div>)
    case 'warm': return (
      <div style={{ ...box, background: '#f7eede', padding: '8px 10px' }}>
        <div style={{ position: 'absolute', top: 8, right: 10, width: 18, height: 18, borderRadius: '50%', background: '#e8a75d' }} />
        <div style={{ marginTop: 14 }}>
          {bar('52%', 6, '#7a4a2b', { borderRadius: 4, marginBottom: 4 })}
          {bar('40%', 4, 'rgba(122,74,43,0.5)', { borderRadius: 4, marginBottom: 8 })}
          {bar(38, 11, '#c96f3b', { borderRadius: 7 })}
        </div>
      </div>)
    case 'minimal': return (
      <div style={{ ...box, background: '#ffffff', padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>{bar(12, 3, '#111')}{bar(26, 2, '#ccc')}</div>
        {bar('44%', 4, '#111', { marginBottom: 4 })}
        {bar('30%', 2.5, '#bbb', { marginBottom: 10 })}
        {bar(26, 8, '#111')}
      </div>)
    case 'editorial': return (
      <div style={{ ...box, background: '#f4f2ec', padding: 0 }}>
        <div style={{ position: 'absolute', left: 8, top: 9, zIndex: 2 }}>
          {bar(52, 7, '#191919', { marginBottom: 3 })}{bar(36, 7, '#191919')}
        </div>
        <div style={{ position: 'absolute', right: 6, top: 20, width: '46%', height: '58%', background: 'linear-gradient(140deg,#8d9aa8,#5b6673)', borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: 10, bottom: 8 }}>{bar(30, 2.5, '#999', { marginBottom: 2 })}{bar(40, 2.5, '#999')}</div>
      </div>)
    case 'classic': return (
      <div style={{ ...box, background: '#fff' }}>
        <div style={{ height: '26%', background: '#1d3557', display: 'flex', alignItems: 'center', padding: '0 9px', gap: 5 }}>
          {bar(10, 4, '#d4af6a')}{bar(22, 2.5, 'rgba(255,255,255,0.6)')}
        </div>
        <div style={{ display: 'flex', gap: 5, padding: '9px 9px 0' }}>
          {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: 26, background: '#eef1f5', borderRadius: 2, borderTop: '2px solid #1d3557' }} />)}
        </div>
      </div>)
    case 'photos': return (
      <div style={{ ...box, background: 'linear-gradient(150deg,#3d6b8f 0%,#27476b 55%,#152a45 100%)' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '52%', background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 9 }}>
          {bar(58, 6, '#fff', { marginBottom: 3 })}{bar(30, 8, '#e8b23a', { marginTop: 3 })}
        </div>
      </div>)
    case 'airy': return (
      <div style={{ ...box, background: '#fdfdfc', padding: '16px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginTop: 6 }}>
          {bar('36%', 4, '#2a2a2a')}{bar('24%', 2.5, '#c8c8c4')}{bar(22, 7, 'transparent', { border: '1px solid #2a2a2a', marginTop: 6 })}
        </div>
      </div>)
    case 'dark': return (
      <div style={{ ...box, background: '#0b0e14', padding: '10px 11px' }}>
        {bar('50%', 6, '#e8ecf4', { marginBottom: 4 })}
        {bar('34%', 3, '#4f6b8f', { marginBottom: 9 })}
        {bar(32, 9, '#2990fa', { boxShadow: '0 0 10px rgba(41,144,250,0.7)' })}
        <div style={{ position: 'absolute', right: 8, top: 10, width: 26, height: 26, borderRadius: '50%', background: 'radial-gradient(circle,#22344f 0%,transparent 70%)' }} />
      </div>)
    case 'blocks': return (
      <div style={{ ...box }}>
        <div style={{ height: '34%', background: '#264653', padding: '6px 8px' }}>{bar(38, 4, '#fff')}</div>
        <div style={{ height: '33%', background: '#e9c46a', padding: '6px 8px' }}>{bar(30, 4, '#264653')}</div>
        <div style={{ height: '33%', background: '#e76f51', padding: '6px 8px' }}>{bar(34, 4, '#fff')}</div>
      </div>)
    case 'grid': return (
      <div style={{ ...box, background: '#fafafa', padding: '8px 9px' }}>
        {bar('34%', 4, '#222', { marginBottom: 6 })}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ height: 15, background: '#e7e9ee', borderRadius: 2 }} />)}
        </div>
      </div>)
    case 'layered': return (
      <div style={{ ...box, background: '#e9e4dc' }}>
        <div style={{ position: 'absolute', left: 7, top: 7, width: '58%', height: '68%', background: 'linear-gradient(150deg,#7d8a99,#4c5866)', borderRadius: 4 }} />
        <div style={{ position: 'absolute', right: 7, bottom: 7, width: '52%', height: '56%', background: '#fff', borderRadius: 4, boxShadow: '0 6px 16px rgba(0,0,0,0.25)', padding: '6px 7px' }}>
          {bar('70%', 4, '#1a1a1a', { marginBottom: 3 })}{bar('50%', 2.5, '#b5b5b0', { marginBottom: 5 })}{bar(20, 6, '#c96f3b')}
        </div>
      </div>)
    default: return <div style={{ ...box, background: '#101c30' }} />
  }
}

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
  { id: 'elevate', label: 'Elevating design — pass 2' },
  { id: 'perfect', label: 'Refinement loop — critique & fix (up to 3 rounds)' },
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

function placeholderSvg(text) {
  const t = encodeURIComponent((text || 'image').slice(0, 40))
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect width='100%25' height='100%25' fill='%23233248'/%3E%3Ctext x='50%25' y='50%25' fill='%237d8aa0' font-family='monospace' font-size='36' text-anchor='middle'%3E${t}%3C/text%3E%3C/svg%3E`
}

function parseBulkStyles(text) {
  const blocks = text.split(/\n={5,}\n?/).map(b => b.trim()).filter(Boolean)
  const out = []
  for (const block of blocks) {
    const lines = block.split('\n')
    const name = (lines.shift() || '').trim()
    let niches = ''
    if (lines[0] && /^niches\s*:/i.test(lines[0])) {
      niches = lines.shift().replace(/^niches\s*:/i, '').trim()
    }
    const content = lines.join('\n').trim()
    if (name && content) out.push({ name, niches, content })
  }
  return out
}

// Plain-text report of everything the generator extracted, decided, and used —
// made to be copy-pasted into a chat so the "thinking" can be critiqued.
function composeReport(analysis, vibeText, chosenStyles, photoSlots, pass2Applied, designBrief) {
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
  L.push(`Second elevation pass applied: ${pass2Applied ? 'yes' : 'NO — pass 1 only'}`)
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
  L.push('===== END REPORT =====')
  return L.join('\n')
}

export default function Studio() {
  // ── Setup inputs ──
  const [input, setInput] = useState('')
  const [logo, setLogo] = useState(null)            // { data, preview, name } original upload
  const [logoNotes, setLogoNotes] = useState('')
  const [vibe, setVibe] = useState({})              // question id -> up to 2 selected options
  const [refinedLogo, setRefinedLogo] = useState(null) // data uri after refinement

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

  // ── Project library ──
  const [projects, setProjects] = useState([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [savingProject, setSavingProject] = useState(false)
  const [savedMsg, setSavedMsg] = useState(null)
  const [loadingProjectId, setLoadingProjectId] = useState(null)
  const [regenIds, setRegenIds] = useState({})

  // ── Styles library ──
  const [styles, setStyles] = useState([])
  const [styleId, setStyleId] = useState('auto')
  const [styleOpen, setStyleOpen] = useState(false)
  const [matchedStyleName, setMatchedStyleName] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [newStyleName, setNewStyleName] = useState('')
  const [newStyleNiches, setNewStyleNiches] = useState('')
  const [newStyleContent, setNewStyleContent] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [bulkStatus, setBulkStatus] = useState(null)
  const [savingStyle, setSavingStyle] = useState(false)

  // ── Results UI ──
  const [showCode, setShowCode] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(null)
  const [copiedInfo, setCopiedInfo] = useState(false)

  useEffect(() => {
    fetch('/api/styles').then(r => r.json()).then(d => setStyles(d.styles || [])).catch(() => {})
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {})
  }, [])

  // ── Project library: save / load / delete ──
  async function saveProjectToLibrary() {
    if (!htmlTemplate || savingProject) return
    setSavingProject(true)
    setError(null)
    try {
      const name = `${bizName || 'Untitled'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      const data = {
        bizName, analysisData, slots, assetsById, ghlUrls, htmlTemplate, buildReport,
        vibe, refinedLogo, logoUrl, input,
        savedAt: new Date().toISOString(),
      }
      const { project } = await callRoute('/api/projects', { name, data })
      setProjects(prev => [project, ...prev])
      setSavedMsg(`Saved "${project.name}" to the library`)
      setTimeout(() => setSavedMsg(null), 3000)
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
      setLogoUrl(d.logoUrl || null)
      setInput(d.input || '')
      setBuilt(!!d.htmlTemplate)
      setImagesReady(true)
      setSteps(STEP_DEFS.map(s => ({ ...s, status: 'complete' })))
      setLibraryOpen(false)
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
    } catch (_) {}
  }

  // The logo is auto-detected from the website and refined automatically —
  // uploading one is now just an optional override.
  const readyToGenerate = !!input.trim()
  const missing = [!input.trim() && 'website URL'].filter(Boolean)
  const vibeCount = Object.values(vibe).reduce((a, arr) => a + (arr?.length || 0), 0)

  function toggleVibe(qid, opt) {
    setVibe(prev => {
      const cur = prev[qid] || []
      if (cur.includes(opt)) return { ...prev, [qid]: cur.filter(o => o !== opt) }
      if (cur.length >= 2) return { ...prev, [qid]: [cur[1], opt] } // keep newest two
      return { ...prev, [qid]: [...cur, opt] }
    })
  }

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
    return htmlTemplate.replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, id) => {
      if (ghlUrls[id]?.trim()) return ghlUrls[id].trim()
      if (assetsById[id]) return assetsById[id]
      if (id === 'logo') return refinedLogo || logo?.preview || logoUrl || placeholderSvg('logo')
      const slot = slots.find(s => s.id === id)
      return placeholderSvg(slot ? slot.name : id)
    })
  }

  function finalHtml() {
    if (!htmlTemplate) return ''
    return htmlTemplate.replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, id) => {
      if (ghlUrls[id]?.trim()) return ghlUrls[id].trim()
      if (id === 'logo') return logoUrl || 'https://PASTE-LOGO-URL-HERE'
      const n = slots.findIndex(s => s.id === id) + 1
      return `https://PASTE-IMAGE-${n || 'X'}-URL-HERE`
    })
  }

  function openPreview() {
    const out = previewHtml()
    if (!out) return
    const blob = new Blob([out], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  // Capture the whole rendered mockup as ONE tall PNG you can scroll through.
  async function downloadFullImage() {
    const out = previewHtml()
    if (!out || snapping) return
    setSnapping(true)
    const frame = document.createElement('iframe')
    try {
      frame.style.cssText = 'position:fixed;left:-99999px;top:0;width:1440px;height:2000px;border:none;'
      frame.setAttribute('sandbox', 'allow-same-origin')
      document.body.appendChild(frame)
      frame.srcdoc = out
      await new Promise(res => { frame.onload = res })
      await new Promise(res => setTimeout(res, 1200)) // let fonts/images settle
      const doc = frame.contentDocument
      const fullH = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0)
      frame.style.height = `${Math.min(fullH + 40, 30000)}px`
      await new Promise(res => setTimeout(res, 300))
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(doc.documentElement, {
        useCORS: true, allowTaint: false, backgroundColor: '#ffffff',
        windowWidth: 1440, width: 1440, height: Math.min(fullH, 30000), scale: 1, logging: false,
      })
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `${safeName(bizName)}-mockup-fullpage.png`
      a.click()
    } catch (e) {
      setError(`Could not capture the full-page image: ${e.message}. The Open Full Preview tab + your browser's full-page screenshot works as a fallback.`)
    } finally {
      try { document.body.removeChild(frame) } catch (_) {}
      setSnapping(false)
    }
  }

  const linkedCount = slots.filter(s => ghlUrls[s.id]?.trim()).length
  const allLinked = slots.length > 0 && linkedCount === slots.length

  // ── Logo upload ──
  // ── Styles save ──
  async function saveNewStyle() {
    if (savingStyle) return
    setSavingStyle(true)
    setError(null)
    setBulkStatus(null)
    try {
      if (bulkMode) {
        const parsed = parseBulkStyles(bulkText)
        if (!parsed.length) throw new Error('No styles found. Separate each with a line of ===== — first line is the name, optional "Niches: a, b" line, then the DESIGN.md content.')
        let ok = 0
        const added = []
        for (const p of parsed) {
          try {
            const { style } = await callRoute('/api/styles', p)
            added.push(style); ok++
          } catch (e) {
            setBulkStatus(`Imported ${ok}/${parsed.length} — stopped on "${p.name}": ${e.message}`)
            break
          }
        }
        if (ok === parsed.length) { setBulkStatus(`Imported all ${ok} styles.`); setBulkText('') }
        if (added.length) setStyles(prev => [...prev.filter(s => s.builtIn), ...added, ...prev.filter(s => !s.builtIn)])
      } else {
        if (!newStyleName.trim() || !newStyleContent.trim()) return
        const { style } = await callRoute('/api/styles', { name: newStyleName, content: newStyleContent, niches: newStyleNiches })
        setStyles(prev => [...prev.filter(s => s.builtIn), style, ...prev.filter(s => !s.builtIn)])
        setStyleId(style.id)
        setNewStyleName(''); setNewStyleNiches(''); setNewStyleContent('')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingStyle(false)
    }
  }

  // ── Generation ──
  async function runGeneration() {
    if (!readyToGenerate || generating) return
    setError(null)
    setBuilt(false)
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
      const refinePayload = logo
        ? { b64: logo.data, instructions: logoNotes.trim() }
        : (scrapedData.logo ? { url: scrapedData.logo, instructions: logoNotes.trim() } : null)
      const refineP = refinePayload
        ? callRoute('/api/refine-logo', refinePayload)
            .then(res => {
              if (res.b64) {
                const uri = `data:image/png;base64,${res.b64}`
                setRefinedLogo(uri)
                setAssetsById(prev => ({ ...prev, logo: uri }))
              } else if (res.src || logo?.preview) {
                // Unsupported format or refine failure — use the raw source.
                setAssetsById(prev => ({ ...prev, logo: res.src || logo.preview }))
              }
              mark('logo', 'complete')
            })
            .catch(() => {
              const fallback = logo?.preview || scrapedData.logo
              if (fallback) setAssetsById(prev => ({ ...prev, logo: fallback }))
              mark('logo', 'complete')
            })
        : Promise.resolve().then(() => mark('logo', 'complete')) // no logo found — build uses a text wordmark

      mark('analyze', 'active')
      const vibeText = vibeSummary()
      const { analysis } = await callRoute('/api/analyze', { scrapedData, vibe: vibeText })
      setBizName(analysis.business_name || '')
      setAnalysisData(analysis)
      setLogoUrl(analysis._source?.logo || scrapedData.logo || null)

      const inv = analysis.image_inventory || []
      const photoSlots = inv
        .map((item, i) => ({ item, id: slotIdFor(item, i) }))
        .filter(x => x.id !== 'logo')
        .map(x => ({ id: x.id, name: x.item.what || x.id, section: x.item.section || '', prompt: x.item.prompt || '' }))
      setSlots([...photoSlots, { id: 'logo', name: 'Logo', section: 'header', prompt: '' }])

      let chosenStyles = []
      const manual = styles.find(s => s.id === styleId)
      if (manual) chosenStyles = [manual]
      else if (styleId === 'auto') {
        // Creative mix: niche anchor + vibe carrier + wildcard — vibe answers
        // change the blend, so the same industry doesn't always look the same.
        chosenStyles = pickCreativeMix(
          styles,
          `${analysis.industry || ''} ${analysis.niche || ''} ${analysis.primary_service || ''}`,
          `${vibeText} ${analysis.tone || ''} ${analysis.brand?.brand_personality || ''} ${analysis.brand?.design_language || ''}`,
          3,
        )
      }
      setMatchedStyleName(chosenStyles.map(s => s.name).join('  +  '))
      mark('analyze', 'complete')

      // Design brief — a creative director fuses brand + vibe + the matched
      // systems into ONE committed spec before any HTML is written.
      mark('brief', 'active')
      let designBrief = ''
      try {
        const res = await callRoute('/api/design-brief', { analysis, vibe: vibeText, styleMds: chosenStyles.map(s => s.content) })
        designBrief = res.brief || ''
        mark('brief', 'complete')
      } catch (_) {
        mark('brief', 'error') // non-fatal — build falls back to raw systems
      }

      mark('images', 'active')
      const imagesPromise = callRoute('/api/generate-images', { analysis })
        .then(({ images }) => {
          const map = {}
          for (const a of images?.assets || []) {
            if (a.src) map[a.id] = a.src
          }
          // Never let a scraped logo overwrite the refined upload.
          setAssetsById(prev => ({ ...map, ...(prev.logo ? { logo: prev.logo } : {}) }))
          setImagesReady(true)
          mark('images', 'complete')
        })
        .catch(e => {
          mark('images', 'error')
          setError(`Image generation: ${e.message} (the website is still usable — slots show placeholders)`)
        })

      mark('copy', 'active')
      const { copy } = await callRoute('/api/generate-copy', { analysis })
      mark('copy', 'complete')

      mark('build', 'active')
      const { html } = await callRoute('/api/build-site', {
        analysis, copy,
        vibe: vibeText,
        slots: [
          { id: 'logo', name: 'Logo', section: 'header' },
          ...photoSlots.map(s => ({ id: s.id, name: s.name, section: s.section })),
        ],
        styleMds: chosenStyles.map(s => s.content),
        brief: designBrief,
      })
      setHtmlTemplate(html)
      setBuilt(true)
      mark('build', 'complete')

      // PASS 2 — art-director elevation: the first draft is re-prompted against
      // itself to push composition, density, and premium detail past the single-
      // response ceiling. Falls back to pass 1 untouched if anything goes wrong.
      mark('elevate', 'active')
      let pass2Applied = false
      let workingHtml = html
      try {
        const res = await callRoute('/api/enhance-site', { html, analysis, vibe: vibeText, brief: designBrief })
        if (res.html) {
          workingHtml = res.html
          setHtmlTemplate(res.html)
          pass2Applied = !!res.pass2
        }
        mark('elevate', 'complete')
      } catch (_) {
        mark('elevate', 'error') // non-fatal — pass-1 site stays usable
      }

      // REFINEMENT LOOP — critique -> surgical fix, up to 3 rounds, until the
      // QA director passes it as deliverable. Every round is non-fatal.
      mark('perfect', 'active')
      let loopLog = []
      try {
        for (let round = 1; round <= 3; round++) {
          const crit = await callRoute('/api/critique-site', { html: workingHtml, analysis, brief: designBrief })
          if (crit.pass || !crit.issues?.length) {
            loopLog.push(`Round ${round}: PASSED${crit.score != null ? ` (score ${crit.score})` : ''} — deliverable.`)
            break
          }
          loopLog.push(`Round ${round}: score ${crit.score ?? '?'} — fixing ${crit.issues.length} issue(s): ${crit.issues.map(i => i.issue).join(' | ').slice(0, 400)}`)
          const fix = await callRoute('/api/enhance-site', { html: workingHtml, analysis, vibe: vibeText, brief: designBrief, issues: crit.issues })
          if (fix.html && fix.pass2) {
            workingHtml = fix.html
            setHtmlTemplate(fix.html)
          } else {
            loopLog.push(`Round ${round}: fix failed safety gates — keeping previous version.`)
            break
          }
        }
        mark('perfect', 'complete')
      } catch (_) {
        mark('perfect', 'error') // non-fatal — latest good version stands
      }

      // Build report — everything the generator thought and used, copyable.
      const report = composeReport(analysis, vibeText, chosenStyles, photoSlots, pass2Applied, designBrief)
        + (loopLog.length ? `\n--- REFINEMENT LOOP ---\n${loopLog.join('\n')}\n` : '')
      setBuildReport(report)

      await Promise.all([imagesPromise, refineP])
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
    } catch (e) {
      setError(`Regenerate failed: ${e.message}`)
    } finally {
      setRegenIds(prev => ({ ...prev, [slot.id]: false }))
    }
  }

  async function sendEdit() {
    const instruction = chatInput.trim()
    if (!instruction || editing || !htmlTemplate) return
    setEditing(true)
    setError(null)
    try {
      const { html: updated } = await callRoute('/api/edit-site', {
        html: htmlTemplate, instruction,
        palette: analysisData?.color_palette || [],
      })
      setHtmlTemplate(updated)
      setChatInput('')
    } catch (e) {
      setError(e.message || 'Could not apply that change.')
    } finally {
      setEditing(false)
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
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

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

        {/* Logo is fully automatic now — detected from the site, refined, and it
            populates in the Assets section below with the other images. */}

        {/* ── STEP 2 — Vibe (multiple choice, up to 2 per question) ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={stepBadge(vibeCount > 0)}>{vibeCount > 0 ? '✓' : '2'}</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.95rem' }}>Set the vibe</span>
            <span style={{ ...label, fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>tap up to 2 each</span>
          </div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>
            These steer the design — the blend of styles, mood, and what the site pushes visitors to do.
          </div>
          {VIBE_QUESTIONS.map(q => (
            <div key={q.id} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', fontWeight: 600, color: '#fff', marginBottom: 8 }}>{q.q}</div>
              <div style={{ display: 'grid', gridTemplateColumns: q.id === 'convert' ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                {q.options.map(opt => {
                  const on = (vibe[q.id] || []).includes(opt.label)
                  return (
                    <div
                      key={opt.label}
                      onClick={() => !generating && toggleVibe(q.id, opt.label)}
                      style={{
                        background: on ? 'rgba(41,144,250,0.14)' : BG,
                        border: `1.5px solid ${on ? BLUE : BORDER}`,
                        borderRadius: 12, padding: 7, cursor: generating ? 'default' : 'pointer',
                        position: 'relative',
                      }}
                    >
                      {on && (
                        <span style={{ position: 'absolute', top: 5, right: 5, zIndex: 2, width: 18, height: 18, borderRadius: '50%', background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem' }}>✓</span>
                      )}
                      {opt.preview ? (
                        <MiniPreview kind={opt.preview} />
                      ) : (
                        <div style={{ width: '100%', aspectRatio: '16/7', borderRadius: 8, background: 'rgba(6,13,31,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                          {opt.icon}
                        </div>
                      )}
                      <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.78rem', color: '#fff', margin: '7px 2px 2px' }}>{opt.label}</div>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', margin: '0 2px', lineHeight: 1.35 }}>{opt.desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Design style (collapsed) ── */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <button
            onClick={() => setStyleOpen(v => !v)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
          >
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: 'rgba(255,255,255,0.75)' }}>
              Design style: <span style={{ color: '#fff', fontWeight: 600 }}>{styleId === 'auto' ? '✦ Auto-Match' : (styles.find(s => s.id === styleId)?.name || 'Custom')}</span>
            </span>
            <span style={{ color: BLUE, fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>{styleOpen ? '▲' : '▼'}</span>
          </button>
          {styleOpen && (
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8, marginBottom: 12 }}>
                <div
                  onClick={() => setStyleId('auto')}
                  style={{ background: styleId === 'auto' ? 'rgba(41,144,250,0.12)' : BG, border: `1px solid ${styleId === 'auto' ? BLUE : BORDER}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}
                >
                  <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.8rem', marginBottom: 3 }}>✦ Auto-Match</div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                    Detects the niche, mixes the best matching systems
                  </div>
                </div>
                {styles.map(s => {
                  const tags = Array.isArray(s.niches) ? s.niches : String(s.niches || '').split(',').map(t => t.trim()).filter(Boolean)
                  const active = styleId === s.id
                  return (
                    <div key={s.id} onClick={() => setStyleId(s.id)} style={{ background: active ? 'rgba(41,144,250,0.12)' : BG, border: `1px solid ${active ? BLUE : BORDER}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                      <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.8rem', marginBottom: 4 }}>{s.builtIn ? '' : '◆ '}{s.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {tags.slice(0, 3).map(t => (
                          <span key={t} style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.52rem', color: BLUE, background: 'rgba(41,144,250,0.1)', border: '1px solid rgba(41,144,250,0.3)', borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase' }}>{t}</span>
                        ))}
                        {tags.length > 3 && <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)' }}>+{tags.length - 3}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Add styles */}
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ ...label, color: BLUE }}>Add design system{bulkMode ? 's (bulk)' : ''}</span>
                  <button onClick={() => { setBulkMode(v => !v); setBulkStatus(null) }} style={{ ...monoBtn, padding: '3px 10px', fontSize: '0.58rem' }}>
                    {bulkMode ? 'Single' : 'Bulk import'}
                  </button>
                </div>
                {bulkMode ? (
                  <>
                    <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6}
                      placeholder={'Name\nNiches: restaurant, cafe\n# DESIGN.md content...\n=====\nNext style...'}
                      style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: '0.74rem', fontFamily: 'var(--font-ibm-plex-mono)', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
                    {bulkStatus && <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.64rem', color: bulkStatus.startsWith('Imported all') ? GREEN : '#e5c07b', marginBottom: 8 }}>{bulkStatus}</div>}
                    <button onClick={saveNewStyle} disabled={savingStyle || !bulkText.trim()} style={{ ...monoBtn, background: BLUE, color: '#fff', opacity: savingStyle || !bulkText.trim() ? 0.5 : 1 }}>
                      {savingStyle ? 'Importing…' : 'Import All'}
                    </button>
                  </>
                ) : (
                  <>
                    <input value={newStyleName} onChange={e => setNewStyleName(e.target.value)} placeholder="Style name"
                      style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff', padding: '9px 12px', fontSize: '0.8rem', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: 6 }} />
                    <input value={newStyleNiches} onChange={e => setNewStyleNiches(e.target.value)} placeholder="Niches (comma-separated) — powers Auto-Match"
                      style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff', padding: '9px 12px', fontSize: '0.8rem', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: 6 }} />
                    <textarea value={newStyleContent} onChange={e => setNewStyleContent(e.target.value)} rows={5} placeholder="Paste the DESIGN.md content…"
                      style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff', padding: '9px 12px', fontSize: '0.74rem', fontFamily: 'var(--font-ibm-plex-mono)', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
                    <button onClick={saveNewStyle} disabled={savingStyle || !newStyleName.trim() || !newStyleContent.trim()} style={{ ...monoBtn, background: BLUE, color: '#fff', opacity: savingStyle || !newStyleName.trim() || !newStyleContent.trim() ? 0.5 : 1 }}>
                      {savingStyle ? 'Saving…' : 'Save Style'}
                    </button>
                  </>
                )}
              </div>
            </div>
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
              <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {projects.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.56rem', color: 'rgba(255,255,255,0.4)' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                    <button onClick={() => loadProject(p.id)} disabled={!!loadingProjectId} style={{ ...monoBtn, padding: '6px 14px', fontSize: '0.62rem', opacity: loadingProjectId ? 0.5 : 1 }}>
                      {loadingProjectId === p.id ? 'Loading…' : 'Load'}
                    </button>
                    <button onClick={() => removeProject(p.id)} style={{ background: 'transparent', border: '1px solid rgba(255,68,85,0.4)', color: '#ff6675', borderRadius: 8, padding: '6px 10px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.62rem' }}>
                      ✕
                    </button>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ ...label, color: 'rgba(255,255,255,0.55)' }}>Your new website{bizName ? ` — ${bizName}` : ''}</span>
              <button onClick={openPreview} style={{ ...monoBtn, background: BLUE, color: '#fff' }}>↗ Open Full Preview</button>
            </div>
            <div style={{
              border: `1px solid ${BORDER}`, borderRadius: 16, background: PANEL,
              padding: 18, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
              boxShadow: '0 18px 60px rgba(0,0,0,0.5)',
            }}>
              {/* Phone-scale live mini preview */}
              <div
                onClick={openPreview}
                title="Open full preview"
                style={{ width: 208, height: 380, borderRadius: 20, overflow: 'hidden', border: `2px solid ${BORDER}`, background: '#fff', flexShrink: 0, cursor: 'pointer', position: 'relative' }}
              >
                <iframe
                  title="Mini preview"
                  srcDoc={previewHtml()}
                  sandbox="allow-same-origin"
                  scrolling="yes"
                  style={{ width: 390, height: 712, border: 'none', transform: 'scale(0.5333)', transformOrigin: 'top left', background: '#fff', pointerEvents: 'none' }}
                />
                <div style={{ position: 'absolute', inset: 0 }} />
              </div>
              {/* Actions */}
              <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '1.02rem', color: '#fff' }}>
                  {bizName ? `${bizName} — website ready` : 'Website ready'}
                </span>
                <button onClick={openPreview} style={{ background: BLUE, border: 'none', color: '#fff', borderRadius: 10, padding: '13px 0', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', width: '100%' }}>
                  ↗ Open Full Preview
                </button>
                <button onClick={downloadFullImage} disabled={snapping} style={{ ...monoBtn, width: '100%', padding: '12px 0', opacity: snapping ? 0.6 : 1 }}>
                  {snapping ? 'Capturing…' : '⬇ Download as Image (full page)'}
                </button>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  The mini view is phone-scale. Full preview opens in a new tab — re-open it after any change.
                </span>
              </div>
            </div>
            {/* Refine chat */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendEdit() }}
                disabled={editing}
                placeholder='Refine anything — e.g. "make the hero taller"'
                style={{ flex: 1, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff', padding: '13px 16px', fontSize: '0.92rem', fontFamily: 'var(--font-inter)', opacity: editing ? 0.6 : 1 }}
              />
              <button
                onClick={sendEdit}
                disabled={editing || !chatInput.trim()}
                style={{ background: BLUE, border: 'none', borderRadius: 10, color: '#fff', padding: '0 20px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.76rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: editing || !chatInput.trim() ? 0.5 : 1, cursor: editing || !chatInput.trim() ? 'not-allowed' : 'pointer' }}
              >
                {editing ? '…' : 'Send'}
              </button>
            </div>
          </div>

          {/* ── 1b. BUILD REPORT — copyable thinking ── */}
          {buildReport && (
            <div style={{ ...card, maxWidth: 'none', padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
                <button onClick={() => setReportOpen(v => !v)} style={{ background: 'transparent', border: 'none', color: '#fff', fontFamily: 'var(--font-inter)', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📋 Build Report <span style={{ color: BLUE, fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>{reportOpen ? '▲' : '▼'}</span>
                </button>
                <button
                  onClick={() => { try { navigator.clipboard?.writeText(buildReport) } catch (_) {}; setCopiedReport(true); setTimeout(() => setCopiedReport(false), 1500) }}
                  style={{ ...monoBtn, padding: '5px 14px', fontSize: '0.62rem' }}
                >
                  {copiedReport ? '✓ Copied' : '⧉ Copy report'}
                </button>
              </div>
              {reportOpen && (
                <pre style={{ margin: 0, padding: '0 16px 16px', fontSize: '0.68rem', fontFamily: 'var(--font-ibm-plex-mono)', color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 420, overflowY: 'auto', lineHeight: 1.6 }}>
                  {buildReport}
                </pre>
              )}
            </div>
          )}

          {/* ── 2. ASSETS ── */}
          <div style={{ ...card, maxWidth: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ ...label, color: 'rgba(255,255,255,0.55)' }}>
                Assets ({slots.length}){!imagesReady && generating ? ' — generating…' : ''}
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

          {/* ── 3. EXPORT (gated until every asset is linked) ── */}
          <div style={{ ...card, maxWidth: 'none', border: `1px solid ${allLinked ? 'rgba(57,217,138,0.5)' : BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 3 }}>
                  {allLinked ? '✓ Production-ready export' : '🔒 Export'}
                </div>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  {allLinked
                    ? 'Every asset is linked. This HTML deploys to GoHighLevel with zero manual edits.'
                    : `Link ${slots.length - linkedCount} more asset${slots.length - linkedCount === 1 ? '' : 's'} above to unlock the final export.`}
                </div>
              </div>
              {allLinked && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={copyHtml} style={{ ...monoBtn, background: GREEN, borderColor: GREEN, color: '#04240f' }}>{copiedHtml ? 'Copied ✓' : '⧉ Copy HTML'}</button>
                  <button onClick={downloadHtml} style={monoBtn}>⬇ Download</button>
                  <button onClick={() => setShowCode(v => !v)} style={monoBtn}>{showCode ? 'Hide code' : '</> Code'}</button>
                </div>
              )}
            </div>
            {allLinked && showCode && (
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
            {savedMsg && (
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', color: GREEN, letterSpacing: '0.04em' }}>
                ✓ {savedMsg} — reload it anytime from the Library at the top
              </div>
            )}
          </div>
        </div>
      )}
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
