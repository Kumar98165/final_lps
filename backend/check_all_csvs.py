import csv

FILES = [
    r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv",
    r"c:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\Master_Data_Vehicles_Final.csv"
]

def check_all():
    all_unique_keys = set()
    for path in FILES:
        try:
            with open(path, mode='r', encoding='utf-8-sig') as f:
                rows = list(csv.DictReader(f))
                unique = set((str(r.get('Model') or r.get('model') or '').strip().upper(), 
                             str(r.get('SAP_Code') or r.get('sap_part_number') or '').strip().upper()) 
                            for r in rows if (r.get('Model') or r.get('model')) and (r.get('SAP_Code') or r.get('sap_part_number')))
                print(f"File: {path}")
                print(f"  Total Rows: {len(rows)}")
                print(f"  Unique Keys in this file: {len(unique)}")
                all_unique_keys.update(unique)
        except Exception as e:
            print(f"Error reading {path}: {e}")
            
    print(f"\nCOMBINED UNIQUE KEYS: {len(all_unique_keys)}")

if __name__ == "__main__":
    check_all()
