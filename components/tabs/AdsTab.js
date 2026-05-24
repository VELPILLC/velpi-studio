'use client'
import { useState, useEffect } from 'react'

const JARVIS_SYSTEM_PROMPT = `You are Jarvis, a direct response ad strategist and copywriter. You help anyone build a Facebook ad from scratch using psychology, not guesswork.

YOU KNOW NOTHING ABOUT THE USER'S BUSINESS UNTIL THEY TELL YOU.
Never assume industry, audience, product, or offer.
Build everything from what the user gives you.
Never invent numbers, stats, claims, or proof the user did not provide.
Only use what they tell you. Make it clearer and stronger.

YOUR FRAMEWORK — apply this thinking to every ad you help build:

1. THE AVATAR
Before writing anything, understand who is being targeted.
Age range matters. What did they grow up with? What do they trust? What do they fear? What do they want to be seen as?
A 45 year old business owner grew up reading newspapers and watching the news. They trust authority formats. Red white and blue feels safe. Bold headlines feel credible.
A 28 year old entrepreneur grew up on Instagram. Raw, unpolished, real feels trustworthy. Overly designed feels fake.
Always think: what format, color, and feeling does this person already trust?

2. THE PATTERN INTERRUPT
The brain scrolls on autopilot. An ad that looks like everything else gets ignored.
The visual must break the pattern of what else is in their feed.
Format options to consider based on avatar:
- Newspaper front page (trust, authority, 40+ demographic)
- Raw iPhone photo (authenticity, realness, any age)
- Text on plain background (curiosity, reads like a message)
- News chyron or breaking news style (urgency, familiarity)
- Handwritten note (personal, intimate)
- Document or report cover (professional, authority)
- Screenshot of a conversation or result (social proof, real)
- Movie poster or cover (aspiration, status)
Choose the format that matches what this avatar already trusts.

3. THE IDENTITY CALL-OUT
Name them so specifically they stop scrolling because they think you are talking directly to them.
Use their exact identity, their exact situation, their exact frustration or desire.
The more specific the better. Broad loses. Specific wins.

4. THE EMOTION
Every buying decision is emotional first, logical second.
Identify the primary emotion driving this avatar:
- Pride (they want to be seen winning)
- Fear of falling behind (competitors, time, opportunity)
- Frustration (something is not working)
- Hope (they believe something better is possible)
- Status (they want their peers to notice)
- Relief (they are tired and want a solution)
Lead with that emotion in the hook and headline.

5. THE COPY RULES
- Short sentences. Small words. Third grade reading level.
- Headline is 80 percent of the ad. Make it count.
- Give a reason why. The word because is powerful.
- Show the moment not the result. Describe what happens, not what you claim.
- Admit a flaw if it makes the claim more believable.
- Never fake urgency or scarcity.
- CTA tells them exactly what to click and what happens next.

RESPONSE FORMAT:
Never return plain text paragraphs.
Always return JSON only.
Never explain yourself.

STEP RESPONSES:

Avatar detection from user input:
{"step":"avatar","options":["[age range] [identity] — [what they trust visually] — [primary emotion]","option2","option3","option4","option5"]}

Visual format suggestions based on avatar:
{"step":"visual_format","options":["Newspaper front page — authority and trust","Raw photo — real and unpolished","option3","option4","option5"]}

Hook options (based only on what user said, no invented facts):
{"step":"hook","options":["option1","option2","option3","option4","option5"]}

Image concept options (cinematic, based on chosen visual format and avatar):
{"step":"image_concept","options":["description1","description2","description3","description4","description5"]}

Headline options:
{"step":"headline","options":["option1","option2","option3","option4","option5"]}

Primary text options:
{"step":"primary_text","options":["option1","option2","option3","option4","option5"]}

Description options:
{"step":"description","options":["option1","option2","option3"]}

CTA options:
{"step":"cta","options":["cta1","cta2","cta3"],"sub":{"cta1":["var1","var2"],"cta2":["var1","var2"],"cta3":["var1","var2"]}}

refinementCount controls how many options to return:
0 = 5 options
1 = 3 options
2 = 2 options
3+ = 3 variations of the chosen one

Pass full conversation history every call so Jarvis learns and refines from every selection.
Never reset context. Never repeat options already rejected.`

