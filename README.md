# 🎓 LexiLearn: IELTS Speaking AI Coach

> Advanced AI-powered IELTS Speaking assessment system using parallel processing, multiple AI services, and comprehensive linguistic analysis.

## 📋 Project Overview

LexiLearn is a full-stack platform for IELTS speaking practice with real-time assessment and detailed feedback. It combines:

- **Speech Recognition**: Deepgram Nova-3 for accurate transcription
- **Pronunciation Assessment**: Azure Speech Service for detailed phoneme analysis
- **Linguistic Analysis**: Gemini/GPT-4o for lexical resource and grammar evaluation
- **IELTS Scoring**: Official IELTS band formulas with weighted calculations

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                      │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │  Zen Mode    │  │ Waveform View  │  │ Insight Dashboard│ │
│  │ (Recording)  │  │  (Real-time)   │  │   (Results)      │ │
│  └────────┬─────┘  └────────────────┘  └──────────────────┘ │
│           │ MediaRecorder API                                 │
│           │ (webm/wav audio)                                  │
└───────────┼──────────────────────────────────────────────────┘
            │ POST /api/v1/speech/process-speech
┌───────────▼──────────────────────────────────────────────────┐
│              Backend (FastAPI + Python)                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  /process-speech (Async Handler)                        │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ Parallel Execution (asyncio.gather)             │   │ │
│  │  │  ├─ Deepgram Nova-3 → Transcript                │   │ │
│  │  │  └─ Azure Speech → Pronunciation Assessment     │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ LLM Analysis (Parallel)                          │   │ │
│  │  │  ├─ Lexical Resource Analysis                    │   │ │
│  │  │  └─ Grammar Analysis                             │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ IELTS Scoring                                     │   │ │
│  │  │  Score_Pron = 0.6×Acc + 0.2×Flu + 0.2×Pros      │   │ │
│  │  │  Overall = (Flu + Lex + Gram + Pron) / 4        │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│   ┌─ Supabase (PostgreSQL)                                   │
│   │  ├─ User Auth (Google OAuth)                            │
│   │  ├─ Assessment Results (with RLS)                       │
│   │  └─ Audio Metadata                                      │
│   ├─ SQL Server (via FDW)                                    │
│   │  └─ Exam Questions Archive (10GB)                       │
│   └─ Supabase Storage                                        │
│      └─ Audio Recordings                                    │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account
- API Keys: Deepgram, Azure Speech, Gemini/OpenAI

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

**Key Configurations:**
- `DEEPGRAM_API_KEY`: Get from https://console.deepgram.com
- `AZURE_SPEECH_KEY`: Get from Azure Portal
- `GEMINI_API_KEY` or `OPENAI_API_KEY`: Choose LLM provider
- `SUPABASE_URL/KEY`: Get from Supabase dashboard

```bash
# Start backend server
python -m uvicorn main:app --reload --port 8000
```

Visit: http://localhost:8000/docs (FastAPI Swagger UI)

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure Vite
npm run dev
```

Visit: http://localhost:5173

### 3. Database Setup

```bash
# Login to Supabase SQL editor
# Execute migrations in order:

-- 1. Initial schema
psql < supabase/migrations/001_initial_schema.sql

-- 2. RLS Policies
psql < supabase/migrations/002_rls_policies.sql

-- 3. FDW for SQL Server (optional)
psql < supabase/migrations/003_fdw_sqlserver.sql
```

See [supabase/README.md](supabase/README.md) for detailed database setup.

## 📁 Project Structure

```
SpeakingSystem/
├── backend/                 # Python FastAPI Backend
│   ├── main.py             # FastAPI application entry point
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   └── app/
│       ├── core/           # Configuration and settings
│       │   ├── config.py    # Settings from environment
│       │   └── __init__.py
│       ├── models/         # Pydantic data models
│       │   ├── audio.py     # Audio processing models
│       │   ├── assessment.py # IELTS assessment models
│       │   └── __init__.py
│       ├── services/       # External service integrations
│       │   ├── deepgram_service.py    # Deepgram STT
│       │   ├── azure_service.py       # Azure Pronunciation
│       │   ├── llm_service.py         # LLM Analysis
│       │   ├── scoring_service.py     # IELTS Scoring
│       │   └── __init__.py
│       ├── routes/         # API endpoints
│       │   ├── speech_routes.py # /process-speech endpoint
│       │   └── __init__.py
│       └── utils/          # Utilities
│           ├── supabase_utils.py # Database operations
│           └── __init__.py
│
├── frontend/                # React 19 + Vite Frontend
│   ├── package.json        # Node dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript config
│   └── src/
│       ├── main.tsx        # React app entry
│       ├── components/     # React components
│       │   ├── ZenMode.tsx             # Minimalist recording UI
│       │   ├── InsightDashboard.tsx    # Results display
│       │   └── index.ts
│       └── pages/
│           ├── PracticePage.tsx        # Main practice page
│           └── index.ts
│
├── supabase/                # Database Configuration
│   ├── README.md            # Database setup guide
│   └── migrations/
│       ├── 001_initial_schema.sql    # Tables and indexes
│       ├── 002_rls_policies.sql      # Row Level Security
│       └── 003_fdw_sqlserver.sql     # SQL Server FDW
│
└── tech.md                  # Technical specifications
```

## 🔄 API Documentation

### POST /api/v1/speech/process-speech

Process audio and generate IELTS assessment.

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/speech/process-speech \
  -F "audio_file=@recording.webm" \
  -F "user_id=user_123" \
  -F "question_id=question_456" \
  -F "reference_text=Question text here"
```

