#!/usr/bin/env python3
"""
LexiLearn Project Initialization Summary
========================================

This script verifies the project structure after initialization.
"""

import os
import json
from pathlib import Path

def check_structure():
    """Verify all expected files and directories exist."""
    
    base = Path('/Users/admin/Development/SpeakingSystem')
    
    required = {
        'Backend': [
            'backend/main.py',
            'backend/requirements.txt',
            'backend/.env.example',
            'backend/app/__init__.py',
            'backend/app/core/config.py',
            'backend/app/models/audio.py',
            'backend/app/models/assessment.py',
            'backend/app/services/deepgram_service.py',
            'backend/app/services/azure_service.py',
            'backend/app/services/llm_service.py',
            'backend/app/services/scoring_service.py',
            'backend/app/routes/speech_routes.py',
            'backend/app/utils/supabase_utils.py',
        ],
        'Database': [
            'supabase/README.md',
            'supabase/migrations/001_initial_schema.sql',
            'supabase/migrations/002_rls_policies.sql',
            'supabase/migrations/003_fdw_sqlserver.sql',
        ],
        'Frontend': [
            'frontend/package.json',
            'frontend/vite.config.ts',
            'frontend/tsconfig.json',
            'frontend/tailwind.config.js',
            'frontend/index.html',
            'frontend/src/main.tsx',
            'frontend/src/index.tsx',
            'frontend/src/index.css',
            'frontend/src/components/ZenMode.tsx',
            'frontend/src/components/InsightDashboard.tsx',
            'frontend/src/pages/PracticePage.tsx',
        ],
        'Documentation': [
            'README.md',
            'ARCHITECTURE.md',
            'setup.sh',
        ],
    }
    
    print("🔍 LexiLearn Project Structure Verification")
    print("=" * 50)
    
    all_good = True
    
    for category, files in required.items():
        print(f"\n📁 {category}")
        for file in files:
            path = base / file
            exists = path.exists()
            status = "✅" if exists else "❌"
            print(f"  {status} {file}")
            if not exists:
                all_good = False
    
    print("\n" + "=" * 50)
    
    if all_good:
        print("✅ All files created successfully!")
        print("\n📋 Project Statistics:")
        
        # Count files
        py_files = len(list(base.glob('backend/app/**/*.py')))
        tsx_files = len(list(base.glob('frontend/src/**/*.tsx')))
        sql_files = len(list(base.glob('supabase/migrations/**/*.sql')))
        
        print(f"  • Python files: {py_files}")
        print(f"  • TypeScript/React files: {tsx_files}")
        print(f"  • SQL migration files: {sql_files}")
        
        print("\n📚 Documentation:")
        print("  • README.md - Full setup and feature guide")
        print("  • ARCHITECTURE.md - High-level architecture overview")
        print("  • supabase/README.md - Database setup guide")
        
        print("\n🚀 Quick Start:")
        print("  chmod +x setup.sh")
        print("  ./setup.sh")
        
        print("\n📝 API Ready:")
        print("  POST /api/v1/speech/process-speech")
        print("  - Accepts audio file (webm, wav, m4a)")
        print("  - Returns IELTS band scores (0-9)")
        print("  - Includes color-coded transcript")
        
    else:
        print("❌ Some files are missing!")
        return False
    
    return all_good

if __name__ == '__main__':
    success = check_structure()
    exit(0 if success else 1)
