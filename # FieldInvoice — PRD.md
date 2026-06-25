# FieldInvoice — PRD

A mobile tool that turns a photographer's client consultation call into a draft invoice, reviewed and sent from the field. 90-minute hackathon build, 3 people.

## Problem

Matt runs a wedding photography business. He closes deals on consultation calls but is always shooting afterward, so invoices go out days late. The agreed terms (package, add-ons, negotiated price, deposit) live in the conversation, not in any structured field, so they cannot be generated from a package name alone. Prices are "starting at," add-ons are negotiated per couple, and custom items get quoted live.

## Solution

Matt sets his price menu once. His consultation calls are transcribed (Granola). After a call, an LLM maps the conversation to his menu as a yes/no checklist with prices, and flags anything undecided or off-menu as TBD. Matt opens a near-complete invoice on his phone, fills the one or two missing prices, and sends. The invoice goes out as a formatted email.

The menu is the unlock. It turns invoice generation from open-ended extraction, which hallucinates numbers, into classification against a known schema, which is reliable enough to trust live. The TBD list is the human-in-the-loop: the AI handles what it is sure about and kicks the rest back to Matt rather than guessing.

Stripe is out of scope. Delivery is email. Payment rails are trivial to add later.

## Core flow

Two distinct sections of the app.

**Onboarding flow** (run once): Matt enters business info and builds his price menu across a multi-page wizard.

**Invoice flow** (per client): pull or paste a transcript, AI extracts a draft, Matt reviews the checklist and fills TBDs, sends the invoice email.

## Canonical price menu

Hardcoded for the demo. All call scripts and extraction are scored against this.

```json
{
  "business_name": "Nix Hernandez Photography",
  "from_email": "matt@nixhernandez.com",
  "currency": "USD",
  "menu": [
    { "id": "wedding_base",   "label": "Wedding package (base)", "default_price": 4599, "unit": "flat" },
    { "id": "elopement",      "label": "Elopement package",      "default_price": 1800, "unit": "flat" },
    { "id": "engagement",     "label": "Engagement session",     "default_price": 750,  "unit": "flat" },
    { "id": "second_shooter", "label": "Second shooter",         "default_price": 600,  "unit": "flat" },
    { "id": "extra_hour",     "label": "Extra coverage hour",    "default_price": 350,  "unit": "per_hour" },
    { "id": "travel",         "label": "Travel fee",             "default_price": 200,  "unit": "flat" }
  ]
}
```
`unit` is `flat`, `per_hour`, or `per_person`. Prices are defaults; the extractor overrides them only when a different number is quoted on the call.

## Data contracts

Freeze these in the first 5 minutes. Everyone builds against these shapes with mocks and integrates at the end. Changing a contract means telling the other two people.

**A — Menu.** The canonical menu object above. Produced by Onboarding, consumed by LLM and Invoice flow.

**B — Transcript.** Produced by APIs/Granola, consumed by LLM.
```json
{ "source": "granola" | "paste", "text": "full transcript string" }
```

**C — Extraction result.** Produced by LLM, consumed by Invoice review UI.
```json
{
  "client": { "name": "string|null", "email": "string|null" },
  "line_items": [
    { "id": "string", "label": "string", "selected": true, "price": 0, "quantity": 1,
      "price_source": "default|quoted", "source_quote": "string" }
  ],
  "tbd_items": [ { "label": "string", "note": "string", "source_quote": "string" } ],
  "deposit_paid": null,
  "summary": "string"
}
```

**D — Invoice payload.** Produced by Invoice review UI, consumed by email sender.
```json
{
  "to_email": "string", "client_name": "string",
  "from": { "business_name": "string", "from_email": "string" },
  "currency": "USD",
  "line_items": [ { "label": "string", "price": 0, "quantity": 1 } ],
  "subtotal": 0, "deposit_paid": 0, "total_due": 0
}
```

## Extraction prompt

One LLM call. Inputs: Contract A menu and Contract B transcript. Output: strict Contract C JSON, no prose.