**Response:**
```json
{
  "user_id": "user_123",
  "question_id": "question_456",
  "overall_band": 7.0,
  "band_scores": {
    "fluency_coherence": 7.0,
    "lexical_resource": 6.5,
    "grammatical_accuracy": 7.5,
    "pronunciation": 7.0
  },
  "deepgram_transcript": "Full transcribed text...",
  "color_coded_transcript": [
    {"word": "excellent", "color": "green"},
    {"word": "speeking", "color": "red", "phonetic_error": true}
  ],
  "lexical_analysis": {
    "score": 6.5,
    "feedback": "Good vocabulary range...",
    "word_list": ["excellent", "fascinating"],
    "variety_level": "Good"
  },
  "grammar_analysis": {
    "score": 7.5,
    "feedback": "Generally accurate grammar...",
    "error_count": 1,
    "error_types": ["Subject-Verb Agreement"],
    "complexity_level": "Advanced"
  }
}
```

## 🎯 Key Features

### 1. **Parallel Audio Processing**
- Deepgram and Azure run simultaneously using `asyncio.gather()`
- ~3-5 second total processing time for both services
- Efficient use of API quotas

### 2. **IELTS Scoring Formula**
```
Pronunciation = 0.6 × Accuracy + 0.2 × Fluency + 0.2 × Prosody

Overall = (Fluency + Lexical + Grammar + Pronunciation) / 4

Rounding: 0.75+ rounds up, 0.25-0.75 rounds to .5
```

### 3. **Row Level Security (RLS)**
- Users can only view their own assessments
- Audio files protected at storage level
- Google OAuth for secure authentication

### 4. **SQL Server Integration via FDW**
- Query 10GB exam question archive from Supabase
- Materialized views for performance optimization
- Foreign tables seamlessly integrated with PostgreSQL

### 5. **UI/UX Features**
- **Zen Mode**: Minimalist recording interface
- **Waveform Visualization**: Real-time audio feedback
- **Color-Coded Transcript**: Visual error identification
- **Radar Chart**: 4-criteria IELTS comparison

## 🔧 Configuration

### Environment Variables

```dotenv
# Deepgram Config
DEEPGRAM_API_KEY=your_key
DEEPGRAM_MODEL=nova-3  # Latest model (0.0235 $/minute)

# Azure Speech
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=eastasia

# LLM (Choose one)
LLM_PROVIDER=gemini  # or openai
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_secret
```

### Cost Estimation (Monthly)

| Service | Free Tier | Usage/Month | Cost |
|---------|-----------|-------------|------|
| Deepgram | 200$ credit | 500 min audio | $0-5 |
| Azure Speech | F0 tier | 5 hours/month | $0 |
| Gemini | 60 req/min | 1000 requests | $0-15 |
| Supabase | 500MB | 1GB storage | ~$5 |
| **Total** | | | **$0-25** |

## 📊 Database Schema

### Core Tables
- **user_profiles**: Extended user data with quotas
- **questions**: IELTS speaking questions (public read)
- **assessments**: Assessment results (RLS protected)
- **audio_recordings**: Audio metadata and storage references

### Foreign Tables (FDW)
- **exam_questions_history**: SQL Server 10GB archive

See [supabase/migrations](supabase/migrations) for SQL details.

## 🛠️ Development Workflow

### Running Locally

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Check logs
# Monitor FastAPI logs at http://localhost:8000/docs
```

### Testing API Endpoints

```bash
# Test health check
curl http://localhost:8000/health

# Test with sample audio
curl -X POST http://localhost:8000/api/v1/speech/process-speech \
  -F "audio_file=@sample.webm" \
  -F "user_id=test_user" \
  -F "question_id=test_question" \
  -F "reference_text=Sample question"
```

### Type Checking

```bash
cd backend
mypy app/  # Python type checking

cd frontend
npm run type-check  # TypeScript checking
```

## 🚨 Error Handling

### Common Issues

**1. Deepgram Connection Error**
- ✅ Check `DEEPGRAM_API_KEY` is set correctly
- ✅ Verify account has available credits
- ✅ Check network connectivity

**2. Azure Speech Timeout**
- ✅ Ensure audio file format is supported (WAV recommended)
- ✅ Check `AZURE_SPEECH_KEY` and region
- ✅ Audio may be too short (minimum ~1 second)

**3. Supabase Auth Issues**
- ✅ Verify `SUPABASE_JWT_SECRET` matches backend
- ✅ Check CORS settings in Supabase dashboard
- ✅ Ensure Google OAuth is configured

**4. Audio Processing Timeout**
- ✅ Check audio file size (max 10MB recommended)
- ✅ Try shorter audio clips
- ✅ Increase `aiohttp.ClientTimeout`

## 📚 Next Steps (Expansion)

After completing the boilerplate, implement:

1. **Authentication & User Management**
   - Google OAuth flow in frontend
   - JWT token refresh logic
   - User profile dashboard

2. **Advanced Recording Features**
   - Audio trimming/editing
   - Microphone quality check
   - Recording history management

3. **Performance Optimization**
   - Caching frequent questions
   - Audio compression before upload
   - Result caching in browser

4. **Admin Dashboard**
   - Question management interface
   - Usage analytics
   - User statistics

5. **Mobile Support**
   - React Native port or PWA
   - Offline recording capability
   - Native audio processing

## 📖 References

- [Deepgram Nova-3 Docs](https://developers.deepgram.com/)
- [Azure Speech Service Docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
- [IELTS Official Scoring](https://www.ielts.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React 19 Docs](https://react.dev/)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open Pull Request

## 💬 Support

For issues and questions:
- GitHub Issues: [Create issue](https://github.com/your-repo/issues)
- Documentation: [Wiki](https://github.com/your-repo/wiki)
- Email: support@lexilearn.com

---

**Built with ❤️ for IELTS learners worldwide**
