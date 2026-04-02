import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import MasterData, ProductionData, MaterialData

def debug():
    app = create_app('dev')
    with app.app_context():
        # Check first 5 items
        items = MasterData.query.limit(5).all()
        for i, item in enumerate(items):
            print(f"Item {i}: {item.sap_part_number}")
            print(f"  - production_rel: {item.production_rel}")
            print(f"  - material_rel: {item.material_rel}")
            if item.production_rel:
                print(f"    - prod_data_id: {item.production_rel.id}")
            if item.material_rel:
                print(f"    - mat_data_id: {item.material_rel.id}")
        
        # Count relational records
        prod_count = ProductionData.query.count()
        mat_count = MaterialData.query.count()
        print(f"\n[SUMMARY] ProductionData Count: {prod_count}")
        print(f"[SUMMARY] MaterialData Count: {mat_count}")

if __name__ == "__main__":
    debug()
