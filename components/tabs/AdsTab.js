'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Section constants ────────────────────────────────────────────────────────

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

const SECTION_OPENING_MESSAGES = {
  visual_format: 'Based on your avatar I put together 3 visual directions. Pick what fits.',
  hook: 'Here are 3 hook angles built from your avatar and visual format. Pick what resonates.',
  image: '3 image concepts based on everything confirmed so far. Pick one or refine.',
  headline: '3 headlines written for your avatar. Short, clear, direct.',
  primary_text: '3 primary text options. First line carries the whole message.',
  description: '3 short descriptions. Tight and punchy.',
  cta: '3 calls to action matched to your offer.',
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

const SECTION_SUBCATEGORIES = {
  visual_format: {
    'Newspaper': ['Tabloid style','Broadsheet style','Trade publication','Local news front page','Financial paper'],
    'Raw Photo': ['iPhone candid','Behind the scenes','On the job site','Real customer moment','Unposed portrait'],
    'News Chyron': ['Breaking news banner','Live update ticker','News alert style','Broadcast lower third'],
    'Screenshot': ['Text conversation','Google review','Social media post','Email screenshot','DM screenshot'],
    'Documentary': ['Talking head interview','B-roll footage style','Street documentary','Fly on the wall'],
    'Text Only': ['Bold single statement','Manifesto style','List format','Question and answer'],
    'Report Cover': ['Industry report','Case study cover','White paper style','Research findings'],
  },
  hook: {
    'Pain': ['Financial pain','Time pain','Stress pain','Fear of loss','Embarrassment'],
    'Curiosity': ['Open loop','Surprising fact','Counterintuitive','Hidden secret','What most people miss'],
    'Contrarian': ['Challenge common belief','Call out the industry','Myth bust','Unpopular opinion'],
    'Benefit': ['Specific outcome','Speed benefit','Ease benefit','Status benefit','Money benefit'],
    'Social Proof': ['Number of people','Results achieved','Before and after','Peer reference','Authority proof'],
    'Fear': ['Fear of missing out','Fear of falling behind','Fear of wasting money','Fear of competition'],
    'Authority': ['Years of experience','Money spent','Clients served','Credentials','Track record'],
    'Story': ['Personal moment','Customer story','Before and after journey','Turning point','Day in the life'],
  },
  image: {
    'Cinematic': ['Dark moody tones','Epic wide shot','High contrast dramatic','Golden hour','Night scene'],
    'Editorial': ['Clean white background','Minimal props','Sharp focus','Magazine style','Flat lay'],
    'Raw/Real': ['Unedited feel','Natural lighting','Candid moment','Gritty realistic','No filter look'],
    'Bold Text': ['Large headline overlay','Minimal background','High contrast text','Single statement','Color block'],
    'Lifestyle': ['In use moment','Aspirational setting','Real environment','Family or team','Success scene'],
    'Before/After': ['Split screen','Transformation reveal','Side by side','Progress shot','Contrast moment'],
  },
  headline: {
    'Direct': ['Straight benefit','Clear offer','No fluff statement','Specific result','Action focused'],
    'Question': ['Problem question','Curiosity question','Qualifying question','Challenge question','Rhetorical'],
    'Bold Claim': ['Strong statement','Surprising claim','Record or achievement','Best or only','Guarantee'],
    'Call Out': ['Name the person','Name the situation','Name the feeling','Name the industry','Name the problem'],
    'Curiosity': ['Open loop','Missing piece','Secret or hidden','What they dont know','Surprising angle'],
    'Number Based': ['List format','Percentage','Time frame','Dollar amount','Quantity'],
  },
  primary_text: {
    'Story': ['Personal origin','Customer transformation','Day in the life','Before the solution','Turning point moment'],
    'Problem/Solution': ['Agitate the pain','Name the enemy','Present the fix','Simple steps','Clear path forward'],
    'Value Stack': ['List everything included','Show the value','Compare to alternatives','What they get','Overdeliver frame'],
    'Testimonial': ['Direct quote','Results focused','Specific numbers','Emotional moment','Before and after quote'],
    'Direct Offer': ['Clear price or terms','Specific guarantee','Limited availability','Exact next step','No fluff offer'],
    'Educational': ['Teach something valuable','Insider knowledge','Common mistake','Better way','Eye opening fact'],
  },
  description: {
    'Urgency': ['Limited time','Deadline','Spots filling','Act now','Last chance'],
    'Social Proof': ['Number of people','Reviews','Results','Trusted by','Join others'],
    'Benefit': ['Main outcome','Key result','What changes','Primary win','Core promise'],
    'Simple CTA': ['Click to learn','Book now','Get started','See how','Find out'],
  },
  cta: {
    'Book a Call': ['Free strategy call','15 minute intro','No obligation chat','Quick discovery call','Schedule now'],
    'Fill Form': ['Get a free quote','Apply now','Request info','Get started','Claim your spot'],
    'DM Us': ['Send a message','Reach out directly','Message us now','Start a conversation','Ask us anything'],
    'Call Now': ['Call us today','Speak to someone now','Get answers now','Direct line','Talk to a real person'],
    'Click Link': ['Learn more','See the full story','Get the details','Read more','Visit the page'],
    'Comment Below': ['Drop a comment','Tell us below','Comment yes','Share your answer','Let us know'],
  },
  avatar: {},
}

const AUTO_PROMPT_TEXTS = new Set(Object.values(SECTION_PROMPTS))

// ─── Avatar funnel constants ──────────────────────────────────────────────────

const INDUSTRY_BUBBLES = [
  'Home Services', 'Health & Wellness', 'Real Estate', 'Finance', 'Coaching & Consulting',
  'E-Commerce', 'Restaurants & Food', 'Fitness', 'Beauty & Aesthetics', 'Legal',
  'Construction & Trades', 'Automotive', 'Education', 'Technology', 'Retail',
  'Marketing & Advertising', 'Insurance', 'Dental & Medical', 'Accounting',
]

const TRADE_INDUSTRIES = new Set([
  'HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Landscaping', 'Cleaning', 'Pest Control',
  'Pool Service', 'Construction & Trades', 'General Contractor', 'Plumber', 'Electrician',
  'Roofer', 'Painter', 'Flooring', 'Home Services',
])

const ROLE_BUBBLES_DEFAULT = ['Business Owner', 'Independent Contractor', 'Manager', 'Employee', 'Freelancer', 'Investor', 'Executive']
const ROLE_BUBBLES_TRADES = ['Owner-Operator', 'Business Owner with team', 'Solo tech', 'Office manager']

const BUSINESS_SIZE_BUBBLES = ['Just themselves', '2 to 5 people', '6 to 20 people', '20 to 50 people', '50 plus people', "Doesn't matter"]
const AGE_RANGE_BUBBLES = ['18 to 25', '25 to 35', '35 to 45', '45 to 55', '55 plus', 'Mix of ages', 'Not sure']
const MEDIA_TRUST_BUBBLES = ['Local news', 'Facebook groups', 'YouTube', 'Industry trade publications', 'Word of mouth from peers', 'Google search', 'Podcasts']

const AVATAR_FUNNEL_STEPS = ['industry', 'role', 'businessSize', 'ageRange', 'wants', 'fears', 'frustrations', 'statusDriver', 'mediaTrust', 'review']

const AVATAR_STEP_MESSAGES = {
  industry: 'What industry are you targeting? Pick one or more.',
  role: 'What best describes them?',
  businessSize: 'How big is their operation?',
  ageRange: 'How old are they roughly?',
  wants: 'What does this person want more than anything in their business?',
  fears: 'What keeps them up at night?',
  frustrations: 'What do they complain about most?',
  statusDriver: 'What would make them feel like they\'ve won? Who would notice?',
  mediaTrust: 'What do they read, watch, or trust?',
  review: 'Here is your avatar. Review it and save when ready.',
}

const DYNAMIC_AVATAR_STEPS = new Set(['wants', 'fears', 'frustrations', 'statusDriver'])

const FIELD_LABELS = {
  industry: 'INDUSTRY', role: 'ROLE', businessSize: 'BUSINESS SIZE',
  ageRange: 'AGE RANGE', wants: 'WANTS', fears: 'FEARS',
  frustrations: 'FRUSTRATIONS', statusDriver: 'WHAT WINNING LOOKS LIKE',
  mediaTrust: 'MEDIA TRUST',
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const EMPTY_SECTION_OBJ = () => ({
  avatar: [], visual_format: [], hook: [], image: [],
  headline: [], primary_text: [], description: [], cta: [],
})

const EMPTY_VALUES_OBJ = () => ({
  avatar: null, visual_format: null, hook: null, image: null,
  headline: null, primary_text: null, description: null, cta: null,
})

const EMPTY_AVATAR_DATA = () => ({
  industry: null, role: null, businessSize: null, ageRange: null,
  location: null, wants: null, fears: null, frustrations: null,
  statusDriver: null, mediaTrust: null, deepFear: null, winLooksLike: null,
})

const EMPTY_AVATAR_FORM = {
  name: '', age_range: '', niche: '',
  what_they_want: '', what_they_fear: '',
  what_they_trust: '', primary_emotion: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdsTab({ pendingRefine, onRefineConsumed }) {
  // Section state
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
  const [expandedCategories, setExpandedCategories] = useState([])
  const [selectedSubcategories, setSelectedSubcategories] = useState([])

  const chatScrollRef = useRef(null)

  // Avatar funnel state
  const [avatarFunnelStep, setAvatarFunnelStep] = useState('industry')
  const [avatarData, setAvatarData] = useState(EMPTY_AVATAR_DATA())
  const [avatarNameInput, setAvatarNameInput] = useState('')

  // Avatar bar state
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [avatarModal, setAvatarModal] = useState(null)
  const [avatarForm, setAvatarForm] = useState({ ...EMPTY_AVATAR_FORM })
  const [saveSuccess, setSaveSuccess] = useState(false)

  // NEW: Multi-select + back + edit + dropdown + delete
  const [avatarSelectedBubbles, setAvatarSelectedBubbles] = useState([])
  const [avatarFunnelHistory, setAvatarFunnelHistory] = useState([])
  const [avatarEditMode, setAvatarEditMode] = useState(false)
  const [avatarEditingField, setAvatarEditingField] = useState(null)
  const [avatarEditingId, setAvatarEditingId] = useState(null)
  const [avatarDropdown, setAvatarDropdown] = useState(null)

  const avatarDropdownRef = useRef(null)

  // ─── useEffects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadAvatars()
    initAvatarFunnel()
  }, [])

  useEffect(() => {
    if (pendingRefine) {
      loadForRefine(pendingRefine)
      onRefineConsumed?.()
    }
  }, [pendingRefine])

  useEffect(() => {
    setSelectedAngles([])
    setSelectedBubbles([])
    setSelectedSubcategories([])
    setExpandedCategories([])
  }, [activeSection])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [sectionChats, activeSection])

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (avatarDropdown === null) return
    function handleClickOutside(e) {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(e.target)) {
        setAvatarDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [avatarDropdown])

  // ─── Data ─────────────────────────────────────────────────────────────────────

  async function loadAvatars() {
    try {
      const res = await fetch('/api/avatars')
      const data = await res.json()
      setAvatars(data.avatars || [])
    } catch (err) {
      console.error('Load avatars error:', err)
    }
  }

  // ─── API ──────────────────────────────────────────────────────────────────────

  async function callAPI(section, messages, svs, av, angles = [], system = null) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        ...(system ? { system } : {}),
        avatar: av || null,
        sectionContext: svs,
        currentSection: section,
        activeAngles: angles,
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

  function isQuestion(text) {
    if (!text) return false
    const t = text.trim()
    if (t.endsWith('?')) return true
    const lower = t.toLowerCase()
    const starters = ['what ', 'why ', 'how ', 'explain ', 'when ', 'where ', 'who ', 'which ', 'does ', 'can ', 'is ', 'are ', 'will ', 'should ', 'could ', 'would ', 'tell me', 'can you']
    return starters.some(w => lower.startsWith(w))
  }

  function isTrade(industry) {
    if (!industry) return false
    return industry.split(' / ').some(ind => TRADE_INDUSTRIES.has(ind.trim()))
  }

  function suggestAvatarName(data) {
    const parts = [data.industry, data.role].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : ''
  }

  // ─── Avatar funnel ────────────────────────────────────────────────────────────

  function initAvatarFunnel() {
    setAvatarFunnelStep('industry')
    setAvatarData(EMPTY_AVATAR_DATA())
    setAvatarNameInput('')
    setAvatarSelectedBubbles([])
    setAvatarFunnelHistory([])
    setAvatarEditMode(false)
    setAvatarEditingField(null)
    setAvatarEditingId(null)
    setSectionChats(prev => ({
      ...prev,
      avatar: [{ role: 'assistant', content: AVATAR_STEP_MESSAGES.industry }],
    }))
    setCurrentBubbles(INDUSTRY_BUBBLES)
  }

  function startNewAvatarFunnel() {
    setActiveSection('avatar')
    initAvatarFunnel()
  }

  function restoreAvatarFunnel() {
    const step = avatarFunnelStep
    setAvatarSelectedBubbles([])
    if (step === 'review') { setCurrentBubbles([]); return }
    if (DYNAMIC_AVATAR_STEPS.has(step)) {
      generateDynamicAvatarBubbles(step, avatarData)
    } else {
      const staticBubbles = {
        industry: INDUSTRY_BUBBLES,
        role: isTrade(avatarData.industry) ? ROLE_BUBBLES_TRADES : ROLE_BUBBLES_DEFAULT,
        businessSize: BUSINESS_SIZE_BUBBLES,
        ageRange: AGE_RANGE_BUBBLES,
        mediaTrust: MEDIA_TRUST_BUBBLES,
      }
      setCurrentBubbles(staticBubbles[step] || [])
    }
  }

  function gotoAvatarStep(step, data) {
    setAvatarFunnelStep(step)
    setAvatarSelectedBubbles([])
    setSectionChats(prev => ({
      ...prev,
      avatar: [...prev.avatar, { role: 'assistant', content: AVATAR_STEP_MESSAGES[step] }],
    }))
    if (step === 'review') {
      const suggested = suggestAvatarName(data || avatarData)
      setAvatarNameInput(suggested)
      setCurrentBubbles([])
      return
    }
    if (DYNAMIC_AVATAR_STEPS.has(step)) {
      generateDynamicAvatarBubbles(step, data)
    } else {
      const staticBubbles = {
        industry: INDUSTRY_BUBBLES,
        role: isTrade(data?.industry) ? ROLE_BUBBLES_TRADES : ROLE_BUBBLES_DEFAULT,
        businessSize: BUSINESS_SIZE_BUBBLES,
        ageRange: AGE_RANGE_BUBBLES,
        mediaTrust: MEDIA_TRUST_BUBBLES,
      }
      setCurrentBubbles(staticBubbles[step] || [])
    }
  }

  async function generateDynamicAvatarBubbles(step, data) {
    const d = data || avatarData
    const dynamicSystem = `Generate exactly 4 short bubble options for this avatar funnel step.
Context so far: industry=${d.industry || 'unknown'}, role=${d.role || 'unknown'}, businessSize=${d.businessSize || 'unknown'}, ageRange=${d.ageRange || 'unknown'}
Current step: ${step}
Each option must be specific to the industry and role already selected.
Return JSON only: {"step":"avatar_dynamic","options":["opt1","opt2","opt3","opt4"]}`
    setIsLoading(true)
    try {
      const raw = await callAPI(
        'avatar',
        [{ role: 'user', content: `Generate 4 options for step: ${step}` }],
        sectionValues,
        null,
        [],
        dynamicSystem,
      )
      const parsed = parseResponse(raw)
      if (parsed && parsed.options) {
        setCurrentBubbles(parsed.options)
      } else {
        setCurrentBubbles([])
      }
    } catch (err) {
      console.error('Dynamic avatar bubbles error:', err)
      setCurrentBubbles([])
    }
    setIsLoading(false)
  }

  // Multi-select toggle for avatar funnel bubbles
  function handleAvatarBubbleToggle(bubble) {
    const activeStep = avatarEditingField || avatarFunnelStep
    const maxSelect = activeStep === 'mediaTrust' ? 4 : 2
    setAvatarSelectedBubbles(prev => {
      if (prev.includes(bubble)) return prev.filter(b => b !== bubble)
      if (prev.length >= maxSelect) return prev
      return [...prev, bubble]
    })
  }

  // Continue button: advance with combined selected values
  function handleAvatarContinue() {
    if (avatarSelectedBubbles.length === 0) return
    const combined = avatarSelectedBubbles.join(' / ')
    const currentChatLength = sectionChats.avatar.length

    // Push current state to history before advancing
    setAvatarFunnelHistory(prev => [...prev, {
      step: avatarFunnelStep,
      bubbles: [...currentBubbles],
      data: { ...avatarData },
      selectedBubbles: [...avatarSelectedBubbles],
      chatLength: currentChatLength,
    }])

    // Add user message
    setSectionChats(prev => ({
      ...prev,
      avatar: [...prev.avatar, { role: 'user', content: combined }],
    }))

    const fieldMap = {
      industry: 'industry', role: 'role', businessSize: 'businessSize', ageRange: 'ageRange',
      wants: 'wants', fears: 'fears', frustrations: 'frustrations',
      statusDriver: 'statusDriver', mediaTrust: 'mediaTrust',
    }
    const field = fieldMap[avatarFunnelStep]
    const newData = field ? { ...avatarData, [field]: combined } : avatarData
    if (field) setAvatarData(newData)

    setAvatarSelectedBubbles([])

    const nextIdx = AVATAR_FUNNEL_STEPS.indexOf(avatarFunnelStep) + 1
    if (nextIdx < AVATAR_FUNNEL_STEPS.length) {
      gotoAvatarStep(AVATAR_FUNNEL_STEPS[nextIdx], newData)
    }
  }

  // Advance funnel via → button (guards empty selection)
  function handleAvatarAdvance() {
    if (avatarFunnelStep === 'review' || avatarEditMode) return
    if (avatarSelectedBubbles.length === 0) {
      setSectionChats(prev => ({
        ...prev,
        avatar: [...prev.avatar, { role: 'assistant', content: 'Select at least one option to continue.' }],
      }))
      return
    }
    handleAvatarContinue()
  }

  // ADD button: add typed text as bubble and auto-select it
  function handleAvatarAdd() {
    if (!typeOwn.trim()) return
    const text = typeOwn.trim()
    setTypeOwn('')
    setCurrentBubbles(prev => prev.includes(text) ? prev : [...prev, text])
    setAvatarSelectedBubbles(prev => {
      if (prev.includes(text)) return prev
      const activeStep = avatarEditingField || avatarFunnelStep
      const maxSelect = activeStep === 'mediaTrust' ? 4 : 2
      if (prev.length >= maxSelect) return prev
      return [...prev, text]
    })
  }

  // ASK button: send question to API with selected bubbles context
  async function handleAvatarAsk() {
    if (!typeOwn.trim()) return
    const question = typeOwn.trim()
    setTypeOwn('')
    const contextNote = avatarSelectedBubbles.length > 0
      ? ` (Currently selected: ${avatarSelectedBubbles.join(', ')})`
      : ''
    const fullQuestion = question + contextNote
    setSectionChats(prev => ({
      ...prev,
      avatar: [...prev.avatar, { role: 'user', content: question }],
    }))
    const questionSystem = `The user is building their avatar. They are on step: ${avatarFunnelStep}.
They asked: ${question}${contextNote ? ' Context: ' + contextNote : ''}
Answer their question in 1-2 sentences using plain simple language.
Then redirect them back to the current step question.
Do not generate bubble options in this response.`
    setIsLoading(true)
    try {
      const raw = await callAPI('avatar', [{ role: 'user', content: fullQuestion }], sectionValues, null, [], questionSystem)
      setSectionChats(prev => ({
        ...prev,
        avatar: [...prev.avatar, { role: 'assistant', content: raw }],
      }))
    } catch (err) {
      console.error('Avatar ask error:', err)
    }
    setIsLoading(false)
  }

  // Back button: restore previous step
  function goBackAvatarStep() {
    if (avatarFunnelHistory.length === 0) return
    const prevState = avatarFunnelHistory[avatarFunnelHistory.length - 1]
    setAvatarFunnelHistory(h => h.slice(0, -1))
    setAvatarFunnelStep(prevState.step)
    setCurrentBubbles(prevState.bubbles)
    setAvatarData(prevState.data)
    setAvatarSelectedBubbles(prevState.selectedBubbles || [])
    setSectionChats(prev => ({
      ...prev,
      avatar: prev.avatar.slice(0, prevState.chatLength),
    }))
  }

  // Get more options for current funnel step
  async function handleGetMoreAvatarOptions() {
    const step = avatarEditingField || avatarFunnelStep
    const excludeList = currentBubbles.join(', ')
    const system = `You are an expert in consumer psychology and ad targeting.
Generate exactly 4 different options for this avatar funnel step: "${step}".
Avatar context so far: industry="${avatarData.industry || '?'}", role="${avatarData.role || '?'}", businessSize="${avatarData.businessSize || '?'}", ageRange="${avatarData.ageRange || '?'}"
Do NOT repeat these already-shown options: [${excludeList}]
Options must be specific, practical, and different from what is already shown.
Return JSON only: {"step":"avatar_dynamic","options":["opt1","opt2","opt3","opt4"]}`
    setIsLoading(true)
    try {
      const raw = await callAPI('avatar', [{ role: 'user', content: `More options for: ${step}` }], sectionValues, null, [], system)
      const parsed = parseResponse(raw)
      if (parsed && parsed.options) {
        const selected = avatarSelectedBubbles
        setCurrentBubbles([...selected, ...parsed.options.filter(o => !selected.includes(o))])
      }
    } catch (err) {
      console.error('Get more options error:', err)
    }
    setIsLoading(false)
  }

  // ─── Avatar edit mode (re-edit fields after creation) ─────────────────────────

  function startEditingAvatarField(field) {
    setAvatarEditingField(field)
    setAvatarSelectedBubbles([])
    if (DYNAMIC_AVATAR_STEPS.has(field)) {
      generateDynamicAvatarBubbles(field, avatarData)
    } else {
      const staticBubbles = {
        industry: INDUSTRY_BUBBLES,
        role: isTrade(avatarData.industry) ? ROLE_BUBBLES_TRADES : ROLE_BUBBLES_DEFAULT,
        businessSize: BUSINESS_SIZE_BUBBLES,
        ageRange: AGE_RANGE_BUBBLES,
        mediaTrust: MEDIA_TRUST_BUBBLES,
      }
      setCurrentBubbles(staticBubbles[field] || [])
    }
  }

  function confirmEditAvatarField() {
    if (avatarSelectedBubbles.length === 0) return
    const combined = avatarSelectedBubbles.join(' / ')
    setAvatarData(prev => ({ ...prev, [avatarEditingField]: combined }))
    setAvatarEditingField(null)
    setAvatarSelectedBubbles([])
    setCurrentBubbles([])
  }

  // ─── Avatar save ──────────────────────────────────────────────────────────────

  async function handleSaveAvatarFunnel() {
    if (!avatarNameInput.trim()) return
    try {
      const primaryEmotion = [avatarData.fears, avatarData.frustrations].filter(Boolean).join(' / ')
      const body = {
        name: avatarNameInput.trim(),
        age_range: avatarData.ageRange || '',
        niche: [avatarData.industry, avatarData.role].filter(Boolean).join(' - '),
        what_they_want: avatarData.wants || '',
        what_they_fear: [avatarData.fears, avatarData.deepFear || avatarData.fears].filter(Boolean).join(' / '),
        what_they_trust: avatarData.mediaTrust || '',
        primary_emotion: primaryEmotion,
      }

      let res
      if (avatarEditingId) {
        res = await fetch('/api/avatars', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: avatarEditingId, ...body }),
        })
      } else {
        res = await fetch('/api/avatars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      const data = await res.json()
      await loadAvatars()
      if (data.avatar) {
        setSelectedAvatar(data.avatar)
        const newSvs = { ...sectionValues, avatar: data.avatar.name }
        setSectionValues(newSvs)
        setSectionChats(prev => ({
          ...prev,
          avatar: [
            ...prev.avatar,
            { role: 'user', content: `Name: ${data.avatar.name}` },
            { role: 'assistant', content: `Avatar "${data.avatar.name}" saved. Moving to visual format.` },
          ],
        }))
        setAvatarFunnelStep('industry')
        setAvatarData(EMPTY_AVATAR_DATA())
        setAvatarNameInput('')
        setAvatarSelectedBubbles([])
        setAvatarFunnelHistory([])
        setAvatarEditMode(false)
        setAvatarEditingField(null)
        setAvatarEditingId(null)
        setActiveSection('visual_format')
        openSection('visual_format', newSvs, data.avatar, [])
      }
    } catch (err) {
      console.error('Save avatar funnel error:', err)
    }
  }

  // ─── Avatar bar actions ───────────────────────────────────────────────────────

  async function handleAvatarTypeOwn(text) {
    if (!text.trim()) return
    setTypeOwn('')

    if (isQuestion(text)) {
      setSectionChats(prev => ({
        ...prev,
        avatar: [...prev.avatar, { role: 'user', content: text }],
      }))
      const questionSystem = `The user is building their avatar. They are on step: ${avatarFunnelStep}.
They asked: ${text}
Answer their question in 1-2 sentences using plain simple language.
Then redirect them back to the current step question.
Do not generate bubble options in this response.`
      setIsLoading(true)
      try {
        const raw = await callAPI('avatar', [{ role: 'user', content: text }], sectionValues, null, [], questionSystem)
        setSectionChats(prev => ({
          ...prev,
          avatar: [...prev.avatar, { role: 'assistant', content: raw }],
        }))
      } catch (err) {
        console.error('Avatar question error:', err)
      }
      setIsLoading(false)
    } else {
      // Treat typed text as a selection for the current step
      setAvatarSelectedBubbles(prev => {
        if (prev.includes(text)) return prev
        const activeStep = avatarEditingField || avatarFunnelStep
        const maxSelect = activeStep === 'mediaTrust' ? 4 : 2
        if (prev.length >= maxSelect) return prev
        return [...prev, text]
      })
      // Add to bubbles so it's visible
      setCurrentBubbles(prev => prev.includes(text) ? prev : [...prev, text])
    }
  }

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
      setAvatarFunnelStep('industry')
      setAvatarData(EMPTY_AVATAR_DATA())
      setAvatarNameInput('')
      setAvatarSelectedBubbles([])
      setAvatarFunnelHistory([])
      setAvatarEditMode(false)
      setAvatarEditingField(null)
      setAvatarEditingId(null)
      setActiveSection('visual_format')
      openSection('visual_format', newSvs, newSelected, [])
    } else {
      setSectionValues(prev => ({ ...prev, avatar: null }))
      setSectionChats(prev => ({ ...prev, avatar: [] }))
    }
  }

  function handleEditAvatarFromBar(av) {
    setAvatarDropdown(null)
    // Parse stored avatar back into avatarData fields
    const nicheParts = (av.niche || '').split(' - ')
    setAvatarData({
      industry: nicheParts[0] || null,
      role: nicheParts[1] || null,
      businessSize: null,
      ageRange: av.age_range || null,
      location: null,
      wants: av.what_they_want || null,
      fears: av.what_they_fear || null,
      frustrations: null,
      statusDriver: null,
      mediaTrust: av.what_they_trust || null,
      deepFear: null,
      winLooksLike: null,
    })
    setAvatarNameInput(av.name || '')
    setAvatarEditingId(av.id)
    setAvatarFunnelStep('review')
    setAvatarEditMode(true)
    setAvatarEditingField(null)
    setAvatarSelectedBubbles([])
    setAvatarFunnelHistory([])
    setCurrentBubbles([])
    setActiveSection('avatar')
    setSectionChats(prev => ({
      ...prev,
      avatar: [{ role: 'assistant', content: `Editing avatar: ${av.name}` }],
    }))
  }

  async function handleDeleteAvatar(av) {
    try {
      await fetch('/api/avatars', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: av.id }),
      })
      setAvatarDropdown(null)
      await loadAvatars()
      if (selectedAvatar?.id === av.id) {
        setSelectedAvatar(null)
        setSectionValues(prev => ({ ...prev, avatar: null }))
        setActiveSection('avatar')
        initAvatarFunnel()
      }
    } catch (err) {
      console.error('Delete avatar error:', err)
    }
  }

  async function handleAskJarvisNonAvatar(text) {
    if (!text.trim()) return
    const questionText = text.trim()
    setTypeOwn('')
    const questionSystem = `User is asking a question while on section: ${activeSection}. Their question: ${questionText}. Answer in 1-2 simple sentences. Explain it like they have never done marketing before. Then in one sentence redirect them back to what they were doing. Do not generate bubble options in this response. Return plain text only not JSON.`
    const userMsg = { role: 'user', content: questionText }
    setSectionChats(prev => ({ ...prev, [activeSection]: [...prev[activeSection], userMsg] }))
    setIsLoading(true)
    try {
      const raw = await callAPI(activeSection, [userMsg], sectionValues, selectedAvatar, selectedAngles, questionSystem)
      setSectionChats(prev => ({
        ...prev,
        [activeSection]: [...prev[activeSection], { role: 'assistant', content: raw }],
      }))
    } catch (err) {
      console.error('Ask Jarvis error:', err)
    }
    setIsLoading(false)
  }

  // ─── Avatar bar modal edit ────────────────────────────────────────────────────

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
    setAvatarDropdown(null)
  }

  // ─── Section management ───────────────────────────────────────────────────────

  async function openSection(section, svs, av, angles = []) {
    if (section === 'avatar') return
    const prompt = SECTION_PROMPTS[section]
    if (!prompt) return
    const openingMsg = SECTION_OPENING_MESSAGES[section]

    setIsLoading(true)
    try {
      const raw = await callAPI(section, [{ role: 'user', content: prompt }], svs, av, angles)
      const parsed = parseResponse(raw)
      setSectionChats(prev => ({
        ...prev,
        [section]: [
          ...(openingMsg ? [{ role: 'assistant', content: openingMsg }] : []),
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
    if (section === activeSection) {
      setActiveSection(null)
      setCurrentBubbles([])
      setSelectedBubbles([])
      return
    }
    setActiveSection(section)
    setSelectedBubbles([])

    if (section === 'avatar') {
      if (sectionValues.avatar !== null) {
        setCurrentBubbles([])
        return
      }
      if (sectionChats.avatar.length === 0) {
        initAvatarFunnel()
      } else {
        restoreAvatarFunnel()
      }
      return
    }

    const val = sectionValues[section]
    const chat = sectionChats[section]

    if (val !== null) {
      setCurrentBubbles([])
      return
    }

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

    openSection(section, sectionValues, selectedAvatar, [])
  }

  async function handleRefine() {
    if (isLoading || !activeSection) return

    const activeAngles = [
      ...selectedAngles.filter(a => !selectedSubcategories.some(s =>
        SECTION_SUBCATEGORIES[activeSection]?.[a]?.includes(s)
      )),
      ...selectedSubcategories,
    ]

    let refineText
    if (selectedBubbles.length > 0 && activeAngles.length > 0) {
      refineText = `Refine based on these selected options: [${selectedBubbles.join(', ')}] and these angle filters: [${activeAngles.join(', ')}]. Generate 3 new options. Keep the direction of the selected options but make them stronger and more specific using the angle filters.`
    } else if (selectedBubbles.length === 2) {
      refineText = `The user selected these two options: "${selectedBubbles[0]}" and "${selectedBubbles[1]}". Generate exactly 3 refined options:\n1. Refined version of option 1\n2. Refined version of option 2\n3. A blend of both options combined`
    } else if (selectedBubbles.length === 1) {
      refineText = `Refine. I like the direction of: "${selectedBubbles[0]}". Give me 3 tighter variations.`
    } else if (activeAngles.length > 0) {
      refineText = `Generate 3 new options using these angle filters: [${activeAngles.join(', ')}]. Stay within these directions.`
    } else {
      refineText = 'Generate 3 fresh options. Use all confirmed context.'
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
        activeAngles,
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
    setSelectedAngles([])

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

  function handleAngleToggle(angle) {
    const isExpanded = expandedCategories.includes(angle)
    if (isExpanded) {
      setExpandedCategories(prev => prev.filter(c => c !== angle))
      setSelectedAngles(prev => prev.filter(a => a !== angle))
      const subs = SECTION_SUBCATEGORIES[activeSection]?.[angle] || []
      setSelectedSubcategories(prev => prev.filter(s => !subs.includes(s)))
    } else {
      const total = selectedAngles.length + selectedSubcategories.length
      if (total >= 3) return
      setExpandedCategories(prev => [...prev, angle])
      setSelectedAngles(prev => [...prev, angle])
    }
  }

  function handleSubcategoryToggle(parentAngle, sub) {
    const isSelected = selectedSubcategories.includes(sub)
    if (isSelected) {
      setSelectedSubcategories(prev => prev.filter(s => s !== sub))
      if (!selectedAngles.includes(parentAngle)) {
        setSelectedAngles(prev => [...prev, parentAngle])
      }
    } else {
      const parentIsActive = selectedAngles.includes(parentAngle)
      const netAdd = parentIsActive ? 0 : 1
      const total = selectedAngles.length + selectedSubcategories.length
      if (total + netAdd > 3) return
      setSelectedAngles(prev => prev.filter(a => a !== parentAngle))
      setSelectedSubcategories(prev => [...prev, sub])
    }
  }

  // ─── Bubble management (non-avatar sections) ──────────────────────────────────

  async function handleAddTypeOwn() {
    if (!typeOwn.trim()) return
    if (activeSection === 'avatar') {
      handleAvatarTypeOwn(typeOwn.trim())
      return
    }
    const val = typeOwn.trim()
    setTypeOwn('')
    const sectionLabel = activeSection.replace(/_/g, ' ')
    const validationSystem = `You are a professional marketing strategist.
A user just typed this as their ${sectionLabel} input. Analyze it. Does it make sense as ${sectionLabel} copy? Is it clear, specific, and strong enough to use in a Facebook ad?

If YES: return JSON exactly: {"valid": true, "text": "<the submitted text verbatim>"}
If NO or UNCLEAR: return JSON exactly: {"valid": false, "question": "<one direct clarifying question>"}

Examples of invalid submissions:
Single words with no context (now, yes, good).
Vague phrases that communicate nothing specific.
Random text that is not ad copy.

If invalid ask ONE clarifying question to understand what they mean.
Be direct. Sound like a strategist not a chatbot.
You have opinions. Use them.`

    setIsLoading(true)
    try {
      const raw = await callAPI(
        activeSection,
        [{ role: 'user', content: val }],
        sectionValues,
        selectedAvatar,
        selectedAngles,
        validationSystem,
      )
      let result = null
      try {
        const cleaned = raw.replace(/```json|```/g, '').trim()
        result = JSON.parse(cleaned)
      } catch (_) {
        try {
          const m = raw.match(/\{[\s\S]*\}/)
          if (m) result = JSON.parse(m[0])
        } catch (__) {}
      }
      if (result && result.valid === true) {
        const finalText = result.text || val
        setCurrentBubbles(prev => [...prev, finalText])
        setSelectedBubbles([finalText])
      } else if (result && result.valid === false && result.question) {
        setSectionChats(prev => ({
          ...prev,
          [activeSection]: [
            ...prev[activeSection],
            { role: 'user', content: val },
            { role: 'assistant', content: result.question },
          ],
        }))
      } else {
        setCurrentBubbles(prev => [...prev, val])
        setSelectedBubbles([val])
      }
    } catch (err) {
      console.error('Validation error:', err)
      setCurrentBubbles(prev => [...prev, val])
      setSelectedBubbles([val])
    }
    setIsLoading(false)
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
      if (prev.includes(bubble)) return prev.filter(b => b !== bubble)
      if (prev.length < 2) return [...prev, bubble]
      return [prev[1], bubble]
    })
  }

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const allConfirmed = SECTIONS.every(s => sectionValues[s] !== null)
  const activeSectionIdx = SECTIONS.indexOf(activeSection)
  const sectionAngles = SECTION_ANGLES[activeSection] || []
  const canSubmit = selectedBubbles.length === 1 && !isLoading
  const avatarStepIdx = AVATAR_FUNNEL_STEPS.indexOf(avatarFunnelStep)
  const activeStepForMax = avatarEditingField || avatarFunnelStep
  const avatarMaxSelect = activeStepForMax === 'mediaTrust' ? 4 : 2

  // Shared bubble button styles for avatar funnel
  function avatarBubbleStyle(bubble) {
    const selected = avatarSelectedBubbles.includes(bubble)
    return {
      border: `1px solid ${selected ? '#2990fa' : '#152840'}`,
      background: selected ? '#0a1f3f' : '#060d1f',
      color: selected ? '#ffffff' : 'rgba(255,255,255,0.75)',
      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
      fontSize: '0.88rem', fontFamily: 'var(--font-inter)',
      lineHeight: 1.4, textAlign: 'left', width: '100%', boxSizing: 'border-box',
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', overflow: 'hidden' }}>

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
              <div key={av.id} style={{ position: 'relative', flexShrink: 0 }} ref={avatarDropdown === av.id ? avatarDropdownRef : null}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    onClick={() => handleAvatarSelect(av)}
                    style={{
                      background: selectedAvatar?.id === av.id ? '#2990fa' : '#060d1f',
                      border: '1px solid #2990fa', borderRadius: 6,
                      padding: '6px 14px', cursor: 'pointer', color: '#ffffff',
                      fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem',
                      whiteSpace: 'nowrap', userSelect: 'none',
                    }}
                  >
                    {av.name}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setAvatarDropdown(prev => prev === av.id ? null : av.id) }}
                    style={{
                      background: 'transparent', border: 'none',
                      color: '#2990fa', fontSize: '1rem',
                      cursor: 'pointer', padding: '2px 6px',
                    }}
                  >
                    ⋯
                  </button>
                </div>
                {avatarDropdown === av.id && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4,
                    background: '#0a1628', border: '1px solid #2990fa', borderRadius: 8,
                    padding: 4, minWidth: 120, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  }}>
                    <div
                      onClick={() => handleEditAvatarFromBar(av)}
                      style={{ padding: '8px 14px', color: '#ffffff', fontSize: '0.82rem', fontFamily: 'var(--font-inter)', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#152840'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      ✎ Edit
                    </div>
                    <div
                      onClick={() => { setAvatarDropdown(null); if (window.confirm(`Delete ${av.name}? This cannot be undone.`)) handleDeleteAvatar(av) }}
                      style={{ padding: '8px 14px', color: '#ff4455', fontSize: '0.82rem', fontFamily: 'var(--font-inter)', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a0a0d'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      🗑 Delete
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={startNewAvatarFunnel}
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
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
          flex: 1, minHeight: 0, overflow: 'hidden', padding: '20px 24px',
          alignItems: 'start',
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* 1. Section title row — always visible */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 12px 0', flexShrink: 0 }}>
              {activeSection !== null && (
                (activeSection === 'avatar' && avatarFunnelHistory.length > 0)
                  ? <button onClick={goBackAvatarStep} style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem' }}>←</button>
                  : activeSectionIdx > 0
                    ? <button onClick={() => gotoSection(SECTIONS[activeSectionIdx - 1])} style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem' }}>←</button>
                    : null
              )}
              <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.2rem', color: activeSection ? '#2990fa' : 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
                {activeSection ? SECTION_LABELS[activeSection] : 'SELECT SECTION'}
              </div>
              {activeSection !== null && (
                (activeSection === 'avatar' && avatarFunnelStep !== 'review' && !avatarEditMode)
                  ? <button onClick={handleAvatarAdvance} style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem' }}>→</button>
                  : (activeSectionIdx >= 0 && activeSectionIdx < SECTIONS.length - 1)
                    ? <button onClick={() => gotoSection(SECTIONS[activeSectionIdx + 1])} style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem' }}>→</button>
                    : null
              )}
            </div>

            {/* 2. Chat messages area — always visible */}
            <div ref={chatScrollRef} style={{
              flex: 1, overflowY: 'auto', minHeight: 80,
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: 12, background: '#060d1f', borderRadius: 10, border: '1px solid #152840',
              marginBottom: 10,
            }}>
              {activeSection === null && (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-inter)', fontSize: '0.88rem', textAlign: 'center', paddingTop: 24 }}>
                  Select a section to continue
                </div>
              )}
              {activeSection && (sectionChats[activeSection] || []).filter(m => !shouldHideMessage(m)).map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: msg.role === 'user' ? '#2990fa' : '#0a1628',
                    border: msg.role === 'assistant' ? '1px solid rgba(41,144,250,0.3)' : 'none',
                    color: '#ffffff', padding: '10px 14px', borderRadius: 10,
                    maxWidth: '80%', fontSize: '0.92rem', lineHeight: 1.5,
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

            {/* 3. Controls area — conditional */}
            {activeSection === 'avatar' ? (

              avatarEditMode ? (
                /* ── EDIT MODE ── */
                avatarEditingField !== null ? (
                  /* Field editing */
                  <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={() => { setAvatarEditingField(null); setAvatarSelectedBubbles([]); setCurrentBubbles([]) }}
                        style={{ border: '1px solid #2990fa', background: 'transparent', color: '#2990fa', padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)' }}
                      >
                        ← Back
                      </button>
                      <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {FIELD_LABELS[avatarEditingField]}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                      {currentBubbles.map((bubble, idx) => (
                        <div key={idx} onClick={() => handleAvatarBubbleToggle(bubble)} style={avatarBubbleStyle(bubble)}>
                          {bubble}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleGetMoreAvatarOptions}
                      disabled={isLoading}
                      style={{ color: '#2990fa', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 0', fontFamily: 'var(--font-inter)', display: 'block', marginBottom: 6, opacity: isLoading ? 0.5 : 1, width: '100%', textAlign: 'center' }}
                    >
                      ↻ Get more options
                    </button>
                    {avatarSelectedBubbles.length > 0 && (
                      <button
                        onClick={confirmEditAvatarField}
                        style={{ background: '#2990fa', border: 'none', borderRadius: 6, padding: '10px 0', color: '#ffffff', width: '100%', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Continue → ({avatarSelectedBubbles.length} selected)
                      </button>
                    )}
                  </div>
                ) : (
                  /* Chips grid */
                  <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%', marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                      {Object.entries(FIELD_LABELS).map(([field, label]) => (
                        <div
                          key={field}
                          onClick={() => startEditingAvatarField(field)}
                          style={{
                            background: '#0a1628', border: '1px solid #2990fa', borderRadius: 8,
                            padding: '10px 12px', cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                            {label}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#ffffff', fontFamily: 'var(--font-inter)', lineHeight: 1.4 }}>
                            {avatarData[field] || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setAvatarEditMode(false)}
                      style={{ border: '1px solid #2990fa', background: 'transparent', color: '#2990fa', width: '100%', padding: '10px 0', borderRadius: 6, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      ← Back to Summary
                    </button>
                  </div>
                )

              ) : avatarFunnelStep === 'review' ? (
                /* ── REVIEW STEP ── */
                <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%', marginBottom: 8 }}>
                  <div style={{ background: '#0a1628', border: '1px solid #152840', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                    {Object.entries(FIELD_LABELS).map(([field, label]) =>
                      avatarData[field] ? (
                        <div key={field} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                            {label}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}>
                            {avatarData[field]}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      AVATAR NAME
                    </div>
                    <input
                      value={avatarNameInput}
                      onChange={e => setAvatarNameInput(e.target.value)}
                      placeholder="Give this avatar a name"
                      style={{
                        width: '100%', background: '#060d1f', border: '1px solid #2990fa',
                        borderRadius: 8, color: '#ffffff', padding: '10px 14px',
                        fontSize: '0.9rem', fontFamily: 'var(--font-inter)', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSaveAvatarFunnel}
                    disabled={!avatarNameInput.trim()}
                    style={{
                      background: avatarNameInput.trim() ? '#2990fa' : '#0a1628',
                      border: '1px solid #2990fa', borderRadius: 6, padding: '10px 0',
                      color: avatarNameInput.trim() ? '#ffffff' : '#4a6a8a',
                      fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                      cursor: avatarNameInput.trim() ? 'pointer' : 'not-allowed',
                      width: '100%', marginBottom: 8,
                    }}
                  >
                    SAVE AVATAR
                  </button>
                  <button
                    onClick={() => setAvatarEditMode(true)}
                    style={{
                      background: 'transparent', border: '1px solid #2990fa', borderRadius: 6,
                      padding: '10px 0', color: '#2990fa',
                      fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                      cursor: 'pointer', width: '100%',
                    }}
                  >
                    REDO SECTIONS
                  </button>
                </div>

              ) : (
                /* ── AVATAR FUNNEL STEPS ── */
                <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%', marginBottom: 8 }}>
                  {/* Step indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                      Step {avatarStepIdx + 1} of {AVATAR_FUNNEL_STEPS.length - 1}
                    </span>
                    {avatarSelectedBubbles.length > 0 && (
                      <span style={{ fontSize: '0.6rem', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                        {avatarSelectedBubbles.length}/{avatarMaxSelect}
                      </span>
                    )}
                  </div>

                  {/* Bubbles grid — no Type your own */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                    {currentBubbles.filter(b => b !== 'Type your own').map((bubble, idx) => (
                      <div key={idx} onClick={() => handleAvatarBubbleToggle(bubble)} style={avatarBubbleStyle(bubble)}>
                        {bubble}
                      </div>
                    ))}
                  </div>

                  {/* Get more options */}
                  <button
                    onClick={handleGetMoreAvatarOptions}
                    disabled={isLoading}
                    style={{ color: '#2990fa', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 0', fontFamily: 'var(--font-inter)', display: 'block', marginBottom: 4, opacity: isLoading ? 0.5 : 1, width: '100%', textAlign: 'center' }}
                  >
                    ↻ Get more options
                  </button>

                </div>
              )

            ) : activeSection !== null ? (

              /* ── NON-AVATAR SECTION CONTROLS ── */
              <>
                {/* Angle buttons with subcategories */}
                {sectionAngles.length > 0 && (
                  <div style={{ flexShrink: 0, marginBottom: 8 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: expandedCategories.length > 0 ? 6 : 0 }}>
                      {sectionAngles.map(angle => (
                        <button
                          key={angle}
                          onClick={() => handleAngleToggle(angle)}
                          style={{
                            border: `1px solid ${expandedCategories.includes(angle) ? '#2990fa' : '#152840'}`,
                            background: expandedCategories.includes(angle) ? '#0a1628' : '#060d1f',
                            color: expandedCategories.includes(angle) ? '#ffffff' : '#4a6a8a',
                            padding: '7px 16px', borderRadius: 20,
                            fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', cursor: 'pointer',
                          }}
                        >
                          {angle}
                        </button>
                      ))}
                    </div>
                    {sectionAngles.filter(a => expandedCategories.includes(a)).map(angle => {
                      const subs = SECTION_SUBCATEGORIES[activeSection]?.[angle] || []
                      if (!subs.length) return null
                      return (
                        <div key={angle} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, paddingLeft: 4 }}>
                          {subs.map(sub => (
                            <button
                              key={sub}
                              onClick={() => handleSubcategoryToggle(angle, sub)}
                              style={{
                                background: selectedSubcategories.includes(sub) ? '#0a2a1a' : '#060d1f',
                                border: `1px solid ${selectedSubcategories.includes(sub) ? '#00e5c8' : '#1d3a58'}`,
                                color: selectedSubcategories.includes(sub) ? '#00e5c8' : '#4a6a8a',
                                padding: '4px 10px', borderRadius: 12,
                                fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', cursor: 'pointer',
                              }}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Option bubbles */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0', marginBottom: 8 }}>
                  {currentBubbles.map((bubble, idx) => (
                    <div key={idx}>
                      {editingBubble === idx ? (
                        <div style={{ border: '1px solid #2990fa', background: '#060d1f', borderRadius: 10, padding: '10px 14px' }}>
                          <textarea
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            style={{ background: '#0a1628', color: '#ffffff', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: 60 }}
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
                            color: '#ffffff', padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            fontSize: '1rem', fontFamily: 'var(--font-inter)', lineHeight: 1.5, minHeight: 44,
                          }}
                        >
                          <span>{bubble}</span>
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
              </>

            ) : null}

            {/* 4. Input + action buttons row — unified, always visible */}
            <div style={{ flexShrink: 0, marginBottom: 8 }}>
              {activeSection === null ? (
                <input
                  disabled
                  placeholder="Select a section to start..."
                  style={{
                    width: '100%', background: '#060d1f', border: '1px solid #152840',
                    color: 'rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: 8,
                    fontSize: '0.9rem', fontFamily: 'var(--font-inter)', opacity: 0.5, boxSizing: 'border-box', cursor: 'default',
                  }}
                />
              ) : (activeSection === 'avatar' && (avatarFunnelStep === 'review' || avatarEditMode)) ? null : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={typeOwn}
                    onChange={e => setTypeOwn(e.target.value)}
                    onKeyDown={e => {
                      if (activeSection === 'avatar') {
                        if (e.key === 'Enter') e.preventDefault()
                      } else {
                        if (e.key === 'Enter') {
                          if (isQuestion(typeOwn.trim())) {
                            handleAskJarvisNonAvatar(typeOwn.trim())
                          } else {
                            handleAddTypeOwn()
                          }
                        }
                      }
                    }}
                    placeholder={activeSection === 'avatar' ? 'Type your own or ask Jarvis...' : 'Type your own or ask a question...'}
                    style={{
                      flex: 1, background: '#060d1f', border: '1px solid #2990fa',
                      color: '#ffffff', padding: '8px 14px', borderRadius: 8,
                      fontSize: '0.9rem', fontFamily: 'var(--font-inter)',
                      height: 36, boxSizing: 'border-box',
                    }}
                  />
                  {typeOwn.trim() && (
                    <button
                      onClick={activeSection === 'avatar' ? handleAvatarAdd : handleAddTypeOwn}
                      style={{ background: '#2990fa', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box' }}
                    >
                      ADD
                    </button>
                  )}
                  {typeOwn.trim() && (
                    <button
                      onClick={activeSection === 'avatar' ? handleAvatarAsk : () => handleAskJarvisNonAvatar(typeOwn.trim())}
                      style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box' }}
                    >
                      ASK
                    </button>
                  )}
                  {activeSection === 'avatar' && (avatarSelectedBubbles.length > 0 || typeOwn.trim()) && (
                    <button
                      onClick={handleAvatarAdvance}
                      style={{ background: '#2990fa', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box' }}
                    >
                      →
                    </button>
                  )}
                  {activeSection !== 'avatar' && (
                    <button
                      onClick={handleRefine}
                      disabled={isLoading}
                      style={{ border: '1px solid #2990fa', background: 'transparent', color: '#2990fa', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: isLoading ? 'not-allowed' : 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box', opacity: isLoading ? 0.5 : 1 }}
                    >
                      REFINE
                    </button>
                  )}
                  {activeSection !== 'avatar' && canSubmit && (
                    <button
                      onClick={handleSubmit}
                      style={{ background: '#2990fa', border: 'none', color: '#ffffff', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box' }}
                    >
                      SUBMIT
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', gap: 10, marginTop: 0, paddingTop: 0 }}>
            {SECTIONS.map(section => (
              <div
                key={section}
                onClick={() => gotoSection(section)}
                style={{
                  background: activeSection === section ? '#0a1628' : 'transparent',
                  border: `1px solid ${activeSection === section ? '#2990fa' : '#152840'}`,
                  borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                  opacity: activeSection === null ? 0.4 : (!sectionValues[section] && section !== activeSection) ? 0.4 : 1,
                }}
              >
                <div style={{
                  fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  marginBottom: sectionValues[section] ? 4 : 0,
                }}>
                  {SECTION_LABELS[section]}
                </div>
                {sectionValues[section] && (
                  <div style={{ fontSize: '0.88rem', color: '#ffffff', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
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

            {allConfirmed && (
              <button
                onClick={saveToLibrary}
                style={{
                  background: '#2990fa', border: 'none', borderRadius: 10, padding: 14,
                  color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
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
                    style={{ width: '100%', background: '#060d1f', border: '1px solid #2990fa', borderRadius: 4, color: '#ffffff', padding: 8, fontFamily: 'var(--font-inter)', fontSize: '0.88rem', resize: 'none', height: 70, boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    value={avatarForm[field.key]}
                    placeholder={field.placeholder || ''}
                    onChange={e => setAvatarForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{ width: '100%', background: '#060d1f', border: '1px solid #2990fa', borderRadius: 4, color: '#ffffff', padding: 8, fontFamily: 'var(--font-inter)', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button
                onClick={handleSaveAvatar}
                disabled={!avatarForm.name.trim()}
                style={{ background: '#2990fa', border: 'none', borderRadius: 6, padding: 10, color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', width: '100%', opacity: avatarForm.name.trim() ? 1 : 0.5, cursor: avatarForm.name.trim() ? 'pointer' : 'not-allowed' }}
              >
                Save
              </button>
              <button
                onClick={() => { setAvatarModal(null); setAvatarForm({ ...EMPTY_AVATAR_FORM }) }}
                style={{ background: 'transparent', border: '1px solid #2990fa', borderRadius: 6, padding: 10, color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', width: '100%', cursor: 'pointer' }}
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
