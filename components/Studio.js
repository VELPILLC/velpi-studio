'use client'
import { useState } from 'react'
import AdsTab from './tabs/AdsTab'
import ContentTab from './tabs/ContentTab'
import PerformanceTab from './tabs/PerformanceTab'

function VelpiLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="13" stroke="#3a9aff" strokeWidth="1.5" />
      <path d="M9 10 L15 21 L21 10" stroke="#3a9aff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

const tabs = [
  { id: 'ads', label: 'ADS' },
  { id: 'content', label: 'CONTENT' },
  { id: 'performance', label: 'PERFORMANCE' },
]

export default function Studio() {
  const [activeTab, setActiveTab] = useState('ads')

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
      <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        {activeTab === 'ads' && <AdsTab />}
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'performance' && <PerformanceTab />}
      </div>
    </div>
  )
}
