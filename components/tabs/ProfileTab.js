'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Industry bubbles (same as avatar funnel) ─────────────────────────────────

const INDUSTRY_BUBBLES = [
  'Home Services', 'Health & Wellness', 'Real Estate', 'Finance', 'Coaching & Consulting',
  'E-Commerce', 'Restaurants & Food', 'Fitness', 'Beauty & Aesthetics', 'Legal',
  'Construction & Trades', 'Automotive', 'Education', 'Technology', 'Retail',
  'Marketing & Advertising', 'Insurance', 'Dental & Medical', 'Accounting',
]

// ─── Services by industry ─────────────────────────────────────────────────────

const SERVICES_BY_INDUSTRY = {
  'Home Services': ['AC Installation','AC Repair','Heating Installation','Heating Repair','Duct Cleaning','Air Quality','Maintenance Plans','Emergency Service','Commercial HVAC','Plumbing','Electrical','Roofing','Painting','Flooring','General Contracting'],
  'Health & Wellness': ['Chiropractic','Massage Therapy','Nutritional Coaching','Mental Health Counseling','Physical Therapy','Personal Training','Yoga & Pilates','Acupuncture','Functional Medicine','Naturopathic Care'],
  'Real Estate': ['Buyer Representation','Seller Representation','Property Management','Commercial Leasing','Investment Consulting','Relocation Services','Short Sale & Foreclosure','New Construction Sales','Rental Management'],
  'Finance': ['Financial Planning','Tax Preparation','Bookkeeping','Payroll Services','Business Lending','Mortgage Lending','Investment Advisory','Insurance Planning','Credit Repair','Retirement Planning'],
  'Coaching & Consulting': ['Business Coaching','Life Coaching','Executive Coaching','Sales Training','Marketing Strategy','Leadership Development','Career Coaching','Mindset Coaching','Group Programs'],
  'E-Commerce': ['Physical Products','Digital Products','Subscription Boxes','Dropshipping','Print on Demand','Wholesale','Private Label','Custom Manufacturing','Affiliate Products'],
  'Restaurants & Food': ['Dine-In Service','Takeout & Delivery','Catering','Food Truck','Meal Prep & Delivery','Bakery','Coffee & Beverages','Bar & Nightlife','Ghost Kitchen'],
  'Fitness': ['Personal Training','Group Fitness Classes','Online Coaching','Nutrition Coaching','Strength & Conditioning','Sports Performance','Youth Fitness','Senior Fitness','Corporate Wellness'],
  'Beauty & Aesthetics': ['Hair Salon','Nail Services','Skincare & Facials','Botox & Fillers','Lash & Brow','Waxing & Threading','Spray Tanning','Medical Aesthetics','Permanent Makeup'],
  'Legal': ['Personal Injury','Family Law','Criminal Defense','Estate Planning','Business Law','Real Estate Law','Immigration','Employment Law','Bankruptcy'],
  'Construction & Trades': ['General Contracting','Custom Home Building','Remodeling','Commercial Construction','Roofing','Plumbing','Electrical','HVAC','Concrete & Masonry','Landscaping'],
  'Automotive': ['Auto Repair','Body Shop','Detailing','Tire Shop','Oil Change','Transmission','Auto Sales','Fleet Services','Mobile Mechanic'],
  'Education': ['Tutoring','Test Prep','Online Courses','After School Programs','Language Learning','Music Lessons','Coding Bootcamp','Corporate Training','Early Childhood Education'],
  'Technology': ['Software Development','IT Support','Cybersecurity','Cloud Services','App Development','Web Design','Data Analytics','AI & Automation','SaaS Products'],
  'Retail': ['Clothing & Apparel','Home Goods','Sporting Goods','Electronics','Specialty Food','Pet Supplies','Books & Media','Gifts & Novelties','Outdoor & Garden'],
  'Marketing & Advertising': ['Social Media Management','Paid Advertising','SEO','Email Marketing','Content Creation','Branding & Design','Video Production','PR & Communications','Influencer Marketing'],
  'Insurance': ['Life Insurance','Health Insurance','Home & Auto','Business Insurance','Commercial Property','Workers Comp','Medicare Planning','Final Expense','Annuities'],
  'Dental & Medical': ['General Dentistry','Orthodontics','Cosmetic Dentistry','Implants','Oral Surgery','Primary Care','Urgent Care','Dermatology','Pediatrics'],
  'Accounting': ['Tax Preparation','Bookkeeping','Payroll','Business Advisory','Financial Reporting','Audit & Assurance','CFO Services','Nonprofit Accounting','Estate & Trust'],
}

