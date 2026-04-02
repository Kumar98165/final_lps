import os
import sys

# Add the current directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import MasterData, ProductionData, MaterialData
from app.services.db_service import MasterDataDBService

def migrate_data():
    app = create_app('dev')
    with app.app_context():
        print("[MIGRATION] Starting MasterData relational migration...")
        
        # Ensure tables are created
        db.create_all()
        
        service = MasterDataDBService()
        items = MasterData.query.all()
        total = len(items)
        migrated = 0
        skipped = 0
        
        print(f"[MIGRATION] Found {total} records to process.")
        
        for item in items:
            # Check if already migrated
            if item.production_rel and item.material_rel:
                skipped += 1
                continue
            
            updates = {}
            # Use existing JSON columns for migration
            if item.production_data:
                updates['production_data'] = item.production_data
            if item.material_data:
                updates['material_data'] = item.material_data
            
            if updates:
                service.apply_updates(item, updates)
                migrated += 1
            else:
                skipped += 1
                
            if migrated % 10 == 0 and migrated > 0:
                print(f"[MIGRATION] Processed {migrated}/{total}...")
        
        db.session.commit()
        print(f"[SUCCESS] Migration complete!")
        print(f"  - Total: {total}")
        print(f"  - Migrated: {migrated}")
        print(f"  - Skipped (already done or empty): {skipped}")

if __name__ == "__main__":
    migrate_data()
