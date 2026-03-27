import os
import pandas as pd
from app_factory import create_app
from models import db, MasterData, CarModel

def import_from_csv(csv_path):
    print(f"Loading CSV Data: {csv_path}")
    df = pd.read_csv(csv_path)
    
    # Normalize column names
    df.columns = [c.strip().replace(' ', '_') for c in df.columns]
    
    app = create_app()
    with app.app_context():
        # Identification headers standardized across system
        id_heads = ["SR NO", "PART NUMBER", "SAP PART NUMBER", "PART DESCRIPTION", "SALEABLE NO", "ASSEMBLY NUMBER"]
        
        df['Model'] = df['Model'].astype(str).str.strip().str.upper()
        models_in_csv = df['Model'].unique()
        print(f"Found {len(models_in_csv)} models in CSV: {models_in_csv}")
        
        for model_name in models_in_csv:
            print(f"> Processing model: {model_name}")
            
            # 1. Ensure CarModel exists (case-insensitive search)
            cm = CarModel.query.filter(CarModel.name.ilike(model_name)).first()
            if not cm:
                print(f"  Creating new CarModel: {model_name}")
                # Ensure code is unique and not too long
                code_base = f"M_{model_name.replace('-', '_')}"[:15].upper()
                code = code_base
                counter = 1
                while CarModel.query.filter_by(model_code=code).first():
                    code = f"{code_base}_{counter}"
                    counter += 1
                
                cm = CarModel(
                    name=model_name, 
                    model_code=code, 
                    type="Car",
                    identification_headers=id_heads,
                    production_headers=["Strokes/Part", "Total Strokes Req", "Per Day Req"],
                    material_headers=["RM Thk mm", "RM Grade", "RM SIZE"]
                )
                db.session.add(cm)
            else:
                # Update name to match normalized case (e.g. Loadking -> LOADKING)
                cm.name = model_name
                # Update headers if missing
                if not cm.identification_headers:
                    cm.identification_headers = id_heads
            
            # 2. Get items for this model
            model_df = df[df['Model'] == model_name]
            
            # We don't want to delete existing items if they were imported from Excel 
            # (Excel has more data like production/material).
            # But the user said "make all vehicle model in my master".
            # If we already have items for this model (e.g. XUV), we should only add new ones or update.
            
            count = 0
            for _, row in model_df.iterrows():
                sap = str(row.get('SAP_Part_Number', '')).strip()
                if not sap or sap.lower() == 'nan':
                    continue
                
                pn = str(row.get('Part_Number', '')).strip()
                desc = str(row.get('Description', '')).strip()
                
                # Check if item exists
                item = MasterData.query.filter_by(sap_part_number=sap).first()
                if not item:
                    item = MasterData(
                        sap_part_number=sap,
                        model=model_name,
                        part_number=pn,
                        description=desc,
                        production_data={},
                        material_data={},
                        is_ad_hoc=False
                    )
                    db.session.add(item)
                    count += 1
                else:
                    # Update basic info if it was missing or different model (though SAP is unique)
                    item.model = model_name
                    if not item.part_number: item.part_number = pn
                    if not item.description: item.description = desc
            
            db.session.commit()
            if count > 0:
                print(f"  Added {count} new items for {model_name}")
            else:
                print(f"  Items for {model_name} already up to date or no new ones found.")

    print("CSV Import complete!")

if __name__ == "__main__":
    csv_file = os.path.join("..", "Master_Data_Vehicles_Final.csv")
    if os.path.exists(csv_file):
        import_from_csv(csv_file)
    else:
        print(f"File not found: {csv_file}")
