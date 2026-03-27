import csv

CSV_PATH = r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv"

def analyze():
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
    print(f"Total rows in CSV: {len(rows)}")
    
    unique_keys = set()
    skipped_rows = []
    for i, row in enumerate(rows):
        model = str(row.get('Model') or '').strip().upper()
        sap = str(row.get('SAP_Code') or '').strip().upper()
        if not model or not sap:
            skipped_rows.append(i + 1)
            continue
        unique_keys.add((model, sap))
        
    print(f"Unique (Model, SAP) pairs: {len(unique_keys)}")
    print(f"Skipped rows (missing Model/SAP): {len(skipped_rows)}")
    if skipped_rows:
        print(f"First 5 skipped row numbers: {skipped_rows[:5]}")

if __name__ == "__main__":
    analyze()
