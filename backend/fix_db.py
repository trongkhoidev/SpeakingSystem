import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_db():
    print(f"Connecting to database: {settings.DB_SERVER}/{settings.DB_NAME}")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking for missing columns in guest_trials table...")
        
        # Add user_agent
        try:
            conn.execute(text("ALTER TABLE guest_trials ADD user_agent NVARCHAR(500) NULL"))
            conn.commit()
            print("Added user_agent column.")
        except Exception as e:
            if "already" in str(e).lower() or "2705" in str(e): # SQL Server error for duplicate column
                print("user_agent column already exists.")
            else:
                print(f"Error adding user_agent: {e}")

        # Add last_ip
        try:
            conn.execute(text("ALTER TABLE guest_trials ADD last_ip NVARCHAR(50) NULL"))
            conn.commit()
            print("Added last_ip column.")
        except Exception as e:
            if "already" in str(e).lower() or "2705" in str(e):
                print("last_ip column already exists.")
            else:
                print(f"Error adding last_ip: {e}")

        # Add converted_user_id
        try:
            conn.execute(text("ALTER TABLE guest_trials ADD converted_user_id VARCHAR(255) NULL"))
            conn.commit()
            print("Added converted_user_id column.")
        except Exception as e:
            if "already" in str(e).lower() or "2705" in str(e):
                print("converted_user_id column already exists.")
            else:
                print(f"Error adding converted_user_id: {e}")

        print("Database fix completed.")

if __name__ == "__main__":
    # Add project root to path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    fix_db()
