// Shared password gate — stateless signed cookie helpers.
//
// Uses only Web Crypto (crypto.subtle) + global TextEncoder/btoa/atob, no
// Node-only APIs, so this file can be imported from both a normal Route
// Handler (Node runtime) and middleware.js (always Edge runtime).
//
// The cookie is `${expiresAtMs}.${base64url(HMAC-SHA256(expiresAtMs))}` —
// no server-side session store needed; verifying just re-computes the HMAC
// over the embedded expiry and checks it against the same secret.

const encoder = new TextEncoder()

export const GATE_COOKIE_NAME = 'velpi_gate'
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function toBase64Url(bytes) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function createGateToken(secret) {
  const expiresAt = Date.now() + GATE_MAX_AGE_SECONDS * 1000
  const key = await importHmacKey(secret)
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(String(expiresAt)))
  return `${expiresAt}.${toBase64Url(new Uint8Array(sigBuf))}`
}

export async function verifyGateToken(token, secret) {
  if (!token || !secret) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [expiresAtStr, sig] = parts
  const expiresAt = Number(expiresAtStr)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false
  try {
    const key = await importHmacKey(secret)
    return await crypto.subtle.verify('HMAC', key, fromBase64Url(sig), encoder.encode(expiresAtStr))
  } catch (_) {
    return false
  }
}
