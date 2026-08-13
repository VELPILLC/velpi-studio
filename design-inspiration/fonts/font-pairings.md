# Google Fonts Pairings — by business vibe/niche

All pairings are free Google Fonts, loadable via `@import` at the top of the single
`<style>` tag (the GHL-safe pattern the generator already uses):

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
```

Rules of thumb baked into every pick below:
- Both fonts render well at their assigned role — display faces stay in headings,
  body faces have real 400-weight legibility at 16–18px.
- Pair by personality CONTRAST (a voiced display + a quiet workhorse), never two
  similar-proportion faces.
- Weights listed are the ones to load — loading fewer weights keeps pages fast.
- Display sizes should use `clamp()` (e.g. `clamp(2.4rem, 6vw, 5rem)`); body
  line-height 1.5–1.75, display line-height 1.05–1.2.

---

## Luxury / high-end services

**1. Playfair Display + Inter**
- Headings: Playfair Display 600 (700 for hero), body: Inter 400, labels/buttons: Inter 500–600.
- The default "expensive serif" look — editorial, established, safe for any premium brand.

**2. Cormorant Garamond + Jost**
- Headings: Cormorant Garamond 600 (it runs light — never below 500), body: Jost 400, labels: Jost 500.
- Old-world refinement over a geometric body; jewelry, interior design, boutique hotels.

**3. Marcellus + Mulish**
- Headings: Marcellus 400 (single weight — scale with size, not weight), body: Mulish 400/600.
- Roman-inscription calm; spas, architecture, wealth management.

**4. Italiana + Work Sans**
- Headings: Italiana 400 (display sizes ONLY — it's hairline-thin; ≥40px), body: Work Sans 400/500.
- Fashion-magazine minimalism; salons and couture-adjacent brands that want airy elegance.

## Trades / contractor / construction

**5. Archivo (incl. Archivo Black) + Inter**
- Headings: Archivo 700–800 or Archivo Black, body: Inter 400, labels: Inter 600 uppercase.
- Industrial grotesk muscle; roofing, concrete, general contractors — reads competent, not corporate.

**6. Oswald + Source Sans 3**
- Headings: Oswald 500–600 (uppercase works well), body: Source Sans 3 400/600.
- Condensed job-site signage energy; electricians, HVAC, excavation.

**7. Barlow Condensed + Barlow**
- Headings: Barlow Condensed 600–700, body: Barlow 400/500.
- Same superfamily = automatic cohesion; fleet services, landscaping, equipment rental.

**8. Big Shoulders + IBM Plex Sans**
- Headings: Big Shoulders 700 (uppercase, tight leading), body: IBM Plex Sans 400/500.
- Chicago-industrial display with an engineered body; steelwork, fabrication, hardscaping.

## Tech / SaaS / professional services

**9. Space Grotesk + DM Sans**
- Headings: Space Grotesk 500–700, body: DM Sans 400/500.
- The modern-startup default done right; quirky enough to feel designed, neutral enough to trust.

**10. Sora + Inter**
- Headings: Sora 600–700, body: Inter 400/500.
- Slightly techy geometry with the world's most readable body; fintech, agencies, consultancies.

**11. Manrope + IBM Plex Mono (accent)**
- Headings: Manrope 600–800, body: Manrope 400, stats/prices/code: IBM Plex Mono 500 with `tabular-nums`.
- Single-family simplicity + a monospace accent for numbers; dashboards, dev tools, data-led firms.

## Restaurant / hospitality / food

**12. Fraunces + Nunito Sans**
- Headings: Fraunces 500–700 (its optical sizes get charmingly wonky at display scale), body: Nunito Sans 400/600.
- Warm, soft-serif personality; cafés, bakeries, farm-to-table — cozy without being twee.

**13. DM Serif Display + DM Sans**
- Headings: DM Serif Display 400 (single weight, scale by size), body: DM Sans 400/500.
- High-contrast menu-cover elegance; bistros, wine bars, event venues.

**14. Abril Fatface + Lato**
- Headings: Abril Fatface 400 (hero + section titles only — too heavy for h3s), body: Lato 400/700.
- Poster-weight drama; steakhouses, cocktail lounges, anywhere the food is the show.

## Salon / beauty / wellness

**15. Prata + Figtree**
- Headings: Prata 400 (didone sparkle, keep ≥28px), body: Figtree 400/500.
- Polished and photographic; lash studios, medspa, skincare.

**16. Gilda Display + Jost**
- Headings: Gilda Display 400, body: Jost 400/500.
- Softer than Prata, more romantic; bridal, hair studios, boutique fitness (yoga/pilates).

## Medical / dental / clinical trust

**17. Source Serif 4 + Source Sans 3**
- Headings: Source Serif 4 600, body: Source Sans 3 400/600.
- Adobe's superfamily — credible, calm, quietly premium; clinics, dental, physio.

**18. Lora + Open Sans**
- Headings: Lora 600, body: Open Sans 400/600.
- The trust classic; family practices, counseling, senior care — familiar without feeling dated.

**19. Plus Jakarta Sans + Inter**
- Headings: Plus Jakarta Sans 600–700, body: Inter 400/500.
- All-sans clinical modern; urgent care, health tech, veterinary.

## Bold / street / high-energy

**20. Bebas Neue + Inter**
- Headings: Bebas Neue 400 (it's all-caps by design; letterspace +2–4%), body: Inter 400/500.
- Gym-poster energy; fitness, martial arts, auto detailing.

**21. Anton + Work Sans**
- Headings: Anton 400 (uppercase, tight), body: Work Sans 400/500.
- Heavier and blockier than Bebas; tattoo studios, streetwear, barbershops with attitude.

**22. Unbounded + Manrope**
- Headings: Unbounded 500–700 (wide, futuristic — hero + h2 only), body: Manrope 400/500.
- The loudest pick here; esports, nightlife, youth brands. Use sparingly.

## Editorial / content-led / heritage

**23. Newsreader + Inter**
- Headings: Newsreader 500–600 (display opsz at large sizes), body: Inter 400 (or Newsreader 400 for long-form).
- Quietly literary; studios, publications, thought-leadership consultancies.

**24. Libre Caslon Text + Libre Franklin**
- Headings: Libre Caslon Text 700, body: Libre Franklin 400/500.
- Old-style authority with an American gothic body; law firms, heritage brands, museums.

**25. Spectral + Karla**
- Headings: Spectral 500–600, body: Karla 400/500.
- Bookish but contemporary; writers, galleries, education.

---

## Anti-patterns (observed failures worth avoiding)

- Two personalities of the same species (Poppins + Montserrat, Playfair + Cormorant) — mushy, unhierarchical.
- Hairline display faces (Italiana, thin Cormorant) below ~32px or on photos without a scrim — they dissolve.
- Condensed faces (Oswald, Barlow Condensed, Anton, Bebas) as BODY text — headline-only tools.
- More than two families + one optional mono accent per page.
- Loading every weight 100–900 — pick 2–3 weights per family, `display=swap` always.
