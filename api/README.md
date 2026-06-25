# FieldInvoice API

Backend for Person 1: Granola fetch, paste fallback, and invoice email.

Base URL (local): `http://localhost:3001`

## Quick start

```bash
cd api
cp .env.example .env   # add GRANOLA_API_KEY and RESEND_API_KEY
npm install
npm run dev
```

## Endpoints

### `GET /health`
Health check.

### `GET /transcript?source=granola`
List Granola notes that have a summary (skips notes without one).

**Response:**
```json
{ "notes": [{ "id": "...", "title": "...", "created_at": "...", "has_summary": true }] }
```

### `GET /transcript?source=granola&note_id=<id>`
Fetch a note's transcript as **Contract B**.

**Response:**
```json
{ "source": "granola", "text": "full transcript string" }
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

Returns `SAMPLE_EXTRACTION` mock while `EXTRACT_STUB` is not `"false"`. Person 3 wires the real LLM in `src/routes/extract.ts`.

### `POST /send-invoice`
Send invoice email from **Contract D**.

**Body:** full Contract D payload.

**Response:**
```json
{ "ok": true, "message_id": "..." }
```

Without `RESEND_API_KEY`, logs the invoice to console and returns a mock id (safe for local dev).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `3001` |
| `GRANOLA_API_KEY` | For Granola | Bearer token for Granola Business plan |
| `RESEND_API_KEY` | For email | Resend API key |
| `FROM_EMAIL` | No | Sender address (default: menu from_email) |
| `EXTRACT_STUB` | No | `"false"` to use real LLM (Person 3) |

## Contracts

Frozen types live in `src/types/contracts.ts`. Mocks in `src/mocks/`.
