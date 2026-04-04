---
phase: requirements
title: IELTS Speaking Practice System - Requirements
description: Full-featured IELTS Speaking practice web app with Azure Pronunciation Assessment, 3-page UI, and voice analysis
status: approved
last_updated: 2026-04-03
---

# Requirements & Problem Understanding

## Problem Statement
**What problem are we solving?**

- IELTS Speaking test candidates lack access to affordable, instant, and accurate pronunciation + language feedback outside of human tutors.
- Current solutions either provide shallow AI feedback (no phoneme-level analysis) or are prohibitively expensive for self-study learners.
- There is no integrated platform that combines **Azure Speech Pronunciation Assessment** (4 factors: Accuracy, Fluency, Completeness, Prosody) with **LLM-based linguistic analysis** (Lexical, Grammar, Coherence) in a single, premium UI.

**Who is affected?**
- Vietnamese IELTS candidates (primary market) preparing for Band 5.0–8.0
- Self-study learners without access to speaking tutors

**Current workaround:**
- Learners record themselves and self-evaluate (no objective feedback)
- Apps like luyennoi.com provide basic scoring but lack deep Azure pronunciation analysis
- Expensive 1-on-1 tutoring sessions

## Goals & Objectives

### Primary Goals
1. **Build a 3-page web application** (Dashboard, Practice Mode, Test Exam) modeled after the luyennoi.com UI reference screenshots
2. **Integrate Azure Speech Pronunciation Assessment** as the core pronunciation engine with 4 factors: **Accuracy, Fluency, Completeness, Prosody**
3. **Combine pronunciation scores with LLM linguistic analysis** to produce IELTS-aligned Band scores (1.0–9.0) across 4 criteria: Fluency & Coherence (FC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA), Pronunciation
4. **Provide word-level and phoneme-level feedback** with color-coded transcripts and clickable error details
5. **Support IELTS Parts 1, 2, 3** with topic-based Forecast question bank navigation
6. **Allow users to add custom questions** ("Câu Bạn thêm") for flexible self-study
7. **Store audio recordings** in Azure Blob Storage for replay from practice history

### Secondary Goals
- Real-time live transcription during recording (Deepgram Nova-3)
- Audio playback for self-review (from history and immediately after recording)
- Practice history with streak tracking and contribution heatmap
- TTS (Text-to-Speech) for examiner voice simulation
- Model answers for each question
- Simplified "Explain more" AI follow-up per reasoning card

### Non-Goals (Out of Scope for V1)
- Mobile native apps (iOS/Android)
- Multi-language support beyond English
- AI Avatar examiner (future feature)
- Payment/subscription system
- Social features (leaderboards, sharing)
- Offline mode
- Teacher features (assign homework, track students) — deferred to V2
- Reading (Scripted) practice mode — deferred to V2
- Gaming (Tongue Twisters) practice mode — deferred to V2
- Full AI Mentor Chat — simplified to "Explain more" button in V1

## User Stories & Use Cases

### Dashboard Page
- As a learner, I want to see my **day streak** and daily mission progress so I stay motivated
- As a learner, I want to see a **GitHub-style contribution heatmap** tracking my practice days
- As a learner, I want to see my **current estimated Band** with tips for improvement
- As a learner, I want quick access to **Practice Mode** (Part 1/2/3) and **Test Exam** features
- As a learner, I want to see **Forecast progress** (how many questions answered per Part out of total)

### Practice Mode Page
- As a learner, I want to **browse topics** (Introduce yourself, Daily Routine, Views, etc.) organized by IELTS Part via a sidebar
- As a learner, I want to select a topic and see all its **questions laid out in a 2-column grid**
- As a learner, I want to **add my own custom questions** ("Câu Bạn thêm") for personal practice
- As a learner, I want to **record my answer** to a question with a visible mic button and pulse animation
- As a learner, I want to see **live transcription** text appearing as I speak (gray=interim, black=final)
- As a learner, I want to receive **detailed pronunciation feedback** after recording:
  - Word-level color coding: **Green** (accuracy ≥80), **Amber** (accuracy ≥60), **Red** (accuracy <60)
  - Clickable words showing phoneme-level error details (IPA, expected vs actual, error type)
  - Error types: `None`, `Mispronunciation`, `Omission`, `Insertion`
  - Azure 4-factor dashboard: Accuracy, Fluency, Completeness, Prosody (0-100 each)
- As a learner, I want to see **Band scores** for FC, LR, GRA, and Pronunciation with AI reasoning in Vietnamese
- As a learner, I want to click **"Explain more"** on any reasoning card to get a deeper AI explanation
- As a learner, I want to see a **model answer** (Band 8.5+) for comparison
- As a learner, I want to **replay my recorded audio** from practice history
- As a learner, I want to view my **practice history** with past scores and the ability to re-practice

