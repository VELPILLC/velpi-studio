'use client'
import { useState, useRef, useEffect } from 'react'
import ChatBox from '../ChatBox'

const CONTENT_SYSTEM_PROMPT = `You are a social media content strategist for Velpi Marketing, an HVAC lead generation agency. Help create organic Instagram and Facebook posts for HVAC business owners.\n\nMODE 1 - IDEATION: Chat naturally about the content idea. Short replies.\n\nMODE 2 - GENERATE/REFINE: When asked to generate or given feedback, return JSON:\n{\"headline\":\"Short headline\",\"body\":\"3-5 sentence caption\",\"hashtags\":\"8-10 hashtags\",\"dalle_prompt\":\"Square editorial HVAC photo no text documentary\",\"_done\":true}\n\nOnly return JSON when generating or refining.`

const INITIAL_MSG = {
  role: 'assistant',
  content: "Content suite online. Ready when you are. What are we putting out today?",
}

const CONTENT_TYPES = ['Value', 'Before/After', 'Tip', 'Story', 'Stat']

const FORMATS = [
  { label: '1:1', w: 280, h: 280 },
  { label: '4:5', w: 224, h: 280 },
  { label: '9:16', w: 224, h: 398 },
]

export default function ContentTab({ activeUser }) {
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [contentType, setContentType] = useState(null)

  const [content, setContent] = useState(null)
  const [showContent, setShowContent] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [format, setFormat] = useState(FORMATS[0])

  async function sendChat(text) {
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setChatLoading(true)

    const apiMessages = [...chatHistory, { role: 'user', content: text }]

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, system: CONTENT_SYSTEM_PROMPT }),
      })
      const data = await res.json()
      const raw = data.text || ''

      let parsed = null
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch (_) {}

      if (parsed && parsed._done) {
        const aiMsg = { role: 'assistant', content: 'Content generated. Preview below.' }
        setMessages([...newMessages, aiMsg])
        setChatHistory([...apiMessages, { role: 'assistant', content: raw }])
        applyContent(parsed)
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

  function applyContent(parsed) {
    setContent({
      headline: parsed.headline || '',
      body: parsed.body || '',
      hashtags: parsed.hashtags || '',
      dalle_prompt: parsed.dalle_prompt || '',
    })
    setShowContent(true)
    generateContentImage(parsed.dalle_prompt)
  }

  async function generateContentImage(prompt) {
    if (!prompt) return
    setImageLoading(true)
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.b64) setImageSrc('data:image/png;base64,' + data.b64)
    } catch (err) {
      console.error('Content image error:', err)
    }
    setImageLoading(false)
  }

  async function generateContent() {
    const typeStr = contentType ? ` (type: ${contentType})` : ''
    await sendChat(`Generate the content post now${typeStr}.`)
  }

  async function saveFrame() {
    const el = document.getElementById('content-frame')
    if (!el || !window.html2canvas) return
    const canvas = await window.html2canvas(el, { useCORS: true, scale: 2 })
    const link = document.createElement('a')
    link.download = 'velpi-content.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Chat + type selector */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase' }}>
            CONTENT JARVIS
          </h2>
          <button
            onClick={generateContent}
            style={{ background: '#0d7030', border: 'none', color: 'white', borderRadius: 6, padding: '0.3rem 0.85rem', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.04em' }}
          >
            Generate Content
          </button>
        </div>

        {/* Type buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {CONTENT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setContentType(contentType === t ? null : t)}
              style={{
                background: contentType === t ? '#0d7030' : 'transparent',
                border: '1px solid ' + (contentType === t ? '#0d7030' : '#152840'),
                color: contentType === t ? 'white' : '#4a6a8a',
                borderRadius: 6,
                padding: '0.25rem 0.75rem',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <ChatBox
          messages={messages}
          onSend={sendChat}
          loading={chatLoading}
        />
      </section>

      {/* Content Preview */}
      {showContent && content && (
        <section style={{ border: '1px solid #152840', borderRadius: 10, padding: '1.25rem', background: '#080f1e' }}>
          <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase', marginBottom: '1rem' }}>
            CONTENT PREVIEW
          </h2>

          {/* Format buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            {FORMATS.map(f => (
              <button
                key={f.label}
                onClick={() => setFormat(f)}
                style={{
                  background: format.label === f.label ? '#1d6ff5' : '#060e1c',
                  border: '1px solid ' + (format.label === f.label ? '#1d6ff5' : '#152840'),
                  color: format.label === f.label ? 'white' : '#4a6a8a',
                  borderRadius: 6,
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Frame */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                id="content-frame"
                style={{
                  position: 'relative',
                  width: format.w,
                  height: format.h,
                  overflow: 'hidden',
                  borderRadius: 10,
                  boxShadow: '0 0 0 1px #152840',
                  background: '#000',
                  flexShrink: 0,
                }}
              >
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt="content"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                {imageLoading && !imageSrc && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a6a8a', fontSize: '0.7rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                    Generating...
                  </div>
                )}
                {/* Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)',
                  pointerEvents: 'none',
                }} />
                {/* Text */}
                <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, pointerEvents: 'none' }}>
                  <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '1.1rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', lineHeight: 1.1 }}>
                    {content.headline}
                  </div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, marginTop: 4 }}>
                    {content.body}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => generateContentImage(content.dalle_prompt)}
                  style={{ background: '#060e1c', border: '1px solid #152840', color: '#4a6a8a', borderRadius: 6, padding: '0.3rem 0.65rem', fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
                >
                  New Image
                </button>
                <button
                  onClick={saveFrame}
                  style={{ background: '#0d4a1e', border: '1px solid #165c2a', color: '#00e5c8', borderRadius: 6, padding: '0.3rem 0.65rem', fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>HEADLINE</label>
                <input
                  value={content.headline}
                  onChange={e => setContent(c => ({ ...c, headline: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>CAPTION</label>
                <textarea
                  value={content.body}
                  onChange={e => setContent(c => ({ ...c, body: e.target.value }))}
                  style={{ ...inputStyle, height: 100, resize: 'none' }}
                />
              </div>
              <div>
                <label style={labelStyle}>HASHTAGS</label>
                <textarea
                  value={content.hashtags}
                  onChange={e => setContent(c => ({ ...c, hashtags: e.target.value }))}
                  style={{ ...inputStyle, height: 70, resize: 'none' }}
                />
              </div>
            </div>
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
  display: 'block',
  marginBottom: 4,
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  background: '#060e1c',
  border: '1px solid #152840',
  borderRadius: 6,
  padding: '0.5rem 0.75rem',
  fontSize: '0.8rem',
  color: '#c8dcf5',
  fontFamily: 'var(--font-inter)',
  height: 36,
}