```
You are an invoicing assistant for a wedding photographer. You are given:
1. A price MENU as JSON (the only services with known prices).
2. A TRANSCRIPT of a client consultation call.

Map the conversation to the menu and produce a draft invoice.

Rules:
- For each menu item, decide if the client clearly agreed. Set "selected" true or false.
  If the client was non-committal ("maybe", "I'll think about it", "let me check"),
  treat it as NOT selected and add it to tbd_items.
- Use the menu default_price unless the photographer clearly quoted a different number
  on the call. If overridden, use the quoted number and set "price_source":"quoted".
- For per_hour or per_person items, fill "quantity" from the conversation. Default to 1
  if selected but no number was stated.
- If the client changed their mind, honor their FINAL decision in the call.
- If a service was discussed that is NOT on the menu, OR the photographer gave no price
  / said he would get back to you, do NOT guess. Add it to tbd_items with a short note
  and the exact quote.
- Extract client name and email if stated, else null. Extract deposit paid if mentioned,
  else null.
- Never invent a price. When unsure whether something was agreed, mark it TBD.
- Return ONLY valid JSON in the Contract C schema. No markdown, no commentary.

MENU:
{{menu_json}}

TRANSCRIPT:
{{transcript}}
```

## Work division

### Person 1 — APIs, Granola, Email
Owns everything crossing the network and the backend glue.
- Granola fetch: `GET https://public-api.granola.ai/v1/notes` and `/notes/{id}?include=transcript`, Bearer key, Business plan. Return Contract B.
- Pre-demo: record the training call into Granola, confirm it has a summary and is retrievable. The API skips notes without a summary.
- Paste fallback endpoint wrapping pasted text into Contract B. This is the safety net if Granola fails live.
- Email sender: take Contract D, render a clean HTML invoice, send it. Resend, SendGrid, or nodemailer. Sending to your own inbox is fine for demo.
- Stub endpoints early so others call real URLs: `GET /transcript?source=`, `POST /extract` proxy if needed, `POST /send-invoice`.
- Risk owned: Granola is the only live dependency. Have paste working before touching the API.

### Person 2 — UX, Onboarding flow + Invoice review
Owns all frontend. Onboarding is a distinct section with its own routes, separate from the Invoice flow.

Onboarding flow (`/onboarding/*`), a real multi-page wizard producing Contract A:
- `/onboarding/welcome` — business name and from-email.
- `/onboarding/menu` — build the price list: add/edit/delete rows with label, price, unit. Pre-seed with the canonical items so it is never empty.
- `/onboarding/review` — read-only summary, finish writes Contract A and routes to the Invoice flow.
Keep progress indicator and Back/Next, state carried across pages.

Invoice flow (`/invoice/*`):
- `/invoice/new` — choose source: pull from Granola or paste transcript. Calls `/transcript`.
- `/invoice/processing` — loading while extraction runs.
- `/invoice/review` — hero screen. Render Contract C: line-item toggles with editable price and quantity, client fields, and a TBD section with empty price inputs that block send until filled. Show the summary line.
- `/invoice/sent` — confirmation after `/send-invoice` returns ok.
Build against a hardcoded Contract C so the review screen works before the LLM is ready.

### Person 3 — LLM Inference
Owns extraction: transcript plus menu in, Contract C out.
- Implement the extraction prompt against the canonical menu.
- Enforce no-guessing: undecided, non-committal, or off-menu goes to tbd_items with no price.
- Robust parsing: strip code fences, try/catch the JSON parse, one retry on malformed output. Never pass raw model text to Person 2.
- Expose `POST /extract` (body `{ menu, transcript }`) returning Contract C.
- Validate against the training script and the inference test suite.
- Risk owned: malformed JSON breaking the UI. Validate before returning.

## Timeline

- 0–5 min: freeze contracts together, confirm the training call script.
- 5–65 min: build in parallel against mocks.
- 65–85 min: integrate. Person 2 swaps mocks for real endpoints. Person 1 records and verifies the Granola note.
- 85–90 min: dry-run the demo once, including the paste fallback.

## Demo path

Onboarding wizard (Matt sets the menu) → New invoice, pull transcript → processing → review screen auto-filled with one blinking TBD → Matt types the drone price → send → invoice lands in the inbox.

Make the TBD the hero moment. The AI knowing what it does not know reads stronger than a clean parse.

## Out of scope

Stripe and payment rails, tax calculation, payment schedules and partial payments, auth and multi-user, persistence across sessions, menu editing beyond the demo wizard.README.mdREADME.mdREADME.md