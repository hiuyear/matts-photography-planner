# FieldInvoice API

Backend for Person 1: Fathom transcript pull, paste fallback, and invoice email.

Base URL (local): `http://localhost:3001`

## Quick start

```bash
cd api
cp .env.example .env   # add FATHOM_API_KEY and RESEND_API_KEY
npm install
npm run dev
```

## Endpoints

### `GET /health`
Health check.

### `GET /transcript?source=fathom`
List Fathom meetings that have a summary.

**Response:**
```json
{ "meetings": [{ "recording_id": 123, "title": "...", "created_at": "...", "has_summary": true }] }
```

### `GET /transcript?source=fathom&recording_id=<id>`
Fetch a meeting transcript as **Contract B**.

**Response:**
```json
{ "source": "fathom", "text": "Speaker: dialogue..." }
```

### `POST /transcript`
Paste fallback — wraps pasted text into **Contract B**.

**Body:**
```json
{ "text": "full transcript string" }
```

### `POST /extract`
LLM extraction — menu + transcript in, **Contract C** out.

**Body:**
```json
{
  "menu": { "business_name": "...", "from_email": "...", "currency": "USD", "menu": [...] },
  "transcript": { "source": "paste", "text": "..." }
}
```

Returns mock Contract C when `EXTRACT_STUB=true` or no LLM key is configured. Otherwise uses `lib/extraction/prompt.md` with `LLM_API_KEY` + `LLM_MODEL` (or `LOVABLE_API_KEY`).

### `POST /send-invoice`
Render and deliver invoice from **Contract D**. **No DNS or email API required by default.**

**Body:** full Contract D payload.

**Response:**
```json
{
  "ok": true,
  "delivery": "preview",
  "message_id": "preview-...",
  "preview_html": "<html>...</html>",
  "text_body": "plain text invoice",
  "mailto_url": "mailto:client@example.com?subject=...&body=...",
  "subject": "Invoice from Nix Hernandez Photography"
}
```

**Demo path (default):** Person 2 shows `preview_html` on `/invoice/sent`, or opens `mailto_url` so Matt's phone Mail app sends it — no Resend DNS needed.

**Optional real send:** set `EMAIL_MODE=smtp` with Gmail app password, or `EMAIL_MODE=resend` once domain is verified. Falls back to preview if send fails.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `3001` |
| `FATHOM_API_KEY` | For pull | Fathom API key (Settings → API Access) |
| `EMAIL_MODE` | No | `preview` (default), `smtp`, or `resend` |
| `SMTP_*` | For smtp mode | Gmail/etc — no domain DNS needed |
| `RESEND_API_KEY` | For resend mode | Only if domain verified in Resend |
| `FROM_EMAIL` | For resend mode | Verified sender address |
| `EXTRACT_STUB` | No | `"false"` to use real LLM (Person 3) |
| `GRANOLA_API_KEY` | Optional | Legacy Granola support if needed |

## Contracts

Frozen types live in `src/types/contracts.ts`. Mocks in `src/mocks/`.
