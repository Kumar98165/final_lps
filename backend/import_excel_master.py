import os
import pandas as pd
from app_factory import create_app
from models import db, MasterData, CarModel

def import_from_excel(excel_path):
    app = create_app()
    with app.app_context():
        # Load the G-Chart sheet
        df = pd.read_excel(excel_path, sheet_name='G-Chart', header=1)
        
        # Clean columns: remove unnamed and strip
        df.columns = [str(c).strip() for c in df.columns]
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        
        print(f"Total rows in Excel: {len(df)}")
        
        # Identification columns
        id_cols = ['Sr No', 'Model', 'Assembly number', 'Part Number', 'SAP Part Number', 'Part Description']
        
        # Production columns (dates and totals)
        prod_cols = [c for c in df.columns if c not in id_cols]
        
        # Ensure all models exist
        unique_models = df['Model'].dropna().unique()
        for m_name in unique_models:
            m_name = str(m_name).strip()
            if not m_name: continue
            
            cm = CarModel.query.filter_by(name=m_name).first()
            if not cm:
                print(f"Creating model: {m_name}")
                # Generate a more unique model code
                import hashlib
                m_hash = hashlib.md5(m_name.encode()).hexdigest()[:4].upper()
                cm = CarModel(
                    name=m_name, 
                    model_code=f"{m_name[:3].upper()}-{m_hash}", 
                    type="Car"
                )
                db.session.add(cm)
            
            # Standardize headers for the model
            cm.identification_headers = ["SR NO", "ASSEMBLY NUMBER", "PART NUMBER", "SAP PART NUMBER", "PART DESCRIPTION"]
            cm.production_headers = ["TOTAL SCHEDULE QTY", "PER DAY"] # Minimal set
            cm.material_headers = []
            
        db.session.commit()

        count = 0
        for _, row in df.iterrows():
            sap = str(row.get('SAP Part Number', '')).strip()
            if not sap or sap.lower() == 'nan' or sap == "":
                # Try with trailing space as seen in labels earlier
                sap = str(row.get('SAP Part Number ', '')).strip()
                if not sap or sap.lower() == 'nan' or sap == "":
                    continue
            
            model = str(row.get('Model', '')).strip()
            pn = str(row.get('Part Number', '')).strip()
            desc = str(row.get('Part Description', '')).strip()
            assy = str(row.get('Assembly number', '')).strip()
            
            item = MasterData.query.filter_by(model=model, sap_part_number=sap).first()
            if not item:
                item = MasterData(model=model, sap_part_number=sap)
                db.session.add(item)
            
            item.part_number = pn
            item.description = desc
            item.assembly_number = assy
            
            # Save ALL other columns as production data (especially dates)
            p_data = {}
            for col in prod_cols:
                val = row.get(col)
                if pd.isna(val):
                    p_data[col] = ""
                else:
                    p_data[col] = str(val)
            
            item.production_data = p_data
            
            count += 1
            if count % 100 == 0:
                db.session.commit()
                print(f"Processed {count} rows...")
        
        db.session.commit()
        print(f"Finished! Processed {count} items from Excel.")

if __name__ == "__main__":
    excel_file = "../LPS G CHART DEC'25.xlsx"
    if os.path.exists(excel_file):
        import_from_excel(excel_file)
    else:
        print(f"File not found: {excel_file}")
