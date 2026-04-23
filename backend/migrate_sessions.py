from sqlalchemy import text
from app.core.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    with engine.connect() as conn:
        logger.info("Starting migration for Practice Sessions...")
        
        # Add title to practice_sessions
        try:
            conn.execute(text("ALTER TABLE practice_sessions ADD title NVARCHAR(200) NULL"))
            conn.commit()
            logger.info("✅ Added 'title' column to 'practice_sessions'")
        except Exception as e:
            if "already exists" in str(e).lower() or "Duplicate column name" in str(e):
                logger.info("ℹ️ 'title' column already exists in 'practice_sessions'")
            else:
                logger.warning(f"⚠️ Could not add 'title' column: {e}")

        # Add session_id to custom_questions
        try:
            conn.execute(text("ALTER TABLE custom_questions ADD session_id VARCHAR(36) NULL"))
            # Add foreign key constraint
            conn.execute(text("""
                ALTER TABLE custom_questions 
                ADD CONSTRAINT FK_CustomQuestion_Session 
                FOREIGN KEY (session_id) REFERENCES practice_sessions(id)
                ON DELETE CASCADE
            """))
            conn.commit()
            logger.info("✅ Added 'session_id' column and FK to 'custom_questions'")
        except Exception as e:
            if "already exists" in str(e).lower() or "Duplicate column name" in str(e):
                logger.info("ℹ️ 'session_id' column already exists in 'custom_questions'")
            else:
                logger.warning(f"⚠️ Could not add 'session_id' column: {e}")

        logger.info("Migration completed.")

if __name__ == "__main__":
    migrate()
