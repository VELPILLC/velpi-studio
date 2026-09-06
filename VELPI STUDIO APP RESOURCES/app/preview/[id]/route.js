export const maxDuration = 60

import { getProject } from '../../../lib/supabase'

// Public live preview: /preview/{id} serves the saved build as a real web page —
// shareable with clients, browsable from the gallery. Tokens are substituted
// server-side: pasted GHL URLs win, then stored generated assets, then the
// scraped logo, then a labeled placeholder.

function placeholderSvg(text) {
  const t = encodeURIComponent(String(text || 'image').slice(0, 40))
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect width='100%25' height='100%25' fill='%23233248'/%3E%3Ctext x='50%25' y='50%25' fill='%237d8aa0' font-family='monospace' font-size='36' text-anchor='middle'%3E${t}%3C/text%3E%3C/svg%3E`
}

export async function GET(request, { params }) {
  try {
    const id = params?.id
    if (!id) return new Response('Not found', { status: 404 })

    const project = await getProject(id)
    const d = project?.data
    if (!d?.htmlTemplate) return new Response('Preview not found', { status: 404 })

    const assets = d.assetsById || {}
    const ghl = d.ghlUrls || {}
    const slots = d.slots || []

    const html = String(d.htmlTemplate).replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, tid) => {
      if (ghl[tid]?.trim()) return ghl[tid].trim()
      if (assets[tid]) return assets[tid]
      if (tid === 'logo') return d.refinedLogo || d.logoUrl || placeholderSvg('logo')
      const slot = slots.find(s => s.id === tid)
      return placeholderSvg(slot ? slot.name : tid)
    })

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (err) {
    console.error('preview error:', err)
    return new Response('Preview unavailable', { status: 500 })
  }
}
