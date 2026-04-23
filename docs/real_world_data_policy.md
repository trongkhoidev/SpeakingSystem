# Real-World Data Integrity Policy

This policy enforces authentic data usage across `SpeakingSystem` code, analytics, and AI-assisted workflows.

## Objective

Populate product outputs with 100% verifiable real-world data from approved sources.

## Hard Constraints

1. No mock or placeholder content in production data flows.
2. No assumptions when required values are missing.
3. Every output value must be source-traceable.
4. Production-only for user analytics and behavior metrics.

## Prohibited Patterns

- Placeholder names (`John Doe`, `Test User`, etc.)
- Placeholder domains (`example.com`, `placeholder.com`)
- Lorem ipsum or generated filler text
- Fabricated IDs, timestamps, or perfectly linear "fake" benchmark sequences

## Output Contract (JSON)

All data exports should satisfy this structure:

```json
{
  "data": [
    {
      "id": "string",
      "category": "user_analytics|external|linguistic",
      "value": {},
      "status": "complete|incomplete",
      "missing_fields": [],
      "metadata": {
        "collected_at": "2026-04-22T18:30:00Z",
        "source_type": "db|log|api|corpus",
        "source_url": "https://... or null",
        "source_ref": "record_id|query_hash|offset",
        "verification": {
          "checked": true,
          "rule": "human-readable validation rule",
          "result": "pass|fail"
        }
      }
    }
  ],
  "summary": {
    "total_records": 0,
    "complete_records": 0,
    "incomplete_records": 0,
    "rejected_records": 0
  }
}
```

## Reality Check Requirements

Before publishing output:

- Validate non-negative counts where expected.
- Validate timestamps are parseable ISO-8601 and not future-dated unless explicitly forecasted.
- Validate IELTS score bounds (`0.0 <= band <= 9.0`) and pronunciation metric ranges (`0 <= score <= 100`) where applicable.
- Flag outliers and keep raw values; do not silently clamp.

## Missing Data Handling

When data is unavailable from approved sources:

- return `null`
- set `status` to `incomplete`
- append field names to `missing_fields`
- do not backfill with synthetic defaults

## Operational Enforcement

- Use `docs/real_world_data_source_map.md` as the allowed-source registry.
- Treat any unmapped source as blocked until reviewed.
- During code review, reject changes introducing placeholders into production pathways.
