# Frontend Graphics Customization Prompts

Copy-paste these prompts into [Lovable](https://lovable.dev) to customize FieldInvoice visuals without touching core invoice logic. Each prompt is scoped to one surface so you can iterate safely.

**Design anchors** (keep these unless you are deliberately rebranding):

| Token | Current value | Role |
|-------|---------------|------|
| Display font | Cormorant Garamond | Headlines, studio name |
| Body font | Inter | Forms, tables, labels |
| Gold accent | `oklch(0.78 0.13 85)` | CTAs, progress, highlights |
| Card style | `glass-card` utility | Frosted panels on gradient page |
| Primary CTA | `btn-gold` utility | Gold gradient buttons |
| Mood | Champagne sparkle, field-ready, premium but fast | Not a couple-facing wedding site |

Sample wedding photos live in `web/public/samples/`. Swap placeholders for real `.jpg` / `.webp` files with the same filenames — see `web/public/samples/README.md`.

---

## 1. Landing hero — wedding photo strip

```
Add a horizontal wedding photo mockup strip below the hero card on the landing page (when the user has not set up their menu yet).

Use the existing WeddingPhotoMockups component and sample photos from /samples/*. Replace emoji-only hero with a split layout on sm+ screens: left = headline + CTA, right = a staggered polaroid-style photo grid (3–4 images, slight rotation, soft drop shadow).

Keep glass-card, btn-gold, and text-gold-gradient. Photos should feel editorial — warm tones, not stocky. On mobile, stack photos under the headline in a horizontal scroll with snap.

Do not change onboarding or invoice routes. Do not add new dependencies.
```

---

## 2. Overall theme refresh — warmer gold

```
Refresh FieldInvoice's color palette in web/src/styles.css to feel warmer and more golden-hour without losing readability on mobile outdoors.

Shift --gold and --gradient-gold slightly toward amber (hue ~75–80). Soften --gradient-page to a barely-there blush undertone. Keep contrast WCAG AA for body text.

Update sparkle animation to be subtler (lower opacity, slower). Preserve all existing utility class names: glass-card, btn-gold, text-gold-gradient, tbd-blink.

Do not rename CSS variables consumed by components. Do not add a dark mode toggle yet.
```

---

## 3. Onboarding welcome — studio branding preview

```
On /onboarding/welcome, add a live preview panel beside the business name and email fields (stacked on mobile).

As the user types their business name, show it in font-display with text-gold-gradient in a mini invoice letterhead mockup. Include a small logo placeholder circle and one sample wedding photo thumbnail from /samples/couple-portrait.

Use glass-card styling. Keep the 3-step progress dots in PageShell. Fields and validation unchanged.

This is a visual preview only — do not persist a logo upload yet.
```

---

## 4. Invoice review — checklist polish

```
Polish /invoice/review so the line-item checklist feels like a premium quote, not a generic form.

Selected rows: subtle gold left border and soft gold-soft background. Unselected rows: muted, slightly collapsed. TBD section keeps tbd-blink pulse but add a small AlertTriangle icon treatment consistent with lucide-react.

Sticky footer on mobile with subtotal + Send invoice btn-gold. Preserve all send-blocking logic for empty TBD prices.

Do not change API calls or extraction data shapes.
```

---

## 5. Invoice sent — email preview frame

```
On /invoice/sent, wrap the HTML invoice preview in a realistic email-client frame: rounded window chrome, subtle shadow, max-width ~640px centered.

Above the preview, add a one-line success state with champagne emoji and "Invoice on its way to {client email}". Below, optional link-style "Send another" using existing navigation.

Match the app's glass-card aesthetic for the outer frame. Do not modify how preview_html is rendered — only the surrounding chrome.
```

---

## 6. PageShell background — cinematic bokeh

```
Replace the floating ✨ sparkle field in PageShell with a softer cinematic background: very light bokeh circles in gold and silver at 5–8% opacity, slow drift animation.

Keep the FieldInvoice wordmark and footer "crafted for matt". Sparkles can remain as a single accent near the logo only.

Performance: use CSS only, no canvas. Respect prefers-reduced-motion — disable drift when set.

Do not change route structure or header link behavior.
```

---

## 7. Dashboard — empty state with sample work

```
When the invoice dashboard has zero invoices, replace the dashed empty box with a richer empty state: short copy + WeddingPhotoMockups showing 2 sample thumbnails + btn-gold "New invoice" as primary action.

Convey "your next client call becomes an invoice here" — photographer-facing, not couple-facing.

Reuse components from web/src/components/WeddingPhotoMockups.tsx. No new API endpoints.
```

---

## 8. Swap placeholder photos for real samples

```
Replace SVG placeholders in web/public/samples/ with real wedding photography samples (royalty-free or team-owned).

Filenames to keep: ceremony, couple-portrait, reception, detail. Prefer .webp at ~1200px wide, compressed under 200KB each.

Update captions in web/src/lib/sample-photos.ts if couple names or venues change. Ensure alt text describes the scene for accessibility.

Do not hotlink external URLs — assets must live in public/samples/.
```

---

## 9. Invoice email HTML — match app branding

```
In api/src/services/email.ts, restyle renderInvoiceHtml() to match the FieldInvoice web theme: Cormorant Garamond for the business name heading, gold accent line under header, clean table with subtle borders.

Use inline CSS only (email-safe). Optional: small logo img if BUSINESS_LOGO_URL env is set later — stub the variable but default to text-only.

Keep the same invoice data fields and table structure. Test that preview on /invoice/sent still renders correctly.
```

---

## 10. Mobile field mode — high contrast outdoors

```
Optimize FieldInvoice for outdoor/mobile field use: slightly larger tap targets (min 44px), stronger border contrast on inputs, and btn-gold with a darker text color for sunlight readability.

Increase glass-card backdrop opacity so content stays legible on bright screens. Bump base font size on invoice review inputs to 16px to prevent iOS zoom.

Scope changes to web/src/styles.css and shared UI components only. No layout rewrites.
```

---

## Quick reference — files to touch

| Prompt area | Primary files |
|-------------|---------------|
| Theme / colors | `web/src/styles.css` |
| Layout shell | `web/src/components/PageShell.tsx` |
| Photo mockups | `web/src/components/WeddingPhotoMockups.tsx`, `web/public/samples/` |
| Landing | `web/src/routes/index.tsx` |
| Onboarding | `web/src/routes/onboarding.*.tsx` |
| Invoice UI | `web/src/routes/invoice.*.tsx` |
| Email template | `api/src/services/email.ts` |
