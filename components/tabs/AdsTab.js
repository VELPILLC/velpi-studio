'use client'
import { useState, useRef, useEffect } from 'react'
import ChatBox from '../ChatBox'

const AD_SYSTEM_PROMPT = `You are a direct response ad strategist for Velpi Marketing, an HVAC lead generation agency.\n\nMODE 1 - IDEATION: When developing the concept, ask sharp questions. Keep replies short and conversational. 2-3 sentences max.\n\nMODE 2 - GENERATE/REFINE: When asked to generate copy OR given feedback on existing copy, return JSON:\n{\"hook\":\"...\",\"headline\":\"3-5 WORDS MAX ALL CAPS\",\"body\":\"...\",\"cta\":\"...\",\"dalle_prompt\":\"cinematic vertical HVAC photo no text photorealistic\",\"hedra_script\":\"20-25 second casual script\",\"_done\":true}\n\nOnly return JSON when generating or refining. Otherwise chat normally. No CTAs in images or videos.`

const INITIAL_MSG = {
  role: 'assistant',
  content: "Systems online. All creative assets standing by. I've reviewed the market — HVAC owners in your target area are leaving money on the table every slow season. Tell me who we're going after and I'll have a campaign ready before they know what hit them.",
}

const FONTS = [
  { label: 'Barlow', value: 'var(--font-barlow-condensed)' },
  { label: 'Bebas', value: 'var(--font-bebas-neue)' },
  { label: 'Oswald', value: "'Oswald', sans-serif" },
  { label: 'Inter', value: 'var(--font-inter)' },
]

const FORMATS = [
  { label: '9:16 Reel', w: 300, h: 534, ratio: '9:16' },
  { label: '1:1 Square', w: 360, h: 360, ratio: '1:1' },
  { label: '4:5 Portrait', w: 288, h: 360, ratio: '4:5' },
  { label: '1.91:1 Horizontal', w: 480, h: 251, ratio: '1.91:1' },
]

const OVERLAYS = [
  { label: 'Dark Bottom', value: 'dark-bottom' },
  { label: 'Dark Full', value: 'dark-full' },
  { label: 'Cinematic Blue', value: 'cinematic-blue' },
  { label: 'None', value: 'none' },
]

const SNAP_POSITIONS = [
  ['tl', '↖'], ['tc', '↑'], ['tr', '↗'],
  ['ml', '←'], ['mc', '·'], ['mr', '→'],
  ['bl', '↙'], ['bc', '↓'], ['br', '↘'],
]

function getOverlayStyle(overlay) {
  switch (overlay) {
    case 'dark-bottom':
      return 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)'
    case 'dark-full':
      return 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.6) 100%)'
    case 'cinematic-blue':
      return 'linear-gradient(to top, rgba(0,20,60,0.92) 0%, rgba(10,40,100,0.4) 60%, transparent 100%)'
    default:
      return 'none'
  }
}

function getSnapXY(snap, w, h) {
  const xMap = { l: 16, c: w / 2, r: w - 16 }
  const yMap = { t: 16, m: h / 2, b: h - 16 }
  const x = xMap[snap[1]] ?? 16
  const y = yMap[snap[0]] ?? h - 16
  return { x, y }
}

