// Transport-resilience helpers for the Claude wrapper (lib/claude.js).
//
// Pure + testable: decides whether an error is a TRANSIENT server-side failure
// worth retrying, and computes exponential backoff with jitter. No network, no
// SDK coupling. Used only to make the streaming call ride out capacity blips —
// it changes nothing about request construction or response handling.

// Transient HTTP statuses we retry.
const TRANSIENT_STATUS = new Set([429, 500, 503, 529])
// Transient Anthropic error `type` values we retry.
const TRANSIENT_TYPES = new Set(['overloaded_error', 'rate_limit_error'])

// True only for transient failures. Everything else (400 invalid_request,
// 401 authentication, 403 permission, context-length errors, JSON parse issues,
// etc.) returns false and is surfaced immediately — never retried.
export function isTransientError(err) {
  if (!err) return false
  const status = Number(err.status ?? err.statusCode ?? err?.response?.status)
  if (TRANSIENT_STATUS.has(status)) return true
  // Anthropic error bodies can appear as err.error.type, err.type, or the
  // doubly-wrapped err.error.error.type ({type:'error', error:{type:'overloaded_error'}}).
  const type = err?.error?.type || err?.error?.error?.type || err?.type
  if (type && TRANSIENT_TYPES.has(type)) return true
  // Last-resort message match (some transports flatten the error to a string).
  const msg = String(err.message || '')
  if (/\boverloaded\b/i.test(msg) || /rate.?limit/i.test(msg)) return true
  return false
}

// Exponential backoff with ±20% jitter.
//   retry 1 → ~1000ms, retry 2 → ~2000ms, retry 3 → ~4000ms.
// `rand` is injectable for deterministic tests (defaults to Math.random).
export function backoffDelay(retry, rand = Math.random) {
  const n = Math.max(1, Number(retry) || 1)
  const base = 1000 * Math.pow(2, n - 1)     // 1000, 2000, 4000, ...
  const jitter = 1 + (rand() * 0.4 - 0.2)     // 0.8 .. 1.2
  return Math.max(0, Math.round(base * jitter))
}

// Short human-readable reason for retry logs.
export function describeError(err) {
  const status = err?.status ?? err?.statusCode ?? err?.response?.status
  const type = err?.error?.type || err?.error?.error?.type || err?.type
  if (status || type) return `${status ?? '?'}${type ? ' ' + type : ''}`
  return err?.message ? String(err.message).slice(0, 80) : 'unknown error'
}

export const MAX_CLAUDE_RETRIES = 3
