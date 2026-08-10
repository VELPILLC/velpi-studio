import { NextResponse } from 'next/server'
import { createGateToken, GATE_COOKIE_NAME, GATE_MAX_AGE_SECONDS } from '../../../lib/gate'

// Password-gate submit endpoint. Must stay excluded from the gate check in
// middleware.js (along with /gate itself) or nobody could ever log in.

export async function POST(request) {
  const secret = process.env.APP_GATE_PASSWORD
  if (!secret) {
    return NextResponse.json({ error: 'APP_GATE_PASSWORD is not configured on this deployment.' }, { status: 500 })
  }

  let password = ''
  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch (_) {}

  if (!password || password !== secret) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const token = await createGateToken(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(GATE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: GATE_MAX_AGE_SECONDS,
    path: '/',
  })
  return res
}
