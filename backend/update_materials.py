import os
import sys
import pandas as pd
from app_factory import create_app
from models import db, MasterData, CarModel

def clean_val(val):
    if pd.isna(val) or str(val).strip().lower() in ['nan', 'none', '']:
        return ""
    try:
        if float(val) == int(val):
            return str(int(val))
        return str(val)
    except:
        return str(val).strip()

def clean_header(h):
    import re
    s = str(h).replace("\n", " ").replace("\t", " ").strip()
    return re.sub(r'\s+', ' ', s)

def update_material_data(file_path):
    print(f"Loading Material Data: {file_path}")
    df = pd.read_excel(file_path)
    df.columns = [clean_header(c) for c in df.columns]
    
    app = create_app()
    with app.app_context():
        # Identify SAP and Model columns
        sap_col = None
        model_col = None
        for c in df.columns:
            cup = str(c).upper()
            if "SAP" in cup:
                sap_col = c
            if "MODEL" in cup:
                model_col = c
        
        if not sap_col:
            print("Error: Could not find SAP Part Number column in excel.")
            return
            
        print(f"Using SAP col: '{sap_col}' and Model col: '{model_col}'")
        
        # Decide which columns are material headers
        id_heads = ["SR NO", "PART NUMBER", "SAP PART NUMBER", "PART DESCRIPTION", "SALEABLE NO", "ASSEMBLY NUMBER"]
        unwanted = id_heads + [
            "SR. NO.", "S.NO", "SL NO", "NO.", "NO", "S. NO", "SERIAL", "SR NO.",
            "PART NUMBER", "PART NO", "DRG NO", "PART DESCRIPTION", "DESCRIPTION", "DESC",
            "MODEL", "CAR MODEL", "MODEL NAME", "VEHICLE", "ID", "SL. NO.", "PARTNUMBER",
            "TOTAL SCH", "SCH", "TOTAL", "TOTAL SCHEDULE"
        ]
        
        def get_heads(cols):
            # remove duplicates while preserving order
            heads = []
            for c in cols:
                c_clean = str(c).strip()
                c_up = c_clean.upper()
                if c_up not in [u.upper() for u in unwanted] and c_up != str(sap_col).upper():
                    if c_clean not in heads:
                        heads.append(c_clean)
            return heads

        mat_heads = get_heads(df.columns)
        print(f"Identified material headers: {mat_heads}")
        
        df[sap_col] = df[sap_col].astype(str).str.strip().replace({'nan': '', 'None': '', 'NaN': '', '0.0': '', '0': ''})
        
        # Update CarModel Material Headers to match the new file
        models = CarModel.query.all()
        for m in models:
            m.material_headers = mat_heads
        
        updated_count = 0
        not_found_count = 0
        
        for _, row in df.iterrows():
            sap = str(row[sap_col]).strip()
            if not sap or sap.lower() == 'nan':
                continue
            
            row_model = None
            if model_col:
                row_model = str(row[model_col]).strip()
            
            # Find the record in the DB
            query = MasterData.query.filter_by(sap_part_number=sap)
            if row_model and row_model.lower() != 'nan' and row_model != "":
                # Search by matching model as well (using ilike for case insensitivity)
                query = query.filter(MasterData.model.ilike(row_model))
                
            item = query.first()
            
            if item:
                m_data = {}
                for h in mat_heads:
                    if h in row.index:
                        m_data[h] = clean_val(row[h])
                
                # We do NOT touch production_data or other fields. We ONLY update material_data.
                item.material_data = {str(k): str(v) for k, v in m_data.items()}
                updated_count += 1
            else:
                not_found_count += 1
                
        db.session.commit()
        print(f"Updated {updated_count} records in MasterData based on matching SAP and Model.")
        print(f"{not_found_count} records from excel were not found in the DB and were skipped (no deletion occurred).")

if __name__ == "__main__":
    update_material_data(r"../RM_Master_Data_Final.xlsx")
