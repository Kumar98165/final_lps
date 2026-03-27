import csv

CSV_PATH = r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv"

def count_unique():
    unique_pairs = set()
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            m = str(row.get('Model', '')).strip().upper()
            s = str(row.get('SAP_Code', '')).strip().upper()
            if m and s:
                unique_pairs.add((m, s))
    
    print(f"Total unique (Model, SAP) pairs in CSV: {len(unique_pairs)}")

if __name__ == "__main__":
    count_unique()
