import sys
import os
from .core.database import engine, Base
# Import all models here so they are registered with Base.metadata
from .models.sqlalchemy_models import User, Topic, Question, Answer

def init_db():
    print("Initializing database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        # Try to provide more context for Azure SQL errors
        if "ODBC Driver" in str(e):
            print("Hint: Check if the ODBC Driver is installed and the connection string is correct.")

if __name__ == "__main__":
    init_db()
