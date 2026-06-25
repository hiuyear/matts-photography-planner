# FieldInvoice

Mobile-first hackathon app for turning a photographer's consultation transcript into a draft invoice that can be reviewed and emailed from the field.

## Build Scope

FieldInvoice has two main flows:

- Onboarding flow: enter business info and build the canonical price menu.
- Invoice flow: paste or pull a transcript, extract a draft invoice, review TBDs, and send the invoice by email.

Stripe and payment collection are out of scope for the initial build.

## Directory Ownership

Suggested split for parallel work:

- Onboarding: `app/onboarding`, `components/onboarding`, `lib/menu`, `lib/contracts`
- Invoice review: `app/invoices/new`, `app/invoices/review`, `components/invoice`, `lib/mocks`
- Backend/API: `app/api/extract-invoice`, `app/api/send-invoice`, `lib/extraction`, `lib/email`, `lib/transcripts`
- Shared UI: `components/shared`

## Frozen Data Contracts

The first implementation step should be defining the shared contracts in `lib/contracts`:

- Menu
- Transcript
- Extraction result
- Invoice payload

Everyone should build against these shapes with mocks before integrating.

