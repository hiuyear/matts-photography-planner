# FieldInvoice

Mobile-first hackathon app for turning a photographer's consultation transcript into a draft invoice that can be reviewed and emailed from the field.

## Build Scope

FieldInvoice has two main flows:

- Onboarding flow: enter business info and build the canonical price menu.
- Invoice flow: paste or pull a transcript, extract a draft invoice, review TBDs, and send the invoice by email.

Stripe and payment collection are out of scope for the initial build.

## Run locally

Terminal 1 — API (source of truth):

```bash
cd api
cp .env.example .env   # add FATHOM_API_KEY + LLM_API_KEY (or LOVABLE_API_KEY)
npm install
npm run dev            # http://localhost:3001
```

Terminal 2 — Frontend:

```bash
cd web
npm install
npm run dev            # proxies /api → localhost:3001
```

## Architecture

```
React (web/)  ──/api proxy──▶  Express API (api/)  ──▶  Fathom / LLM / email
```

| Layer | Path | Role |
|-------|------|------|
| Frontend | `web/` | Onboarding + invoice UI |
| API | `api/` | Transcript pull, `/extract`, `/send-invoice` |
| LLM prompt | `lib/extraction/` | Shared extraction rules + schema |
| Fixtures | `tests/extract-fixtures.json` | LLM eval suite |

## API endpoints

`GET /transcript`, `POST /transcript`, `POST /extract`, `POST /send-invoice`

See [`api/README.md`](api/README.md) for details.

## LLM Inference

The extraction prompt lives in `lib/extraction/prompt.md`. The API calls it from `POST /extract`.

Fixture runner: `LLM_API_KEY=... LLM_MODEL=... node scripts/run-extract-fixtures.mjs`

See [`docs/llm-setup.md`](docs/llm-setup.md).

## Frontend graphics

Lovable-ready customization prompts: [`docs/frontend-graphics-prompts.md`](docs/frontend-graphics-prompts.md).

Wedding photo sample mockups: `web/public/samples/` (served at `/samples/*`).
