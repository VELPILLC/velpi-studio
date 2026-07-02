import fs from 'fs'
import path from 'path'

// Local-only harvest endpoint: lets the browser-side refero harvester POST
// DESIGN.md files straight into lib/refero/. CORS is intentionally open because
// this runs on localhost during harvesting; filenames are strictly sanitized.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(request) {
  try {
    const { filename, content } = await request.json()
    const safe = String(filename || '')
      .toLowerCase()
      .replace(/\.md$/, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
    if (!safe || !content || String(content).length < 500) {
      return Response.json({ error: 'Need a filename and real content.' }, { status: 400, headers: CORS })
    }
    const dir = path.join(process.cwd(), 'lib', 'refero')
    fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `${safe}.md`)
    fs.writeFileSync(file, String(content), 'utf8')
    return Response.json({ saved: `${safe}.md`, bytes: String(content).length }, { headers: CORS })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: CORS })
  }
}
