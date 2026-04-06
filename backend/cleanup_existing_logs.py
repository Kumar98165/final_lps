import os
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models import DailyProductionLog
from sqlalchemy.orm.attributes import flag_modified

# WHITELIST: Only these fields should be kept in the log_data
CLEAN_LOG_FIELDS = [
    "id", "SN NO", "SAP PART NUMBER", "PART NUMBER", "PART DESCRIPTION",
    "PER DAY", "SAP Stock", "Opening Stock", "Todays Stock", 
    "Today Produced", "Coverage Days", "Production Status",
    "row_status", "supervisor_reviewed", "rejection_reason", "deo_reply"
]

def filter_row(row):
    """Filters a single dictionary row to only include whitelisted keys."""
    if not isinstance(row, dict): return row
    return {k: v for k, v in row.items() if k in CLEAN_LOG_FIELDS}

def cleanup_logs():
    app = create_app()
    with app.app_context():
        print("Starting Database Cleanup of Daily Production Logs...")
        logs = DailyProductionLog.query.all()
        print(f"Found {len(logs)} logs to process.")
        
        count = 0
        for log in logs:
            if not log.log_data or not isinstance(log.log_data, list):
                continue
            
            original_len = len(str(log.log_data))
            new_log_data = [filter_row(row) for row in log.log_data]
            
            # Update and flag as modified for SQLAlchemy
            log.log_data = new_log_data
            flag_modified(log, "log_data")
            
            new_len = len(str(new_log_data))
            reduction = original_len - new_len
            if reduction > 0:
                count += 1
                # print(f"  Processed Log ID {log.id}: Reduced size by {reduction} chars")

        db.session.commit()
        print(f"\nSUCCESS: Cleaned up {count} logs. Unwanted metadata removed.")
        print("The database is now optimized and clean.")

if __name__ == "__main__":
    cleanup_logs()
