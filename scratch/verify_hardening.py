import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.models.sqlalchemy_models import Base, NVARCHAR_MAX
from sqlalchemy.dialects.mssql import NVARCHAR

def check_models():
    print("Verifying Azure SQL Hardening (NVARCHAR_MAX)...")
    for table_name, table in Base.metadata.tables.items():
        print(f"\nTable: {table_name}")
        for column in table.columns:
            # Check if it's a string/text type that should be NVARCHAR_MAX
            if isinstance(column.type, NVARCHAR) and column.type.length is None:
                print(f"  [OK] {column.name}: NVARCHAR(MAX)")
            elif column.name in ['description', 'title', 'student_transcript', 'azure_result', 'llm_result', 'word_details', 'question_text', 'model_answer', 'cue_card_json']:
                if isinstance(column.type, NVARCHAR) and column.type.length is not None:
                    print(f"  [FAIL] {column.name}: NVARCHAR({column.type.length}) - Expected MAX")
                else:
                    print(f"  [INFO] {column.name}: {column.type}")

if __name__ == "__main__":
    check_models()
