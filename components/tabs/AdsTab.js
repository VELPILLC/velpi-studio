'use client'
import { useState, useEffect } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS = ['avatar', 'visual_format', 'hook', 'image', 'headline', 'primary_text', 'description', 'cta']

const SECTION_LABELS = {
  avatar: 'AVATAR',
  visual_format: 'VISUAL FORMAT',
  hook: 'HOOK',
  image: 'IMAGE',
  headline: 'HEADLINE',
  primary_text: 'PRIMARY TEXT',
  description: 'DESCRIPTION',
  cta: 'CTA',
}

const SECTION_PROMPTS = {
  visual_format: 'Generate 3 visual format options for this ad based on the avatar.',
  hook: 'Generate 3 hook options based on what we know so far.',
  image: 'Generate 3 image concept descriptions for the visual.',
  headline: 'Generate 3 headline options. Max 40 characters each.',
  primary_text: 'Generate 3 primary text options. First 125 characters must carry the full message.',
  description: 'Generate 3 description options. Max 30 characters each.',
  cta: 'Generate 3 CTA options based on the ad type.',
}

const SECTION_ANGLES = {
  visual_format: ['Newspaper', 'Raw Photo', 'News Chyron', 'Screenshot', 'Documentary', 'Text Only', 'Report Cover'],
  hook: ['Pain', 'Curiosity', 'Contrarian', 'Benefit', 'Social Proof', 'Fear', 'Authority', 'Story'],
  image: ['Cinematic', 'Editorial', 'Raw/Real', 'Bold Text', 'Lifestyle', 'Before/After'],
  headline: ['Direct', 'Question', 'Bold Claim', 'Call Out', 'Curiosity', 'Number Based'],
  primary_text: ['Story', 'Problem/Solution', 'Value Stack', 'Testimonial', 'Direct Offer', 'Educational'],
  description: ['Urgency', 'Social Proof', 'Benefit', 'Simple CTA'],
  cta: ['Book a Call', 'Fill Form', 'DM Us', 'Call Now', 'Click Link', 'Comment Below'],
  avatar: [],
}

const AUTO_PROMPT_TEXTS = new Set(Object.values(SECTION_PROMPTS))

const EMPTY_SECTION_OBJ = () => ({
  avatar: [], visual_format: [], hook: [], image: [],
  headline: [], primary_text: [], description: [], cta: [],
})

const EMPTY_VALUES_OBJ = () => ({
  avatar: null, visual_format: null, hook: null, image: null,
  headline: null, primary_text: null, description: null, cta: null,
})

const EMPTY_AVATAR_FORM = {
  name: '', age_range: '', niche: '',
  what_they_want: '', what_they_fear: '',
  what_they_trust: '', primary_emotion: '',
}

const AVATAR_QUESTIONS = [
  'Who do you sell to? Just describe them like you would to a friend.',
  'How old are they roughly?',
  'What is the one thing they complain about most?',
  'What do they want more than anything?',
  'What would make them stop scrolling on Facebook?',
]

