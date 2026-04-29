
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.core.database import SessionLocal
from backend.app.models.sqlalchemy_models import PracticeSession, CustomQuestion, User

def check_db():
    db = SessionLocal()
    try:
        print("Checking last 5 users:")
        users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
        for u in users:
            print(f"User: {u.id}, Email: {u.email}")
            
        print("\nChecking last 5 practice sessions:")
        sessions = db.query(PracticeSession).order_by(PracticeSession.started_at.desc()).limit(5).all()
        for s in sessions:
            print(f"Session: {s.id}, User: {s.user_id}, Title: {s.title}")
            
        print("\nChecking last 5 custom questions:")
        questions = db.query(CustomQuestion).order_by(CustomQuestion.created_at.desc()).limit(5).all()
        for q in questions:
            print(f"Question: {q.id}, Session: {q.session_id}, User: {q.user_id}, Text: {q.question_text[:50]}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
