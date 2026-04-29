
import os
import sys
import urllib.parse

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.core.config import settings
from sqlalchemy import create_engine, text

def check_guest():
    # Use the app's own connection URL construction
    db_url = settings.DATABASE_URL
    print(f"Connecting to: {db_url.split('@')[1]}") # Print server info only for safety
    
    engine = create_engine(db_url)
    try:
        with engine.connect() as conn:
            guest_id = 'guest-9f0c50a6-ee86-40ce-bdac-5ba2155f3539'
            result = conn.execute(text("SELECT id, email FROM users WHERE id = :id"), {"id": guest_id}).fetchone()
            if result:
                print(f"✅ Guest found: {result.id}, Email: {result.email}")
            else:
                print(f"❌ Guest NOT found: {guest_id}")
                
            # Check last 5 users
            print("\nLast 5 users:")
            users = conn.execute(text("SELECT TOP 5 id, email, created_at FROM users ORDER BY created_at DESC")).fetchall()
            for u in users:
                print(f"User: {u.id}, Email: {u.email}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_guest()
