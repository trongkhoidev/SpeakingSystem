
import os
import sys
import uuid
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import urllib.parse

# Load .env from backend
load_dotenv('backend/.env')

def test_insert():
    server = os.getenv('DB_SERVER')
    database = os.getenv('DB_NAME')
    username = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    driver = os.getenv('DB_DRIVER', 'ODBC Driver 18 for SQL Server')
    
    encoded_password = urllib.parse.quote_plus(password)
    params = f"driver={driver.replace(' ', '+')}"
    if "18" in driver:
        params += "&TrustServerCertificate=yes"
    
    db_url = f"mssql+pyodbc://{username}:{encoded_password}@{server}/{database}?{params}"
    
    engine = create_engine(db_url)
    try:
        with engine.connect() as conn:
            # 1. Ensure user exists
            user_id = 'test-bot-' + str(uuid.uuid4())[:8]
            conn.execute(text("INSERT INTO users (id, email, full_name, role) VALUES (:id, :email, :name, :role)"), 
                         {"id": user_id, "email": f"{user_id}@test.com", "name": "Test Bot", "role": "user"})
            print(f"Created user: {user_id}")
            
            # 2. Try insert practice_session
            session_id = str(uuid.uuid4())
            conn.execute(text("INSERT INTO practice_sessions (id, user_id, title) VALUES (:id, :uid, :title)"),
                         {"id": session_id, "uid": user_id, "title": "Test Session"})
            print(f"Created session: {session_id}")
            
            # 3. Try insert custom_question
            q_id = str(uuid.uuid4())
            conn.execute(text("INSERT INTO custom_questions (id, user_id, session_id, question_text, part) VALUES (:id, :uid, :sid, :txt, :part)"),
                         {"id": q_id, "uid": user_id, "sid": session_id, "txt": "How are you?", "part": 1})
            print(f"Created question: {q_id}")
            
            conn.commit()
            print("✅ All insertions successful")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_insert()
