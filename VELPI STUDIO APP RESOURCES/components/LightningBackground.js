'use client'
import { useEffect, useRef } from 'react'

// Ambient lightning field — slow, aesthetic, moody. Canvas + rAF (JS-driven),
// so it works despite the app's global CSS animation kill-switch. Bolts are
// branching polylines in the brand blue with soft glow, fading in and out on
// long envelopes. Perf-conscious: DPR capped, paused when the tab is hidden,
// segment counts reduced on small screens, and static when the user prefers
// reduced motion.

const BLUE_CORE = 'rgba(190, 220, 255,'
const BLUE_GLOW = 'rgba(41, 144, 250,'
const AMBER_GLOW = 'rgba(255, 190, 110,'

function buildBolt(w, h, mobile) {
  // A bolt wanders from one random edge region toward another point.
  const edge = Math.random()
  const sx = edge < 0.5 ? Math.random() * w : (Math.random() < 0.5 ? 0 : w)
  const sy = edge < 0.5 ? (Math.random() < 0.5 ? 0 : h) : Math.random() * h
  const ex = Math.random() * w
  const ey = Math.random() * h
  const segs = mobile ? 14 : 22
  const pts = []
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const jitter = Math.sin(t * Math.PI) * (mobile ? 90 : 150)
    pts.push({
      x: sx + (ex - sx) * t + (Math.random() - 0.5) * jitter,
      y: sy + (ey - sy) * t + (Math.random() - 0.5) * jitter,
    })
  }
  // Branches peel off mid-bolt.
  const branches = []
  const branchCount = mobile ? 1 : 1 + Math.floor(Math.random() * 2)
  for (let b = 0; b < branchCount; b++) {
    const start = pts[4 + Math.floor(Math.random() * (segs - 8))]
    const bl = mobile ? 5 : 8
    const ang = Math.random() * Math.PI * 2
    const bpts = [{ ...start }]
    for (let i = 1; i <= bl; i++) {
      bpts.push({
        x: bpts[i - 1].x + Math.cos(ang) * (18 + Math.random() * 26) + (Math.random() - 0.5) * 30,
        y: bpts[i - 1].y + Math.sin(ang) * (18 + Math.random() * 26) + (Math.random() - 0.5) * 30,
      })
    }
    branches.push(bpts)
  }
  return {
    pts,
    branches,
    born: performance.now(),
    life: 6000 + Math.random() * 6000,     // slow: each bolt lives 6–12s
    amber: Math.random() < 0.14,           // occasional warm accent, like the reference
    peak: 0.28 + Math.random() * 0.3,      // max opacity — moody, never harsh
  }
}

function drawBolt(ctx, bolt, now) {
  const t = (now - bolt.born) / bolt.life
  if (t >= 1) return false
  // Slow breathe: ease in for 35%, hold, ease out.
  const env = t < 0.35 ? t / 0.35 : t > 0.7 ? (1 - t) / 0.3 : 1
  const alpha = Math.max(0, env * bolt.peak)
  if (alpha <= 0.004) return true
  const glow = bolt.amber ? AMBER_GLOW : BLUE_GLOW

  const paths = [bolt.pts, ...bolt.branches]
  for (let p = 0; p < paths.length; p++) {
    const pts = paths[p]
    const isBranch = p > 0
    // Wide soft glow pass
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.strokeStyle = `${glow}${alpha * (isBranch ? 0.35 : 0.55)})`
    ctx.lineWidth = isBranch ? 5 : 9
    ctx.stroke()
    // Bright core pass
    ctx.strokeStyle = `${BLUE_CORE}${alpha * (isBranch ? 0.5 : 0.9)})`
    ctx.lineWidth = isBranch ? 1 : 1.6
    ctx.stroke()
  }
  return true
}

export default function LightningBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let bolts = []
    let raf = 0
    let lastSpawn = 0
    let running = true

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const size = () => {
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    size()

    const isMobile = () => window.innerWidth < 760

    const frame = now => {
      if (!running) return
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      // Spawn slowly — 1-3 alive at a time keeps it ambient, not a storm.
      const spawnGap = isMobile() ? 5200 : 3600
      if (now - lastSpawn > spawnGap && bolts.length < (isMobile() ? 2 : 3)) {
        bolts.push(buildBolt(w, h, isMobile()))
        lastSpawn = now
      }
      bolts = bolts.filter(b => drawBolt(ctx, b, now))
      raf = requestAnimationFrame(frame)
    }

    if (reduced) {
      // Static, very faint single bolt — presence without motion.
      const b = buildBolt(window.innerWidth, window.innerHeight, isMobile())
      b.born = performance.now() - b.life * 0.5
      drawBolt(ctx, b, performance.now())
    } else {
      raf = requestAnimationFrame(frame)
    }

    const onVis = () => {
      running = !document.hidden && !reduced
      if (running) raf = requestAnimationFrame(frame)
      else cancelAnimationFrame(raf)
    }
    window.addEventListener('resize', size)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <>
      {/* Deep vignette base so the bolts glow out of darkness */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 35%, #0a1730 0%, #060d1f 55%, #03060f 100%)',
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.9 }}
      />
    </>
  )
}
