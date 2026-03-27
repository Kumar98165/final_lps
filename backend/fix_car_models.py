from app_factory import create_app
from models import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    r = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'car_models'"))
    cols = [row[0] for row in r]
    print(cols)
    if 'status' not in cols:
        print("MISSING STATUS COLUMN in car_models table!")
        db.session.execute(text("ALTER TABLE car_models ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'"))
        db.session.commit()
        print("Fixed car_models status column")
