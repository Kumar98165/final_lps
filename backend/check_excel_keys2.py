import pandas as pd
import json

excel_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\LPS G CHART DEC'25.xlsx"
xl = pd.ExcelFile(excel_path)
print("Sheets:", xl.sheet_names)

# Look for SAP PART NO in RM Stock W601 and coil material
for name in ['RM Stock W601', 'coil material', 'RM']:
    if name in xl.sheet_names:
        print(f"\nScanning sheet: {name}")
        for h in range(4):
            df = pd.read_excel(excel_path, sheet_name=name, header=h)
            sap_cols = [c for c in df.columns if 'SAP' in str(c).upper()]
            if sap_cols:
                print(f"  Found SAP at header={h}: {sap_cols}")
                break
        else:
            print("  No SAP column found in first 4 rows.")
