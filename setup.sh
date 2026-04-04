#!/bin/bash

# LexiLearn Quick Setup Script

echo "🎓 LexiLearn Setup Script"
echo "========================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi
echo "✅ Python 3 found: $(python3 --version)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend || exit 1
python3 -m venv venv
source venv/bin/activate
# Upgrade pip first
python3 -m pip install --upgrade pip setuptools -q
# Install requirements with flexible versions
python3 -m pip install -q -r requirements.txt
echo "✅ Backend dependencies installed"
cp .env.example .env
echo "⚠️  Please edit backend/.env with your API keys"
deactivate

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend || exit 1
npm install --legacy-peer-deps -q
echo "✅ Frontend dependencies installed"

cd ..

# Setup guide
echo ""
echo "🚀 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys:"
echo "   - DEEPGRAM_API_KEY"
echo "   - AZURE_SPEECH_KEY"
echo "   - GEMINI_API_KEY (or OPENAI_API_KEY)"
echo "   - SUPABASE_URL and SUPABASE_KEY"
echo ""
echo "2. Run the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python -m uvicorn main:app --reload"
echo ""
echo "3. Run the frontend (new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Setup database (in Supabase SQL editor):"
echo "   Execute migrations from supabase/migrations/ in order"
echo ""
echo "Visit http://localhost:5173 to start!"
