import csv

CSV_PATH = r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv"

def check():
    with open(CSV_PATH, mode='r', encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    
    print(f"Total rows: {len(rows)}")
    
    # Method 1 (from analyze_csv.py)
    keys1 = set()
    for row in rows:
        m = str(row.get('Model') or '').strip().upper()
        s = str(row.get('SAP_Code') or '').strip().upper()
        keys1.add((m, s))
    print(f"Keys 1 (loop): {len(keys1)}")
    
    # Method 2 (from final_stats_check.py)
    keys2 = set((str(r.get('Model') or '').strip().upper(), str(r.get('SAP_Code') or '').strip().upper()) for r in rows)
    print(f"Keys 2 (comprehension): {len(keys2)}")
    
    # Check for empty keys
    empty = sum(1 for r in rows if not r.get('Model') or not r.get('SAP_Code'))
    print(f"Rows with missing Model/SAP: {empty}")

if __name__ == "__main__":
    check()
