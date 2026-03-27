import csv
import logging
from wsgi import app
from models import MasterData, db
from sqlalchemy.exc import IntegrityError

import csv
import logging
import pandas as pd
from wsgi import app
from models import MasterData, db

# Configuration
FILES = [
    {"path": r"c:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\Master_Data_Vehicles_Final.csv", "type": "csv"},
    {"path": r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv", "type": "csv"},
    {"path": r"c:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\RM_Master_Data_Final.xlsx", "type": "excel"}
]
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)

def clean(val):
    if val is None: return ""
    return str(val).strip()

def to_float(val):
    try:
        if not val or str(val).strip().upper() == "NAN": return 0.0
        return float(str(val).replace(',', '').strip())
    except: return 0.0

def update_db():
    unique_parts = {} # (Model, SAP) -> data

    for file_info in FILES:
        path = file_info["path"]
        try:
            if file_info["type"] == "csv":
                with open(path, mode='r', encoding='utf-8-sig') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        m = clean(row.get('Model') or row.get('model')).upper()
                        s = clean(row.get('SAP_Code') or row.get('sap_part_number') or row.get('SAP PART NUMBER')).upper()
                        if not m or not s: continue
                        
                        key = (m, s)
                        data = unique_parts.get(key, {'material_data': {}, 'production_data': {}})
                        
                        # Mapping
                        data['part_number'] = clean(row.get('Part_Number') or data.get('part_number'))
                        data['description'] = clean(row.get('Part_Description') or row.get('Description') or data.get('description'))
                        
                        if row.get('Material_Grade'):
                            data['material_data'].update({
                                "RM Grade": clean(row.get('Material_Grade')),
                                "RM Thk mm": str(to_float(row.get('Thickness_mm'))),
                                "Sheet Width": clean(row.get('Width_mm')),
                                "Sheet Length": clean(row.get('Length_mm')),
                                "No of comp per sheet": str(int(to_float(row.get('Yield_Pcs_Per_Sheet')))),
                                "RM SIZE": clean(row.get('RM_Size_Spec')),
                                "VALIDITY": clean(row.get('Validity'))
                            })
                        if row.get('Qty_Per_Vehicle'):
                            data['production_data'].update({
                                "Usage": to_float(row.get('RM_Consumption_Multiplier')),
                                "Qty per Vehicle": to_float(row.get('Qty_Per_Vehicle'))
                            })
                        unique_parts[key] = data
            else:
                df = pd.read_excel(path)
                m_col = next((c for c in df.columns if 'MODEL' in c.upper()), None)
                s_col = next((c for c in df.columns if 'SAP' in c.upper()), None)
                if not m_col or not s_col: continue

                for _, row in df.iterrows():
                    m = clean(row[m_col]).upper()
                    s = clean(row[s_col]).upper()
                    if not m or not s: continue
                    
                    key = (m, s)
                    data = unique_parts.get(key, {'material_data': {}, 'production_data': {}})
                    
                    data['part_number'] = clean(row.get('PART NUMBER') or data.get('part_number'))
                    data['description'] = clean(row.get('PART DESCRIPTION') or row.get('Description') or data.get('description'))
                    
                    if row.get('RM Grade'):
                        data['material_data'].update({
                            "RM Grade": clean(row.get('RM Grade')),
                            "RM Thk mm": str(to_float(row.get('RM Thk mm'))),
                            "Sheet Width": clean(row.get('Sheet Width')),
                            "Sheet Length": clean(row.get('Sheet Length')),
                            "No of comp per sheet": str(int(to_float(row.get('No of comp per sheet')))),
                            "RM SIZE": clean(row.get('RM SIZE')),
                            "VALIDITY": clean(row.get('VALIDITY') or row.get('Validity'))
                        })
                    unique_parts[key] = data
            logging.info(f"Processed {path}")
        except Exception as e:
            logging.error(f"Error processing {path}: {e}")

    logging.info(f"Total Unique Parts Found: {len(unique_parts)}")

    with app.app_context():
        # WARNING: This deletes existing data for a clean refresh
        logging.info("Clearing existing MasterData...")
        MasterData.query.delete()
        
        for (m, s), data in unique_parts.items():
            new_item = MasterData(
                model=m, sap_part_number=s,
                part_number=data['part_number'],
                description=data['description'],
                material_data=data['material_data'],
                production_data=data['production_data']
            )
            db.session.add(new_item)

        try:
            db.session.commit()
            final_count = MasterData.query.count()
            logging.info(f"SUCCESS: MasterData table refreshed with {final_count} unique parts.")
            print(f"SYNC COMPLETE: DB Count is now {final_count} (Analysis target 662)")
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error committing: {e}")
            print(f"SYNC FAILED: {e}")

if __name__ == "__main__":
    update_db()

if __name__ == "__main__":
    update_db()
