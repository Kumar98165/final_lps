import os
import sys
from datetime import date

# Add current directory to path
sys.path.append(os.getcwd())

# Create app and context
from backend.app import create_app
from backend.app.models import db, DailyProductionLog

# Make sure we use the right app path (backend/app)
# Actually, the check_db.py uses backend.app.create_app which works
app = create_app()

with app.app_context():
    today = date.today()
    logs = DailyProductionLog.query.filter_by(date=today).all()
    
    print(f"--- Today's Logs ({today}) ---")
    if not logs:
        print("No logs found for today.")
    
    for log in logs:
        print(f"\nLog ID: {log.id}, Model: {log.model_name}, Status: {log.status}")
        log_data = log.log_data if isinstance(log.log_data, list) else []
        print(f"Total Rows in log_data: {len(log_data)}")
        
        # Check first 5 rows for sample data
        for i, row in enumerate(log_data[:10]):
            cols = ["SAP Stock", "Opening Stock", "Todays Stock", "Production Status"]
            found_cols = {c: row.get(c, "MISSING") for c in cols}
            print(f" Row {i}: {row.get('PART NUMBER', 'N/A')} - {found_cols}")
