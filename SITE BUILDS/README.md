# SITE BUILDS

Approved mockups become real sites here. Everything in this folder has already
been chosen — this is production work, not exploration.

## What goes in here

    SITE BUILDS/
      pour-right-concrete/
        APPROVED-MOCKUP.html    the exact mockup that was signed off, untouched
        index.html              the real build, in progress
        assets/                 Higgsfield video / 3D / images used by the build
        NOTES.md                decisions, deployment target, what changed

`APPROVED-MOCKUP.html` is a reference copy and never gets edited. When the build
drifts from it, that has to be a deliberate decision, not an accident — keeping
the original untouched is what makes the drift visible.

## Build target

Single-file HTML pasted into a GoHighLevel funnel. Constraints that actually
matter there:

- A `<script>` cannot be nested inside a `<div>` — scripts must be siblings of
  the page wrapper. This is the one rule that silently breaks everything.
- CDN scripts and WebGL both work in GHL funnels. Confirmed by testing, not
  assumed.
- Pin exact library versions. Never `@latest`.
- Every JS-driven region needs a CSS fallback that looks finished on its own.

## Higgsfield assets

Motion, video and 3D are generated per build and live in `assets/`. Generate
them once the layout is settled — not before, or you will be art-directing
against a page that no longer exists.
