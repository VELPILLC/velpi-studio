/**
 * SOURCE: velpi original (authored in-app)
 * LICENSE: MIT (original work)
 * EFFECT: text-effect
 * INTENSITY: subtle
 * DEPENDENCY: css-only
 * CSS-PORT: direct — snippet below is the implementation
 */
export const snippet = "<style>.vm-shiny-headline{background:linear-gradient(110deg, currentColor 42%, color-mix(in srgb, var(--vm-c2) 85%, white) 50%, currentColor 58%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:vm-shine 7s ease-in-out infinite}@keyframes vm-shine{0%,70%{background-position:110% 0}100%{background-position:-40% 0}}@media (prefers-reduced-motion: reduce){.vm-shiny-headline{animation:none;-webkit-text-fill-color:currentColor}}</style><!-- apply class vm-shiny-headline to the hero h1 -->"
