#!/bin/bash

###############################################################################
# 🛑 LexiLearn Stop Script
# 
# Stop all LexiLearn services
# Usage: ./stop.sh
#
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🛑 Stopping LexiLearn services...${NC}\n"

# Stop Backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ Backend stopped (PID: $BACKEND_PID)${NC}"
    fi
    rm -f .backend.pid
else
    # Try to find and kill uvicorn process
    pkill -f "uvicorn.*main:app" 2>/dev/null && echo -e "${GREEN}✓ Backend process killed${NC}" || true
fi

# Stop Frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ Frontend stopped (PID: $FRONTEND_PID)${NC}"
    fi
    rm -f .frontend.pid
else
    # Try to find and kill npm dev process
    pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✓ Frontend process killed${NC}" || true
fi

echo -e "${GREEN}\n✓ All LexiLearn services stopped${NC}"
echo -e "${YELLOW}Note: Check logs/ directory if services don't respond${NC}"
