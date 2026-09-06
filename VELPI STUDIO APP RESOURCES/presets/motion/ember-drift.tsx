/**
 * SOURCE: velpi original (authored in-app)
 * LICENSE: MIT (original work)
 * EFFECT: background
 * INTENSITY: bold
 * DEPENDENCY: css-only
 * CSS-PORT: direct — snippet below is the implementation
 */
export const snippet = "<style>.vm-ember-drift-wrap{position:relative;overflow:hidden}.vm-ember-drift-bg{position:absolute;inset:0;pointer-events:none}.vm-ember-drift-bg i{position:absolute;bottom:-12px;width:5px;height:5px;border-radius:50%;background:var(--vm-c1);box-shadow:0 0 12px 2px color-mix(in srgb, var(--vm-c1) 70%, transparent);opacity:0;animation:vm-ember-rise 11s linear infinite}.vm-ember-drift-bg i:nth-child(1){left:8%;animation-delay:0s}.vm-ember-drift-bg i:nth-child(2){left:22%;animation-delay:2.5s;width:3px;height:3px}.vm-ember-drift-bg i:nth-child(3){left:38%;animation-delay:5s}.vm-ember-drift-bg i:nth-child(4){left:55%;animation-delay:1.2s;width:4px;height:4px}.vm-ember-drift-bg i:nth-child(5){left:70%;animation-delay:6.4s}.vm-ember-drift-bg i:nth-child(6){left:84%;animation-delay:3.8s;width:3px;height:3px}.vm-ember-drift-bg i:nth-child(7){left:93%;animation-delay:8s}@keyframes vm-ember-rise{0%{transform:translateY(0) translateX(0);opacity:0}12%{opacity:.9}80%{opacity:.5}100%{transform:translateY(-105vh) translateX(24px);opacity:0}}@media (prefers-reduced-motion: reduce){.vm-ember-drift-bg i{animation:none;opacity:0}}</style><div class=\"vm-ember-drift-wrap\"><div class=\"vm-ember-drift-bg\"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><!-- content --></div>"
