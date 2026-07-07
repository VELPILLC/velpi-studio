// Creative Intelligence Layer — feature flags.
//
// The CIL is OFF by default. Nothing in this layer runs unless explicitly
// enabled, and even when enabled it only runs in SHADOW mode for Phase 1
// (Stage 1 / Understanding): it executes silently and never affects the
// production output.
//
// Two flags gate every call (defense in depth):
//   - Server:  CIL_MODE               (read by the API route)
//   - Client:  NEXT_PUBLIC_CIL_MODE   (read by components/Studio.js)
// Both must be set to a non-off value for a shadow run to happen.
//
// Recognized values: 'off' (default) | 'legacy' (alias for off) | 'shadow'
// 'assist' and 'execute' are reserved for later phases and, for Stage 1,
// behave like 'shadow' (Understanding is never wired downstream yet).
//
// Pure module: no imports, safe to unit-test under `node --test`.

export const CIL_MODES = Object.freeze({
  OFF: 'off',
  SHADOW: 'shadow',
  ASSIST: 'assist',
  EXECUTE: 'execute',
})

// Normalize any raw flag value to a canonical mode. 'legacy'/empty/unknown → 'off'.
export function normalizeMode(raw) {
  const v = String(raw || '').trim().toLowerCase()
  if (v === CIL_MODES.SHADOW || v === CIL_MODES.ASSIST || v === CIL_MODES.EXECUTE) return v
  return CIL_MODES.OFF
}

// Server-side mode, read fresh from the environment each call.
export function serverCilMode() {
  return normalizeMode(typeof process !== 'undefined' ? process.env.CIL_MODE : '')
}

// Is the CIL enabled at all (any non-off mode)?
export function isCilEnabled(mode) {
  return normalizeMode(mode) !== CIL_MODES.OFF
}

// For Stage 1: any enabled mode runs Understanding, but ONLY in shadow —
// it is never connected to downstream stages in Phase 1.
export function isStage1ShadowEnabled(mode) {
  return isCilEnabled(mode)
}
