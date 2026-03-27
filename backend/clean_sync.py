import csv
from wsgi import app
from models import MasterData, db

CSV_PATH = r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv"

def clean(val):
    if val is None: return ""
    return str(val).strip()

def to_float(val):
    try:
        if not val or str(val).strip().upper() == "NAN": return 0.0
        return float(str(val).replace(',', '').strip())
    except: return 0.0

def sync():
    with open(CSV_PATH, mode='r', encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    
    with app.app_context():
        db_items = MasterData.query.all()
        db_map = {(i.model.upper(), i.sap_part_number.upper()): i for i in db_items}
        
        new, updated, skipped = 0, 0, 0
        for r in rows:
            m, s = clean(r.get('Model')).upper(), clean(r.get('SAP_Code')).upper()
            if not m or not s:
                skipped += 1
                continue
            
            mat = {
                "RM Grade": clean(r.get('Material_Grade')),
                "RM Thk mm": str(to_float(r.get('Thickness_mm'))),
                "Sheet Width": clean(r.get('Width_mm')),
                "Sheet Length": clean(r.get('Length_mm')),
                "No of comp per sheet": str(int(to_float(r.get('Yield_Pcs_Per_Sheet')))),
                "RM SIZE": clean(r.get('RM_Size_Spec')),
                "VALIDITY": clean(r.get('Validity'))
            }
            prod = {
                "Usage": to_float(r.get('RM_Consumption_Multiplier')),
                "Qty per Vehicle": to_float(r.get('Qty_Per_Vehicle'))
            }
            
            if (m, s) in db_map:
                item = db_map[(m, s)]
                item.part_number = clean(r.get('Part_Number'))
                item.description = clean(r.get('Part_Description'))
                m_data = item.material_data or {}
                m_data.update(mat)
                item.material_data = m_data
                p_data = item.production_data or {}
                p_data.update(prod)
                item.production_data = p_data
                updated += 1
            else:
                new_item = MasterData(
                    model=m, sap_part_number=s,
                    part_number=clean(r.get('Part_Number')),
                    description=clean(r.get('Part_Description')),
                    material_data=mat, production_data=prod
                )
                db.session.add(new_item)
                db_map[(m, s)] = new_item
                new += 1
        
        db.session.commit()
        print(f"CSV:{len(rows)} | NEW:{new} | UPD:{updated} | SKIP:{skipped} | TOTAL:{MasterData.query.count()}")

if __name__ == "__main__":
    sync()
