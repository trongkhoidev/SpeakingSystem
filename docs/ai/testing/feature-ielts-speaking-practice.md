---
phase: testing
title: IELTS Speaking Practice System - Testing Strategy
description: Testing approach for the Speaking System covering unit, integration, E2E, and manual testing
---

# Testing Strategy

## Test Coverage Goals

- **Unit tests:** 100% coverage of scoring logic, band calculation, audio preprocessing
- **Integration tests:** Full pipeline from audio upload → Azure → LLM → scoring → response
- **E2E tests:** Browser-based recording → API → feedback display flow
- **Manual testing:** UI/UX verification, cross-browser audio recording, real Azure responses

## Unit Tests

### Scoring Service (`scoring_service.py`)
- [ ] `test_ielts_rounding_rules` — Verify 0.75+ rounds up, 0.25-0.74 → .5, <0.25 rounds down
- [ ] `test_azure_to_band_mapping` — Verify all threshold boundaries (95→9.0, 88→8.5, etc.)
- [ ] `test_overall_band_calculation` — Verify (FC + LR + GRA + Pron) / 4 with rounding
- [ ] `test_pronunciation_weighted_score` — Verify 0.6×Acc + 0.2×Flu + 0.2×Pros formula
- [ ] `test_edge_cases` — All zeros, all 100s, exactly on threshold boundaries

### Azure Service (`azure_service.py`)
- [ ] `test_assess_pronunciation_returns_4_factors` — Accuracy, Fluency, Completeness, Prosody
- [ ] `test_phoneme_details_parsing` — Extract word-level and phoneme-level data from Azure JSON
- [ ] `test_word_error_types` — None, Mispronunciation, Omission, Insertion
- [ ] `test_mock_fallback_on_error` — Returns mock scores when Azure API fails

### LLM Service (`llm_service.py`)
- [ ] `test_prompt_construction` — Verify IELTS-specific prompt includes rubric, question, transcript
- [ ] `test_json_parsing` — Verify structured output parsing (FC, LR, GRA bands + reasoning)
- [ ] `test_invalid_llm_response` — Graceful handling of non-JSON or missing fields
- [ ] `test_score_clamping` — All band scores clamped to 0-9 range

### Audio Preprocessor (`audio_preprocessor.py`)
- [ ] `test_webm_to_wav_conversion` — Input WebM, output 16kHz Mono 16-bit WAV
- [ ] `test_sample_rate_resampling` — 44100Hz → 16000Hz
- [ ] `test_invalid_audio_format` — Graceful error for non-audio files
- [ ] `test_empty_audio` — Handle zero-length audio files

### Frontend Utilities (`utils/scoring.ts`)
- [ ] `test_color_coding_logic` — ≥80 = green, ≥60 = amber, <60 = red
- [ ] `test_ielts_rounding_frontend` — Mirror backend rounding logic
- [ ] `test_heatmap_data_generation` — Generate 5-month calendar from dates

## Integration Tests

### Full Assessment Pipeline
- [ ] `test_full_pipeline_with_sample_audio` — Upload .wav → get all 4 Azure scores + LLM analysis
- [ ] `test_parallel_execution` — Azure and LLM run concurrently (verify timing)
- [ ] `test_gatekeeper_blocks_irrelevant` — Off-topic answer returns error/warning
- [ ] `test_api_response_schema` — Response matches expected JSON structure
- [ ] `test_assessment_persistence` — Result saved to Supabase after processing

### API Endpoint Tests
- [ ] `test_POST_assess_valid_audio` — 200 response with complete result
- [ ] `test_POST_assess_missing_audio` — 400 error
- [ ] `test_POST_assess_invalid_format` — 400 error for non-audio file
- [ ] `test_GET_questions_by_part` — Returns filtered questions
- [ ] `test_GET_topics_with_counts` — Returns topics with question counts
- [ ] `test_GET_dashboard_data` — Returns streak, heatmap, band estimate
- [ ] `test_POST_test_start` — Creates test session
- [ ] `test_POST_test_complete` — Calculates overall test score

