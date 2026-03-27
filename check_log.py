import os
import sys
import json

# Add backend directory to path
sys.path.append(os.path.abspath('backend'))

from app_factory import create_app
from models import DailyProductionLog, Demand, db

app = create_app()

with app.app_context():
    # 1. Find the demand for DEM-011
    demand = Demand.query.filter(Demand.formatted_id.ilike('%DEM-011%')).first()
    if not demand:
        print("Demand DEM-011 not found.")
        # Try finding logs by model name directly if demand search fails
        logs = DailyProductionLog.query.filter(DailyProductionLog.model_name.ilike('%P112%')).all()
    else:
        print(f"Found Demand: {demand.formatted_id}, Model ID: {demand.model_id}")
        # 2. Find logs for this car model
        logs = DailyProductionLog.query.filter_by(car_model_id=demand.model_id).all()

    print(f"Found {len(logs)} logs to inspect.")
    
    for log in logs:
        print(f"Log ID: {log.id}, Date: {log.date}, Model: {log.model_name}, Status: {log.status}")
        if log.log_data:
            # Check for legacy '30' values
            needs_reset = False
            for row in log.log_data:
                # Be thorough with types
                t_qty = row.get('Target Qty')
                if t_qty == '30' or t_qty == 30:
                    needs_reset = True
                    break
            
            if needs_reset:
                print(f"  Legacy '30' values detected. Resetting to '0'...")
                new_data = []
                for row in log.log_data:
                    t_qty = row.get('Target Qty')
                    if t_qty == '30' or t_qty == 30:
                        row['Target Qty'] = '0'
                        # Also reset Remain Qty to match the new Target Qty
                        # unless they have actually produced something
                        produced = int(row.get('Today Produced') or 0)
                        row['Remain Qty'] = str(max(0, 0 - produced))
                    new_data.append(row)
                log.log_data = new_data
                db.session.add(log) # Explicitly mark for update
                print(f"  Successfully queued Log ID {log.id} for reset.")
            else:
                print("  No legacy '30' values found in this log.")
        else:
            print("  No log_data found.")
    
    db.session.commit()
    print("Database sync complete.")
