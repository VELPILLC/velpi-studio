/**
 * SOURCE: velpi original (authored in-app)
 * LICENSE: MIT (original work)
 * EFFECT: background
 * INTENSITY: subtle
 * DEPENDENCY: css-only
 * CSS-PORT: direct — snippet below is the implementation
 */
export const snippet = "<style>.vm-spotlight-halo-wrap{position:relative;overflow:hidden}.vm-spotlight-halo-bg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 50% at 50% 32%, color-mix(in srgb, var(--vm-c1) 22%, transparent) 0%, transparent 70%);animation:vm-halo-breathe 12s ease-in-out infinite}@keyframes vm-halo-breathe{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.9;transform:scale(1.05)}}@media (prefers-reduced-motion: reduce){.vm-spotlight-halo-bg{animation:none;opacity:.7}}</style><div class=\"vm-spotlight-halo-wrap\"><div class=\"vm-spotlight-halo-bg\"></div><!-- content --></div>"
