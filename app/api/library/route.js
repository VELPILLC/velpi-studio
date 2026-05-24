import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ad_library')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return Response.json({ ads: data || [] })
  } catch (err) {
    console.error('GET /api/library error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      avatar_id,
      avatar_name,
      hook,
      image_concept,
      image_b64,
      headline,
      primary_text,
      description,
      cta,
      angle,
      ad_type,
      status,
      parent_id,
      version_number,
    } = body

    const { data, error } = await supabase
      .from('ad_library')
      .insert([{
        avatar_id: avatar_id || null,
        avatar_name: avatar_name || 'No Avatar',
        hook,
        image_concept,
        image_b64,
        headline,
        primary_text,
        description,
        cta,
        angle,
        ad_type: ad_type || '',
        status: status || 'unrated',
        parent_id: parent_id || null,
        version_number: version_number || 1,
      }])
      .select()
      .single()

    if (error) throw error
    return Response.json({ ad: data })
  } catch (err) {
    console.error('POST /api/library error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, ...fields } = body

    const { data, error } = await supabase
      .from('ad_library')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json({ ad: data })
  } catch (err) {
    console.error('PATCH /api/library error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabase
      .from('ad_library')
      .delete()
      .eq('id', id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/library error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
