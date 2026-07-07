// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

// Executes STEP 4 (image sourcing) decisions made during analysis:
//   action "keep"     -> use the real photo URL as-is
//   action "enhance"  -> gpt-image-1 EDIT the real photo with the enhancement prompt
//   action "generate" -> gpt-image-1 GENERATE a new photo from the generation prompt
// Returns assets in inventory order so build-site can place each in its section.

// Cap total AI image operations (enhance + generate) per run for speed/cost.
// The analyze step plans 5-8 site images, so the cap matches the top of that range.
const MAX_AI_OPS = 8

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

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Run tasks with a concurrency ceiling — results keep input order. Firing all
// 8 image ops at once tripped OpenAI's images-per-minute rate limit; 3 at a
// time stays under it while still finishing well inside the 300s window.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
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

    let warning = null

    // Theme cohesion: every image (enhanced real photo or freshly generated)
    // gets graded toward the SAME site palette/mood so nothing looks like a
    // stock photo dropped onto a themed page — this is the "recreate it in
    // theme if it's too basic" step, applied programmatically to every slot.
    const palette = (analysis.color_palette || []).join(', ')
    const mood = analysis.target_feeling || analysis.tone || ''
    const THEME_LINE = palette || mood
      ? ` Color grade toward this site's theme — palette: ${palette || '(use the brand tones already visible)'}${mood ? `, mood: "${mood}"` : ''} — so this image reads as part of the same shoot as every other image on the page.`
      : ''
    // Professional retouch contract for real photos pulled from the site:
    // authentic first — same people, same place, same composition — elevated
    // to look professionally shot, then themed.
    const PRO_TOUCHUP = ' Professional retouch directives: stay authentic and true to the original — same people, same place, same composition, recognizably the same photo. If people are present: cinematic, flattering professional lighting and color grade. If buildings/architecture are present: straighten and align verticals and horizontals so it looks like a professional architectural photograph. Subtly clean and even out distracting background elements. If the original is especially plain, dim, or generic, do not stop at a light touch-up — restyle its lighting and color grade decisively toward the theme below. Crisp, high-end result. No added text, no logos, no watermarks.' + THEME_LINE

    // Decide up front (in inventory order) which items get an AI op within
    // budget — everything else passes through as a plain "photo"/"logo" asset
    // or is skipped. This lets the actual AI calls run CONCURRENTLY below:
    // with up to 8 images now planned, awaiting gpt-image-1 one at a time
    // risked blowing past the 300s function timeout for the whole batch.
    let budget = MAX_AI_OPS
    const plans = inventory.map((item, i) => {
      const id = assetId(item, i)
      const isLogo = id === 'logo'
      const base = { id, role: item.what || '', section: item.section || '', prompt: item.prompt || '' }

      if (isLogo || item.action === 'keep' || (item.source === 'real' && item.action !== 'enhance' && item.action !== 'generate')) {
        return { passthrough: item.url ? { ...base, kind: isLogo ? 'logo' : 'photo', src: item.url } : null }
      }
      if (!hasOpenAI) {
        warning = 'OPENAI_API_KEY not set — kept original images instead of enhancing/generating.'
        return { passthrough: item.url ? { ...base, kind: 'photo', src: item.url } : null }
      }
      if (budget <= 0) {
        return { passthrough: item.url ? { ...base, kind: 'photo', src: item.url } : null }
      }
      budget--

      let prompt = item.prompt || `Subject: ${item.what || 'brand image'} for a ${analysis.industry || 'business'} website. Keep the same: the overall subject and intent. Change: make it a clean, modern, photorealistic, well-lit image.${THEME_LINE} No text, no logos, no watermarks.`
      prompt += item.action === 'enhance' ? PRO_TOUCHUP : THEME_LINE
      return { aiOp: true, item, base: { ...base, prompt } }
    })

    let aiOps = plans.filter(p => p.aiOp).length

    // Up to 2 attempts per image. Attempt 2 handles the two real failure modes
    // differently: transient errors (429/5xx) get a backoff wait then the same
    // prompt; everything else (usually a content-policy rejection of the exact
    // prompt — e.g. it names a real person) gets a SANITIZED generic prompt,
    // because resending a rejected prompt verbatim fails deterministically.
    const failures = []
    async function runAiOp({ item, base }) {
      const isHero = /hero/i.test(item.section || '') || /hero/i.test(item.what || '')
      // Strip parentheticals (where analyze tends to put real names, e.g.
      // "Team (Patrick and Nick)") and fall back to role/industry language.
      const safeWhat = String(item.what || 'brand image').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
      const fallbackPrompt = `Subject: ${safeWhat} for a ${analysis.industry || 'business'} website — depict people generically by role only (never a specific named individual). Professional, photorealistic, well-lit marketing photo.${THEME_LINE} No text, no logos, no watermarks.`
      let lastErr = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        // On retry: rate-limit errors just need patience; anything else was
        // probably the prompt itself, so swap to the sanitized fallback.
        const rateLimited = lastErr && (lastErr.status === 429 || /rate.?limit/i.test(lastErr.message || ''))
        if (attempt === 2) await sleep(rateLimited ? 20000 : 2000)
        const prompt = attempt === 2 && !rateLimited && item.action !== 'enhance' ? fallbackPrompt : base.prompt
        try {
          if (item.action === 'enhance' && item.url) {
            const file = await fetchAsFile(item.url, toFile)
            const res = await openai.images.edit({ model: 'gpt-image-1', image: file, prompt, n: 1, size: isHero ? '1536x1024' : '1024x1024', quality: isHero ? 'high' : 'medium' })
            const b64 = res.data?.[0]?.b64_json
            return { ...base, kind: 'enhanced', src: b64 ? `data:image/png;base64,${b64}` : item.url }
          } else {
            // Heroes render full-bleed — landscape + high quality; support images stay square/medium.
            const res = await openai.images.generate({ model: 'gpt-image-1', prompt, n: 1, size: isHero ? '1536x1024' : '1024x1024', quality: isHero ? 'high' : 'medium' })
            const b64 = res.data?.[0]?.b64_json
            if (b64) return { ...base, kind: 'generated', src: `data:image/png;base64,${b64}` }
            lastErr = new Error('empty image response')
          }
        } catch (e) {
          lastErr = e
          console.error(`image op failed (slot ${item.slot}, attempt ${attempt}):`, e.message)
        }
      }
      if (item.url) return { ...base, kind: 'photo', src: item.url } // graceful fallback
      failures.push({ id: base.id, role: base.role, reason: lastErr?.message || 'unknown' })
      return null
    }

    const assets = (await mapLimit(
      plans, 3,
      p => (p.aiOp ? runAiOp(p) : Promise.resolve(p.passthrough)),
    )).filter(Boolean)

    // Attestation: proves whether the image API was actually called this run
    // (and how), instead of trusting a green checkmark in the UI.
    const meta = {
      apiCalled: aiOps > 0,
      aiCalls: aiOps,
      generated: assets.filter(a => a.kind === 'generated').length,
      enhanced: assets.filter(a => a.kind === 'enhanced').length,
      keptOriginal: assets.filter(a => a.kind === 'photo').length,
      logo: assets.some(a => a.kind === 'logo'),
      failures, // per-slot failure reasons so the UI can say WHY, not just "failed"
      at: new Date().toISOString(),
    }
    return Response.json({ images: { assets, warning, meta } })
  } catch (err) {
    console.error('generate-images error:', err)
    return Response.json({ error: `Image generation failed: ${err.message}` }, { status: 500 })
  }
}
