// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { getSavedPalette, savePalette } from '../../../lib/supabase'

// Crawl the WHOLE site: resolve input -> map site links -> scrape the key pages
// (home + about/services/menu/contact/etc) -> merge everything into one content blob.

const EXTRA_PAGE_LIMIT = 5
const PRIORITY = /about|service|menu|contact|team|gallery|pricing|location|hour|review|testimonial|portfolio|work|faq/i

function looksLikeUrl(input) {
  const s = input.trim()
  if (/\s/.test(s) && !/^https?:\/\//i.test(s)) return false
  if (/^https?:\/\//i.test(s)) return true
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s)
}

function normalizeUrl(input) {
  const s = input.trim()
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch (_) { return '' }
}

function absolutize(src, baseUrl) {
  if (!src) return null
  try { return new URL(src, baseUrl).href } catch (_) { return null }
}

function extractImages(html, baseUrl) {
  const out = []
  const seen = new Set()
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let m
  while ((m = re.exec(html)) && out.length < 40) {
    const abs = absolutize(m[1], baseUrl)
    if (abs && !seen.has(abs) && !abs.startsWith('data:')) {
      seen.add(abs)
      out.push(abs)
    }
  }
  return out
}

function extractLogo(html, baseUrl, metadata) {
  const block = html.match(/<img[^>]+(?:src|alt|class)=["'][^"']*logo[^"']*["'][^>]*>/i)
  if (block) {
    const srcMatch = block[0].match(/src=["']([^"']+)["']/i)
    if (srcMatch) {
      const abs = absolutize(srcMatch[1], baseUrl)
      if (abs) return abs
    }
  }
  if (metadata?.ogImage) return absolutize(metadata.ogImage, baseUrl)
  return null
}

function extractPalette(html) {
  const counts = {}
  const re = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g
  let m
  while ((m = re.exec(html))) {
    let hex = m[1].toLowerCase()
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
    const full = `#${hex}`
    counts[full] = (counts[full] || 0) + 1
  }
  return Object.entries(counts)
    .filter(([hex]) => hex !== '#ffffff' && hex !== '#000000')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([hex]) => hex)
}

export async function POST(request) {
  try {
    const { input } = await request.json()
    if (!input || !input.trim()) {
      return Response.json({ error: 'Please enter a website URL or business name.' }, { status: 400 })
    }
    if (!process.env.FIRECRAWL_API_KEY) {
      const onVercel = !!process.env.VERCEL
      return Response.json({
        error: onVercel
          ? 'FIRECRAWL_API_KEY is not set on this deployment. In Vercel: Settings → Environment Variables → add FIRECRAWL_API_KEY (plus ANTHROPIC_API_KEY and OPENAI_API_KEY), then Redeploy.'
          : 'Firecrawl API key is not set. Add FIRECRAWL_API_KEY to .env.local, then restart the server (double-click start-velpi.bat).',
      }, { status: 400 })
    }

    const FirecrawlApp = (await import('@mendable/firecrawl-js')).default
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

    // 1. Resolve to a URL (search business name if needed).
    let targetUrl
    if (looksLikeUrl(input)) {
      targetUrl = normalizeUrl(input)
    } else {
      let search
      try { search = await app.search(input, { limit: 1 }) } catch (e) {
        return Response.json({ error: `Could not search for "${input}": ${e.message}` }, { status: 502 })
      }
      const first = (search?.data || search?.web || [])[0]
      if (!first?.url) {
        return Response.json({ error: `No website found for "${input}". Try entering the full URL instead.` }, { status: 404 })
      }
      targetUrl = first.url
    }
    const domain = domainOf(targetUrl)

    // 2. Scrape the home page (markdown + html for images/palette/logo).
    let home
    try {
      const s = await app.scrapeUrl(targetUrl, { formats: ['markdown', 'html'] })
      home = s?.data || s || {}
    } catch (e) {
      return Response.json({ error: `Failed to scrape ${targetUrl}: ${e.message}` }, { status: 502 })
    }
    const homeHtml = home.html || ''
    const metadata = home.metadata || {}
    if (!homeHtml && !home.markdown) {
      return Response.json({ error: `Nothing could be read from ${targetUrl}. The site may block scrapers.` }, { status: 502 })
    }

    // 3. Map the whole site and pick the most useful extra pages.
    let extraUrls = []
    try {
      const map = await app.mapUrl(targetUrl, { limit: 60 })
      const links = (map?.links || map?.data?.links || [])
        .map(l => (typeof l === 'string' ? l : l?.url))
        .filter(Boolean)
        .filter(u => domainOf(u) === domain && u.replace(/\/$/, '') !== targetUrl.replace(/\/$/, ''))
      const prioritized = [
        ...links.filter(u => PRIORITY.test(u)),
        ...links.filter(u => !PRIORITY.test(u)),
      ]
      extraUrls = [...new Set(prioritized)].slice(0, EXTRA_PAGE_LIMIT)
    } catch (_) {
      // mapping is best-effort — home page alone still works
    }

    // 4. Scrape the extra pages in parallel (markdown only), merge everything.
    const pages = [{ url: targetUrl, markdown: home.markdown || '' }]
    if (extraUrls.length) {
      const results = await Promise.allSettled(
        extraUrls.map(u => app.scrapeUrl(u, { formats: ['markdown'] })),
      )
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const d = r.value?.data || r.value || {}
          if (d.markdown) pages.push({ url: extraUrls[i], markdown: d.markdown })
        }
      })
    }

    let content = ''
    for (const p of pages) {
      const path = (() => { try { return new URL(p.url).pathname || '/' } catch (_) { return p.url } })()
      content += `\n\n===== PAGE: ${path} =====\n${p.markdown}`
      if (content.length > 24000) { content = content.slice(0, 24000); break }
    }

    // 5. Images from the home page HTML plus every crawled page's markdown
    //    (![alt](url)), with alt text so the analyzer can judge what each is.
    const htmlImages = extractImages(homeHtml, targetUrl).map(u => ({ url: u, alt: '' }))
    const mdImages = []
    for (const p of pages) {
      const re = /!\[([^\]]*)\]\((https?:[^)\s]+)/g
      let m
      while ((m = re.exec(p.markdown || '')) && mdImages.length < 60) {
        mdImages.push({ url: m[2], alt: (m[1] || '').trim() })
      }
    }
    const seenImg = new Set()
    const images = [...mdImages, ...htmlImages].filter(im => {
      if (!im.url || im.url.startsWith('data:') || seenImg.has(im.url)) return false
      seenImg.add(im.url)
      return true
    }).slice(0, 40)
    const logo = extractLogo(homeHtml, targetUrl, metadata)
    let palette = await getSavedPalette(domain)
    const paletteFromCache = !!palette
    if (!palette) {
      palette = extractPalette(homeHtml)
      if (palette.length) await savePalette(domain, palette)
    }

    return Response.json({
      scrapedData: {
        url: targetUrl,
        domain,
        pagesCrawled: pages.length,
        title: metadata.title || metadata.ogTitle || '',
        description: metadata.description || metadata.ogDescription || '',
        content: content.trim(),
        images,
        logo,
        palette,
        paletteFromCache,
      },
    })
  } catch (err) {
    console.error('scrape error:', err)
    return Response.json({ error: `Scrape failed: ${err.message}` }, { status: 500 })
  }
}