const AVATAR_BUILDER_SYSTEM = `You are building a marketing avatar from a conversation. Based on the answers given extract and return JSON only:
{
  "suggested_name": "short descriptive name for this avatar",
  "age_range": "age range mentioned or inferred",
  "niche": "who they sell to in simple terms",
  "what_they_want": "what the avatar wants most",
  "what_they_fear": "what they complain about or fear",
  "what_they_trust": "what visual format or style would stop their scroll based on their age and description",
  "primary_emotion": "the dominant emotion driving this person",
  "_done": true
}
Return JSON only. Nothing else.`

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdsTab({ pendingRefine, onRefineConsumed }) {
  // Section chat state
  const [activeSection, setActiveSection] = useState('avatar')
  const [sectionChats, setSectionChats] = useState(EMPTY_SECTION_OBJ())
  const [sectionValues, setSectionValues] = useState(EMPTY_VALUES_OBJ())
  const [selectedBubbles, setSelectedBubbles] = useState([])
  const [selectedAngles, setSelectedAngles] = useState([])
  const [currentBubbles, setCurrentBubbles] = useState([])
  const [typeOwn, setTypeOwn] = useState('')
  const [editingBubble, setEditingBubble] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [imageB64, setImageB64] = useState(null)
  const [dallePrompt, setDallePrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageFormat, setImageFormat] = useState('9/16')

  // Avatar state
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [avatarModal, setAvatarModal] = useState(null)
  const [avatarForm, setAvatarForm] = useState({ ...EMPTY_AVATAR_FORM })
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [avatarBuilder, setAvatarBuilder] = useState(null)

  useEffect(() => { loadAvatars() }, [])

  useEffect(() => {
    if (pendingRefine) {
      loadForRefine(pendingRefine)
      onRefineConsumed?.()
    }
  }, [pendingRefine])

  // Reset angle selections and bubble selections when section changes
  useEffect(() => {
    setSelectedAngles([])
    setSelectedBubbles([])
  }, [activeSection])

  // ─── Data ────────────────────────────────────────────────────────────────────

  async function loadAvatars() {
    try {
      const res = await fetch('/api/avatars')
      const data = await res.json()
      setAvatars(data.avatars || [])
    } catch (err) {
      console.error('Load avatars error:', err)
    }
  }

  // ─── API ─────────────────────────────────────────────────────────────────────

  async function callAPI(section, messages, svs, av, angles = []) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        avatar: av || null,
        sectionContext: svs,
        currentSection: section,
        selectedAngles: angles,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.text || ''
  }

  function parseResponse(raw) {
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      if (parsed.options) return parsed
    } catch (_) {}
    try {
      const m = raw.match(/\{[\s\S]*\}/)
      if (m) {
        const parsed = JSON.parse(m[0])
        if (parsed.options) return parsed
      }
    } catch (__) {}
    return null
  }

  function shouldHideMessage(msg) {
    if (msg.role === 'user' && AUTO_PROMPT_TEXTS.has(msg.content)) return true
    if (msg.role === 'assistant') {
      try {
        const p = JSON.parse(msg.content.replace(/```json|```/g, '').trim())
        if (Array.isArray(p.options)) return true
      } catch (_) {}
    }
    return false
  }

  // ─── Section management ──────────────────────────────────────────────────────

  async function openSection(section, svs, av, angles = []) {
    if (section === 'avatar') return
    const prompt = SECTION_PROMPTS[section]
    if (!prompt) return

    setIsLoading(true)
    try {
      const raw = await callAPI(section, [{ role: 'user', content: prompt }], svs, av, angles)
      const parsed = parseResponse(raw)
      setSectionChats(prev => ({
        ...prev,
        [section]: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: raw },
        ],
      }))
      if (parsed && parsed.options) {
        setCurrentBubbles(parsed.options)
        setSelectedBubbles([])
      }
    } catch (err) {
      console.error('openSection error:', err)
    }
    setIsLoading(false)
  }

  function gotoSection(section) {
    setActiveSection(section)
    setSelectedBubbles([])

    if (section === 'avatar') {
      setCurrentBubbles([])
      return
    }

    const val = sectionValues[section]
    const chat = sectionChats[section]

    // Section already locked — no bubbles needed
    if (val !== null) {
      setCurrentBubbles([])
      return
    }

    // Has existing chat — restore last options
    if (chat.length > 0) {
      const lastAi = [...chat].reverse().find(m => m.role === 'assistant')
      if (lastAi) {
        const parsed = parseResponse(lastAi.content)
        if (parsed && parsed.options) {
          setCurrentBubbles(parsed.options)
          return
        }
      }
      setCurrentBubbles([])
      return
    }

    // Fresh section — fire opening call
    openSection(section, sectionValues, selectedAvatar, [])
  }

  async function handleRefine() {
    if (isLoading) return
    let refineText
    if (selectedBubbles.length === 2) {
      refineText = `The user selected these two options: "${selectedBubbles[0]}" and "${selectedBubbles[1]}". Generate exactly 3 refined options:\n1. Refined version of option 1\n2. Refined version of option 2\n3. A blend of both options combined`
    } else if (selectedBubbles.length === 1) {
      refineText = `Refine. I like the direction of: "${selectedBubbles[0]}". Give me 3 tighter variations.`
    } else {
      refineText = 'Give me 3 completely different options.'
    }

    const userMsg = { role: 'user', content: refineText }
    const updatedChat = [...sectionChats[activeSection], userMsg]

    setSectionChats(prev => ({ ...prev, [activeSection]: updatedChat }))
    setIsLoading(true)

    try {
      const raw = await callAPI(
        activeSection,
        updatedChat.map(m => ({ role: m.role, content: m.content })),
        sectionValues,
        selectedAvatar,
        selectedAngles,
      )
      const parsed = parseResponse(raw)
      setSectionChats(prev => ({
        ...prev,
        [activeSection]: [...prev[activeSection], { role: 'assistant', content: raw }],
      }))
      if (parsed && parsed.options) {
        setCurrentBubbles(parsed.options)
        setSelectedBubbles([])
      }
    } catch (err) {
      console.error('handleRefine error:', err)
    }
    setIsLoading(false)
  }

  async function handleSubmit() {
    if (selectedBubbles.length !== 1 || isLoading) return
    const value = selectedBubbles[0]
    const section = activeSection

    const newSectionValues = { ...sectionValues, [section]: value }
    setSectionValues(newSectionValues)

    setSectionChats(prev => ({
      ...prev,
      [section]: [
        ...prev[section],
        { role: 'user', content: `Selected: "${value}"` },
        { role: 'assistant', content: 'Locked in.' },
      ],
    }))

    setCurrentBubbles([])
    setSelectedBubbles([])

    if (section === 'image') {
      setDallePrompt(value)
      generateImage(value)
    }

    const idx = SECTIONS.indexOf(section)
    if (idx < SECTIONS.length - 1) {
      const nextSection = SECTIONS[idx + 1]
      setActiveSection(nextSection)
      openSection(nextSection, newSectionValues, selectedAvatar, [])
    }
  }

  async function generateImage(concept) {
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `cinematic 9:16 vertical photo, ${concept}, no text, no logos, photorealistic, documentary style`,
        }),
      })
      const data = await res.json()
      if (data.b64) setImageB64(data.b64)
    } catch (err) {
      console.error('Image gen error:', err)
    }
  }

  // ─── Avatar management ───────────────────────────────────────────────────────

  function handleAvatarSelect(av) {
    const newSelected = selectedAvatar?.id === av.id ? null : av
    setSelectedAvatar(newSelected)

    if (newSelected) {
      const newSvs = { ...sectionValues, avatar: newSelected.name }
      setSectionValues(newSvs)
      setSectionChats(prev => ({
        ...prev,
        avatar: [{ role: 'assistant', content: `Avatar locked in. Writing for ${newSelected.name}.` }],
      }))
      setActiveSection('visual_format')
      openSection('visual_format', newSvs, newSelected, [])
    } else {
      setSectionValues(prev => ({ ...prev, avatar: null }))
      setSectionChats(prev => ({ ...prev, avatar: [] }))
    }
  }

  async function handleSaveAvatar() {
    if (!avatarForm.name.trim()) return
    try {
      const isEdit = avatarModal?.mode === 'edit'
      const method = isEdit ? 'PATCH' : 'POST'
      const body = isEdit ? { id: avatarModal.data.id, ...avatarForm } : avatarForm
      const res = await fetch('/api/avatars', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      await loadAvatars()
      if (!isEdit && data.avatar) setSelectedAvatar(data.avatar)
      setAvatarModal(null)
      setAvatarForm({ ...EMPTY_AVATAR_FORM })
    } catch (err) {
      console.error('Save avatar error:', err)
    }
  }

  function openEditAvatar(av) {
    setAvatarForm({
      name: av.name || '',
      age_range: av.age_range || '',
      niche: av.niche || '',
      what_they_want: av.what_they_want || '',
      what_they_fear: av.what_they_fear || '',
      what_they_trust: av.what_they_trust || '',
      primary_emotion: av.primary_emotion || '',
    })
    setAvatarModal({ mode: 'edit', data: av })
  }

  async function handleAvatarBuilderSend() {
    if (!avatarBuilder || !avatarBuilder.input.trim() || avatarBuilder.loading) return
    const answer = avatarBuilder.input.trim()
    const newMessages = [...avatarBuilder.messages, { role: 'user', text: answer }]
    const newAnswers = [...avatarBuilder.answers, answer]
    const newQuestionIdx = avatarBuilder.questionIdx + 1

    if (newQuestionIdx < 5) {
      setAvatarBuilder(b => ({
        ...b,
        messages: [...newMessages, { role: 'ai', text: AVATAR_QUESTIONS[newQuestionIdx] }],
        input: '',
        answers: newAnswers,
        questionIdx: newQuestionIdx,
      }))
    } else {
      setAvatarBuilder(b => ({ ...b, messages: newMessages, input: '', answers: newAnswers, loading: true }))
      try {
        const contextMessages = AVATAR_QUESTIONS.map((q, i) => [
          { role: 'assistant', content: q },
          { role: 'user', content: newAnswers[i] },
        ]).flat()
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: contextMessages, system: AVATAR_BUILDER_SYSTEM }),
        })
        const data = await response.json()
        let extracted = null
        try {
          extracted = JSON.parse((data.text || '').replace(/```json|```/g, '').trim())
        } catch (_) {}
        const summaryText = extracted
          ? `Got it. Here is your avatar.\n${extracted.suggested_name}${extracted.niche ? ' — ' + extracted.niche : ''}`
          : 'Got it. Here is your avatar.'
        setAvatarBuilder(b => ({
          ...b,
          messages: [...newMessages, { role: 'ai', text: summaryText }],
          extracted: extracted || {},
          editName: extracted?.suggested_name || '',
          loading: false,
        }))
      } catch (err) {
        console.error('Avatar builder error:', err)
        setAvatarBuilder(b => ({ ...b, loading: false }))
      }
    }
  }

  async function handleSaveBuiltAvatar() {
    if (!avatarBuilder || !avatarBuilder.editName.trim() || !avatarBuilder.extracted) return
    try {
      const body = {
        name: avatarBuilder.editName.trim(),
        age_range: avatarBuilder.extracted.age_range || '',
        niche: avatarBuilder.extracted.niche || '',
        what_they_want: avatarBuilder.extracted.what_they_want || '',
        what_they_fear: avatarBuilder.extracted.what_they_fear || '',
        what_they_trust: avatarBuilder.extracted.what_they_trust || '',
        primary_emotion: avatarBuilder.extracted.primary_emotion || '',
      }
      const res = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      await loadAvatars()
      if (data.avatar) setSelectedAvatar(data.avatar)
      setAvatarBuilder(null)
    } catch (err) {
      console.error('Save built avatar error:', err)
    }
  }

  // ─── Library ──────────────────────────────────────────────────────────────────

  function loadForRefine(ad) {
    const svs = {
      avatar: ad.angle || ad.avatar || null,
      visual_format: ad.visualFormat || ad.visual_format || null,
      hook: null,
      image: ad.imageConcept || ad.image_concept || null,
      headline: ad.headline || null,
      primary_text: ad.primaryText || ad.primary_text || null,
      description: ad.description || null,
      cta: ad.cta || null,
    }
    setSectionValues(svs)
    setSectionChats(EMPTY_SECTION_OBJ())
    setCurrentBubbles([])
    setSelectedBubbles([])
    setImageB64(ad.imageB64 || ad.image_b64 || null)
    setActiveSection('hook')
    openSection('hook', svs, selectedAvatar, [])
  }

  async function saveToLibrary() {
    const allConfirmed = SECTIONS.every(s => sectionValues[s] !== null)
    if (!allConfirmed) return
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: selectedAvatar?.id || null,
          avatar_name: selectedAvatar?.name || 'No Avatar',
          hook: sectionValues.hook,
          image_concept: sectionValues.image,
          image_b64: imageB64,
          headline: sectionValues.headline,
          primary_text: sectionValues.primary_text,
          description: sectionValues.description,
          cta: sectionValues.cta,
          angle: sectionValues.avatar,
          ad_type: '',
          status: 'unrated',
          version_number: 1,
          parent_id: null,
        }),
      })
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } catch (err) {
      console.error('saveToLibrary error:', err)
    }
  }

  // ─── Bubble management ───────────────────────────────────────────────────────

  function handleAddTypeOwn() {
    if (!typeOwn.trim()) return
    const val = typeOwn.trim()
    setCurrentBubbles(prev => [...prev, val])
    setSelectedBubbles([val])
    setTypeOwn('')
  }

  function handleEditSave(idx) {
    if (!editingText.trim()) return
    const oldVal = currentBubbles[idx]
    const newVal = editingText.trim()
    setCurrentBubbles(prev => prev.map((b, i) => (i === idx ? newVal : b)))
    setSelectedBubbles(prev => prev.map(b => (b === oldVal ? newVal : b)))
    setEditingBubble(null)
    setEditingText('')
  }

  function handleBubbleClick(bubble) {
    setSelectedBubbles(prev => {
      if (prev.includes(bubble)) {
        return prev.filter(b => b !== bubble)
      }
      if (prev.length < 2) {
        return [...prev, bubble]
      }
      // 2 already selected — drop the first, add the new one
      return [prev[1], bubble]
    })
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const allConfirmed = SECTIONS.every(s => sectionValues[s] !== null)
  const activeSectionIdx = SECTIONS.indexOf(activeSection)
  const sectionAngles = SECTION_ANGLES[activeSection] || []
  const canSubmit = selectedBubbles.length === 1 && !isLoading

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── OUTER WRAPPER ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* ── AVATAR BAR ── */}
        <div style={{
          flexShrink: 0, background: '#0a1628', borderBottom: '1px solid #2990fa',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
            AVATAR
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, alignItems: 'center' }}>
            {avatars.length === 0 && (
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-ibm-plex-mono)', whiteSpace: 'nowrap' }}>
                No avatars yet
              </div>
            )}
            {avatars.map(av => (
              <div key={av.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div
                  onClick={() => handleAvatarSelect(av)}
                  style={{
                    background: selectedAvatar?.id === av.id ? '#2990fa' : '#060d1f',
                    border: '1px solid #2990fa', borderRadius: 6, padding: '6px 14px',
                    cursor: 'pointer', color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)',
                    fontSize: '0.6rem', whiteSpace: 'nowrap', userSelect: 'none',
                  }}
                >
                  {av.name}
                </div>
                <div
                  onClick={() => openEditAvatar(av)}
                  style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', padding: '2px 5px', lineHeight: 1, userSelect: 'none' }}
                  title="Edit avatar"
                >
                  ✎
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setAvatarBuilder({
              messages: [{ role: 'ai', text: AVATAR_QUESTIONS[0] }],
              input: '', questionIdx: 0, answers: [], extracted: null, editName: '', loading: false,
            })}
            style={{
              border: '1px solid #2990fa', background: 'transparent', color: '#2990fa',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem', flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            New Avatar
          </button>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '55% 45%', gap: 24,
          flex: 1, minHeight: 0, overflow: 'hidden', paddingTop: 16,
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Section header with arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexShrink: 0 }}>
              {activeSectionIdx > 0 && (
                <button
                  onClick={() => gotoSection(SECTIONS[activeSectionIdx - 1])}
                  style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem' }}
                >
                  ←
                </button>
              )}
              <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1rem', color: '#2990fa', letterSpacing: '0.05em' }}>
                {SECTION_LABELS[activeSection]}
              </div>
              {activeSectionIdx < SECTIONS.length - 1 && (
                <button
                  onClick={() => gotoSection(SECTIONS[activeSectionIdx + 1])}
                  style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem' }}
                >
                  →
                </button>
              )}
            </div>

            {/* Chat messages */}
            <div style={{
              flex: 1, overflowY: 'auto', minHeight: 0,
              display: 'flex', flexDirection: 'column', gap: 8,
              padding: 12, background: '#0a1628', border: '1px solid #2990fa',
              borderRadius: 8, marginBottom: 10,
            }}>
              {sectionChats[activeSection].filter(m => !shouldHideMessage(m)).map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: msg.role === 'user' ? '#2990fa' : '#060d1f',
                    border: msg.role === 'assistant' ? '1px solid rgba(41,144,250,0.3)' : 'none',
                    color: '#ffffff', padding: '8px 12px', borderRadius: 8,
                    maxWidth: '75%', fontSize: '0.82rem', lineHeight: 1.4,
                    fontFamily: 'var(--font-inter)', whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ color: '#2990fa', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)', padding: '4px 0' }}>
                  Generating...
                </div>
              )}
            </div>

            {/* Angle buttons — above bubbles */}
            {sectionAngles.length > 0 && (
              <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {sectionAngles.map(angle => (
                  <button
                    key={angle}
                    onClick={() => setSelectedAngles(prev =>
                      prev.includes(angle) ? prev.filter(a => a !== angle) : [...prev, angle]
                    )}
                    style={{
                      border: `1px solid ${selectedAngles.includes(angle) ? '#2990fa' : '#152840'}`,
                      background: selectedAngles.includes(angle) ? '#0a1628' : '#060d1f',
                      color: selectedAngles.includes(angle) ? '#ffffff' : '#4a6a8a',
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontFamily: 'var(--font-ibm-plex-mono)',
                      fontSize: '0.52rem',
                      cursor: 'pointer',
                    }}
                  >
                    {angle}
                  </button>
                ))}
              </div>
            )}

            {/* Bubbles */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {currentBubbles.map((bubble, idx) => (
                <div key={idx}>
                  {editingBubble === idx ? (
                    <div style={{ border: '1px solid #2990fa', background: '#060d1f', borderRadius: 8, padding: '8px 12px' }}>
                      <textarea
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        style={{
                          background: '#0a1628', color: '#ffffff', border: 'none', outline: 'none',
                          width: '100%', fontSize: '0.8rem', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: 60,
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => handleEditSave(idx)} style={{ background: '#2990fa', border: 'none', color: '#fff', borderRadius: 4, padding: '4px 10px', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => { setEditingBubble(null); setEditingText('') }} style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '4px 10px', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleBubbleClick(bubble)}
                      style={{
                        border: '1px solid #2990fa',
                        background: selectedBubbles.includes(bubble) ? '#2990fa' : '#060d1f',
                        color: '#ffffff', padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-inter)', lineHeight: 1.4 }}>{bubble}</span>
                      <span
                        onClick={e => { e.stopPropagation(); setEditingBubble(idx); setEditingText(bubble) }}
                        style={{ color: selectedBubbles.includes(bubble) ? 'rgba(255,255,255,0.7)' : '#2990fa', cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0 }}
                        title="Edit"
                      >
                        ✎
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Type your own */}
            <div style={{ flexShrink: 0, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={typeOwn}
                  onChange={e => setTypeOwn(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTypeOwn() }}
                  placeholder="Type your own or paste from above..."
                  style={{
                    flex: 1, background: '#060d1f', border: '1px solid #2990fa',
                    color: '#ffffff', padding: '8px 12px', borderRadius: 6,
                    fontSize: '0.8rem', fontFamily: 'var(--font-inter)',
                  }}
                />
                {typeOwn.trim() && (
                  <button
                    onClick={handleAddTypeOwn}
                    style={{ background: '#2990fa', border: 'none', color: '#fff', borderRadius: 6, padding: '8px 14px', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
              <button
                onClick={handleRefine}
                disabled={isLoading}
                style={{
                  border: '1px solid #2990fa', background: 'transparent', color: '#2990fa',
                  padding: '8px 16px', borderRadius: 6, cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', opacity: isLoading ? 0.5 : 1,
                }}
              >
                REFINE
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  background: canSubmit ? '#2990fa' : '#0a1628',
                  border: '1px solid #2990fa',
                  color: canSubmit ? '#ffffff' : '#4a6a8a',
                  padding: '8px 16px', borderRadius: 6,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem',
                }}
              >
                SUBMIT
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%', gap: 8, paddingRight: 4 }}>
            {SECTIONS.map(section => (
              <div
                key={section}
                onClick={() => gotoSection(section)}
                style={{
                  background: '#0a1628',
                  border: `1px solid ${activeSection === section ? '#2990fa' : '#152840'}`,
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  opacity: sectionValues[section] ? 1 : 0.35,
                }}
              >
                <div style={{
                  fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: sectionValues[section] ? 6 : 0,
                }}>
                  {SECTION_LABELS[section]}
                </div>
                {sectionValues[section] && (
                  <div style={{ fontSize: '0.78rem', color: '#ffffff', fontFamily: 'var(--font-inter)', lineHeight: 1.4 }}>
                    {sectionValues[section]}
                  </div>
                )}
                {section === 'image' && imageB64 && sectionValues.image && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{
                      width: '100%',
                      aspectRatio: imageFormat === '1:1' ? '1/1' : imageFormat === '4:5' ? '4/5' : '9/16',
                      overflow: 'hidden', borderRadius: 4,
                    }}>
                      <img src={`data:image/png;base64,${imageB64}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {['9/16', '1:1', '4:5'].map(f => (
                        <button
                          key={f}
                          onClick={e => { e.stopPropagation(); setImageFormat(f) }}
                          style={{
                            background: imageFormat === f ? '#2990fa' : 'transparent',
                            border: '1px solid #2990fa', borderRadius: 4,
                            padding: '2px 8px', fontSize: '0.6rem', color: '#ffffff',
                            fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer',
                          }}
                        >
                          {f}
                        </button>
                      ))}
                      <button
                        onClick={e => { e.stopPropagation(); generateImage(dallePrompt) }}
                        style={{
                          background: 'transparent', border: '1px solid #2990fa', borderRadius: 4,
                          padding: '2px 8px', fontSize: '0.6rem', color: '#2990fa',
                          fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer',
                        }}
                      >
                        New Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Save to Library */}
            {allConfirmed && (
              <button
                onClick={saveToLibrary}
                style={{
                  background: '#2990fa', border: 'none', borderRadius: 8, padding: 12,
                  color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem',
                  cursor: 'pointer', marginTop: 4,
                }}
              >
                Save to Library
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── AVATAR EDIT MODAL ── */}
      {avatarModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,16,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { setAvatarModal(null); setAvatarForm({ ...EMPTY_AVATAR_FORM }) } }}
        >
          <div style={{ background: '#0a1628', border: '1px solid #2990fa', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.4rem', color: '#ffffff', marginBottom: 20 }}>
              Edit Avatar
            </div>
            {[
              { label: 'Name', key: 'name', type: 'input', required: true },
              { label: 'Age Range', key: 'age_range', type: 'input', placeholder: '35-50' },
              { label: 'Niche / Industry', key: 'niche', type: 'input', placeholder: 'HVAC business owners' },
              { label: 'What they want', key: 'what_they_want', type: 'textarea' },
              { label: 'What they fear', key: 'what_they_fear', type: 'textarea' },
              { label: 'What they trust visually', key: 'what_they_trust', type: 'input', placeholder: 'News formats, authority figures' },
              { label: 'Primary emotion', key: 'primary_emotion', type: 'input', placeholder: 'Fear of falling behind' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {field.label}{field.required ? ' *' : ''}
                </div>
                {field.type === 'textarea' ? (
                  <textarea
                    value={avatarForm[field.key]}
                    onChange={e => setAvatarForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{ width: '100%', background: '#060d1f', border: '1px solid #2990fa', borderRadius: 4, color: '#ffffff', padding: 8, fontFamily: 'var(--font-inter)', fontSize: '0.82rem', resize: 'none', height: 70, boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    value={avatarForm[field.key]}
                    placeholder={field.placeholder || ''}
                    onChange={e => setAvatarForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{ width: '100%', background: '#060d1f', border: '1px solid #2990fa', borderRadius: 4, color: '#ffffff', padding: 8, fontFamily: 'var(--font-inter)', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button
                onClick={handleSaveAvatar}
                disabled={!avatarForm.name.trim()}
                style={{ background: '#2990fa', border: 'none', borderRadius: 6, padding: 10, color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', width: '100%', opacity: avatarForm.name.trim() ? 1 : 0.5, cursor: avatarForm.name.trim() ? 'pointer' : 'not-allowed' }}
              >
                Save
              </button>
              <button
                onClick={() => { setAvatarModal(null); setAvatarForm({ ...EMPTY_AVATAR_FORM }) }}
                style={{ background: 'transparent', border: '1px solid #2990fa', borderRadius: 6, padding: 10, color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', width: '100%', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AVATAR BUILDER MODAL ── */}
      {avatarBuilder && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,16,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setAvatarBuilder(null) }}
        >
          <div style={{ background: '#0a1628', border: '1px solid #2990fa', borderRadius: 12, padding: 24, width: '100%', maxWidth: 460 }}>
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.4rem', color: '#ffffff', marginBottom: 4 }}>
              Build Your Avatar
            </div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.48rem', color: '#2990fa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Jarvis will ask you a few questions
            </div>
            <div style={{ minHeight: 280, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#060d1f', borderRadius: 8, marginBottom: 12 }}>
              {avatarBuilder.messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: msg.role === 'user' ? '#1a2d48' : '#0a1628',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(41,144,250,0.4)' : '#2990fa'}`,
                    borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', color: '#ffffff',
                    maxWidth: '85%', whiteSpace: 'pre-wrap', lineHeight: 1.5, fontFamily: 'var(--font-inter)',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {avatarBuilder.loading && (
                <div style={{ color: '#2990fa', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>Building avatar...</div>
              )}
            </div>
            {avatarBuilder.extracted && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Avatar Name
                </div>
                <input
                  value={avatarBuilder.editName}
                  onChange={e => setAvatarBuilder(b => ({ ...b, editName: e.target.value }))}
                  style={{ width: '100%', background: '#060d1f', border: '1px solid #2990fa', borderRadius: 4, color: '#ffffff', padding: 8, fontFamily: 'var(--font-inter)', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>
            )}
            {!avatarBuilder.extracted && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <textarea
                  value={avatarBuilder.input}
                  onChange={e => setAvatarBuilder(b => ({ ...b, input: e.target.value }))}
                  disabled={avatarBuilder.loading}
                  placeholder="Type your answer..."
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !avatarBuilder.loading) { e.preventDefault(); handleAvatarBuilderSend() } }}
                  style={{ flex: 1, background: '#0a1628', border: '1px solid #2990fa', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: '#ffffff', resize: 'none', height: 52, fontFamily: 'var(--font-inter)', opacity: avatarBuilder.loading ? 0.4 : 1 }}
                />
                <button
                  onClick={handleAvatarBuilderSend}
                  disabled={avatarBuilder.loading || !avatarBuilder.input.trim()}
                  style={{ background: '#2990fa', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#ffffff', fontSize: '0.85rem', fontFamily: 'var(--font-ibm-plex-mono)', opacity: (avatarBuilder.loading || !avatarBuilder.input.trim()) ? 0.4 : 1, cursor: (avatarBuilder.loading || !avatarBuilder.input.trim()) ? 'not-allowed' : 'pointer' }}
                >
                  →
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {avatarBuilder.extracted && (
                <button
                  onClick={handleSaveBuiltAvatar}
                  disabled={!avatarBuilder.editName.trim()}
                  style={{ background: '#2990fa', border: 'none', borderRadius: 6, padding: 10, color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', width: '100%', opacity: avatarBuilder.editName.trim() ? 1 : 0.5, cursor: avatarBuilder.editName.trim() ? 'pointer' : 'not-allowed' }}
                >
                  Save Avatar
                </button>
              )}
              <button
                onClick={() => setAvatarBuilder(null)}
                style={{ background: 'transparent', border: '1px solid #2990fa', borderRadius: 6, padding: 10, color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', width: '100%', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SAVE SUCCESS TOAST ── */}
      {saveSuccess && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#0d4a1e', border: '1px solid #165c2a',
          borderRadius: 8, padding: '10px 16px',
          color: '#00e5c8', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem', zIndex: 2000,
        }}>
          Saved.
        </div>
      )}
    </>
  )
}
