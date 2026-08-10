export const maxDuration = 60

import { indexAssets, findAssetCandidates } from '../../../lib/assetLibrary'

// Cross-project asset library endpoints.
//   POST { records: [{ url, subject, section, niche, business, tags }] }
//     -> index saved Storage images for future reuse (fire-and-forget from
//        the client after a project save; always best-effort).
//   GET ?q=<text>  -> matching candidates (debug/inspection).

export async function POST(request) {
  try {
    const { records } = await request.json()
    const result = await indexAssets(records)
    return Response.json(result)
  } catch (err) {
    console.error('asset-library POST error:', err)
    return Response.json({ indexed: 0, reason: err.message })
  }
}

export async function GET(request) {
  try {
    const q = new URL(request.url).searchParams.get('q') || ''
    const candidates = await findAssetCandidates(q, 20)
    return Response.json({ candidates })
  } catch (err) {
    console.error('asset-library GET error:', err)
    return Response.json({ candidates: [] })
  }
}
