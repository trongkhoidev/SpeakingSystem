---
phase: implementation
title: IELTS Speaking Practice System - Implementation Guide
description: Technical patterns, Azure SQL + Blob integration, Google OAuth, code guidelines
status: approved
last_updated: 2026-04-03
---

# Implementation Guide

## Development Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ with virtual environment
- Azure SQL Database (connection string)
- Azure Blob Storage (connection string)
- Azure Speech Service API key (F0 free tier)
- Deepgram API key (free $200 credit)
- Gemini API key
- Google OAuth Client ID + Secret

### Environment Setup
```bash
# Frontend
cd frontend && npm install
npm run dev  # http://localhost:5173

# Backend
cd backend && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in all keys
python -m uvicorn main:app --reload  # http://localhost:8000
```

### Required .env Variables
```env
# FastAPI Config
DEBUG=False
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:5173

# Azure SQL Database
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=SpeakingSystem
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=your_password
AZURE_SQL_DRIVER=ODBC Driver 18 for SQL Server

# Azure Blob Storage
AZURE_BLOB_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_BLOB_CONTAINER=audio-recordings

# Azure Speech
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=southeastasia

# Deepgram
DEEPGRAM_API_KEY=your_key
DEEPGRAM_MODEL=nova-3

# Gemini LLM
GEMINI_API_KEY=your_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# JWT
JWT_SECRET_KEY=your_random_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# CORS
CORS_ORIGINS=["http://localhost:5173"]
```

## Code Structure

```
SpeakingSystem/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, AppLayout
│   │   │   ├── shared/        # BandBadge, Button, Card, Modal
│   │   │   ├── auth/          # GoogleSignIn, AuthProvider
│   │   │   ├── dashboard/     # StreakCounter, Heatmap, etc.
│   │   │   ├── practice/      # TopicSidebar, QuestionGrid, AddQuestion
│   │   │   ├── recording/     # AudioRecorder, Waveform, LiveTranscript
│   │   │   ├── feedback/      # WordChips, PhonemeDetail, ReasoningCard
│   │   │   └── test/          # TestSetup, TestRunner, CueCard, TestReport
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── PracticeModePage.jsx
│   │   │   ├── TestExamPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── hooks/             # useAuth, useAudioRecorder, useDeepgram
│   │   ├── services/          # api.js, auth.js
│   │   ├── context/           # AuthContext.jsx
│   │   ├── utils/             # scoring.js, audio.js
│   │   ├── main.jsx           # App entry with Router
│   │   └── index.css          # Design system tokens
│   └── ...
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py        # /api/v1/auth/*
│   │   │   ├── speech.py      # /api/v1/speech/*
│   │   │   ├── questions.py   # /api/v1/questions/* + /api/v1/topics/*
│   │   │   ├── test.py        # /api/v1/test/*
│   │   │   └── user.py        # /api/v1/user/*
│   │   ├── services/
│   │   │   ├── azure_service.py      # Pronunciation assessment
│   │   │   ├── deepgram_service.py   # STT transcription
│   │   │   ├── llm_service.py        # Gemini analysis + explain-more
│   │   │   ├── scoring_service.py    # Band calculation
│   │   │   ├── blob_service.py       # Azure Blob upload/download
│   │   │   ├── audio_preprocessor.py # WAV resampling
│   │   │   └── database.py           # SQLAlchemy engine + sessions
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── question.py
│   │   │   ├── practice.py
│   │   │   ├── test.py
│   │   │   └── base.py        # SQLAlchemy Base
│   │   ├── core/
│   │   │   ├── config.py      # Settings (env vars)
│   │   │   ├── auth.py        # JWT + OAuth utils
│   │   │   └── deps.py        # get_current_user dependency
│   │   └── utils/
│   └── main.py
├── docs/
│   └── ai/
│       ├── requirements/
│       ├── design/
│       ├── planning/
│       ├── implementation/
│       └── testing/
└── scripts/
    └── seed_questions.py      # Question bank seeder
```

## Core Implementation Patterns

### 1. Azure SQL via SQLAlchemy

```python
# backend/app/services/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Azure SQL connection string
connection_string = (
    f"mssql+pyodbc://{settings.AZURE_SQL_USER}:{settings.AZURE_SQL_PASSWORD}"
    f"@{settings.AZURE_SQL_SERVER}/{settings.AZURE_SQL_DATABASE}"
    f"?driver={settings.AZURE_SQL_DRIVER}&Encrypt=yes&TrustServerCertificate=no"
)

engine = create_engine(connection_string, pool_size=5, pool_recycle=3600)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    """FastAPI dependency for DB sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 2. SQLAlchemy Models

```python
# backend/app/models/user.py
from sqlalchemy import Column, String, Integer, Date, DateTime, func
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER, NVARCHAR
from app.services.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    email = Column(NVARCHAR(100), unique=True, nullable=False)
    full_name = Column(NVARCHAR(200))
    google_id = Column(NVARCHAR(500), unique=True)
    avatar_url = Column(NVARCHAR(500))
    day_streak = Column(Integer, default=0)
    last_practice_date = Column(Date)
    estimated_band = Column(Numeric(3, 1), default=0.0)
    streak_calendar = Column(NVARCHAR(None))  # JSON as text
    created_at = Column(DateTime, server_default=func.now())
