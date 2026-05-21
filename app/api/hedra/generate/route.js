export async function POST(request) {
  try {
    const body = await request.json()

    const res = await fetch('https://api.hedra.com/v1/characters', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.HEDRA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (err) {
    console.error('Hedra generate error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
