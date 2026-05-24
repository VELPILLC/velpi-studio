import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return Response.json({ avatars: data || [] })
  } catch (err) {
    console.error('GET /api/avatars error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, age_range, niche, what_they_want, what_they_fear, what_they_trust, primary_emotion } = body

    const { data, error } = await supabase
      .from('avatars')
      .insert([{ name, age_range, niche, what_they_want, what_they_fear, what_they_trust, primary_emotion }])
      .select()
      .single()

    if (error) throw error
    return Response.json({ avatar: data })
  } catch (err) {
    console.error('POST /api/avatars error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, ...fields } = body

    const { data, error } = await supabase
      .from('avatars')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json({ avatar: data })
  } catch (err) {
    console.error('PATCH /api/avatars error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabase
      .from('avatars')
      .delete()
      .eq('id', id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/avatars error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
