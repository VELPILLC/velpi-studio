'use client'
import { useState, useEffect } from 'react'
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

  // ── Avatar bar state (moved out of AdsTab into Studio tab bar) ──
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [avatarDdOpen, setAvatarDdOpen] = useState(false)
  const [avatarDdMenuId, setAvatarDdMenuId] = useState(null)
  const [avatarDeleteConfirmAv, setAvatarDeleteConfirmAv] = useState(null)
  const [pendingAvatarAction, setPendingAvatarAction] = useState(null)

  useEffect(() => { loadAvatarsForBar() }, [])

  async function loadAvatarsForBar() {
    try {
      const res = await fetch('/api/avatars')
      const data = await res.json()
      setAvatars(data.avatars || [])
    } catch (_) {}
  }

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

  async function handleAvatarDeleteConfirm() {
    if (!avatarDeleteConfirmAv) return
    try {
      await fetch('/api/avatars', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: avatarDeleteConfirmAv.id }),
      })
      setPendingAvatarAction({ type: 'avatarDeleted', avatarId: avatarDeleteConfirmAv.id })
      setAvatarDeleteConfirmAv(null)
      loadAvatarsForBar()
    } catch (_) {}
  }

  const tabBtnStyle = (id) => ({
    background: 'transparent',
    border: 'none',
    borderBottom: activeTab === id ? '2px solid #2990fa' : '2px solid transparent',
    color: activeTab === id ? '#2990fa' : '#ffffff',
    padding: '0.7rem 1.5rem',
    fontSize: '0.6rem',
    fontFamily: 'var(--font-ibm-plex-mono)',
    letterSpacing: '0.06em',
    cursor: 'pointer',
  })

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
        <span style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '1.3rem', color: '#ffffff', letterSpacing: '0.1em' }}>
          VELPI STUDIO
        </span>
        <div style={{ flex: 1 }} />
      </header>

      {/* TAB BAR */}
      <div
        id="app-tabs"
        style={{
          position: 'sticky', top: 52,
          background: '#0f1e35',
          borderBottom: '1px solid rgba(41,144,250,0.3)',
          display: 'flex', alignItems: 'stretch',
          zIndex: 99,
        }}
      >
        {tabs.map(t => (
          <button key={t.id} onClick={() => handleTabClick(t.id)} style={tabBtnStyle(t.id)}>
            {t.label}
          </button>
        ))}

        {/* AVATAR dropdown */}
        <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'stretch' }}>
          <button
            onClick={() => { setAvatarDdOpen(v => !v); setAvatarDdMenuId(null) }}
            style={{
              background: 'transparent', border: 'none',
              borderBottom: avatarDdOpen ? '2px solid #2990fa' : '2px solid transparent',
              color: selectedAvatar ? '#2990fa' : 'rgba(255,255,255,0.55)',
              padding: '0.7rem 1.5rem',
              fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)',
              letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {selectedAvatar ? selectedAvatar.name.toUpperCase() : 'AVATAR ▾'}
          </button>

          {avatarDdOpen && (
            <>
              <div
                onClick={() => { setAvatarDdOpen(false); setAvatarDdMenuId(null) }}
                style={{ position: 'fixed', inset: 0, zIndex: 299 }}
              />
              <div style={{
                position: 'absolute', top: '100%', right: 0, zIndex: 300,
                background: '#0a1628', border: '1px solid #2990fa',
                borderRadius: 10, minWidth: 240, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.85)',
              }}>
                {avatars.length === 0 && (
                  <div style={{ padding: '12px 16px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                    No avatars yet
                  </div>
                )}

                {avatars.map(av => (
                  <div key={av.id}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        onClick={() => {
                          setPendingAvatarAction({ type: 'select', avatar: av })
                          setAvatarDdOpen(false); setAvatarDdMenuId(null)
                          setActiveTab('ads')
                        }}
                        style={{
                          flex: 1, padding: '10px 16px',
                          fontSize: '0.82rem', fontFamily: 'var(--font-inter)',
                          color: selectedAvatar?.id === av.id ? '#2990fa' : '#ffffff',
                          background: selectedAvatar?.id === av.id ? 'rgba(41,144,250,0.08)' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {av.name}
                        {selectedAvatar?.id === av.id && <span style={{ fontSize: '0.58rem', color: '#2990fa' }}>✓</span>}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setAvatarDdMenuId(prev => prev === av.id ? null : av.id) }}
                        style={{ background: 'transparent', border: 'none', color: '#2990fa', fontSize: '1rem', padding: '8px 12px', cursor: 'pointer', flexShrink: 0 }}
                      >⋯</button>
                    </div>
                    {avatarDdMenuId === av.id && (
                      <div style={{ background: '#060d1f', borderTop: '1px solid #152840', borderBottom: '1px solid #152840' }}>
                        <div
                          onClick={() => {
                            setPendingAvatarAction({ type: 'edit', avatar: av })
                            setAvatarDdOpen(false); setAvatarDdMenuId(null); setActiveTab('ads')
                          }}
                          style={{ padding: '8px 20px', fontSize: '0.78rem', color: '#ffffff', fontFamily: 'var(--font-inter)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#152840'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          ✎ Edit
                        </div>
                        <div
                          onClick={() => { setAvatarDeleteConfirmAv(av); setAvatarDdMenuId(null) }}
                          style={{ padding: '8px 20px', fontSize: '0.78rem', color: '#ff4455', fontFamily: 'var(--font-inter)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1a0a0d'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          🗑 Delete
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div
                  onClick={() => {
                    setPendingAvatarAction({ type: 'new' })
                    setAvatarDdOpen(false); setAvatarDdMenuId(null); setActiveTab('ads')
                  }}
                  style={{
                    padding: '10px 16px', fontSize: '0.78rem', color: '#2990fa',
                    fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.04em',
                    cursor: 'pointer', borderTop: '1px solid #152840',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(41,144,250,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  + New Avatar
                </div>
              </div>
            </>
          )}
        </div>
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
            pendingAvatarAction={pendingAvatarAction}
            onAvatarActionConsumed={() => setPendingAvatarAction(null)}
            onAvatarChange={(avs, selAv) => { setAvatars(avs); setSelectedAvatar(selAv) }}
          />
        )}
        {activeTab === 'library' && <LibraryTab onEdit={handleEditFromLibrary} />}
      </div>

      {/* AVATAR DELETE CONFIRM (shown from tab bar dropdown) */}
      {avatarDeleteConfirmAv && (
        <div
          onClick={() => setAvatarDeleteConfirmAv(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(2,8,16,0.9)',
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
              Delete Avatar
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5 }}>
              Delete <strong>{avatarDeleteConfirmAv.name}</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleAvatarDeleteConfirm}
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
                onClick={() => setAvatarDeleteConfirmAv(null)}
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
