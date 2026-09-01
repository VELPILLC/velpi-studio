// Structural safety gates for any LLM-produced "fix" of a generated mockup.
//
// Extracted as pure functions (rather than living inline in the route) for
// two reasons: they're the only thing standing between a mangled model
// response and the user's saved work, so they deserve real tests; and the
// same checks run in two places — server-side in app/api/reevaluate-fix
// before responding, and implicitly again client-side before the result is
// committed to htmlTemplate.
//
// Philosophy inherited from enhance-site/route.js: when a "surgical" fix
// comes back structurally different from what went in, the fix is WRONG and
// the pre-fix HTML ships untouched. A silently dropped image token or a
// renamed element id means the model rewrote things it was told not to.

export function imgTokensOf(html) {
  return (String(html || '').match(/%%IMG:[a-z0-9_]+%%/gi) || [])
    .map(s => s.toLowerCase())
    .sort()
    .join('|')
}

export function vidsOf(html) {
  return (String(html || '').match(/data-vid="v\d+"/g) || []).sort().join('|')
}

// -> { ok: boolean, failures: string[] }
export function checkFixedHtml(before, after) {
  const failures = []
  const a = String(after || '')
  const b = String(before || '')

  if (!/<html|<!doctype/i.test(a)) failures.push('result is not a complete HTML document')
  // A "surgical" fix that lost nearly half the document rewrote far more
  // than the punch list asked for.
  if (a.length <= b.length * 0.55) failures.push('result is suspiciously shorter than the original')
  if (imgTokensOf(a) !== imgTokensOf(b)) failures.push('image placeholder tokens were added, renamed, or dropped')
  // The strongest gate: every targeted element must still be addressable.
  // If vids changed, the model rebuilt markup instead of editing it.
  if (vidsOf(a) !== vidsOf(b)) failures.push('element ids (data-vid) were added, renamed, or dropped')
  if (!a.includes('velpi-page')) failures.push('the .velpi-page scoping wrapper is missing')

  return { ok: failures.length === 0, failures }
}
