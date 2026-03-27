import pandas as pd
import json

with open("output_keys2.txt", "w") as f:
    excel_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\LPS G CHART DEC'25.xlsx"
    
    # Check "Sheet1" (which usually acts as BOLERO/TATA/etc g-chart) 
    # Or "Sheet2"
    for name in ['Sheet1', 'W601 Assly', 'G-Chart', 'P112']:
        if name in pd.ExcelFile(excel_path).sheet_names:
            df_g = pd.read_excel(excel_path, sheet_name=name, header=4)
            sap_cols = [c for c in df_g.columns if 'SAP' in str(c).upper()]
            if sap_cols:
                f.write(f"\nG-Chart Sheet: {name}\n")
                f.write(f"  SAP column: {sap_cols[0]}\n")
                sample = df_g[sap_cols[0]].dropna().head(10).tolist()
                f.write(f"  Sample SAP numbers: {sample}\n")
