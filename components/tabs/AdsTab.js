'use client'
import { useState, useRef, useEffect } from 'react'

// ─── Placeholder pool ───────────────────────────────────────────────────────
const PLACEHOLDERS = [
  "What's the hook? Give me something raw.",
  "Who are we talking to? Be specific.",
  "What result do they actually want?",
  "What's the real problem they have?",
  "What's the one thing that makes this different?",
  "Give me a rough idea. I'll sharpen it.",
  "What do your best clients say after they work with you?",
  "What would you say if you had 5 seconds?",
]

function nextPlaceholderIdx(current) {
  let idx
  do { idx = Math.floor(Math.random() * PLACEHOLDERS.length) }
  while (idx === current && PLACEHOLDERS.length > 1)
  return idx
}

// ─── Response parsers ────────────────────────────────────────────────────────
function parseNumberedList(text) {
  const lines = text.split('\n')
  const options = []
  for (const line of lines) {
    // match  "1. text"  "1) text"  "**1.** text"  "1. **text**"
    const m = line.match(/^\s*\**(\d+)[.)]\**\s+(.+)/)
    if (m) options.push({ num: parseInt(m[1]), text: m[2].replace(/\*+/g, '').trim() })
  }
  return options.length >= 2 ? options : null
}

function isYesNoQuestion(text) {
  return /yes\s+or\s+no/i.test(text)
}

function parseAdJson(text) {
  // strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '')
  try {
    const m = stripped.match(/\{[\s\S]*?"_done"\s*:\s*true[\s\S]*?\}/)
    if (m) {
      const obj = JSON.parse(m[0])
      if (obj._done) return obj
    }
  } catch (_) {}
  try {
    const obj = JSON.parse(stripped.trim())
    if (obj._done) return obj
  } catch (_) {}
  return null
}

// A bubble message is "active" (clickable) only if no user message follows it
function getActiveBubbleIdx(msgs) {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'user') return -1
    if (msgs[i].bubbles) return i
  }
  return -1
}

