import os
import sys
import random
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.models import DailyWorkStatus, CarModel, User

def seed_velocity():
    app = create_app('dev')
    with app.app_context():
        # 1. Ensure we have basic data to link to
        model = CarModel.query.first()
        deo = User.query.filter_by(role='DEO').first()
        
        if not model or not deo:
            print("[ERROR] Cannot seed statistics: Missing CarModel or DEO user.")
            return

        print(f"[SEED] Using Model: {model.name}, DEO: {deo.username}")

        # 2. Seed historical data for the last 180 days (6 months)
        count = 0
        current_date = datetime.now().date()
        
        for i in range(180, -1, -1):
            target_date = current_date - timedelta(days=i)
            
            # Check if entry already exists for this date/model to prevent duplicates
            existing = DailyWorkStatus.query.filter_by(date=target_date, car_model_id=model.id).first()
            if not existing:
                # Generate realistic random production figures
                planned = random.randint(100, 150)
                # Actual is usually slightly below or above planned
                actual = int(planned * random.uniform(0.7, 1.1))
                
                new_status = DailyWorkStatus(
                    date=target_date,
                    car_model_id=model.id,
                    deo_id=deo.id,
                    planned_qty=planned,
                    actual_qty=actual,
                    status='VERIFIED',
                    shift='Shift A'
                )
                db.session.add(new_status)
                count += 1

        db.session.commit()
        print(f"[SUCCESS] Seeded {count} daily records for the last 6 months.")

if __name__ == "__main__":
    seed_velocity()