export default function AdsTab({ activeUser }) {
  // Chat
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])

  // Copy
  const [copy, setCopy] = useState(null)
  const [showCopy, setShowCopy] = useState(false)
  const [selectedWordIdx, setSelectedWordIdx] = useState(null)
  const [wordStyles, setWordStyles] = useState([])

  // Image
  const [imageSrc, setImageSrc] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [showStudio, setShowStudio] = useState(false)

  // Ad Studio controls
  const [format, setFormat] = useState(FORMATS[0])
  const [font, setFont] = useState(FONTS[0].value)
  const [headlineSize, setHeadlineSize] = useState(2.0)
  const [overlay, setOverlay] = useState('dark-bottom')
  const [showEyebrow, setShowEyebrow] = useState(true)
  const [showBody, setShowBody] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  const [textPos, setTextPos] = useState({ x: 16, y: null })
  const [snapPos, setSnapPos] = useState('bl')
  const [voiceId, setVoiceId] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('vs_v') || ''
    return ''
  })

  // Video
  const [showVideo, setShowVideo] = useState(false)
  const [videoJobId, setVideoJobId] = useState(null)
  const [videoStatus, setVideoStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const videoPollRef = useRef(null)

  // Download
  const [showDownload, setShowDownload] = useState(false)

  // Drag state
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const frameRef = useRef(null)

  async function sendChat(text) {
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setChatLoading(true)

    const apiMessages = [
      ...chatHistory,
      { role: 'user', content: text },
    ]

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, system: AD_SYSTEM_PROMPT }),
      })
      const data = await res.json()
      const raw = data.text || ''

      let parsed = null
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch (_) {}

      if (parsed && parsed._done) {
        const aiMsg = { role: 'assistant', content: 'Copy generated. Review and refine below.' }
        setMessages([...newMessages, aiMsg])
        setChatHistory([...apiMessages, { role: 'assistant', content: raw }])
        applyCopy(parsed)
      } else {
        const aiMsg = { role: 'assistant', content: raw }
        setMessages([...newMessages, aiMsg])
        setChatHistory([...apiMessages, { role: 'assistant', content: raw }])
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + err.message }])
    }
    setChatLoading(false)
  }

  function applyCopy(parsed) {
    setCopy({
      hook: parsed.hook || '',
      headline: parsed.headline || '',
      body: parsed.body || '',
      cta: parsed.cta || '',
      dalle_prompt: parsed.dalle_prompt || '',
      hedra_script: parsed.hedra_script || '',
    })
    const words = (parsed.headline || '').split(' ')
    setWordStyles(words.map(() => ({ color: null, italic: false, bold: false, size: null })))
    setSelectedWordIdx(null)
    setShowCopy(true)
  }

  async function generateAdCopy() {
    await sendChat('Generate the ad copy now based on our discussion.')
  }

  function clearChat() {
    setMessages([INITIAL_MSG])
    setChatHistory([])
    setCopy(null)
    setShowCopy(false)
    setShowStudio(false)
    setImageSrc(null)
    setShowVideo(false)
    setShowDownload(false)
  }

  async function generateImage() {
    if (!copy?.dalle_prompt) return
    setImageLoading(true)
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: copy.dalle_prompt }),
      })
      const data = await res.json()
      if (data.b64) {
        setImageSrc('data:image/png;base64,' + data.b64)
        setImgOffset({ x: 0, y: 0 })
        setZoom(100)
        setShowStudio(true)
      }
    } catch (err) {
      alert('Image generation failed: ' + err.message)
    }
    setImageLoading(false)
  }

  function updateWordStyle(idx, prop, value) {
    setWordStyles(ws => ws.map((s, i) => i === idx ? { ...s, [prop]: value } : s))
  }

  function applyToSelected(prop, value) {
    if (selectedWordIdx === null) return
    updateWordStyle(selectedWordIdx, prop, value)
  }

  function resetWordStyle(idx) {
    setWordStyles(ws => ws.map((s, i) => i === idx ? { color: null, italic: false, bold: false, size: null } : s))
  }

  function handleMouseDown(e) {
    dragging.current = true
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      ox: imgOffset.x, oy: imgOffset.y,
    }
    e.currentTarget.style.cursor = 'grabbing'
    e.preventDefault()
  }

  function handleMouseMove(e) {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setImgOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy })
  }

  function handleMouseUp(e) {
    dragging.current = false
    if (frameRef.current) frameRef.current.style.cursor = 'grab'
  }

  function handleTouchStart(e) {
    const t = e.touches[0]
    dragging.current = true
    dragStart.current = { x: t.clientX, y: t.clientY, ox: imgOffset.x, oy: imgOffset.y }
  }

  function handleTouchMove(e) {
    if (!dragging.current) return
    const t = e.touches[0]
    const dx = t.clientX - dragStart.current.x
    const dy = t.clientY - dragStart.current.y
    setImgOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy })
  }

  function handleTouchEnd() {
    dragging.current = false
  }

  function applySnap(snap) {
    setSnapPos(snap)
    const { x, y } = getSnapXY(snap, format.w, format.h)
    setTextPos({ x, y })
  }

  async function saveFrame() {
    const el = document.getElementById('ad-frame')
    if (!el || !window.html2canvas) return
    const canvas = await window.html2canvas(el, { useCORS: true, scale: 2 })
    const link = document.createElement('a')
    link.download = 'velpi-ad-frame.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    setShowDownload(true)
  }

  function downloadRawImage() {
    if (!imageSrc) return
    const link = document.createElement('a')
    link.download = 'velpi-raw.png'
    link.href = imageSrc
    link.click()
  }

  function downloadCopyTxt() {
    if (!copy) return
    const creator = activeUser || 'Unknown'
    const txt = `VELPI STUDIO — AD COPY\nCreator: ${creator}\n\nHOOK:\n${copy.hook}\n\nHEADLINE:\n${copy.headline}\n\nBODY:\n${copy.body}\n\nCTA:\n${copy.cta}\n\nHEDRA SCRIPT:\n${copy.hedra_script}`
    const blob = new Blob([txt], { type: 'text/plain' })
    const link = document.createElement('a')
    link.download = 'velpi-copy.txt'
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  async function generateVideo() {
    if (!copy?.hedra_script || !imageSrc) return
    const vid = voiceId || localStorage.getItem('vs_v') || ''

    setShowVideo(true)
    setVideoStatus('Uploading...')

    try {
      // Convert base64 image to blob for upload if needed
      const genRes = await fetch('/api/hedra/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: copy.hedra_script,
          voice_id: vid,
          aspect_ratio: format.ratio,
        }),
      })
      const genData = await genRes.json()
      const jobId = genData.id || genData.job_id

      if (!jobId) {
        setVideoStatus('Error: No job ID returned')
        return
      }

      setVideoJobId(jobId)
      setVideoStatus(`Job ${jobId} — processing...`)
      pollVideo(jobId, 0)
    } catch (err) {
      setVideoStatus('Error: ' + err.message)
    }
  }

  function pollVideo(jobId, count) {
    if (count >= 60) {
      setVideoStatus('Timed out after 8 minutes')
      return
    }
    videoPollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hedra/status/${jobId}`)
        const data = await res.json()
        const status = data.status || data.state || 'unknown'
        setVideoStatus(`Job ${jobId} — ${status}`)

        if (status === 'complete' || status === 'completed') {
          setVideoUrl(data.url || data.video_url)
          setVideoStatus(`Job ${jobId} — complete`)
        } else if (status === 'failed' || status === 'error') {
          setVideoStatus(`Job ${jobId} — failed`)
        } else {
          pollVideo(jobId, count + 1)
        }
      } catch (err) {
        setVideoStatus('Poll error: ' + err.message)
        pollVideo(jobId, count + 1)
      }
    }, 8000)
  }

  function renderHeadline() {
    if (!copy?.headline) return null
    const words = copy.headline.split(' ')
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {words.map((word, i) => {
          const ws = wordStyles[i] || {}
          return (
            <span
              key={i}
              style={{
                fontFamily: font,
                fontSize: `${headlineSize}rem`,
                fontWeight: ws.bold ? 900 : 700,
                fontStyle: ws.italic ? 'italic' : 'normal',
                color: ws.color || 'white',
                textTransform: 'uppercase',
                lineHeight: 1,
                ...(ws.size === 'big' ? { fontSize: `${headlineSize * 1.35}rem` } : {}),
                ...(ws.size === 'small' ? { fontSize: `${headlineSize * 0.7}rem` } : {}),
              }}
            >
              {word}
            </span>
          )
        })}
      </div>
    )
  }

  const textPosStyle = {
    position: 'absolute',
    padding: '0 16px 16px',
    bottom: snapPos?.startsWith('b') ? (textPos.y !== null ? undefined : 16) : undefined,
    top: snapPos?.startsWith('t') ? (textPos.y || 16) : undefined,
    left: snapPos?.endsWith('l') ? 0 : undefined,
    right: snapPos?.endsWith('r') ? 0 : undefined,
    width: snapPos?.endsWith('c') || snapPos?.startsWith('m') ? '100%' : undefined,
    textAlign: snapPos?.endsWith('c') ? 'center' : snapPos?.endsWith('r') ? 'right' : 'left',
    pointerEvents: 'none',
  }

  if (snapPos === 'bl' || snapPos === 'bc' || snapPos === 'br') {
    textPosStyle.bottom = 16
    textPosStyle.top = undefined
  }
  if (snapPos === 'tl' || snapPos === 'tc' || snapPos === 'tr') {
    textPosStyle.top = 16
    textPosStyle.bottom = undefined
  }
  if (snapPos === 'ml' || snapPos === 'mc' || snapPos === 'mr') {
    textPosStyle.top = '50%'
    textPosStyle.bottom = undefined
    textPosStyle.transform = 'translateY(-50%)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* BLOCK 1 — CHAT */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase' }}>
            ROAS JARVIS
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={clearChat}
              style={{ background: 'transparent', border: '1px solid #152840', color: '#4a6a8a', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
            >
              Clear
            </button>
            <button
              onClick={generateAdCopy}
              style={{ background: '#1d6ff5', border: 'none', color: 'white', borderRadius: 6, padding: '0.3rem 0.85rem', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.04em' }}
            >
              Generate Ad Copy
            </button>
          </div>
        </div>
        <ChatBox
          messages={messages}
          onSend={sendChat}
          loading={chatLoading}
        />
      </section>

      {/* BLOCK 2 — COPY EDITOR */}
      {showCopy && copy && (
        <section style={{ border: '1px solid #152840', borderRadius: 10, padding: '1.25rem', background: '#080f1e' }}>
          <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase', marginBottom: '1rem' }}>
            COPY EDITOR
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>HOOK</label>
              <textarea
                value={copy.hook}
                onChange={e => setCopy(c => ({ ...c, hook: e.target.value }))}
                style={{ width: '100%', height: 60, background: '#060e1c', border: '1px solid #152840', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.8rem', resize: 'none', color: '#c8dcf5', fontFamily: 'var(--font-inter)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>HEADLINE</label>
              <input
                value={copy.headline}
                onChange={e => {
                  const newHeadline = e.target.value
                  setCopy(c => ({ ...c, headline: newHeadline }))
                  const words = newHeadline.split(' ')
                  setWordStyles(words.map((_, i) => wordStyles[i] || { color: null, italic: false, bold: false, size: null }))
                }}
                style={{ width: '100%', height: 36, background: '#060e1c', border: '1px solid #152840', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#c8dcf5', fontFamily: 'var(--font-inter)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>BODY</label>
            <textarea
              value={copy.body}
              onChange={e => setCopy(c => ({ ...c, body: e.target.value }))}
              style={{ width: '100%', height: 80, background: '#060e1c', border: '1px solid #152840', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.8rem', resize: 'none', color: '#c8dcf5', fontFamily: 'var(--font-inter)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>CTA</label>
              <input
                value={copy.cta}
                onChange={e => setCopy(c => ({ ...c, cta: e.target.value }))}
                style={{ width: '100%', height: 36, background: '#060e1c', border: '1px solid #152840', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#c8dcf5', fontFamily: 'var(--font-inter)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>HEDRA SCRIPT</label>
              <textarea
                value={copy.hedra_script}
                onChange={e => setCopy(c => ({ ...c, hedra_script: e.target.value }))}
                style={{ width: '100%', height: 60, background: '#060e1c', border: '1px solid #152840', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.8rem', resize: 'none', color: '#c8dcf5', fontFamily: 'var(--font-inter)' }}
              />
            </div>
          </div>

          {/* Word Styler */}
          <div style={{ background: '#060e1c', border: '1px solid #0e1e35', borderRadius: 8, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', letterSpacing: '0.08em', marginBottom: 8 }}>WORD STYLER</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {copy.headline.split(' ').map((word, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedWordIdx(selectedWordIdx === i ? null : i)}
                  style={{
                    background: selectedWordIdx === i ? '#1d6ff5' : '#0b1525',
                    border: '1px solid ' + (selectedWordIdx === i ? '#1d6ff5' : '#152840'),
                    color: selectedWordIdx === i ? 'white' : '#c8dcf5',
                    borderRadius: 5,
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-ibm-plex-mono)',
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
            {selectedWordIdx !== null && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Orange', action: () => applyToSelected('color', '#f05a00') },
                  { label: 'Cyan', action: () => applyToSelected('color', '#00c8ff') },
                  { label: 'Blue', action: () => applyToSelected('color', '#5a9aff') },
                  { label: 'White', action: () => applyToSelected('color', 'white') },
                  { label: 'Dim', action: () => applyToSelected('color', 'rgba(255,255,255,0.45)') },
                  { label: 'Italic', action: () => applyToSelected('italic', !wordStyles[selectedWordIdx]?.italic) },
                  { label: 'Bold', action: () => applyToSelected('bold', !wordStyles[selectedWordIdx]?.bold) },
                  { label: 'Big', action: () => applyToSelected('size', 'big') },
                  { label: 'Small', action: () => applyToSelected('size', 'small') },
                  { label: 'Reset', action: () => resetWordStyle(selectedWordIdx) },
                ].map(btn => (
                  <button
                    key={btn.label}
                    onClick={btn.action}
                    style={{ background: '#0b1525', border: '1px solid #152840', color: '#c8dcf5', borderRadius: 5, padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={generateImage}
              disabled={imageLoading}
              style={{ background: imageLoading ? '#152840' : '#1d6ff5', border: 'none', color: 'white', borderRadius: 7, padding: '0.55rem 1.25rem', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.04em', cursor: imageLoading ? 'not-allowed' : 'pointer' }}
            >
              {imageLoading ? 'Generating...' : 'Generate Image →'}
            </button>
          </div>
        </section>
      )}

      {/* BLOCK 3 — AD STUDIO */}
      {showStudio && imageSrc && copy && (
        <section style={{ border: '1px solid #152840', borderRadius: 10, padding: '1.25rem', background: '#080f1e' }}>
          <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase', marginBottom: '1rem' }}>
            AD STUDIO
          </h2>

          {/* Format Cards */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {FORMATS.map(f => (
              <button
                key={f.label}
                onClick={() => { setFormat(f); setImgOffset({ x: 0, y: 0 }); setZoom(100) }}
                style={{
                  background: format.label === f.label ? '#1d6ff5' : '#060e1c',
                  border: '1px solid ' + (format.label === f.label ? '#1d6ff5' : '#152840'),
                  color: format.label === f.label ? 'white' : '#4a6a8a',
                  borderRadius: 7,
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: canvas area */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', letterSpacing: '0.08em' }}>
                {format.ratio} — {format.w}×{format.h}
              </div>

              {/* Ad Frame */}
              <div
                id="ad-frame"
                ref={frameRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  position: 'relative',
                  width: format.w,
                  height: format.h,
                  overflow: 'hidden',
                  borderRadius: 10,
                  boxShadow: '0 0 0 1px #152840',
                  cursor: 'grab',
                  userSelect: 'none',
                  background: '#000',
                  flexShrink: 0,
                }}
              >
                {/* Image layer */}
                <img
                  src={imageSrc}
                  alt="ad"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(calc(-50% + ${imgOffset.x}px), calc(-50% + ${imgOffset.y}px)) scale(${zoom / 100})`,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: getOverlayStyle(overlay),
                  pointerEvents: 'none',
                }} />

                {/* Text layer */}
                <div style={textPosStyle}>
                  {showEyebrow && (
                    <div style={{
                      fontFamily: 'var(--font-ibm-plex-mono)',
                      fontSize: '0.42rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(0,200,255,0.55)',
                      marginBottom: 4,
                    }}>
                      VELPI MARKETING
                    </div>
                  )}
                  {renderHeadline()}
                  {showBody && copy.body && (
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.62rem',
                      lineHeight: 1.7,
                      color: 'rgba(255,255,255,0.68)',
                      marginTop: 6,
                      maxWidth: 240,
                    }}>
                      {copy.body}
                    </div>
                  )}
                </div>
              </div>

              {/* Zoom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a' }}>ZOOM</span>
                <input
                  type="range"
                  min={100}
                  max={250}
                  value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  style={{ width: 100, accentColor: '#1d6ff5' }}
                />
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#c8dcf5', width: 36 }}>{zoom}%</span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                <button onClick={() => setShowEyebrow(s => !s)} style={btnSmall(showEyebrow)}>{showEyebrow ? 'Hide Eyebrow' : 'Show Eyebrow'}</button>
                <button onClick={() => setShowBody(s => !s)} style={btnSmall(showBody)}>{showBody ? 'Hide Body' : 'Show Body'}</button>
                <button onClick={() => { setImgOffset({ x: 0, y: 0 }); setZoom(100) }} style={btnSmall(false)}>Reset Crop</button>
                <button onClick={downloadRawImage} style={btnSmall(false)}>Raw Image</button>
                <button onClick={saveFrame} style={{ ...btnSmall(false), background: '#0d4a1e', borderColor: '#165c2a', color: '#00e5c8' }}>Save Frame</button>
              </div>
            </div>

            {/* Right: controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Font picker */}
              <div>
                <div style={labelStyle}>FONT</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {FONTS.map(f => (
                    <button
                      key={f.label}
                      onClick={() => setFont(f.value)}
                      style={{
                        background: font === f.value ? '#1d6ff5' : '#060e1c',
                        border: '1px solid ' + (font === f.value ? '#1d6ff5' : '#152840'),
                        color: font === f.value ? 'white' : '#c8dcf5',
                        borderRadius: 6,
                        padding: '0.4rem',
                        fontSize: '0.72rem',
                        fontFamily: f.value,
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline size */}
              <div>
                <div style={labelStyle}>HEADLINE SIZE — {headlineSize.toFixed(1)}rem</div>
                <input
                  type="range"
                  min={0.8}
                  max={4.0}
                  step={0.1}
                  value={headlineSize}
                  onChange={e => setHeadlineSize(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#1d6ff5' }}
                />
              </div>

              {/* Overlay */}
              <div>
                <div style={labelStyle}>OVERLAY</div>
                <select
                  value={overlay}
                  onChange={e => setOverlay(e.target.value)}
                  style={{ width: '100%', background: '#060e1c', border: '1px solid #152840', borderRadius: 6, padding: '0.45rem 0.75rem', fontSize: '0.78rem', color: '#c8dcf5' }}
                >
                  {OVERLAYS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Text position nudge */}
              <div>
                <div style={labelStyle}>TEXT POSITION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', marginBottom: 4 }}>Y</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setTextPos(p => ({ ...p, y: (p.y || 0) - 8 }))} style={nudgeBtn}>▲</button>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#c8dcf5', minWidth: 28, textAlign: 'center' }}>{textPos.y || 0}</span>
                      <button onClick={() => setTextPos(p => ({ ...p, y: (p.y || 0) + 8 }))} style={nudgeBtn}>▼</button>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#4a6a8a', marginBottom: 4 }}>X</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setTextPos(p => ({ ...p, x: (p.x || 0) - 8 }))} style={nudgeBtn}>◄</button>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#c8dcf5', minWidth: 28, textAlign: 'center' }}>{textPos.x || 0}</span>
                      <button onClick={() => setTextPos(p => ({ ...p, x: (p.x || 0) + 8 }))} style={nudgeBtn}>►</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 9-point snap grid */}
              <div>
                <div style={labelStyle}>SNAP POSITION</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: 96 }}>
                  {SNAP_POSITIONS.map(([pos, icon]) => (
                    <button
                      key={pos}
                      onClick={() => applySnap(pos)}
                      style={{
                        background: snapPos === pos ? '#1d6ff5' : '#060e1c',
                        border: '1px solid ' + (snapPos === pos ? '#1d6ff5' : '#152840'),
                        color: snapPos === pos ? 'white' : '#4a6a8a',
                        borderRadius: 4,
                        padding: '0.3rem',
                        fontSize: '0.7rem',
                        textAlign: 'center',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice ID */}
              <div>
                <div style={labelStyle}>VOICE ID</div>
                <input
                  value={voiceId}
                  onChange={e => {
                    setVoiceId(e.target.value)
                    localStorage.setItem('vs_v', e.target.value)
                  }}
                  placeholder="Hedra voice ID"
                  style={{ width: '100%', height: 34, background: '#060e1c', border: '1px solid #152840', borderRadius: 6, padding: '0 0.75rem', fontSize: '0.78rem', color: '#c8dcf5', fontFamily: 'var(--font-ibm-plex-mono)' }}
                />
              </div>

              {/* Generate Video */}
              <button
                onClick={generateVideo}
                style={{ background: '#1d6ff5', border: 'none', color: 'white', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.06em', width: '100%' }}
              >
                GENERATE VIDEO REEL
              </button>
            </div>
          </div>
        </section>
      )}

      {/* BLOCK 4 — VIDEO */}
      {showVideo && (
        <section style={{ border: '1px solid #152840', borderRadius: 10, padding: '1.25rem', background: '#080f1e' }}>
          <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase', marginBottom: '1rem' }}>
            VIDEO REEL
          </h2>
          <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#5a9aff', marginBottom: 12 }}>
            {videoStatus || 'Initializing...'}
          </div>
          {videoUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
              <video
                src={videoUrl}
                controls
                style={{ borderRadius: 8, maxWidth: 300, border: '1px solid #152840' }}
              />
              <a
                href={videoUrl}
                download="velpi-reel.mp4"
                style={{ color: '#00e5c8', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)', textDecoration: 'underline' }}
              >
                Download Reel
              </a>
            </div>
          )}
        </section>
      )}

      {/* BLOCK 5 — DOWNLOAD */}
      {showDownload && (
        <section style={{ border: '1px solid #152840', borderRadius: 10, padding: '1.25rem', background: '#080f1e' }}>
          <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase', marginBottom: '1rem' }}>
            DOWNLOAD
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={saveFrame}
              style={{ background: '#0d4a1e', border: '1px solid #165c2a', color: '#00e5c8', borderRadius: 7, padding: '0.5rem 1rem', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
            >
              Save Frame (PNG)
            </button>
            <button
              onClick={downloadCopyTxt}
              style={{ background: '#060e1c', border: '1px solid #152840', color: '#c8dcf5', borderRadius: 7, padding: '0.5rem 1rem', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
            >
              Download Copy (TXT)
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

const labelStyle = {
  fontSize: '0.6rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
  color: '#4a6a8a',
  letterSpacing: '0.08em',
  marginBottom: 6,
  textTransform: 'uppercase',
}

const nudgeBtn = {
  background: '#060e1c',
  border: '1px solid #152840',
  color: '#c8dcf5',
  borderRadius: 4,
  padding: '0.2rem 0.4rem',
  fontSize: '0.65rem',
  cursor: 'pointer',
}

function btnSmall(active) {
  return {
    background: active ? '#1d6ff5' : '#060e1c',
    border: '1px solid ' + (active ? '#1d6ff5' : '#152840'),
    color: active ? 'white' : '#4a6a8a',
    borderRadius: 5,
    padding: '0.3rem 0.6rem',
    fontSize: '0.65rem',
    fontFamily: 'var(--font-ibm-plex-mono)',
    cursor: 'pointer',
  }
}
