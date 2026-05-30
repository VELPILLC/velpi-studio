'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Section constants ────────────────────────────────────────────────────────

const SECTIONS = ['avatar', 'hook', 'image', 'headline', 'primary_text', 'description', 'cta']

const SECTION_PREREQUISITES = {
  hook: 'avatar',
  image: 'hook',
  headline: 'image',
  primary_text: 'headline',
  description: 'primary_text',
  cta: 'description',
}

const SECTION_LABELS = {
  avatar: 'AVATAR',
  hook: 'HOOK',
  image: 'IMAGE',
  headline: 'HEADLINE',
  primary_text: 'PRIMARY TEXT',
  description: 'DESCRIPTION',
  cta: 'CTA',
}

const SECTION_PROMPTS = {
  hook: 'Generate 3 hook options based on what we know so far.',
  image: 'Generate 3 image concept descriptions for this ad. Each concept must describe a specific, cinematic scene — who or what is in the image, what is happening, the mood, lighting, and setting. Make it vivid and detailed enough to generate a striking photo. No text or logos in any concept.',
  headline: 'Generate 3 headline options. Max 40 characters each.',
  primary_text: 'Generate 3 primary text options. This is the short punchy line that appears BELOW the headline, under the image in a Meta ad. Max 30 characters. One tight line — urgency, social proof, or a reinforcing benefit.',
  description: 'Generate 3 description options. This is the main body copy that appears ABOVE the image in a Meta ad. Tell the story, agitate the problem, present the solution. First 125 characters are critical — they show before See More is clicked. Write longer copy that builds desire and earns the click.',
  cta: 'Generate 3 CTA options based on the ad type.',
}

const SECTION_OPENING_MESSAGES = {
  hook: 'Here are 3 hook angles built from your avatar. Pick what resonates.',
  image: '3 image concepts built from your hook and avatar. Pick one — it generates the actual image.',
  headline: '3 headlines built from your hook and avatar.',
  primary_text: '3 primary text options. Short line below the headline, under the image. Max 30 characters. Tight and punchy.',
  description: '3 description options. This is the body copy above the image — longer copy that tells the story and builds desire. First 125 characters carry the most weight.',
  cta: '3 calls to action matched to your offer.',
}

const SECTION_ANGLES = {
  hook: ['Pain', 'Curiosity', 'Contrarian', 'Benefit', 'Social Proof', 'Fear', 'Authority', 'Story'],
  image: ['Cinematic', 'Editorial', 'Raw/Real', 'Bold Text', 'Lifestyle', 'Before/After'],
  headline: ['Direct', 'Question', 'Bold Claim', 'Call Out', 'Curiosity', 'Number Based'],
  primary_text: ['Urgency', 'Social Proof', 'Benefit', 'Simple CTA'],
  description: ['Story', 'Problem/Solution', 'Value Stack', 'Testimonial', 'Direct Offer', 'Educational'],
  cta: ['Book a Call', 'Fill Form', 'DM Us', 'Call Now', 'Click Link', 'Comment Below'],
  avatar: [],
}

const SECTION_SUBCATEGORIES = {
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
    'Urgency': ['Limited time','Deadline','Spots filling','Act now','Last chance'],
    'Social Proof': ['Number of people','Reviews','Results','Trusted by','Join others'],
    'Benefit': ['Main outcome','Key result','What changes','Primary win','Core promise'],
    'Simple CTA': ['Click to learn','Book now','Get started','See how','Find out'],
  },
  description: {
    'Story': ['Personal origin','Customer transformation','Day in the life','Before the solution','Turning point moment'],
    'Problem/Solution': ['Agitate the pain','Name the enemy','Present the fix','Simple steps','Clear path forward'],
    'Value Stack': ['List everything included','Show the value','Compare to alternatives','What they get','Overdeliver frame'],
    'Testimonial': ['Direct quote','Results focused','Specific numbers','Emotional moment','Before and after quote'],
    'Direct Offer': ['Clear price or terms','Specific guarantee','Limited availability','Exact next step','No fluff offer'],
    'Educational': ['Teach something valuable','Insider knowledge','Common mistake','Better way','Eye opening fact'],
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

const ANGLE_COLORS = [
  '#e06c75', '#61afef', '#e5c07b', '#98c379',
  '#c678dd', '#56b6c2', '#d19a66', '#be5046',
  '#4ec9b0', '#f0a500',
]

// Column resize steps (fr units) for the image section
const COL_SIZES = [0.55, 0.75, 1.0, 1.35, 1.75]

// Chat text scaling steps
const FONT_SCALES = [0.75, 0.88, 1.0, 1.15, 1.3]

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
  industry: 'What industry is your target customer in? Pick one or more.',
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
  avatar: [], hook: [], image: [],
  headline: [], primary_text: [], description: [], cta: [],
})

const EMPTY_VALUES_OBJ = () => ({
  avatar: null, hook: null, image: null,
  headline: null, primary_text: null, description: null, cta: null,
})

