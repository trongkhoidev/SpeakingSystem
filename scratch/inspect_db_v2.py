
import os
import urllib.parse
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# Load .env from backend
load_dotenv('backend/.env')

def inspect_db():
    server = os.getenv('DB_SERVER')
    database = os.getenv('DB_NAME')
    username = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    driver = os.getenv('DB_DRIVER', 'ODBC Driver 18 for SQL Server')
    
    if not server:
        print("Error: DB_SERVER not found in .env")
        return

    encoded_password = urllib.parse.quote_plus(password)
    params = f"driver={driver.replace(' ', '+')}"
    if "18" in driver:
        params += "&TrustServerCertificate=yes"
    
    db_url = f"mssql+pyodbc://{username}:{encoded_password}@{server}/{database}?{params}"
    
    try:
        engine = create_engine(db_url)
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
