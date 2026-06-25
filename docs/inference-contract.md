# LLM Inference Contract

This document defines the expected behavior for the transcript-to-invoice extraction step. The API and UI can evolve independently, but `/extract` should return data that follows this contract.

## Canonical Menu

Every extraction result is scored against this menu:

| ID | Label | Default price | Quantity behavior |
| --- | --- | ---: | --- |
| `wedding_base` | Wedding package (base) | 4599 | Flat quantity of 1 |
| `elopement` | Elopement package | 1800 | Flat quantity of 1 |
| `engagement` | Engagement session | 750 | Flat quantity of 1 |
| `second_shooter` | Second shooter | 600 | Flat quantity of 1 |
| `extra_hour` | Extra coverage hour | 350 | Quantity is number of hours |
| `travel` | Travel fee | 200 | Flat quantity of 1 |

## Output Shape

```json
{
  "client": { "name": "Client Name", "email": "client@example.com" },
  "line_items": [
    {
      "id": "wedding_base",
      "label": "Wedding package (base)",
      "selected": true,
      "price": 4599,
      "quantity": 1,
      "price_source": "default",
      "source_quote": "Exact supporting quote from the transcript."
    }
  ],
  "tbd_items": [
    {
      "label": "Off-menu or undecided item",
      "note": "Why this needs follow-up.",
      "source_quote": "Exact supporting quote from the transcript."
    }
  ],
  "deposit_paid": null,
  "summary": "Short human-readable invoice summary."
}
```

## Extraction Rules

- Return all canonical line items every time, even when `selected` is `false`.
- Mark an item selected only when the client clearly commits to it or the photographer clearly confirms it as part of the invoice.
- Do not mark hedged language as selected. Phrases like "maybe", "thinking about it", "probably", "need to check", and "get back to you" should remain unselected and usually appear in `tbd_items`.
- Honor the final decision when the transcript includes a mind change. Retractions override earlier acceptance.
- Use `price_source: "default"` when the canonical price applies.
- Use `price_source: "quoted"` when the transcript overrides the canonical price, including waived fees.
- A waived fee should be modeled as selected with `price: 0` when the fee was discussed and explicitly waived.
- Use the default quantity of `1` unless the transcript gives a clear quantity. Extra coverage hours should use the number of hours as `quantity`.
- Put off-menu items or unresolved canonical items in `tbd_items` when they need follow-up pricing, confirmation, or scope.
- Set `deposit_paid` to `null` unless the transcript explicitly says a deposit was paid or not paid.
- Keep `source_quote` short and grounded in exact transcript language.

## Evaluation Focus

The fixture suite in `tests/extract-fixtures.json` covers four failure modes:

| Test | Targets |
| --- | --- |
| 1 | Minimal booking, elopement vs wedding, null deposit, no TBD |
| 2 | Full selection, multiple TBDs, quantity for extra hours |
| 3 | Non-committal client, hedged items must not be selected |
| 4 | Mid-call mind changes, waived fee quoted to 0, quantity |

For scoring, compare the model output to each fixture's `expected` object. The highest-risk checks are Test 3 hedging and Test 4 final-decision handling.
