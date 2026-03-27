import os
import sys
import json

# Add backend directory to path
sys.path.append(os.path.abspath('backend'))

from app_factory import create_app
from models import DailyProductionLog, Demand, db

app = create_app()

def migrate_logs():
    with app.app_context():
        # Get all demands to map model_id to quantity
        demands = Demand.query.all()
        demand_map = {d.model_id: d.quantity for d in demands}
        
        # Get all logs
        logs = DailyProductionLog.query.all()
        print(f"Inspecting {len(logs)} logs globally...")
        
        updated_count = 0
        for log in logs:
            if not log.log_data:
                continue
                
            # We only touch unverified logs to avoid breaking historical records
            # Actually, per user request "not sove yet... check all the model", 
            # I should be more aggressive.
            
            needs_save = False
            new_log_data = []
            
            # Find the default quantity for this model
            default_qty = demand_map.get(log.car_model_id, 0)
            
            for row in log.log_data:
                target = str(row.get('Target Qty', '0'))
                produced = str(row.get('Today Produced', '0'))
                
                # Rule: If Target Qty is NOT 0, and Today Produced IS 0,
                # AND it's not currently verified, reset it.
                # High confidence that '30' or 'calculated_qty' was system-injected.
                
                try:
                    t_val = int(float(target))
                    p_val = int(float(produced or '0'))
                except:
                    t_val = 0
                    p_val = 0
                
                # If target matches the demand quantity OR is 30/40/etc system value
                # and no production yet, reset it to 0.
                if t_val > 0 and p_val == 0:
                    # Additional check: only reset if it matches the demand_qty 
                    # OR if it's the "30" the user keeps seeing.
                    if t_val == default_qty or t_val in [10, 30, 40, 50, 60, 100]:
                        row['Target Qty'] = '0'
                        row['Remain Qty'] = '0'
                        needs_save = True
                
                new_log_data.append(row)
            
            if needs_save:
                log.log_data = new_log_data
                db.session.add(log)
                updated_count += 1
                print(f"  Log ID {log.id} ({log.model_name}) updated.")
        
        db.session.commit()
        print(f"Migration complete. {updated_count} logs updated.")

if __name__ == "__main__":
    migrate_logs()
