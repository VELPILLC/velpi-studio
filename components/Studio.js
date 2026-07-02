'use client'
import { useState, useEffect } from 'react'
import { matchStyleToIndustry } from '../lib/designStyles'

const BLUE = '#2990fa'
const BG = '#060d1f'
const PANEL = '#0a1628'
const BORDER = '#152840'

const STEP_DEFS = [
  { id: 'crawl', label: 'Crawling website' },
  { id: 'analyze', label: 'Analyzing content' },
  { id: 'copy', label: 'Writing copy' },
  { id: 'build', label: 'Building HTML' },
  { id: 'images', label: 'Generating 5 images' },
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

// Same slot-id rule the image API uses, so template tokens and assets line up.
function slotIdFor(item, i) {
  if (/logo/i.test(item.what || '') || item.section === 'header') return 'logo'
  return `img_${item.slot != null ? item.slot : i}`
}

// Labeled gray placeholder for slots with no image yet.
function placeholderSvg(text) {
  const t = encodeURIComponent((text || 'image').slice(0, 40))
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect width='100%25' height='100%25' fill='%23233248'/%3E%3Ctext x='50%25' y='50%25' fill='%237d8aa0' font-family='monospace' font-size='36' text-anchor='middle'%3E${t}%3C/text%3E%3C/svg%3E`
}

// Parse bulk style paste: blocks separated by a line of ===== (5+).
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
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [steps, setSteps] = useState(STEP_DEFS.map(s => ({ ...s, status: 'pending' })))
  const [error, setError] = useState(null)

  // Pipeline results
  const [bizName, setBizName] = useState('')
  const [analysisData, setAnalysisData] = useState(null)
  const [siteText, setSiteText] = useState('')
  const [slots, setSlots] = useState([])            // photo slots: {id, name, section, prompt}
  const [assetsById, setAssetsById] = useState({})  // generated images (data URIs) by slot id
  const [logoUrl, setLogoUrl] = useState(null)
  const [ghlUrls, setGhlUrls] = useState({})        // pasted GoHighLevel links by slot id
  const [htmlTemplate, setHtmlTemplate] = useState(null)
  const [built, setBuilt] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [frameH, setFrameH] = useState(900)
  const [showCode, setShowCode] = useState(false)

  // Styles library
  const [styles, setStyles] = useState([])
  const [styleId, setStyleId] = useState('auto')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [matchedStyleName, setMatchedStyleName] = useState('')
  const [showAddStyle, setShowAddStyle] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [newStyleName, setNewStyleName] = useState('')
  const [newStyleNiches, setNewStyleNiches] = useState('')
  const [newStyleContent, setNewStyleContent] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [bulkStatus, setBulkStatus] = useState(null)
  const [savingStyle, setSavingStyle] = useState(false)

  // Info panel
  const [showFullText, setShowFullText] = useState(false)
  const [copiedInfo, setCopiedInfo] = useState(false)

  // Refine chat
  const [chatInput, setChatInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(null)

  useEffect(() => {
    fetch('/api/styles').then(r => r.json()).then(d => setStyles(d.styles || [])).catch(() => {})
  }, [])

  // ── HTML rendering: swap tokens for preview / final export ──────────────────
  function previewHtml() {
    if (!htmlTemplate) return ''
    return htmlTemplate.replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, id) => {
      if (id === 'logo') return logoUrl || placeholderSvg('logo')
      if (ghlUrls[id]) return ghlUrls[id]
      if (assetsById[id]) return assetsById[id]
      const slot = slots.find(s => s.id === id)
      return placeholderSvg(slot ? slot.name : id)
    })
  }

  function finalHtml() {
    if (!htmlTemplate) return ''
    return htmlTemplate.replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, id) => {
      if (id === 'logo') return logoUrl || placeholderSvg('logo')
      if (ghlUrls[id]) return ghlUrls[id]
      const n = slots.findIndex(s => s.id === id) + 1
      return `https://PASTE-IMAGE-${n || 'X'}-URL-HERE`
    })
  }

  const missingLinks = slots.filter(s => !ghlUrls[s.id]).length

  // ── Styles ──────────────────────────────────────────────────────────────────
  async function saveNewStyle() {
    if (savingStyle) return
    setSavingStyle(true)
    setError(null)
    setBulkStatus(null)
    try {
      if (bulkMode) {
        const parsed = parseBulkStyles(bulkText)
        if (!parsed.length) throw new Error('No styles found. Separate each style with a line of ===== — first line is the name, optional "Niches: a, b" line, then the DESIGN.md content.')
        let ok = 0
        const added = []
        for (const p of parsed) {
          try {
            const { style } = await callRoute('/api/styles', p)
            added.push(style)
            ok++
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
        setShowAddStyle(false)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingStyle(false)
    }
  }

  // ── Generation pipeline ─────────────────────────────────────────────────────
  async function runGeneration() {
    if (!input.trim() || generating) return
    setError(null)
    setBuilt(false)
    setImagesReady(false)
    setHtmlTemplate(null)
    setAnalysisData(null)
    setSiteText('')
    setSlots([])
    setAssetsById({})
    setGhlUrls({})
    setLogoUrl(null)
    setBizName('')
    setMatchedStyleName('')
    setShowCode(false)
    setGenerating(true)

    const statuses = {}
    STEP_DEFS.forEach(s => { statuses[s.id] = 'pending' })
    const mark = (id, status) => {
      statuses[id] = status
      setSteps(STEP_DEFS.map(s => ({ ...s, status: statuses[s.id] })))
    }

    try {
      mark('crawl', 'active')
      const { scrapedData } = await callRoute('/api/scrape', { input: input.trim() })
      setSiteText(scrapedData.content || '')
      mark('crawl', 'complete')

      mark('analyze', 'active')
      const { analysis } = await callRoute('/api/analyze', { scrapedData })
      setBizName(analysis.business_name || '')
      setAnalysisData(analysis)
      setLogoUrl(analysis._source?.logo || scrapedData.logo || null)

      // Named photo slots (skip logo) — same ids the image generator will use
      const inv = analysis.image_inventory || []
      const photoSlots = inv
        .map((item, i) => ({ item, id: slotIdFor(item, i) }))
        .filter(x => x.id !== 'logo')
        .map(x => ({ id: x.id, name: x.item.what || x.id, section: x.item.section || '', prompt: x.item.prompt || '' }))
      setSlots(photoSlots)

      let chosenStyle = styles.find(s => s.id === styleId) || null
      if (styleId === 'auto') {
        chosenStyle = matchStyleToIndustry(styles, `${analysis.industry || ''} ${analysis.niche || ''} ${analysis.primary_service || ''}`)
      }
      setMatchedStyleName(chosenStyle ? chosenStyle.name : '')
      mark('analyze', 'complete')

      // IMAGES run in the background while copy + HTML build proceed —
      // the HTML is usable immediately; images land when ready.
      mark('images', 'active')
      const imagesPromise = callRoute('/api/generate-images', { analysis })
        .then(({ images }) => {
          const map = {}
          for (const a of images?.assets || []) {
            if (a.kind !== 'logo' && a.src) map[a.id] = a.src
          }
          setAssetsById(map)
          setImagesReady(true)
          mark('images', 'complete')
        })
        .catch(e => {
          mark('images', 'error')
          setError(`Image generation: ${e.message} (the HTML is still usable — slots show placeholders)`)
        })

      mark('copy', 'active')
      const { copy } = await callRoute('/api/generate-copy', { analysis })
      mark('copy', 'complete')

      mark('build', 'active')
      const { html } = await callRoute('/api/build-site', {
        analysis, copy,
        slots: [...(logoSlotOf(inv) ? [{ id: 'logo', name: 'Logo', section: 'header' }] : []), ...photoSlots.map(s => ({ id: s.id, name: s.name, section: s.section }))],
        styleMd: chosenStyle ? chosenStyle.content : null,
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

  function logoSlotOf(inv) {
    return (inv || []).some((item, i) => slotIdFor(item, i) === 'logo')
  }

  async function sendEdit() {
    const instruction = chatInput.trim()
    if (!instruction || editing || !htmlTemplate) return
    setEditing(true)
    setError(null)
    try {
      const { html: updated } = await callRoute('/api/edit-site', { html: htmlTemplate, instruction })
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
    a.download = `${safeName(bizName)}-mockup.html`
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
      if (assetsById[s.id]) {
        await downloadImage(assetsById[s.id], `${i + 1}-${safeName(s.name)}.png`)
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
      f.emails?.length ? `EMAILS: ${f.emails.join(', ')}` : null,
      f.address ? `ADDRESS: ${f.address}` : null,
      f.hours ? `HOURS: ${f.hours}` : null,
      f.socials?.length ? `SOCIALS: ${f.socials.join(', ')}` : null,
      f.services?.length ? `SERVICES:\n- ${f.services.join('\n- ')}` : null,
      f.reviews?.length ? `REVIEWS:\n- ${f.reviews.join('\n- ')}` : null,
      analysisData.color_palette?.length ? `PALETTE: ${analysisData.color_palette.join(', ')}` : null,
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

  const label = { fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }
  const monoBtn = {
    background: 'transparent', border: `1px solid ${BLUE}`, color: BLUE, borderRadius: 8,
    padding: '8px 16px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.74rem', letterSpacing: '0.05em',
  }
  const infoLabel = { ...label, fontSize: '0.58rem', color: BLUE, marginBottom: 3 }
  const infoValue = { fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#fff', lineHeight: 1.55, wordBreak: 'break-word' }

  const facts = analysisData?.facts || {}

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <VelpiLogo />
          <span style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '2rem', letterSpacing: '0.12em' }}>VELPI STUDIO</span>
        </div>
        <div style={{ ...label, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>Website Mockup Generator</div>

        {/* ── Input row ── */}
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 720 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runGeneration() }}
            disabled={generating}
            placeholder="Enter a website URL or business name"
            style={{ flex: 1, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff', padding: '14px 16px', fontSize: '0.95rem', fontFamily: 'var(--font-inter)', opacity: generating ? 0.6 : 1 }}
          />
          <button
            onClick={runGeneration}
            disabled={generating || !input.trim()}
            style={{
              background: BLUE, border: 'none', borderRadius: 10, color: '#fff', padding: '0 26px',
              fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase',
              opacity: generating || !input.trim() ? 0.5 : 1, cursor: generating || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? 'Working' : 'Generate'}
          </button>
        </div>

        {/* ── Style picker ── */}
        <div style={{ width: '100%', maxWidth: 720, marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ ...label, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>Design style</span>
            <button
              onClick={() => setPickerOpen(v => !v)}
              disabled={generating}
              style={{
                flex: 1, background: PANEL, border: `1px solid ${pickerOpen ? BLUE : BORDER}`, borderRadius: 8,
                color: '#fff', padding: '9px 12px', fontSize: '0.82rem', fontFamily: 'var(--font-inter)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
              }}
            >
              <span>
                {styleId === 'auto'
                  ? '✦ Auto-Match — detects the niche and applies the right preset'
                  : (styles.find(s => s.id === styleId)?.name || 'Pick a style')}
              </span>
              <span style={{ color: BLUE, fontSize: '0.65rem' }}>{pickerOpen ? '▲' : '▼ Change'}</span>
            </button>
            <button onClick={() => setShowAddStyle(v => !v)} disabled={generating} style={{ ...monoBtn, flexShrink: 0 }}>
              {showAddStyle ? 'Close' : '+ Add Style'}
            </button>
          </div>

          {pickerOpen && (
            <div style={{ marginTop: 8, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
                <div
                  onClick={() => { setStyleId('auto'); setPickerOpen(false) }}
                  style={{
                    background: styleId === 'auto' ? 'rgba(41,144,250,0.12)' : BG,
                    border: `1px solid ${styleId === 'auto' ? BLUE : BORDER}`,
                    borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.82rem', color: '#fff', marginBottom: 3 }}>✦ Auto-Match</div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>
                    Detects the business niche and applies the matching preset automatically
                  </div>
                </div>
                {styles.map(s => {
                  const tags = Array.isArray(s.niches) ? s.niches : String(s.niches || '').split(',').map(t => t.trim()).filter(Boolean)
                  const active = styleId === s.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => { setStyleId(s.id); setPickerOpen(false) }}
                      style={{
                        background: active ? 'rgba(41,144,250,0.12)' : BG,
                        border: `1px solid ${active ? BLUE : BORDER}`,
                        borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.82rem', color: '#fff', marginBottom: 4 }}>
                        {s.builtIn ? '' : '◆ '}{s.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {tags.slice(0, 4).map(t => (
                          <span key={t} style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.55rem', color: BLUE, background: 'rgba(41,144,250,0.1)', border: '1px solid rgba(41,144,250,0.3)', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {t}
                          </span>
                        ))}
                        {tags.length > 4 && (
                          <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', padding: '1px 2px' }}>+{tags.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Add style panel ── */}
        {showAddStyle && (
          <div style={{ width: '100%', maxWidth: 720, marginTop: 10, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ ...label, color: BLUE }}>Add design system{bulkMode ? 's — bulk import' : ''}</div>
              <button onClick={() => { setBulkMode(v => !v); setBulkStatus(null) }} style={{ ...monoBtn, padding: '4px 12px', fontSize: '0.62rem' }}>
                {bulkMode ? 'Single mode' : 'Bulk import'}
              </button>
            </div>

            {bulkMode ? (
              <>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 10 }}>
                  Paste MANY styles at once. Separate each with a line of <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: BLUE }}>=====</span> — first line is the name, optional <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: BLUE }}>Niches: restaurant, cafe</span> line, then the DESIGN.md content.
                </div>
                <textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={'Linear Midnight\nNiches: tech, saas\n# DESIGN.md\n...content...\n=====\nWarm Bistro\nNiches: restaurant, cafe\n# DESIGN.md\n...content...'}
                  rows={10}
                  style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)', resize: 'vertical', marginBottom: 8 }}
                />
                {bulkStatus && (
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', color: bulkStatus.startsWith('Imported all') ? '#39d98a' : '#e5c07b', marginBottom: 8 }}>
                    {bulkStatus}
                  </div>
                )}
                <button
                  onClick={saveNewStyle}
                  disabled={savingStyle || !bulkText.trim()}
                  style={{ background: BLUE, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 22px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.76rem', letterSpacing: '0.05em', opacity: savingStyle || !bulkText.trim() ? 0.5 : 1 }}
                >
                  {savingStyle ? 'Importing…' : 'Import All'}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 10 }}>
                  Browse styles.refero.design, copy a DESIGN.md, paste it here with niche tags. Saved permanently and used by Auto-Match.
                </div>
                <input
                  value={newStyleName}
                  onChange={e => setNewStyleName(e.target.value)}
                  placeholder="Style name (e.g. Linear — midnight command deck)"
                  style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: '0.85rem', fontFamily: 'var(--font-inter)', marginBottom: 8 }}
                />
                <input
                  value={newStyleNiches}
                  onChange={e => setNewStyleNiches(e.target.value)}
                  placeholder="Niches it fits, comma-separated (e.g. restaurant, cafe, bar) — powers Auto-Match"
                  style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: '0.85rem', fontFamily: 'var(--font-inter)', marginBottom: 8 }}
                />
                <textarea
                  value={newStyleContent}
                  onChange={e => setNewStyleContent(e.target.value)}
                  placeholder="Paste the DESIGN.md content here..."
                  rows={8}
                  style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: '0.8rem', fontFamily: 'var(--font-ibm-plex-mono)', resize: 'vertical', marginBottom: 8 }}
                />
                <button
                  onClick={saveNewStyle}
                  disabled={savingStyle || !newStyleName.trim() || !newStyleContent.trim()}
                  style={{ background: BLUE, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 22px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.76rem', letterSpacing: '0.05em', opacity: savingStyle || !newStyleName.trim() || !newStyleContent.trim() ? 0.5 : 1 }}
                >
                  {savingStyle ? 'Saving…' : 'Save Style'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ width: '100%', maxWidth: 720, marginTop: 18, background: '#2a0d12', border: '1px solid #ff4455', borderRadius: 10, padding: '12px 16px', color: '#ffb3bd', fontFamily: 'var(--font-inter)', fontSize: '0.85rem', lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {/* ── Progress ── */}
        {(generating || steps.some(s => s.status !== 'pending')) && (
          <div style={{ width: '100%', maxWidth: 720, marginTop: 26, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.map(step => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px' }}>
                <StatusDot status={step.status} />
                <span style={{
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', letterSpacing: '0.03em',
                  color: step.status === 'active' ? BLUE : step.status === 'complete' ? '#fff' : step.status === 'error' ? '#ff6675' : 'rgba(255,255,255,0.4)',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
            {matchedStyleName && (
              <div style={{ marginTop: 6, paddingTop: 10, borderTop: `1px solid ${BORDER}`, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', color: BLUE, letterSpacing: '0.04em' }}>
                ✦ Style preset: {matchedStyleName}
              </div>
            )}
          </div>
        )}

        {/* ── Results: main column + extracted-info sidebar ── */}
        {analysisData && (
          <div style={{ width: '100%', marginTop: 30, display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* MAIN */}
            <div style={{ flex: '1 1 640px', minWidth: 0 }}>

              {/* ── Mockup (appears first — usable before images finish) ── */}
              {built && (
                <div style={{ marginBottom: 30 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ ...label, color: 'rgba(255,255,255,0.55)' }}>
                      Mockup — GoHighLevel-ready
                      {missingLinks > 0 && slots.length > 0 && (
                        <span style={{ color: '#e5c07b', marginLeft: 10 }}>{missingLinks} image link{missingLinks > 1 ? 's' : ''} pending</span>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setShowCode(v => !v)} style={monoBtn}>{showCode ? 'Hide code' : '</> View code'}</button>
                      <button onClick={downloadHtml} style={monoBtn}>⬇ Download HTML</button>
                      <button onClick={copyHtml} style={monoBtn}>{copiedHtml ? 'Copied' : 'Copy HTML'}</button>
                    </div>
                  </div>

                  {showCode && (
                    <pre style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, fontSize: '0.68rem', fontFamily: 'var(--font-ibm-plex-mono)', color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 420, overflowY: 'auto', marginBottom: 12 }}>
                      {finalHtml()}
                    </pre>
                  )}

                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <iframe
                      title="Mockup preview"
                      srcDoc={previewHtml()}
                      sandbox="allow-same-origin"
                      onLoad={onFrameLoad}
                      style={{ width: '100%', height: frameH, border: 'none', display: 'block', background: '#fff' }}
                    />
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ ...label, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Refine this mockup</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') sendEdit() }}
                        disabled={editing}
                        placeholder='Describe a change — e.g. "make the hero taller" or "add a gallery section"'
                        style={{ flex: 1, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff', padding: '13px 16px', fontSize: '0.9rem', fontFamily: 'var(--font-inter)', opacity: editing ? 0.6 : 1 }}
                      />
                      <button
                        onClick={sendEdit}
                        disabled={editing || !chatInput.trim()}
                        style={{ background: BLUE, border: 'none', borderRadius: 10, color: '#fff', padding: '0 22px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: editing || !chatInput.trim() ? 0.5 : 1, cursor: editing || !chatInput.trim() ? 'not-allowed' : 'pointer' }}
                      >
                        {editing ? 'Updating' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Image slots: download → upload to GHL → paste links back ── */}
              {slots.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ ...label, color: 'rgba(255,255,255,0.55)' }}>
                      Images ({slots.length}){!imagesReady && generating ? ' — generating…' : ''}
                    </span>
                    {imagesReady && <button onClick={downloadAll} style={monoBtn}>⬇ Download All</button>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
                    Download each image → upload to your GoHighLevel media library → paste the GHL link back here. The HTML updates itself; when all links are in, Copy HTML gives the final GHL-ready code.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {slots.map((s, i) => (
                      <div key={s.id} style={{ background: PANEL, border: `1px solid ${ghlUrls[s.id] ? 'rgba(57,217,138,0.5)' : BORDER}`, borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: 92, height: 66, borderRadius: 8, overflow: 'hidden', background: BG, flexShrink: 0, position: 'relative' }}>
                          <img
                            src={assetsById[s.id] || placeholderSvg(s.name)}
                            alt={s.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          {!assetsById[s.id] && !imagesReady && (
                            <span className="velpi-loading" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'rgba(6,13,31,0.6)' }}>
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />
                            </span>
                          )}
                        </div>
                        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ ...label, fontSize: '0.62rem', color: BLUE }}>{i + 1}. {s.name}</span>
                            {ghlUrls[s.id] && <span style={{ color: '#39d98a', fontSize: '0.7rem' }}>✓ linked</span>}
                          </div>
                          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>
                            file: {i + 1}-{safeName(s.name)}.png{s.section ? ` · section: ${s.section}` : ''}
                          </div>
                          {s.prompt && (
                            <button onClick={() => copyPrompt(i, s.prompt)} style={{ ...monoBtn, padding: '2px 8px', fontSize: '0.56rem', marginTop: 5 }}>
                              {copiedPrompt === i ? '✓' : '⧉ prompt'}
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '2 1 300px', minWidth: 240 }}>
                          {assetsById[s.id] && (
                            <button
                              onClick={() => downloadImage(assetsById[s.id], `${i + 1}-${safeName(s.name)}.png`)}
                              title="Download image"
                              style={{ ...monoBtn, padding: '8px 12px', flexShrink: 0 }}
                            >⬇</button>
                          )}
                          <input
                            value={ghlUrls[s.id] || ''}
                            onChange={e => setGhlUrls(prev => ({ ...prev, [s.id]: e.target.value.trim() }))}
                            placeholder="Paste GoHighLevel image URL here"
                            style={{ flex: 1, background: BG, border: `1px solid ${ghlUrls[s.id] ? 'rgba(57,217,138,0.5)' : BORDER}`, borderRadius: 8, color: '#fff', padding: '9px 12px', fontSize: '0.75rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR — extracted information */}
            <aside style={{ width: 320, flexShrink: 0, position: 'sticky', top: 16, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ ...label, color: BLUE }}>Extracted Info</span>
                <button onClick={copyAllInfo} style={{ ...monoBtn, padding: '3px 10px', fontSize: '0.6rem' }}>
                  {copiedInfo ? '✓ Copied' : '⧉ Copy All'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={infoLabel}>Business</div>
                  <div style={{ ...infoValue, fontWeight: 600 }}>{analysisData.business_name}</div>
                  <div style={{ ...infoValue, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                    {analysisData.industry}{analysisData.niche ? ` — ${analysisData.niche}` : ''}
                  </div>
                </div>
                {facts.phone && <div><div style={infoLabel}>Phone</div><div style={infoValue}>{facts.phone}</div></div>}
                {facts.emails?.length > 0 && (
                  <div><div style={infoLabel}>Email</div>{facts.emails.map((e, i) => <div key={i} style={infoValue}>{e}</div>)}</div>
                )}
                {facts.address && <div><div style={infoLabel}>Address</div><div style={infoValue}>{facts.address}</div></div>}
                {facts.hours && <div><div style={infoLabel}>Hours</div><div style={{ ...infoValue, whiteSpace: 'pre-wrap' }}>{facts.hours}</div></div>}
                {facts.socials?.length > 0 && (
                  <div><div style={infoLabel}>Socials / Platforms</div>{facts.socials.map((s, i) => <div key={i} style={{ ...infoValue, fontSize: '0.72rem' }}>{s}</div>)}</div>
                )}
                {facts.services?.length > 0 && (
                  <div>
                    <div style={infoLabel}>Services ({facts.services.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {facts.services.map((s, i) => (
                        <div key={i} style={{ ...infoValue, fontSize: '0.74rem', paddingLeft: 10, borderLeft: `2px solid ${BORDER}` }}>{s}</div>
                      ))}
                    </div>
                  </div>
                )}
                {facts.reviews?.length > 0 && (
                  <div>
                    <div style={infoLabel}>Reviews ({facts.reviews.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {facts.reviews.map((r, i) => (
                        <div key={i} style={{ ...infoValue, fontSize: '0.72rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>&ldquo;{r}&rdquo;</div>
                      ))}
                    </div>
                  </div>
                )}
                {analysisData.color_palette?.length > 0 && (
                  <div>
                    <div style={infoLabel}>Palette</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {analysisData.color_palette.map((c, i) => (
                        <div key={i} title={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 16, height: 16, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block' }} />
                          <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)' }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {siteText && (
                  <div>
                    <button onClick={() => setShowFullText(v => !v)} style={{ ...monoBtn, width: '100%', padding: '6px 0', fontSize: '0.62rem' }}>
                      {showFullText ? 'Hide full site text ▲' : 'Full site text ▼'}
                    </button>
                    {showFullText && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => { try { navigator.clipboard?.writeText(siteText) } catch (_) {} }}
                          style={{ ...monoBtn, padding: '3px 10px', fontSize: '0.58rem', marginBottom: 6 }}
                        >⧉ Copy text</button>
                        <pre style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: '0.62rem', fontFamily: 'var(--font-ibm-plex-mono)', color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto', margin: 0 }}>
                          {siteText}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>
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
