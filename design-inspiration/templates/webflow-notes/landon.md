# Landon — minimal statement portfolio

- **URL:** https://webflow.com/templates/html/landon-website-template · demo: https://landon-template.webflow.io/
- **Category:** Portfolio / personal (also cited among best agency templates)

## Layout structure
Hairline-ruled header (name left, About center, Email ↗ / Twitter ↗ right, 1px black
rule under the full header) → statement hero → 2-column work grid → contact →
footer. Four sections total.

## Hero pattern
The "statement paragraph" hero: a full biographical sentence set at 52px Inter 500
("I'm an independent visual designer. For the last 7 years… Lisbon, Portugal.") —
no separate headline/subhead split. ~180px of empty space above it. Works brilliantly
for solo professionals; translate to local business as "We've been roofing Lake
County homes for 22 years…"

## Color palette
Dominant: white. Secondary: black. Accent: none in the chrome — each work card
carries its own tinted background (blush `#FBEFEA`, black, pale lime), so the grid
supplies color while the frame stays neutral.

## Typography
Inter 500 for the statement, Inter 400 small text. Single-family, two sizes — the
most copyable typographic system possible.

## Spacing/whitespace
Top-heavy whitespace before the statement; work cards are large (~600px) with fat
padding inside; grid gap ~32px.

## CTA treatment
Text links with ↗ arrows only ("Email ↗"). The header rule + arrowed links pattern
reads as confident and editorial. For client conversion add one solid button but keep
the arrowed text-link style for secondary actions.

## Animation worth reusing
6 hooks only: fade-up of the statement on load, slight image scale on card hover
(1.02, 400ms ease-out). The tinted-card work grid needs no motion. Reusable: statement
fade-up with 150ms delay; card hover scale inside overflow:hidden wrapper
(transform-only, GHL-safe).
