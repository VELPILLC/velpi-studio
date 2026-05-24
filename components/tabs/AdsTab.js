'use client'
import { useState, useRef, useEffect } from 'react'

const NEXT_STEP = {
  confirm: 'hook',
  hook: 'image_concept',
  image_concept: 'headline',
  headline: 'primary_text',
  primary_text: 'description',
  description: 'cta',
  cta: 'done',
}

const STEP_LABELS = {
  confirm: 'AD ANGLE',
  hook: 'HOOK',
  image_concept: 'IMAGE CONCEPT',
  headline: 'HEADLINE',
  primary_text: 'PRIMARY TEXT',
  description: 'DESCRIPTION',
  cta: 'CALL TO ACTION',
  done: 'DONE',
}

const PANEL_FIELD = {
  hook: 'hook',
  image_concept: 'imageConcept',
  headline: 'headline',
  primary_text: 'primaryText',
  description: 'description',
  cta: 'cta',
}

const EMPTY_PANEL = {
  confirmedAngle: '',
  hook: '',
  imageConcept: '',
  imageB64: '',
  imageLoading: false,
  headline: '',
  primaryText: '',
  description: '',
  cta: '',
}

export default function AdsTab({ pendingRefine, onRefineConsumed }) {
  const [history, setHistory] = useState([])
  const [currentStep, setCurrentStep] = useState('idea')
  const [lastClicked, setLastClicked] = useState(null)
  const [customBubble, setCustomBubble] = useState('')
  const [loading, setLoading] = useState(false)
  const [adPanel, setAdPanel] = useState({ ...EMPTY_PANEL })
  const [imageFormat, setImageFormat] = useState('9/16')
  const [input, setInput] = useState('')

  const historyScrollRef = useRef(null)

  useEffect(() => {
    if (pendingRefine) {
      loadForRefine(pendingRefine)
      onRefineConsumed?.()
    }
  }, [pendingRefine])

  function buildMessages(hist) {
    return hist.map(item => ({
      role: item.type === 'user' ? 'user' : 'assistant',
      content:
        item.type === 'user'
          ? item.text
          : JSON.stringify({
              step: item.step,
              options: item.options,
              ...(item.subOptions ? { sub: item.subOptions } : {}),
            }),
    }))
  }

  function parseJarvisResponse(raw) {
    const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    try {
      const obj = JSON.parse(stripped)
      if (obj.step) return obj
    } catch (_) {}
    try {
      const m = stripped.match(/\{[\s\S]*"step"[\s\S]*\}/)
      if (m) {
        const obj = JSON.parse(m[0])
        if (obj.step) return obj
      }
    } catch (_) {}
    return null
  }

  function getLastJarvisTurnIdx(hist) {
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].type === 'jarvis') return i
    }
    return -1
  }

  async function callAPI(messages) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.text || ''
  }

  async function generateImage(concept) {
    setAdPanel(p => ({ ...p, imageLoading: true }))
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `cinematic 9:16 vertical HVAC photo, ${concept}, no text, no logos, photorealistic, documentary style`,
        }),
      })
      const data = await res.json()
      if (data.b64) {
        setAdPanel(p => ({ ...p, imageB64: data.b64, imageLoading: false }))
      } else {
        setAdPanel(p => ({ ...p, imageLoading: false }))
      }
    } catch (err) {
      console.error('Image gen error:', err)
      setAdPanel(p => ({ ...p, imageLoading: false }))
    }
  }

  async function handleIdeaSubmit() {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')
    const newHistory = [...history, { type: 'user', text: userText }]
    setHistory(newHistory)
    setLoading(true)
    try {
      const raw = await callAPI(buildMessages(newHistory))
      const parsed = parseJarvisResponse(raw)
      if (parsed) {
        setHistory(h => [
          ...h,
          {
            type: 'jarvis',
            step: parsed.step,
            options: parsed.options || [],
            subOptions: parsed.sub || null,
            lockedValue: null,
          },
        ])
        setCurrentStep(parsed.step)
      }
    } catch (err) {
      console.error('Idea submit error:', err)
    }
    setLoading(false)
  }

  async function lockBubble(value) {
    if (loading) return
    setLastClicked(value)
    setCustomBubble('')

    // Update adPanel with locked value
    const field = PANEL_FIELD[currentStep]
    setAdPanel(p => ({
      ...p,
      ...(field ? { [field]: value } : {}),
      ...(currentStep === 'confirm' ? { confirmedAngle: value } : {}),
    }))

    // Fire image generation concurrently
    if (currentStep === 'image_concept') {
      generateImage(value)
    }

    // Mark last jarvis turn as locked
    const lockedHistory = history.map((item, idx) =>
      idx === getLastJarvisTurnIdx(history) ? { ...item, lockedValue: value } : item
    )

    const nextStep = NEXT_STEP[currentStep]
    if (!nextStep || nextStep === 'done') {
      setHistory(lockedHistory)
      setCurrentStep('done')
      setLastClicked(null)
      return
    }

    const advanceMsg = `${STEP_LABELS[currentStep]}: "${value}"`
    const withUser = [...lockedHistory, { type: 'user', text: advanceMsg }]
    setHistory(withUser)
    setLoading(true)

    try {
      const raw = await callAPI(buildMessages(withUser))
      const parsed = parseJarvisResponse(raw)
      if (parsed) {
        setHistory(h => [
          ...h,
          {
            type: 'jarvis',
            step: parsed.step || nextStep,
            options: parsed.options || [],
            subOptions: parsed.sub || null,
            lockedValue: null,
          },
        ])
        setCurrentStep(parsed.step || nextStep)
      }
    } catch (err) {
      console.error('Lock bubble API error:', err)
    }
    setLastClicked(null)
    setLoading(false)
  }

  async function loadForRefine(ad) {
    const userText = `Original ad:\nHook: "${ad.hook}"\nHeadline: "${ad.headline}"\nPrimary text: "${ad.primaryText}"\nDescription: "${ad.description}"\nCTA: "${ad.cta}"\n\nPlease generate 5 new hook options as alternatives for this ad.`
    const newHistory = [{ type: 'user', text: userText }]
    setHistory(newHistory)
    setCurrentStep('hook')
    setAdPanel({
      confirmedAngle: ad.angle || '',
      hook: ad.hook || '',
      imageConcept: ad.imageConcept || '',
      imageB64: ad.imageB64 || '',
      imageLoading: false,
      headline: ad.headline || '',
      primaryText: ad.primaryText || '',
      description: ad.description || '',
      cta: ad.cta || '',
    })
    setLoading(true)
    try {
      const raw = await callAPI(buildMessages(newHistory))
      const parsed = parseJarvisResponse(raw)
      if (parsed) {
        setHistory(h => [
          ...h,
          {
            type: 'jarvis',
            step: parsed.step || 'hook',
            options: parsed.options || [],
            subOptions: null,
            lockedValue: null,
          },
        ])
        setCurrentStep(parsed.step || 'hook')
      }
    } catch (err) {
      console.error('Load for refine error:', err)
    }
    setLoading(false)
  }

  function resetAd() {
    setHistory([])
    setCurrentStep('idea')
    setAdPanel({ ...EMPTY_PANEL })
    setLastClicked(null)
    setCustomBubble('')
    setInput('')
  }

  function saveToLibrary() {
    const entry = {
      id: Date.now(),
      hook: adPanel.hook,
      imageConcept: adPanel.imageConcept,
      imageB64: adPanel.imageB64,
      headline: adPanel.headline,
      primaryText: adPanel.primaryText,
      description: adPanel.description,
      cta: adPanel.cta,
      angle: adPanel.confirmedAngle,
      adType: '',
      createdAt: new Date().toISOString(),
      versions: [],
      status: 'unrated',
    }
    try {
      const existing = JSON.parse(localStorage.getItem('velpi_library') || '[]')
      localStorage.setItem('velpi_library', JSON.stringify([entry, ...existing]))
      alert('Saved to Library!')
    } catch (err) {
      console.error('Save to library error:', err)
    }
  }

  // ── Bubble style — highlights on click ─────────────────────────────────────
  function bubbleStyle(isActive) {
    return {
      border: '1px solid #2990fa',
      background: isActive ? '#2990fa' : '#060d1f',
      borderRadius: 8,
      padding: '10px 16px',
      fontSize: '0.82rem',
      color: '#ffffff',
      cursor: loading ? 'not-allowed' : 'pointer',
      userSelect: 'none',
      lineHeight: 1.4,
      opacity: loading ? 0.6 : 1,
    }
  }

  // ── Render a single history item ───────────────────────────────────────────
  function renderItem(item, idx, allHistory) {
    const isLastJarvis = item.type === 'jarvis' && idx === getLastJarvisTurnIdx(allHistory)

    // User message
    if (item.type === 'user') {
      return (
        <div key={idx} style={{ marginBottom: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              background: '#1a2d48',
              border: '1px solid rgba(41,144,250,0.4)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.82rem',
              color: '#ffffff',
              maxWidth: '85%',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5,
            }}
          >
            {item.text}
          </div>
        </div>
      )
    }

    // Jarvis — locked/completed
    if (item.type === 'jarvis' && item.lockedValue) {
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          <div style={stepLabelStyle}>{STEP_LABELS[item.step] || item.step}</div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#2990fa',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.82rem',
              color: '#ffffff',
            }}
          >
            <span>✓</span>
            <span>{item.lockedValue}</span>
          </div>
        </div>
      )
    }

    // Jarvis — past turn not last (greyed out, non-interactive)
    if (item.type === 'jarvis' && !isLastJarvis) {
      return (
        <div key={idx} style={{ marginBottom: 14, opacity: 0.4 }}>
          <div style={stepLabelStyle}>{STEP_LABELS[item.step] || item.step}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {item.options.map((opt, oi) => (
              <div key={oi} style={bubbleStyle(false)}>
                {opt}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Jarvis — active last turn (single click = lock + advance)
    if (item.type === 'jarvis' && isLastJarvis) {
      // CTA step with sub-bubbles
      if (item.step === 'cta') {
        return (
          <div key={idx} style={{ marginBottom: 14 }}>
            <div style={stepLabelStyle}>{STEP_LABELS.cta}</div>
            {item.options.map((opt, oi) => (
              <div key={oi} style={{ marginBottom: 12 }}>
                <div
                  style={bubbleStyle(lastClicked === opt)}
                  onClick={() => lockBubble(opt)}
                >
                  {opt}
                </div>
                {item.subOptions?.[opt] && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginLeft: 16,
                      marginTop: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    {item.subOptions[opt].map((sub, si) => (
                      <div
                        key={si}
                        onClick={() => lockBubble(`${opt} — ${sub}`)}
                        style={{
                          border: '1px solid rgba(41,144,250,0.5)',
                          background: lastClicked === `${opt} — ${sub}` ? '#2990fa' : '#060d1f',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          color: '#ffffff',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          userSelect: 'none',
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Type your own */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                value={customBubble}
                onChange={e => setCustomBubble(e.target.value)}
                placeholder="Type your own CTA..."
                style={customInputStyle}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customBubble.trim()) lockBubble(customBubble.trim())
                }}
              />
              {customBubble.trim() && (
                <button onClick={() => lockBubble(customBubble.trim())} style={useButtonStyle}>
                  Use
                </button>
              )}
            </div>
          </div>
        )
      }

      // Standard step — single click locks and advances
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          <div style={stepLabelStyle}>{STEP_LABELS[item.step] || item.step}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {item.options.map((opt, oi) => (
              <div
                key={oi}
                style={bubbleStyle(lastClicked === opt)}
                onClick={() => lockBubble(opt)}
              >
                {opt}
              </div>
            ))}
          </div>
          {/* Type your own */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={customBubble}
              onChange={e => setCustomBubble(e.target.value)}
              placeholder="Type your own..."
              style={customInputStyle}
              onKeyDown={e => {
                if (e.key === 'Enter' && customBubble.trim()) lockBubble(customBubble.trim())
              }}
            />
            {customBubble.trim() && (
              <button onClick={() => lockBubble(customBubble.trim())} style={useButtonStyle}>
                Use
              </button>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  // ── Image container dimensions ────────────────────────────────────────────
  const FORMAT_ASPECT = { '9/16': '9 / 16', '1:1': '1 / 1', '4:5': '4 / 5' }
  const imgContainerStyle = {
    width: '100%',
    maxWidth: 200,
    aspectRatio: FORMAT_ASPECT[imageFormat] || '9 / 16',
    background: '#060d1f',
    borderRadius: 6,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(41,144,250,0.3)',
    marginBottom: 10,
  }

  const isIdeaOrDone = currentStep === 'idea' || currentStep === 'done'

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* ── LEFT COLUMN — fixed height so input never moves ── */}
      <div
        id="ads-left-col"
        style={{
          flex: '1 1 55%',
          minWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 145px)',
        }}
      >
        {/* Messages — scrolls independently, takes all remaining space */}
        <div
          ref={historyScrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            background: '#0a1628',
            border: '1px solid #2990fa',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {history.length === 0 && !loading && (
            <div
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
                textAlign: 'center',
                paddingTop: 80,
                lineHeight: 1.8,
              }}
            >
              Describe your HVAC business and campaign goal to start building your ad.
            </div>
          )}
          {history.map((item, idx) => renderItem(item, idx, history))}
          {loading && (
            <div
              style={{
                color: '#2990fa',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
                padding: '6px 0',
              }}
            >
              Generating...
            </div>
          )}
        </div>

        {/* Input — pinned at bottom, never moves */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              currentStep === 'done'
                ? 'Start a new ad...'
                : isIdeaOrDone
                ? 'Describe your HVAC business and campaign goal...'
                : 'Select an option above, or type your own...'
            }
            disabled={!isIdeaOrDone || loading}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && isIdeaOrDone) {
                e.preventDefault()
                currentStep === 'done' ? resetAd() : handleIdeaSubmit()
              }
            }}
            style={{
              flex: 1,
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: '#ffffff',
              resize: 'none',
              height: 52,
              fontFamily: 'var(--font-inter)',
              opacity: isIdeaOrDone && !loading ? 1 : 0.4,
            }}
          />
          <button
            onClick={currentStep === 'done' ? resetAd : handleIdeaSubmit}
            disabled={!isIdeaOrDone || (loading && currentStep !== 'done')}
            style={{
              background: '#2990fa',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-ibm-plex-mono)',
              opacity: isIdeaOrDone && !loading ? 1 : 0.4,
              cursor: isIdeaOrDone && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {currentStep === 'done' ? 'New' : '→'}
          </button>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div
        id="ads-right-col"
        style={{
          flex: '1 1 calc(45% - 24px)',
          minWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* HOOK */}
        <div style={{ ...rightPanel, opacity: adPanel.hook ? 1 : 0.3 }}>
          <div style={panelLabel}>HOOK</div>
          <textarea
            value={adPanel.hook}
            onChange={e => setAdPanel(p => ({ ...p, hook: e.target.value }))}
            style={{ ...panelTextarea, height: 54 }}
          />
        </div>

        {/* IMAGE */}
        <div style={{ ...rightPanel, opacity: adPanel.imageConcept ? 1 : 0.3 }}>
          <div style={panelLabel}>IMAGE</div>
          {adPanel.imageConcept && (
            <div
              style={{
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 10,
                fontFamily: 'var(--font-inter)',
                lineHeight: 1.5,
              }}
            >
              {adPanel.imageConcept}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['9/16', '1:1', '4:5'].map(f => (
              <button
                key={f}
                onClick={() => setImageFormat(f)}
                style={{
                  background: imageFormat === f ? '#2990fa' : 'transparent',
                  border: '1px solid #2990fa',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: '0.65rem',
                  color: '#ffffff',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={imgContainerStyle}>
            {adPanel.imageLoading && (
              <div style={{ fontSize: '0.7rem', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                Generating...
              </div>
            )}
            {adPanel.imageB64 && !adPanel.imageLoading && (
              <img
                src={`data:image/png;base64,${adPanel.imageB64}`}
                alt="ad"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {!adPanel.imageB64 && !adPanel.imageLoading && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                No image
              </div>
            )}
          </div>
          {adPanel.imageConcept && (
            <button
              onClick={() => generateImage(adPanel.imageConcept)}
              style={{
                background: 'transparent',
                border: '1px solid #2990fa',
                borderRadius: 6,
                padding: '5px 12px',
                color: '#2990fa',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
              }}
            >
              New Image
            </button>
          )}
        </div>

        {/* HEADLINE */}
        <div style={{ ...rightPanel, opacity: adPanel.headline ? 1 : 0.3 }}>
          <div style={panelLabel}>HEADLINE</div>
          <textarea
            value={adPanel.headline}
            onChange={e => setAdPanel(p => ({ ...p, headline: e.target.value }))}
            style={{ ...panelTextarea, height: 54 }}
          />
        </div>

        {/* PRIMARY TEXT */}
        <div style={{ ...rightPanel, opacity: adPanel.primaryText ? 1 : 0.3 }}>
          <div style={panelLabel}>PRIMARY TEXT</div>
          <textarea
            value={adPanel.primaryText}
            onChange={e => setAdPanel(p => ({ ...p, primaryText: e.target.value }))}
            style={{ ...panelTextarea, height: 80 }}
          />
        </div>

        {/* DESCRIPTION + CTA */}
        <div style={{ ...rightPanel, opacity: adPanel.description || adPanel.cta ? 1 : 0.3 }}>
          <div style={panelLabel}>DESCRIPTION</div>
          <textarea
            value={adPanel.description}
            onChange={e => setAdPanel(p => ({ ...p, description: e.target.value }))}
            style={{ ...panelTextarea, height: 54, marginBottom: 12 }}
          />
          <div style={panelLabel}>CTA</div>
          <textarea
            value={adPanel.cta}
            onChange={e => setAdPanel(p => ({ ...p, cta: e.target.value }))}
            style={{ ...panelTextarea, height: 40 }}
          />
        </div>

        {/* Export + Save — only when CTA is set */}
        {adPanel.cta && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => window.print()}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #2990fa',
                borderRadius: 8,
                padding: 10,
                color: '#2990fa',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
              }}
            >
              Export PDF
            </button>
            <button
              onClick={saveToLibrary}
              style={{
                flex: 1,
                background: '#2990fa',
                border: 'none',
                borderRadius: 8,
                padding: 10,
                color: '#ffffff',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
              }}
            >
              Save to Library
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared style objects ────────────────────────────────────────────────────

const stepLabelStyle = {
  fontSize: '0.6rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
  color: '#2990fa',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const customInputStyle = {
  flex: 1,
  background: '#0a1628',
  border: '1px solid #2990fa',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: '0.8rem',
  color: '#ffffff',
  fontFamily: 'var(--font-inter)',
}

const useButtonStyle = {
  background: '#2990fa',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  color: '#ffffff',
  fontSize: '0.8rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
}

const rightPanel = {
  background: '#0a1628',
  border: '1px solid #2990fa',
  borderRadius: 8,
  padding: 16,
}

const panelLabel = {
  fontSize: '0.6rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
  color: '#2990fa',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const panelTextarea = {
  width: '100%',
  background: 'transparent',
  border: '1px solid rgba(41,144,250,0.3)',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: '0.85rem',
  color: '#ffffff',
  fontFamily: 'var(--font-inter)',
  resize: 'none',
  lineHeight: 1.5,
}