## End-to-End Tests

### User Flow: Practice Mode
- [ ] Navigate to Practice Mode → Select Part 1 → Select "Introduce yourself" topic
- [ ] Click on a question → Recording modal opens
- [ ] Grant microphone permission → Click record → See waveform animation
- [ ] Speak for 5+ seconds → Click stop → See loading state
- [ ] Feedback appears: band badge, word chips, Azure dashboard, reasoning cards
- [ ] Click a red word → Phoneme detail popup shows

### User Flow: Test Exam
- [ ] Navigate to Test Exam → Click "Part 1" → Setup modal appears
- [ ] Configure: voice=Thalia, questions=4, follow-up=on → Click "Bắt Đầu"
- [ ] Hear examiner TTS read question → Record answer → Auto-advance to next
- [ ] Complete all questions → Test report displays with overall band

### User Flow: Dashboard
- [ ] Navigate to Dashboard → See streak counter, heatmap, band estimate
- [ ] Click "Part 1 >" under Practice → Navigate to Practice Mode Part 1
- [ ] Click "Part 1 >" under Test → Navigate to Test Exam with Part 1 pre-selected

## Test Data

### Sample Audio Files
- `test_good_pronunciation.wav` — Clear English, Band 7+ level
- `test_poor_pronunciation.wav` — Heavy accent, Band 4-5 level
- `test_silence.wav` — 5 seconds of silence
- `test_short.wav` — Under 1 second speech
- `test_long.wav` — 10+ minutes of speech

### Mock API Responses
- `mock_azure_response.json` — Full Azure assessment result with word/phoneme details
- `mock_llm_response.json` — LLM analysis with FC/LR/GRA bands and reasoning
- `mock_dashboard_data.json` — Streak, heatmap, band estimate

### Seed Data
- 10+ Part 1 topics with 4-6 questions each
- 5+ Part 2 topics with cue cards
- 5+ Part 3 topics with discussion questions

## Test Reporting & Coverage

### Commands
```bash
# Backend
cd backend && source venv/bin/activate
pytest --cov=app --cov-report=html tests/

# Frontend
cd frontend
npm test -- --coverage
```

### Coverage Thresholds
- Backend: 80% overall, 100% for `scoring_service.py`
- Frontend: 70% overall, 100% for `utils/scoring.ts`

## Manual Testing

### UI/UX Checklist
- [ ] Sidebar navigation works correctly between all 3 pages
- [ ] Dashboard loads without errors with empty data (new user)
- [ ] Practice topic/question grid is scrollable and responsive
- [ ] Recording modal opens/closes cleanly
- [ ] Waveform animation is smooth during recording
- [ ] Live transcription appears in real-time
- [ ] Feedback panel scrolls through all sections
- [ ] Word chips are clickable with phoneme popups
- [ ] Test setup modal has all configuration options
- [ ] Test flow completes end-to-end

### Browser Compatibility
- [ ] Chrome (primary) — Full functionality
- [ ] Safari — MediaRecorder API support
- [ ] Firefox — WebSocket + MediaRecorder
- [ ] Edge — Full functionality

### Device Testing
- [ ] Laptop with built-in mic
- [ ] Desktop with USB microphone
- [ ] Tablet (responsive layout)

## Performance Testing

### Benchmarks
- [ ] Audio upload + full pipeline < 8 seconds (measure with timer)
- [ ] Dashboard initial render < 2 seconds
- [ ] Live transcription latency < 500ms (measure with timestamps)
- [ ] Waveform animation maintains 60fps (Chrome DevTools Performance tab)

### Load Testing
- [ ] 10 concurrent assessment requests (verify backend doesn't crash)
- [ ] Sustained recording for 10+ minutes (memory leak check)

## Bug Tracking

### Severity Levels
- **P0 (Critical):** Recording fails, assessment returns no result, data loss
- **P1 (High):** Incorrect scores, UI crash, API timeout
- **P2 (Medium):** UI glitch, slow performance, minor scoring inconsistency
- **P3 (Low):** Cosmetic issues, typos, minor UX improvements
