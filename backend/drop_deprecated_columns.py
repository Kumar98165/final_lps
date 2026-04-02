import os
import sys
from sqlalchemy import text

# Add the current directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

def drop_columns():
    app = create_app('dev')
    with app.app_context():
        print("[DATABASE] Attempting to drop deprecated JSON columns from master_data...")
        
        try:
            # SQL for dropping columns in PostgreSQL
            # We use text() for raw SQL execution in SQLAlchemy
            db.session.execute(text("ALTER TABLE master_data DROP COLUMN IF EXISTS production_data;"))
            db.session.execute(text("ALTER TABLE master_data DROP COLUMN IF EXISTS material_data;"))
            db.session.commit()
            print("[SUCCESS] Columns 'production_data' and 'material_data' were successfully dropped.")
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Failed to drop columns: {str(e)}")
            
if __name__ == "__main__":
    drop_columns()
