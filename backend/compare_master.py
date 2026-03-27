import csv
from wsgi import app
from models import MasterData, db

CSV_PATH = r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv"

def analyze():
    csv_data = []
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_data.append(row)

    with open("master_data_report.txt", "w", encoding='utf-8') as report:
        def log(msg):
            print(msg)
            report.write(msg + "\n")

        log(f"Total rows in CSV: {len(csv_data)}")

        with app.app_context():
            db_items = MasterData.query.all()
            log(f"Total items in Database: {len(db_items)}")

            # Create a lookup map for DB items: (model, sap_part_number) -> item
            db_map = {}
            for item in db_items:
                # Use model name from the DB (e.g., 'W616') and compare after stripping
                m = str(item.model).strip().upper() if item.model else ""
                s = str(item.sap_part_number).strip().upper() if item.sap_part_number else ""
                key = (m, s)
                db_map[key] = item

            matches = 0
            missing_in_db = []
            mismatched_desc = []
            mismatched_material = []
            
            # Check CSV rows against DB
            for row in csv_data:
                model = row.get('Model', '').strip().upper()
                sap = row.get('SAP_Code', '').strip().upper()
                desc = row.get('Part_Description', '').strip().upper()
                
                # Material fields from CSV
                csv_thickness = row.get('Thickness_mm', '0')
                csv_width = row.get('Width_mm', '0')
                csv_length = row.get('Length_mm', '0')
                csv_yield = row.get('Yield_Pcs_Per_Sheet', '0')

                key = (model, sap)
                if key in db_map:
                    matches += 1
                    db_item = db_map[key]
                    
                    # Description check
                    db_desc = str(db_item.description).strip().upper() if db_item.description else ""
                    if desc and db_desc and desc != db_desc:
                        mismatched_desc.append({
                            "key": key,
                            "csv_desc": desc,
                            "db_desc": db_desc
                        })
                    
                    # Material check
                    db_mat = db_item.material_data or {}
                    db_thickness = str(db_mat.get('thickness', '0')).strip()
                    db_width = str(db_mat.get('width', '0')).strip()
                    db_length = str(db_mat.get('length', '0')).strip()
                    db_yield = str(db_mat.get('yield_pcs_per_sheet', '0')).strip()

                    # Simple float normalization for comparison
                    try:
                        c_t = float(csv_thickness.replace(',', ''))
                        d_t = float(db_thickness.replace(',', ''))
                        c_w = csv_width
                        d_w = db_width
                        c_l = csv_length
                        d_l = db_length
                        c_y = float(csv_yield.replace(',', ''))
                        d_y = float(db_yield.replace(',', ''))

                        if abs(c_t - d_t) > 0.001 or c_w != d_w or c_l != d_l or abs(c_y - d_y) > 0.001:
                            mismatched_material.append({
                                "key": key,
                                "csv": {"t": c_t, "w": c_w, "l": c_l, "y": c_y},
                                "db":  {"t": d_t, "w": d_w, "l": d_l, "y": d_y}
                            })
                    except ValueError:
                        pass # Ignore cases with non-numeric data for now
                else:
                    missing_in_db.append(key)

            log(f"\n--- Statistics ---")
            log(f"Matches (Model + SAP): {matches}")
            log(f"Missing in DB: {len(missing_in_db)}")
            log(f"Description Mismatches: {len(mismatched_desc)}")
            log(f"Material/Yield Mismatches: {len(mismatched_material)}")

            if missing_in_db:
                log("\n--- Missing in DB (First 50) ---")
                for k in missing_in_db[:50]:
                    log(str(k))

            if mismatched_desc:
                log("\n--- Description Mismatches (First 20) ---")
                for m in mismatched_desc[:20]:
                    log(f"Key: {m['key']}\n  CSV: {m['csv_desc']}\n  DB:  {m['db_desc']}")

            if mismatched_material:
                log("\n--- Material/Yield Mismatches (First 20) ---")
                for m in mismatched_material[:20]:
                    log(f"Key: {m['key']}\n  CSV: {m['csv']}\n  DB:  {m['db']}")



if __name__ == "__main__":
    analyze()
