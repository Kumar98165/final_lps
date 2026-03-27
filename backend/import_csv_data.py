import os
import pandas as pd
from app_factory import create_app
from models import db, MasterData, CarModel

def import_from_csv(csv_path):
    app = create_app()
    with app.app_context():
        df = pd.read_csv(csv_path)
        print(f"Total rows in CSV: {len(df)}")
        
        # 1. Ensure all models exist in CarModel table
        unique_models = df['Model'].dropna().unique()
        for m_name in unique_models:
            m_name = str(m_name).strip()
            if not m_name: continue
            
            cm = CarModel.query.filter_by(name=m_name).first()
            if not cm:
                print(f"Creating model: {m_name}")
                cm = CarModel(
                    name=m_name, 
                    model_code=f"{m_name[:3].upper()}-MD", 
                    type="Car",
                    identification_headers=["SR NO", "PART NUMBER", "SAP PART NUMBER", "PART DESCRIPTION", "SALEABLE NO", "ASSEMBLY NUMBER"]
                )
                db.session.add(cm)
        db.session.commit()

        # 2. Clear old data? The user said "all vichle model in my master", 
        # usually means overwrite or update. Let's update by SAP Number.
        
        count = 0
        new_count = 0
        for _, row in df.iterrows():
            sap = str(row.get('SAP_Part_Number', '')).strip()
            if not sap or sap.lower() == 'nan': continue
            
            model = str(row.get('Model', '')).strip()
            pn = str(row.get('Part_Number', '')).strip()
            desc = str(row.get('Description', '')).strip()
            
            item = MasterData.query.filter_by(model=model, sap_part_number=sap).first()
            if not item:
                item = MasterData(model=model, sap_part_number=sap)
                db.session.add(item)
                new_count += 1
            
            item.model = model
            item.part_number = pn
            item.description = desc
            
            # Preserve existing production/material data if it exists, otherwise init empty
            if not item.production_data:
                item.production_data = {}
            if not item.material_data:
                item.material_data = {}
                
            count += 1
            if count % 100 == 0:
                db.session.commit()
                print(f"Processed {count} rows...")
        
        db.session.commit()
        print(f"Finished! Processed {count} items. Created {new_count} new entries.")

if __name__ == "__main__":
    csv_file = "../Master_Data_Vehicles_Final.csv"
    import_from_csv(csv_file)
