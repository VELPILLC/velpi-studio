'use client'
import { useState, useEffect } from 'react'

const STATUS_COLORS = {
  Working: '#00e5c8',
  'Not Working': '#ff4455',
  unrated: 'rgba(255,255,255,0.4)',
}

export default function LibraryTab({ onRefine }) {
  const [ads, setAds] = useState([])
  const [selectedAd, setSelectedAd] = useState(null)
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('velpi_library') || '[]')
      setAds(stored)
    } catch (_) {}
  }, [])

  function persist(newAds) {
    setAds(newAds)
    localStorage.setItem('velpi_library', JSON.stringify(newAds))
  }

  function updateAd(id, updates) {
    const newAds = ads.map(a => (a.id === id ? { ...a, ...updates } : a))
    persist(newAds)
    if (selectedAd?.id === id) setSelectedAd(a => ({ ...a, ...updates }))
  }

  function addVersion(ad) {
    const version = {
      id: Date.now(),
      headline: ad.headline,
      primaryText: ad.primaryText,
      description: ad.description,
      cta: ad.cta,
      hook: ad.hook,
      imageB64: ad.imageB64,
      createdAt: new Date().toISOString(),
      status: 'unrated',
    }
    const versions = [...(ad.versions || []), version]
    updateAd(ad.id, { versions })
  }

  function deleteAd(id) {
    const newAds = ads.filter(a => a.id !== id)
    persist(newAds)
    if (selectedAd?.id === id) setSelectedAd(null)
  }

  // Group by adType
  const grouped = ads.reduce((acc, ad) => {
    const key = ad.adType || 'Uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key].push(ad)
    return acc
  }, {})

  // Derived: which ad/version to display in modal
  const displayAd =
    selectedAd &&
    selectedVersionIdx !== null &&
    selectedAd.versions?.[selectedVersionIdx]
      ? { ...selectedAd, ...selectedAd.versions[selectedVersionIdx] }
      : selectedAd

  return (
    <div>
      {ads.length === 0 && (
        <div
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-ibm-plex-mono)',
            textAlign: 'center',
            paddingTop: 80,
            lineHeight: 1.8,
          }}
        >
          No ads saved yet.
          <br />
          Build an ad and click &ldquo;Save to Library&rdquo; to store it here.
        </div>
      )}

      {Object.entries(grouped).map(([type, groupAds]) => (
        <div key={type} style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: '0.6rem',
              fontFamily: 'var(--font-ibm-plex-mono)',
              color: '#2990fa',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            {type}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {groupAds.map(ad => (
              <div
                key={ad.id}
                onClick={() => {
                  setSelectedAd(ad)
                  setSelectedVersionIdx(null)
                }}
                style={{
                  width: 180,
                  background: '#0a1628',
                  border: '1px solid #2990fa',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* 9:16 thumbnail */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '9 / 16',
                    background: '#060d1f',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {ad.imageB64 ? (
                    <img
                      src={`data:image/png;base64,${ad.imageB64}`}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-ibm-plex-mono)',
                      }}
                    >
                      No image
                    </div>
                  )}
                  {/* Status badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: '0.55rem',
                      fontFamily: 'var(--font-ibm-plex-mono)',
                      color: STATUS_COLORS[ad.status] || STATUS_COLORS.unrated,
                    }}
                  >
                    {ad.status === 'unrated' ? '—' : ad.status}
                  </div>
                  {/* Version count badge */}
                  {ad.versions && ad.versions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: '#2990fa',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: '0.55rem',
                        fontFamily: 'var(--font-ibm-plex-mono)',
                        color: '#ffffff',
                      }}
                    >
                      V{ad.versions.length + 1}
                    </div>
                  )}
                </div>
                {/* Headline */}
                <div
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.72rem',
                    color: '#ffffff',
                    fontFamily: 'var(--font-inter)',
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {ad.headline || 'No headline'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Modal ── */}
      {selectedAd && (
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
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedAd(null)
          }}
        >
          <div
            style={{
              background: '#0a1628',
              border: '1px solid #2990fa',
              borderRadius: 12,
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
                color: '#2990fa',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              AD DETAILS
            </div>

            {/* Version tabs */}
            {selectedAd.versions && selectedAd.versions.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  onClick={() => setSelectedVersionIdx(null)}
                  style={{
                    background: selectedVersionIdx === null ? '#2990fa' : 'transparent',
                    border: '1px solid #2990fa',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.65rem',
                    color: '#ffffff',
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    cursor: 'pointer',
                  }}
                >
                  V1
                </div>
                {selectedAd.versions.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVersionIdx(i)}
                    style={{
                      background: selectedVersionIdx === i ? '#2990fa' : 'transparent',
                      border: '1px solid #2990fa',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: '0.65rem',
                      color: '#ffffff',
                      fontFamily: 'var(--font-ibm-plex-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    V{i + 2}
                  </div>
                ))}
              </div>
            )}

            {/* Image thumbnail */}
            {displayAd?.imageB64 && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 180,
                  aspectRatio: '9 / 16',
                  margin: '0 auto 16px',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`data:image/png;base64,${displayAd.imageB64}`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Ad fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'HOOK', value: displayAd?.hook },
                { label: 'HEADLINE', value: displayAd?.headline },
                { label: 'PRIMARY TEXT', value: displayAd?.primaryText },
                { label: 'DESCRIPTION', value: displayAd?.description },
                { label: 'CTA', value: displayAd?.cta },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: '0.55rem',
                        fontFamily: 'var(--font-ibm-plex-mono)',
                        color: '#2990fa',
                        letterSpacing: '0.08em',
                        marginBottom: 4,
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#ffffff',
                        fontFamily: 'var(--font-inter)',
                        lineHeight: 1.5,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ) : null
              )}
            </div>

            {/* Action buttons row 1 */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <button
                onClick={() => updateAd(selectedAd.id, { status: 'Working' })}
                style={{
                  flex: 1,
                  background:
                    selectedAd.status === 'Working' ? 'rgba(0,229,200,0.15)' : 'transparent',
                  border: '1px solid #00e5c8',
                  borderRadius: 8,
                  padding: 8,
                  color: '#00e5c8',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}
              >
                ✓ Working
              </button>
              <button
                onClick={() => updateAd(selectedAd.id, { status: 'Not Working' })}
                style={{
                  flex: 1,
                  background:
                    selectedAd.status === 'Not Working'
                      ? 'rgba(255,68,85,0.15)'
                      : 'transparent',
                  border: '1px solid #ff4455',
                  borderRadius: 8,
                  padding: 8,
                  color: '#ff4455',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}
              >
                ✗ Not Working
              </button>
            </div>

            {/* Action buttons row 2 */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <button
                onClick={() => {
                  onRefine?.(selectedAd)
                  setSelectedAd(null)
                }}
                style={{
                  flex: 1,
                  background: '#2990fa',
                  border: 'none',
                  borderRadius: 8,
                  padding: 8,
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}
              >
                Refine
              </button>
              <button
                onClick={() => addVersion(selectedAd)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #2990fa',
                  borderRadius: 8,
                  padding: 8,
                  color: '#2990fa',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}
              >
                Split Test
              </button>
            </div>

            {/* Delete + Close */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => deleteAd(selectedAd.id)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid rgba(255,68,85,0.5)',
                  borderRadius: 8,
                  padding: 8,
                  color: '#ff4455',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedAd(null)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: 8,
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
