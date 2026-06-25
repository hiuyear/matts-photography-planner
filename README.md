# FieldInvoice

Mobile-first hackathon app for turning a photographer's consultation transcript into a draft invoice that can be reviewed and emailed from the field.

## Build Scope

FieldInvoice has two main flows:

- Onboarding flow: enter business info and build the canonical price menu.
- Invoice flow: paste or pull a transcript, extract a draft invoice, review TBDs, and send the invoice by email.

Stripe and payment collection are out of scope for the initial build.

## API

Backend lives in [`api/`](api/). See [`api/README.md`](api/README.md) for endpoints and setup.

```bash
cd api && npm install && npm run dev
```

Endpoints: `GET /transcript`, `POST /transcript`, `POST /extract`, `POST /send-invoice`

## LLM Inference

The transcript extraction contract lives in `docs/inference-contract.md`. The labeled `/extract` inference fixtures live in `tests/extract-fixtures.json`.

LLM setup instructions live in `docs/llm-setup.md`. The extractor prompt and schema live in `lib/extraction/`.