const SERVICES_SUBCATEGORIES = {
  'AC Installation': ['Residential','Commercial','New construction','Replacement only','Full system'],
  'AC Repair': ['Emergency repair','Diagnostic only','Parts replacement','Full service repair'],
  'Heating Installation': ['Furnace','Heat pump','Boiler','Mini-split','Radiant heat'],
  'Heating Repair': ['Emergency repair','Diagnostic only','Parts replacement','Full service repair'],
  'Personal Training': ['One on one','Semi-private','Online only','In-home','Corporate'],
  'Business Coaching': ['One on one','Group programs','Online courses','Done with you','Mastermind'],
  'Hair Salon': ['Cuts','Color','Extensions','Keratin','Bridal'],
  'General Contracting': ['Residential','Commercial','Remodels','New builds','Project management'],
  'Software Development': ['Web apps','Mobile apps','Custom software','API integration','Maintenance'],
  'Tax Preparation': ['Individual','Business','Self-employed','Nonprofit','Multi-state'],
  'Social Media Management': ['Organic content','Paid ads','Full management','Strategy only','Reporting'],
}

// ─── Who they serve bubbles ───────────────────────────────────────────────────

const WHO_SERVES_BUBBLES = [
  'Homeowners','Business owners','Property managers',
  'Renters','Contractors','Women 25-45','Men 35-55',
  'Local area only','Regional','National',
]

// ─── Differentiator bubbles ───────────────────────────────────────────────────

const DIFFERENTIATOR_BUBBLES = [
  'Years in business','Family owned','24 hour service',
  'Licensed and insured','Best price guarantee','Fastest response time',
  'Award winning','Specialized certification',
]

// ─── Funnel steps ─────────────────────────────────────────────────────────────

const PROFILE_FUNNEL_STEPS = ['industry', 'services', 'whoServe', 'differentiator', 'review']

const PROFILE_STEP_MESSAGES = {
  industry: 'What industry are you in?',
  services: 'What services do you offer?',
  whoServe: 'Who do you generally serve?',
  differentiator: 'Anything that makes you stand out? This is optional — skip if unsure.',
  review: 'Here is your profile. Review it and save when ready.',
}

const PROFILE_FIELD_LABELS = {
  industry: 'INDUSTRY',
  services: 'SERVICES',
  whoServe: 'WHO YOU SERVE',
  differentiator: 'WHAT SETS YOU APART',
}

const EMPTY_PROFILE_DATA = () => ({
  industry: null,
  services: null,
  whoServe: null,
  differentiator: null,
})

// ─── Bubble style helper ──────────────────────────────────────────────────────

