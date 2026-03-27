import pandas as pd
import json
import os

excel_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\LPS G CHART DEC'25.xlsx"
sap_to_find = 'PMAM0101EAF02880-I'
part_to_find = 'PMAM0102AAP2410N-V'

xl = pd.ExcelFile(excel_path)
results = []

for sheet_name in xl.sheet_names:
    print(f"Checking sheet: {sheet_name}")
    # Search in first 10 rows for headers to find SAP part
    found_in_sheet = False
    for h in range(10):
        try:
            df = pd.read_excel(excel_path, sheet_name=sheet_name, header=h)
            sap_cols = [c for c in df.columns if 'SAP' in str(c).upper()]
            pn_cols = [c for c in df.columns if 'PART' in str(c).upper() and ('NUMBER' in str(c).upper() or 'NO' in str(c).upper())]
            
            # Check for SAP match
            for col in sap_cols:
                mask = df[col].astype(str).str.strip() == sap_to_find
                if mask.any():
                    match_data = df[mask].iloc[0].to_dict()
                    results.append({
                        "sheet": sheet_name,
                        "header_row": h,
                        "column": col,
                        "match_type": "SAP_EXACT",
                        "data": {str(k): str(v) for k, v in match_data.items() if not pd.isna(v)}
                    })
                    found_in_sheet = True
                
            # Check for Part Number match
            for col in pn_cols:
                mask = df[col].astype(str).str.strip() == part_to_find
                if mask.any():
                    match_data = df[mask].iloc[0].to_dict()
                    results.append({
                        "sheet": sheet_name,
                        "header_row": h,
                        "column": col,
                        "match_type": "PART_PN_EXACT",
                        "data": {str(k): str(v) for k, v in match_data.items() if not pd.isna(v)}
                    })
                    found_in_sheet = True
                    
            if found_in_sheet:
                 break
        except Exception as e:
            continue

with open("excel_investigation.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"Investigation complete. Found {len(results)} matches.")
