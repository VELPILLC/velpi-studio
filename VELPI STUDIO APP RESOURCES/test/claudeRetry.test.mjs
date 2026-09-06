// Transport-resilience helper tests — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isTransientError, backoffDelay, describeError, MAX_CLAUDE_RETRIES } from '../lib/claudeRetry.mjs'

test('isTransientError: retries the allowed HTTP statuses', () => {
  for (const status of [429, 500, 503, 529]) {
    assert.equal(isTransientError({ status }), true, `status ${status} should be transient`)
    assert.equal(isTransientError({ statusCode: status }), true)
    assert.equal(isTransientError({ response: { status } }), true)
  }
})

test('isTransientError: retries overloaded_error / rate_limit_error in any wrapping', () => {
  assert.equal(isTransientError({ error: { type: 'overloaded_error' } }), true)
  assert.equal(isTransientError({ type: 'rate_limit_error' }), true)
  // doubly wrapped: {type:'error', error:{type:'overloaded_error'}}
  assert.equal(isTransientError({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }), true)
  // flattened to a message string (as seen surfaced in the UI)
  assert.equal(isTransientError({ message: '{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}' }), true)
  assert.equal(isTransientError({ message: 'Rate limit exceeded' }), true)
})

test('isTransientError: does NOT retry non-transient failures', () => {
  assert.equal(isTransientError({ status: 400, error: { type: 'invalid_request_error' } }), false) // invalid request
  assert.equal(isTransientError({ status: 401, error: { type: 'authentication_error' } }), false) // auth
  assert.equal(isTransientError({ status: 403, error: { type: 'permission_error' } }), false) // permission
  assert.equal(isTransientError({ status: 404 }), false)
  assert.equal(isTransientError({ status: 400, error: { type: 'invalid_request_error', message: 'prompt is too long: 250000 tokens > 200000 maximum' } }), false) // context length
  assert.equal(isTransientError({ message: 'Unexpected token < in JSON' }), false) // parse error (handled by repair pass)
  assert.equal(isTransientError(null), false)
  assert.equal(isTransientError(undefined), false)
  assert.equal(isTransientError({}), false)
})

test('backoffDelay: exponential 1s → 2s → 4s at zero jitter', () => {
  const noJitter = () => 0.5 // 1 + (0.5*0.4 - 0.2) = 1.0
  assert.equal(backoffDelay(1, noJitter), 1000)
  assert.equal(backoffDelay(2, noJitter), 2000)
  assert.equal(backoffDelay(3, noJitter), 4000)
})

test('backoffDelay: ±20% jitter bounds', () => {
  const low = () => 0     // factor 0.8
  const high = () => 1    // factor 1.2
  assert.equal(backoffDelay(1, low), 800)
  assert.equal(backoffDelay(1, high), 1200)
  assert.equal(backoffDelay(2, low), 1600)
  assert.equal(backoffDelay(2, high), 2400)
  assert.equal(backoffDelay(3, low), 3200)
  assert.equal(backoffDelay(3, high), 4800)
})

test('backoffDelay: every random draw stays within [0.8x, 1.2x] of the base', () => {
  for (const retry of [1, 2, 3]) {
    const base = 1000 * 2 ** (retry - 1)
    for (let i = 0; i < 200; i++) {
      const d = backoffDelay(retry, Math.random)
      assert.ok(d >= base * 0.8 - 1 && d <= base * 1.2 + 1, `retry ${retry}: ${d} out of bounds`)
    }
  }
})

test('MAX_CLAUDE_RETRIES is 3', () => {
  assert.equal(MAX_CLAUDE_RETRIES, 3)
})

test('describeError: concise reason for logs', () => {
  assert.equal(describeError({ status: 529, error: { type: 'overloaded_error' } }), '529 overloaded_error')
  assert.equal(describeError({ type: 'rate_limit_error' }), '? rate_limit_error')
  assert.equal(describeError({ message: 'boom' }), 'boom')
  assert.equal(describeError({}), 'unknown error')
})