function bubbleStyle(selected) {
  return {
    border: `1px solid ${selected ? '#2990fa' : '#152840'}`,
    background: selected ? '#0a1f3f' : '#060d1f',
    color: selected ? '#ffffff' : 'rgba(255,255,255,0.75)',
    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
    fontSize: '0.88rem', fontFamily: 'var(--font-inter)',
    lineHeight: 1.4, textAlign: 'left', width: '100%', boxSizing: 'border-box',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileTab({ selectedProfile, onProfileSelect }) {
  const [profiles, setProfiles] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileDropdown, setProfileDropdown] = useState(null)
  const [profileDeleteConfirm, setProfileDeleteConfirm] = useState(null)

  // Funnel state
  const [funnelStep, setFunnelStep] = useState('industry')
  const [profileData, setProfileData] = useState(EMPTY_PROFILE_DATA())
  const [profileNameInput, setProfileNameInput] = useState('')
  const [selectedBubbles, setSelectedBubbles] = useState([])
  const [currentBubbles, setCurrentBubbles] = useState(INDUSTRY_BUBBLES)
  const [funnelHistory, setFunnelHistory] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [typeOwn, setTypeOwn] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: PROFILE_STEP_MESSAGES.industry },
  ])
  const [subcategoriesOpen, setSubcategoriesOpen] = useState([])
  const [selectedSubcategories, setSelectedSubcategories] = useState([])

  const chatScrollRef = useRef(null)
  const dropdownRef = useRef(null)
  const profileDropdownRef = useRef(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  useEffect(() => {
    if (profileDropdown === null) return
    function handleClick(e) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileDropdown])

  async function loadProfiles() {
    try {
      const res = await fetch('/api/profiles')
      const data = await res.json()
      setProfiles(data.profiles || [])
    } catch (err) {
      console.error('Load profiles error:', err)
    }
  }

  // ─── Funnel helpers ───────────────────────────────────────────────────────────

  function initFunnel() {
    setFunnelStep('industry')
    setProfileData(EMPTY_PROFILE_DATA())
    setProfileNameInput('')
    setSelectedBubbles([])
    setSelectedSubcategories([])
    setSubcategoriesOpen([])
    setFunnelHistory([])
    setEditMode(false)
    setEditingField(null)
    setEditingId(null)
    setCurrentBubbles(INDUSTRY_BUBBLES)
    setChatMessages([{ role: 'assistant', content: PROFILE_STEP_MESSAGES.industry }])
    setTypeOwn('')
  }

  function getBubblesForStep(step, data) {
    const d = data || profileData
    if (step === 'industry') return INDUSTRY_BUBBLES
    if (step === 'services') return SERVICES_BY_INDUSTRY[d.industry] || SERVICES_BY_INDUSTRY['Home Services']
    if (step === 'whoServe') return WHO_SERVES_BUBBLES
    if (step === 'differentiator') return DIFFERENTIATOR_BUBBLES
    return []
  }

  function getMaxSelect(step) {
    if (step === 'industry') return 2
    if (step === 'services') return 3
    if (step === 'whoServe') return 3
    if (step === 'differentiator') return 1
    return 2
  }

  function handleBubbleToggle(bubble) {
    const activeStep = editingField || funnelStep
    const max = getMaxSelect(activeStep)
    setSelectedBubbles(prev => {
      if (prev.includes(bubble)) return prev.filter(b => b !== bubble)
      if (prev.length >= max) return prev
      return [...prev, bubble]
    })
  }

  function handleSubToggle(sub) {
    const max = 3
    setSelectedSubcategories(prev => {
      if (prev.includes(sub)) return prev.filter(s => s !== sub)
      if (prev.length >= max) return prev
      return [...prev, sub]
    })
  }

  function gotoStep(step, data) {
    setFunnelStep(step)
    setSelectedBubbles([])
    setSelectedSubcategories([])
    setSubcategoriesOpen([])
    setChatMessages(prev => [...prev, { role: 'assistant', content: PROFILE_STEP_MESSAGES[step] }])
    if (step === 'review') {
      const d = data || profileData
      const suggested = [d.industry, d.services?.split(' / ')[0]].filter(Boolean).join(' ')
      setProfileNameInput(suggested)
      setCurrentBubbles([])
      return
    }
    setCurrentBubbles(getBubblesForStep(step, data))
  }

  function handleAdvance() {
    if (funnelStep === 'review' || editMode) return
    const allSelected = [...selectedBubbles, ...selectedSubcategories]
    if (allSelected.length === 0) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Select at least one option to continue.' }])
      return
    }
    handleContinue()
  }

  function handleContinue() {
    const allSelected = [...selectedBubbles, ...selectedSubcategories]
    if (allSelected.length === 0) return
    const combined = allSelected.join(' / ')
    const currentChatLength = chatMessages.length

    setFunnelHistory(prev => [...prev, {
      step: funnelStep,
      bubbles: [...currentBubbles],
      data: { ...profileData },
      selectedBubbles: [...selectedBubbles],
      selectedSubcategories: [...selectedSubcategories],
      chatLength: currentChatLength,
    }])

    setChatMessages(prev => [...prev, { role: 'user', content: combined }])

    const fieldMap = {
      industry: 'industry',
      services: 'services',
      whoServe: 'whoServe',
      differentiator: 'differentiator',
    }
    const field = fieldMap[funnelStep]
    const newData = field ? { ...profileData, [field]: combined } : profileData
    if (field) setProfileData(newData)

    setSelectedBubbles([])
    setSelectedSubcategories([])
    setSubcategoriesOpen([])

    const nextIdx = PROFILE_FUNNEL_STEPS.indexOf(funnelStep) + 1
    if (nextIdx < PROFILE_FUNNEL_STEPS.length) {
      gotoStep(PROFILE_FUNNEL_STEPS[nextIdx], newData)
    }
  }

  function handleSkipDifferentiator() {
    const currentChatLength = chatMessages.length
    setFunnelHistory(prev => [...prev, {
      step: funnelStep,
      bubbles: [...currentBubbles],
      data: { ...profileData },
      selectedBubbles: [],
      selectedSubcategories: [],
      chatLength: currentChatLength,
    }])
    setChatMessages(prev => [...prev, { role: 'user', content: 'Skipped' }])
    const newData = { ...profileData, differentiator: null }
    setProfileData(newData)
    setSelectedBubbles([])
    gotoStep('review', newData)
  }

  function goBack() {
    if (funnelHistory.length === 0) return
    const prev = funnelHistory[funnelHistory.length - 1]
    setFunnelHistory(h => h.slice(0, -1))
    setFunnelStep(prev.step)
    setCurrentBubbles(prev.bubbles)
    setProfileData(prev.data)
    setSelectedBubbles(prev.selectedBubbles || [])
    setSelectedSubcategories(prev.selectedSubcategories || [])
    setSubcategoriesOpen([])
    setChatMessages(msgs => msgs.slice(0, prev.chatLength))
  }

  async function handleGetMoreOptions() {
    const step = editingField || funnelStep
    const excludeList = currentBubbles.join(', ')
    const system = `Generate exactly 6 different options for this profile funnel step: "${step}".
Industry context: "${profileData.industry || 'unknown'}"
Do NOT repeat these: [${excludeList}]
Options must be specific and practical.
Return JSON only: {"step":"profile_dynamic","options":["opt1","opt2","opt3","opt4","opt5","opt6"]}`
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `More options for: ${step}` }],
          system,
        }),
      })
      const data = await res.json()
      const raw = data.text || ''
      let parsed = null
      try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) } catch (_) {}
      if (!parsed) {
        try {
          const m = raw.match(/\{[\s\S]*\}/)
          if (m) parsed = JSON.parse(m[0])
        } catch (__) {}
      }
      if (parsed && parsed.options) {
        setCurrentBubbles(prev => {
          const kept = selectedBubbles
          return [...kept, ...parsed.options.filter(o => !kept.includes(o))]
        })
      }
    } catch (err) {
      console.error('Get more options error:', err)
    }
    setIsLoading(false)
  }

  function handleAdd() {
    if (!typeOwn.trim()) return
    const text = typeOwn.trim()
    setTypeOwn('')
    setCurrentBubbles(prev => prev.includes(text) ? prev : [...prev, text])
    handleBubbleToggle(text)
  }

  async function handleAsk() {
    if (!typeOwn.trim()) return
    const question = typeOwn.trim()
    setTypeOwn('')
    const contextNote = selectedBubbles.length > 0
      ? ` (Currently selected: ${selectedBubbles.join(', ')})`
      : ''
    setChatMessages(prev => [...prev, { role: 'user', content: question }])
    const system = `The user is building their business profile. They are on step: ${funnelStep}.
They asked: ${question}${contextNote}
Answer in 1-2 sentences using plain simple language.
Then redirect them back to the current step.
Do not generate bubble options in this response.`
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: question + contextNote }],
          system,
        }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.text || '' }])
    } catch (err) {
      console.error('Ask error:', err)
    }
    setIsLoading(false)
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!profileNameInput.trim()) return
    try {
      const body = {
        name: profileNameInput.trim(),
        industry: profileData.industry || '',
        services: profileData.services || '',
        who_they_serve: profileData.whoServe || '',
        differentiator: profileData.differentiator || null,
      }
      let res
      if (editingId) {
        res = await fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...body }),
        })
      } else {
        res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      const data = await res.json()
      await loadProfiles()
      if (data.profile) {
        onProfileSelect(data.profile)
        setChatMessages(prev => [
          ...prev,
          { role: 'user', content: `Name: ${data.profile.name}` },
          { role: 'assistant', content: `Profile "${data.profile.name}" saved.` },
        ])
        setTimeout(() => initFunnel(), 800)
      }
    } catch (err) {
      console.error('Save profile error:', err)
    }
  }

  // ─── Edit from list ───────────────────────────────────────────────────────────

  function handleEditProfile(p) {
    setProfileDropdown(null)
    setDropdownOpen(false)
    setProfileData({
      industry: p.industry || null,
      services: p.services || null,
      whoServe: p.who_they_serve || null,
      differentiator: p.differentiator || null,
    })
    setProfileNameInput(p.name || '')
    setEditingId(p.id)
    setFunnelStep('review')
    setEditMode(true)
    setEditingField(null)
    setSelectedBubbles([])
    setFunnelHistory([])
    setCurrentBubbles([])
    setChatMessages([{ role: 'assistant', content: `Editing profile: ${p.name}` }])
  }

  async function handleDeleteProfile(p) {
    try {
      await fetch('/api/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      })
      setProfileDropdown(null)
      await loadProfiles()
      if (selectedProfile?.id === p.id) {
        onProfileSelect(null)
      }
    } catch (err) {
      console.error('Delete profile error:', err)
    }
  }

  function startEditingField(field) {
    setEditingField(field)
    setSelectedBubbles([])
    setSelectedSubcategories([])
    setSubcategoriesOpen([])
    setCurrentBubbles(getBubblesForStep(field, profileData))
  }

  function confirmEditField() {
    const allSelected = [...selectedBubbles, ...selectedSubcategories]
    if (allSelected.length === 0) return
    const combined = allSelected.join(' / ')
    setProfileData(prev => ({ ...prev, [editingField]: combined }))
    setEditingField(null)
    setSelectedBubbles([])
    setSelectedSubcategories([])
    setCurrentBubbles([])
  }

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const stepIdx = PROFILE_FUNNEL_STEPS.indexOf(funnelStep)
  const maxSelect = getMaxSelect(editingField || funnelStep)
  const hasSelection = selectedBubbles.length > 0 || selectedSubcategories.length > 0

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', overflow: 'hidden' }}>

      {/* ── PROFILE SELECTOR BAR ── */}
      <div style={{
        flexShrink: 0, background: '#0a1628', borderBottom: '1px solid #2990fa',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
          PROFILE
        </div>

        {/* Dropdown selector */}
        <div style={{ position: 'relative', flex: 1 }} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              background: '#060d1f', border: '1px solid #2990fa', borderRadius: 6,
              color: selectedProfile ? '#ffffff' : 'rgba(255,255,255,0.4)',
              padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem',
              display: 'flex', alignItems: 'center', gap: 8, minWidth: 180,
            }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>
              {selectedProfile ? selectedProfile.name : 'Select Profile'}
            </span>
            <span style={{ color: '#2990fa' }}>▾</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, zIndex: 200,
              background: '#0a1628', border: '1px solid #2990fa', borderRadius: 8,
              minWidth: 240, maxHeight: 280, overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}>
              {profiles.length === 0 && (
                <div style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  No profiles yet
                </div>
              )}
              {profiles.map(p => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center',
                    borderLeft: selectedProfile?.id === p.id ? '3px solid #2990fa' : '3px solid transparent',
                    padding: '0 8px 0 0',
                  }}
                  ref={profileDropdown === p.id ? profileDropdownRef : null}
                >
                  <div
                    onClick={() => { onProfileSelect(p); setDropdownOpen(false) }}
                    style={{
                      flex: 1, padding: '10px 12px', cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#152840'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ color: '#ffffff', fontSize: '0.78rem', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                      {p.name}
                    </div>
                    {p.industry && (
                      <div style={{ color: '#2990fa', fontSize: '0.62rem', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 2 }}>
                        {p.industry}
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setProfileDropdown(prev => prev === p.id ? null : p.id) }}
                      style={{ background: 'transparent', border: 'none', color: '#2990fa', fontSize: '1rem', cursor: 'pointer', padding: '2px 6px' }}
                    >
                      ⋯
                    </button>
                    {profileDropdown === p.id && (
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, zIndex: 300,
                        background: '#0a1628', border: '1px solid #2990fa', borderRadius: 8,
                        padding: 4, minWidth: 110, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                      }}>
                        <div
                          onClick={() => handleEditProfile(p)}
                          style={{ padding: '8px 12px', color: '#ffffff', fontSize: '0.78rem', fontFamily: 'var(--font-inter)', cursor: 'pointer', borderRadius: 4 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#152840'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          ✎ Edit
                        </div>
                        <div
                          onClick={() => { setProfileDropdown(null); setDropdownOpen(false); setProfileDeleteConfirm(p) }}
                          style={{ padding: '8px 12px', color: '#ff4455', fontSize: '0.78rem', fontFamily: 'var(--font-inter)', cursor: 'pointer', borderRadius: 4 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1a0a0d'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          🗑 Delete
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={initFunnel}
          style={{
            border: '1px solid #2990fa', background: 'transparent', color: '#2990fa',
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          New Profile
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', padding: '20px 24px', gap: 32 }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>

          {/* Section title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 12px 0', flexShrink: 0 }}>
            {funnelHistory.length > 0 && (
              <button
                onClick={goBack}
                style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem' }}
              >
                ←
              </button>
            )}
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.2rem', color: '#2990fa', letterSpacing: '0.05em' }}>
              PROFILE
            </div>
            {funnelStep !== 'review' && !editMode && (hasSelection || typeOwn.trim()) && (
              <button
                onClick={handleAdvance}
                style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem' }}
              >
                →
              </button>
            )}
            {funnelStep === 'differentiator' && !editMode && (
              <button
                onClick={handleSkipDifferentiator}
                style={{ background: 'transparent', border: '1px solid #4a6a8a', color: '#4a6a8a', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.65rem' }}
              >
                SKIP
              </button>
            )}
          </div>

          {/* Chat area */}
          <div ref={chatScrollRef} style={{
            flex: 1, overflowY: 'auto', minHeight: 80,
            display: 'flex', flexDirection: 'column', gap: 10,
            padding: 12, background: '#060d1f', borderRadius: 10, border: '1px solid #152840',
            marginBottom: 10,
          }}>
            {chatMessages.map((msg, idx) => (
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

          {/* Controls */}
          {editMode ? (
            editingField !== null ? (
              <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={() => { setEditingField(null); setSelectedBubbles([]); setCurrentBubbles([]) }}
                    style={{ border: '1px solid #2990fa', background: 'transparent', color: '#2990fa', padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)' }}
                  >
                    ← Back
                  </button>
                  <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {PROFILE_FIELD_LABELS[editingField]}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                  {currentBubbles.map((bubble, idx) => (
                    <div key={idx} onClick={() => handleBubbleToggle(bubble)} style={bubbleStyle(selectedBubbles.includes(bubble))}>
                      {bubble}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGetMoreOptions}
                  disabled={isLoading}
                  style={{ color: '#2990fa', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 0', fontFamily: 'var(--font-inter)', display: 'block', marginBottom: 6, opacity: isLoading ? 0.5 : 1, width: '100%', textAlign: 'center' }}
                >
                  ↻ Get more options
                </button>
                {selectedBubbles.length > 0 && (
                  <button
                    onClick={confirmEditField}
                    style={{ background: '#2990fa', border: 'none', borderRadius: 6, padding: '10px 0', color: '#ffffff', width: '100%', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Confirm
                  </button>
                )}
              </div>
            ) : (
              /* Chips grid for edit mode */
              funnelStep === 'review' ? (
                <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%', marginBottom: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {Object.entries(PROFILE_FIELD_LABELS).map(([field, label]) => (
                      <div
                        key={field}
                        onClick={() => startEditingField(field)}
                        style={{ background: '#0a1628', border: '1px solid #2990fa', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#ffffff', fontFamily: 'var(--font-inter)', lineHeight: 1.4 }}>
                          {profileData[field] || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setEditMode(false)}
                    style={{ border: '1px solid #2990fa', background: 'transparent', color: '#2990fa', width: '100%', padding: '10px 0', borderRadius: 6, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    ← Back to Summary
                  </button>
                </div>
              ) : null
            )
          ) : funnelStep === 'review' ? (
            /* Review step */
            <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%', marginBottom: 8 }}>
              <div style={{ background: '#0a1628', border: '1px solid #152840', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                {Object.entries(PROFILE_FIELD_LABELS).map(([field, label]) =>
                  profileData[field] ? (
                    <div key={field} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}>{profileData[field]}</div>
                    </div>
                  ) : null
                )}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  PROFILE NAME
                </div>
                <input
                  value={profileNameInput}
                  onChange={e => setProfileNameInput(e.target.value)}
                  placeholder="Give this profile a name"
                  style={{ width: '100%', background: '#060d1f', border: '1px solid #2990fa', borderRadius: 8, color: '#ffffff', padding: '10px 14px', fontSize: '0.9rem', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={!profileNameInput.trim()}
                style={{ background: profileNameInput.trim() ? '#2990fa' : '#0a1628', border: '1px solid #2990fa', borderRadius: 6, padding: '10px 0', color: profileNameInput.trim() ? '#ffffff' : '#4a6a8a', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', cursor: profileNameInput.trim() ? 'pointer' : 'not-allowed', width: '100%', marginBottom: 8 }}
              >
                SAVE PROFILE
              </button>
              <button
                onClick={() => setEditMode(true)}
                style={{ background: 'transparent', border: '1px solid #2990fa', borderRadius: 6, padding: '10px 0', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem', cursor: 'pointer', width: '100%' }}
              >
                REDO SECTIONS
              </button>
            </div>
          ) : (
            /* Funnel steps */
            <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%', marginBottom: 8 }}>
              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  Step {stepIdx + 1} of {PROFILE_FUNNEL_STEPS.length - 1}
                </span>
                {(selectedBubbles.length > 0 || selectedSubcategories.length > 0) && (
                  <span style={{ fontSize: '0.6rem', color: '#2990fa', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                    {selectedBubbles.length + selectedSubcategories.length}/{maxSelect}
                  </span>
                )}
              </div>

              {/* Bubbles grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                {currentBubbles.map((bubble, idx) => {
                  const subs = SERVICES_SUBCATEGORIES[bubble]
                  const isOpen = subcategoriesOpen.includes(bubble)
                  return (
                    <div key={idx}>
                      <div
                        onClick={() => {
                          if (funnelStep === 'services' && subs && subs.length > 0) {
                            setSubcategoriesOpen(prev =>
                              prev.includes(bubble) ? prev.filter(b => b !== bubble) : [...prev, bubble]
                            )
                            handleBubbleToggle(bubble)
                          } else {
                            handleBubbleToggle(bubble)
                          }
                        }}
                        style={bubbleStyle(selectedBubbles.includes(bubble))}
                      >
                        {bubble}
                        {funnelStep === 'services' && subs && subs.length > 0 && (
                          <span style={{ float: 'right', color: '#2990fa', fontSize: '0.65rem' }}>
                            {isOpen ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                      {funnelStep === 'services' && isOpen && subs && (
                        <div style={{ paddingLeft: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {subs.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => handleSubToggle(sub)}
                              style={{
                                ...bubbleStyle(selectedSubcategories.includes(sub)),
                                fontSize: '0.76rem', padding: '7px 12px',
                                border: `1px solid ${selectedSubcategories.includes(sub) ? '#00e5c8' : '#1d3a58'}`,
                                background: selectedSubcategories.includes(sub) ? '#0a2a1a' : '#060d1f',
                                color: selectedSubcategories.includes(sub) ? '#00e5c8' : 'rgba(255,255,255,0.6)',
                              }}
                            >
                              {sub}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Get more options */}
              <button
                onClick={handleGetMoreOptions}
                disabled={isLoading}
                style={{ color: '#2990fa', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 0', fontFamily: 'var(--font-inter)', display: 'block', marginBottom: 4, opacity: isLoading ? 0.5 : 1, width: '100%', textAlign: 'center' }}
              >
                ↻ Get more options
              </button>
            </div>
          )}

          {/* Input row */}
          {funnelStep !== 'review' && !editMode && (
            <div style={{ flexShrink: 0, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={typeOwn}
                  onChange={e => setTypeOwn(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                  placeholder="Type your own or ask Jarvis..."
                  style={{ flex: 1, background: '#060d1f', border: '1px solid #2990fa', color: '#ffffff', padding: '8px 14px', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'var(--font-inter)', height: 36, boxSizing: 'border-box' }}
                />
                {typeOwn.trim() && (
                  <button
                    onClick={handleAdd}
                    style={{ background: '#2990fa', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box' }}
                  >
                    ADD
                  </button>
                )}
                {typeOwn.trim() && (
                  <button
                    onClick={handleAsk}
                    style={{ background: 'transparent', border: '1px solid #2990fa', color: '#2990fa', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box' }}
                  >
                    ASK
                  </button>
                )}
                {(hasSelection || typeOwn.trim()) && (
                  <button
                    onClick={handleAdvance}
                    style={{ background: '#2990fa', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', flexShrink: 0, height: 36, boxSizing: 'border-box' }}
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN — Profile summary card ── */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selectedProfile ? (
            <div style={{ background: '#0a1628', border: '1px solid #2990fa', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                ACTIVE PROFILE
              </div>
              <div style={{ fontSize: '1rem', fontFamily: 'var(--font-bebas-neue)', color: '#ffffff', letterSpacing: '0.05em', marginBottom: 10 }}>
                {selectedProfile.name}
              </div>
              {[
                { label: 'INDUSTRY', value: selectedProfile.industry },
                { label: 'SERVICES', value: selectedProfile.services },
                { label: 'WHO THEY SERVE', value: selectedProfile.who_they_serve },
                { label: 'DIFFERENTIATOR', value: selectedProfile.differentiator },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '0.48rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}>{value}</div>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div style={{ background: '#060d1f', border: '1px solid #152840', borderRadius: 10, padding: 18, textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-inter)', fontSize: '0.82rem' }}>
                No profile selected
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── PROFILE DELETE CONFIRM ── */}
      {profileDeleteConfirm && (
        <div
          onClick={() => setProfileDeleteConfirm(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(2,8,16,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a1628', border: '1px solid #ff4455',
              borderRadius: 12, padding: 28, width: '100%', maxWidth: 360,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}
          >
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.4rem', color: '#ff4455', letterSpacing: '0.05em' }}>
              Delete Profile
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5 }}>
              Delete <strong>{profileDeleteConfirm.name}</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { handleDeleteProfile(profileDeleteConfirm); setProfileDeleteConfirm(null) }}
                style={{
                  flex: 1, background: '#ff4455', border: 'none', borderRadius: 8,
                  padding: '11px 0', color: '#ffffff',
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}
              >
                DELETE
              </button>
              <button
                onClick={() => setProfileDeleteConfirm(null)}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid #2990fa',
                  borderRadius: 8, padding: '11px 0', color: '#2990fa',
                  fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.82rem',
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
