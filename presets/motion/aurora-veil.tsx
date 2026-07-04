/**
 * SOURCE: velpi original (authored in-app)
 * LICENSE: MIT (original work)
 * EFFECT: background
 * INTENSITY: medium
 * DEPENDENCY: css-only
 * CSS-PORT: direct — snippet below is the implementation
 */
export const snippet = "<style>.vm-aurora-veil-wrap{position:relative;overflow:hidden}.vm-aurora-veil-bg{position:absolute;inset:-20%;pointer-events:none;filter:blur(60px);opacity:.55;background:radial-gradient(38% 45% at 22% 30%, var(--vm-c1) 0%, transparent 70%),radial-gradient(42% 48% at 78% 38%, var(--vm-c2) 0%, transparent 72%),radial-gradient(50% 55% at 50% 82%, var(--vm-c1) 0%, transparent 75%);animation:vm-aurora-drift 26s ease-in-out infinite alternate}@keyframes vm-aurora-drift{0%{transform:translate3d(-4%,-2%,0) rotate(-2deg) scale(1)}50%{transform:translate3d(3%,2%,0) rotate(1.5deg) scale(1.06)}100%{transform:translate3d(-2%,3%,0) rotate(-1deg) scale(1.02)}}@media (prefers-reduced-motion: reduce){.vm-aurora-veil-bg{animation:none}}</style><div class=\"vm-aurora-veil-wrap\"><div class=\"vm-aurora-veil-bg\"></div><!-- section content here, position:relative;z-index:1 --></div>"
