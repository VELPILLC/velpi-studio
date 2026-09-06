/**
 * SOURCE: velpi original (authored in-app)
 * LICENSE: MIT (original work)
 * EFFECT: background
 * INTENSITY: subtle
 * DEPENDENCY: css-only
 * CSS-PORT: direct — snippet below is the implementation
 */
export const snippet = "<style>.vm-drifting-dots-wrap{position:relative;overflow:hidden}.vm-drifting-dots-bg{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(color-mix(in srgb, var(--vm-c1) 35%, transparent) 1.5px, transparent 1.5px);background-size:26px 26px;opacity:.35;animation:vm-dots-pan 40s linear infinite}@keyframes vm-dots-pan{0%{background-position:0 0}100%{background-position:260px 130px}}@media (prefers-reduced-motion: reduce){.vm-drifting-dots-bg{animation:none}}</style><div class=\"vm-drifting-dots-wrap\"><div class=\"vm-drifting-dots-bg\"></div><!-- content --></div>"
