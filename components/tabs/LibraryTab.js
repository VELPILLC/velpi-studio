'use client'
import { useState, useEffect } from 'react'

const STATUS_COLORS = {
  Working: '#00e5c8',
  'Not Working': '#ff4455',
  unrated: 'rgba(255,255,255,0.4)',
}

function normalizeAd(ad) {
  return {
    ...ad,
    imageB64: ad.imageB64 || ad.image_b64 || null,
    imageConcept: ad.imageConcept || ad.image_concept || '',
    visualFormat: ad.visualFormat || ad.visual_format || '',
    primaryText: ad.primaryText || ad.primary_text || '',
    adType: ad.adType || ad.ad_type || '',
    avatarName: ad.avatarName || ad.avatar_name || '',
    avatarId: ad.avatarId || ad.avatar_id || null,
    versionNumber: ad.versionNumber || ad.version_number || 1,
    parentId: ad.parentId || ad.parent_id || null,
    createdAt: ad.createdAt || ad.created_at || null,
  }
}

export default function LibraryTab({ onEdit }) {
  const [ads, setAds] = useState([])
  const [selectedAd, setSelectedAd] = useState(null)
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  useEffect(() => {
    loadAds()
  }, [])

  async function loadAds() {
    try {
      const res = await fetch('/api/library')
      const data = await res.json()
      setAds((data.ads || []).map(normalizeAd))
    } catch (_) {}
  }

  async function updateAd(id, updates) {
    try {
      await fetch('/api/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      await loadAds()
      if (selectedAd?.id === id) setSelectedAd(a => ({ ...a, ...updates }))
    } catch (_) {}
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
    const newAds = ads.map(a => (a.id === ad.id ? { ...a, versions } : a))
    setAds(newAds)
    if (selectedAd?.id === ad.id) setSelectedAd(a => ({ ...a, versions }))
  }

  async function generateImageForModal() {
    if (!selectedAd || isGeneratingImage) return
    const concept = selectedAd.imageConcept
    const visualFormat = selectedAd.visualFormat
    if (!concept) return
    const prompt = `cinematic 9:16 vertical photo, ${concept}${visualFormat ? ', ' + visualFormat : ''}, no text, no logos, photorealistic, documentary style`
    setIsGeneratingImage(true)
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.b64) {
        setSelectedAd(a => ({ ...a, imageB64: data.b64 }))
        await updateAd(selectedAd.id, { image_b64: data.b64 })
      }
    } catch (err) {
      console.error('Modal generate image error:', err)
    }
    setIsGeneratingImage(false)
  }

  async function deleteAd(id) {
    try {
      await fetch('/api/library', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await loadAds()
      if (selectedAd?.id === id) setSelectedAd(null)
    } catch (_) {}
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

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(null)}
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
              Delete Ad
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5 }}>
              Delete this ad? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { deleteAd(deleteConfirm); setDeleteConfirm(null) }}
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
                onClick={() => setDeleteConfirm(null)}
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

            {/* Generate Image — shown when no image exists */}
            {!displayAd?.imageB64 && selectedAd.imageConcept && (
              <button
                onClick={generateImageForModal}
                disabled={isGeneratingImage}
                style={{
                  width: '100%',
                  background: isGeneratingImage ? '#0a1628' : '#00e5c8',
                  border: '1px solid #00e5c8',
                  borderRadius: 8,
                  padding: 10,
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: isGeneratingImage ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                  opacity: isGeneratingImage ? 0.7 : 1,
                }}
              >
                {isGeneratingImage ? 'Generating...' : '⚡ Generate Image'}
              </button>
            )}

            {/* Edit button */}
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => {
                  onEdit?.(selectedAd)
                  setSelectedAd(null)
                }}
                style={{
                  width: '100%',
                  background: '#2990fa',
                  border: 'none',
                  borderRadius: 8,
                  padding: 10,
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                }}
              >
                Edit
              </button>
            </div>

            {/* Delete + Close */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleteConfirm(selectedAd.id)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid rgba(255,68,85,0.5)',
                  borderRadius: 8,
                  padding: 8,
                  color: '#ff4455',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: 'pointer',
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
                  cursor: 'pointer',
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
