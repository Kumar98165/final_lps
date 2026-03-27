import pandas as pd
from app_factory import create_app
from models import db, MasterData

def update_rm_sizes():
    print("Reading Excel file to find SAP numbers with 1.2X1250X2500 criteria...")
    try:
        # Read Excel using only necessary columns
        df = pd.read_excel(r'C:\Users\User\Desktop\new_lps_raj\RM_Master_Data_Final.xlsx', 
                           usecols=['SAP PART NUMBER', 'RM Thk mm', 'Sheet Width', 'Sheet Length'])
        
        # Filter for 1.2, 1250, 2500
        matches = df[
            (df['RM Thk mm'].astype(str).str.contains('1.2')) & 
            (df['Sheet Width'].astype(str).str.contains('1250')) & 
            (df['Sheet Length'].astype(str).str.contains('2500'))
        ]
        
        target_saps = matches['SAP PART NUMBER'].astype(str).str.strip().unique().tolist()
        print(f"Found {len(target_saps)} unique SAP numbers in Excel matching criteria.")
        
        if not target_saps:
            print("No matching records found in Excel.")
            return

        app = create_app()
        with app.app_context():
            updated_count = 0
            for sap in target_saps:
                records = MasterData.query.filter_by(sap_part_number=sap).all()
                for record in records:
                    mat = record.material_data or {}
                    # Update fields based on the relationship
                    mat['RM Thk mm'] = '1.2'
                    mat['Sheet Width'] = '1250'
                    mat['Sheet Length'] = '2500'
                    mat['RM SIZE'] = '1.2X1250X2500'
                    
                    record.material_data = mat
                    db.session.add(record)
                    updated_count += 1
            
            db.session.commit()
            print(f"Successfully updated {updated_count} records in MasterData database.")
            
    except Exception as e:
        print(f"Error during update: {e}")

if __name__ == "__main__":
    update_rm_sizes()
