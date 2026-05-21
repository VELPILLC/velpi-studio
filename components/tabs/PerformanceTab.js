'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const ChartComponent = dynamic(() => import('../ChartWrapper'), { ssr: false })

function VelpiLogoSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="13" stroke="#3a9aff" strokeWidth="1.5" />
      <path d="M9 10 L15 21 L21 10" stroke="#3a9aff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function cplColor(cpl) {
  if (cpl < 30) return '#00e5c8'
  if (cpl < 60) return '#f59e0b'
  return '#ff4455'
}

export default function PerformanceTab({ activeUser }) {
  const [ads, setAds] = useState([])
  const [form, setForm] = useState({ name: '', spend: '', clicks: '', leads: '', impressions: '', creator: 'Cesar' })

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('velpi_ads') || '[]')
      setAds(saved)
    } catch (_) {}
  }, [])

  function saveAds(newAds) {
    setAds(newAds)
    localStorage.setItem('velpi_ads', JSON.stringify(newAds))
  }

  function logAd() {
    const spend = parseFloat(form.spend) || 0
    const clicks = parseInt(form.clicks) || 0
    const leads = parseInt(form.leads) || 0
    const impressions = parseInt(form.impressions) || 0
    const cpl = leads > 0 ? spend / leads : 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const entry = {
      id: Date.now(),
      name: form.name || 'Untitled',
      spend,
      clicks,
      leads,
      impressions,
      cpl: Math.round(cpl * 100) / 100,
      ctr: Math.round(ctr * 100) / 100,
      creator: form.creator,
      date: new Date().toLocaleDateString(),
    }
    const newAds = [...ads, entry]
    saveAds(newAds)
    setForm({ name: '', spend: '', clicks: '', leads: '', impressions: '', creator: form.creator })
  }

  function deleteAd(id) {
    saveAds(ads.filter(a => a.id !== id))
  }

  function clearAll() {
    saveAds([])
  }

  const totalSpend = ads.reduce((s, a) => s + a.spend, 0)
  const totalLeads = ads.reduce((s, a) => s + a.leads, 0)
  const avgCpl = ads.length > 0 ? totalSpend / Math.max(totalLeads, 1) : 0
  const bestCtr = ads.length > 0 ? Math.max(...ads.map(a => a.ctr)) : 0

  function getInsight() {
    if (ads.length === 0) return "Log your first ad and I will tell you what the numbers mean."
    if (ads.length === 1) {
      const a = ads[0]
      const cpl = a.cpl
      if (cpl < 30) return `${a.name} is running at $${cpl} CPL — strong. Keep pushing this creative.`
      if (cpl < 60) return `${a.name} at $${cpl} CPL. Test a new hook to bring that down.`
      return `${a.name} at $${cpl} CPL is bleeding budget. Pause and rework the creative.`
    }
    const best = ads.reduce((b, a) => a.cpl > 0 && (b === null || a.cpl < b.cpl) ? a : b, null)
    const worst = ads.reduce((w, a) => a.cpl > 0 && (w === null || a.cpl > w.cpl) ? a : w, null)
    if (!best || !worst) return `Tracking ${ads.length} ads. Keep logging data.`
    if (best.id === worst.id) return `Only one ad with leads. ${best.name} at $${best.cpl} CPL.`
    return `Best: ${best.name} at $${best.cpl} CPL. Worst: ${worst.name} at $${worst.cpl} CPL. Scale the winner.`
  }

  // Chart data
  const chartLabels = ads.map(a => a.name)
  const cplData = ads.map(a => a.cpl)
  const leadsData = ads.map(a => a.leads)
  const spendData = ads.map(a => a.spend)

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: '#0e1e35' },
        ticks: { color: '#4a6a8a', font: { family: 'var(--font-ibm-plex-mono)', size: 10 } },
      },
      y: {
        grid: { color: '#0e1e35' },
        ticks: { color: '#4a6a8a', font: { family: 'var(--font-ibm-plex-mono)', size: 10 } },
      },
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'TOTAL SPEND', value: `$${totalSpend.toLocaleString()}` },
          { label: 'TOTAL LEADS', value: totalLeads },
          { label: 'AVG CPL', value: `$${avgCpl.toFixed(2)}` },
          { label: 'BEST CTR', value: `${bestCtr.toFixed(2)}%` },
        ].map(card => (
          <div key={card.label} style={{ background: '#080f1e', border: '1px solid #152840', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '2rem', color: '#c8dcf5', lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.5rem', color: '#4a6a8a', letterSpacing: '0.1em', marginTop: 4 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Jarvis Insight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#080f1e', border: '1px solid #152840', borderRadius: 10, padding: '0.85rem 1.25rem' }}>
        <VelpiLogoSmall />
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', fontStyle: 'italic', color: '#c8dcf5', flex: 1 }}>
          {getInsight()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Log Ad form */}
        <section style={{ background: '#080f1e', border: '1px solid #152840', borderRadius: 10, padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase', marginBottom: '1rem' }}>
            LOG AD
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'name', label: 'AD NAME', type: 'text' },
              { key: 'spend', label: 'SPEND ($)', type: 'number' },
              { key: 'clicks', label: 'CLICKS', type: 'number' },
              { key: 'leads', label: 'LEADS', type: 'number' },
              { key: 'impressions', label: 'IMPRESSIONS', type: 'number' },
            ].map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
            <div>
              <label style={labelStyle}>CREATOR</label>
              <select
                value={form.creator}
                onChange={e => setForm(f => ({ ...f, creator: e.target.value }))}
                style={{ ...inputStyle, background: '#060e1c' }}
              >
                <option value="Cesar">Cesar</option>
                <option value="Angel">Angel</option>
              </select>
            </div>
            <button
              onClick={logAd}
              style={{ background: '#1d6ff5', border: 'none', color: 'white', borderRadius: 7, padding: '0.6rem', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.06em', marginTop: 4 }}
            >
              LOG AD
            </button>
          </div>
        </section>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ads.length > 0 ? (
            <>
              <div style={chartCard}>
                <div style={chartLabel}>CPL OVER TIME</div>
                <div style={{ height: 160 }}>
                  <ChartComponent
                    type="line"
                    data={{
                      labels: chartLabels,
                      datasets: [{
                        data: cplData,
                        borderColor: '#1d6ff5',
                        backgroundColor: 'rgba(29,111,245,0.08)',
                        fill: true,
                        tension: 0,
                        pointRadius: 3,
                        pointBackgroundColor: '#1d6ff5',
                        borderWidth: 2,
                      }],
                    }}
                    options={chartDefaults}
                  />
                </div>
              </div>

              <div style={chartCard}>
                <div style={chartLabel}>LEADS PER AD</div>
                <div style={{ height: 160 }}>
                  <ChartComponent
                    type="bar"
                    data={{
                      labels: chartLabels,
                      datasets: [{
                        data: leadsData,
                        backgroundColor: 'rgba(0,229,200,0.7)',
                        borderRadius: 4,
                        borderWidth: 0,
                      }],
                    }}
                    options={chartDefaults}
                  />
                </div>
              </div>

              <div style={chartCard}>
                <div style={chartLabel}>SPEND VS LEADS (×10)</div>
                <div style={{ height: 160 }}>
                  <ChartComponent
                    type="bar"
                    data={{
                      labels: chartLabels,
                      datasets: [
                        {
                          label: 'Spend',
                          data: spendData,
                          backgroundColor: 'rgba(29,111,245,0.7)',
                          borderRadius: 4,
                          borderWidth: 0,
                        },
                        {
                          label: 'Leads ×10',
                          data: leadsData.map(l => l * 10),
                          backgroundColor: 'rgba(0,229,200,0.7)',
                          borderRadius: 4,
                          borderWidth: 0,
                        },
                      ],
                    }}
                    options={{
                      ...chartDefaults,
                      plugins: {
                        ...chartDefaults.plugins,
                        legend: {
                          display: true,
                          labels: {
                            color: '#4a6a8a',
                            font: { family: 'var(--font-ibm-plex-mono)', size: 10 },
                            boxWidth: 10,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ ...chartCard, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#4a6a8a', fontSize: '0.78rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>
              Log your first ad to see charts
            </div>
          )}
        </div>
      </div>

      {/* Ad Log Table */}
      {ads.length > 0 && (
        <section style={{ background: '#080f1e', border: '1px solid #152840', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.6rem', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.12em', color: '#4a6a8a', textTransform: 'uppercase' }}>
              AD LOG
            </h2>
            <button
              onClick={clearAll}
              style={{ background: 'transparent', border: '1px solid #1d3a58', color: '#4a6a8a', borderRadius: 5, padding: '0.25rem 0.65rem', fontSize: '0.65rem', fontFamily: 'var(--font-ibm-plex-mono)' }}
            >
              Clear All
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'var(--font-ibm-plex-mono)' }}>
              <thead>
                <tr>
                  {['AD', 'SPEND', 'CLICKS', 'LEADS', 'CPL', 'CTR', 'BY', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', color: '#4a6a8a', fontSize: '0.55rem', letterSpacing: '0.08em', padding: '0.4rem 0.6rem', borderBottom: '1px solid #0e1e35' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ads.map(ad => (
                  <tr key={ad.id} style={{ borderBottom: '1px solid #0e1e35' }}>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#c8dcf5' }}>
                      <div style={{ fontWeight: 600 }}>{ad.name}</div>
                      <div style={{ fontSize: '0.6rem', color: '#4a6a8a', marginTop: 2 }}>{ad.date}</div>
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#c8dcf5' }}>${ad.spend}</td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#c8dcf5' }}>{ad.clicks}</td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#c8dcf5' }}>{ad.leads}</td>
                    <td style={{ padding: '0.5rem 0.6rem', color: cplColor(ad.cpl), fontWeight: 600 }}>${ad.cpl}</td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#c8dcf5' }}>{ad.ctr}%</td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#4a6a8a' }}>{ad.creator}</td>
                    <td style={{ padding: '0.5rem 0.6rem' }}>
                      <button
                        onClick={() => deleteAd(ad.id)}
                        style={{ background: 'transparent', border: 'none', color: '#4a6a8a', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

const labelStyle = {
  fontSize: '0.6rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
  color: '#4a6a8a',
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: 4,
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  height: 34,
  background: '#060e1c',
  border: '1px solid #152840',
  borderRadius: 6,
  padding: '0 0.75rem',
  fontSize: '0.78rem',
  color: '#c8dcf5',
  fontFamily: 'var(--font-inter)',
}

const chartCard = {
  background: '#080f1e',
  border: '1px solid #152840',
  borderRadius: 10,
  padding: '1rem',
}

const chartLabel = {
  fontSize: '0.55rem',
  fontFamily: 'var(--font-ibm-plex-mono)',
  color: '#4a6a8a',
  letterSpacing: '0.1em',
  marginBottom: 10,
  textTransform: 'uppercase',
}