const NEXT_STEP = {
  avatar: 'visual_format',
  visual_format: 'hook',
  hook: 'image_concept',
  image_concept: 'headline',
  headline: 'primary_text',
  primary_text: 'description',
  description: 'cta',
  cta: 'done',
}

const STEP_LABELS = {
  avatar: 'AVATAR',
  visual_format: 'VISUAL FORMAT',
  hook: 'HOOK',
  image_concept: 'IMAGE CONCEPT',
  headline: 'HEADLINE',
  primary_text: 'PRIMARY TEXT',
  description: 'DESCRIPTION',
  cta: 'CALL TO ACTION',
  done: 'DONE',
}

const PANEL_FIELD = {
  avatar: 'avatar',
  visual_format: 'visualFormat',
  hook: 'hook',
  image_concept: 'imageConcept',
  headline: 'headline',
  primary_text: 'primaryText',
  description: 'description',
  cta: 'cta',
}

const EMPTY_PANEL = {
  avatar: '',
  visualFormat: '',
  hook: '',
  imageConcept: '',
  imageB64: '',
  imageLoading: false,
  headline: '',
  primaryText: '',
  description: '',
  cta: '',
}

const EMPTY_AVATAR_FORM = {
  name: '',
  age_range: '',
  niche: '',
  what_they_want: '',
  what_they_fear: '',
  what_they_trust: '',
  primary_emotion: '',
}

