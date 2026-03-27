from app_factory import create_app
from models import db
from sqlalchemy import text
import traceback

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE daily_production_logs ADD COLUMN IF NOT EXISTS car_model_id INTEGER"))
        db.session.execute(text("ALTER TABLE daily_production_logs ADD COLUMN IF NOT EXISTS demand_id INTEGER"))
        db.session.execute(text("ALTER TABLE daily_production_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'"))
        db.session.execute(text("ALTER TABLE daily_production_logs ADD COLUMN IF NOT EXISTS supervisor_comment TEXT"))
        db.session.execute(text("ALTER TABLE daily_production_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))

        db.session.execute(text("ALTER TABLE daily_work_status ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'"))
        db.session.execute(text("ALTER TABLE daily_work_status ADD COLUMN IF NOT EXISTS supervisor_id INTEGER"))
        db.session.execute(text("ALTER TABLE daily_work_status ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP"))

        db.session.execute(text("ALTER TABLE demands ADD COLUMN IF NOT EXISTS line VARCHAR(50)"))
        db.session.execute(text("ALTER TABLE demands ADD COLUMN IF NOT EXISTS manager VARCHAR(100)"))
        db.session.execute(text("ALTER TABLE demands ADD COLUMN IF NOT EXISTS customer VARCHAR(100)"))
        db.session.execute(text("ALTER TABLE demands ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        
        db.session.commit()
        print("Success repairing schema")
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))