```

### 3. Google OAuth Flow

```python
# backend/app/core/auth.py
from authlib.integrations.starlette_client import OAuth
from jose import jwt
from datetime import datetime, timedelta

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

def create_jwt_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
```

### 4. Azure Blob Storage

```python
# backend/app/services/blob_service.py
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta

class BlobService:
    def __init__(self):
        self.client = BlobServiceClient.from_connection_string(
            settings.AZURE_BLOB_CONNECTION_STRING
        )
        self.container = settings.AZURE_BLOB_CONTAINER

    async def upload_audio(self, user_id: str, answer_id: str, audio_bytes: bytes) -> str:
        blob_name = f"audio/{user_id}/{answer_id}.wav"
        blob_client = self.client.get_blob_client(self.container, blob_name)
        blob_client.upload_blob(audio_bytes, overwrite=True)
        return blob_name

    def get_signed_url(self, blob_name: str, expiry_hours: int = 1) -> str:
        sas_token = generate_blob_sas(
            account_name=self.client.account_name,
            container_name=self.container,
            blob_name=blob_name,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=expiry_hours),
        )
        return f"{self.client.url}{self.container}/{blob_name}?{sas_token}"
```

### 5. Azure Pronunciation Assessment

```python
# backend/app/services/azure_service.py
import azure.cognitiveservices.speech as speechsdk

class AzureService:
    def __init__(self):
        self.speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION,
        )

    async def assess_pronunciation(self, audio_path: str, reference_text: str) -> dict:
        audio_config = speechsdk.AudioConfig(filename=audio_path)

        pronunciation_config = speechsdk.PronunciationAssessmentConfig(
            reference_text=reference_text,
            grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
            granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
            enable_miscue=True,
        )
        pronunciation_config.enable_prosody_assessment()

        recognizer = speechsdk.SpeechRecognizer(
            speech_config=self.speech_config,
            audio_config=audio_config,
        )
        pronunciation_config.apply_to(recognizer)

        result = recognizer.recognize_once()
        pronunciation_result = speechsdk.PronunciationAssessmentResult(result)

        return {
            "accuracy_score": pronunciation_result.accuracy_score,
            "fluency_score": pronunciation_result.fluency_score,
            "completeness_score": pronunciation_result.completeness_score,
            "prosody_score": pronunciation_result.prosody_score,
            "pronunciation_score": pronunciation_result.pronunciation_score,
            "words": self._parse_words(result),
        }
```

### 6. IELTS Band Scoring

```python
# backend/app/services/scoring_service.py

def map_azure_to_band(azure_score: float) -> float:
    """Non-linear mapping from Azure 0-100 to IELTS 0-9."""
    thresholds = [
        (95, 9.0), (88, 8.5), (82, 8.0), (76, 7.5),
        (70, 7.0), (63, 6.5), (55, 6.0), (47, 5.5),
        (38, 5.0), (28, 4.5), (18, 4.0), (0, 3.0),
    ]
    for threshold, band in thresholds:
        if azure_score >= threshold:
            return band
    return 3.0

def round_ielts(score: float) -> float:
    """Apply official IELTS rounding: ≥0.75→up, 0.25-0.74→.5, <0.25→down."""
    remainder = score % 1
    if remainder >= 0.75:
        return float(int(score) + 1)
    elif remainder >= 0.25:
        return float(int(score)) + 0.5
    else:
        return float(int(score))

def calculate_pronunciation_band(accuracy: float, fluency: float, prosody: float) -> float:
    weighted = 0.6 * accuracy + 0.2 * fluency + 0.2 * prosody
    return map_azure_to_band(weighted)

def calculate_overall_band(fc: float, lr: float, gra: float, pron: float) -> float:
    return round_ielts((fc + lr + gra + pron) / 4)
```

### 7. Word Color Classification

```python
# Used in response building
def classify_word_color(accuracy_score: float) -> str:
    if accuracy_score >= 80:
        return "green"
    elif accuracy_score >= 60:
        return "amber"
    else:
        return "red"
```

### 8. Parallel AI Execution

```python
# In speech route handler
import asyncio

async def process_assessment(audio_path, question_text, transcript):
    # Run Azure + LLM in parallel
    azure_task = azure_service.assess_pronunciation(audio_path, transcript)
    llm_task = llm_service.analyze_language(question_text, transcript)

    azure_result, llm_result = await asyncio.gather(azure_task, llm_task)

    # Calculate scores
    pron_band = scoring_service.calculate_pronunciation_band(
        azure_result["accuracy_score"],
        azure_result["fluency_score"],
        azure_result["prosody_score"],
    )
    overall = scoring_service.calculate_overall_band(
        llm_result["fluency_coherence"]["band"],
        llm_result["lexical_resource"]["band"],
        llm_result["grammatical_accuracy"]["band"],
        pron_band,
    )
    return { "overall_band": overall, "azure": azure_result, ... }
```

## Security Checklist
- [ ] Azure API keys in `.env` only (never committed, in `.gitignore`)
- [ ] Google OAuth client secret server-side only
- [ ] JWT tokens with 24h expiry
- [ ] All API endpoints except `/auth/google` and `/health` require JWT
- [ ] User data isolation: all queries filter by `user_id` from JWT
- [ ] Azure Blob signed URLs with 1-hour expiry
- [ ] CORS restricted to `FRONTEND_URL` only
- [ ] Input validation via Pydantic models on all endpoints