const AVATAR_QUESTIONS = [
  "Who do you sell to? Just describe them like you would to a friend.",
  "How old are they roughly?",
  "What is the one thing they complain about most?",
  "What do they want more than anything?",
  "What would make them stop scrolling on Facebook?",
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

export default function AdsTab({ pendingRefine, onRefineConsumed }) {
  const [history, setHistory] = useState([])
  const [currentStep, setCurrentStep] = useState('idea')
  const [selectedBubbles, setSelectedBubbles] = useState([])
  const [refinementCount, setRefinementCount] = useState(0)
  const [customBubble, setCustomBubble] = useState('')
  const [loading, setLoading] = useState(false)
  const [adPanel, setAdPanel] = useState({ ...EMPTY_PANEL })
  const [imageFormat, setImageFormat] = useState('9/16')
  const [input, setInput] = useState('')

  // Avatar state
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [avatarModal, setAvatarModal] = useState(null) // null | { mode: 'create'|'edit', data: obj|null }
  const [avatarForm, setAvatarForm] = useState({ ...EMPTY_AVATAR_FORM })

  // Save success toast
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Avatar builder chat state
  const [avatarBuilder, setAvatarBuilder] = useState(null)

  useEffect(() => {
    loadAvatars()
  }, [])

  useEffect(() => {
    if (pendingRefine) {
      loadForRefine(pendingRefine)
      onRefineConsumed?.()
    }
  }, [pendingRefine])

  async function loadAvatars() {
    try {
      const res = await fetch('/api/avatars')
      const data = await res.json()
      setAvatars(data.avatars || [])
    } catch (err) {
      console.error('Load avatars error:', err)
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

      if (!isEdit && data.avatar) {
        setSelectedAvatar(data.avatar)
      }
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
          body: JSON.stringify({
            messages: contextMessages,
            system: AVATAR_BUILDER_SYSTEM,
            refinementCount: 0,
          }),
        })
        const data = await response.json()

        let extracted = null
        try {
          const cleaned = (data.text || '').replace(/```json|```/g, '').trim()
          extracted = JSON.parse(cleaned)
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
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      if (parsed.step) return parsed
      console.warn('[Jarvis] JSON parsed but no step field:', parsed)
      return null
    } catch (_) {
      try {
        const m = raw.match(/\{[\s\S]*"step"[\s\S]*\}/)
        if (m) {
          const parsed = JSON.parse(m[0])
          if (parsed.step) return parsed
        }
      } catch (__) {}
      console.error('[Jarvis] Failed to parse. Raw text:', raw)
      return null
    }
  }

  function getLastJarvisTurnIdx(hist) {
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].type === 'jarvis') return i
    }
    return -1
  }

  async function callAPI(chatHistory, refCount = 0) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        system: JARVIS_SYSTEM_PROMPT,
        refinementCount: refCount,
        avatar: selectedAvatar || null,
      }),
    })
    const data = await response.json()
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
          prompt: `cinematic 9:16 vertical photo, ${concept}, no text, no logos, photorealistic, documentary style`,
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
      const raw = await callAPI(buildMessages(newHistory), 0)
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

  function handleBubbleClick(opt) {
    if (loading) return
    setSelectedBubbles(prev => {
      const idx = prev.indexOf(opt)
      if (idx >= 0) return prev.filter(b => b !== opt)
      return [...prev, opt]
    })
  }

  async function handleRefine() {
    if (selectedBubbles.length === 0 || loading) return
    const newCount = refinementCount + 1
    const targetCount = newCount === 1 ? 3 : 2
    const selectionStr =
      selectedBubbles.length === 1
        ? `"${selectedBubbles[0]}"`
        : selectedBubbles.map(b => `"${b}"`).join(', ')
    const refineText = `I'm leaning toward ${selectionStr} for ${STEP_LABELS[currentStep]}. Return ${targetCount} tighter options in this direction.`
    const newHistory = [...history, { type: 'user', text: refineText }]

    setHistory(newHistory)
    setSelectedBubbles([])
    setRefinementCount(newCount)
    setLoading(true)

    try {
      const raw = await callAPI(buildMessages(newHistory), newCount)
      const parsed = parseJarvisResponse(raw)
      if (parsed) {
        setHistory(h => [
          ...h,
          {
            type: 'jarvis',
            step: parsed.step || currentStep,
            options: parsed.options || [],
            subOptions: parsed.sub || null,
            lockedValue: null,
          },
        ])
      }
    } catch (err) {
      console.error('Refine error:', err)
    }
    setLoading(false)
  }

  function handleConfirm() {
    if (selectedBubbles.length === 0 || loading) return
    const value = selectedBubbles[selectedBubbles.length - 1]
    lockBubble(value)
  }

  async function lockBubble(value) {
    if (loading) return
    setSelectedBubbles([])
    setRefinementCount(0)
    setCustomBubble('')

    const field = PANEL_FIELD[currentStep]
    setAdPanel(p => ({
      ...p,
      ...(field ? { [field]: value } : {}),
    }))

    if (currentStep === 'image_concept') {
      generateImage(value)
    }

    const lockedHistory = history.map((item, idx) =>
      idx === getLastJarvisTurnIdx(history) ? { ...item, lockedValue: value } : item
    )

    const nextStep = NEXT_STEP[currentStep]
    if (!nextStep || nextStep === 'done') {
      setHistory(lockedHistory)
      setCurrentStep('done')
      return
    }

    const advanceMsg = `${STEP_LABELS[currentStep]}: "${value}"`
    const withUser = [...lockedHistory, { type: 'user', text: advanceMsg }]
    setHistory(withUser)
    setLoading(true)

    try {
      const raw = await callAPI(buildMessages(withUser), 0)
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
      console.error('Lock bubble error:', err)
    }
    setLoading(false)
  }

  async function loadForRefine(ad) {
    const userText = `Original ad:\nHook: "${ad.hook}"\nHeadline: "${ad.headline}"\nPrimary text: "${ad.primaryText || ad.primary_text}"\nDescription: "${ad.description}"\nCTA: "${ad.cta}"\n\nPlease generate 5 new hook options as alternatives for this ad.`
    const newHistory = [{ type: 'user', text: userText }]
    setHistory(newHistory)
    setCurrentStep('hook')
    setSelectedBubbles([])
    setRefinementCount(0)
    setAdPanel({
      avatar: ad.avatar || ad.angle || '',
      visualFormat: ad.visualFormat || '',
      hook: ad.hook || '',
      imageConcept: ad.imageConcept || ad.image_concept || '',
      imageB64: ad.imageB64 || ad.image_b64 || '',
      imageLoading: false,
      headline: ad.headline || '',
      primaryText: ad.primaryText || ad.primary_text || '',
      description: ad.description || '',
      cta: ad.cta || '',
    })
    setLoading(true)
    try {
      const raw = await callAPI(buildMessages(newHistory), 0)
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
    setSelectedBubbles([])
    setRefinementCount(0)
    setCustomBubble('')
    setInput('')
  }

  async function saveToLibrary() {
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: selectedAvatar?.id || null,
          avatar_name: selectedAvatar?.name || 'No Avatar',
          hook: adPanel.hook,
          image_concept: adPanel.imageConcept,
          image_b64: adPanel.imageB64,
          headline: adPanel.headline,
          primary_text: adPanel.primaryText,
          description: adPanel.description,
          cta: adPanel.cta,
          angle: adPanel.avatar,
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
      console.error('Save to library error:', err)
    }
  }

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

  function renderItem(item, idx, allHistory) {
    const isLastJarvis = item.type === 'jarvis' && idx === getLastJarvisTurnIdx(allHistory)

    if (item.type === 'user') {
      return (
        <div key={idx} style={{ marginBottom: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            background: '#1a2d48',
            border: '1px solid rgba(41,144,250,0.4)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: '0.82rem',
            color: '#ffffff',
            maxWidth: '85%',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
          }}>
            {item.text}
          </div>
        </div>
      )
    }

    if (item.type === 'jarvis' && item.lockedValue) {
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          <div style={stepLabelStyle}>{STEP_LABELS[item.step] || item.step}</div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#2990fa',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: '0.82rem',
            color: '#ffffff',
          }}>
            <span>✓</span>
            <span>{item.lockedValue}</span>
          </div>
        </div>
      )
    }

    if (item.type === 'jarvis' && !isLastJarvis) {
      return (
        <div key={idx} style={{ marginBottom: 14, opacity: 0.4 }}>
          <div style={stepLabelStyle}>{STEP_LABELS[item.step] || item.step}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {item.options.map((opt, oi) => (
              <div key={oi} style={bubbleStyle(false)}>{opt}</div>
            ))}
          </div>
        </div>
      )
    }

    if (item.type === 'jarvis' && isLastJarvis) {
      const hasSelection = selectedBubbles.length > 0
      const canRefine = hasSelection && refinementCount < 2

      if (item.step === 'cta') {
        const customSelected = selectedBubbles.filter(b => !item.options.includes(b))
        return (
          <div key={idx} style={{ marginBottom: 14 }}>
            <div style={stepLabelStyle}>{STEP_LABELS.cta}</div>
            {item.options.map((opt, oi) => (
              <div key={oi} style={{ marginBottom: 12 }}>
                <div style={bubbleStyle(selectedBubbles.includes(opt))} onClick={() => handleBubbleClick(opt)}>
                  {opt}
                </div>
                {selectedBubbles.includes(opt) && item.subOptions?.[opt] && (
                  <div style={{ display: 'flex', gap: 6, marginLeft: 16, marginTop: 6, flexWrap: 'wrap' }}>
                    {item.subOptions[opt].map((sub, si) => {
                      const combined = `${opt} — ${sub}`
                      return (
                        <div
                          key={si}
                          onClick={() => handleBubbleClick(combined)}
                          style={{
                            border: '1px solid rgba(41,144,250,0.5)',
                            background: selectedBubbles.includes(combined) ? '#2990fa' : '#060d1f',
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
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
            {customSelected.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {customSelected.map((b, bi) => (
                  <div key={bi} style={bubbleStyle(true)} onClick={() => handleBubbleClick(b)}>{b}</div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                value={customBubble}
                onChange={e => setCustomBubble(e.target.value)}
                placeholder="Type your own CTA..."
                style={customInputStyle}
                onKeyDown={e => { if (e.key === 'Enter' && customBubble.trim()) { handleBubbleClick(customBubble.trim()); setCustomBubble('') } }}
              />
              {customBubble.trim() && (
                <button onClick={() => { handleBubbleClick(customBubble.trim()); setCustomBubble('') }} style={useButtonStyle}>Use</button>
              )}
            </div>
            {hasSelection && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {canRefine && <button onClick={handleRefine} style={refineActionStyle}>Refine →</button>}
                <button onClick={handleConfirm} style={confirmActionStyle}>Confirm ✓</button>
              </div>
            )}
          </div>
        )
      }

      const customSelected = selectedBubbles.filter(b => !item.options.includes(b))
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          <div style={stepLabelStyle}>{STEP_LABELS[item.step] || item.step}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {item.options.map((opt, oi) => (
              <div key={oi} style={bubbleStyle(selectedBubbles.includes(opt))} onClick={() => handleBubbleClick(opt)}>
                {opt}
              </div>
            ))}
            {customSelected.map((b, bi) => (
              <div key={'custom-' + bi} style={bubbleStyle(true)} onClick={() => handleBubbleClick(b)}>{b}</div>
            ))}
          </div>
          {hasSelection && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {canRefine && <button onClick={handleRefine} style={refineActionStyle}>Refine →</button>}
              <button onClick={handleConfirm} style={confirmActionStyle}>Confirm ✓</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={customBubble}
              onChange={e => setCustomBubble(e.target.value)}
              placeholder="Type your own..."
              style={customInputStyle}
              onKeyDown={e => { if (e.key === 'Enter' && customBubble.trim()) { handleBubbleClick(customBubble.trim()); setCustomBubble('') } }}
            />
            {customBubble.trim() && (
              <button onClick={() => { handleBubbleClick(customBubble.trim()); setCustomBubble('') }} style={useButtonStyle}>Use</button>
            )}
          </div>
        </div>
      )
    }

    return null
  }

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
    <>
      {/* ── OUTER WRAPPER ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* ── AVATAR BAR ── */}
        <div style={{
          flexShrink: 0,
          background: '#0a1628',
          borderBottom: '1px solid #2990fa',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            fontSize: '0.48rem',
            fontFamily: 'var(--font-ibm-plex-mono)',
            color: '#2990fa',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            flexShrink: 0,
          }}>
            AVATAR
          </div>

          {/* Scrollable avatar cards */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, alignItems: 'center' }}>
            {avatars.length === 0 && (
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-ibm-plex-mono)', whiteSpace: 'nowrap' }}>
                No avatars yet
              </div>
            )}
            {avatars.map(av => (
              <div key={av.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div
                  onClick={() => setSelectedAvatar(selectedAvatar?.id === av.id ? null : av)}
                  style={{
                    background: selectedAvatar?.id === av.id ? '#2990fa' : '#060d1f',
                    border: '1px solid #2990fa',
                    borderRadius: 6,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    fontSize: '0.6rem',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {av.name}
                </div>
                <div
                  onClick={() => openEditAvatar(av)}
                  style={{
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.65rem',
                    padding: '2px 5px',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                  title="Edit avatar"
                >
                  ✎
                </div>
              </div>
            ))}
          </div>

          {/* New Avatar button */}
          <button
            onClick={() => setAvatarBuilder({
              messages: [{ role: 'ai', text: AVATAR_QUESTIONS[0] }],
              input: '',
              questionIdx: 0,
              answers: [],
              extracted: null,
              editName: '',
              loading: false,
            })}
            style={{
              border: '1px solid #2990fa',
              background: 'transparent',
              color: '#2990fa',
              padding: '6px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-ibm-plex-mono)',
              fontSize: '0.6rem',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            New Avatar
          </button>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '55% 45%',
          gap: 24,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          paddingTop: 16,
        }}>

          {/* ── LEFT COLUMN ── */}
          <div
            id="ads-left-col"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Chat messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              padding: 16,
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
            }}>
              {history.length === 0 && !loading && (
                <div style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  textAlign: 'center',
                  paddingTop: 80,
                  lineHeight: 1.8,
                }}>
                  Tell Jarvis who you are targeting and what you are selling.
                </div>
              )}
              {history.map((item, idx) => renderItem(item, idx, history))}
              {loading && (
                <div style={{
                  color: '#2990fa',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  padding: '6px 0',
                }}>
                  Generating...
                </div>
              )}
            </div>

            {/* Input — never moves */}
            <div style={{
              flexShrink: 0,
              padding: 12,
              borderTop: '1px solid #2990fa',
              background: '#060d1f',
              display: 'flex',
              gap: 8,
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  currentStep === 'done'
                    ? 'Start a new ad...'
                    : isIdeaOrDone
                    ? 'Who are you targeting? What are you selling?'
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
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              height: '100%',
              gap: 8,
              paddingRight: 4,
            }}
          >
            {/* AVATAR panel — collapsed when empty */}
            <div style={{
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
              padding: adPanel.avatar ? '10px 14px' : '8px 14px',
              opacity: adPanel.avatar ? 1 : 0.35,
            }}>
              <div style={{ ...panelLabel, marginBottom: adPanel.avatar ? 8 : 0 }}>AVATAR</div>
              {adPanel.avatar && (
                <textarea
                  value={adPanel.avatar}
                  onChange={e => setAdPanel(p => ({ ...p, avatar: e.target.value }))}
                  style={{ ...panelTextarea, height: 54 }}
                />
              )}
            </div>

            {/* VISUAL FORMAT panel — collapsed when empty */}
            <div style={{
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
              padding: adPanel.visualFormat ? '10px 14px' : '8px 14px',
              opacity: adPanel.visualFormat ? 1 : 0.35,
            }}>
              <div style={{ ...panelLabel, marginBottom: adPanel.visualFormat ? 8 : 0 }}>VISUAL FORMAT</div>
              {adPanel.visualFormat && (
                <textarea
                  value={adPanel.visualFormat}
                  onChange={e => setAdPanel(p => ({ ...p, visualFormat: e.target.value }))}
                  style={{ ...panelTextarea, height: 40 }}
                />
              )}
            </div>

            {/* HOOK — collapsed when empty */}
            <div style={{
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
              padding: adPanel.hook ? '10px 14px' : '8px 14px',
              opacity: adPanel.hook ? 1 : 0.35,
            }}>
              <div style={{ ...panelLabel, marginBottom: adPanel.hook ? 8 : 0 }}>HOOK</div>
              {adPanel.hook && (
                <textarea
                  value={adPanel.hook}
                  onChange={e => setAdPanel(p => ({ ...p, hook: e.target.value }))}
                  style={{ ...panelTextarea, height: 54 }}
                />
              )}
            </div>

            {/* IMAGE — collapsed when empty */}
            <div style={{
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
              padding: adPanel.imageConcept ? '10px 14px' : '8px 14px',
              opacity: adPanel.imageConcept ? 1 : 0.35,
            }}>
              <div style={{ ...panelLabel, marginBottom: adPanel.imageConcept ? 8 : 0 }}>IMAGE</div>
              {adPanel.imageConcept && (
                <>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: 10, fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}>
                    {adPanel.imageConcept}
                  </div>
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
                </>
              )}
            </div>

            {/* HEADLINE — collapsed when empty */}
            <div style={{
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
              padding: adPanel.headline ? '10px 14px' : '8px 14px',
              opacity: adPanel.headline ? 1 : 0.35,
            }}>
              <div style={{ ...panelLabel, marginBottom: adPanel.headline ? 8 : 0 }}>HEADLINE</div>
              {adPanel.headline && (
                <textarea
                  value={adPanel.headline}
                  onChange={e => setAdPanel(p => ({ ...p, headline: e.target.value }))}
                  style={{ ...panelTextarea, height: 54 }}
                />
              )}
            </div>

            {/* PRIMARY TEXT — collapsed when empty */}
            <div style={{
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
              padding: adPanel.primaryText ? '10px 14px' : '8px 14px',
              opacity: adPanel.primaryText ? 1 : 0.35,
            }}>
              <div style={{ ...panelLabel, marginBottom: adPanel.primaryText ? 8 : 0 }}>PRIMARY TEXT</div>
              {adPanel.primaryText && (
                <textarea
                  value={adPanel.primaryText}
                  onChange={e => setAdPanel(p => ({ ...p, primaryText: e.target.value }))}
                  style={{ ...panelTextarea, height: 80 }}
                />
              )}
            </div>

            {/* DESCRIPTION + CTA — collapsed when empty */}
            <div style={{
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 8,
              padding: (adPanel.description || adPanel.cta) ? '10px 14px' : '8px 14px',
              opacity: (adPanel.description || adPanel.cta) ? 1 : 0.35,
            }}>
              <div style={{ ...panelLabel, marginBottom: adPanel.description ? 8 : 0 }}>DESCRIPTION</div>
              {adPanel.description && (
                <textarea
                  value={adPanel.description}
                  onChange={e => setAdPanel(p => ({ ...p, description: e.target.value }))}
                  style={{ ...panelTextarea, height: 54, marginBottom: 12 }}
                />
              )}
              {adPanel.description && (
                <>
                  <div style={{ ...panelLabel, marginBottom: adPanel.cta ? 8 : 0 }}>CTA</div>
                  {adPanel.cta && (
                    <textarea
                      value={adPanel.cta}
                      onChange={e => setAdPanel(p => ({ ...p, cta: e.target.value }))}
                      style={{ ...panelTextarea, height: 40 }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Export + Save */}
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
      </div>

      {/* ── AVATAR MODAL ── */}
      {avatarModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,8,16,0.92)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) { setAvatarModal(null); setAvatarForm({ ...EMPTY_AVATAR_FORM }) } }}
        >
          <div style={{
            background: '#0a1628',
            border: '1px solid #2990fa',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{
              fontFamily: 'var(--font-bebas-neue)',
              fontSize: '1.4rem',
              color: '#ffffff',
              marginBottom: 20,
            }}>
              {avatarModal.mode === 'edit' ? 'Edit Avatar' : 'Create Avatar'}
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
                <div style={{
                  fontSize: '0.48rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  color: '#2990fa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}>
                  {field.label}{field.required ? ' *' : ''}
                </div>
                {field.type === 'textarea' ? (
                  <textarea
                    value={avatarForm[field.key]}
                    onChange={e => setAvatarForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#060d1f',
                      border: '1px solid #2990fa',
                      borderRadius: 4,
                      color: '#ffffff',
                      padding: 8,
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.82rem',
                      resize: 'none',
                      height: 70,
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <input
                    value={avatarForm[field.key]}
                    placeholder={field.placeholder || ''}
                    onChange={e => setAvatarForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#060d1f',
                      border: '1px solid #2990fa',
                      borderRadius: 4,
                      color: '#ffffff',
                      padding: 8,
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button
                onClick={handleSaveAvatar}
                disabled={!avatarForm.name.trim()}
                style={{
                  background: '#2990fa',
                  border: 'none',
                  borderRadius: 6,
                  padding: 10,
                  color: '#ffffff',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  fontSize: '0.78rem',
                  width: '100%',
                  opacity: avatarForm.name.trim() ? 1 : 0.5,
                  cursor: avatarForm.name.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save
              </button>
              <button
                onClick={() => { setAvatarModal(null); setAvatarForm({ ...EMPTY_AVATAR_FORM }) }}
                style={{
                  background: 'transparent',
                  border: '1px solid #2990fa',
                  borderRadius: 6,
                  padding: 10,
                  color: '#ffffff',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  fontSize: '0.78rem',
                  width: '100%',
                  cursor: 'pointer',
                }}
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,8,16,0.92)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setAvatarBuilder(null) }}
        >
          <div style={{
            background: '#0a1628',
            border: '1px solid #2990fa',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 460,
          }}>
            {/* Title */}
            <div style={{
              fontFamily: 'var(--font-bebas-neue)',
              fontSize: '1.4rem',
              color: '#ffffff',
              marginBottom: 4,
            }}>
              Build Your Avatar
            </div>
            {/* Subtitle */}
            <div style={{
              fontFamily: 'var(--font-ibm-plex-mono)',
              fontSize: '0.48rem',
              color: '#2990fa',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Jarvis will ask you a few questions
            </div>

            {/* Chat area */}
            <div style={{
              minHeight: 280,
              maxHeight: 320,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 12,
              background: '#060d1f',
              borderRadius: 8,
              marginBottom: 12,
            }}>
              {avatarBuilder.messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    background: msg.role === 'user' ? '#1a2d48' : '#0a1628',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(41,144,250,0.4)' : '#2990fa'}`,
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    color: '#ffffff',
                    maxWidth: '85%',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-inter)',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {avatarBuilder.loading && (
                <div style={{
                  color: '#2990fa',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}>
                  Building avatar...
                </div>
              )}
            </div>

            {/* Name input — shown when avatar is extracted */}
            {avatarBuilder.extracted && (
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: '0.48rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  color: '#2990fa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}>
                  Avatar Name
                </div>
                <input
                  value={avatarBuilder.editName}
                  onChange={e => setAvatarBuilder(b => ({ ...b, editName: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#060d1f',
                    border: '1px solid #2990fa',
                    borderRadius: 4,
                    color: '#ffffff',
                    padding: 8,
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Input row — hidden when avatar is extracted */}
            {!avatarBuilder.extracted && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <textarea
                  value={avatarBuilder.input}
                  onChange={e => setAvatarBuilder(b => ({ ...b, input: e.target.value }))}
                  disabled={avatarBuilder.loading}
                  placeholder="Type your answer..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && !avatarBuilder.loading) {
                      e.preventDefault()
                      handleAvatarBuilderSend()
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
                    opacity: avatarBuilder.loading ? 0.4 : 1,
                  }}
                />
                <button
                  onClick={handleAvatarBuilderSend}
                  disabled={avatarBuilder.loading || !avatarBuilder.input.trim()}
                  style={{
                    background: '#2990fa',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 18px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    opacity: (avatarBuilder.loading || !avatarBuilder.input.trim()) ? 0.4 : 1,
                    cursor: (avatarBuilder.loading || !avatarBuilder.input.trim()) ? 'not-allowed' : 'pointer',
                  }}
                >
                  →
                </button>
              </div>
            )}

            {/* Save Avatar + Cancel buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {avatarBuilder.extracted && (
                <button
                  onClick={handleSaveBuiltAvatar}
                  disabled={!avatarBuilder.editName.trim()}
                  style={{
                    background: '#2990fa',
                    border: 'none',
                    borderRadius: 6,
                    padding: 10,
                    color: '#ffffff',
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    fontSize: '0.78rem',
                    width: '100%',
                    opacity: avatarBuilder.editName.trim() ? 1 : 0.5,
                    cursor: avatarBuilder.editName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save Avatar
                </button>
              )}
              <button
                onClick={() => setAvatarBuilder(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2990fa',
                  borderRadius: 6,
                  padding: 10,
                  color: '#ffffff',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  fontSize: '0.78rem',
                  width: '100%',
                  cursor: 'pointer',
                }}
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
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#0d4a1e',
          border: '1px solid #165c2a',
          borderRadius: 8,
          padding: '10px 16px',
          color: '#00e5c8',
          fontFamily: 'var(--font-ibm-plex-mono)',
          fontSize: '0.75rem',
          zIndex: 2000,
        }}>
          Saved to Library
        </div>
      )}
    </>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────

const stepLabelStyle = {
  fontSize: '0.6rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
  color: '#2990fa',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const refineActionStyle = {
  border: '1px solid #2990fa',
  background: '#060d1f',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
}

const confirmActionStyle = {
  border: '1px solid #2990fa',
  background: '#2990fa',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
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

const panelLabel = {
  fontSize: '0.6rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
  color: '#2990fa',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
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
