// Fixed responsive utilities — the deterministic half of the mobile contract.
//
// The build prompt has always DESCRIBED the mobile rules (collapse to one
// column, run edge-to-edge, full-width CTAs, hide the nav links) and left the
// model to hand-write an @media query for each one, per site, every time.
// That is stochastic in a specific and silent way: the model's own rule for a
// grid is typically written as ".velpi-page .services .card-grid", so a
// generic mobile override loses the cascade to it and simply never applies —
// the same class of failure the server-enforced type floor already exists to
// solve for p/li font-size.
//
// These five classes make those behaviors a guarantee instead of a hope. The
// block is appended at the very end of the single <style> tag and uses
// !important, so it wins regardless of how specific the model's own rules
// are. They are OPT-IN: nothing changes unless the model puts the class on an
// element, so previously generated pages are completely unaffected.
//
// Deliberately NOT included: a blanket `overflow-x: hidden` on .velpi-page.
// It would guarantee "no horizontal scroll" by clipping the symptom, and it
// creates a scroll container that BREAKS position:sticky on every descendant
// — which would silently kill the sticky nav the conversion rules require.
// Real overflow is caught instead by the geometry probe at 390px.

export const MOBILE_BREAKPOINT_MAX = 767 // phone and below
export const MOBILE_BREAKPOINT_MIN = 768 // tablet and up

export const MOBILE_UTILITY_CLASSES = [
  'velpi-stack-mobile',
  'velpi-edge-mobile',
  'velpi-full-mobile',
  'velpi-hide-mobile',
  'velpi-hide-desktop',
]

export const MOBILE_UTILITIES_CSS = `
/* velpi: server-enforced mobile utilities */
@media (max-width: ${MOBILE_BREAKPOINT_MAX}px){
  /* Collapse any multi-column grid/flex row to one column, keeping its gap.
     grid (not block) so an existing gap keeps working whichever the source was. */
  .velpi-page .velpi-stack-mobile { display: grid !important; grid-template-columns: 1fr !important; }
  /* Edge-to-edge band with the contract's 12-16px text inset. box-sizing is
     forced so the inset can never push the element past the viewport. */
  .velpi-page .velpi-edge-mobile { box-sizing: border-box !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; padding-left: 14px !important; padding-right: 14px !important; border-radius: 0 !important; }
  /* Full-width CTA at a real tap height, label optically centered.
     width:100% alone is NOT enough: inside a flex row (how button pairs are
     usually built) flex-shrink overrides the width and the button lands well
     short of full width. flex:1 1 100% makes it claim the whole line, and
     min-width:0 keeps it shrinkable so it can never force horizontal scroll
     when it does share a row. A CTA row that must truly stack should also
     carry velpi-stack-mobile. */
  .velpi-page .velpi-full-mobile { box-sizing: border-box !important; display: flex !important; align-items: center !important; justify-content: center !important; width: 100% !important; flex: 1 1 100% !important; min-width: 0 !important; min-height: 52px !important; text-align: center !important; }
  /* Declared last so hiding beats stacking if both land on one element. */
  .velpi-page .velpi-hide-mobile { display: none !important; }
}
@media (min-width: ${MOBILE_BREAKPOINT_MIN}px){
  .velpi-page .velpi-hide-desktop { display: none !important; }
}
`
