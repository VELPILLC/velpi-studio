export const maxDuration = 60

import { createProjectAssetUploadUrl } from '../../../lib/supabase'

// Signed-upload handshake for the project-images Storage bucket. The client
// sends only { path, contentType } (small JSON); the image BYTES are then
// PUT by the browser directly to the returned signedUrl on supabase.co —
// never through a Vercel function, so Vercel's ~4.5MB request-body limit
// (the 413 source) is out of the picture entirely.

export async function POST(request) {
  try {
    const { path, contentType } = await request.json()
    if (!contentType || !/^image\//.test(String(contentType))) {
      return Response.json({ error: 'A valid image contentType is required.' }, { status: 400 })
    }
    const result = await createProjectAssetUploadUrl(path, contentType)
    if (!result?.signedUrl || !result?.publicUrl) {
      return Response.json({ error: 'Image storage is not configured (SUPABASE_SERVICE_ROLE_KEY / project-images bucket).' }, { status: 502 })
    }
    return Response.json(result)
  } catch (err) {
    console.error('upload-image error:', err)
    return Response.json({ error: `Could not create an upload URL: ${err.message}` }, { status: 500 })
  }
}
