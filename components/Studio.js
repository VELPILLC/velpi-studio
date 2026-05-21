'use client'
import { useState, useRef } from 'react'
import AdsTab from './tabs/AdsTab'
import ContentTab from './tabs/ContentTab'
import PerformanceTab from './tabs/PerformanceTab'

const JARVIS_CESAR = [
  "Welcome back, Cesar. Ready to build something that gets people to call.",
  "Good to see you, Cesar. Let's make ads that actually work.",
  "Cesar is in. Let's get it.",
  "Back at it, Cesar. Let's make today count.",
  "Hey Cesar. Time to build. Let's go.",
]

const JARVIS_ANGEL = [
  "Welcome back, Angel. Ready to create.",
  "Angel is in. Let's make something great.",
  "Good to see you, Angel. Let's build.",
  "Hey Angel. Let's get to work.",
  "Angel is here. Time to make ads.",
]

function VelpiLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="13" stroke="#3a9aff" strokeWidth="1.5" />
      <path d="M9 10 L15 21 L21 10" stroke="#3a9aff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default function Studio() {
  const [activeUser, setActiveUser] = useState(null)
  const [activeTab, setActiveTab] = useState('ads')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  function handleUserClick(user) {
    setActiveUser(user)
    const greetings = user === 'Cesar' ? JARVIS_CESAR : JARVIS_ANGEL
    const msg = greetings[Math.floor(Math.random() * greetings.length)]
    showToast(msg)
  }

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const tabs = [
    { id: 'ads', label: 'ADS' },
    { id: 'content', label: 'CONTENT' },
    { id: 'performance', label: 'PERFORMANCE' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#030810' }}>
      {/* HEADER */}
      <header style={{
        position: 'sticky',
        top: 0,
        height: 52,
        background: '#060e1c',
        borderBottom: '1px solid #152840',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        gap: 12,
        zIndex: 100,
      }}>
        <VelpiLogo />
        <div style={{ width: 1, height: 24, background: '#152840' }} />
        {['Cesar', 'Angel'].map(name => (
          <button
            key={name}
            onClick={() => handleUserClick(name)}
            style={{
              background: activeUser === name ? '#1d6ff5' : 'transparent',
              color: activeUser === name ? 'white' : '#4a6a8a',
              border: '1px solid ' + (activeUser === name ? '#1d6ff5' : '#152840'),
              borderRadius: 6,
              padding: '0.25rem 0.85rem',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-ibm-plex-mono)',
              letterSpacing: '0.04em',
            }}
          >
            {name.toUpperCase()}
          </button>
        ))}
        <div style={{ flex: 1 }} />
      </header>

      {/* TAB BAR */}
      <div style={{
        position: 'sticky',
        top: 52,
        background: '#080f1e',
        borderBottom: '1px solid #152840',
        display: 'flex',
        zIndex: 99,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #5a9aff' : '2px solid transparent',
              color: activeTab === t.id ? '#5a9aff' : '#4a6a8a',
              padding: '0.7rem 1.5rem',
              fontSize: '0.6rem',
              fontFamily: 'var(--font-ibm-plex-mono)',
              letterSpacing: '0.06em',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        {activeTab === 'ads' && <AdsTab activeUser={activeUser} />}
        {activeTab === 'content' && <ContentTab activeUser={activeUser} />}
        {activeTab === 'performance' && <PerformanceTab activeUser={activeUser} />}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0b1525',
          border: '1px solid #152840',
          color: '#c8dcf5',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.88rem',
          padding: '0.85rem 1.5rem',
          borderRadius: 8,
          zIndex: 999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
