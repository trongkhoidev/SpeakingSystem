#!/bin/bash

# LexiLearn Startup Script
# This script starts Frontend (Vite) and Backend (FastAPI)

echo "🚀 Starting LexiLearn Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check dependencies
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# Check if ports are available and kill processes if requested
clean_port() {
    local port=$1
    if port_in_use $port; then
        echo -e "${YELLOW}⚠️  Port $port is already in use. Killing existing process...${NC}"
        lsof -ti :$port | xargs kill -9 > /dev/null 2>&1
    fi
}

clean_port 8000
clean_port 5173

# Create logs directory
mkdir -p logs

# Start Backend (FastAPI)
echo -e "${BLUE}🔧 Starting Backend (FastAPI)...${NC}"
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found${NC}"
    exit 1
fi
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Install/Update Backend dependencies
echo -e "${YELLOW}📦 Checking Backend dependencies...${NC}"
if [ -d "venv/Scripts" ]; then
    venv/Scripts/pip install -q -r requirements.txt > ../logs/backend-install.log 2>&1
    venv/Scripts/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
else
    venv/bin/pip install -q -r requirements.txt > ../logs/backend-install.log 2>&1
    venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
fi
BACKEND_PID=$!
cd ..

echo -e "${GREEN}✅ Backend ready (PID: $BACKEND_PID) on port 8000${NC}"

# Start Frontend (Vite)
echo -e "${BLUE}🎨 Starting Frontend (Vite)...${NC}"
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Frontend directory not found${NC}"
    exit 1
fi
cd frontend

# Install/Update frontend dependencies
echo -e "${YELLOW}📦 Checking Frontend dependencies...${NC}"
npm install --legacy-peer-deps --no-audit --no-fund > ../logs/frontend-install.log 2>&1

# Start Vite frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✅ Frontend ready (PID: $FRONTEND_PID) on port 5173${NC}"

# Save PIDs to file for cleanup
echo "$BACKEND_PID" > .backend.pid  
echo "$FRONTEND_PID" > .frontend.pid

# Wait for services to start
sleep 3

# Check if services are running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo "Check logs: tail -f logs/backend.log"
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
    echo "Check logs: tail -f logs/frontend.log"
fi

echo ""
echo -e "${GREEN}🎉 LexiLearn is now running!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}🔧 Backend: http://localhost:8000${NC}"
echo -e "${BLUE}📚 API Docs: http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}📋 Logs are available in the logs/ directory${NC}"
echo -e "${YELLOW}🛑 To stop all services, run: ./stop.sh${NC}"
echo ""
echo -e "${GREEN}Press Ctrl+C to exit (services will continue running)${NC}"

# Monitor the processes
trap 'echo -e "\n${YELLOW}⚠️  Services are still running. Use ./stop.sh to stop them.${NC}"; exit 0' INT

# Show live logs
tail -f logs/frontend.log logs/backend.log 2>/dev/null