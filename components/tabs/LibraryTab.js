'use client'
import { useState, useEffect } from 'react'

const STATUS_COLORS = {
  Working: '#00e5c8',
  'Not Working': '#ff4455',
  unrated: 'rgba(255,255,255,0.4)',
  complete: 'rgba(255,255,255,0.4)',
  draft: '#e5c07b',
}

// Fields to check for draft completion indicators
const DRAFT_FIELDS = [
  { key: 'angle', label: 'AVATAR' },
  { key: 'hook', label: 'HOOK' },
  { key: 'imageConcept', label: 'IMAGE' },
  { key: 'headline', label: 'HEADLINE' },
  { key: 'primaryText', label: 'PRIMARY TEXT' },
  { key: 'description', label: 'DESCRIPTION' },
  { key: 'cta', label: 'CTA' },
]

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

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch (_) { return '' }
}

function downloadAdPdf(ad) {
  if (typeof window === 'undefined' || !window.jspdf) return
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(41, 144, 250)
  doc.text('VELPI STUDIO', margin, y)
  y += 10

  if (ad.imageB64) {
    try {
      const imgW = 55
      const imgH = Math.round(imgW * (16 / 9))
      const imgX = (pageW - imgW) / 2
      doc.addImage(`data:image/png;base64,${ad.imageB64}`, 'PNG', imgX, y, imgW, imgH)
      y += imgH + 8
    } catch (_) {}
  }

  const fields = [
    { label: 'HOOK', value: ad.hook },
    { label: 'HEADLINE', value: ad.headline },
    { label: 'PRIMARY TEXT', value: ad.primaryText },
    { label: 'DESCRIPTION', value: ad.description },
    { label: 'CTA', value: ad.cta },
  ]

  for (const { label, value } of fields) {
    if (!value) continue
    if (y > 268) { doc.addPage(); y = margin }
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 144, 250)
    doc.text(label, margin, y)
    y += 5
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20, 20, 20)
    const lines = doc.splitTextToSize(value, pageW - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 5.5 + 6
  }

  const filename = (ad.hook || 'velpi-ad').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  doc.save(`${filename}.pdf`)
}

