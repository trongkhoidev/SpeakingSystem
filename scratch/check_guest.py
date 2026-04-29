
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.core.database import SessionLocal
from backend.app.models.sqlalchemy_models import User

def check_guest():
    db = SessionLocal()
    try:
        guest_id = 'guest-9f0c50a6-ee86-40ce-bdac-5ba2155f3539'
        user = db.query(User).filter(User.id == guest_id).first()
        if user:
            print(f"✅ Guest found: {user.id}, Email: {user.email}")
        else:
            print(f"❌ Guest NOT found: {guest_id}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_guest()
