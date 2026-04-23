# SpeakingSystem Real-World Data Source Map

This map defines approved, verifiable data sources for `SpeakingSystem`.
Any dataset not listed here is considered untrusted until reviewed.

## 1) Internal Ground-Truth Sources (Primary)

Use these SQLAlchemy-backed tables as the canonical source for product metrics and learner outcomes:

- `users`: authenticated profiles and roles.
- `practice_sessions`: user practice session boundaries.
- `practice_answers`: learner transcript, duration, score components, and assessment payloads.
- `test_sessions`: exam session lifecycle and overall score.
- `test_answers`: per-question test outputs and transcripts.
- `questions`: curated IELTS prompts used by the app.
- `topics`: prompt grouping and part metadata.
- `custom_questions`: user-supplied prompts.
- `user_feedbacks`: explicit satisfaction and comments.
- `guest_trials`: trial usage counters.
- `user_token_wallets`: token balances and consumption records.
- `billing_plans`: effective plan definitions.
- `subscription_requests`: transfer requests and review status.

Reference model definitions: `backend/app/models/sqlalchemy_models.py`.

## 2) External Verified Sources (Secondary)

These services are approved only when responses are captured/stored with provenance metadata.

- Deepgram STT API
  - Endpoint: `https://api.deepgram.com/v1/listen`
  - Integration: `backend/app/services/deepgram_service.py`
  - Data type: transcript, confidence, word-level timing/confidence.

- Azure Speech Pronunciation Assessment
  - SDK-backed endpoint (service-side), region from `AZURE_SPEECH_REGION`
  - Integration: `backend/app/services/azure_service.py`
  - Data type: accuracy, fluency, prosody, completeness, phoneme/word details.

- LLM assessment providers (Gemini/OpenAI-compatible)
  - Gemini endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
  - OpenAI endpoint: `https://api.openai.com/v1/chat/completions`
  - Integration: `backend/app/services/llm_service.py`
  - Data type: lexical/grammar/fluency analysis output JSON.

## 3) Dataset Trust Levels

- `trusted_primary`: internal production tables above.
- `trusted_secondary`: API/SDK response with timestamp + endpoint/service reference.
- `untrusted`: any ad-hoc CSV, hardcoded arrays, placeholders, synthetic demo fixtures.

## 4) Disallowed Inputs

Reject these from analytics/reports/production decisions:

- Placeholder identities (`John Doe`, `Jane Doe`, etc.).
- Non-resolving domains (`example.com`, `placeholder.com`).
- Lorem ipsum text.
- Fabricated IDs or synthetic benchmark values not traceable to source records.

## 5) Required Provenance Fields

Every exported analytics or reporting record should include:

- `collected_at` (ISO-8601 timestamp)
- `source_type` (`db`, `log`, `api`, `corpus`)
- `source_ref` (record id / query hash / file offset)
- `source_url` (required for API/corpus sources; nullable for DB)
- `status` (`complete` or `incomplete`)

## 6) Missing Data Rule

If a required value is unavailable from approved sources:

- set field value to `null`
- set `status: "incomplete"`
- add the field name under `missing_fields`

Do not infer or fabricate missing values.