const EMPTY_AVATAR_DATA = () => ({
  industry: null, role: null, businessSize: null, ageRange: null,
  location: null, wants: null, fears: null, frustrations: null,
  statusDriver: null, mediaTrust: null, deepFear: null, winLooksLike: null,
})

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdsTab({ pendingRefine, onRefineConsumed, pendingLoadAd, onLoadAdConsumed, selectedProfile, onGoToProfile, pendingTabChange, onTabChangeApproved, onTabChangeCancelled, onSaved }) {
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
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [imageFormat, setImageFormat] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [selectedSubcategories, setSelectedSubcategories] = useState([])
  const [extraSubcategories, setExtraSubcategories] = useState({})
  const [moreSubsLoading, setMoreSubsLoading] = useState({})
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [sectionLockMsg, setSectionLockMsg] = useState(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [imageVersions, setImageVersions] = useState([])
  const [selectedImageIds, setSelectedImageIds] = useState([])
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [unsavedPrompt, setUnsavedPrompt] = useState(null)
  const [imageViewMode, setImageViewMode] = useState('single') // 'single' | 'multi'
  const [imgMultiExpanded, setImgMultiExpanded] = useState({})
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false)
  const [imgSelectMsg, setImgSelectMsg] = useState(null)
  const [leftColIdx, setLeftColIdx] = useState(2)   // 0–4 index into COL_SIZES
  const [centerColIdx, setCenterColIdx] = useState(2)
  const [bubbleHistory, setBubbleHistory] = useState([])
  const [chatFontScale, setChatFontScale] = useState(2) // index into FONT_SCALES
  const [avatarRestartModal, setAvatarRestartModal] = useState(false)

  const chatScrollRef = useRef(null)

  // Avatar funnel state
  const [avatarFunnelStep, setAvatarFunnelStep] = useState('industry')
  const [avatarData, setAvatarData] = useState(EMPTY_AVATAR_DATA())
  const [avatarNameInput, setAvatarNameInput] = useState('')

  // Avatar bar state
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Freeform entry + restart
  const [adEntryMode, setAdEntryMode] = useState('entry') // 'entry' | 'working'
  const [freeformIdeaText, setFreeformIdeaText] = useState('')
  const [storedIdeaText, setStoredIdeaText] = useState('')
  const [isParsingIdea, setIsParsingIdea] = useState(false)
  const [resetModal, setResetModal] = useState(null)
  const [isBuildingSummary, setIsBuildingSummary] = useState(false)
  const [copied, setCopied] = useState(false)

  // NEW: Multi-select + back + edit + dropdown + delete
  const [avatarSelectedBubbles, setAvatarSelectedBubbles] = useState([])
  const [avatarFunnelHistory, setAvatarFunnelHistory] = useState([])
  const [avatarEditMode, setAvatarEditMode] = useState(false)
  const [avatarEditingField, setAvatarEditingField] = useState(null)
  const [avatarEditingId, setAvatarEditingId] = useState(null)
  const [avatarDropdown, setAvatarDropdown] = useState(null)
  const [avatarDeleteConfirm, setAvatarDeleteConfirm] = useState(null)
  const [avatarMenuPos, setAvatarMenuPos] = useState({ top: 0, left: 0 })

  // ─── useEffects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadAvatars()
    initAvatarFunnel()
  }, [])

  useEffect(() => {
    setSelectedAngles([])
    setSelectedBubbles([])
    setSelectedSubcategories([])
    setExpandedCategory(null)
    setExtraSubcategories({})
    setTypeOwn('')
    setBubbleHistory([])
  }, [activeSection])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [sectionChats, activeSection])

  // Reset everything when profile changes — must run BEFORE library load effects
  useEffect(() => {
    if (!selectedProfile?.id) return
    setSectionChats(EMPTY_SECTION_OBJ())
    setSectionValues(EMPTY_VALUES_OBJ())
    setActiveSection('avatar')
    setCurrentBubbles([])
    setSelectedBubbles([])
    setSelectedAngles([])
    setSelectedSubcategories([])
    setExpandedCategory(null)
    setExtraSubcategories({})
    setTypeOwn('')
    setImageB64(null)
    setImageError(null)
    setImageVersions([])
    setSelectedImageIds([])
    setCurrentImageIdx(0)
    setCurrentDraftId(null)
    setUnsavedPrompt(null)
    setImageViewMode('single')
    setImgMultiExpanded({})
    setPlatformDropdownOpen(false)
    setImgSelectMsg(null)
    setAdEntryMode('entry')
    setFreeformIdeaText('')
    setStoredIdeaText('')
    initAvatarFunnel()
  }, [selectedProfile?.id])

  // Library load effects — declared after profile reset so they fire last on mount
  // and their values are not overwritten by the profile reset
  useEffect(() => {
    if (pendingRefine) {
      loadForRefine(pendingRefine)
      onRefineConsumed?.()
    }
  }, [pendingRefine])

  useEffect(() => {
    if (pendingLoadAd) {
      loadFullAdFromLibrary(pendingLoadAd)
      onLoadAdConsumed?.()
    }
  }, [pendingLoadAd])

  // Handle tab-change requests from Studio — show prompt if unsaved work
  useEffect(() => {
    if (pendingTabChange === null) return
    const work = SECTIONS.some(s => sectionValues[s] !== null)
    if (!work) {
      onTabChangeApproved?.()
      return
    }
    setUnsavedPrompt({
      onContinue: () => {
        setUnsavedPrompt(null)
        onTabChangeApproved?.()
      },
      onCancel: () => {
        setUnsavedPrompt(null)
        onTabChangeCancelled?.()
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTabChange])

  // Warn before browser refresh/close when there is unsaved work
  useEffect(() => {
    function handleBeforeUnload(e) {
      const work = SECTIONS.some(s => sectionValues[s] !== null)
      if (work) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [sectionValues])

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
        profile: selectedProfile || null,
        sectionContext: svs,
        currentSection: section,
        activeAngles: angles,
        platform: selectedPlatform || null,
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
    if (msg.role === 'user' && msg.content.startsWith('[IDEA_CONTEXT]')) return true
    if (msg.role === 'assistant') {
      // Any assistant payload that yields an options array is bubble data — never show it.
      // Uses the same lenient detection as parseResponse so JSON embedded in surrounding
      // text is caught too (strict JSON.parse alone would let those leak into the chat).
      if (parseResponse(msg.content)?.options) return true
    }
    return false
  }

  // Final safety net for chat rendering: never let raw JSON reach the screen.
  // Returns the text to display, or null to skip the message entirely.
  function chatDisplayText(msg) {
    if (shouldHideMessage(msg)) return null
    const content = msg?.content || ''
    if (msg?.role === 'assistant') {
      const cleaned = content.replace(/```json|```/g, '').trim()
      // Looked like structured data but did not parse into options — show a clean
      // message instead of dumping raw JSON on the user.
      if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
        return '⚠ I had trouble formatting that response. Tap Refine to try again.'
      }
    }
    return content
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

  // ─── Avatar funnel ────────────────────────────────────────────────────────────

  function initAvatarFunnel() {
    // Pre-fill from selected profile if available — skip steps we already know
    const preData = EMPTY_AVATAR_DATA()
    let startStep = 'industry'
    let openingContent = AVATAR_STEP_MESSAGES.industry
    let startBubbles = INDUSTRY_BUBBLES

    if (selectedProfile?.who_they_serve) {
      const wts = selectedProfile.who_they_serve
      const wtsLow = wts.toLowerCase()
      preData.role = wts

      // Infer industry from who they serve so we can skip both steps
      if (wtsLow.includes('homeowner') || wtsLow.includes('residential')) {
        preData.industry = 'Homeowners / Residential'
      } else if (wtsLow.includes('business owner') || wtsLow.includes('entrepreneur')) {
        preData.industry = 'Business Owners'
      } else if (wtsLow.includes('contractor') || wtsLow.includes('trade')) {
        preData.industry = 'Construction & Trades'
      }

      // Whether we inferred industry or not, role is set — skip to businessSize
      startStep = 'businessSize'
      startBubbles = BUSINESS_SIZE_BUBBLES
      openingContent = `Based on your profile you serve: ${wts}.\n\n${AVATAR_STEP_MESSAGES.businessSize}`
    }

    setAvatarFunnelStep(startStep)
    setAvatarData(preData)
    setAvatarNameInput('')
    setAvatarSelectedBubbles([])
    setAvatarFunnelHistory([])
    setAvatarEditMode(false)
    setAvatarEditingField(null)
    setAvatarEditingId(null)
    setSectionChats(prev => ({
      ...prev,
      avatar: [{ role: 'assistant', content: openingContent }],
    }))
    setCurrentBubbles(startBubbles)
  }

  function startNewAvatarFunnel() {
    promptUnsaved({
      onContinue: () => {
        setCurrentDraftId(null)
        setActiveSection('avatar')
        initAvatarFunnel()
      },
      onCancel: () => {},
    })
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
      setAvatarNameInput('')
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
    const context = `industry=${d.industry || 'unknown'}, role=${d.role || 'unknown'}, businessSize=${d.businessSize || 'unknown'}, ageRange=${d.ageRange || 'unknown'}`
    const dynamicSystem = step === 'statusDriver'
      ? `Generate 4 bubble options for what winning looks like for this avatar.
These should describe success moments, achievements, and status wins.
Examples of correct answers:
- Fully booked calendar with a waitlist
- Hiring their first office manager
- Taking a vacation without the business falling apart
- Their peers asking how they grew so fast
Examples of WRONG answers (do not generate these):
- Anything about marketing not working
- Anything about problems or pain points
- Anything about wasting money
Context: ${context}
Return JSON only: {"step":"avatar_dynamic","options":["opt1","opt2","opt3","opt4"]}`
      : `Generate exactly 4 short bubble options for this avatar funnel step.
Context so far: ${context}
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

  // Advance funnel via → button (guards platform + empty selection)
  function handleAvatarAdvance() {
    if (avatarFunnelStep === 'review' || avatarEditMode) return
    if (!selectedPlatform) {
      setSectionChats(prev => ({
        ...prev,
        avatar: [...prev.avatar, { role: 'assistant', content: 'Select a platform above before continuing.' }],
      }))
      return
    }
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
    setIsChatLoading(true)
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
    setIsChatLoading(false)
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
    setIsChatLoading(true)
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
    setIsChatLoading(false)
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
        what_they_fear: avatarData.fears || '',
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
            { role: 'assistant', content: `Avatar "${data.avatar.name}" saved. Moving to hook.` },
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
        setActiveSection('hook')
        openSection('hook', newSvs, data.avatar, [])
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

  function doAvatarSelect(av) {
    const newSvs = { ...sectionValues, avatar: av.name }
    setSelectedAvatar(av)
    setSectionValues(newSvs)
    setSectionChats(prev => ({
      ...prev,
      avatar: [{ role: 'assistant', content: `Avatar locked in. Writing for ${av.name}.` }],
    }))
    setAvatarFunnelStep('industry')
    setAvatarData(EMPTY_AVATAR_DATA())
    setAvatarNameInput('')
    setAvatarSelectedBubbles([])
    setAvatarFunnelHistory([])
    setAvatarEditMode(false)
    setAvatarEditingField(null)
    setAvatarEditingId(null)
    setActiveSection('hook')
    openSection('hook', newSvs, av, [])
  }

  function handleAvatarSelect(av) {
    // Deselect current avatar — no prompt needed
    if (selectedAvatar?.id === av.id) {
      setSelectedAvatar(null)
      setSectionValues(prev => ({ ...prev, avatar: null }))
      setSectionChats(prev => ({ ...prev, avatar: [] }))
      return
    }
    // Switching to a different avatar — prompt if there is unsaved work
    promptUnsaved({
      onContinue: () => doAvatarSelect(av),
      onCancel: () => {},
    })
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

    let userContent = questionText
    let questionSystem = null

    if (selectedBubbles.length === 1) {
      userContent = `${questionText} — apply this to the selected option: '${selectedBubbles[0]}'`
    } else if (selectedBubbles.length === 2) {
      userContent = `${questionText} — apply this to these selected options: '${selectedBubbles[0]}' and '${selectedBubbles[1]}'`
    } else {
      questionSystem = `User is asking a question while on section: ${activeSection}. Their question: ${questionText}. Answer in 1-2 simple sentences. Explain it like they have never done marketing before. Then in one sentence redirect them back to what they were doing. Do not generate bubble options in this response. Return plain text only not JSON.`
    }

    const userMsg = { role: 'user', content: userContent }
    setSectionChats(prev => ({ ...prev, [activeSection]: [...prev[activeSection], userMsg] }))
    setIsLoading(true)
    setIsChatLoading(true)
    try {
      const raw = await callAPI(activeSection, [userMsg], sectionValues, selectedAvatar, selectedAngles, questionSystem)
      setSectionChats(prev => ({
        ...prev,
        [activeSection]: [...prev[activeSection], { role: 'assistant', content: raw }],
      }))
      if (selectedBubbles.length > 0) {
        const parsed = parseResponse(raw)
        if (parsed && parsed.options) {
          setCurrentBubbles(parsed.options)
          setSelectedBubbles([])
        }
      }
    } catch (err) {
      console.error('Ask Jarvis error:', err)
    }
    setIsLoading(false)
    setIsChatLoading(false)
  }

  // ─── Unified send-to-Jarvis (replaces both REFINE and ASK for all sections) ──

  async function handleSendToJarvis() {
    if (isLoading || !activeSection || activeSection === 'avatar') return

    const text = typeOwn.trim()

    const activeAngles = [
      ...selectedAngles.filter(a => !selectedSubcategories.some(s =>
        (SECTION_SUBCATEGORIES[activeSection]?.[a] || []).includes(s) ||
        (extraSubcategories[a] || []).includes(s)
      )),
      ...selectedSubcategories,
    ]

    let message
    if (text && selectedBubbles.length > 0) {
      message = `${text} — apply this to the selected option${selectedBubbles.length > 1 ? 's' : ''}: ${selectedBubbles.map(b => `"${b}"`).join(' and ')}`
    } else if (text) {
      message = text
    } else if (selectedBubbles.length === 2) {
      message = `The user selected these two options: "${selectedBubbles[0]}" and "${selectedBubbles[1]}". Generate exactly 3 refined options:\n1. Refined version of option 1\n2. Refined version of option 2\n3. A blend of both options combined`
    } else if (selectedBubbles.length === 1) {
      message = `Refine. I like the direction of: "${selectedBubbles[0]}". Give me 3 tighter variations.`
    } else if (activeAngles.length > 0) {
      message = `Generate 3 new options using these angle filters: [${activeAngles.join(', ')}]. Stay within these directions.`
    } else {
      message = 'Generate 3 fresh options. Use all confirmed context.'
    }

    const userMsg = { role: 'user', content: message }
    const updatedChat = [...sectionChats[activeSection], userMsg]
    setSectionChats(prev => ({ ...prev, [activeSection]: updatedChat }))
    setTypeOwn('')
    setIsLoading(true)
    setIsChatLoading(true)

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
      if (parsed?.options) {
        pushBubbleHistory()
        setCurrentBubbles(parsed.options)
        setSelectedBubbles([])
      }
    } catch (err) {
      console.error('Send to Jarvis error:', err)
    }
    setIsLoading(false)
    setIsChatLoading(false)
  }

  // ─── Section management ───────────────────────────────────────────────────────

  async function openSection(section, svs, av, angles = []) {
    if (section === 'avatar') return
    const prompt = SECTION_PROMPTS[section]
    if (!prompt) return
    const openingMsg = SECTION_OPENING_MESSAGES[section]

    // Build messages — prepend stored idea context if available so AI generates more relevant options
    const apiMessages = []
    if (storedIdeaText) {
      apiMessages.push({ role: 'user', content: `[IDEA_CONTEXT] ${storedIdeaText}` })
    }
    apiMessages.push({ role: 'user', content: prompt })

    setIsLoading(true)
    setIsChatLoading(true)
    try {
      const raw = await callAPI(section, apiMessages, svs, av, angles)
      const parsed = parseResponse(raw)

      // Build stored chat — include hidden idea context so refine/ask calls also have it
      const chatHistory = []
      if (storedIdeaText) {
        chatHistory.push({ role: 'user', content: `[IDEA_CONTEXT] ${storedIdeaText}` })
      }
      if (openingMsg) chatHistory.push({ role: 'assistant', content: openingMsg })
      chatHistory.push({ role: 'user', content: prompt })
      chatHistory.push({ role: 'assistant', content: raw })

      setSectionChats(prev => ({ ...prev, [section]: chatHistory }))
      if (parsed && parsed.options) {
        pushBubbleHistory()
        setCurrentBubbles(parsed.options)
        setSelectedBubbles([])
      }
    } catch (err) {
      console.error('openSection error:', err)
    }
    setIsLoading(false)
    setIsChatLoading(false)
  }

  function gotoSection(section) {
    if (section === activeSection) {
      setActiveSection(null)
      setCurrentBubbles([])
      setSelectedBubbles([])
      return
    }

    // Section flow lock — only blocks when prerequisite is unconfirmed AND this section is also unconfirmed
    if (section !== 'avatar') {
      const prereq = SECTION_PREREQUISITES[section]
      if (prereq && !sectionValues[prereq] && !sectionValues[section]) {
        setSectionLockMsg(section)
        setTimeout(() => setSectionLockMsg(s => s === section ? null : s), 3000)
        return
      }
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
      if (section === 'image') {
        // Look for parseable refine options after the last "Image confirmed." message
        let confirmIdx = -1
        for (let i = chat.length - 1; i >= 0; i--) {
          if (chat[i].role === 'assistant' && chat[i].content === 'Image confirmed.') {
            confirmIdx = i
            break
          }
        }
        if (confirmIdx >= 0) {
          for (let i = chat.length - 1; i > confirmIdx; i--) {
            if (chat[i].role === 'assistant') {
              const parsed = parseResponse(chat[i].content)
              if (parsed && parsed.options) {
                setCurrentBubbles(parsed.options)
                return
              }
            }
          }
        }
        // No post-confirmation refine options — add concept as user message and get Jarvis refine options
        openImageRefineChat(val)
        return
      }
      setCurrentBubbles([])
      return
    }

    if (chat.length > 0) {
      // Search all assistant messages from most recent to oldest for parseable options
      const aiMessages = [...chat].reverse().filter(m => m.role === 'assistant')
      for (const msg of aiMessages) {
        const parsed = parseResponse(msg.content)
        if (parsed && parsed.options) {
          setCurrentBubbles(parsed.options)
          return
        }
      }
      // No parseable options found anywhere in chat history — re-open the section to regenerate
      openSection(section, sectionValues, selectedAvatar, [])
      return
    }

    openSection(section, sectionValues, selectedAvatar, [])
  }

  async function openImageRefineChat(concept) {
    const userMsg = { role: 'user', content: concept }
    setSectionChats(prev => ({
      ...prev,
      image: [...prev.image, userMsg],
    }))
    setIsLoading(true)
    setIsChatLoading(true)
    try {
      const prompt = `The user has confirmed this image concept: "${concept}". Generate 3 refined variations of this concept — same core direction, different visual approaches or moods. Return JSON only: {"options":["option1","option2","option3"]}`
      const raw = await callAPI('image', [{ role: 'user', content: prompt }], sectionValues, selectedAvatar, [])
      const parsed = parseResponse(raw)
      setSectionChats(prev => ({
        ...prev,
        image: [...prev.image, { role: 'assistant', content: raw }],
      }))
      if (parsed && parsed.options) {
        pushBubbleHistory()
        setCurrentBubbles(parsed.options)
        setSelectedBubbles([])
      }
    } catch (err) {
      console.error('openImageRefineChat error:', err)
    }
    setIsLoading(false)
    setIsChatLoading(false)
  }

  async function handleRefine() {
    if (isLoading || !activeSection) return

    const activeAngles = [
      ...selectedAngles.filter(a => !selectedSubcategories.some(s =>
        (SECTION_SUBCATEGORIES[activeSection]?.[a] || []).includes(s) ||
        (extraSubcategories[a] || []).includes(s)
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
    setIsChatLoading(true)

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
        pushBubbleHistory()
        setCurrentBubbles(parsed.options)
        setSelectedBubbles([])
      }
    } catch (err) {
      console.error('handleRefine error:', err)
    }
    setIsLoading(false)
    setIsChatLoading(false)
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
      setImageError(null)
      // Do NOT auto-generate — user must select a size first
    }

    const idx = SECTIONS.indexOf(section)
    if (idx < SECTIONS.length - 1) {
      const nextSection = SECTIONS[idx + 1]
      setActiveSection(nextSection)
      openSection(nextSection, newSectionValues, selectedAvatar, [])
    }
  }

  async function generateImageVersion(concept, fmt, referenceB64s = [], parentId = null) {
    // Reuse pending placeholder slot if one exists, otherwise create a new version
    const pendingVersion = imageVersions.find(v => v.isPending)
    const versionId = pendingVersion?.id || `v-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const sizeMap = { '9/16': '1024x1536', '1:1': '1024x1024', '4:5': '1024x1536', '16/9': '1536x1024' }
    const formatDesc = fmt === '1:1' ? 'square format photo' : fmt === '4:5' ? 'vertical 4:5 portrait photo' : fmt === '16/9' ? 'horizontal 16:9 landscape photo' : 'cinematic vertical 9:16 portrait photo'
    const isEdit = referenceB64s.length > 0
    const sizeValue = sizeMap[fmt] || '1024x1536'

    // Create the generating slot immediately so the loading spinner shows right away.
    // sentPrompt is filled in once the final prompt is built (edits build it async).
    const generatingVersion = { id: versionId, b64: null, prompt: concept, sentPrompt: null, isEdit, format: fmt, isGenerating: true, error: null, parentId, isPending: false }

    if (pendingVersion) {
      // Reuse the pending slot in place — move the carousel onto it so the
      // loading frame is what the user is looking at while it generates.
      const pendingIdx = imageVersions.findIndex(v => v.id === pendingVersion.id)
      setImageVersions(prev => prev.map(v => v.isPending ? generatingVersion : v))
      if (pendingIdx >= 0) setCurrentImageIdx(pendingIdx)
    } else {
      setImageVersions(prev => [...prev, generatingVersion])
      setCurrentImageIdx(imageVersions.length)
    }

    try {
      // Fresh generation uses the scene template. Edits build a precise combined
      // prompt: preserve the original exactly, then the requested change only.
      let promptText
      if (isEdit) {
        const refVersion = imageVersions.find(v => v.id === parentId)
        const originalConcept = refVersion?.prompt || refVersion?.sentPrompt || dallePrompt || sectionValues.image || ''
        promptText = await buildEditPrompt(originalConcept, concept)
      } else {
        promptText = `${formatDesc}, ${concept}, no text, no logos, photorealistic, documentary style`
      }

      // VISIBILITY: log the exact prompt being sent (open browser console to inspect)
      console.log('[image gen]', {
        mode: isEdit ? 'EDIT (with reference image)' : 'GENERATE (fresh)',
        size: sizeValue,
        references: referenceB64s.length,
        yourText: concept,
        promptSent: promptText,
      })

      // Reflect the real prompt in the slot. For edits, also store the richer
      // combined prompt as the concept so a confirmed edit keeps full context.
      setImageVersions(prev => prev.map(v => v.id === versionId
        ? { ...v, sentPrompt: promptText, ...(isEdit ? { prompt: promptText } : {}) }
        : v))

      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          size: sizeValue,
          ...(isEdit ? { referenceB64s } : {}),
        }),
      })
      const data = await res.json()
      if (data.b64) {
        setImageVersions(prev => prev.map(v => v.id === versionId ? { ...v, b64: data.b64, isGenerating: false } : v))
      } else {
        console.warn('[image gen] failed:', data.error)
        setImageVersions(prev => prev.map(v => v.id === versionId ? { ...v, isGenerating: false, error: data.error || 'Generation failed. Try again.' } : v))
      }
    } catch (err) {
      console.error('Image gen error:', err)
      setImageVersions(prev => prev.map(v => v.id === versionId ? { ...v, isGenerating: false, error: 'Something went wrong.' } : v))
    }
  }

  // Build a precise EDIT prompt for the image edit endpoint: first describe everything
  // in the original that must be preserved exactly, then the requested change using
  // precise spatial language. Never sends the user's casual instruction on its own.
  async function buildEditPrompt(originalConcept, instruction) {
    const fallback = `Preserve everything in the original image exactly as it is${originalConcept ? ', including: ' + originalConcept : ''}. Change only this: ${instruction}. Do not move or alter any other element.`
    try {
      const system = `You write precise EDIT prompts for an AI image-editing model that receives the ORIGINAL image plus your text. It must change ONLY what is asked and keep everything else identical.
You are given the ORIGINAL image description and the user's NEW change instruction.
Output ONE edit prompt as PLAIN TEXT only. No JSON. No markdown. No preamble. No surrounding quotes.
Follow this structure exactly:
1. Start with "Preserve " and list every element from the original that must stay exactly the same — the subjects, any text content quoted word-for-word, the setting, the props, the lighting, the mood, the composition, and the style.
2. Then write "Change only this: " and describe the requested change as precisely as possible. Locate it with spatial language — left of, right of, above, below, next to, on the same line as, the beginning of the line.
3. End with the sentence "Do not move or alter any other element."
Be concrete and specific. Preserve the exact wording of any text visible in the image. Plain text only.`
      const userMsg = `ORIGINAL IMAGE: ${originalConcept || '(no description provided — preserve every element visible in the attached image)'}\nNEW INSTRUCTION: ${instruction}`
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }], system }),
      })
      const data = await res.json()
      const raw = (data.text || '').replace(/```json|```/g, '').trim()
      // Guard: never let stray JSON become the image prompt — fall back if so.
      if (raw && !raw.startsWith('{') && !raw.startsWith('[')) return raw
      return fallback
    } catch (_) {
      return fallback
    }
  }

  // Regenerate a new image using selected image(s) as reference + typed prompt
  function handleRegenWithImage() {
    if (!typeOwn.trim() || !imageFormat) return
    const concept = typeOwn.trim()
    const refs = selectedImageIds.map(id => imageVersions.find(v => v.id === id)?.b64).filter(Boolean)
    const parentId = refs.length > 0 ? selectedImageIds[0] : null
    setSectionChats(prev => ({ ...prev, image: [...prev.image, { role: 'user', content: concept }] }))
    setTypeOwn('')
    setDallePrompt(concept)
    setImageViewMode('single')
    generateImageVersion(concept, imageFormat, refs, parentId)
  }

  // Create a fresh blank slot for a new image (keeps existing versions intact)
  function handleNewImage() {
    setSelectedImageIds([])
    setImageViewMode('single')
    const hasPending = imageVersions.some(v => v.isPending)
    if (!hasPending && imageVersions.length > 0) {
      setCurrentImageIdx(imageVersions.length)
      setImageVersions(prev => [
        ...prev,
        { id: `pending-${Date.now()}`, b64: null, prompt: null, format: imageFormat || null, isGenerating: false, error: null, parentId: null, isPending: true },
      ])
    } else if (hasPending) {
      const idx = imageVersions.findIndex(v => v.isPending)
      if (idx >= 0) setCurrentImageIdx(idx)
    }
    // if no versions yet: empty placeholder is already visible
  }

  function handleSizeClick(fmt) {
    setImageFormat(fmt)
    setImageError(null)
    if (imageVersions.length > 0) {
      const pendingIdx = imageVersions.findIndex(v => v.isPending)
      if (pendingIdx >= 0) {
        // Update format of existing pending placeholder
        setImageVersions(prev => prev.map((v, i) => i === pendingIdx ? { ...v, format: fmt } : v))
        setCurrentImageIdx(pendingIdx)
      } else {
        // Add new pending placeholder at the end
        setImageVersions(prev => [
          ...prev,
          { id: `pending-${Date.now()}`, b64: null, prompt: null, format: fmt, isGenerating: false, error: null, parentId: null, isPending: true },
        ])
        setCurrentImageIdx(imageVersions.length) // length before appending = new last index
      }
    }
  }

  function handleGenerateImageClick() {
    // Prompt comes from the selected bubble, or whatever is typed in the input.
    const concept = (selectedBubbles[0] || typeOwn.trim() || '').trim()
    if (!imageFormat && !concept) {
      setImgSelectMsg('Select a size and a prompt first')
      setTimeout(() => setImgSelectMsg(null), 2500)
      return
    }
    if (!imageFormat) {
      setImgSelectMsg('Select a size first')
      setTimeout(() => setImgSelectMsg(null), 2500)
      return
    }
    if (!concept) {
      setImgSelectMsg('Select a prompt or type one first')
      setTimeout(() => setImgSelectMsg(null), 2500)
      return
    }
    const fmt = imageFormat
    const refs = selectedImageIds.map(id => imageVersions.find(v => v.id === id)?.b64).filter(Boolean)
    const parentId = refs.length > 0 ? selectedImageIds[0] : null
    setSectionChats(prev => ({ ...prev, image: [...prev.image, { role: 'user', content: concept }] }))
    setDallePrompt(concept)
    // Show the single carousel view so the loading frame is visible.
    setImageViewMode('single')
    // If the prompt came from the typed input (no bubble selected), clear it.
    if (!selectedBubbles[0] && typeOwn.trim()) setTypeOwn('')
    generateImageVersion(concept, fmt, refs, parentId)
  }

  function handleImageVersionClick(version) {
    if (!version.b64) return
    if (selectedImageIds.includes(version.id)) {
      setSelectedImageIds(prev => prev.filter(id => id !== version.id))
      return
    }
    if (selectedImageIds.length >= 2) {
      setImgSelectMsg('Unselect one to choose another')
      setTimeout(() => setImgSelectMsg(null), 2500)
      return
    }
    setSelectedImageIds(prev => [...prev, version.id])
  }

  function handleImageSubmit(versionOverride = null) {
    const version = versionOverride || (selectedImageIds.length === 1 ? imageVersions.find(v => v.id === selectedImageIds[0]) : null)
    if (!version?.b64) return

    setImageB64(version.b64)
    setDallePrompt(version.prompt || '')
    setSelectedImageIds([version.id])

    const concept = version.prompt || sectionValues.image || dallePrompt || 'Generated image'
    const newSvs = { ...sectionValues, image: concept }
    setSectionValues(newSvs)

    setSectionChats(prev => ({
      ...prev,
      image: [
        ...prev.image,
        { role: 'user', content: `Selected: "${concept}"` },
        { role: 'assistant', content: 'Image confirmed.' },
      ],
    }))

    if (!sectionValues.image) {
      const idx = SECTIONS.indexOf('image')
      const nextSection = SECTIONS[idx + 1]
      setActiveSection(nextSection)
      openSection(nextSection, newSvs, selectedAvatar, [])
    }
  }

  // ─── Library ──────────────────────────────────────────────────────────────────

  function loadFullAdFromLibrary(ad) {
    const svs = {
      avatar: ad.angle || ad.avatar_name || null,
      hook: ad.hook || null,
      image: ad.image_concept || ad.imageConcept || null,
      headline: ad.headline || null,
      primary_text: ad.primary_text || ad.primaryText || null,
      description: ad.description || null,
      cta: ad.cta || null,
    }
    setSectionValues(svs)
    setSectionChats(EMPTY_SECTION_OBJ())
    setCurrentBubbles([])
    setSelectedBubbles([])
    const loadedB64 = ad.image_b64 || ad.imageB64 || null
    const loadedConcept = ad.image_concept || ad.imageConcept || ''
    setImageB64(loadedB64)
    setImageError(null)
    setImageFormat(loadedB64 ? '9/16' : null)
    setDallePrompt(loadedConcept)
    if (loadedB64) {
      const vId = `loaded-${Date.now()}`
      setImageVersions([{ id: vId, b64: loadedB64, prompt: loadedConcept, format: '9/16', isGenerating: false, error: null, parentId: null, isPending: false }])
      setSelectedImageIds([vId])
      setCurrentImageIdx(0)
    } else {
      setImageVersions([])
      setSelectedImageIds([])
      setCurrentImageIdx(0)
    }
    // If loading a draft, track its ID so saves update the same record
    setCurrentDraftId(ad.status === 'draft' ? (ad.id || null) : null)
    setAdEntryMode('working')
    // Land on the first section that has no confirmed value yet (skip avatar — always set from draft)
    const firstEmpty = SECTIONS.slice(1).find(s => svs[s] === null) || 'hook'
    setActiveSection(firstEmpty)
    openSection(firstEmpty, svs, selectedAvatar, [])
  }

  function loadForRefine(ad) {
    const svs = {
      avatar: ad.angle || ad.avatar || null,
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
    const refineB64 = ad.imageB64 || ad.image_b64 || null
    const refineConcept = ad.imageConcept || ad.image_concept || ''
    setImageB64(refineB64)
    setImageFormat(refineB64 ? '9/16' : null)
    setDallePrompt(refineConcept)
    if (refineB64) {
      const vId = `loaded-${Date.now()}`
      setImageVersions([{ id: vId, b64: refineB64, prompt: refineConcept, format: '9/16', isGenerating: false, error: null, parentId: null, isPending: false }])
      setSelectedImageIds([vId])
      setCurrentImageIdx(0)
    } else {
      setImageVersions([])
      setSelectedImageIds([])
      setCurrentImageIdx(0)
    }
    setAdEntryMode('working')
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
          status: 'complete',
          version_number: 1,
          parent_id: null,
        }),
      })
      if (res.ok) {
        setCurrentDraftId(null)
        onSaved?.()
      }
    } catch (err) {
      console.error('saveToLibrary error:', err)
    }
  }

  // ─── Draft system ────────────────────────────────────────────────────────────

  async function saveDraft(asNew = false) {
    const body = {
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
      status: 'draft',
      version_number: 1,
      parent_id: null,
    }
    try {
      if (!asNew && currentDraftId) {
        await fetch('/api/library', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentDraftId, ...body }),
        })
      } else {
        const res = await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.ad?.id) setCurrentDraftId(data.ad.id)
      }
    } catch (err) {
      console.error('saveDraft error:', err)
    }
  }

  // Show unsaved-work prompt if any sections are confirmed; otherwise call onContinue directly
  function promptUnsaved(callbacks) {
    const work = SECTIONS.some(s => sectionValues[s] !== null)
    if (!work) {
      callbacks.onContinue()
      return
    }
    setUnsavedPrompt(callbacks)
  }

  // ─── Freeform entry + restart ─────────────────────────────────────────────────

  async function handleIdeaSubmit() {
    const text = freeformIdeaText.trim()
    if (!text || isParsingIdea) return
    setIsParsingIdea(true)
    setStoredIdeaText(text)

    // Reset avatar funnel to clean state before potentially overriding with extracted data
    initAvatarFunnel()

    const extractSystem = `Extract ad creation context from this user description. Return JSON only, no markdown:
{
  "platform": "Meta" | "TikTok" | "YouTube" | "Google" | "LinkedIn" | null,
  "target_industry": "industry of their target customer e.g. Homeowners, Business owners, or null",
  "target_role": "role/type of their target customer or null",
  "target_age_range": "age range like '35 to 45' or null",
  "target_wants": "what the target customer wants most or null",
  "target_fears": "what the target customer fears or null",
  "hook_angle": "main emotional angle e.g. Fear, Pain, Benefit, Social Proof — or null",
  "cta_type": "e.g. Call Now, Book a Call, Fill Form or null"
}`

    try {
      const raw = await callAPI('avatar', [{ role: 'user', content: text }], EMPTY_VALUES_OBJ(), null, [], extractSystem)
      let parsed = null
      try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) } catch (_) {}

      if (parsed) {
        // Platform
        const validPlatforms = ['Meta', 'TikTok', 'YouTube', 'Google', 'LinkedIn']
        if (parsed.platform && validPlatforms.includes(parsed.platform)) {
          setSelectedPlatform(parsed.platform)
        }

        // Avatar data
        const newAvatarData = { ...EMPTY_AVATAR_DATA() }
        if (parsed.target_industry) newAvatarData.industry = parsed.target_industry
        if (parsed.target_role) newAvatarData.role = parsed.target_role
        if (parsed.target_age_range) newAvatarData.ageRange = parsed.target_age_range
        if (parsed.target_wants) newAvatarData.wants = parsed.target_wants
        if (parsed.target_fears) newAvatarData.fears = parsed.target_fears

        const anyExtracted = Object.values(newAvatarData).some(v => v !== null)
        if (anyExtracted) {
          setAvatarData(newAvatarData)
          setAvatarFunnelHistory([])
          setAvatarSelectedBubbles([])

          // Jump to first missing step
          const firstMissing = AVATAR_FUNNEL_STEPS.find(step => step !== 'review' && !newAvatarData[step])
          const startStep = firstMissing || 'review'
          setAvatarFunnelStep(startStep)

          const openingContent = startStep === 'review'
            ? 'I pulled your target audience from your description. Review and name your avatar below, then we\'ll build the ad.'
            : `Got some info from your description. ${AVATAR_STEP_MESSAGES[startStep]}`

          setSectionChats(prev => ({ ...prev, avatar: [{ role: 'assistant', content: openingContent }] }))

          if (startStep === 'review') {
            setCurrentBubbles([])
          } else if (DYNAMIC_AVATAR_STEPS.has(startStep)) {
            generateDynamicAvatarBubbles(startStep, newAvatarData)
          } else {
            const staticBubbles = {
              industry: INDUSTRY_BUBBLES,
              role: isTrade(newAvatarData.industry) ? ROLE_BUBBLES_TRADES : ROLE_BUBBLES_DEFAULT,
              businessSize: BUSINESS_SIZE_BUBBLES,
              ageRange: AGE_RANGE_BUBBLES,
              mediaTrust: MEDIA_TRUST_BUBBLES,
            }
            setCurrentBubbles(staticBubbles[startStep] || [])
          }
        }
      }
    } catch (err) {
      console.error('Idea extraction error:', err)
    }

    setAdEntryMode('working')
    setIsParsingIdea(false)
  }

  async function handleRestart() {
    const hasWork = SECTIONS.some(s => sectionValues[s] !== null)

    if (!hasWork && !storedIdeaText) {
      doFullReset()
      return
    }

    setIsBuildingSummary(true)

    const contextParts = []
    if (storedIdeaText) contextParts.push(`Original idea: ${storedIdeaText.slice(0, 300)}`)
    if (selectedAvatar?.name) contextParts.push(`Avatar: ${selectedAvatar.name}`)
    if (sectionValues.hook) contextParts.push(`Hook: ${sectionValues.hook}`)
    if (sectionValues.image) contextParts.push(`Image: ${sectionValues.image}`)
    if (sectionValues.headline) contextParts.push(`Headline: ${sectionValues.headline}`)
    if (sectionValues.primary_text) contextParts.push(`Copy: ${sectionValues.primary_text.slice(0, 120)}`)
    if (sectionValues.cta) contextParts.push(`CTA: ${sectionValues.cta}`)

    const summarySystem = `Based on this ad creation progress, write 2–3 very concise sentences capturing the core ad idea — the target audience, the main angle, and the direction taken. Be specific and concrete, not generic. Plain text only, no JSON, no markdown, no bullets.`

    let summary = contextParts.join(' | ')
    try {
      const raw = await callAPI(
        'avatar',
        [{ role: 'user', content: contextParts.join('\n') }],
        sectionValues,
        selectedAvatar,
        [],
        summarySystem,
      )
      if (raw.trim()) summary = raw.trim()
    } catch (_) {}

    setResetModal({ summary })
    setIsBuildingSummary(false)
  }

  function doFullReset() {
    setResetModal(null)
    setCopied(false)
    setAdEntryMode('entry')
    setFreeformIdeaText('')
    setStoredIdeaText('')
    setSectionChats(EMPTY_SECTION_OBJ())
    setSectionValues(EMPTY_VALUES_OBJ())
    setActiveSection('avatar')
    setCurrentBubbles([])
    setSelectedBubbles([])
    setSelectedAngles([])
    setSelectedSubcategories([])
    setExpandedCategory(null)
    setExtraSubcategories({})
    setTypeOwn('')
    setImageB64(null)
    setImageError(null)
    setImageFormat(null)
    setImageVersions([])
    setSelectedImageIds([])
    setCurrentImageIdx(0)
    setCurrentDraftId(null)
    setUnsavedPrompt(null)
    setImageViewMode('single')
    setImgMultiExpanded({})
    setPlatformDropdownOpen(false)
    setImgSelectMsg(null)
    setSelectedAvatar(null)
    setSelectedPlatform(null)
    initAvatarFunnel()
  }

  // ─── Section reset ────────────────────────────────────────────────────────────

  function handleResetSection(section) {
    const sectionIdx = SECTIONS.indexOf(section)
    const downstreamConfirmed = SECTIONS.slice(sectionIdx + 1).filter(s => sectionValues[s] !== null)
    const warningMsg = downstreamConfirmed.length > 0
      ? `${SECTION_LABELS[section]} was reset. Your downstream sections (${downstreamConfirmed.map(s => SECTION_LABELS[s]).join(', ')}) were built from the old ${SECTION_LABELS[section]}. Consider resetting those too for consistency.`
      : null

    setSectionChats(prev => ({ ...prev, [section]: [] }))
    setSectionValues(prev => ({ ...prev, [section]: null }))
    if (section === 'image') {
      setImageB64(null)
      setImageFormat(null)
      setImageVersions([])
      setSelectedImageIds([])
      setCurrentImageIdx(0)
      setImageViewMode('single')
      setImgMultiExpanded({})
    }
    if (section === activeSection) {
      setCurrentBubbles([])
      setSelectedBubbles([])
      setSelectedAngles([])
      setSelectedSubcategories([])
      setExpandedCategory(null)
      setExtraSubcategories({})
      const newSvs = { ...sectionValues, [section]: null }
      openSection(section, newSvs, selectedAvatar, []).then(() => {
        if (warningMsg) {
          setSectionChats(prev => ({
            ...prev,
            [section]: [...prev[section], { role: 'assistant', content: warningMsg }],
          }))
        }
      })
    } else {
      if (warningMsg) {
        setSectionChats(prev => ({
          ...prev,
          [section]: [{ role: 'assistant', content: warningMsg }],
        }))
      }
    }
  }

  function getAngleColor(angle) {
    const angles = SECTION_ANGLES[activeSection] || []
    const idx = angles.indexOf(angle)
    return ANGLE_COLORS[idx % ANGLE_COLORS.length]
  }

  function getParentAngle(sub) {
    const subs = SECTION_SUBCATEGORIES[activeSection] || {}
    for (const [angle, subList] of Object.entries(subs)) {
      if (subList.includes(sub)) return angle
      if ((extraSubcategories[angle] || []).includes(sub)) return angle
    }
    return null
  }

  function handleAngleToggle(angle) {
    if (expandedCategory === angle) {
      // Collapse + remove from filters + clear its subcategory selections
      setExpandedCategory(null)
      setSelectedAngles(prev => prev.filter(a => a !== angle))
      const subs = [
        ...(SECTION_SUBCATEGORIES[activeSection]?.[angle] || []),
        ...(extraSubcategories[angle] || []),
      ]
      setSelectedSubcategories(prev => prev.filter(s => !subs.includes(s)))
    } else {
      // Expand this angle (collapse any previous)
      setExpandedCategory(angle)
      if (!selectedAngles.includes(angle)) {
        const total = selectedAngles.length + selectedSubcategories.length
        if (total < 3) {
          setSelectedAngles(prev => [...prev, angle])
        }
      }
    }
  }

  async function handleMoreSubOptions(angle) {
    const existing = [
      ...(SECTION_SUBCATEGORIES[activeSection]?.[angle] || []),
      ...(extraSubcategories[angle] || []),
    ]
    const system = `Generate exactly 6 niche subcategory options for the angle "${angle}" in the "${activeSection}" section of a Facebook/Instagram ad builder.
Do NOT repeat these: [${existing.join(', ')}]
Return JSON only: {"options":["opt1","opt2","opt3","opt4","opt5","opt6"]}`
    setMoreSubsLoading(prev => ({ ...prev, [angle]: true }))
    try {
      const raw = await callAPI(
        activeSection,
        [{ role: 'user', content: `More subcategory options for angle: ${angle}` }],
        sectionValues,
        selectedAvatar,
        [],
        system,
      )
      const parsed = parseResponse(raw)
      if (parsed?.options) {
        setExtraSubcategories(prev => ({
          ...prev,
          [angle]: [...(prev[angle] || []), ...parsed.options],
        }))
      }
    } catch (err) {
      console.error('More sub options error:', err)
    }
    setMoreSubsLoading(prev => ({ ...prev, [angle]: false }))
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

  function handleAddTypeOwn() {
    if (!typeOwn.trim()) return
    if (activeSection === 'avatar') {
      handleAvatarTypeOwn(typeOwn.trim())
      return
    }
    const val = typeOwn.trim()
    setTypeOwn('')
    setCurrentBubbles(prev => prev.includes(val) ? prev : [...prev, val])
    setSelectedBubbles(prev => {
      if (prev.includes(val)) return prev
      if (prev.length < 2) return [...prev, val]
      return [prev[1], val]
    })
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

  // Undo last bubble generation
  function handleUndoBubbles() {
    if (bubbleHistory.length === 0) return
    const prev = bubbleHistory[bubbleHistory.length - 1]
    setBubbleHistory(h => h.slice(0, -1))
    setCurrentBubbles(prev)
    setSelectedBubbles([])
  }

  // Helper to push current bubbles to history before replacing them
  function pushBubbleHistory() {
    if (activeSection && activeSection !== 'avatar' && currentBubbles.length > 0) {
      setBubbleHistory(h => [...h.slice(-4), [...currentBubbles]])
    }
  }

  // Avatar restart: save current data then start a fresh funnel
  async function avatarRestartSaveAndNew() {
    const name = avatarNameInput.trim()
    if (!name) { setAvatarRestartModal(false); initAvatarFunnel(); setActiveSection('avatar'); return }
    try {
      const body = {
        name,
        age_range: avatarData.ageRange || '',
        niche: [avatarData.industry, avatarData.role].filter(Boolean).join(' - '),
        what_they_want: avatarData.wants || '',
        what_they_fear: avatarData.fears || '',
        what_they_trust: avatarData.mediaTrust || '',
        primary_emotion: [avatarData.fears, avatarData.frustrations].filter(Boolean).join(' / '),
      }
      if (avatarEditingId) {
        await fetch('/api/avatars', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: avatarEditingId, ...body }) })
      } else {
        await fetch('/api/avatars', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      await loadAvatars()
    } catch (err) { console.error('avatarRestartSaveAndNew error:', err) }
    setAvatarRestartModal(false)
    setAvatarEditingId(null)
    initAvatarFunnel()
    setActiveSection('avatar')
  }

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const allConfirmed = SECTIONS.every(s => sectionValues[s] !== null)
  const hasUnsavedWork = SECTIONS.some(s => sectionValues[s] !== null)
  const canSaveDraft = sectionValues.hook !== null
  const activeSectionIdx = SECTIONS.indexOf(activeSection)
  const sectionAngles = SECTION_ANGLES[activeSection] || []
  const canSubmit = selectedBubbles.length === 1 && !isLoading
  // REFINE shows whenever there is at least one selected bubble OR typed text.
  // Covers: 1 bubble, 2 bubbles, 1 bubble + text, or text alone — in every section.
  const canRefine = !isLoading && activeSection && activeSection !== 'avatar' &&
    (selectedBubbles.length >= 1 || !!typeOwn.trim())
  const avatarStepIdx = AVATAR_FUNNEL_STEPS.indexOf(avatarFunnelStep)
  const activeStepForMax = avatarEditingField || avatarFunnelStep
  const avatarMaxSelect = activeStepForMax === 'mediaTrust' ? 4 : 2

  // Shared bubble button styles for avatar funnel
  function avatarBubbleStyle(bubble) {
    const selected = avatarSelectedBubbles.includes(bubble)
    return {
      border: `1px solid ${selected ? '#2990fa' : '#152840'}`,
      background: selected ? '#0a1f3f' : '#060d1f',
      color: '#ffffff',
      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
      fontSize: '0.88rem', fontFamily: 'var(--font-inter)',
      lineHeight: 1.4, textAlign: 'left', width: '100%', boxSizing: 'border-box',
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  // Profile lock screen
  if (!selectedProfile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 160px)', gap: 20 }}>
        <svg width="48" height="48" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="13" fill="#2990fa" />
          <path d="M9 10 L15 21 L21 10" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.8rem', color: '#ffffff', letterSpacing: '0.05em', textAlign: 'center' }}>
          Create your profile first
        </div>
        <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.65rem', color: '#ffffff', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
          Jarvis needs to know who you are before building ads.
        </div>
        <button
          onClick={onGoToProfile}
          style={{ background: '#2990fa', border: 'none', color: '#ffffff', borderRadius: 8, padding: '12px 24px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.06em' }}
        >
          Go to Profile
        </button>
      </div>
    )
  }

  // Freeform entry screen
  if (adEntryMode === 'entry') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: '2rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* AI opening bubble */}
          <div style={{ alignSelf: 'flex-start', background: '#0a1628', border: '1px solid rgba(41,144,250,0.3)', borderRadius: 12, padding: '16px 20px', maxWidth: '92%' }}>
            <div style={{ color: '#ffffff', fontSize: '0.95rem', fontFamily: 'var(--font-inter)', lineHeight: 1.75 }}>
              What's the idea behind this ad?
              <br /><br />
              Tell me your offer, who you're targeting, the angle you want to hit, or your full vision. Write as much or as little as you want — I'll pull out what I need and ask about the rest as we build.
            </div>
          </div>

          {isParsingIdea ? (
            <div style={{ textAlign: 'center', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.72rem', letterSpacing: '0.1em', padding: '36px 0' }}>
              Analysing your idea...
            </div>
          ) : (
            <>
              <textarea
                value={freeformIdeaText}
                onChange={e => setFreeformIdeaText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleIdeaSubmit() }}
                placeholder="e.g. HVAC company in Phoenix targeting homeowners. Same-day AC repair, family-owned 12 years. Lead with the fear of breaking down in summer heat. Bold cinematic image — sweating family. CTA: Call Now. Meta ad."
                rows={5}
                style={{
                  width: '100%', background: '#060d1f', border: '1px solid #2990fa',
                  color: '#ffffff', padding: '14px 16px', borderRadius: 10,
                  fontSize: '0.95rem', fontFamily: 'var(--font-inter)', lineHeight: 1.6,
                  resize: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleIdeaSubmit}
                disabled={!freeformIdeaText.trim()}
                style={{
                  background: freeformIdeaText.trim() ? '#2990fa' : '#0a1628',
                  border: '1px solid #2990fa', borderRadius: 8, padding: '14px 0',
                  color: freeformIdeaText.trim() ? '#ffffff' : '#4a6a8a',
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.85rem',
                  cursor: freeformIdeaText.trim() ? 'pointer' : 'not-allowed',
                  width: '100%', letterSpacing: '0.06em',
                }}
              >
                CONTINUE →
              </button>
              <button
                onClick={() => setAdEntryMode('working')}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#ffffff',
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.76rem',
                  cursor: 'pointer', letterSpacing: '0.06em',
                  textDecoration: 'underline', textAlign: 'center', padding: '4px 0',
                }}
              >
                Skip to Assisted Mode →
              </button>
            </>
          )}

        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', overflow: 'hidden' }}>

        {/* ── MAIN GRID ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeSection === 'image'
            ? `${COL_SIZES[leftColIdx]}fr ${COL_SIZES[centerColIdx]}fr 200px`
            : '1fr 200px',
          gap: activeSection === 'image' ? 12 : 20,
          flex: 1, minHeight: 0, overflow: 'hidden', padding: '20px 8px',
          alignItems: 'start',
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', overflow: 'hidden' }}>

            {/* 1. Section title row — label only, no nav arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 6px 0', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.0rem', color: activeSection ? '#2990fa' : 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
                {activeSection ? SECTION_LABELS[activeSection] : 'SELECT SECTION'}
              </div>
            </div>

            {/* 1b. Undo + text-size controls — not in image section */}
            {activeSection && activeSection !== 'avatar' && activeSection !== 'image' && (
              <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <button
                  onClick={handleUndoBubbles}
                  disabled={bubbleHistory.length === 0}
                  title="Undo last options"
                  style={{ background: 'transparent', border: '1px solid #152840', color: bubbleHistory.length === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)', borderRadius: 5, padding: '2px 8px', fontSize: '0.75rem', cursor: bubbleHistory.length === 0 ? 'default' : 'pointer', fontFamily: 'var(--font-ibm-plex-mono)' }}
                >↩</button>
                <button
                  onClick={() => setChatFontScale(prev => Math.max(0, prev - 1))}
                  disabled={chatFontScale === 0}
                  title="Smaller text"
                  style={{ background: 'transparent', border: '1px solid #152840', color: chatFontScale === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)', borderRadius: 5, padding: '2px 7px', fontSize: '0.68rem', cursor: chatFontScale === 0 ? 'default' : 'pointer', fontFamily: 'var(--font-ibm-plex-mono)' }}
                >A−</button>
                <button
                  onClick={() => setChatFontScale(prev => Math.min(FONT_SCALES.length - 1, prev + 1))}
                  disabled={chatFontScale === FONT_SCALES.length - 1}
                  title="Larger text"
                  style={{ background: 'transparent', border: '1px solid #152840', color: chatFontScale === FONT_SCALES.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)', borderRadius: 5, padding: '2px 7px', fontSize: '0.68rem', cursor: chatFontScale === FONT_SCALES.length - 1 ? 'default' : 'pointer', fontFamily: 'var(--font-ibm-plex-mono)' }}
                >A+</button>
              </div>
            )}

            {/* 2. Chat messages area — always visible */}
            <div ref={chatScrollRef} style={{
              flex: 1, minHeight: 80,
              overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: 12, background: '#060d1f', borderRadius: 10, border: '1px solid #152840',
              marginBottom: 10,
            }}>
              {activeSection === null && (
                <div style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-inter)', fontSize: '0.88rem', textAlign: 'center', paddingTop: 24 }}>
                  Select a section to continue
                </div>
              )}
              {activeSection && (sectionChats[activeSection] || [])
                .map((msg, idx) => ({ msg, idx, text: chatDisplayText(msg) }))
                .filter(x => x.text !== null)
                .map(({ msg, idx, text }) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: msg.role === 'user' ? '#2990fa' : '#0a1628',
                    border: msg.role === 'assistant' ? '1px solid rgba(41,144,250,0.3)' : 'none',
                    color: '#ffffff', padding: '10px 14px', borderRadius: 10,
                    maxWidth: '80%', fontSize: `${0.92 * FONT_SCALES[chatFontScale]}rem`, lineHeight: 1.5,
                    fontFamily: 'var(--font-inter)', whiteSpace: 'pre-wrap',
                  }}>
                    {text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div style={{ color: '#2990fa', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)', padding: '4px 0' }}>
                  Generating...
                </div>
              )}
            </div>

            {/* 3a. Avatar selector — shown at top of avatar section when avatars exist */}
            {activeSection === 'avatar' && avatars.length > 0 && !avatarEditMode && (
              <div style={{ flexShrink: 0, marginBottom: 8 }}>
                <div style={{ fontSize: '0.46rem', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Your Avatars
                </div>
                {avatars.map(av => (
                  <div key={av.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <div
                      onClick={() => handleAvatarSelect(av)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        background: selectedAvatar?.id === av.id ? '#2990fa' : '#060d1f',
                        border: `1px solid ${selectedAvatar?.id === av.id ? '#2990fa' : '#152840'}`,
                        fontSize: '0.82rem', color: '#ffffff', fontFamily: 'var(--font-inter)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <span>{av.name}</span>
                      {selectedAvatar?.id === av.id && <span style={{ fontSize: '0.55rem', opacity: 0.85 }}>✓</span>}
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setAvatarMenuPos({ top: rect.bottom + 4, left: rect.left })
                        setAvatarDropdown(prev => prev === av.id ? null : av.id)
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#2990fa', fontSize: '1.1rem', cursor: 'pointer', padding: '4px 8px', flexShrink: 0, lineHeight: 1 }}
                    >⋯</button>
                  </div>
                ))}
                <div style={{ height: 1, background: '#152840', margin: '8px 0 10px 0' }} />
              </div>
            )}

            {/* 3. Controls area — conditional */}
            {activeSection === 'avatar' ? (

              avatarEditMode ? (
                /* ── EDIT MODE ── */
                avatarEditingField !== null ? (
                  /* Field editing */
                  <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45vh', marginBottom: 8 }}>
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
                  <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45vh', marginBottom: 8 }}>
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
                            {avatarData[field] || <span style={{ color: 'rgba(255,255,255,0.55)' }}>—</span>}
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
                <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45vh', marginBottom: 8 }}>
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
                      placeholder="Give this avatar a name..."
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
                  <button
                    onClick={() => setAvatarRestartModal(true)}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '8px 0', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.72rem', cursor: 'pointer', width: '100%', marginTop: 6 }}
                  >
                    ↺ Restart Avatar
                  </button>
                </div>

              ) : (
                /* ── AVATAR FUNNEL STEPS ── */
                <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45vh', marginBottom: 8 }}>
                  {/* Restart button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                    <button
                      onClick={() => setAvatarRestartModal(true)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.55rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', letterSpacing: '0.06em' }}
                    >
                      ↺ Restart
                    </button>
                  </div>
                  {/* Step indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.6rem', color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)' }}>
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
              <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45vh', marginBottom: 8 }}>
                {/* Angle buttons with subcategories */}
                {sectionAngles.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    {/* Active filter chips */}
                    {(selectedAngles.length > 0 || selectedSubcategories.length > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {selectedAngles.map(angle => {
                          const color = getAngleColor(angle)
                          return (
                            <button
                              key={angle}
                              onClick={() => {
                                setSelectedAngles(prev => prev.filter(a => a !== angle))
                                if (expandedCategory === angle) setExpandedCategory(null)
                                const subs = [
                                  ...(SECTION_SUBCATEGORIES[activeSection]?.[angle] || []),
                                  ...(extraSubcategories[angle] || []),
                                ]
                                setSelectedSubcategories(prev => prev.filter(s => !subs.includes(s)))
                              }}
                              style={{
                                background: color + '22', border: `1px solid ${color}`, color,
                                padding: '3px 8px', borderRadius: 12, fontSize: '0.65rem',
                                fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              {angle} ×
                            </button>
                          )
                        })}
                        {selectedSubcategories.map(sub => {
                          const parent = getParentAngle(sub)
                          const color = parent ? getAngleColor(parent) : '#2990fa'
                          return (
                            <button
                              key={sub}
                              onClick={() => setSelectedSubcategories(prev => prev.filter(s => s !== sub))}
                              style={{
                                background: color + '22', border: `1px solid ${color}`, color,
                                padding: '3px 8px', borderRadius: 12, fontSize: '0.65rem',
                                fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              {sub} ×
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Category buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: expandedCategory ? 6 : 0 }}>
                      {sectionAngles.map(angle => {
                        const color = getAngleColor(angle)
                        const isActive = expandedCategory === angle || selectedAngles.includes(angle)
                        return (
                          <button
                            key={angle}
                            onClick={() => handleAngleToggle(angle)}
                            style={{
                              border: `1px solid ${isActive ? color : '#152840'}`,
                              background: isActive ? color + '22' : '#060d1f',
                              color: isActive ? color : '#ffffff',
                              padding: '7px 16px', borderRadius: 20,
                              fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', cursor: 'pointer',
                            }}
                          >
                            {angle}
                          </button>
                        )
                      })}
                    </div>

                    {/* Expanded subcategory list — only one at a time */}
                    {expandedCategory && (() => {
                      const angle = expandedCategory
                      const color = getAngleColor(angle)
                      const baseSubs = SECTION_SUBCATEGORIES[activeSection]?.[angle] || []
                      const extraSubs = extraSubcategories[angle] || []
                      const allSubs = [...baseSubs, ...extraSubs]
                      if (!allSubs.length) return null
                      return (
                        <div style={{ marginBottom: 4, paddingLeft: 4 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                            {allSubs.map(sub => (
                              <button
                                key={sub}
                                onClick={() => handleSubcategoryToggle(angle, sub)}
                                style={{
                                  background: selectedSubcategories.includes(sub) ? color + '22' : '#060d1f',
                                  border: `1px solid ${selectedSubcategories.includes(sub) ? color : '#1d3a58'}`,
                                  color: selectedSubcategories.includes(sub) ? color : '#ffffff',
                                  padding: '4px 10px', borderRadius: 12,
                                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', cursor: 'pointer',
                                }}
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => handleMoreSubOptions(angle)}
                            disabled={moreSubsLoading[angle]}
                            style={{
                              color, background: 'transparent', border: 'none',
                              cursor: moreSubsLoading[angle] ? 'not-allowed' : 'pointer',
                              fontSize: '0.65rem', padding: '2px 0',
                              fontFamily: 'var(--font-inter)',
                              opacity: moreSubsLoading[angle] ? 0.5 : 1,
                            }}
                          >
                            {moreSubsLoading[angle] ? 'Loading...' : '+ More options'}
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Option bubbles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0', marginBottom: 8 }}>
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
                            color: '#ffffff', padding: `${14 * FONT_SCALES[chatFontScale]}px ${18 * FONT_SCALES[chatFontScale]}px`, borderRadius: 10, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            fontSize: `${1.0 * FONT_SCALES[chatFontScale]}rem`, fontFamily: 'var(--font-inter)', lineHeight: 1.5, minHeight: 44,
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
              </div>

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
              ) : (activeSection === 'avatar' && (avatarFunnelStep === 'review' || avatarEditMode)) ? null
              : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={typeOwn}
                    onChange={e => setTypeOwn(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (activeSection !== 'avatar' && activeSection !== null) {
                          handleSendToJarvis()
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
                      onClick={handleSendToJarvis}
                      disabled={isLoading}
                      style={{
                        border: `1px solid ${canRefine ? '#2990fa' : '#152840'}`,
                        background: canRefine ? '#2990fa' : 'transparent',
                        color: canRefine ? '#ffffff' : 'rgba(255,255,255,0.4)',
                        borderRadius: 8, padding: '8px 14px',
                        fontSize: canRefine ? '0.72rem' : '0.82rem',
                        fontFamily: 'var(--font-ibm-plex-mono)',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        flexShrink: 0, height: 36, boxSizing: 'border-box',
                        opacity: isLoading ? 0.5 : 1,
                        letterSpacing: canRefine ? '0.05em' : 0,
                      }}
                    >
                      {canRefine ? 'REFINE' : '→'}
                    </button>
                  )}
                  {/* GENERATE IMAGE — always visible in image section, greyed until a size is selected */}
                  {activeSection === 'image' && (
                    <button
                      onClick={handleGenerateImageClick}
                      disabled={!imageFormat}
                      title={imageFormat ? 'Generate image' : 'Select a size first'}
                      style={{
                        background: imageFormat ? '#2990fa' : '#0d1e2e',
                        border: `1px solid ${imageFormat ? '#2990fa' : '#1d3558'}`,
                        color: imageFormat ? '#ffffff' : '#2a4a6a',
                        borderRadius: 8, padding: '8px 12px',
                        fontSize: '0.68rem', fontFamily: 'var(--font-ibm-plex-mono)',
                        cursor: imageFormat ? 'pointer' : 'not-allowed',
                        flexShrink: 0, height: 36, boxSizing: 'border-box',
                        letterSpacing: '0.04em', whiteSpace: 'nowrap',
                      }}
                    >
                      GENERATE IMAGE
                    </button>
                  )}
                  {/* Regen with selected image as reference */}
                  {activeSection === 'image' && typeOwn.trim() && selectedImageIds.length > 0 && imageFormat && (
                    <button
                      onClick={handleRegenWithImage}
                      disabled={isLoading}
                      style={{ background: '#2990fa', border: 'none', color: '#ffffff', borderRadius: 8, padding: '8px 10px', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: isLoading ? 'not-allowed' : 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box', opacity: isLoading ? 0.5 : 1, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}
                    >
                      REGEN →
                    </button>
                  )}
                  {activeSection !== 'avatar' && activeSection !== 'image' && canSubmit && (
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

          {/* ── CENTER COLUMN — image workspace (only when image section active) ── */}
          {activeSection === 'image' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', overflow: 'hidden' }}>

              {/* Header row: new image + view toggle + center col resize */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
                <button
                  onClick={handleNewImage}
                  style={{
                    background: 'transparent', border: '1px solid #152840', color: 'rgba(255,255,255,0.6)',
                    borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                    fontSize: '0.52rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.06em',
                  }}
                >
                  + NEW IMAGE
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {['single', 'multi'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setImageViewMode(mode)}
                        style={{
                          background: imageViewMode === mode ? '#2990fa' : '#0a1628',
                          border: `1px solid ${imageViewMode === mode ? '#2990fa' : '#152840'}`,
                          borderRadius: 6, padding: '5px 9px', cursor: 'pointer',
                          fontSize: '0.52rem', fontFamily: 'var(--font-ibm-plex-mono)',
                          color: '#ffffff', letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Toast message */}
              {imgSelectMsg && (
                <div style={{ flexShrink: 0, textAlign: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.6rem', color: '#e5c07b', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.06em' }}>
                    {imgSelectMsg}
                  </span>
                </div>
              )}

              {imageViewMode === 'single' ? (
                /* ── SINGLE VIEW ── */
                (() => {
                  const allFrames = imageVersions
                  const totalFrames = allFrames.length
                  const hasFrames = totalFrames > 0
                  const clampedIdx = hasFrames ? Math.min(currentImageIdx, totalFrames - 1) : 0
                  const currentFrame = hasFrames ? allFrames[clampedIdx] : null
                  const isReady = !!currentFrame?.b64
                  const isGenerating = !!currentFrame?.isGenerating
                  const isError = !!currentFrame?.error
                  const isPendingOrEmpty = !hasFrames || (currentFrame && !isReady && !isGenerating && !isError)
                  const frameFormat = currentFrame?.format || imageFormat
                  const frameRatio = frameFormat === '1:1' ? '1/1' : frameFormat === '4:5' ? '4/5' : frameFormat === '16/9' ? '16/9' : frameFormat === '9/16' ? '9/16' : null

                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: 4 }}>

                      {/* ── CAROUSEL (peek effect) ── */}
                      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>

                        {/* Left peek — previous frame */}
                        {hasFrames && clampedIdx > 0 && (() => {
                          const lf = allFrames[clampedIdx - 1]
                          const lFmt = lf.format || imageFormat
                          const lRatio = lFmt === '1:1' ? '1/1' : lFmt === '4:5' ? '4/5' : lFmt === '16/9' ? '16/9' : '9/16'
                          return (
                            <div
                              onClick={() => setCurrentImageIdx(clampedIdx - 1)}
                              style={{
                                position: 'absolute', left: 0, zIndex: 2,
                                height: '56%', aspectRatio: lRatio,
                                transform: 'translateX(-62%)',
                                borderRadius: 8, overflow: 'hidden',
                                background: '#060d1f',
                                border: '1px solid rgba(41,144,250,0.12)',
                                opacity: 0.5, cursor: 'pointer',
                              }}
                            >
                              {lf.b64 && <img src={`data:image/png;base64,${lf.b64}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                              {lf.isGenerating && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="img-pulse" style={{ fontSize: '1.2rem' }}>⚡</span></div>}
                            </div>
                          )
                        })()}

                        {/* Center frame */}
                        <div
                          onClick={() => isReady && handleImageVersionClick(currentFrame)}
                          style={{
                            ...(frameRatio
                              ? { aspectRatio: frameRatio, maxHeight: 'calc(100vh - 420px)' }
                              : { width: 180, height: 240 }),
                            maxWidth: '80%', minWidth: 80,
                            overflow: 'hidden', borderRadius: 10, flexShrink: 0,
                            border: (isReady && selectedImageIds.includes(currentFrame?.id))
                              ? '2px solid #2990fa'
                              : '1px solid rgba(41,144,250,0.18)',
                            background: '#060d1f',
                            cursor: isReady ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', zIndex: 3,
                          }}
                        >
                          {isReady ? (
                            <>
                              <img src={`data:image/png;base64,${currentFrame.b64}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {/* Download icon — inside image, bottom-right */}
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  const name = (sectionValues.hook || 'velpi-image').replace(/[^a-z0-9]/gi, '-').toLowerCase()
                                  const a = document.createElement('a')
                                  a.href = `data:image/png;base64,${currentFrame.b64}`
                                  a.download = `${name}.png`
                                  a.click()
                                }}
                                title="Download"
                                style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#ffffff', borderRadius: 5, padding: '4px 7px', cursor: 'pointer', fontSize: '0.85rem', zIndex: 4 }}
                              >⬇</button>
                              {selectedImageIds.includes(currentFrame.id) && (
                                <div style={{ position: 'absolute', top: 6, right: 6, background: '#2990fa', borderRadius: 4, padding: '2px 6px', fontSize: '0.46rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#fff' }}>✓</div>
                              )}
                            </>
                          ) : isGenerating ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
                              <span className="img-pulse" style={{ fontSize: '2rem', lineHeight: 1 }}>⚡</span>
                              <div style={{ fontSize: '0.55rem', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.1em' }}>GENERATING</div>
                              <div style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-ibm-plex-mono)' }}>~20 seconds</div>
                            </div>
                          ) : isError ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 20 }}>
                              <div style={{ fontSize: '1.2rem' }}>⚠</div>
                              <div style={{ fontSize: '0.52rem', color: '#ff4455', fontFamily: 'var(--font-ibm-plex-mono)', textAlign: 'center' }}>FAILED</div>
                              <button
                                onClick={e => { e.stopPropagation(); generateImageVersion(currentFrame.prompt || dallePrompt || sectionValues.image || '', currentFrame.format || imageFormat || '9/16', [], currentFrame.parentId) }}
                                style={{ background: 'transparent', border: '1px solid #ff4455', borderRadius: 6, padding: '4px 10px', color: '#ff4455', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem', cursor: 'pointer' }}
                              >Retry</button>
                            </div>
                          ) : (
                            /* Placeholder */
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 24 }}>
                              <div style={{ fontSize: '2rem', opacity: 0.08 }}>⚡</div>
                              <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.9 }}>
                                {imageFormat ? 'CLICK GENERATE IMAGE ON THE LEFT' : 'SELECT A SIZE BELOW'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right peek — next frame */}
                        {hasFrames && clampedIdx < totalFrames - 1 && (() => {
                          const rf = allFrames[clampedIdx + 1]
                          const rFmt = rf.format || imageFormat
                          const rRatio = rFmt === '1:1' ? '1/1' : rFmt === '4:5' ? '4/5' : rFmt === '16/9' ? '16/9' : '9/16'
                          return (
                            <div
                              onClick={() => setCurrentImageIdx(clampedIdx + 1)}
                              style={{
                                position: 'absolute', right: 0, zIndex: 2,
                                height: '56%', aspectRatio: rRatio,
                                transform: 'translateX(62%)',
                                borderRadius: 8, overflow: 'hidden',
                                background: '#060d1f',
                                border: '1px solid rgba(41,144,250,0.12)',
                                opacity: 0.5, cursor: 'pointer',
                              }}
                            >
                              {rf.b64 && <img src={`data:image/png;base64,${rf.b64}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                              {rf.isGenerating && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="img-pulse" style={{ fontSize: '1.2rem' }}>⚡</span></div>}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Size buttons — below carousel */}
                      <div style={{ flexShrink: 0, display: 'flex', gap: 4, marginTop: 2 }}>
                        {[
                          { id: '9/16', label: '9:16', desc: 'Story' },
                          { id: '1:1', label: '1:1', desc: 'Square' },
                          { id: '4:5', label: '4:5', desc: 'Portrait' },
                          { id: '16/9', label: '16:9', desc: 'Wide' },
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => handleSizeClick(f.id)}
                            style={{
                              flex: 1,
                              background: imageFormat === f.id ? '#2990fa' : '#0a1628',
                              border: `2px solid ${imageFormat === f.id ? '#2990fa' : '#152840'}`,
                              borderRadius: 8, padding: '6px 4px', cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            }}
                          >
                            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#ffffff', fontWeight: 600 }}>{f.label}</span>
                            <span style={{ fontSize: '0.42rem', fontFamily: 'var(--font-ibm-plex-mono)', color: imageFormat === f.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)' }}>{f.desc}</span>
                          </button>
                        ))}
                      </div>

                      {/* Counter + prompt */}
                      {hasFrames && (
                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-ibm-plex-mono)', marginBottom: 2 }}>
                            {clampedIdx + 1} / {totalFrames}
                          </div>
                          {(currentFrame?.sentPrompt || currentFrame?.prompt) && (
                            <div
                              title={currentFrame.sentPrompt || currentFrame.prompt}
                              style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-ibm-plex-mono)', maxWidth: 240, margin: '0 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {currentFrame.isEdit ? '✎ edit · ' : ''}{currentFrame.sentPrompt || currentFrame.prompt}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUBMIT IMAGE */}
                      {isReady && (
                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                          <button
                            onClick={() => handleImageSubmit(currentFrame)}
                            style={{
                              background: '#2990fa', border: 'none', color: '#ffffff',
                              borderRadius: 8, padding: '9px 24px',
                              fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.72rem',
                              cursor: 'pointer', letterSpacing: '0.06em',
                            }}
                          >
                            SUBMIT IMAGE →
                          </button>
                        </div>
                      )}

                      {/* Reference select hint */}
                      {selectedImageIds.length > 0 && (
                        <div style={{ flexShrink: 0, textAlign: 'center', fontSize: '0.44rem', color: 'rgba(41,144,250,0.6)', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.06em' }}>
                          {selectedImageIds.length === 2 ? '2 refs selected — GENERATE IMAGE to blend' : '1 ref selected — GENERATE IMAGE to use as reference'}
                        </div>
                      )}
                    </div>
                  )
                })()

              ) : (
                /* ── MULTI VIEW ── */
                (() => {
                  const topLevel = imageVersions.filter(v => !v.parentId && !v.isPending)
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: 8 }}>

                      {/* Reference indicator — GENERATE IMAGE lives in the left column */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, minHeight: 4 }}>
                        {selectedImageIds.length > 0 && (
                          <span style={{ fontSize: '0.5rem', color: 'rgba(41,144,250,0.7)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                            {selectedImageIds.length} ref{selectedImageIds.length > 1 ? 's' : ''} selected
                          </span>
                        )}
                      </div>

                      {/* Image grid with parent/child folders */}
                      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                        {topLevel.length === 0 && (
                          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.58rem', fontFamily: 'var(--font-ibm-plex-mono)', paddingTop: 32 }}>
                            No images yet — generate one
                          </div>
                        )}
                        {topLevel.map(parent => {
                          const children = imageVersions.filter(v => v.parentId === parent.id && !v.isPending)
                          const isExpanded = !!imgMultiExpanded[parent.id]
                          const pRatio = parent.format === '1:1' ? '1/1' : parent.format === '4:5' ? '4/5' : parent.format === '16/9' ? '16/9' : '9/16'
                          const pSelRef = selectedImageIds.includes(parent.id)
                          return (
                            <div key={parent.id} style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                {/* Parent thumbnail */}
                                <div
                                  onClick={() => handleImageVersionClick(parent)}
                                  style={{
                                    width: 68, aspectRatio: pRatio, flexShrink: 0,
                                    borderRadius: 6, overflow: 'hidden',
                                    border: pSelRef ? '2px solid #2990fa' : '1px solid rgba(41,144,250,0.2)',
                                    background: '#060d1f', cursor: parent.b64 ? 'pointer' : 'default',
                                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}
                                >
                                  {parent.b64 ? (
                                    <>
                                      <img src={`data:image/png;base64,${parent.b64}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      {pSelRef && <div style={{ position: 'absolute', top: 2, right: 2, background: '#2990fa', borderRadius: 3, padding: '1px 4px', fontSize: '0.44rem', color: '#fff' }}>✓</div>}
                                    </>
                                  ) : parent.isGenerating ? (
                                    <span className="img-pulse" style={{ fontSize: '1.2rem', opacity: 0.5 }}>⚡</span>
                                  ) : parent.error ? (
                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>⚠</span>
                                  ) : null}
                                </div>
                                {/* Info + download */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <span style={{ fontSize: '0.5rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa' }}>{parent.format || '9/16'}</span>
                                    {parent.b64 && (
                                      <button onClick={() => { const n=(sectionValues.hook||'velpi-image').replace(/[^a-z0-9]/gi,'-').toLowerCase(); const a=document.createElement('a'); a.href=`data:image/png;base64,${parent.b64}`; a.download=`${n}.png`; a.click() }} title="Download" style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:'0.7rem', padding:0, lineHeight:1 }}>⬇</button>
                                    )}
                                  </div>
                                  {parent.prompt && (
                                    <div style={{ fontSize: '0.54rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-inter)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis' }}>
                                      {parent.prompt}
                                    </div>
                                  )}
                                  {children.length > 0 && (
                                    <button
                                      onClick={() => setImgMultiExpanded(prev => ({ ...prev, [parent.id]: !prev[parent.id] }))}
                                      style={{ background: 'transparent', border: 'none', color: '#2990fa', fontSize: '0.5rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', padding: '3px 0', marginTop: 2 }}
                                    >
                                      {children.length} variation{children.length > 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Children row */}
                              {isExpanded && children.length > 0 && (
                                <div style={{ marginLeft: 20, marginTop: 6, display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4 }}>
                                  {children.map(child => {
                                    const cRatio = child.format === '1:1' ? '1/1' : child.format === '4:5' ? '4/5' : child.format === '16/9' ? '16/9' : '9/16'
                                    const cSelRef = selectedImageIds.includes(child.id)
                                    return (
                                      <div
                                        key={child.id}
                                        onClick={() => handleImageVersionClick(child)}
                                        style={{
                                          width: 50, aspectRatio: cRatio, flexShrink: 0,
                                          borderRadius: 5, overflow: 'hidden',
                                          border: cSelRef ? '2px solid #2990fa' : '1px solid rgba(41,144,250,0.15)',
                                          background: '#060d1f', cursor: child.b64 ? 'pointer' : 'default',
                                          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                      >
                                        {child.b64 ? (
                                          <>
                                            <img src={`data:image/png;base64,${child.b64}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {cSelRef && <div style={{ position: 'absolute', top: 2, right: 2, background: '#2990fa', borderRadius: 3, padding: '1px 4px', fontSize: '0.44rem', color: '#fff' }}>✓</div>}
                                          </>
                                        ) : child.isGenerating ? (
                                          <span className="img-pulse" style={{ fontSize: '1rem', opacity: 0.5 }}>⚡</span>
                                        ) : null}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* SUBMIT IMAGE */}
                      {selectedImageIds.length === 1 && imageVersions.find(v => v.id === selectedImageIds[0])?.b64 && (
                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                          <button
                            onClick={() => handleImageSubmit()}
                            style={{
                              background: '#2990fa', border: 'none', color: '#ffffff',
                              borderRadius: 8, padding: '9px 24px',
                              fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.72rem',
                              cursor: 'pointer', letterSpacing: '0.06em',
                            }}
                          >
                            SUBMIT IMAGE →
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}

            </div>
          )}

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', overflow: 'hidden' }}>
            {/* Scrollable panels area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

            {/* ── PLATFORM DROPDOWN ── */}
            <div style={{ position: 'relative', marginBottom: 2 }}>
              <button
                onClick={() => setPlatformDropdownOpen(prev => !prev)}
                style={{
                  width: '100%', background: '#0a1628', border: '1px solid #152840',
                  borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.5rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  PLATFORM
                </span>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {selectedPlatform || 'Select'} <span style={{ opacity: 0.45, fontSize: '0.5rem' }}>▾</span>
                </span>
              </button>
              {platformDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: '#0a1628', border: '1px solid #2990fa', borderRadius: 8, overflow: 'hidden', marginTop: 2 }}>
                  {[
                    { id: 'Meta', locked: false },
                    { id: 'TikTok', locked: true },
                    { id: 'YouTube', locked: true },
                    { id: 'Google', locked: true },
                    { id: 'LinkedIn', locked: true },
                  ].map(({ id, locked }) => (
                    <div
                      key={id}
                      onClick={locked ? undefined : () => { setSelectedPlatform(prev => prev === id ? null : id); setPlatformDropdownOpen(false) }}
                      style={{
                        padding: '8px 12px', cursor: locked ? 'default' : 'pointer',
                        color: locked ? '#1d3a58' : '#ffffff',
                        fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)',
                        background: selectedPlatform === id ? 'rgba(41,144,250,0.1)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <span>{id}</span>
                      {locked && <span style={{ fontSize: '0.48rem', color: '#1d3a58' }}>SOON</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {SECTIONS.map(section => {
              const isActive = activeSection === section
              const hasValue = !!sectionValues[section]
              const isLocked = sectionLockMsg === section
              return (
                <div
                  key={section}
                  onClick={() => gotoSection(section)}
                  style={{
                    background: isActive ? '#0a1628' : 'transparent',
                    border: `1px solid ${isActive ? '#2990fa' : '#152840'}`,
                    borderRadius: 10,
                    padding: isActive ? '12px 16px' : '7px 12px',
                    cursor: 'pointer',
                    opacity: activeSection === null ? 0.4 : (!hasValue && !isActive) ? 0.4 : 1,
                    position: 'relative',
                  }}
                >
                  {/* Label row — Reset only visible when active */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa',
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                    }}>
                      {SECTION_LABELS[section]}
                    </div>
                    {isActive && (
                      <button
                        onClick={e => { e.stopPropagation(); handleResetSection(section) }}
                        style={{ color: '#ff4455', fontSize: '0.58rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.06em' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Lock message */}
                  {isLocked && (
                    <div style={{ fontSize: '0.65rem', color: '#e5c07b', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 4, letterSpacing: '0.04em' }}>
                      Complete {SECTION_LABELS[SECTION_PREREQUISITES[section]]} first.
                    </div>
                  )}

                  {/* Image background generation indicator */}
                  {section === 'image' && !isActive && imageVersions.some(v => v.isGenerating) && (
                    <div style={{ marginTop: 3, fontSize: '0.5rem', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.04em' }}>
                      ⚡ Generating...
                    </div>
                  )}

                  {/* Image thumbnail — when active: thumbnail or placeholder; when not active: thumbnail only if confirmed */}
                  {section === 'image' && isActive && (
                    imageB64 ? (
                      <div style={{ marginTop: 6, width: 52, aspectRatio: '9/16', overflow: 'hidden', borderRadius: 4, opacity: 0.9 }}>
                        <img src={`data:image/png;base64,${imageB64}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ marginTop: 6, width: 52, aspectRatio: '9/16', borderRadius: 4, background: '#060d1f', border: '1px dashed rgba(41,144,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1rem', opacity: 0.12 }}>⚡</span>
                      </div>
                    )
                  )}
                  {section === 'image' && !isActive && imageB64 && hasValue && (
                    <div style={{ marginTop: 6, width: 52, aspectRatio: '9/16', overflow: 'hidden', borderRadius: 4, opacity: 0.9 }}>
                      <img src={`data:image/png;base64,${imageB64}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              )
            })}

            </div>{/* end scrollable panels */}

            {/* Action buttons — fixed below scroll, always visible */}
            <div style={{ flexShrink: 0, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allConfirmed && (
                <button
                  onClick={saveToLibrary}
                  style={{
                    background: '#2990fa', border: 'none', borderRadius: 10, padding: 12,
                    color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem',
                    cursor: 'pointer', width: '100%',
                  }}
                >
                  {saveSuccess ? 'Saved!' : 'Save to Library'}
                </button>
              )}
              <button
                onClick={handleRestart}
                disabled={isBuildingSummary}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: 'rgba(255,255,255,0.45)', padding: '7px 0', borderRadius: 8,
                  cursor: isBuildingSummary ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.58rem',
                  letterSpacing: '0.04em', width: '100%',
                }}
              >
                {isBuildingSummary ? '...' : '↺ Restart Session'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── UNSAVED WORK PROMPT ── */}
      {unsavedPrompt && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 4000,
            background: 'rgba(2,8,16,0.94)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#0a1628', border: '1px solid #2990fa',
              borderRadius: 12, padding: 28, width: '100%', maxWidth: 420,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.4rem', color: '#ffffff', letterSpacing: '0.05em' }}>
              Unsaved Work
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5, marginBottom: 4 }}>
              You have unsaved work. What do you want to do?
            </div>

            {canSaveDraft && (
              <>
                {currentDraftId && (
                  <button
                    onClick={async () => {
                      const { onContinue } = unsavedPrompt
                      setUnsavedPrompt(null)
                      await saveDraft(false)
                      onContinue?.()
                    }}
                    style={{
                      background: '#2990fa', border: 'none', borderRadius: 8,
                      padding: '12px 0', color: '#ffffff',
                      fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                      cursor: 'pointer', letterSpacing: '0.06em', width: '100%', textAlign: 'center',
                    }}
                  >
                    Save as current draft
                  </button>
                )}
                <button
                  onClick={async () => {
                    const { onContinue } = unsavedPrompt
                    setUnsavedPrompt(null)
                    await saveDraft(true)
                    onContinue?.()
                  }}
                  style={{
                    background: currentDraftId ? 'transparent' : '#2990fa',
                    border: currentDraftId ? '1px solid #2990fa' : 'none',
                    borderRadius: 8,
                    padding: '12px 0',
                    color: currentDraftId ? '#2990fa' : '#ffffff',
                    fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                    cursor: 'pointer', letterSpacing: '0.06em', width: '100%', textAlign: 'center',
                  }}
                >
                  Save as new draft
                </button>
              </>
            )}

            <button
              onClick={() => {
                const { onContinue } = unsavedPrompt
                setUnsavedPrompt(null)
                onContinue?.()
              }}
              style={{
                background: 'transparent', border: '1px solid rgba(255,68,85,0.5)', borderRadius: 8,
                padding: '12px 0', color: '#ff4455',
                fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                cursor: 'pointer', letterSpacing: '0.06em', width: '100%', textAlign: 'center',
              }}
            >
              Discard and continue
            </button>

            <button
              onClick={() => {
                const { onCancel } = unsavedPrompt
                setUnsavedPrompt(null)
                onCancel?.()
              }}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8,
                padding: '12px 0', color: '#ffffff',
                fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                cursor: 'pointer', letterSpacing: '0.06em', width: '100%', textAlign: 'center',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── RESET MODAL ── */}
      {resetModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(2,8,16,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#0a1628', border: '1px solid #2990fa',
              borderRadius: 12, padding: 28, width: '100%', maxWidth: 460,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.3rem', color: '#ffffff', letterSpacing: '0.05em' }}>
              YOUR IDEA SO FAR
            </div>

            {/* Summary card with inline copy button */}
            <div style={{ background: '#060d1f', border: '1px solid rgba(41,144,250,0.2)', borderRadius: 8, padding: '14px 16px', position: 'relative' }}>
              <div style={{
                color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem', lineHeight: 1.65,
                fontFamily: 'var(--font-inter)', paddingRight: 68,
              }}>
                {resetModal.summary}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(resetModal.summary)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2500)
                }}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  background: copied ? 'rgba(0,229,200,0.15)' : 'transparent',
                  border: `1px solid ${copied ? '#00e5c8' : 'rgba(41,144,250,0.45)'}`,
                  borderRadius: 6, padding: '5px 12px',
                  color: copied ? '#00e5c8' : '#2990fa',
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem',
                  cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <div style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-ibm-plex-mono)', textAlign: 'center', letterSpacing: '0.04em', lineHeight: 1.6 }}>
              Copy this and paste it into the next session to pick up where you left off
            </div>

            <button
              onClick={doFullReset}
              style={{
                background: '#2990fa', border: 'none', borderRadius: 8,
                padding: '13px 0', color: '#ffffff',
                fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                cursor: 'pointer', letterSpacing: '0.06em', width: '100%', textAlign: 'center',
              }}
            >
              Start Fresh
            </button>

            <button
              onClick={() => { setResetModal(null); setCopied(false) }}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 8, padding: '11px 0', color: '#ffffff',
                fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                cursor: 'pointer', letterSpacing: '0.06em', width: '100%', textAlign: 'center',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── AVATAR THREE DOTS POPUP ── */}
      {avatarDropdown && (
        <>
          <div onClick={() => setAvatarDropdown(null)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div style={{
            position: 'fixed', top: avatarMenuPos.top, left: avatarMenuPos.left,
            zIndex: 9999, background: '#0a1628', border: '1px solid #2990fa',
            borderRadius: 8, padding: 4, minWidth: 120, boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          }}>
            <div
              onClick={() => { const av = avatars.find(a => a.id === avatarDropdown); if (av) handleEditAvatarFromBar(av); setAvatarDropdown(null) }}
              style={{ padding: '8px 14px', color: '#ffffff', fontSize: '0.82rem', fontFamily: 'var(--font-inter)', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = '#152840'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >✎ Edit</div>
            <div
              onClick={() => { const av = avatars.find(a => a.id === avatarDropdown); if (av) { setAvatarDeleteConfirm(av); setAvatarDropdown(null) } }}
              style={{ padding: '8px 14px', color: '#ff4455', fontSize: '0.82rem', fontFamily: 'var(--font-inter)', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a0a0d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >🗑 Delete</div>
          </div>
        </>
      )}

      {/* ── AVATAR DELETE CONFIRM ── */}
      {avatarDeleteConfirm && (
        <div onClick={() => setAvatarDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(2,8,16,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid #ff4455', borderRadius: 12, padding: 28, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.4rem', color: '#ff4455', letterSpacing: '0.05em' }}>Delete Avatar</div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5 }}>
              Delete <strong>{avatarDeleteConfirm.name}</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { handleDeleteAvatar(avatarDeleteConfirm); setAvatarDeleteConfirm(null) }}
                style={{ flex: 1, background: '#ff4455', border: 'none', borderRadius: 8, padding: '11px 0', color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', cursor: 'pointer', letterSpacing: '0.06em' }}
              >DELETE</button>
              <button
                onClick={() => setAvatarDeleteConfirm(null)}
                style={{ flex: 1, background: 'transparent', border: '1px solid #2990fa', borderRadius: 8, padding: '11px 0', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', cursor: 'pointer', letterSpacing: '0.06em' }}
              >CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AVATAR RESTART MODAL ── */}
      {avatarRestartModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(2,8,16,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0a1628', border: '1px solid #2990fa', borderRadius: 12, padding: 28, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.2rem', color: '#ffffff', letterSpacing: '0.05em', marginBottom: 4 }}>
              AVATAR RESTART
            </div>
            <button
              onClick={avatarRestartSaveAndNew}
              style={{ background: '#2990fa', border: 'none', borderRadius: 8, padding: '12px 0', color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.04em', width: '100%' }}
            >
              Save and start new avatar
            </button>
            <button
              onClick={() => {
                setAvatarRestartModal(false)
                setAvatarEditingId(null)
                setAvatarNameInput('')
                setAvatarEditMode(false)
                setAvatarFunnelStep('review')
                setAvatarFunnelHistory([])
                setAvatarSelectedBubbles([])
                setCurrentBubbles([])
              }}
              style={{ background: 'transparent', border: '1px solid #2990fa', borderRadius: 8, padding: '11px 0', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.04em', width: '100%' }}
            >
              Duplicate this and restart fresh
            </button>
            <button
              onClick={async () => {
                setAvatarRestartModal(false)
                if (avatarEditingId) await handleDeleteAvatar({ id: avatarEditingId, name: avatarNameInput })
                else { initAvatarFunnel(); setActiveSection('avatar') }
              }}
              style={{ background: 'transparent', border: '1px solid rgba(255,68,85,0.5)', borderRadius: 8, padding: '11px 0', color: '#ff4455', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.04em', width: '100%' }}
            >
              Delete this completely and start over
            </button>
            <button
              onClick={() => setAvatarRestartModal(false)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '11px 0', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.04em', width: '100%' }}
            >
              Cancel
            </button>
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
