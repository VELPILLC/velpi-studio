// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

// Executes STEP 4 (image sourcing) decisions made during analysis:
//   action "keep"     -> use the real photo URL as-is
//   action "enhance"  -> gpt-image-1 EDIT the real photo with the enhancement prompt
//   action "generate" -> gpt-image-1 GENERATE a new photo from the generation prompt
// Returns assets in inventory order so build-site can place each in its section.

// Cap total AI image operations (enhance + generate) per run for speed/cost.
// The analyze step plans exactly 5 site images, so the cap matches.
const MAX_AI_OPS = 5

function assetId(item, i) {
  if (/logo/i.test(item.what || '') || item.section === 'header') return 'logo'
  return `img_${item.slot != null ? item.slot : i}`
}

async function fetchAsFile(url, toFile) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${res.status}`)
  const type = res.headers.get('content-type') || 'image/png'
  const buf = Buffer.from(await res.arrayBuffer())
  const ext = type.includes('webp') ? 'webp' : type.includes('jpeg') || type.includes('jpg') ? 'jpg' : 'png'
  return toFile(buf, `src.${ext}`, { type })
}

export async function POST(request) {
  try {
    const { analysis } = await request.json()
    if (!analysis) {
      return Response.json({ error: 'Missing analysis for image sourcing.' }, { status: 400 })
    }

    const inventory = Array.isArray(analysis.image_inventory) && analysis.image_inventory.length
      ? analysis.image_inventory
      : (analysis.images || []).map((im, i) => ({
          slot: i, what: im.role || im.type || 'image', section: '', url: im.url,
          source: im.keep === false ? 'generate' : 'real',
          action: im.keep === false ? 'generate' : 'keep',
          prompt: '',
        }))

    const hasOpenAI = !!process.env.OPENAI_API_KEY
    let openai = null
    let toFile = null
    if (hasOpenAI) {
      const mod = await import('openai')
      openai = new mod.default({ apiKey: process.env.OPENAI_API_KEY })
      toFile = mod.toFile
    }

    const assets = []
    let aiOps = 0
    let warning = null

    for (let i = 0; i < inventory.length; i++) {
      const item = inventory[i]
      const id = assetId(item, i)
      const isLogo = id === 'logo'
      // prompt rides along so the UI can show/copy it next to each image
      const base = { id, role: item.what || '', section: item.section || '', prompt: item.prompt || '' }

      // Logos and "keep" real photos pass through untouched.
      if (isLogo || item.action === 'keep' || (item.source === 'real' && item.action !== 'enhance' && item.action !== 'generate')) {
        if (item.url) assets.push({ ...base, kind: isLogo ? 'logo' : 'photo', src: item.url })
        continue
      }

      const overBudget = aiOps >= MAX_AI_OPS
      if (!hasOpenAI) {
        if (item.url) assets.push({ ...base, kind: 'photo', src: item.url })
        warning = 'OPENAI_API_KEY not set — kept original images instead of enhancing/generating.'
        continue
      }
      if (overBudget) {
        if (item.url) assets.push({ ...base, kind: 'photo', src: item.url })
        continue
      }

      const prompt = item.prompt || `Subject: ${item.what || 'brand image'} for a ${analysis.industry || 'business'} website. Keep the same: the overall subject and intent. Change: make it a clean, modern, photorealistic, well-lit image. No text, no logos, no watermarks.`
      base.prompt = prompt

      // Up to 2 attempts per image — transient API failures were leaving
      // placeholder holes in otherwise-finished sites.
      let done = false
      for (let attempt = 1; attempt <= 2 && !done; attempt++) {
        try {
          if (item.action === 'enhance' && item.url) {
            if (attempt === 1) aiOps++
            const file = await fetchAsFile(item.url, toFile)
            const isHero = /hero/i.test(item.section || '') || /hero/i.test(item.what || '')
            const res = await openai.images.edit({ model: 'gpt-image-1', image: file, prompt, n: 1, size: isHero ? '1536x1024' : '1024x1024', quality: isHero ? 'high' : 'medium' })
            const b64 = res.data?.[0]?.b64_json
            assets.push({ ...base, kind: 'enhanced', src: b64 ? `data:image/png;base64,${b64}` : item.url })
            done = true
          } else {
            if (attempt === 1) aiOps++
            const isHero = /hero/i.test(item.section || '') || /hero/i.test(item.what || '')
            // Heroes render full-bleed — landscape + high quality; support images stay square/medium.
            const res = await openai.images.generate({ model: 'gpt-image-1', prompt, n: 1, size: isHero ? '1536x1024' : '1024x1024', quality: isHero ? 'high' : 'medium' })
            const b64 = res.data?.[0]?.b64_json
            if (b64) { assets.push({ ...base, kind: 'generated', src: `data:image/png;base64,${b64}` }); done = true }
            else if (attempt === 2 && item.url) { assets.push({ ...base, kind: 'photo', src: item.url }); done = true }
          }
        } catch (e) {
          console.error(`image op failed (slot ${item.slot}, attempt ${attempt}):`, e.message)
          if (attempt === 2 && item.url) assets.push({ ...base, kind: 'photo', src: item.url }) // graceful fallback
        }
      }
    }

    return Response.json({ images: { assets, warning } })
  } catch (err) {
    console.error('generate-images error:', err)
    return Response.json({ error: `Image generation failed: ${err.message}` }, { status: 500 })
  }
}
