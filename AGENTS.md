# Agent Execution Rules for SpeakingSystem

These rules apply to all AI agents working in this repository.

## Data Integrity First

- Use only real, verifiable data sources listed in `docs/real_world_data_source_map.md`.
- Follow the constraints and JSON contract in `docs/real_world_data_policy.md`.
- Never insert placeholder/demo strings into production data paths.
- If required data is missing, mark it as incomplete instead of guessing.

## Ground-Truth Priority

- For user analytics and behavior: use production database/log sources only.
- For external enrichment: use approved APIs and store provenance metadata.
- For linguistic analysis artifacts: rely on actual learner transcripts or verified corpora.

## Required Metadata on Exports

Every generated analytics/export record must carry:

- `collected_at`
- `source_type`
- `source_ref`
- `source_url` (nullable only for DB-native records)
- `status` and `missing_fields` when incomplete

## Rejection Rules

Reject any output lacking provenance or containing:

- placeholder names/domains
- lorem ipsum/filler text
- fabricated IDs/timestamps

## Validation

Run a "reality check" before final output:

- score/range bounds valid
- timestamps valid
- counts not negative
- obvious anomalies flagged, not hidden
