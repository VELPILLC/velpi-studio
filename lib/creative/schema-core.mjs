// Creative Intelligence Layer — shared schema engine.
//
// Generic renderer + validator over the field-spec grammar used by every CIL
// stage slice. Introduced with Stage 2 so stages 2+ never duplicate validator
// logic. Stage 1 (lib/creative/schema.mjs) predates this and keeps its own
// inline copy for now (a future, separate refactor can migrate it — additive,
// no behavior change intended).
//
// Field-spec grammar (per section):
//   { type, required, desc, example, enum? }
//   type ∈ 'string' | 'string[]' | 'object[]' | 'object' | 'hex[]'
//        | 'enum' | 'number01' | 'int0100'
//   Section-level keys prefixed with '_' are metadata:
//     _desc        — human description of the section
//     _rootArray   — marks a section that is itself an array (e.g. 'string[]')
//
// Enums are OPEN: any non-empty string is accepted (record out-of-set values
// verbatim) per the CDO Stability Contract.
//
// Pure module: no imports. Node-testable.

function isNumber01(v) { return typeof v === 'number' && v >= 0 && v <= 1 }
function isInt0100(v) { return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100 }

export function typeOk(spec, v) {
  switch (spec.type) {
    case 'string': return typeof v === 'string'
    case 'string[]': return Array.isArray(v) && v.every(x => typeof x === 'string')
    case 'hex[]': return Array.isArray(v) && v.every(x => typeof x === 'string')
    case 'object[]': return Array.isArray(v) && v.every(x => x && typeof x === 'object' && !Array.isArray(x))
    case 'object': return v && typeof v === 'object' && !Array.isArray(v)
    case 'enum': return typeof v === 'string' && v.length > 0 // open enum
    case 'bool': return typeof v === 'boolean'
    case 'number': return typeof v === 'number' && Number.isFinite(v)
    case 'int': return typeof v === 'number' && Number.isInteger(v)
    case 'number01': return isNumber01(v)
    case 'int0100': return isInt0100(v)
    default: return true
  }
}

// Render the OUTPUT CONTRACT text for a schema slice. Derived from the same
// definition the validator uses, so the two never drift.
export function renderContract(schemaObj, { footer } = {}) {
  const lines = []
  lines.push('OUTPUT CONTRACT — return ONLY a JSON object with exactly this shape (types shown; (optional) may be omitted):')
  lines.push('{')
  for (const [section, fields] of Object.entries(schemaObj)) {
    if (fields._rootArray) {
      lines.push(`  "${section}": ${fields._rootArray},   // ${fields._desc || ''}`)
      continue
    }
    lines.push(`  "${section}": {   // ${fields._desc || ''}`)
    for (const [name, spec] of Object.entries(fields)) {
      if (name.startsWith('_')) continue
      const req = spec.required ? '' : ' (optional)'
      const en = spec.type === 'enum' ? ` one of [${(spec.enum || []).join(', ')}] (or another value if none fit)` : ''
      lines.push(`    "${name}": <${spec.type}${en}>${req} — ${spec.desc || ''}`)
    }
    lines.push('  },')
  }
  lines.push('}')
  lines.push(footer || 'Rules: strings concise; arrays real and exhaustive; every confidence is a number in [0,1]; never invent facts — record inferences as assumptions.')
  return lines.join('\n')
}

// Validate an object against a schema slice. Returns { valid, errors }.
export function validateAgainst(schemaObj, obj) {
  const errors = []
  if (!obj || typeof obj !== 'object') return { valid: false, errors: ['output is not an object'] }
  for (const [section, fields] of Object.entries(schemaObj)) {
    if (fields._rootArray) {
      if (section in obj) {
        const arr = obj[section]
        const itemOk = fields._rootArray === 'object[]'
          ? x => x && typeof x === 'object' && !Array.isArray(x)
          : x => typeof x === 'string'
        if (!(Array.isArray(arr) && arr.every(itemOk))) errors.push(`${section}: expected ${fields._rootArray}`)
      }
      continue
    }
    const node = obj[section]
    if (node == null || typeof node !== 'object') { errors.push(`${section}: missing or not an object`); continue }
    for (const [name, spec] of Object.entries(fields)) {
      if (name.startsWith('_')) continue
      const present = name in node && node[name] != null
      if (!present) { if (spec.required) errors.push(`${section}.${name}: required`); continue }
      if (!typeOk(spec, node[name])) errors.push(`${section}.${name}: expected ${spec.type}`)
    }
  }
  return { valid: errors.length === 0, errors }
}

// Empty skeleton for a schema slice (nulls for objects, [] for root arrays).
export function emptyFrom(schemaObj) {
  const out = {}
  for (const [section, fields] of Object.entries(schemaObj)) {
    out[section] = fields._rootArray ? [] : null
  }
  return out
}

export function sectionsOf(schemaObj) {
  return Object.keys(schemaObj)
}
