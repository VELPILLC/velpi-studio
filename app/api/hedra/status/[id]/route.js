export async function GET(request, { params }) {
  try {
    const { id } = params

    const res = await fetch(`https://api.hedra.com/v1/characters/${id}`, {
      headers: {
        'X-API-Key': process.env.HEDRA_API_KEY,
      },
    })

    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (err) {
    console.error('Hedra status error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
