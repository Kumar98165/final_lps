import os
import sys
import json
from sqlalchemy import create_engine, text

# Whitelist of fields to keep in log_data
CLEAN_LOG_FIELDS = [
    "id", "SN NO", "SAP PART NUMBER", "PART NUMBER", "PART DESCRIPTION",
    "PER DAY", "SAP Stock", "Opening Stock", "Todays Stock", 
    "Today Produced", "Coverage Days", "Production Status",
    "row_status", "supervisor_reviewed", "rejection_reason", "deo_reply"
]

def filter_row(row):
    if not isinstance(row, dict): return row
    return {k: v for k, v in row.items() if k in CLEAN_LOG_FIELDS}

# Database credentials from .env
DB_USER = "postgres"
DB_PASSWORD = "98165mkm"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "lps_raj"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def cleanup():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Connecting to PostgreSQL...")
        result = conn.execute(text("SELECT id, log_data FROM daily_production_logs"))
        rows = result.fetchall()
        print(f"Cleaning {len(rows)} entries in daily_production_logs...")
        
        count = 0
        for log_id, log_data in rows:
            if not log_data or not isinstance(log_data, list):
                continue
            
            new_log_data = [filter_row(row) for row in log_data]
            
            # Execute raw SQL update
            conn.execute(
                text("UPDATE daily_production_logs SET log_data = :log_data WHERE id = :id"),
                {"log_data": json.dumps(new_log_data), "id": log_id}
            )
            count += 1
        
        conn.commit()
        print(f"SUCCESS: {count} logs have been perfected. Unwanted metadata removed.")

if __name__ == "__main__":
    try:
        cleanup()
    except Exception as e:
        print(f"ERROR: {e}")