### Test Exam Page
- As a learner, I want to simulate a **full IELTS Speaking test** (Part 1 + Part 2 + Part 3) with timed conditions
- As a learner, I want to choose the **examiner voice** (e.g., Thalia Female-American)
- As a learner, I want to set the **number of questions** and enable/disable follow-up questions
- As a learner, I want **Part 2 to follow IELTS format**: cue card display (topic + bullet points) → 1-minute preparation timer → 1-2 minute speaking timer
- As a learner, I want to receive a **comprehensive test report** with overall Band score after completing the test
- As a learner, I want test questions to be randomly selected from the Forecast question bank

### Edge Cases
- User records silence (no speech detected) → show "No speech detected" error, don't charge API
- User records < 1 second → show "Recording too short" validation error
- User records > 10 minutes → show "Recording too long" validation error
- Azure API timeout → return mock/fallback scores with warning message
- Deepgram WebSocket disconnects → gracefully stop live transcript, recording continues
- Mic permission denied → show permission guide with browser-specific instructions
- Network offline → show offline banner, disable recording button

## Success Criteria

### Functional
- [ ] Dashboard displays streak, heatmap, Band estimate, and Forecast progress
- [ ] Practice Mode allows topic browsing, question selection, recording, and feedback
- [ ] Custom questions can be added and practiced
- [ ] Test Exam simulates timed IELTS conditions with Part 2 cue card + prep timer
- [ ] Azure Speech returns Accuracy, Fluency, Completeness, Prosody scores per answer
- [ ] LLM returns FC, LR, GRA scores with Vietnamese-language reasoning
- [ ] Word-level color-coded transcript (Green ≥80 / Amber ≥60 / Red <60) with clickable phoneme details
- [ ] Band score calculation uses official IELTS rounding rules
- [ ] "Explain more" button generates deeper AI analysis per criterion
- [ ] Audio replay available from practice history

### Performance
- [ ] Audio processing completes within 8 seconds of recording stop
- [ ] Live transcription latency < 500ms
- [ ] UI renders smoothly at 60fps during waveform animation
- [ ] Frontend bundle < 500KB gzipped

### Quality
- [ ] Scores correlate within ±0.5 band of human examiner ratings
- [ ] System handles audio from standard laptop/phone microphones
- [ ] Graceful degradation if Azure/Deepgram APIs are unavailable

## Constraints & Assumptions

### Technical Constraints
- **Database:** Azure SQL Database (SQL Server) — primary data store
- **ORM:** SQLAlchemy 2.0 with `pyodbc` driver for Azure SQL
- **Auth:** Google OAuth via FastAPI middleware, JWT tokens for session management
- **File Storage:** Azure Blob Storage for `.wav` audio recordings
- **Azure Speech F0 tier:** 5 hours free/month — must batch-process, not stream continuously
- **Deepgram:** $200 free credit — use for live transcription only, not scoring
- **LLM:** Gemini 2.0 Flash (configured in `.env` with `GEMINI_API_KEY`)
- Audio must be resampled to **16kHz, Mono, 16-bit PCM WAV** for Azure
- Frontend must work on Chrome, Safari, Firefox (MediaRecorder API support)

### Business Constraints
- Must minimize API costs by sending audio only when recording is complete
- Target audience is Vietnamese — all AI feedback in Vietnamese, IELTS questions in English
- Must support single-developer deployment and maintenance
- UI labels and navigation in Vietnamese; IELTS content and model answers in English

### Assumptions
- Users have a working microphone (laptop or external)
- Users have stable internet connection for API calls
- IELTS question bank will be pre-seeded in the database (~150 questions)
- Azure SQL Database instance is provisioned and accessible
- Azure Blob Storage container is configured for audio uploads

### Scoring Formula (Confirmed)
```
Word Color: Green (accuracy ≥80), Amber (accuracy ≥60), Red (accuracy <60)

Pronunciation Band = map_to_ielts(0.6 × Accuracy + 0.2 × Fluency + 0.2 × Prosody)
Overall Band = round_ielts((FC + LR + GRA + Pronunciation) / 4)

IELTS Rounding: ≥0.75 → round up, 0.25-0.74 → .5, <0.25 → round down
```

## Resolved Questions

| # | Question | Decision |
|---|----------|----------|
| Q1 | Live transcription engine | **Deepgram Nova-3** |
| Q2 | LLM provider | **Gemini 2.0 Flash** (already in .env) |
| Q3 | Gatekeeper in V1 | **Deferred** — not critical for V1 |
| Q4 | Question bank size | **~150 questions** (Standard: 12 Part 1, 8 Part 2, 8 Part 3) |
| Q5 | Authentication | **Google OAuth** via FastAPI |
| Q6 | Practice modes | **Speaking (Unscripted) only** for V1 |
| Q7 | Part 2 timing | **Flexible in Practice, Strict in Test Exam** |
| Q8 | Custom questions | **Included** — users can add their own questions |
| Q9 | AI Mentor Chat | **Simplified** — "Explain more" button per reasoning card |
| Q10 | Teacher features | **Removed** from V1 |
| Q11 | Database | **Azure SQL Database** (SQL Server) |
| Q12 | Audio storage | **Azure Blob Storage** |
