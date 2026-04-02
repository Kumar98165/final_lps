import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import MasterData

def verify():
    app = create_app('dev')
    with app.app_context():
        # Find a record that has relational data
        item = MasterData.query.filter(MasterData.production_rel != None).first()
        if not item:
            print("[ERROR] No migrated records found for verification.")
            return
            
        print(f"[VERIFY] Checking Record: {item.sap_part_number}")
        d = item.to_dict()
        
        print("\n[PRODUCTION DATA]")
        print(d.get('production_data'))
        
        print("\n[MATERIAL DATA]")
        print(d.get('material_data'))
        
        if d.get('production_data') and d.get('material_data'):
            print("\n[SUCCESS] Relational data correctly merged into to_dict format!")
        else:
            print("\n[FAIL] Data missing in to_dict output.")

if __name__ == "__main__":
    verify()
