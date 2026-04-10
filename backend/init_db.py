
from app.core.database import engine, Base
from app.models.sqlalchemy_models import User, Topic, Question, CustomQuestion, PracticeSession, PracticeAnswer, TestSession, TestAnswer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")

if __name__ == "__main__":
    init_db()
