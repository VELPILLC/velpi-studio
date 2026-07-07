'use client'
import { useEffect, useState } from 'react'

// Developer shadow-mode dashboard for the Creative Intelligence Layer.
// Route: /creative-debug  (dev/review tool only — reads /api/creative/inspect).
// Renders nothing about production; shows CIL shadow metrics + a run browser.
// If CIL_MODE is off, the inspect route returns { disabled: true } and this
// page shows how to enable it.

const C = { bg: '#0b1220', panel: '#121a2b', border: '#22304a', text: '#e8eefc', dim: '#8ea0c0', blue: '#4c8dff', green: '#39d98a', amber: '#e5c07b', red: '#ff6675' }

export default function CreativeDebug() {
  const [data, setData] = useState(null)
  const [run, setRun] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true); setErr(null)
    try {
      const r = await fetch('/api/creative/inspect').then(x => x.json())
      if (!r.ok) { setErr(r.disabled ? 'CIL is OFF. Set CIL_MODE=shadow (server) and NEXT_PUBLIC_CIL_MODE=shadow (client), then run generations.' : (r.error || 'failed')); setData(null) }
      else setData(r)
    } catch (e) { setErr(String(e?.message || e)) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function openRun(id) {
    setRun({ loading: true, id })
    try { const r = await fetch(`/api/creative/inspect?id=${encodeURIComponent(id)}`).then(x => x.json()); setRun(r.ok ? { id, directive: r.run?.directive } : { id, error: r.error }) }
    catch (e) { setRun({ id, error: String(e?.message || e) }) }
  }

  const m = data?.metrics
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'ui-monospace, Menlo, monospace', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>CIL Shadow Dashboard</h1>
        <button onClick={load} style={btn}>↻ Refresh</button>
      </div>
      {loading && <div style={{ color: C.dim }}>Loading…</div>}
      {err && <div style={{ background: '#2a0d12', border: `1px solid ${C.red}`, borderRadius: 8, padding: 12, color: '#ffb3bd' }}>{err}</div>}

      {m && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 10, marginBottom: 16 }}>
            <Stat label="Runs" value={m.n} />
            <Stat label="Validator pass rate" value={`${m.validator.pass_rate_pct}%`} color={m.validator.pass_rate_pct >= 70 ? C.green : C.amber} />
            <Stat label="Score p50 / p95" value={`${m.validator.score_p50} / ${m.validator.score_p95}`} />
            <Stat label="Confidence mean" value={m.confidence.mean} />
            <Stat label="Overrides / run" value={m.overrides.mean_per_run} />
            <Stat label="Latency p95 (total)" value={`${Math.round((m.stage_latency.total.p95_ms || 0) / 100) / 10}s`} />
            <Stat label="Tokens / run (mean)" value={m.tokens.total_mean} />
            <Stat label="Failure rate" value={`${m.failures.failure_rate_pct}%`} color={m.failures.failure_rate_pct > 5 ? C.amber : C.green} />
            <Stat label="Repair rate (any)" value={`${m.repairs.any_rate_pct}%`} />
            <Stat label="Bespoke ≥3 rate" value={`${m.bespoke_ok_rate_pct}%`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Panel title="Stage latency (mean ms)">
              {['understanding', 'strategy', 'creative_director', 'blueprint', 'validation'].map(s => (
                <Row key={s} k={s} v={`${m.stage_latency[s]?.mean_ms ?? 0} ms · ${m.tokens.per_stage[s]?.output_mean ?? 0} out-tok`} />
              ))}
            </Panel>
            <Panel title="Top overridden seeds">
              {(m.overrides.top || []).slice(0, 8).map(o => <Row key={o.param} k={o.param} v={`${o.count} (${o.rate_pct}%)`} />)}
              {!m.overrides.top?.length && <div style={{ color: C.dim }}>none</div>}
            </Panel>
            <Panel title="Score histogram">
              {m.validator.score_histogram.map(b => <Row key={b.range} k={b.range} v={bar(b.count, m.n)} />)}
            </Panel>
            <Panel title="Failure reasons">
              {(m.failures.by_reason || []).map(f => <Row key={f.reason} k={f.reason} v={String(f.count)} color={C.red} />)}
              {!m.failures.by_reason?.length && <div style={{ color: C.green }}>no failures</div>}
            </Panel>
          </div>

          <Panel title={`Runs (${data.runs.length})`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 60px 60px 70px 90px', gap: 6, fontSize: 12, color: C.dim, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
              <span>business / id</span><span>tier</span><span>pass</span><span>score</span><span>conf</span><span>tokens</span>
            </div>
            {data.runs.map(r => (
              <div key={r.id} onClick={() => openRun(r.id)} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 60px 60px 70px 90px', gap: 6, fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.id}>{r.businessName || r.id}</span>
                <span style={{ color: C.dim }}>{r.tier || '—'}</span>
                <span style={{ color: r.rollup?.passed ? C.green : C.red }}>{r.rollup?.passed === true ? '✓' : r.rollup?.passed === false ? '✗' : '—'}</span>
                <span>{r.rollup?.score ?? '—'}</span>
                <span>{r.rollup?.overall_confidence ?? '—'}</span>
                <span style={{ color: C.dim }}>{r.rollup?.tokens?.total ?? '—'}</span>
              </div>
            ))}
            {!data.runs.length && <div style={{ color: C.dim, paddingTop: 8 }}>No assembled runs yet. Enable shadow mode and generate.</div>}
          </Panel>
        </>
      )}

      {run && (
        <div onClick={() => setRun(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', padding: 30, overflow: 'auto', zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 900, margin: '0 auto', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <b>Run {run.id}</b><button onClick={() => setRun(null)} style={btn}>✕</button>
            </div>
            {run.loading && <div style={{ color: C.dim }}>Loading…</div>}
            {run.error && <div style={{ color: C.red }}>{run.error}</div>}
            {run.directive && <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, color: C.dim, maxHeight: '70vh', overflow: 'auto' }}>{JSON.stringify(run.directive, null, 2)}</pre>}
          </div>
        </div>
      )}
    </div>
  )
}

const btn = { background: 'transparent', border: '1px solid #4c8dff', color: '#4c8dff', borderRadius: 6, padding: '5px 12px', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }
function Stat({ label, value, color }) {
  return <div style={{ background: '#121a2b', border: '1px solid #22304a', borderRadius: 8, padding: 12 }}>
    <div style={{ fontSize: 11, color: '#8ea0c0', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, color: color || '#e8eefc' }}>{value}</div>
  </div>
}
function Panel({ title, children }) {
  return <div style={{ background: '#121a2b', border: '1px solid #22304a', borderRadius: 8, padding: 12 }}>
    <div style={{ fontSize: 12, color: '#8ea0c0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
    {children}
  </div>
}
function Row({ k, v, color }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
    <span style={{ color: '#8ea0c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{k}</span>
    <span style={{ color: color || '#e8eefc' }}>{v}</span>
  </div>
}
function bar(count, n) { const w = n ? Math.round((count / n) * 20) : 0; return `${'█'.repeat(w)}${'·'.repeat(20 - w)} ${count}` }
