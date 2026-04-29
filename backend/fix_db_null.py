from sqlalchemy import text
from app.core.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_tables():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE practice_sessions ALTER COLUMN user_id NVARCHAR(255) NULL"))
            logger.info("Fixed practice_sessions.user_id")
        except Exception as e:
            logger.error(f"Error practice_sessions: {e}")
            
        try:
            conn.execute(text("ALTER TABLE test_sessions ALTER COLUMN user_id NVARCHAR(255) NULL"))
            logger.info("Fixed test_sessions.user_id")
        except Exception as e:
            logger.error(f"Error test_sessions: {e}")

        try:
            conn.execute(text("ALTER TABLE custom_questions ALTER COLUMN user_id NVARCHAR(255) NULL"))
            logger.info("Fixed custom_questions.user_id")
        except Exception as e:
            logger.error(f"Error custom_questions: {e}")
            
        conn.commit()

if __name__ == "__main__":
    fix_tables()
