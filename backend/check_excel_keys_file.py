import pandas as pd
import json
import sys

with open("output_keys.txt", "w") as f:
    excel_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\LPS G CHART DEC'25.xlsx"
    xl = pd.ExcelFile(excel_path)
    f.write(f"Sheets: {xl.sheet_names}\n")

    for name in ['RM Stock W601', 'coil material', 'RM']:
        if name in xl.sheet_names:
            f.write(f"\nScanning sheet: {name}\n")
            for h in range(4):
                df = pd.read_excel(excel_path, sheet_name=name, header=h)
                sap_cols = [c for c in df.columns if 'SAP' in str(c).upper()]
                if sap_cols:
                    f.write(f"  Found SAP at header={h}: {sap_cols}\n")
                    # Break out and show the first few SAP Part numbers for relation checking
                    first_sap_col = sap_cols[0]
                    sample = df[first_sap_col].head(5).tolist()
                    f.write(f"  Sample SAP numbers: {sample}\n")
                    
                    df_g = pd.read_excel(excel_path, sheet_name='Sheet4', header=2) # e.g., BOLERO sheet
                    g_saps = [c for c in df_g.columns if 'SAP' in str(c).upper()]
                    if g_saps:
                       g_sample = df_g[g_saps[0]].head(5).tolist()
                       f.write(f"  Sample SAP numbers from G-Chart side: {g_sample}\n")
                    break
            else:
                f.write("  No SAP column found in first 4 rows.\n")
