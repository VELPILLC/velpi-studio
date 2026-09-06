'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 3D laptop mockup — texture-maps a captured screenshot onto a procedurally
// built laptop instead of a downloaded model. Three CC0 sources were checked
// for an actual laptop/monitor asset (Poly Haven's electronics category is
// empty; Kenney's Furniture Kit couldn't be inspected without downloading a
// gated zip; the official Khronos glTF-Sample-Models set is reference
// objects — Duck, Avocado, DamagedHelmet — no devices) and none had a good
// fit. Building it procedurally instead guarantees the screen UV-maps
// correctly, the aspect ratio matches the captured canvas exactly, and the
// bezel color can be pulled straight from the app's own brand palette rather
// than whatever an arbitrary model shipped with.
//
// Same integration style as LightningBackground.js — raw three.js in a
// useEffect, a manual render loop, explicit dispose on unmount — rather than
// @react-three/fiber, so this doesn't add two more dependencies for a single
// scene.

const BEZEL_COLOR = 0x0a1730   // matches the app's PANEL/BG navy
const ACCENT_BLUE = 0x2990fa   // matches BLUE
const BACKDROP = '#03060f'     // matches the device-preview page's dark theme

export default function Device3DMockup({ screenCanvas, label, onClose }) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !screenCanvas) return

    const width = mount.clientWidth
    const height = mount.clientHeight
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100)
    camera.position.set(0, 1.6, 6.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    // preserveDrawingBuffer is required for a reliable toDataURL() capture —
    // without it the buffer can be cleared before a synchronous read.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Lighting: soft studio setup ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(3, 5, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(ACCENT_BLUE, 0.6)
    rim.position.set(-4, 2, -3)
    scene.add(rim)

    // ── Screen texture from the captured canvas ──
    const texture = new THREE.CanvasTexture(screenCanvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true

    // ── Laptop group, built to the real 16:10 aspect ratio of the capture ──
    const laptop = new THREE.Group()
    const screenW = 3.6
    const screenH = screenW * (screenCanvas.height / screenCanvas.width)
    const bezelPad = 0.11

    const bodyMat = new THREE.MeshStandardMaterial({ color: BEZEL_COLOR, roughness: 0.35, metalness: 0.4 })
    const accentMat = new THREE.MeshStandardMaterial({ color: ACCENT_BLUE, emissive: ACCENT_BLUE, emissiveIntensity: 0.5, roughness: 0.4 })

    // Base / keyboard deck.
    const base = new THREE.Mesh(new THREE.BoxGeometry(screenW + bezelPad * 2, 0.09, screenH * 0.82), bodyMat)
    base.position.y = -screenH / 2 - 0.045
    laptop.add(base)
    // Thin accent strip along the base's front edge.
    const strip = new THREE.Mesh(new THREE.BoxGeometry(screenW + bezelPad * 2, 0.012, 0.02), accentMat)
    strip.position.set(0, -screenH / 2 - 0.09 + 0.006, screenH * 0.41)
    laptop.add(strip)

    // Screen bezel (slightly tilted back like an open laptop).
    const hinge = new THREE.Group()
    hinge.position.y = -screenH / 2
    hinge.rotation.x = -0.16
    laptop.add(hinge)

    const bezelDepth = 0.06
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(screenW + bezelPad * 2, screenH + bezelPad * 2, bezelDepth), bodyMat)
    bezel.position.set(0, screenH / 2 + bezelPad, -bezelDepth / 2)
    hinge.add(bezel)

    const screenMat = new THREE.MeshBasicMaterial({ map: texture })
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat)
    screen.position.set(0, screenH / 2 + bezelPad, 0.001)
    hinge.add(screen)

    laptop.position.y = 0.15
    scene.add(laptop)

    // Soft contact shadow — a simple radial-gradient-alpha plane rather than
    // real shadow mapping, cheap and reliably soft at any angle.
    const shadowCanvas = document.createElement('canvas')
    shadowCanvas.width = shadowCanvas.height = 256
    const sctx = shadowCanvas.getContext('2d')
    const grad = sctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    grad.addColorStop(0, 'rgba(0,0,0,0.45)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    sctx.fillStyle = grad
    sctx.fillRect(0, 0, 256, 256)
    const shadowTex = new THREE.CanvasTexture(shadowCanvas)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(screenW * 2.1, screenW * 2.1),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -screenH / 2 - 0.09
    scene.add(shadow)

    // ── Controls — restrained so it always reads as a product shot ──
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.55, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 4.2
    controls.maxDistance = 8.5
    controls.minPolarAngle = Math.PI * 0.28
    controls.maxPolarAngle = Math.PI * 0.52
    controls.minAzimuthAngle = -Math.PI * 0.32
    controls.maxAzimuthAngle = Math.PI * 0.32
    controls.enablePan = false
    controls.update()

    let raf = 0
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()
    setReady(true)

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
      controls.dispose()
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const m of mats) { m.map?.dispose(); m.dispose() }
        }
      })
      texture.dispose()
      shadowTex.dispose()
      renderer.dispose()
      try { mount.removeChild(renderer.domElement) } catch (_) {}
      rendererRef.current = null
    }
  }, [screenCanvas])

  function downloadPng() {
    const renderer = rendererRef.current
    if (!renderer) return
    // Render happens continuously via the RAF loop above, so the buffer
    // already holds the current frame — safe to read immediately.
    const url = renderer.domElement.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${(label || 'website').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}-3d-mockup.png`
    a.click()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, background: BACKDROP, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', flexShrink: 0 }}>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>
          🖥 3D Mockup {label ? `— ${label}` : ''}
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={downloadPng}
            disabled={!ready}
            style={{ background: '#2990fa', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.5 }}
          >Download PNG</button>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 14px', fontSize: '0.78rem', cursor: 'pointer' }}
          >✕ Close</button>
        </span>
      </div>
      <div ref={mountRef} style={{ flex: 1, minHeight: 0 }} />
      <div style={{ textAlign: 'center', padding: '6px 0 12px', fontFamily: 'system-ui, sans-serif', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
        Drag to rotate
      </div>
    </div>
  )
}
