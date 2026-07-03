'use client'
import { useState, useEffect, useRef } from 'react'
import { matchTopStyles } from '../lib/designStyles'

const BLUE = '#2990fa'
const BG = '#060d1f'
const PANEL = '#0a1628'
const BORDER = '#152840'
const GREEN = '#39d98a'

const STEP_DEFS = [
  { id: 'logo', label: 'Refining logo' },
  { id: 'crawl', label: 'Crawling website' },
  { id: 'analyze', label: 'Analyzing brand' },
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

export default function Studio() {
  // ── Setup inputs ──
  const [input, setInput] = useState('')
  const [logo, setLogo] = useState(null)            // { data, preview, name } original upload
  const [logoNotes, setLogoNotes] = useState('')
  const [refinedLogo, setRefinedLogo] = useState(null) // data uri after refinement
  const logoInputRef = useRef(null)

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
  const [frameH, setFrameH] = useState(900)
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
  }, [])

  const readyToGenerate = !!input.trim() && !!logo
  const missing = [!input.trim() && 'website URL', !logo && 'logo'].filter(Boolean)

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

  const linkedCount = slots.filter(s => ghlUrls[s.id]?.trim()).length
  const allLinked = slots.length > 0 && linkedCount === slots.length

  // ── Logo upload ──
  async function onLogoFile(fileList) {
    const file = Array.from(fileList || []).find(f => f.type.startsWith('image/') || /\.svg$/i.test(f.name))
    if (!file) return
    setError(null)
    try {
      const png = await fileToPng(file)
      setLogo(png)
      setRefinedLogo(null)
    } catch (e) {
      setError(e.message)
    }
  }

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
      // Logo refinement + crawl run in parallel — both must land before analyze.
      mark('logo', 'active')
      mark('crawl', 'active')
      const refineP = callRoute('/api/refine-logo', { b64: logo.data, instructions: logoNotes.trim() })
        .then(({ b64 }) => {
          const uri = `data:image/png;base64,${b64}`
          setRefinedLogo(uri)
          setAssetsById(prev => ({ ...prev, logo: uri }))
          mark('logo', 'complete')
        })
        .catch(() => {
          // Refinement is best-effort — fall back to the original upload untouched.
          setAssetsById(prev => ({ ...prev, logo: logo.preview }))
          mark('logo', 'complete')
        })
      const crawlP = callRoute('/api/scrape', { input: input.trim() })
      const [{ scrapedData }] = await Promise.all([crawlP, refineP])
      mark('crawl', 'complete')

      mark('analyze', 'active')
      const { analysis } = await callRoute('/api/analyze', { scrapedData })
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
        chosenStyles = matchTopStyles(styles, `${analysis.industry || ''} ${analysis.niche || ''} ${analysis.primary_service || ''}`, 3)
      }
      setMatchedStyleName(chosenStyles.map(s => s.name).join('  +  '))
      mark('analyze', 'complete')

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
        slots: [
          { id: 'logo', name: 'Logo', section: 'header' },
          ...photoSlots.map(s => ({ id: s.id, name: s.name, section: s.section })),
        ],
        styleMds: chosenStyles.map(s => s.content),
      })
      setHtmlTemplate(html)
      setBuilt(true)
      mark('build', 'complete')

      await imagesPromise
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

  function onFrameLoad(e) {
    try {
      const doc = e.target.contentDocument
      const h = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0)
      if (h > 100) setFrameH(Math.min(h + 24, 30000))
    } catch (_) {}
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
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', padding: '28px 14px 90px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0 }}>
          <VelpiLogo size={30} />
          <span style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.7rem', letterSpacing: '0.12em' }}>VELPI STUDIO</span>
        </div>
        <div style={{ ...label, color: 'rgba(255,255,255,0.4)', marginTop: -8, marginBottom: 8 }}>Website Mockup Generator</div>

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
            <span style={{ ...label, fontSize: '0.55rem', color: '#e5c07b' }}>required</span>
          </div>
          <div
            onClick={() => !generating && logoInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (!generating) onLogoFile(e.dataTransfer.files) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, cursor: generating ? 'default' : 'pointer',
              background: BG, border: `1.5px dashed ${logo ? 'rgba(57,217,138,0.5)' : BORDER}`, borderRadius: 12, padding: 14,
            }}
          >
            <div style={{ width: 74, height: 74, borderRadius: 10, background: '#101c30', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {(refinedLogo || logo) ? (
                <img src={refinedLogo || logo.preview} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>🖼</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#fff' }}>
                {logo ? (refinedLogo ? 'Logo refined ✓ — tap to replace' : `${logo.name} — tap to replace`) : 'Upload the logo (PNG, SVG, or a screenshot)'}
              </div>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.5 }}>
                It gets automatically refined — identical branding, production quality, transparent background.
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*,.svg" onChange={e => { onLogoFile(e.target.files); e.target.value = '' }} style={{ display: 'none' }} />
          </div>
          {logo && (
            <input
              value={logoNotes}
              onChange={e => setLogoNotes(e.target.value)}
              disabled={generating}
              placeholder='Optional refinement notes — e.g. "remove the white background, keep everything else identical"'
              style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff', padding: '11px 14px', fontSize: '0.85rem', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginTop: 10 }}
            />
          )}
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
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 18px 60px rgba(0,0,0,0.5)' }}>
              <iframe
                title="Website preview"
                srcDoc={previewHtml()}
                sandbox="allow-same-origin"
                onLoad={onFrameLoad}
                style={{ width: '100%', height: frameH, border: 'none', display: 'block', background: '#fff' }}
              />
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
        </div>
      )}
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
