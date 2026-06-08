import { getSavedPalette, savePalette } from '../../../lib/supabase'

// Decide whether the input is a URL or a business name.
function looksLikeUrl(input) {
  const s = input.trim()
  if (/\s/.test(s) && !/^https?:\/\//i.test(s)) return false
  if (/^https?:\/\//i.test(s)) return true
  // bare domain like "example.com" or "www.shop.example.co.uk"
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s)
}

function normalizeUrl(input) {
  const s = input.trim()
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch (_) {
    return ''
  }
}

function absolutize(src, baseUrl) {
  if (!src) return null
  try {
    return new URL(src, baseUrl).href
  } catch (_) {
    return null
  }
}

// Pull image URLs out of raw HTML and absolutize them.
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

// Best-effort: find a logo image URL.
function extractLogo(html, baseUrl, metadata) {
  const re = /<img[^>]+(?:src|alt|class)=["'][^"']*logo[^"']*["'][^>]*>/i
  const block = html.match(re)
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

// Frequency-rank hex colors found in the page source.
function extractPalette(html) {
  const counts = {}
  const re = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g
  let m
  while ((m = re.exec(html))) {
    let hex = m[1].toLowerCase()
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
    const full = `#${hex}`
    // skip pure white/black noise from resets
    counts[full] = (counts[full] || 0) + 1
  }
  const ranked = Object.entries(counts)
    .filter(([hex]) => hex !== '#ffffff' && hex !== '#000000')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([hex]) => hex)
  return ranked
}

export async function POST(request) {
  try {
    const { input } = await request.json()
    if (!input || !input.trim()) {
      return Response.json({ error: 'Please enter a website URL or business name.' }, { status: 400 })
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return Response.json(
        { error: 'Firecrawl API key is not set. Add FIRECRAWL_API_KEY to .env.local to enable scraping.' },
        { status: 400 },
      )
    }

    const FirecrawlApp = (await import('@mendable/firecrawl-js')).default
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

    // 1. Resolve to a URL — either directly or by searching the business name.
    let targetUrl
    if (looksLikeUrl(input)) {
      targetUrl = normalizeUrl(input)
    } else {
      let search
      try {
        search = await app.search(input, { limit: 1 })
      } catch (e) {
        return Response.json({ error: `Could not search for "${input}": ${e.message}` }, { status: 502 })
      }
      const first = (search?.data || search?.web || [])[0]
      if (!first?.url) {
        return Response.json(
          { error: `No website found for "${input}". Try entering the full URL instead.` },
          { status: 404 },
        )
      }
      targetUrl = first.url
    }

    const domain = domainOf(targetUrl)

    // 2. Scrape the page.
    let scrape
    try {
      scrape = await app.scrapeUrl(targetUrl, { formats: ['markdown', 'html'] })
    } catch (e) {
      return Response.json({ error: `Failed to scrape ${targetUrl}: ${e.message}` }, { status: 502 })
    }
    const data = scrape?.data || scrape || {}
    const html = data.html || ''
    const markdown = data.markdown || ''
    const metadata = data.metadata || {}

    if (!html && !markdown) {
      return Response.json(
        { error: `Nothing could be read from ${targetUrl}. The site may block scrapers.` },
        { status: 502 },
      )
    }

    // 3. Extract structured pieces.
    const images = extractImages(html, targetUrl)
    const logo = extractLogo(html, targetUrl, metadata)

    // 4. Color palette — reuse from Supabase if we've seen this domain before.
    let palette = await getSavedPalette(domain)
    let paletteFromCache = !!palette
    if (!palette) {
      palette = extractPalette(html)
      if (palette.length) await savePalette(domain, palette)
    }

    const scrapedData = {
      url: targetUrl,
      domain,
      title: metadata.title || metadata.ogTitle || '',
      description: metadata.description || metadata.ogDescription || '',
      content: markdown.slice(0, 12000),
      images,
      logo,
      palette,
      paletteFromCache,
    }

    return Response.json({ scrapedData })
  } catch (err) {
    console.error('scrape error:', err)
    return Response.json({ error: `Scrape failed: ${err.message}` }, { status: 500 })
  }
}
