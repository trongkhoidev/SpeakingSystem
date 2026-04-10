import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

server = os.getenv('DB_SERVER')
database = os.getenv('DB_NAME')
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')
driver = os.getenv('DB_DRIVER', '{ODBC Driver 18 for SQL Server}')

# Ensure driver is in curly braces for pyodbc if not already
if not driver.startswith('{'):
    driver = f'{{{driver}}}'

connection_string = f'DRIVER={driver};SERVER={server};PORT=1433;DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;'

print(f"Attempting to connect to {server}...")
try:
    conn = pyodbc.connect(connection_string)
    print("✅ SUCCESS: Connection established!")
    conn.close()
except Exception as e:
    print(f"❌ FAILED: {str(e)}")
