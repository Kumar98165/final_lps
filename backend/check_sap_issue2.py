import pandas as pd
import json

with open("output_sap_check2.txt", "w") as f:
    excel_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\LPS G CHART DEC'25.xlsx"
    sap_to_find = 'PMAM0101EAF02880-I'
    part_to_find = 'PMAM0102AAP2410N-V'
    
    # 1. Search Sheet4 (BOLERO)
    df_prod = pd.read_excel(excel_path, sheet_name='Sheet4', header=2)
    sap_col_prod = [c for c in df_prod.columns if 'SAP' in str(c).upper()][0]
    
    # strip spaces
    df_prod['CLEAN_SAP'] = df_prod[sap_col_prod].astype(str).str.strip()
    
    matches1 = df_prod[df_prod['CLEAN_SAP'] == sap_to_find]
    matches2 = df_prod[df_prod['CLEAN_SAP'] == part_to_find]
    
    f.write(f"Matches in BOLERO sheet for RM SAP {sap_to_find}:\n")
    if matches1.empty:
         f.write("  NO MATCHES FOUND.\n")
    else:
         for _, row in matches1.iterrows():
             f.write(str(row[[sap_col_prod]].to_dict()) + "\n")
             
    f.write(f"\nMatches in BOLERO sheet for Finish Part {part_to_find}:\n")
    if matches2.empty:
         f.write("  NO MATCHES FOUND.\n")
    else:
         for _, row in matches2.iterrows():
             f.write(str(row[[sap_col_prod]].to_dict()) + "\n")
