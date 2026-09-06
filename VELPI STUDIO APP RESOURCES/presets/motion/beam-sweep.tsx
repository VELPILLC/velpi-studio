/**
 * SOURCE: velpi original (authored in-app)
 * LICENSE: MIT (original work)
 * EFFECT: background
 * INTENSITY: medium
 * DEPENDENCY: css-only
 * CSS-PORT: direct — snippet below is the implementation
 */
export const snippet = "<style>.vm-beam-sweep-wrap{position:relative;overflow:hidden}.vm-beam-sweep-bg{position:absolute;inset:0;pointer-events:none;opacity:.5}.vm-beam-sweep-bg::before,.vm-beam-sweep-bg::after{content:'';position:absolute;top:-30%;bottom:-30%;width:120px;transform:rotate(18deg);background:linear-gradient(90deg, transparent, color-mix(in srgb, var(--vm-c1) 30%, transparent), transparent)}.vm-beam-sweep-bg::before{left:-15%;animation:vm-beam-a 18s linear infinite}.vm-beam-sweep-bg::after{left:-35%;width:60px;animation:vm-beam-a 26s linear 6s infinite}@keyframes vm-beam-a{0%{transform:translateX(0) rotate(18deg)}100%{transform:translateX(140vw) rotate(18deg)}}@media (prefers-reduced-motion: reduce){.vm-beam-sweep-bg::before,.vm-beam-sweep-bg::after{animation:none;opacity:.25}}</style><div class=\"vm-beam-sweep-wrap\"><div class=\"vm-beam-sweep-bg\"></div><!-- content --></div>"
