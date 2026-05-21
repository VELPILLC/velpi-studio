export async function POST(request) {
  try {
    const formData = await request.formData()

    const res = await fetch('https://api.hedra.com/v1/audio', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.HEDRA_API_KEY,
      },
      body: formData,
    })

    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (err) {
    console.error('Hedra upload error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
