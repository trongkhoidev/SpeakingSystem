
import os
import sys
from sqlalchemy import create_engine, text, inspect

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from backend.app.core.config import settings

def inspect_db():
    try:
        engine = create_engine(settings.DATABASE_URL)
        inspector = inspect(engine)
        
        for table_name in inspector.get_table_names():
            print(f"\nTable: {table_name}")
            for column in inspector.get_columns(table_name):
                print(f"  Column: {column['name']} ({column['type']})")
            for fk in inspector.get_foreign_keys(table_name):
                print(f"  FK: {fk['constrained_columns']} -> {fk['referred_table']}({fk['referred_columns']})")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db()
