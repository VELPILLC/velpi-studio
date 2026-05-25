import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return Response.json({ profiles: data || [] })
  } catch (err) {
    console.error('GET /api/profiles error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, industry, services, who_they_serve, differentiator } = body

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ name, industry, services, who_they_serve, differentiator }])
      .select()
      .single()

    if (error) throw error
    return Response.json({ profile: data })
  } catch (err) {
    console.error('POST /api/profiles error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, ...fields } = body

    const { data, error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json({ profile: data })
  } catch (err) {
    console.error('PATCH /api/profiles error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/profiles error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
