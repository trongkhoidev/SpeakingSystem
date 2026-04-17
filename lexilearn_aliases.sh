#!/bin/bash

###############################################################################
# 🚀 LexiLearn Shell Aliases
#
# Add to your ~/.zshrc or ~/.bash_profile:
#   source /path/to/lexilearn_aliases.sh
#
# Then use from anywhere:
#   lexilearn-start
#   lexilearn-stop
#   lexilearn-logs
#   lexilearn-status
#
###############################################################################

LEXILEARN_HOME="/Users/admin/Development/SpeakingSystem"

# Start all services
lexilearn-start() {
    echo "🚀 Starting LexiLearn..."
    cd "$LEXILEARN_HOME"
    ./start.sh
}

# Stop all services
lexilearn-stop() {
    echo "🛑 Stopping LexiLearn..."
    cd "$LEXILEARN_HOME"
    ./stop.sh
}

# View backend logs
lexilearn-logs-backend() {
    echo "📝 Backend logs (Ctrl+C to exit):"
    tail -f /tmp/lexilearn_backend.log
}

# View frontend logs
lexilearn-logs-frontend() {
    echo "📝 Frontend logs (Ctrl+C to exit):"
    tail -f /tmp/lexilearn_frontend.log
}

# View all logs
lexilearn-logs() {
    echo "📝 LexiLearn Logs"
    echo "1. Backend:  lexilearn-logs-backend"
    echo "2. Frontend: lexilearn-logs-frontend"
    echo ""
    echo "Or view last entries:"
    echo "Backend:"
    tail -10 /tmp/lexilearn_backend.log
    echo ""
    echo "Frontend:"
    tail -10 /tmp/lexilearn_frontend.log
}

# Check status
lexilearn-status() {
    echo "📊 LexiLearn Status"
    echo ""
    
    # Backend
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend: Running (http://localhost:8000)"
        echo "   API Docs: http://localhost:8000/docs"
    else
        echo "❌ Backend: Not running"
    fi
    
    # Frontend
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend: Running (http://localhost:5173)"
    else
        echo "❌ Frontend: Not running"
    fi
    
    echo ""
    echo "Process info:"
    ps aux | grep -E "(uvicorn|vite)" | grep -v grep || echo "No LexiLearn processes found"
}

# Open browser
lexilearn-open() {
    echo "🌐 Opening LexiLearn..."
    open http://localhost:5173
    echo "📚 API Docs: http://localhost:8000/docs"
}

# Setup (manual)
lexilearn-setup-manual() {
    echo "📖 Manual Setup Instructions:"
    cat "$LEXILEARN_HOME/MANUAL_SETUP.md"
}

# Help
lexilearn-help() {
    cat << 'EOF'
🎓 LexiLearn Commands

  lexilearn-start              Start all services (Backend + Frontend)
  lexilearn-stop               Stop all services
  lexilearn-status             Check service status
  lexilearn-logs               View all logs
  lexilearn-logs-backend       View backend logs (live)
  lexilearn-logs-frontend      View frontend logs (live)
  lexilearn-open               Open app in browser
  lexilearn-setup-manual       Show manual setup guide
  lexilearn-help               Show this help message

Examples:
  $ lexilearn-start
  $ lexilearn-status
  $ lexilearn-logs-backend      # Ctrl+C to exit
  $ lexilearn-stop

Tips:
  • All services run in background
  • Logs stored in /tmp/lexilearn_*.log
  • Add this file to ~/.zshrc: source $LEXILEARN_HOME/lexilearn_aliases.sh
EOF
}

# If this script is run directly (not sourced)
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    echo "ℹ️  Source this file, don't run it directly"
    echo "Add to ~/.zshrc or ~/.bash_profile:"
    echo "  source $LEXILEARN_HOME/lexilearn_aliases.sh"
    echo ""
    echo "Then use: lexilearn-help"
fi

# Make commands available
export -f lexilearn-start
export -f lexilearn-stop
export -f lexilearn-status
export -f lexilearn-logs
export -f lexilearn-logs-backend
export -f lexilearn-logs-frontend
export -f lexilearn-open
export -f lexilearn-setup-manual
export -f lexilearn-help
