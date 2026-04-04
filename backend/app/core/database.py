from sqlalchemy import create_all, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# For Azure SQL + pyodbc
# Use mssql+pyodbc and proper connection string
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# pool_pre_ping=True for Azure SQL connections which can drop
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True, 
    pool_size=10, 
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
