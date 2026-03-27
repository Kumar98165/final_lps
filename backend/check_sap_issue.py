import pandas as pd
import json

with open("output_sap_check.txt", "w") as f:
    excel_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\LPS G CHART DEC'25.xlsx"
    sap_to_find = 'PMAM0101EAF02880-I'
    
    # 1. Search RM sheet
    df_rm = pd.read_excel(excel_path, sheet_name='RM', header=0)
    sap_col_rm = [c for c in df_rm.columns if 'SAP' in str(c).upper()][0]
    
    # strip spaces
    df_rm['CLEAN_SAP'] = df_rm[sap_col_rm].astype(str).str.strip()
    
    matches = df_rm[df_rm['CLEAN_SAP'] == sap_to_find]
    
    f.write(f"Matches in RM sheet for {sap_to_find}:\n")
    if matches.empty:
         f.write("  NO MATCHES FOUND IN RM SHEET.\n")
         # try partial matching
         partials = df_rm[df_rm['CLEAN_SAP'].str.contains(sap_to_find.replace('-I',''), na=False)]
         f.write(f"  Partial matches:\n{partials[['CLEAN_SAP']].head()}\n")
    else:
         for _, row in matches.iterrows():
             f.write(str(row.to_dict()) + "\n")

    # 2. Check Database
    from sqlalchemy import create_engine
    engine = create_engine(r"sqlite:///C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\backend\instance\lps_system.db")
    df_db = pd.read_sql(f"SELECT * FROM master_data WHERE sap_part_number = '{sap_to_find}'", engine)
    f.write(f"\nMatches in DB for {sap_to_find}:\n")
    if df_db.empty:
        f.write("  None found in DB.\n")
    else:
        for _, row in df_db.iterrows():
            f.write(str(row.to_dict()) + "\n")
