import pandas as pd
import csv
import os

PATHS = [
    r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv",
    r"c:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\Master_Data_Vehicles_Final.csv",
    r"c:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\RM_Master_Data_Final.xlsx"
]

def clean(v):
    return str(v or '').strip().upper()

def analyze():
    all_keys = set()
    
    for p in PATHS:
        if not os.path.exists(p):
            print(f"NOT FOUND: {p}")
            continue
            
        print(f"Reading: {p}")
        if p.endswith('.csv'):
            with open(p, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                keys = set()
                for r in reader:
                    m = clean(r.get('Model') or r.get('model'))
                    s = clean(r.get('SAP_Code') or r.get('sap_part_number') or r.get('SAP PART NUMBER'))
                    if m and s: keys.add((m, s))
                print(f"  Unique keys: {len(keys)}")
                all_keys.update(keys)
        else:
            df = pd.read_excel(p)
            model_col = next((c for c in df.columns if 'MODEL' in c.upper()), None)
            sap_col = next((c for c in df.columns if 'SAP' in c.upper()), None)
            if model_col and sap_col:
                keys = set((clean(row[model_col]), clean(row[sap_col])) for _, row in df.iterrows() if clean(row[model_col]) and clean(row[sap_col]))
                print(f"  Unique keys: {len(keys)}")
                all_keys.update(keys)
            else:
                print(f"  Could not find columns in {p}")

    print(f"\nGRAND TOTAL UNIQUE KEYS: {len(all_keys)}")

if __name__ == "__main__":
    analyze()
