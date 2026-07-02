import { BUILT_IN_STYLES } from '../../../lib/designStyles'
import { listStyles, saveStyle, deleteStyle } from '../../../lib/supabase'

// GET    -> { styles: [...] }  built-ins first, then saved styles (newest first)
// POST   -> { name, content }  save a pasted DESIGN.md (e.g. from styles.refero.design)
// DELETE -> { id }             remove a saved style (built-ins cannot be deleted)

export async function GET() {
  try {
    const saved = await listStyles()
    const styles = [
      ...BUILT_IN_STYLES.map(s => ({ ...s, builtIn: true })),
      ...saved.map(s => ({ ...s, builtIn: false })),
    ]
    return Response.json({ styles })
  } catch (err) {
    console.error('styles GET error:', err)
    return Response.json({ styles: BUILT_IN_STYLES.map(s => ({ ...s, builtIn: true })) })
  }
}

export async function POST(request) {
  try {
    const { name, content, niches = '' } = await request.json()
    if (!name?.trim() || !content?.trim()) {
      return Response.json({ error: 'A style needs both a name and the pasted DESIGN.md content.' }, { status: 400 })
    }
    const style = await saveStyle(name.trim(), content.trim(), String(niches || '').trim())
    return Response.json({ style: { ...style, builtIn: false } })
  } catch (err) {
    console.error('styles POST error:', err)
    return Response.json(
      { error: `Could not save the style: ${err.message}. If this mentions a missing table, run the design_styles SQL from lib/supabase.js in the Supabase SQL editor.` },
      { status: 500 },
    )
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json()
    if (!id || String(id).startsWith('builtin_')) {
      return Response.json({ error: 'Built-in styles cannot be deleted.' }, { status: 400 })
    }
    await deleteStyle(id)
    return Response.json({ success: true })
  } catch (err) {
    console.error('styles DELETE error:', err)
    return Response.json({ error: `Could not delete the style: ${err.message}` }, { status: 500 })
  }
}
