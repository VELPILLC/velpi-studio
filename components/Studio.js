'use client'
import { useState } from 'react'

const BLUE = '#2990fa'
const BG = '#060d1f'
const PANEL = '#0a1628'
const BORDER = '#152840'

const STEP_DEFS = [
  { id: 'scan', label: 'Scanning website' },
  { id: 'analyze', label: 'Analyzing content' },
  { id: 'images-detect', label: 'Detecting images' },
  { id: 'copy', label: 'Writing copy' },
  { id: 'structure', label: 'Building structure' },
  { id: 'images-gen', label: 'Generating images' },
  { id: 'v1', label: 'Building Version 1' },
  { id: 'v2', label: 'Building Version 2' },
  { id: 'v3', label: 'Building Version 3' },
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
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (_) {
    throw new Error(`Could not reach ${path}. Check your connection and try again.`)
  }
  let data = {}
  try { data = await res.json() } catch (_) {}
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request to ${path} failed (status ${res.status}).`)
  }
  return data
}

export default function Studio() {
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [steps, setSteps] = useState(STEP_DEFS.map(s => ({ ...s, status: 'pending' })))
  const [versions, setVersions] = useState([null, null, null])
  const [activeVersion, setActiveVersion] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  async function runGeneration() {
    if (!input.trim() || generating) return
    setError(null)
    setDone(false)
    setVersions([null, null, null])
    setActiveVersion(0)
    setGenerating(true)

    const statuses = {}
    STEP_DEFS.forEach(s => { statuses[s.id] = 'pending' })
    const mark = (id, status) => {
      statuses[id] = status
      setSteps(STEP_DEFS.map(s => ({ ...s, status: statuses[s.id] })))
    }

    try {
      mark('scan', 'active')
      const { scrapedData } = await callRoute('/api/scrape', { input: input.trim() })
      mark('scan', 'complete')

      mark('analyze', 'active')
      const { analysis } = await callRoute('/api/analyze', { scrapedData })
      mark('analyze', 'complete')

      mark('images-detect', 'active')
      mark('images-detect', 'complete')

      mark('copy', 'active')
      const { copy } = await callRoute('/api/generate-copy', { analysis })
      mark('copy', 'complete')

      mark('structure', 'active')
      mark('structure', 'complete')

      mark('images-gen', 'active')
      const { images } = await callRoute('/api/generate-images', { analysis })
      mark('images-gen', 'complete')

      const built = [null, null, null]
      for (let i = 1; i <= 3; i++) {
        mark(`v${i}`, 'active')
        const { html } = await callRoute('/api/build-site', { analysis, copy, images, version: i })
        built[i - 1] = html
        setVersions([...built])
        mark(`v${i}`, 'complete')
      }

      setActiveVersion(0)
      setDone(true)
    } catch (e) {
      const activeId = Object.keys(statuses).find(k => statuses[k] === 'active')
      if (activeId) mark(activeId, 'error')
      setError(e.message || 'Something went wrong during generation.')
    } finally {
      setGenerating(false)
    }
  }

  async function sendEdit() {
    const instruction = chatInput.trim()
    if (!instruction || editing) return
    const html = versions[activeVersion]
    if (!html) return
    setEditing(true)
    setError(null)
    try {
      const { html: updated } = await callRoute('/api/edit-site', { html, instruction })
      const next = [...versions]
      next[activeVersion] = updated
      setVersions(next)
      setChatInput('')
    } catch (e) {
      setError(e.message || 'Could not apply that change.')
    } finally {
      setEditing(false)
    }
  }

  function copyHtml() {
    const html = versions[activeVersion]
    if (!html) return
    try { navigator.clipboard?.writeText(html) } catch (_) {}
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const label = { fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <VelpiLogo />
          <span style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '2rem', letterSpacing: '0.12em' }}>
            VELPI STUDIO
          </span>
        </div>
        <div style={{ ...label, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
          Website Mockup Generator
        </div>

        {/* ── Input ── */}
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 640 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runGeneration() }}
            disabled={generating}
            placeholder="Enter a website URL or business name"
            style={{
              flex: 1, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10,
              color: '#fff', padding: '14px 16px', fontSize: '0.95rem',
              fontFamily: 'var(--font-inter)', opacity: generating ? 0.6 : 1,
            }}
          />
          <button
            onClick={runGeneration}
            disabled={generating || !input.trim()}
            style={{
              background: BLUE, border: 'none', borderRadius: 10, color: '#fff',
              padding: '0 26px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.8rem',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              opacity: generating || !input.trim() ? 0.5 : 1,
              cursor: generating || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? 'Working' : 'Generate'}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            width: '100%', maxWidth: 640, marginTop: 18, background: '#2a0d12',
            border: '1px solid #ff4455', borderRadius: 10, padding: '12px 16px',
            color: '#ffb3bd', fontFamily: 'var(--font-inter)', fontSize: '0.85rem', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* ── Progress ── */}
        {(generating || steps.some(s => s.status !== 'pending')) && (
          <div style={{
            width: '100%', maxWidth: 640, marginTop: 26, background: PANEL,
            border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {steps.map(step => (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px',
              }}>
                <StatusDot status={step.status} />
                <span style={{
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', letterSpacing: '0.03em',
                  color: step.status === 'active' ? BLUE
                    : step.status === 'complete' ? '#fff'
                    : step.status === 'error' ? '#ff6675'
                    : 'rgba(255,255,255,0.4)',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Versions ── */}
        {done && (
          <div style={{ width: '100%', marginTop: 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1, 2].map(i => (
                  <button
                    key={i}
                    onClick={() => setActiveVersion(i)}
                    style={{
                      background: activeVersion === i ? BLUE : 'transparent',
                      border: `1px solid ${activeVersion === i ? BLUE : BORDER}`,
                      color: '#fff', borderRadius: 8, padding: '8px 16px',
                      fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.74rem', letterSpacing: '0.05em',
                    }}
                  >
                    Version {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={copyHtml}
                style={{
                  background: 'transparent', border: `1px solid ${BLUE}`, color: BLUE,
                  borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--font-ibm-plex-mono)',
                  fontSize: '0.74rem', letterSpacing: '0.05em',
                }}
              >
                {copied ? 'Copied' : 'Copy HTML'}
              </button>
            </div>

            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              {versions[activeVersion] ? (
                <iframe
                  title={`Version ${activeVersion + 1} preview`}
                  srcDoc={versions[activeVersion]}
                  sandbox="allow-same-origin"
                  style={{ width: '100%', height: 640, border: 'none', display: 'block', background: '#fff' }}
                />
              ) : (
                <div style={{ height: 640, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                  No preview
                </div>
              )}
            </div>

            {/* ── Chat ── */}
            <div style={{ marginTop: 16 }}>
              <div style={{ ...label, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                Edit Version {activeVersion + 1}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendEdit() }}
                  disabled={editing}
                  placeholder='Describe a change — e.g. "make the headline bigger" or "add a testimonials section"'
                  style={{
                    flex: 1, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10,
                    color: '#fff', padding: '13px 16px', fontSize: '0.9rem', fontFamily: 'var(--font-inter)',
                    opacity: editing ? 0.6 : 1,
                  }}
                />
                <button
                  onClick={sendEdit}
                  disabled={editing || !chatInput.trim()}
                  style={{
                    background: BLUE, border: 'none', borderRadius: 10, color: '#fff',
                    padding: '0 22px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    opacity: editing || !chatInput.trim() ? 0.5 : 1,
                    cursor: editing || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {editing ? 'Updating' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusDot({ status }) {
  if (status === 'complete') {
    return (
      <span style={{
        width: 18, height: 18, borderRadius: '50%', background: BLUE, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff',
      }}>✓</span>
    )
  }
  if (status === 'error') {
    return (
      <span style={{
        width: 18, height: 18, borderRadius: '50%', background: '#ff4455', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff',
      }}>!</span>
    )
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
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
      border: `1px solid ${BORDER}`, background: 'transparent',
    }} />
  )
}
