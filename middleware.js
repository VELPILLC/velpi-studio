import { NextResponse } from 'next/server'
import { GATE_COOKIE_NAME, verifyGateToken } from './lib/gate'

// Whole-app password gate. Every page and every API route requires a valid
// signed cookie (set by POST /api/gate on a correct password) — except the
// password page itself, its submit endpoint, and the static framework
// assets both of those need to render at all.
const PUBLIC_PATHS = new Set(['/gate', '/api/gate'])

function isPublic(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith('/_next/')) return true
  if (['/favicon.ico', '/icon.png', '/apple-icon.png'].includes(pathname)) return true
  return false
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const secret = process.env.APP_GATE_PASSWORD
  const isApi = pathname.startsWith('/api/')

  // Fail closed: an unconfigured password blocks the app rather than
  // silently leaving it open (the /gate page and /api/gate report the
  // missing-config error explicitly, so this is never a silent failure).
  if (!secret) {
    return isApi
      ? NextResponse.json({ error: 'APP_GATE_PASSWORD is not configured on this deployment.' }, { status: 401 })
      : redirectToGate(request)
  }

  const token = request.cookies.get(GATE_COOKIE_NAME)?.value
  const valid = await verifyGateToken(token, secret)
  if (valid) return NextResponse.next()

  if (isApi) {
    return NextResponse.json({ error: 'Unauthorized — password required.' }, { status: 401 })
  }
  return redirectToGate(request)
}

function redirectToGate(request) {
  const url = request.nextUrl.clone()
  const next = url.pathname + url.search
  url.pathname = '/gate'
  url.search = ''
  url.searchParams.set('next', next)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
