"""Database configuration for Azure SQL via SQLAlchemy 2.0 + pyodbc."""

# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings

# For Azure SQL + pyodbc
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# pool_pre_ping=True for Azure SQL connections which can drop
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True, 
    pool_size=20, 
    max_overflow=30,
    pool_recycle=300, # Recycle connections every 5 minutes to avoid Azure timeout
    pool_timeout=30   # Wait up to 30 seconds for a connection from the pool
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 declarative base."""
    pass


def get_db():
    """FastAPI dependency for database session with transient error retry."""
    import time
    from sqlalchemy.exc import OperationalError
    
    db = None
    max_retries = 3
    retry_delay = 1 # second
    
    for attempt in range(max_retries):
        try:
            db = SessionLocal()
            # Test connection
            db.execute(text("SELECT 1"))
            break
        except (OperationalError, Exception) as e:
            if db:
                db.close()
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            raise e

    try:
        yield db
    finally:
        if db:
            db.close()
