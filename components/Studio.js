'use client'
import { useState } from 'react'
import AdsTab from './tabs/AdsTab'
import LibraryTab from './tabs/LibraryTab'
import ProfileTab from './tabs/ProfileTab'

function VelpiLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="13" fill="#2990fa" />
      <path
        d="M9 10 L15 21 L21 10"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

const tabs = [
  { id: 'profile', label: 'PROFILE' },
  { id: 'ads', label: 'ADS' },
  { id: 'library', label: 'LIBRARY' },
]

export default function Studio() {
  const [activeTab, setActiveTab] = useState('profile')
  const [pendingRefine, setPendingRefine] = useState(null)
  const [pendingLoadAd, setPendingLoadAd] = useState(null)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [pendingTabChange, setPendingTabChange] = useState(null)

  function handleTabClick(tabId) {
    if (activeTab === 'ads' && tabId !== 'ads') {
      setPendingTabChange(tabId)
    } else {
      setActiveTab(tabId)
      setPendingTabChange(null)
    }
  }

  function handleRefineFromLibrary(ad) {
    setPendingRefine(ad)
    setActiveTab('ads')
  }

  function handleEditFromLibrary(ad) {
    setPendingLoadAd(ad)
    setActiveTab('ads')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1e35' }}>
      {/* HEADER */}
      <header
        id="app-header"
        style={{
          position: 'sticky', top: 0, height: 52,
          background: '#0f1e35',
          borderBottom: '1px solid rgba(41,144,250,0.3)',
          display: 'flex', alignItems: 'center',
          padding: '0 1.25rem', gap: 12, zIndex: 100,
        }}
      >
        <VelpiLogo />
        <span style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.2rem', color: '#ffffff', letterSpacing: '0.1em' }}>
          VELPI STUDIO
        </span>
        <div style={{ flex: 1 }} />
        {/* Active profile context — always know who you're building for */}
        {selectedProfile && (
          <button
            onClick={() => handleTabClick('profile')}
            title="View or change profile"
            className="vp-tab"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(41,144,250,0.1)', border: '1px solid rgba(41,144,250,0.4)',
              borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5c8', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
              PROFILE
            </span>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: '#ffffff', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedProfile.name}
            </span>
          </button>
        )}
      </header>

      {/* TAB BAR */}
      <div
        id="app-tabs"
        style={{
          position: 'sticky', top: 52,
          background: '#0f1e35',
          borderBottom: '1px solid rgba(41,144,250,0.3)',
          display: 'flex',
          zIndex: 99,
        }}
      >
        {tabs.map(t => {
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => handleTabClick(t.id)}
              className="vp-tab"
              style={{
                background: active ? 'rgba(41,144,250,0.12)' : 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid #2990fa' : '2px solid transparent',
                color: active ? '#2990fa' : 'rgba(255,255,255,0.7)',
                padding: '0.7rem 1.5rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: '1.5rem 0.75rem' }}>
        {activeTab === 'profile' && (
          <ProfileTab
            selectedProfile={selectedProfile}
            onProfileSelect={p => {
              setSelectedProfile(p)
              if (p) setActiveTab('ads')
            }}
          />
        )}
        {activeTab === 'ads' && (
          <AdsTab
            pendingRefine={pendingRefine}
            onRefineConsumed={() => setPendingRefine(null)}
            pendingLoadAd={pendingLoadAd}
            onLoadAdConsumed={() => setPendingLoadAd(null)}
            selectedProfile={selectedProfile}
            onGoToProfile={() => setActiveTab('profile')}
            pendingTabChange={pendingTabChange}
            onTabChangeApproved={() => {
              if (pendingTabChange) {
                setActiveTab(pendingTabChange)
                setPendingTabChange(null)
              }
            }}
            onTabChangeCancelled={() => setPendingTabChange(null)}
            onSaved={() => setActiveTab('library')}
          />
        )}
        {activeTab === 'library' && <LibraryTab onEdit={handleEditFromLibrary} />}
      </div>
    </div>
  )
}
