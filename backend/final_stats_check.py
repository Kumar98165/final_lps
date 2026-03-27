import csv
from wsgi import app
from models import MasterData, db

CSV_PATH = r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv"

def sync():
    with open(CSV_PATH, mode='r', encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    
    unique_csv_keys = set((str(r.get('Model') or '').strip().upper(), str(r.get('SAP_Code') or '').strip().upper()) for r in rows)
    print(f"CSV Total Rows: {len(rows)}")
    print(f"CSV Unique Keys: {len(unique_csv_keys)}")

    with app.app_context():
        db_items = MasterData.query.all()
        db_map = {(i.model.upper(), i.sap_part_number.upper()): i for i in db_items}
        print(f"Initial DB Count: {len(db_items)}")
        print(f"Initial DB Map Size: {len(db_map)}")
        
        new, updated, skipped = 0, 0, 0
        for r in rows:
            m, s = str(r.get('Model') or '').strip().upper(), str(r.get('SAP_Code') or '').strip().upper()
            if not m or not s:
                skipped += 1
                continue
            
            if (m, s) in db_map:
                updated += 1
            else:
                new += 1
                # Add to map so we don't count it as 'new' again in the same loop if CSV has dups
                db_map[(m, s)] = "PLACEHOLDER"
        
        print(f"Sync Stats -> NEW:{new} | UPD:{updated} | SKIP:{skipped}")
        # Note: We didn't actually commit here, just checking stats

if __name__ == "__main__":
    sync()