// ─── Ad Field card ───────────────────────────────────────────────────────────
function AdField({ label, value, onChange, large }) {
  const empty = !value
  return (
    <div style={{
      background: '#060e1c',
      border: '1px solid #0e1e35',
      borderRadius: 8,
      padding: '0.85rem',
      opacity: empty ? 0.3 : 1,
    }}>
      <div style={{
        fontSize: '0.5rem',
        fontFamily: 'var(--font-ibm-plex-mono)',
        color: '#5a9aff',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {label}
      </div>
      {empty ? (
        <div style={{ color: '#4a6a8a', fontFamily: 'var(--font-inter)', fontSize: '0.8rem' }}>—</div>
      ) : large ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: large === 'xl' ? 90 : 64,
            background: 'transparent',
            border: 'none',
            color: '#c8dcf5',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#c8dcf5',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        />
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdsTab() {
  // Chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Placeholder rotation
  const phIdxRef = useRef(nextPlaceholderIdx(-1))
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[phIdxRef.current])

  // Bubble multi-select for the active bubble message
  const [bubbleSel, setBubbleSel] = useState([])

  // Ad data (right panel)
  const [adData, setAdData] = useState({ headline: '', primary_text: '', description: '', dalle_prompt: '' })
  const [imageSrc, setImageSrc] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageFormat, setImageFormat] = useState('9/16')

  const bottomRef = useRef(null)
  const imgContainerRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages, loading])

  // ── Placeholder rotation ──────────────────────────────────────────────────
  function rotatePlaceholder() {
    const next = nextPlaceholderIdx(phIdxRef.current)
    phIdxRef.current = next
    setPlaceholder(PLACEHOLDERS[next])
  }

  function handleInputChange(e) {
    const val = e.target.value
    if (!val && input.length > 0) rotatePlaceholder()
    setInput(val)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function send(textArg) {
    const trimmed = (textArg !== undefined ? String(textArg) : input).trim()
    if (!trimmed || loading) return

    setInput('')
    rotatePlaceholder()
    setBubbleSel([])
    setLoading(true)

    const userMsg = { role: 'user', content: trimmed, bubbles: null }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)

    // Build API messages (role + content only)
    const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMsgs }),
      })
      const data = await res.json()
      const raw = data.text || ''

      // Check for completed JSON first
      const json = parseAdJson(raw)
      if (json) {
        setAdData({
          headline: json.headline || '',
          primary_text: json.primary_text || '',
          description: json.description || '',
          dalle_prompt: json.dalle_prompt || '',
        })
        setMessages([...newMsgs, {
          role: 'assistant',
          content: 'Copy locked. Generating your image now...',
          bubbles: null,
        }])
        generateImage(json.dalle_prompt)
      } else {
        // Determine bubble type
        let bubbles = null
        if (isYesNoQuestion(raw)) {
          bubbles = { type: 'confirm', options: [] }
        } else {
          const options = parseNumberedList(raw)
          if (options) bubbles = { type: 'multiselect', options }
        }
        setMessages([...newMsgs, { role: 'assistant', content: raw, bubbles }])
      }
    } catch (err) {
      setMessages([...newMsgs, { role: 'assistant', content: 'Error: ' + err.message, bubbles: null }])
    }
    setLoading(false)
  }

  // ── Bubble actions ────────────────────────────────────────────────────────
  function toggleBubble(idx) {
    setBubbleSel(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  function handleRefine() {
    if (bubbleSel.length === 0) return
    const activeIdx = getActiveBubbleIdx(messages)
    if (activeIdx === -1) return
    const opts = messages[activeIdx].bubbles?.options || []
    const selected = opts.filter((_, i) => bubbleSel.includes(i))
    if (selected.length === 0) return
    const text = selected.length === 1
      ? `I like option ${selected[0].num}: "${selected[0].text}"`
      : `I like these: ${selected.map(o => `"${o.text}"`).join(', ')}. Refine in this direction.`
    send(text)
  }

  function handleYesNo(answer) {
    send(answer)
  }

  // ── Image ─────────────────────────────────────────────────────────────────
  async function generateImage(prompt) {
    if (!prompt) return
    setImageLoading(true)
    setImageSrc(null)
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.b64) setImageSrc('data:image/png;base64,' + data.b64)
      else console.error('Image error:', data.error)
    } catch (err) {
      console.error('Image error:', err)
    }
    setImageLoading(false)
  }

  function newImage() {
    if (adData.dalle_prompt) generateImage(adData.dalle_prompt)
  }

  async function downloadImage() {
    const el = imgContainerRef.current
    if (!el || !window.html2canvas) return
    const canvas = await window.html2canvas(el, { useCORS: true, scale: 2 })
    const link = document.createElement('a')
    link.download = 'velpi-ad.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function exportCopy() {
    const { headline, primary_text, description } = adData
    const txt = `VELPI STUDIO — AD COPY\n\nHEADLINE:\n${headline}\n\nPRIMARY TEXT:\n${primary_text}\n\nDESCRIPTION:\n${description}`
    const blob = new Blob([txt], { type: 'text/plain' })
    const link = document.createElement('a')
    link.download = 'velpi-ad-copy.txt'
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeBubbleIdx = getActiveBubbleIdx(messages)
  const allReady = adData.headline && adData.primary_text && adData.description && imageSrc

  const formatAspect = {
    '9/16': '9 / 16',
    '1/1': '1 / 1',
    '4/5': '4 / 5',
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>

      {/* ── LEFT COLUMN: JARVIS CHAT ────────────────────────────────────── */}
      <div style={{ flex: '1 1 55%', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              flex: 1,
              height: 52,
              background: '#060e1c',
              border: '1px solid #152840',
              borderRadius: 8,
              padding: '0.65rem 0.85rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.82rem',
              color: '#c8dcf5',
              resize: 'none',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#0b1525' : '#1d6ff5',
              border: '1px solid ' + (loading || !input.trim() ? '#152840' : '#1d6ff5'),
              color: loading || !input.trim() ? '#4a6a8a' : 'white',
              borderRadius: 8,
              padding: '0 1.1rem',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-ibm-plex-mono)',
              letterSpacing: '0.06em',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            SEND
          </button>
        </div>

        {/* Messages */}
        <div style={{
          maxHeight: 500,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {messages.map((msg, msgIdx) => {
            const isActive = activeBubbleIdx === msgIdx
            return (
              <div key={msgIdx}>
                {/* Bubble */}
                <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={msg.role === 'user' ? userBubble : aiBubble}>
                    {msg.content}
                  </div>
                </div>

                {/* Option chips */}
                {msg.bubbles?.type === 'multiselect' && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {msg.bubbles.options.map((opt, oi) => {
                      const selected = isActive && bubbleSel.includes(oi)
                      return (
                        <button
                          key={oi}
                          onClick={() => isActive && toggleBubble(oi)}
                          style={{
                            background: selected ? 'rgba(29,111,245,0.12)' : '#060e1c',
                            border: '1px solid ' + (selected ? '#1d6ff5' : '#1d3a58'),
                            color: selected ? '#5a9aff' : '#c8dcf5',
                            borderRadius: 20,
                            padding: '0.32rem 0.85rem',
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-inter)',
                            cursor: isActive ? 'pointer' : 'default',
                            opacity: isActive ? 1 : 0.55,
                            textAlign: 'left',
                            maxWidth: '100%',
                          }}
                        >
                          {opt.text}
                        </button>
                      )
                    })}
                    {isActive && bubbleSel.length > 0 && (
                      <button
                        onClick={handleRefine}
                        style={{
                          background: '#1d6ff5',
                          border: 'none',
                          color: 'white',
                          borderRadius: 20,
                          padding: '0.32rem 1rem',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-ibm-plex-mono)',
                          letterSpacing: '0.04em',
                          cursor: 'pointer',
                        }}
                      >
                        Refine these →
                      </button>
                    )}
                  </div>
                )}

                {/* Yes / No chips */}
                {msg.bubbles?.type === 'confirm' && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => isActive && handleYesNo('Yes')}
                      style={{
                        background: 'transparent',
                        border: '1px solid #00e5c8',
                        color: '#00e5c8',
                        borderRadius: 20,
                        padding: '0.32rem 1.1rem',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-ibm-plex-mono)',
                        cursor: isActive ? 'pointer' : 'default',
                        opacity: isActive ? 1 : 0.5,
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => isActive && handleYesNo('No')}
                      style={{
                        background: 'transparent',
                        border: '1px solid #ff4455',
                        color: '#ff4455',
                        borderRadius: 20,
                        padding: '0.32rem 1.1rem',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-ibm-plex-mono)',
                        cursor: isActive ? 'pointer' : 'default',
                        opacity: isActive ? 1 : 0.5,
                      }}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ ...aiBubble, color: '#4a6a8a' }}>...</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── RIGHT COLUMN: AD BUILDER ────────────────────────────────────── */}
      <div style={{ flex: '1 1 40%', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>

        <div style={{
          fontFamily: 'var(--font-bebas-neue)',
          fontSize: '1.6rem',
          color: '#5a9aff',
          letterSpacing: '0.05em',
          marginBottom: 2,
        }}>
          Your Ad
        </div>

        {/* Text fields */}
        <AdField
          label="Headline"
          value={adData.headline}
          onChange={v => setAdData(d => ({ ...d, headline: v }))}
        />
        <AdField
          label="Primary Text"
          value={adData.primary_text}
          onChange={v => setAdData(d => ({ ...d, primary_text: v }))}
          large="xl"
        />
        <AdField
          label="Description"
          value={adData.description}
          onChange={v => setAdData(d => ({ ...d, description: v }))}
          large
        />

        {/* Image field */}
        <div style={{
          background: '#060e1c',
          border: '1px solid #0e1e35',
          borderRadius: 8,
          padding: '0.85rem',
          opacity: !imageSrc && !imageLoading ? 0.3 : 1,
        }}>
          <div style={{
            fontSize: '0.5rem',
            fontFamily: 'var(--font-ibm-plex-mono)',
            color: '#5a9aff',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Image
          </div>

          {imageLoading ? (
            <div style={{ color: '#4a6a8a', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>
              Generating image...
            </div>
          ) : imageSrc ? (
            <div>
              {/* Image container — html2canvas target */}
              <div
                ref={imgContainerRef}
                style={{
                  width: '100%',
                  aspectRatio: formatAspect[imageFormat],
                  overflow: 'hidden',
                  borderRadius: 6,
                  marginBottom: 10,
                  background: '#000',
                }}
              >
                <img
                  src={imageSrc}
                  alt="ad visual"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              </div>

              {/* Format toggles */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  { key: '9/16', label: '9:16 Reel' },
                  { key: '1/1', label: '1:1 Square' },
                  { key: '4/5', label: '4:5 Portrait' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setImageFormat(f.key)}
                    style={{
                      background: imageFormat === f.key ? '#1d6ff5' : '#0b1525',
                      border: '1px solid ' + (imageFormat === f.key ? '#1d6ff5' : '#152840'),
                      color: imageFormat === f.key ? 'white' : '#4a6a8a',
                      borderRadius: 5,
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-ibm-plex-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Download / New Image */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={downloadImage}
                  style={actionBtn}
                >
                  Download
                </button>
                <button
                  onClick={newImage}
                  style={actionBtn}
                >
                  New Image
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              color: '#4a6a8a',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.8rem',
              fontStyle: 'italic',
            }}>
              Image generates after copy is confirmed
            </div>
          )}
        </div>

        {/* Export */}
        <button
          onClick={exportCopy}
          disabled={!allReady}
          style={{
            background: allReady ? '#1d6ff5' : '#0b1525',
            border: '1px solid ' + (allReady ? '#1d6ff5' : '#152840'),
            color: allReady ? 'white' : '#4a6a8a',
            borderRadius: 8,
            padding: '0.65rem',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-ibm-plex-mono)',
            letterSpacing: '0.08em',
            cursor: allReady ? 'pointer' : 'not-allowed',
            marginTop: 2,
          }}
        >
          EXPORT AD COPY
        </button>
      </div>
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const aiBubble = {
  background: '#0b1525',
  border: '1px solid #152840',
  color: '#c8dcf5',
  padding: '0.65rem 1rem',
  borderRadius: '10px 10px 10px 2px',
  maxWidth: '86%',
  fontSize: '0.82rem',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  fontFamily: 'var(--font-inter)',
}

const userBubble = {
  background: '#1d6ff5',
  color: 'white',
  padding: '0.65rem 1rem',
  borderRadius: '10px 10px 2px 10px',
  maxWidth: '80%',
  fontSize: '0.82rem',
  lineHeight: 1.5,
  fontFamily: 'var(--font-inter)',
}

const actionBtn = {
  background: '#0b1525',
  border: '1px solid #152840',
  color: '#c8dcf5',
  borderRadius: 6,
  padding: '0.35rem 0.85rem',
  fontSize: '0.7rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
  cursor: 'pointer',
}
