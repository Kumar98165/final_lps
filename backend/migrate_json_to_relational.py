import os
import sys
from datetime import datetime

# Add root to path
sys.path.append(os.getcwd())

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models import DailyProductionLog, DEOProductionEntry

def parse_float(val):
    if val is None or val == "": return 0.0
    try:
        return float(str(val).replace(',', '').strip())
    except:
        return 0.0

def migrate():
    app = create_app()
    with app.app_context():
        # 1. Create the new table if it doesn't exist
        print("Ensuring tables are created...")
        db.create_all()
        
        # 2. Fetch all logs
        logs = DailyProductionLog.query.all()
        print(f"Found {len(logs)} logs to migrate.")
        
        total_entries = 0
        for log in logs:
            if not log.log_data or not isinstance(log.log_data, list):
                continue
            
            # Check if already migrated
            if DEOProductionEntry.query.filter_by(log_id=log.id).first():
                # print(f"  Log ID {log.id} already has entries. Skipping.")
                continue
                
            for row in log.log_data:
                entry = DEOProductionEntry(
                    log_id=log.id,
                    sn_no=int(row.get('SN NO', 0)) if str(row.get('SN NO', '')).isdigit() else None,
                    sap_part_number=row.get('SAP PART NUMBER'),
                    part_number=row.get('PART NUMBER'),
                    part_description=row.get('PART DESCRIPTION'),
                    per_day=parse_float(row.get('PER DAY') or row.get('Per Day') or row.get('Target Qty')),
                    sap_stock=parse_float(row.get('SAP Stock')),
                    opening_stock=parse_float(row.get('Opening Stock')),
                    todays_stock=parse_float(row.get('Todays Stock')),
                    coverage_days=parse_float(row.get('Coverage Days')),
                    status=row.get('Production Status') or 'PENDING',
                    row_status=row.get('row_status'),
                    supervisor_reviewed=row.get('supervisor_reviewed', False),
                    rejection_reason=row.get('rejection_reason'),
                    # Metadata for easier querying
                    date=log.date,
                    car_model_id=log.car_model_id
                )
                db.session.add(entry)
                total_entries += 1
            
            # print(f"  Migrated {len(log.log_data)} rows for Log ID {log.id}")
        
        db.session.commit()
        print(f"\nSUCCESS: Migrated {total_entries} entries into the relational table.")

if __name__ == "__main__":
    migrate()
