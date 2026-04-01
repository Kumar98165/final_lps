import os
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app('dev')

with app.app_context():
    try:
        # Use simple SQL to add the column
        db.session.execute(text('ALTER TABLE demands ADD COLUMN IF NOT EXISTS company VARCHAR(100)'))
        db.session.commit()
        print("Migration successful: 'company' column added to 'demands' table.")
    except Exception as e:
        print(f"Migration failed: {e}")
