from app_factory import create_app
from models import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    db.session.execute(text("ALTER TABLE car_models ADD COLUMN IF NOT EXISTS deo_accepted BOOLEAN DEFAULT FALSE"))
    db.session.execute(text("ALTER TABLE car_models ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'"))
    db.session.commit()
    print("Columns added")