export default function LibraryTab({ onEdit }) {
  const [ads, setAds] = useState([])
  const [selectedAd, setSelectedAd] = useState(null)
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ── Multi-select state ──
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  // ── Card context menu ──
  const [cardMenu, setCardMenu] = useState(null) // { id, top, left }

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

  // ── Bulk delete ──
  async function bulkDelete() {
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch('/api/library', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        )
      )
      await loadAds()
      if (selectedAd && selectedIds.includes(selectedAd.id)) setSelectedAd(null)
    } catch (_) {}
    setSelectedIds([])
    setSelectMode(false)
    setBulkDeleteConfirm(false)
  }

  function toggleSelect(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds([])
  }

  function selectAll() {
    setSelectedIds(ads.map(a => a.id))
  }

  function openCardMenu(e, ad) {
    e.stopPropagation()
    if (cardMenu?.id === ad.id) { setCardMenu(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setCardMenu({ id: ad.id, top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 164) })
  }

  // A completed ad has all DRAFT_FIELDS populated; otherwise it is a draft
  const isAdComplete = (ad) => DRAFT_FIELDS.every(({ key }) => !!ad[key])
  const drafts = ads.filter(ad => !isAdComplete(ad))
  const completedAds = ads.filter(ad => isAdComplete(ad))

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
            color: '#ffffff',
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

      {/* ── SELECT MODE CONTROL ── */}
      {ads.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {selectMode ? (
            <>
              <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>
                {selectedIds.length} selected
              </span>
              <button
                onClick={selectAll}
                style={{ background: 'transparent', border: '1px solid #152840', borderRadius: 6, padding: '5px 12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem', cursor: 'pointer', letterSpacing: '0.04em' }}
              >
                Select All
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  style={{ background: '#ff4455', border: 'none', borderRadius: 6, padding: '5px 14px', color: '#ffffff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.62rem', cursor: 'pointer', letterSpacing: '0.04em' }}
                >
                  🗑 Delete {selectedIds.length}
                </button>
              )}
              <button
                onClick={exitSelectMode}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '5px 12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.6rem', cursor: 'pointer', letterSpacing: '0.04em' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              style={{ background: 'transparent', border: '1px solid rgba(255,68,85,0.5)', borderRadius: 6, padding: '5px 14px', color: '#ff4455', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.62rem', cursor: 'pointer', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🗑 Select to Delete
            </button>
          )}
        </div>
      )}

      {/* ── DRAFTS SECTION ── */}
      {drafts.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: '0.6rem',
              fontFamily: 'var(--font-ibm-plex-mono)',
              color: '#e5c07b',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            DRAFTS
            <span
              style={{
                background: '#e5c07b22',
                border: '1px solid #e5c07b',
                borderRadius: 10,
                padding: '1px 7px',
                fontSize: '0.52rem',
                color: '#e5c07b',
              }}
            >
              {drafts.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {drafts.map(ad => {
              const isSelected = selectedIds.includes(ad.id)
              return (
                <div
                  key={ad.id}
                  onClick={() => {
                    if (selectMode) { toggleSelect(ad.id); return }
                    onEdit?.(ad)
                  }}
                  style={{
                    width: 180,
                    background: '#0a1628',
                    border: isSelected ? '2px solid #2990fa' : '1px solid #e5c07b',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    opacity: selectMode && !isSelected ? 0.55 : 1,
                  }}
                >
                  {/* Thumbnail area */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '9 / 16',
                      background: '#060d1f',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 12,
                    }}
                  >
                    {ad.imageB64 && (
                      <img
                        src={`data:image/png;base64,${ad.imageB64}`}
                        alt=""
                        style={{
                          position: 'absolute', inset: 0,
                          width: '100%', height: '100%',
                          objectFit: 'cover', opacity: 0.35,
                        }}
                      />
                    )}
                    {/* Selection indicator — top left */}
                    {selectMode && (
                      <div style={{
                        position: 'absolute', top: 6, left: 6, zIndex: 3,
                        width: 22, height: 22, borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#2990fa' : 'rgba(255,255,255,0.6)'}`,
                        background: isSelected ? '#2990fa' : 'rgba(6,13,31,0.75)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && (
                          <span style={{ color: '#fff', fontSize: '0.65rem', lineHeight: 1 }}>✓</span>
                        )}
                      </div>
                    )}
                    {/* Confirmed section chips */}
                    <div
                      style={{
                        position: 'relative', zIndex: 1,
                        display: 'flex', flexWrap: 'wrap',
                        gap: 4, justifyContent: 'center',
                      }}
                    >
                      {DRAFT_FIELDS.map(({ key, label }) =>
                        ad[key] ? (
                          <span
                            key={key}
                            style={{
                              background: '#e5c07b22',
                              border: '1px solid #e5c07b',
                              borderRadius: 3,
                              padding: '2px 5px',
                              fontSize: '0.42rem',
                              color: '#e5c07b',
                              fontFamily: 'var(--font-ibm-plex-mono)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {label}
                          </span>
                        ) : null
                      )}
                    </div>
                    {/* DRAFT badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 6, right: 6,
                        background: '#e5c07b',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: '0.5rem',
                        fontFamily: 'var(--font-ibm-plex-mono)',
                        color: '#000000',
                        letterSpacing: '0.04em',
                        fontWeight: 600,
                      }}
                    >
                      DRAFT
                    </div>
                  </div>
                  {/* Bottom info + ⋯ menu button */}
                  <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: '#ffffff', fontFamily: 'var(--font-inter)', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ad.hook || ad.avatarName || 'Untitled draft'}
                      </div>
                      {ad.createdAt && (
                        <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 2 }}>
                          {formatDate(ad.createdAt)}
                        </div>
                      )}
                    </div>
                    {!selectMode && (
                      <button
                        onClick={e => openCardMenu(e, ad)}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', cursor: 'pointer', padding: '0 2px', flexShrink: 0, lineHeight: 1 }}
                      >⋯</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── COMPLETED ADS ── */}
      {completedAds.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.6rem',
              fontFamily: 'var(--font-ibm-plex-mono)',
              color: '#2990fa',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            COMPLETED
            <span
              style={{
                background: '#2990fa22',
                border: '1px solid #2990fa',
                borderRadius: 10,
                padding: '1px 7px',
                fontSize: '0.52rem',
                color: '#2990fa',
              }}
            >
              {completedAds.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {completedAds.map(ad => {
              const isSelected = selectedIds.includes(ad.id)
              return (
                <div
                  key={ad.id}
                  onClick={() => {
                    if (selectMode) { toggleSelect(ad.id); return }
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
                    outline: isSelected ? '2px solid #2990fa' : 'none',
                    outlineOffset: '-1px',
                    opacity: selectMode && !isSelected ? 0.55 : 1,
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
                          color: 'rgba(255,255,255,0.55)',
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-ibm-plex-mono)',
                        }}
                      >
                        No image
                      </div>
                    )}
                    {/* Selection indicator — top left (replaces version badge in select mode) */}
                    {selectMode ? (
                      <div style={{
                        position: 'absolute', top: 6, left: 6, zIndex: 3,
                        width: 22, height: 22, borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#2990fa' : 'rgba(255,255,255,0.6)'}`,
                        background: isSelected ? '#2990fa' : 'rgba(6,13,31,0.75)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && (
                          <span style={{ color: '#fff', fontSize: '0.65rem', lineHeight: 1 }}>✓</span>
                        )}
                      </div>
                    ) : (
                      /* Version count badge (only when not in select mode) */
                      ad.versions && ad.versions.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 6, left: 6,
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
                      )
                    )}
                    {/* Blue overlay when selected */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(41,144,250,0.18)',
                        zIndex: 2,
                      }} />
                    )}
                  </div>
                  {/* Headline + ⋯ */}
                  <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ flex: 1, fontSize: '0.72rem', color: '#ffffff', fontFamily: 'var(--font-inter)', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ad.headline || 'No headline'}
                    </div>
                    {!selectMode && (
                      <button
                        onClick={e => openCardMenu(e, ad)}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', cursor: 'pointer', padding: '0 2px', flexShrink: 0, lineHeight: 1 }}
                      >⋯</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Bulk Delete Floating Bar ── */}
      {selectMode && selectedIds.length > 0 && (
        <div
          style={{
            position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            background: '#0a1628', border: '1px solid #ff4455',
            borderRadius: 12, padding: '12px 22px',
            display: 'flex', alignItems: 'center', gap: 18,
            zIndex: 2000, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.7rem',
            color: '#ffffff', letterSpacing: '0.04em',
          }}>
            {selectedIds.length} selected
          </span>
          <button
            onClick={() => setBulkDeleteConfirm(true)}
            style={{
              background: '#ff4455', border: 'none', borderRadius: 8,
              padding: '9px 20px', color: '#ffffff',
              fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.75rem',
              cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            Delete {selectedIds.length}
          </button>
        </div>
      )}

      {/* ── Bulk Delete Confirmation ── */}
      {bulkDeleteConfirm && (
        <div
          onClick={() => setBulkDeleteConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3001,
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
              Delete {selectedIds.length} {selectedIds.length === 1 ? 'Ad' : 'Ads'}
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5 }}>
              Delete {selectedIds.length} selected {selectedIds.length === 1 ? 'ad' : 'ads'}? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={bulkDelete}
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
                onClick={() => setBulkDeleteConfirm(false)}
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

      {/* ── Delete Confirmation Modal (single ad) ── */}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', color: '#2990fa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                AD DETAILS
              </div>
              <button
                onClick={() => downloadAdPdf(displayAd)}
                style={{ background: 'transparent', border: '1px solid rgba(41,144,250,0.4)', borderRadius: 6, padding: '5px 12px', color: '#2990fa', fontSize: '0.62rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', letterSpacing: '0.04em' }}
              >
                ⬇ PDF
              </button>
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

            {/* Image thumbnail with download icon */}
            {displayAd?.imageB64 && (
              <div style={{ position: 'relative', width: '100%', maxWidth: 180, margin: '0 auto 16px' }}>
                <div style={{ aspectRatio: '9 / 16', borderRadius: 8, overflow: 'hidden' }}>
                  <img
                    src={`data:image/png;base64,${displayAd.imageB64}`}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <button
                  onClick={() => {
                    const name = (displayAd.hook || 'velpi-image').replace(/[^a-z0-9]/gi, '-').toLowerCase()
                    const a = document.createElement('a')
                    a.href = `data:image/png;base64,${displayAd.imageB64}`
                    a.download = `${name}.png`
                    a.click()
                  }}
                  title="Download image"
                  style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#ffffff', borderRadius: 5, padding: '4px 7px', cursor: 'pointer', fontSize: '0.85rem' }}
                >⬇</button>
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

            {/* Edit button */}
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => { onEdit?.(selectedAd); setSelectedAd(null) }}
                style={{ width: '100%', background: '#2990fa', border: 'none', borderRadius: 8, padding: 10, color: '#ffffff', fontSize: '0.75rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer', letterSpacing: '0.06em' }}
              >
                Edit
              </button>
            </div>

            {/* Delete + Download PDF + Close */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleteConfirm(selectedAd.id)}
                style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,68,85,0.5)', borderRadius: 8, padding: 8, color: '#ff4455', fontSize: '0.75rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer' }}
              >
                Delete
              </button>
              <button
                onClick={() => downloadAdPdf(displayAd)}
                style={{ flex: 1, background: 'transparent', border: '1px solid rgba(41,144,250,0.5)', borderRadius: 8, padding: 8, color: '#2990fa', fontSize: '0.75rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer' }}
              >
                ⬇ PDF
              </button>
              <button
                onClick={() => setSelectedAd(null)}
                style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: 8, color: '#ffffff', fontSize: '0.75rem', fontFamily: 'var(--font-ibm-plex-mono)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CARD CONTEXT MENU ── */}
      {cardMenu && (() => {
        const menuAd = ads.find(a => a.id === cardMenu.id)
        if (!menuAd) return null
        const complete = isAdComplete(menuAd)
        return (
          <>
            <div onClick={() => setCardMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 1998 }} />
            <div style={{
              position: 'fixed', top: cardMenu.top, left: cardMenu.left, zIndex: 1999,
              background: '#0a1628', border: '1px solid #2990fa',
              borderRadius: 10, overflow: 'hidden', minWidth: 156,
              boxShadow: '0 8px 28px rgba(0,0,0,0.85)',
            }}>
              {complete && (
                <div
                  onClick={() => { setSelectedAd(menuAd); setSelectedVersionIdx(null); setCardMenu(null) }}
                  style={{ padding: '10px 16px', fontSize: '0.8rem', color: '#ffffff', fontFamily: 'var(--font-inter)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #152840' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#152840'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  👁 View
                </div>
              )}
              <div
                onClick={() => { onEdit?.(menuAd); setCardMenu(null) }}
                style={{ padding: '10px 16px', fontSize: '0.8rem', color: '#ffffff', fontFamily: 'var(--font-inter)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #152840' }}
                onMouseEnter={e => e.currentTarget.style.background = '#152840'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                ✎ Edit
              </div>
              <div
                onClick={() => { setDeleteConfirm(menuAd.id); setCardMenu(null) }}
                style={{ padding: '10px 16px', fontSize: '0.8rem', color: '#ff4455', fontFamily: 'var(--font-inter)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a0a0d'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🗑 Delete
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
