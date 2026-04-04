# 🚀 LexiLearn Manual Setup Guide

## If start.sh doesn't work, use this manual approach

---

## **Step 1: Setup Backend** 

### Terminal 1 - Backend Setup
```bash
cd /Users/admin/Development/SpeakingSystem/backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Upgrade pip
python3 -m pip install --upgrade pip setuptools wheel

# Install dependencies (this may take 2-3 minutes)
python3 -m pip install -r requirements.txt

# Verify installation
python3 -c "import fastapi, uvicorn; print('✅ Backend ready')"
```

### Create .env file
```bash
cd /Users/admin/Development/SpeakingSystem/backend

# Copy template
cp .env.example .env

# Edit with your API keys
nano .env  # or vim .env
```

**Required keys in `.env`:**
```env
DEEPGRAM_API_KEY=your_deepgram_key
AZURE_SPEECH_KEY=your_azure_key
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_key
```

### Start Backend
```bash
# Still in /Users/admin/Development/SpeakingSystem/backend
# Venv still activated

python -m uvicorn main:app --reload

# You should see:
# ✓ Uvicorn running on http://127.0.0.1:8000
# ✓ Application startup complete
```

**Backend is ready!** ✅ Keep this terminal open.

---

## **Step 2: Setup Frontend**

### Terminal 2 - Frontend Setup
```bash
cd /Users/admin/Development/SpeakingSystem/frontend

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev

# You should see:
# ✓ VITE v... ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

**Frontend is ready!** ✅ Keep this terminal open.

---

## **Step 3: Access Application**

Open your browser:
- **App**: https://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## ❌ Troubleshooting

### Backend - "No module named uvicorn"
```bash
# Make sure venv is activated
source venv/bin/activate

# Reinstall
pip install uvicorn[standard] -U

# Try again
python -m uvicorn main:app --reload
```

### Backend - "Dependency conflict" 
```bash
# Clean install
deactivate
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend - npm install fails
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps --force

# Or clean and retry
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port already in use
```bash
# Backend (8000)
lsof -i :8000
kill -9 <PID>

# Frontend (5173)
lsof -i :5173
kill -9 <PID>

# Or use different ports
python -m uvicorn main:app --reload --port 8001
npm run dev -- --port 5174
```

### .env not being read
```bash
# Make sure it's in the backend directory
ls -la backend/.env

# And file has values
cat backend/.env

# Restart backend to reload
# Stop with Ctrl+C and run again
python -m uvicorn main:app --reload
```

---

## 📝 Verification Checklist

- [ ] Backend venv created: `ls backend/venv/`
- [ ] Dependencies installed: `pip list | grep fastapi`
- [ ] Backend running: `curl http://localhost:8000/health`
- [ ] API Docs accessible: `http://localhost:8000/docs`
- [ ] Frontend deps installed: `ls frontend/node_modules/`
- [ ] Frontend running: `http://localhost:5173`

---

## 🎯 Daily Workflow

### Start Everything
```bash
# Terminal 1
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload

# Terminal 2
cd frontend
npm run dev
```

### Stop Everything
```bash
# In each terminal: Ctrl+C
Ctrl+C

# Or from main folder:
pkill -f "uvicorn"
pkill -f "vite"
```

### Clean Reinstall
```bash
# Backend
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules
npm install --legacy-peer-deps
```

---

## 📚 Useful Commands

### Check Port Usage
```bash
lsof -i :8000    # Backend
lsof -i :5173    # Frontend
```

### View Logs
```bash
# Backend logs (if using start.sh)
tail -f /tmp/lexilearn_backend.log

# Frontend logs (if using start.sh)
tail -f /tmp/lexilearn_frontend.log
```

### Reinstall Single Package
```bash
cd backend
source venv/bin/activate
pip install --upgrade fastapi
```

### Test API Endpoint
```bash
curl http://localhost:8000/health

# With file upload
curl -X POST http://localhost:8000/api/v1/speech/process-speech \
  -F "audio_file=@recording.webm" \
  -F "user_id=test" \
  -F "question_id=q1" \
  -F "reference_text=Question here"
```

---

## 🎓 Backend API Documentation

After backend is running, visit:
```
http://localhost:8000/docs
```

This shows interactive API documentation where you can test all endpoints!

---

**Status**: Manual setup works for all platforms ✅
