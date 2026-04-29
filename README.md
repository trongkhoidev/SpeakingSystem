# 🎓 SpeakingSystem: Advanced IELTS Speaking AI Coach

> A premium, AI-powered IELTS Speaking assessment and practice platform. Get real-time feedback, detailed band scores, and professional analytics for your IELTS preparation.

## 🌟 Key Features

### 🎙️ Interactive Practice & Mock Exams
- **Mock Exam Mode**: Full IELTS Speaking test simulation (Part 1, 2, and 3).
- **Practice Mode**: Focused practice on specific topics and questions.
- **Real-time Feedback**: Instant transcription and pronunciation assessment.
- **Diamond/Token System**: Manage your practice sessions with a professional credit system.

### 📊 Comprehensive Assessment
- **Linguistic Analysis**: Detailed evaluation of Lexical Resource and Grammatical Range & Accuracy using state-of-the-art LLMs (Gemini, DeepSeek, GPT-4o).
- **Pronunciation Scoring**: High-precision phoneme-level analysis via Azure Speech Service.
- **IELTS Band Scoring**: Accurate overall and sub-criteria scores based on official IELTS formulas.
- **Color-Coded Transcripts**: Visual identification of pronunciation errors and vocabulary improvements.

### 🛡️ Admin & Management
- **Admin Control Center**: Comprehensive dashboard for system overview.
- **User Management**: Track user progress, status, and activity.
- **Token Allocation**: Granular control over user credits and billing.
- **Plan Management**: Configurable subscription tiers and billing details.

## 🛠️ Technology Stack

### Backend
- **Core**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL / Supabase
- **Authentication**: JWT & Google OAuth
- **Speech-to-Text**: Deepgram Nova-3 (State-of-the-art accuracy)
- **Pronunciation**: Azure AI Speech Service
- **Linguistic AI**: Gemini 1.5 Pro / DeepSeek-V3 / GPT-4o

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS + Framer Motion (for smooth animations)
- **State Management**: React Context / Hooks
- **Visualizations**: Recharts (for performance and progress tracking)
- **UI Components**: Lucide Icons + Radix UI

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL or Supabase project

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure your API keys in .env
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure VITE_API_URL in .env
npm run dev
```

## 📂 Project Structure

```
SpeakingSystem/
├── backend/                # FastAPI application
│   ├── app/                # Core logic, routes, and services
│   ├── main.py             # Entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── pages/          # Main application pages
│   │   └── services/       # API integration
│   └── package.json        # Node dependencies
└── docs/                   # Project documentation
```

## ⚙️ Configuration

Key environment variables required:
- `DEEPGRAM_API_KEY`: For fast and accurate transcription.
- `AZURE_SPEECH_KEY`: For pronunciation assessment.
- `LLM_PROVIDER`: Choose between `gemini`, `deepseek`, or `openai`.
- `SUPABASE_URL` / `SUPABASE_KEY`: For data persistence.

## 📝 License

This project is licensed under the MIT License.

---

**Developed with focus on providing the most accurate and helpful feedback for IELTS candidates.**
