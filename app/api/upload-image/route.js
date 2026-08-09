export const maxDuration = 60

import { uploadProjectAsset } from '../../../lib/supabase'

// One base64 image per request, uploaded to the project-images Storage
// bucket — called per-asset right before /api/projects so that request
// carries lightweight URLs instead of every image's base64 bundled together.

export async function POST(request) {
  try {
    const { dataUri, path } = await request.json()
    if (!dataUri || !dataUri.startsWith('data:')) {
      return Response.json({ error: 'Missing a base64 data URI to upload.' }, { status: 400 })
    }
    const url = await uploadProjectAsset(dataUri, path)
    if (!url) {
      return Response.json({ error: 'Image storage is not configured or the upload failed.' }, { status: 502 })
    }
    return Response.json({ url })
  } catch (err) {
    console.error('upload-image error:', err)
    return Response.json({ error: `Image upload failed: ${err.message}` }, { status: 500 })
  }
}
