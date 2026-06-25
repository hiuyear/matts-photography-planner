# LLM Setup

Your part of the project is the extraction behavior: turning consultation transcripts into invoice JSON.

## What You Own

- `lib/extraction/prompt.md`: the prompt/rules the model follows.
- `lib/extraction/schema.json`: the exact JSON shape the model must return.
- `tests/extract-fixtures.json`: labeled examples used to check the model.
- `scripts/run-extract-fixtures.mjs`: a local runner that calls an LLM and diffs results against the fixtures.

## What The API Teammate Owns

The API teammate should create `/extract` and call the LLM with:

1. The prompt in `lib/extraction/prompt.md`
2. The canonical menu
3. The meeting transcript
4. The schema in `lib/extraction/schema.json`

The endpoint should return the model's invoice JSON to the UI.

## Picking The Model

Use a model that supports reliable JSON or structured output. The runner is OpenAI-compatible by default, so it can work with OpenAI directly or a compatible gateway.

Do not hardcode the model in the app yet. Use environment variables:

```sh
LLM_API_KEY=...
LLM_MODEL=...
```

Optional, if not using OpenAI's default chat completions URL:

```sh
LLM_API_URL=...
```

## Running The Fixtures

From the repo root:

```sh
LLM_API_KEY=... LLM_MODEL=... node scripts/run-extract-fixtures.mjs
```

The script runs all four transcripts and compares the model output to the labeled output in `tests/extract-fixtures.json`.

If a test fails, tune `lib/extraction/prompt.md` first. The two most important cases are:

- Test 3: hedged language must not become selected invoice items.
- Test 4: final decisions override earlier choices, and waived travel is selected at `$0`.

## What To Say In Team Chat

"I'll own the LLM extraction prompt, schema, and eval fixtures. The API can call the selected model from `/extract` using `lib/extraction/prompt.md` and validate against `lib/extraction/schema.json`. Once the API is wired, we can run the same four fixtures against it."
